"use strict";
/**
 * OpenAI-Compatible Backend
 *
 * Implements AgentBackend interface using Vercel AI SDK's @ai-sdk/openai provider.
 * Supports Ollama, LM Studio, Groq, and any OpenAI-compatible API.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAICompatibleBackend = void 0;
const openai_1 = require("@ai-sdk/openai");
const vercel_ai_backend_base_1 = require("./vercel-ai-backend-base");
class OpenAICompatibleBackend extends vercel_ai_backend_base_1.VercelAIBackendBase {
    constructor() {
        super('openai-compatible', 'OpenAI-compatible providers (Ollama, LM Studio, Groq)');
    }
    getConfigPrefix() {
        return 'OPENAI_COMPATIBLE_';
    }
    getDefaultBaseUrl() {
        return 'http://localhost:11434/v1';
    }
    getDefaultModel() {
        return 'llama3.2';
    }
    validateApiKey() {
        // API key optional for local providers
    }
    createModel() {
        const openai = (0, openai_1.createOpenAI)({
            baseURL: this.config.baseUrl,
            apiKey: this.config.apiKey,
        });
        return openai(this.config.model || 'llama3.2');
    }
    buildHealthCheckUrl() {
        return `${this.config.baseUrl}/models`;
    }
    async healthCheck() {
        try {
            const isLocal = this.config.apiKey === 'no-key' ||
                this.config.baseUrl?.includes('localhost') ||
                this.config.baseUrl?.includes('127.0.0.1');
            if (isLocal) {
                try {
                    const response = await fetch(`${this.config.baseUrl}/models`, { method: 'GET' });
                    return response.ok;
                }
                catch {
                    return false;
                }
            }
            else {
                if (!this.config.apiKey) {
                    return false;
                }
                const response = await fetch(`${this.config.baseUrl}/models`, {
                    headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
                });
                return response.ok;
            }
        }
        catch {
            return false;
        }
    }
}
exports.OpenAICompatibleBackend = OpenAICompatibleBackend;
//# sourceMappingURL=openai-compatible-backend.js.map