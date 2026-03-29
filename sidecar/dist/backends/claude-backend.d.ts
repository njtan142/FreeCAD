/**
 * Claude Backend Adapter
 *
 * Implements AgentBackend interface for Claude Code CLI.
 * Refactored from claude-code-process.ts.
 */
import { AgentBackend, BackendConfig, AgentResponse, MessageContext, MCPTool } from '../agent-backend';
export declare class ClaudeBackend implements AgentBackend {
    readonly name = "claude";
    readonly description = "Anthropic Claude (via Claude Code CLI)";
    private process;
    private config;
    private sessionId;
    initialize(config: BackendConfig): Promise<void>;
    private generateSessionId;
    sendMessage(message: string, context: MessageContext, tools: MCPTool[], onChunk: (chunk: string) => void): Promise<AgentResponse>;
    private buildContextMessage;
    private parseResponse;
    healthCheck(): Promise<boolean>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=claude-backend.d.ts.map