"use strict";
/**
 * Google Gemini Backend via Vercel AI SDK
 *
 * Implements AgentBackend interface using Vercel AI SDK for direct Google Gemini API access.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiBackend = void 0;
const google_1 = require("@ai-sdk/google");
const vercel_ai_backend_base_1 = require("./vercel-ai-backend-base");
class GeminiBackend extends vercel_ai_backend_base_1.VercelAIBackendBase {
    constructor() {
        super('gemini', 'Google Gemini via Vercel AI SDK');
    }
    getConfigPrefix() {
        return 'GEMINI_';
    }
    getDefaultBaseUrl() {
        return 'https://generativelanguage.googleapis.com/v1beta';
    }
    getDefaultModel() {
        return 'gemini-3-flash-preview';
    }
    validateApiKey() {
        if (!this.config.apiKey) {
            throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable.');
        }
    }
    createModel() {
        return (0, google_1.google)(this.config.model || 'gemini-2.5-flash');
    }
    buildHealthCheckUrl() {
        return `${this.config.baseUrl}/models?key=${this.config.apiKey}`;
    }
    getHealthCheckHeaders() {
        return { 'Content-Type': 'application/json' };
    }
}
exports.GeminiBackend = GeminiBackend;
//# sourceMappingURL=gemini-ai-backend.js.map