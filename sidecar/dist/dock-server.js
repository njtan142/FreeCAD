"use strict";
/**
 * Dock Widget WebSocket Server
 *
 * Listens for incoming messages from the FreeCAD LLM dock widget.
 * Forwards chat messages to the configured agent backend and returns responses.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockServer = void 0;
const ws_1 = __importStar(require("ws"));
const claude_agent_sdk_1 = require("@anthropic-ai/claude-agent-sdk");
const agent_tools_1 = require("./agent-tools");
const session_manager_1 = require("./session-manager");
const context_injector_1 = require("./context-injector");
const backend_registry_1 = require("./backend-registry");
class DockServer {
    server = null;
    clients = new Set();
    config;
    tools;
    mcpServer;
    conversationState = { messages: [], sessionId: null };
    constructor(config) {
        this.config = config;
        this.tools = (0, agent_tools_1.createAgentTools)(config.freeCADBridge);
        this.mcpServer = (0, claude_agent_sdk_1.createSdkMcpServer)({
            name: 'freecad-tools',
            version: '1.0.0',
            tools: this.tools,
        });
    }
    getBackendTools() {
        return this.tools.map((tool) => ({
            name: tool.name,
            description: tool.description || '',
            inputSchema: tool.inputSchema,
        }));
    }
    async buildMessageContext(sessionId) {
        let documentInfo = undefined;
        let selectedObjects = undefined;
        if (this.config.freeCADBridge) {
            try {
                documentInfo = await this.config.freeCADBridge.getDocumentInfo() ?? undefined;
            }
            catch {
                // Ignore errors, leave documentInfo undefined
            }
            try {
                selectedObjects = await this.config.freeCADBridge.getSelectedObjects() ?? undefined;
            }
            catch {
                // Ignore errors, leave selectedObjects undefined
            }
        }
        return {
            sessionId,
            documentInfo,
            selectedObjects,
            conversationHistory: this.conversationState.messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
        };
    }
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = new ws_1.WebSocketServer({
                    port: this.config.port,
                });
                this.server.on('listening', () => {
                    resolve();
                });
                this.server.on('error', (error) => {
                    console.error('[DockServer] Server error:', error);
                    reject(error);
                });
                this.server.on('connection', (ws) => {
                    this.handleConnection(ws);
                });
                console.log(`[DockServer] WebSocket server created on port ${this.config.port}`);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    handleConnection(ws) {
        console.log('[DockServer] New dock widget connection');
        this.clients.add(ws);
        // Send initial status
        this.sendToClient(ws, {
            type: 'status',
            content: 'Connected to FreeCAD LLM Sidecar',
            timestamp: Date.now(),
        });
        ws.on('message', (data) => {
            this.handleMessage(ws, data);
        });
        ws.on('close', () => {
            console.log('[DockServer] Dock widget disconnected');
            this.clients.delete(ws);
        });
        ws.on('error', (error) => {
            console.error('[DockServer] Client error:', error);
            this.clients.delete(ws);
        });
    }
    handleMessage(client, data) {
        try {
            const raw = JSON.parse(data.toString());
            // Accept both "content" and "message" fields from clients
            const message = {
                ...raw,
                content: raw.content ?? raw.message ?? '',
            };
            console.log(`[DockServer] Received message type: ${message.type}`);
            switch (message.type) {
                case 'chat':
                    // Check for slash commands
                    if (message.content.startsWith('/')) {
                        this.handleSlashCommand(client, message.content);
                    }
                    else {
                        this.handleChatMessage(client, message.content);
                    }
                    break;
                default:
                    console.warn(`[DockServer] Unknown message type: ${message.type}`);
            }
        }
        catch (error) {
            console.error('[DockServer] Failed to parse message:', error);
            this.sendToClient(client, {
                type: 'error',
                content: `Failed to parse message: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }
    /**
     * Handle slash commands from the dock widget
     */
    async handleSlashCommand(client, command) {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ').trim();
        console.log(`[DockServer] Processing slash command: ${cmd}`);
        try {
            switch (cmd) {
                case '/save_session': {
                    // Create a new session if none exists, or update existing
                    let sessionId = this.conversationState.sessionId;
                    if (!sessionId) {
                        const session = (0, session_manager_1.createSession)(args || 'Untitled Session');
                        sessionId = session.id;
                        this.conversationState.sessionId = sessionId;
                        (0, agent_tools_1.setCurrentSessionId)(sessionId);
                        // Send session update to client
                        this.sendToClient(client, {
                            type: 'session_update',
                            content: `Session created: ${session.name}`,
                            sessionId: session.id,
                            timestamp: Date.now(),
                        });
                    }
                    else {
                        // Update session name if provided
                        const session = (0, session_manager_1.loadSession)(sessionId);
                        if (session && args) {
                            session.name = args;
                            // Note: saveSession is called in addMessage, session name update would need separate handling
                        }
                        this.sendToClient(client, {
                            type: 'session_update',
                            content: `Session saved: ${session?.name || 'Untitled'}`,
                            sessionId: sessionId,
                            timestamp: Date.now(),
                        });
                    }
                    console.log(`[DockServer] Session saved: ${sessionId}`);
                    break;
                }
                case '/load_session': {
                    if (!args) {
                        this.sendToClient(client, {
                            type: 'error',
                            content: 'Session ID required for load command',
                            timestamp: Date.now(),
                        });
                        return;
                    }
                    const session = (0, session_manager_1.loadSession)(args);
                    if (!session) {
                        this.sendToClient(client, {
                            type: 'error',
                            content: `Session not found: ${args}`,
                            timestamp: Date.now(),
                        });
                        return;
                    }
                    // Update current session
                    this.conversationState.sessionId = session.id;
                    this.conversationState.messages = session.messages;
                    (0, agent_tools_1.setCurrentSessionId)(session.id);
                    // Send restore message with conversation history
                    this.sendToClient(client, {
                        type: 'restore',
                        content: `Loaded session: ${session.name}`,
                        sessionId: session.id,
                        messages: session.messages,
                        timestamp: Date.now(),
                    });
                    console.log(`[DockServer] Session loaded: ${session.id} with ${session.messages.length} messages`);
                    break;
                }
                default:
                    console.warn(`[DockServer] Unknown slash command: ${cmd}`);
                    this.sendToClient(client, {
                        type: 'error',
                        content: `Unknown command: ${cmd}`,
                        timestamp: Date.now(),
                    });
            }
        }
        catch (error) {
            console.error(`[DockServer] Error processing slash command ${cmd}:`, error);
            this.sendToClient(client, {
                type: 'error',
                content: `Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: Date.now(),
            });
        }
    }
    async handleChatMessage(client, content) {
        console.log('[DockServer] Processing chat message via backend abstraction...');
        if (!this.conversationState.sessionId) {
            const session = (0, session_manager_1.createSession)('Untitled Session');
            this.conversationState.sessionId = session.id;
            (0, agent_tools_1.setCurrentSessionId)(session.id);
            console.log(`[DockServer] Created new session: ${session.id}`);
        }
        const sessionId = this.conversationState.sessionId;
        const userMessage = {
            role: 'user',
            content: content,
            timestamp: Date.now(),
        };
        this.conversationState.messages.push(userMessage);
        (0, session_manager_1.addMessage)(sessionId, userMessage).catch((err) => {
            console.error('[DockServer] Failed to persist user message:', err);
        });
        this.sendToClient(client, {
            type: 'response',
            content: 'Processing your request...',
            timestamp: Date.now(),
        });
        try {
            if (!this.config.freeCADBridge.isConnected()) {
                await this.config.freeCADBridge.connect();
            }
            let contextPrompt = '';
            const lastMessage = this.conversationState.messages.length > 0
                ? this.conversationState.messages[this.conversationState.messages.length - 1]
                : undefined;
            if ((0, context_injector_1.shouldInjectContext)(lastMessage)) {
                contextPrompt = await (0, context_injector_1.getContextInjectionPrompt)(this.config.freeCADBridge, this.config.contextInjection);
            }
            const fullPrompt = contextPrompt
                ? `${(0, context_injector_1.createContextMessage)(contextPrompt)}\n\nUser: ${content}`
                : content;
            const backend = backend_registry_1.backendRegistry.getCurrent();
            if (!backend) {
                throw new Error('No backend configured');
            }
            const context = await this.buildMessageContext(sessionId);
            const tools = this.getBackendTools();
            let fullResponse = '';
            console.log(`[DockServer] Using backend: ${backend.name}`);
            const response = await backend.sendMessage(fullPrompt, context, tools, (chunk) => {
                fullResponse += chunk;
                this.sendToClient(client, {
                    type: 'response',
                    content: chunk,
                    timestamp: Date.now(),
                });
            });
            if (response.error) {
                console.error('[DockServer] Backend error:', response.error);
                this.sendToClient(client, {
                    type: 'error',
                    content: `Error: ${response.error}`,
                    timestamp: Date.now(),
                });
                return;
            }
            const assistantMessage = {
                role: 'assistant',
                content: response.content || 'Request processed successfully',
                timestamp: Date.now(),
            };
            this.conversationState.messages.push(assistantMessage);
            (0, session_manager_1.addMessage)(sessionId, assistantMessage).catch((err) => {
                console.error('[DockServer] Failed to persist assistant message:', err);
            });
            this.sendToClient(client, {
                type: 'response',
                content: response.content || 'Request processed successfully',
                timestamp: Date.now(),
            });
        }
        catch (error) {
            console.error('[DockServer] Error processing message:', error);
            const errorMessage = {
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: Date.now(),
            };
            this.conversationState.messages.push(errorMessage);
            (0, session_manager_1.addMessage)(sessionId, errorMessage).catch((err) => {
                console.error('[DockServer] Failed to persist error message:', err);
            });
            this.sendToClient(client, {
                type: 'error',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: Date.now(),
            });
        }
    }
    sendToClient(ws, message) {
        console.log('[DockServer] sendToClient called, readyState:', ws.readyState, 'message type:', message.type);
        if (ws.readyState === ws_1.default.OPEN) {
            ws.send(JSON.stringify(message));
            console.log('[DockServer] Message sent successfully');
        }
        else {
            console.log('[DockServer] WebSocket not open, readyState:', ws.readyState);
        }
    }
    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(data);
            }
        });
    }
    async stop() {
        return new Promise((resolve) => {
            if (!this.server) {
                resolve();
                return;
            }
            console.log('[DockServer] Closing server...');
            this.server.close(() => {
                console.log('[DockServer] Server closed');
                this.server = null;
                this.clients.clear();
                resolve();
            });
            // Force close after timeout
            setTimeout(() => {
                this.server?.close();
                resolve();
            }, 5000);
        });
    }
    getClientCount() {
        return this.clients.size;
    }
}
exports.DockServer = DockServer;
//# sourceMappingURL=dock-server.js.map