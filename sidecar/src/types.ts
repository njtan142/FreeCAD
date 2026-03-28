/**
 * Type Definitions - Conversation History and Session Management
 *
 * Defines TypeScript interfaces for chat messages, sessions, and tool interactions.
 */

/**
 * Represents a tool call made during conversation
 */
export interface ToolCall {
  name: string;
  arguments: any;
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
  documentPath?: string; // Associated CAD file
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
  maxContextLength: number; // Token limit awareness
}

/**
 * Context injection result
 */
export interface ContextInjection {
  documentName?: string;
  documentLabel?: string;
  objectCount?: number;
  modified?: boolean;
  selectedObjects?: Array<{ name: string; label: string; type: string }>;
  recentOperations?: string[];
}
