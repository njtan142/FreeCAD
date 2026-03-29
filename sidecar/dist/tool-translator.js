"use strict";
/**
 * Tool Translator
 *
 * Translates between MCP tool format and backend-specific formats.
 * Each backend has its own tool calling convention.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenCodeToolTranslator = void 0;
class OpenCodeToolTranslator {
    toBackendFormat(tools) {
        return {
            functions: tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                parameters: this.schemaToParameters(tool.inputSchema),
            })),
        };
    }
    schemaToParameters(schema) {
        if (!schema || schema.type !== 'object') {
            return { type: 'object', properties: {} };
        }
        const properties = {};
        const required = schema.required || [];
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
    mapSchemaType(prop) {
        if (!prop)
            return { type: 'string' };
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
    fromBackendFormat(response) {
        const toolCalls = [];
        if (!response)
            return toolCalls;
        if (response.function_call) {
            const fc = response.function_call;
            toolCalls.push({
                id: response.id || `call_${Date.now()}`,
                name: fc.name || fc.function,
                arguments: typeof fc.arguments === 'string' ? JSON.parse(fc.arguments) : fc.arguments,
            });
        }
        else if (response.tool_calls && Array.isArray(response.tool_calls)) {
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
exports.OpenCodeToolTranslator = OpenCodeToolTranslator;
//# sourceMappingURL=tool-translator.js.map