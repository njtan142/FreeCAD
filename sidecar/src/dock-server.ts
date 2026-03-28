/**
 * Dock Widget WebSocket Server
 *
 * Listens for incoming messages from the FreeCAD LLM dock widget.
 * Forwards chat messages to Claude Agent SDK and returns responses.
 */

import WebSocket, { WebSocketServer } from 'ws';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { FreeCADBridge } from './freecad-bridge';
import { createAgentTools } from './agent-tools';

export interface DockServerConfig {
  port: number;
  freeCADBridge: FreeCADBridge;
  claudeApiKey?: string;
}

export interface DockMessage {
  type: 'chat' | 'response' | 'error' | 'status';
  content: string;
  timestamp?: number;
}

export class DockServer {
  private server: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private config: DockServerConfig;
  private tools: ReturnType<typeof createAgentTools>;

  constructor(config: DockServerConfig) {
    this.config = config;
    // Create agent tools with FreeCAD bridge integration
    this.tools = createAgentTools(config.freeCADBridge);
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
      const message: DockMessage = JSON.parse(data.toString());
      console.log(`[DockServer] Received message type: ${message.type}`);

      switch (message.type) {
        case 'chat':
          this.handleChatMessage(client, message.content);
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

  private async handleChatMessage(client: WebSocket, content: string): Promise<void> {
    console.log('[DockServer] Processing chat message via Claude Agent SDK...');

    // Send acknowledgment
    this.sendToClient(client, {
      type: 'response',
      content: 'Processing your request with Claude...',
      timestamp: Date.now(),
    });

    try {
      // Check if FreeCAD bridge is connected
      if (!this.config.freeCADBridge.isConnected()) {
        // Attempt to connect
        await this.config.freeCADBridge.connect();
      }

      // Check if API key is configured
      if (!this.config.claudeApiKey) {
        this.sendToClient(client, {
          type: 'error',
          content: 'Claude API key not configured. Please set ANTHROPIC_API_KEY environment variable.',
          timestamp: Date.now(),
        });
        return;
      }

      // Use Claude Agent SDK to process the message
      // Claude will decide which tool to call based on the user's request
      let fullResponse = '';
      
      for await (const message of query({
        prompt: content,
        options: {
          apiKey: this.config.claudeApiKey,
          mcpServers: {
            'freecad-tools': {
              // Use inline tools definition
              tools: this.tools,
            },
          },
          allowedTools: [
            'mcp__freecad-tools__execute_freecad_python',
            'mcp__freecad-tools__query_model_state',
            'mcp__freecad-tools__export_model',
          ],
          maxTurns: 10,
        },
      })) {
        if (message.type === 'result' && message.subtype === 'success') {
          fullResponse += message.result;
        } else if (message.type === 'message') {
          // Stream intermediate messages (thoughts, tool calls, etc.)
          console.log('[Claude Agent]', message.content);
        }
      }

      // Send final response
      this.sendToClient(client, {
        type: 'response',
        content: fullResponse || 'Request processed successfully',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[DockServer] Error processing via Claude Agent:', error);
      this.sendToClient(client, {
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      });
    }
  }

  private sendToClient(ws: WebSocket, message: DockMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
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
