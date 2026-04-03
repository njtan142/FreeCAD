/**
 * Google Gemini Backend via Vercel AI SDK
 *
 * Implements AgentBackend interface using Vercel AI SDK for direct Google Gemini API access.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */
import { VercelAIBackendBase } from './vercel-ai-backend-base';
export declare class GeminiBackend extends VercelAIBackendBase {
    constructor();
    protected getConfigPrefix(): string;
    protected getDefaultBaseUrl(): string;
    protected getDefaultModel(): string;
    protected validateApiKey(): void;
    protected createModel(): import("@ai-sdk/provider").LanguageModelV3;
    protected buildHealthCheckUrl(): string;
    protected getHealthCheckHeaders(): Record<string, string>;
}
//# sourceMappingURL=gemini-ai-backend.d.ts.map