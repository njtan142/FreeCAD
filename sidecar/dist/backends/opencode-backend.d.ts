/**
 * OpenCode Backend Adapter
 *
 * Implements AgentBackend interface for OpenCode CLI.
 * OpenCode supports multiple LLM providers (OpenAI, Anthropic, Google, local).
 */
import { AgentBackend, BackendConfig, AgentResponse, MessageContext, MCPTool } from '../agent-backend';
export declare class OpenCodeBackend implements AgentBackend {
    readonly name = "opencode";
    readonly description = "Multi-LLM backend (OpenAI, Anthropic, Google, local)";
    private process;
    private config;
    private toolTranslator;
    initialize(config: BackendConfig): Promise<void>;
    sendMessage(message: string, context: MessageContext, tools: MCPTool[], onChunk: (chunk: string) => void): Promise<AgentResponse>;
    private buildArgs;
    private buildContextMessage;
    private parseResponse;
    healthCheck(): Promise<boolean>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=opencode-backend.d.ts.map