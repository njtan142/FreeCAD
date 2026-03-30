/**
 * Vercel AI SDK Backend for MiniMax
 *
 * Implements AgentBackend interface using Vercel AI SDK for direct MiniMax API access.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { VercelAIBackendBase } from './vercel-ai-backend-base';

export class VercelAIBackend extends VercelAIBackendBase {
  constructor() {
    super('minimax', 'MiniMax via Vercel AI SDK');
  }

  protected getConfigPrefix(): string {
    return 'MINIMAX_';
  }

  protected getDefaultBaseUrl(): string {
    return 'https://api.minimaxi.com/v1';
  }

  protected getDefaultModel(): string {
    return 'MiniMax-M2.7';
  }

  protected validateApiKey(): void {
    if (!this.config.apiKey) {
      throw new Error('MiniMax API key is required. Set MINIMAX_API_KEY environment variable.');
    }
  }

  protected createModel() {
    const openai = createOpenAI({
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey,
    });
    return openai(this.config.model || 'MiniMax-M2.7');
  }

  protected buildHealthCheckUrl(): string {
    return `${this.config.baseUrl}/models`;
  }
}
