/**
 * Type Definitions - Conversation History and Session Management
 *
 * Defines TypeScript interfaces for chat messages, sessions, and tool interactions.
 */
/**
 * Represents a tool call made during conversation
 */
export interface ToolCall {
    id?: string;
    name: string;
    arguments: any;
}
/**
 * Backend configuration
 */
export interface BackendConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    sessionDir?: string;
    dangerouslySkipPermissions?: boolean;
}
/**
 * MCP Tool format for backend communication
 */
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties?: Record<string, any>;
        required?: string[];
    };
}
/**
 * Represents the result of a tool execution
 */
export interface ToolResult {
    toolName: string;
    result: any;
    isError?: boolean;
}
/**
 * Represents a single chat message in the conversation
 */
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
}
/**
 * Represents a chat session with conversation history
 */
export interface ChatSession {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
    documentPath?: string;
}
/**
 * Summary information about a session (for listing)
 */
export interface SessionSummary {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    messageCount: number;
    documentPath?: string;
}
/**
 * Context injection configuration
 */
export interface ContextInjectionConfig {
    queryBeforeOperations: boolean;
    includeSelectedObjects: boolean;
    includeDocumentInfo: boolean;
    maxContextLength: number;
}
/**
 * Context injection result
 */
export interface ContextInjection {
    documentName?: string;
    documentLabel?: string;
    objectCount?: number;
    modified?: boolean;
    selectedObjects?: Array<{
        name: string;
        label: string;
        type: string;
    }>;
    recentOperations?: string[];
}
//# sourceMappingURL=types.d.ts.map