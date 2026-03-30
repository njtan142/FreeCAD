"use strict";
/**
 * FreeCAD LLM Sidecar - Main Entry Point
 *
 * This sidecar bridges Claude Agent SDK with FreeCAD's Python execution environment.
 * It runs two WebSocket servers:
 * - Dock widget server (port 8765): Receives chat messages from FreeCAD's LLM dock widget
 * - FreeCAD bridge client (port 8766): Sends Python code to FreeCAD's Python bridge
 *
 * Authentication:
 * - Uses Claude Code CLI credentials if available (no API key needed)
 * - Falls back to ANTHROPIC_API_KEY if Claude Code not logged in
 * - OpenCode backend for multi-LLM support (OpenAI, Anthropic, Google, local)
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
exports.backendRegistry = exports.createSdkMcpServer = exports.createAgentTools = exports.FreeCADBridge = exports.DockServer = exports.config = void 0;
exports.parseArgs = parseArgs;
const http = __importStar(require("http"));
const claude_agent_sdk_1 = require("@anthropic-ai/claude-agent-sdk");
Object.defineProperty(exports, "createSdkMcpServer", { enumerable: true, get: function () { return claude_agent_sdk_1.createSdkMcpServer; } });
const dock_server_1 = require("./dock-server");
Object.defineProperty(exports, "DockServer", { enumerable: true, get: function () { return dock_server_1.DockServer; } });
const freecad_bridge_1 = require("./freecad-bridge");
Object.defineProperty(exports, "FreeCADBridge", { enumerable: true, get: function () { return freecad_bridge_1.FreeCADBridge; } });
const agent_tools_1 = require("./agent-tools");
Object.defineProperty(exports, "createAgentTools", { enumerable: true, get: function () { return agent_tools_1.createAgentTools; } });
const session_manager_1 = require("./session-manager");
const backend_registry_1 = require("./backend-registry");
Object.defineProperty(exports, "backendRegistry", { enumerable: true, get: function () { return backend_registry_1.backendRegistry; } });
const claude_backend_1 = require("./backends/claude-backend");
const opencode_backend_1 = require("./backends/opencode-backend");
const backend_config_1 = require("./backend-config");
const child_process_1 = require("child_process");
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {
        listSessions: false,
        listBackends: false,
        noContextInjection: false,
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--resume' && args[i + 1]) {
            parsed.resume = args[++i];
        }
        else if (arg === '--session' && args[i + 1]) {
            parsed.session = args[++i];
        }
        else if (arg === '--list-sessions') {
            parsed.listSessions = true;
        }
        else if (arg === '--list-backends' || arg === '-l') {
            parsed.listBackends = true;
        }
        else if (arg === '--no-context-injection') {
            parsed.noContextInjection = true;
        }
        else if ((arg === '--backend' || arg === '-b') && args[i + 1]) {
            parsed.backend = args[++i];
        }
        else if (arg === '--claude') {
            parsed.backend = 'claude';
        }
        else if (arg === '--opencode') {
            parsed.backend = 'opencode';
        }
    }
    return parsed;
}
function isClaudeCodeAvailable() {
    try {
        (0, child_process_1.execSync)('claude --version', { stdio: 'pipe' });
        return true;
    }
    catch {
        return false;
    }
}
function isOpenCodeAvailable() {
    try {
        (0, child_process_1.execSync)('opencode --version', { stdio: 'pipe' });
        return true;
    }
    catch {
        return false;
    }
}
function registerBackends() {
    backend_registry_1.backendRegistry.register(new claude_backend_1.ClaudeBackend());
    backend_registry_1.backendRegistry.register(new opencode_backend_1.OpenCodeBackend());
}
const config = {
    dockServerPort: parseInt(process.env.DOCK_SERVER_PORT || '8765', 10),
    freeCADBridgePort: parseInt(process.env.FREECAD_BRIDGE_PORT || '8766', 10),
    freeCADBridgeHost: process.env.FREECAD_BRIDGE_HOST || 'localhost',
    claudeApiKey: process.env.ANTHROPIC_API_KEY || '',
    useClaudeCodeCLI: process.env.USE_CLAUDE_CODE_CLI === 'true' || false,
    contextInjection: {
        queryBeforeOperations: true,
        includeSelectedObjects: true,
        includeDocumentInfo: true,
        maxContextLength: 4000,
    },
};
exports.config = config;
async function main() {
    const cliArgs = parseArgs();
    registerBackends();
    if (cliArgs.listBackends) {
        console.log('[Sidecar] Available Backends:\n');
        const backends = backend_registry_1.backendRegistry.listBackends();
        for (const backend of backends) {
            console.log(`  ${backend.name}: ${backend.description}`);
        }
        console.log();
        process.exit(0);
    }
    if (cliArgs.listSessions) {
        console.log('[Sidecar] Saved Sessions:\n');
        const sessions = (0, session_manager_1.listSessions)(20);
        if (sessions.length === 0) {
            console.log('No saved sessions found.');
        }
        else {
            for (const session of sessions) {
                const date = new Date(session.updatedAt).toLocaleString();
                console.log(`- ${session.name} (ID: ${session.id})`);
                console.log(`  Messages: ${session.messageCount}, Updated: ${date}`);
                if (session.documentPath) {
                    console.log(`  Document: ${session.documentPath}`);
                }
                console.log();
            }
        }
        process.exit(0);
    }
    const selectedBackend = cliArgs.backend || 'claude';
    const backend = backend_registry_1.backendRegistry.get(selectedBackend);
    if (!backend) {
        console.error(`[Sidecar] Unknown backend: ${selectedBackend}`);
        console.error('[Sidecar] Available backends:');
        const backends = backend_registry_1.backendRegistry.listBackends();
        for (const b of backends) {
            console.error(`  - ${b.name}: ${b.description}`);
        }
        process.exit(1);
    }
    console.log('[Sidecar] Starting FreeCAD LLM Sidecar...');
    console.log(`[Sidecar] Configuration:`);
    console.log(`  - Dock Server Port: ${config.dockServerPort}`);
    console.log(`  - FreeCAD Bridge: ${config.freeCADBridgeHost}:${config.freeCADBridgePort}`);
    console.log(`  - Backend: ${backend.name}`);
    if (cliArgs.noContextInjection) {
        config.contextInjection.queryBeforeOperations = false;
        console.log('[Sidecar] Context injection: disabled');
    }
    const backendConfig = (0, backend_config_1.getBackendConfig)(selectedBackend);
    const configErrors = (0, backend_config_1.validateBackendConfig)(selectedBackend, backendConfig);
    if (configErrors.length > 0) {
        for (const error of configErrors) {
            console.warn(`[Sidecar] Config warning: ${error}`);
        }
    }
    if (selectedBackend === 'claude') {
        const hasClaudeCode = isClaudeCodeAvailable();
        const hasApiKey = !!config.claudeApiKey;
        if (!hasClaudeCode && !hasApiKey) {
            console.warn('[Sidecar] Warning: No authentication available.');
            console.warn('[Sidecar] Either:');
            console.warn('[Sidecar]   1. Install Claude Code CLI and log in');
            console.warn('[Sidecar]   2. Set ANTHROPIC_API_KEY environment variable');
        }
        else if (hasClaudeCode) {
            console.log('[Sidecar] Using Claude Code CLI authentication (no API key needed)');
        }
        else {
            console.log('[Sidecar] Using ANTHROPIC_API_KEY authentication');
        }
    }
    else if (selectedBackend === 'opencode') {
        const hasOpenCode = isOpenCodeAvailable();
        if (!hasOpenCode) {
            console.warn('[Sidecar] Warning: OpenCode CLI not found.');
            console.warn('[Sidecar] Install with: npm install -g opencode');
        }
        else {
            console.log('[Sidecar] Using OpenCode backend');
            console.log(`[Sidecar]   Model: ${backendConfig.model || 'default'}`);
            console.log(`[Sidecar]   Base URL: ${backendConfig.baseUrl || 'default'}`);
        }
    }
    try {
        await backend.initialize(backendConfig);
        backend_registry_1.backendRegistry.setCurrent(selectedBackend);
        console.log(`[Sidecar] Backend '${selectedBackend}' initialized`);
    }
    catch (error) {
        console.error(`[Sidecar] Failed to initialize backend '${selectedBackend}':`, error);
        process.exit(1);
    }
    const freeCADBridge = new freecad_bridge_1.FreeCADBridge({
        host: config.freeCADBridgeHost,
        port: config.freeCADBridgePort,
    });
    if (cliArgs.resume) {
        const session = (0, session_manager_1.loadSession)(cliArgs.resume);
        if (session) {
            (0, agent_tools_1.setCurrentSessionId)(session.id);
            console.log(`[Sidecar] Resumed session: ${session.name} (${session.id})`);
        }
        else {
            console.warn(`[Sidecar] Session not found: ${cliArgs.resume}`);
        }
    }
    else if (cliArgs.session) {
        const session = (0, session_manager_1.createSession)(cliArgs.session);
        (0, agent_tools_1.setCurrentSessionId)(session.id);
        console.log(`[Sidecar] Created new session: ${session.name} (${session.id})`);
    }
    const tools = (0, agent_tools_1.createAgentTools)(freeCADBridge);
    const mcpServer = (0, claude_agent_sdk_1.createSdkMcpServer)({
        name: 'freecad-tools',
        version: '1.0.0',
        tools: tools,
    });
    const dockServer = new dock_server_1.DockServer({
        port: config.dockServerPort,
        freeCADBridge,
        contextInjection: config.contextInjection,
    });
    process.on('SIGINT', async () => {
        console.log('[Sidecar] Shutting down...');
        await dockServer.stop();
        await freeCADBridge.disconnect();
        const currentBackend = backend_registry_1.backendRegistry.getCurrent();
        if (currentBackend) {
            await currentBackend.disconnect();
        }
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        console.log('[Sidecar] Shutting down...');
        await dockServer.stop();
        await freeCADBridge.disconnect();
        const currentBackend = backend_registry_1.backendRegistry.getCurrent();
        if (currentBackend) {
            await currentBackend.disconnect();
        }
        process.exit(0);
    });
    try {
        await dockServer.start();
        console.log(`[Sidecar] Dock widget server listening on port ${config.dockServerPort}`);
        console.log(`[Sidecar] MCP server 'freecad-tools' registered with ${tools.length} tools`);
        // HTTP proxy for MCP stdio server to execute Python via the sidecar's bridge
        const httpServer = http.createServer((req, res) => {
            if (req.method === 'POST' && req.url === '/execute') {
                let body = '';
                req.on('data', (chunk) => { body += chunk; });
                req.on('end', async () => {
                    try {
                        const { code } = JSON.parse(body);
                        if (!freeCADBridge.isConnected()) {
                            await freeCADBridge.connect();
                        }
                        const result = await freeCADBridge.executePython(code);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    }
                    catch (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, output: '', error: String(error) }));
                    }
                });
            }
            else {
                res.writeHead(404);
                res.end();
            }
        });
        httpServer.listen(8767, () => {
            console.log('[Sidecar] HTTP proxy for MCP server listening on port 8767');
        });
        freeCADBridge.connect().catch((err) => {
            console.warn(`[Sidecar] Could not connect to FreeCAD bridge: ${err.message}`);
            console.warn('[Sidecar] Will retry on next message send attempt');
        });
    }
    catch (error) {
        console.error('[Sidecar] Failed to start:', error);
        process.exit(1);
    }
    console.log('[Sidecar] Ready to accept connections from FreeCAD dock widget');
    console.log('[Sidecar] Available tools:');
    tools.forEach((tool) => {
        console.log(`  - ${tool.name}`);
    });
}
main().catch((error) => {
    console.error('[Sidecar] Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map