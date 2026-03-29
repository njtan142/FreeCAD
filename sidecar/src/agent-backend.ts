/**
 * Agent Backend Interface
 *
 * Defines the contract for all LLM agent backends (Claude, OpenCode, etc.)
 */

import { ToolCall } from './types';
export { ToolCall };

export interface MessageContext {
  sessionId?: string;
  documentPath?: string;
  selectedObjects?: Array<{ name: string; label: string; type: string }>;
  documentInfo?: {
    name: string;
    label: string;
    modified: boolean;
    objectCount: number;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface BackendConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  sessionDir?: string;
  dangerouslySkipPermissions?: boolean;
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
  sendMessage(
    message: string,
    context: MessageContext,
    tools: MCPTool[],
    onChunk: (chunk: string) => void
  ): Promise<AgentResponse>;
  healthCheck(): Promise<boolean>;
  disconnect(): Promise<void>;
}
