import { EventEmitter } from 'events';
import { createAgentTools } from './agent-tools';
type AgentTools = ReturnType<typeof createAgentTools>;
export interface ClaudeCodeConfig {
    sessionDir?: string;
    dangerouslySkipPermissions?: boolean;
}
export declare class ClaudeCodeSession extends EventEmitter {
    private process;
    private tools;
    private config;
    private sessionId;
    private mcpConfigPath;
    private isRunning;
    constructor(tools: AgentTools, config?: ClaudeCodeConfig);
    private generateSessionId;
    private createMcpConfig;
    getSessionId(): string;
    start(): Promise<void>;
    sendMessage(content: string): Promise<string>;
    stop(): Promise<void>;
    isConnected(): boolean;
}
export declare function createClaudeCodeSession(tools: AgentTools, config?: ClaudeCodeConfig): ClaudeCodeSession;
export {};
//# sourceMappingURL=claude-code-process.d.ts.map