import { VercelAIBackendBase } from './vercel-ai-backend-base';
export declare class ClaudeAIBackend extends VercelAIBackendBase {
    constructor();
    protected getConfigPrefix(): string;
    protected getDefaultBaseUrl(): string;
    protected getDefaultModel(): string;
    protected validateApiKey(): void;
    protected createModel(): import("@ai-sdk/provider").LanguageModelV3;
    protected buildHealthCheckUrl(): string;
    protected getHealthCheckHeaders(): Record<string, string>;
}
//# sourceMappingURL=claude-ai-backend.d.ts.map