/**
 * Agent Backend Interface
 *
 * Defines the contract for all LLM agent backends (Claude, OpenCode, etc.)
 */
import { ToolCall, BackendConfig, MCPTool } from './types';
export { ToolCall, BackendConfig, MCPTool };
export interface MessageContext {
    sessionId?: string;
    documentPath?: string;
    selectedObjects?: Array<{
        name: string;
        label: string;
        type: string;
    }>;
    documentInfo?: {
        name: string;
        label: string;
        modified: boolean;
        objectCount: number;
    };
    conversationHistory?: Array<{
        role: string;
        content: string;
    }>;
}
export interface AgentResponse {
    content: string;
    toolCalls?: ToolCall[];
    error?: string;
}
export interface AgentBackend {
    name: string;
    description: string;
    initialize(config: BackendConfig): Promise<void>;
    sendMessage(message: string, context: MessageContext, tools: MCPTool[], onChunk: (chunk: string) => void): Promise<AgentResponse>;
    healthCheck(): Promise<boolean>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=agent-backend.d.ts.map