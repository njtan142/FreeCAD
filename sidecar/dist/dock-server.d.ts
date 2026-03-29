/**
 * Dock Widget WebSocket Server
 *
 * Listens for incoming messages from the FreeCAD LLM dock widget.
 * Forwards chat messages to the configured agent backend and returns responses.
 */
import { FreeCADBridge } from './freecad-bridge';
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
export declare class DockServer {
    private server;
    private clients;
    private config;
    private tools;
    private mcpServer;
    private conversationState;
    constructor(config: DockServerConfig);
    private getBackendTools;
    private buildMessageContext;
    start(): Promise<void>;
    private handleConnection;
    private handleMessage;
    /**
     * Handle slash commands from the dock widget
     */
    private handleSlashCommand;
    private handleChatMessage;
    private sendToClient;
    broadcast(message: DockMessage): void;
    stop(): Promise<void>;
    getClientCount(): number;
}
//# sourceMappingURL=dock-server.d.ts.map