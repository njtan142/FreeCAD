/**
 * Dock Widget WebSocket Server
 *
 * Listens for incoming messages from the FreeCAD LLM dock widget.
 * Forwards chat messages to Claude Agent SDK and returns responses.
 */

import WebSocket, { WebSocketServer } from 'ws';
import { query, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { FreeCADBridge } from './freecad-bridge';
import { createAgentTools, setCurrentSessionId, getCurrentSessionId } from './agent-tools';
import { createSession, loadSession, addMessage } from './session-manager';
import { getContextInjectionPrompt, createContextMessage, shouldInjectContext } from './context-injector';
import { ChatMessage } from './types';

import { ContextInjectionConfig } from './types';

export interface DockServerConfig {
  port: number;
  freeCADBridge: FreeCADBridge;
  contextInjection?: ContextInjectionConfig;
}

export interface DockMessage {
  type: 'chat' | 'response' | 'error' | 'status' | 'restore' | 'session_update';
  content: string;
  timestamp?: number;
  sessionId?: string;
  messages?: ChatMessage[];
}

// Conversation history for context injection
interface ConversationState {
  messages: ChatMessage[];
  sessionId: string | null;
}

export class DockServer {
  private server: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private config: DockServerConfig;
  private tools: ReturnType<typeof createAgentTools>;
  private mcpServer: ReturnType<typeof createSdkMcpServer>;
  private conversationState: ConversationState = { messages: [], sessionId: null };

  constructor(config: DockServerConfig) {
    this.config = config;
    // Create agent tools with FreeCAD bridge integration
    this.tools = createAgentTools(config.freeCADBridge);
    // Create MCP server with the tools
    this.mcpServer = createSdkMcpServer({
      name: 'freecad-tools',
      version: '1.0.0',
      tools: this.tools,
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = new WebSocketServer({
          port: this.config.port,
        });

        this.server.on('listening', () => {
          resolve();
        });

        this.server.on('error', (error) => {
          console.error('[DockServer] Server error:', error);
          reject(error);
        });

        this.server.on('connection', (ws: WebSocket) => {
          this.handleConnection(ws);
        });

        console.log(`[DockServer] WebSocket server created on port ${this.config.port}`);
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleConnection(ws: WebSocket): void {
    console.log('[DockServer] New dock widget connection');
    this.clients.add(ws);

    // Send initial status
    this.sendToClient(ws, {
      type: 'status',
      content: 'Connected to FreeCAD LLM Sidecar',
      timestamp: Date.now(),
    });

    ws.on('message', (data: WebSocket.Data) => {
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

  private handleMessage(client: WebSocket, data: WebSocket.Data): void {
    try {
      const raw = JSON.parse(data.toString());
      // Accept both "content" and "message" fields from clients
      const message: DockMessage = {
        ...raw,
        content: raw.content ?? raw.message ?? '',
      };
      console.log(`[DockServer] Received message type: ${message.type}`);

      switch (message.type) {
        case 'chat':
          // Check for slash commands
          if (message.content.startsWith('/')) {
            this.handleSlashCommand(client, message.content);
          } else {
            this.handleChatMessage(client, message.content);
          }
          break;
        default:
          console.warn(`[DockServer] Unknown message type: ${message.type}`);
      }
    } catch (error) {
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
  private async handleSlashCommand(client: WebSocket, command: string): Promise<void> {
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
            const session = createSession(args || 'Untitled Session');
            sessionId = session.id;
            this.conversationState.sessionId = sessionId;
            setCurrentSessionId(sessionId);
            
            // Send session update to client
            this.sendToClient(client, {
              type: 'session_update',
              content: `Session created: ${session.name}`,
              sessionId: session.id,
              timestamp: Date.now(),
            });
          } else {
            // Update session name if provided
            const session = loadSession(sessionId);
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

          const session = loadSession(args);
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
          setCurrentSessionId(session.id);

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
    } catch (error) {
      console.error(`[DockServer] Error processing slash command ${cmd}:`, error);
      this.sendToClient(client, {
        type: 'error',
        content: `Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      });
    }
  }

  private async handleChatMessage(client: WebSocket, content: string): Promise<void> {
    console.log('[DockServer] Processing chat message via Claude Agent SDK...');

    // Ensure we have a session
    if (!this.conversationState.sessionId) {
      const session = createSession('Untitled Session');
      this.conversationState.sessionId = session.id;
      setCurrentSessionId(session.id);
      console.log(`[DockServer] Created new session: ${session.id}`);
    }

    const sessionId = this.conversationState.sessionId!;

    // Persist user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: content,
      timestamp: Date.now(),
    };
    
    // Add message to conversation state and persist asynchronously
    this.conversationState.messages.push(userMessage);
    addMessage(sessionId, userMessage).catch((err) => {
      console.error('[DockServer] Failed to persist user message:', err);
    });

    // Send acknowledgment
    this.sendToClient(client, {
      type: 'response',
      content: 'Processing your request with Claude...',
      timestamp: Date.now(),
    });

    console.log('[DockServer] About to enter try block');
    try {
      console.log('[DockServer] Inside try block, checking FreeCAD bridge...');
      console.log('[DockServer] Bridge connected:', this.config.freeCADBridge.isConnected());
      // Check if FreeCAD bridge is connected
      if (!this.config.freeCADBridge.isConnected()) {
        // Attempt to connect
        await this.config.freeCADBridge.connect();
      }

      // Build context injection prompt if enabled and appropriate
      let contextPrompt = '';
      const lastMessage = this.conversationState.messages.length > 0
        ? this.conversationState.messages[this.conversationState.messages.length - 1]
        : undefined;

      console.log('[DockServer] Checking shouldInjectContext...');
      console.log('[DockServer] lastMessage:', lastMessage);
      if (shouldInjectContext(lastMessage)) {
        console.log('[DockServer] Calling getContextInjectionPrompt...');
        contextPrompt = await getContextInjectionPrompt(
          this.config.freeCADBridge,
          this.config.contextInjection
        );
        console.log('[DockServer] getContextInjectionPrompt returned, context length:', contextPrompt.length);

        // Warn if bridge not connected but context was requested
        if (!this.config.freeCADBridge.isConnected() && contextPrompt === '') {
          console.warn('[DockServer] FreeCAD bridge not connected, context injection skipped');
        }
      }

      // Build the full prompt with context
      console.log('[DockServer] Building full prompt, contextPrompt length:', contextPrompt.length);
      const fullPrompt = contextPrompt
        ? `${createContextMessage(contextPrompt)}\n\nUser: ${content}`
        : content;
      console.log('[DockServer] Full prompt built, length:', fullPrompt.length);

      // Use Claude Agent SDK to process the message
      // Claude will decide which tool to call based on the user's request
      let fullResponse = '';
      let queryError: string | undefined;

      // Note: API key must be set via ANTHROPIC_API_KEY environment variable
      console.log('[DockServer] Starting query() call...');
      try {
        const queryGenerator = query({
          prompt: fullPrompt,
          options: {
            mcpServers: {
              'freecad-tools': this.mcpServer,
            },
            allowedTools: [
              'mcp__freecad-tools__execute_freecad_python',
              'mcp__freecad-tools__query_model_state',
              'mcp__freecad-tools__export_model',
            ],
            maxTurns: 10,
          },
        });
        console.log('[DockServer] query() returned, starting iteration...');

        for await (const message of queryGenerator) {
          const msg = message as any;
          const useful = {
            type: msg.type,
            subtype: msg.subtype,
            is_error: msg.is_error,
            result: msg.result,
            error: msg.error,
            session_id: msg.session_id,
          };
          console.log('[DockServer] SDK message:', JSON.stringify(useful));
          if (message.type === 'result') {
            if (message.subtype === 'success' && message.is_error !== true) {
              fullResponse += (message as any).result || '';
            } else {
              queryError = `Query failed: ${(message as any).result || (message as any).errors?.join(', ') || message.subtype}`;
            }
          }
        }
        console.log('[DockServer] Query iteration completed normally');
      } catch (error) {
        if (!queryError) {
          queryError = error instanceof Error ? error.message : 'Unknown query error';
        }
      }

      console.log('[DockServer] About to send response, queryError:', queryError);
      if (queryError) {
        console.error('[DockServer] Query error:', queryError);
        this.sendToClient(client, {
          type: 'error',
          content: `Error: ${queryError}`,
          timestamp: Date.now(),
        });
        console.log('[DockServer] Error response sent to client');
        return;
      }

      // Persist assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fullResponse || 'Request processed successfully',
        timestamp: Date.now(),
      };
      
      this.conversationState.messages.push(assistantMessage);
      addMessage(sessionId, assistantMessage).catch((err) => {
        console.error('[DockServer] Failed to persist assistant message:', err);
      });

      // Send final response
      this.sendToClient(client, {
        type: 'response',
        content: fullResponse || 'Request processed successfully',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[DockServer] Error processing via Claude Agent:', error);
      
      // Persist error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      
      this.conversationState.messages.push(errorMessage);
      addMessage(sessionId, errorMessage).catch((err) => {
        console.error('[DockServer] Failed to persist error message:', err);
      });

      this.sendToClient(client, {
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      });
    }
  }

  private sendToClient(ws: WebSocket, message: DockMessage): void {
    console.log('[DockServer] sendToClient called, readyState:', ws.readyState, 'message type:', message.type);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      console.log('[DockServer] Message sent successfully');
    } else {
      console.log('[DockServer] WebSocket not open, readyState:', ws.readyState);
    }
  }

  broadcast(message: DockMessage): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  async stop(): Promise<void> {
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

  getClientCount(): number {
    return this.clients.size;
  }
}
