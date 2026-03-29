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

export class OpenCodeToolTranslator implements ToolTranslator {
  toBackendFormat(tools: MCPTool[]): any {
    return {
      functions: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: this.schemaToParameters(tool.inputSchema),
      })),
    };
  }

  private schemaToParameters(schema: MCPTool['inputSchema']): any {
    if (!schema || schema.type !== 'object') {
      return { type: 'object', properties: {} };
    }

    const properties: Record<string, any> = {};
    const required: string[] = schema.required || [];

    if (schema.properties) {
      for (const [name, prop] of Object.entries(schema.properties)) {
        properties[name] = this.mapSchemaType(prop);
      }
    }

    return {
      type: 'object',
      properties,
      required,
    };
  }

  private mapSchemaType(prop: any): any {
    if (!prop) return { type: 'string' };

    if (prop.type === 'string') {
      if (prop.enum) {
        return { type: 'string', enum: prop.enum };
      }
      return { type: 'string', description: prop.description };
    }

    if (prop.type === 'number' || prop.type === 'integer') {
      return {
        type: prop.type === 'integer' ? 'integer' : 'number',
        description: prop.description,
      };
    }

    if (prop.type === 'boolean') {
      return { type: 'boolean', description: prop.description };
    }

    if (prop.type === 'array') {
      return {
        type: 'array',
        items: prop.items ? this.mapSchemaType(prop.items) : {},
        description: prop.description,
      };
    }

    if (prop.type === 'object') {
      return {
        type: 'object',
        properties: prop.properties ? this.schemaToParameters(prop) : {},
        description: prop.description,
      };
    }

    return { type: 'string' };
  }

  fromBackendFormat(response: any): ToolCall[] {
    const toolCalls: ToolCall[] = [];

    if (!response) return toolCalls;

    if (response.function_call) {
      const fc = response.function_call;
      toolCalls.push({
        id: response.id || `call_${Date.now()}`,
        name: fc.name || fc.function,
        arguments: typeof fc.arguments === 'string' ? JSON.parse(fc.arguments) : fc.arguments,
      });
    } else if (response.tool_calls && Array.isArray(response.tool_calls)) {
      for (const tc of response.tool_calls) {
        toolCalls.push({
          id: tc.id || `call_${Date.now()}`,
          name: tc.function?.name || tc.name,
          arguments: typeof tc.function?.arguments === 'string'
            ? JSON.parse(tc.function.arguments)
            : tc.function?.arguments || tc.arguments || {},
        });
      }
    }

    return toolCalls;
  }
}

export class MCPToolTranslator implements ToolTranslator {
  toBackendFormat(tools: MCPTool[]): any {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  fromBackendFormat(response: any): ToolCall[] {
    const toolCalls: ToolCall[] = [];

    if (!response) return toolCalls;

    if (response.tool_calls && Array.isArray(response.tool_calls)) {
      for (const tc of response.tool_calls) {
        toolCalls.push({
          id: tc.id || `call_${Date.now()}`,
          name: tc.name,
          arguments: tc.input || tc.arguments || {},
        });
      }
    } else if (response.content && Array.isArray(response.content)) {
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id || `call_${Date.now()}`,
            name: block.name,
            arguments: block.input || {},
          });
        }
      }
    }

    return toolCalls;
  }
}
