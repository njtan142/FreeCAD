/**
 * Vercel AI SDK Backend Base Class
 *
 * Contains all shared code for Vercel AI SDK backends (MiniMax, Gemini, OpenAI-compatible).
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */
import { CoreMessage } from 'ai';
import { AgentBackend, BackendConfig, AgentResponse, MessageContext, MCPTool } from '../agent-backend.js';
export interface FreeCADBridge {
    isConnected(): boolean;
    connect(): Promise<void>;
    executePython(code: string): Promise<{
        success: boolean;
        output: string;
        error?: string;
    }>;
}
export declare abstract class VercelAIBackendBase implements AgentBackend {
    readonly name: string;
    readonly description: string;
    protected config: BackendConfig;
    protected freeCADBridge: FreeCADBridge | null;
    protected sessionId: string;
    constructor(name: string, description: string);
    protected abstract getConfigPrefix(): string;
    protected abstract validateApiKey(): void;
    protected abstract createModel(): any;
    protected abstract buildHealthCheckUrl(): string;
    initialize(config: BackendConfig): Promise<void>;
    protected getDefaultBaseUrl(): string;
    protected getDefaultModel(): string;
    protected generateSessionId(): string;
    setFreeCADBridge(bridge: FreeCADBridge): void;
    sendMessage(message: string, context: MessageContext, tools: MCPTool[], onChunk: (chunk: string) => void): Promise<AgentResponse>;
    protected buildMessages(message: string, context: MessageContext): CoreMessage[];
    protected initializeMCPTools(tools: MCPTool[]): Promise<Record<string, any>>;
    protected executeViaBridge(toolName: string, args: Record<string, any>): Promise<any>;
    protected buildToolCode(toolName: string, args: Record<string, any>): string;
    protected buildQueryModelStateCode(args: Record<string, any>): string;
    protected buildSaveDocumentCode(args: Record<string, any>): string;
    healthCheck(): Promise<boolean>;
    protected getHealthCheckHeaders(): Record<string, string>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=vercel-ai-backend-base.d.ts.map