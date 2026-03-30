import { createOpenAI } from '@ai-sdk/openai';
import { VercelAIBackendBase } from './vercel-ai-backend-base';

export class AzureOpenAIBackend extends VercelAIBackendBase {
  constructor() {
    super('azure-openai', 'Azure OpenAI via Vercel AI SDK');
  }

  protected getConfigPrefix(): string {
    return 'AZURE_OPENAI_';
  }

  protected getDefaultBaseUrl(): string {
    return '';
  }

  protected getDefaultModel(): string {
    return '';
  }

  protected validateApiKey(): void {
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

  protected createModel() {
    const resource = process.env.AZURE_OPENAI_RESOURCE!;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
    const baseUrl = `https://${resource}.openai.azure.com/openai/deployments/${deployment}?api-version=${apiVersion}`;

    const openai = createOpenAI({
      baseURL: baseUrl,
      apiKey: this.config.apiKey,
    });
    return openai(deployment);
  }

  protected buildHealthCheckUrl(): string {
    const resource = process.env.AZURE_OPENAI_RESOURCE!;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
    return `https://${resource}.openai.azure.com/openai/deployments/${deployment}?api-version=${apiVersion}`;
  }

  protected getHealthCheckHeaders(): Record<string, string> {
    return {
      'api-key': this.config.apiKey!,
      'Content-Type': 'application/json',
    };
  }
}
