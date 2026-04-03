"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureOpenAIBackend = void 0;
const openai_1 = require("@ai-sdk/openai");
const vercel_ai_backend_base_1 = require("./vercel-ai-backend-base");
class AzureOpenAIBackend extends vercel_ai_backend_base_1.VercelAIBackendBase {
    constructor() {
        super('azure-openai', 'Azure OpenAI via Vercel AI SDK');
    }
    getConfigPrefix() {
        return 'AZURE_OPENAI_';
    }
    getDefaultBaseUrl() {
        return '';
    }
    getDefaultModel() {
        return '';
    }
    validateApiKey() {
        if (!this.config.apiKey) {
            throw new Error('Azure OpenAI API key is required. Set AZURE_OPENAI_API_KEY environment variable.');
        }
        if (!process.env.AZURE_OPENAI_RESOURCE) {
            throw new Error('Azure OpenAI resource is required. Set AZURE_OPENAI_RESOURCE environment variable.');
        }
        if (!process.env.AZURE_OPENAI_DEPLOYMENT) {
            throw new Error('Azure OpenAI deployment is required. Set AZURE_OPENAI_DEPLOYMENT environment variable.');
        }
    }
    createModel() {
        const resource = process.env.AZURE_OPENAI_RESOURCE;
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
        const baseUrl = `https://${resource}.openai.azure.com/openai/deployments/${deployment}?api-version=${apiVersion}`;
        const openai = (0, openai_1.createOpenAI)({
            baseURL: baseUrl,
            apiKey: this.config.apiKey,
        });
        return openai(deployment);
    }
    buildHealthCheckUrl() {
        const resource = process.env.AZURE_OPENAI_RESOURCE;
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
        return `https://${resource}.openai.azure.com/openai/deployments/${deployment}?api-version=${apiVersion}`;
    }
    getHealthCheckHeaders() {
        return {
            'api-key': this.config.apiKey,
            'Content-Type': 'application/json',
        };
    }
}
exports.AzureOpenAIBackend = AzureOpenAIBackend;
//# sourceMappingURL=azure-openai-backend.js.map