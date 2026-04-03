/**
 * Vercel AI SDK Backend for MiniMax
 *
 * Implements AgentBackend interface using Vercel AI SDK for direct MiniMax API access.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */
import { VercelAIBackendBase } from './vercel-ai-backend-base';
export declare class VercelAIBackend extends VercelAIBackendBase {
    constructor();
    protected getConfigPrefix(): string;
    protected getDefaultBaseUrl(): string;
    protected getDefaultModel(): string;
    protected validateApiKey(): void;
    protected createModel(): import("@ai-sdk/provider").LanguageModelV3;
    protected buildHealthCheckUrl(): string;
}
//# sourceMappingURL=vercel-ai-backend.d.ts.map