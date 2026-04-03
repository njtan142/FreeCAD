import { VercelAIBackendBase } from './vercel-ai-backend-base';
export declare class AzureOpenAIBackend extends VercelAIBackendBase {
    constructor();
    protected getConfigPrefix(): string;
    protected getDefaultBaseUrl(): string;
    protected getDefaultModel(): string;
    protected validateApiKey(): void;
    protected createModel(): import("@ai-sdk/provider").LanguageModelV3;
    protected buildHealthCheckUrl(): string;
    protected getHealthCheckHeaders(): Record<string, string>;
}
//# sourceMappingURL=azure-openai-backend.d.ts.map