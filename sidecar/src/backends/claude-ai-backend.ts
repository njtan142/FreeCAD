import { createAnthropic } from '@ai-sdk/anthropic';
import { VercelAIBackendBase } from './vercel-ai-backend-base';

export class ClaudeAIBackend extends VercelAIBackendBase {
  constructor() {
    super('claude-ai', 'Anthropic Claude via Vercel AI SDK');
  }

  protected getConfigPrefix(): string {
    return 'ANTHROPIC_';
  }

  protected getDefaultBaseUrl(): string {
    return 'https://api.anthropic.com/v1';
  }

  protected getDefaultModel(): string {
    return 'claude-3-5-sonnet-20241022';
  }

  protected validateApiKey(): void {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.');
    }
  }

  protected createModel() {
    const anthropic = createAnthropic({
      apiKey: this.config.apiKey,
    });
    return anthropic(this.config.model || 'claude-3-5-sonnet-20241022');
  }

  protected buildHealthCheckUrl(): string {
    return `${this.config.baseUrl}/messages`;
  }

  protected getHealthCheckHeaders(): Record<string, string> {
    return {
      'x-api-key': this.config.apiKey!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    };
  }
}