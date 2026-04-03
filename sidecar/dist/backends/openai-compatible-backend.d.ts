/**
 * OpenAI-Compatible Backend
 *
 * Implements AgentBackend interface using Vercel AI SDK's @ai-sdk/openai provider.
 * Supports Ollama, LM Studio, Groq, and any OpenAI-compatible API.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */
import { VercelAIBackendBase } from './vercel-ai-backend-base';
export declare class OpenAICompatibleBackend extends VercelAIBackendBase {
    constructor();
    protected getConfigPrefix(): string;
    protected getDefaultBaseUrl(): string;
    protected getDefaultModel(): string;
    protected validateApiKey(): void;
    protected createModel(): import("@ai-sdk/provider").LanguageModelV3;
    protected buildHealthCheckUrl(): string;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=openai-compatible-backend.d.ts.map