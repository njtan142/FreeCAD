"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAIBackend = void 0;
const anthropic_1 = require("@ai-sdk/anthropic");
const vercel_ai_backend_base_1 = require("./vercel-ai-backend-base");
class ClaudeAIBackend extends vercel_ai_backend_base_1.VercelAIBackendBase {
    constructor() {
        super('claude-ai', 'Anthropic Claude via Vercel AI SDK');
    }
    getConfigPrefix() {
        return 'ANTHROPIC_';
    }
    getDefaultBaseUrl() {
        return 'https://api.anthropic.com/v1';
    }
    getDefaultModel() {
        return 'claude-3-5-sonnet-20241022';
    }
    validateApiKey() {
        if (!this.config.apiKey) {
            throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.');
        }
    }
    createModel() {
        const anthropic = (0, anthropic_1.createAnthropic)({
            apiKey: this.config.apiKey,
        });
        return anthropic(this.config.model || 'claude-3-5-sonnet-20241022');
    }
    buildHealthCheckUrl() {
        return `${this.config.baseUrl}/messages`;
    }
    getHealthCheckHeaders() {
        return {
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        };
    }
}
exports.ClaudeAIBackend = ClaudeAIBackend;
//# sourceMappingURL=claude-ai-backend.js.map