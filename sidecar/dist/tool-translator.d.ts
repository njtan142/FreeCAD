/**
 * Tool Translator
 *
 * Translates between MCP tool format and backend-specific formats.
 * Each backend has its own tool calling convention.
 */
import { ToolCall, MCPTool } from './agent-backend';
export interface ToolTranslator {
    toBackendFormat(tools: MCPTool[]): any;
    fromBackendFormat(response: any): ToolCall[];
}
export declare class OpenCodeToolTranslator implements ToolTranslator {
    toBackendFormat(tools: MCPTool[]): any;
    private schemaToParameters;
    private mapSchemaType;
    fromBackendFormat(response: any): ToolCall[];
}
export declare class MCPToolTranslator implements ToolTranslator {
    toBackendFormat(tools: MCPTool[]): any;
    fromBackendFormat(response: any): ToolCall[];
}
//# sourceMappingURL=tool-translator.d.ts.map