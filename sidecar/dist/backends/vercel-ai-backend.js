"use strict";
/**
 * Vercel AI SDK Backend for MiniMax
 *
 * Implements AgentBackend interface using Vercel AI SDK for direct MiniMax API access.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VercelAIBackend = void 0;
const openai_1 = require("@ai-sdk/openai");
const vercel_ai_backend_base_1 = require("./vercel-ai-backend-base");
class VercelAIBackend extends vercel_ai_backend_base_1.VercelAIBackendBase {
    constructor() {
        super('minimax', 'MiniMax via Vercel AI SDK');
    }
    getConfigPrefix() {
        return 'MINIMAX_';
    }
    getDefaultBaseUrl() {
        return 'https://api.minimaxi.com/v1';
    }
    getDefaultModel() {
        return 'MiniMax-M2.7';
    }
    validateApiKey() {
        if (!this.config.apiKey) {
            throw new Error('MiniMax API key is required. Set MINIMAX_API_KEY environment variable.');
        }
    }
    createModel() {
        const openai = (0, openai_1.createOpenAI)({
            baseURL: this.config.baseUrl,
            apiKey: this.config.apiKey,
        });
        return openai(this.config.model || 'MiniMax-M2.7');
    }
    buildHealthCheckUrl() {
        return `${this.config.baseUrl}/models`;
    }
}
exports.VercelAIBackend = VercelAIBackend;
//# sourceMappingURL=vercel-ai-backend.js.map