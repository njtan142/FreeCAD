/**
 * Vercel AI SDK Backend for MiniMax
 *
 * Implements AgentBackend interface using Vercel AI SDK for direct MiniMax API access.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { VercelAIBackendBase } from './vercel-ai-backend-base';

export class VercelAIBackend extends VercelAIBackendBase {
  constructor() {
    super('minimax', 'MiniMax via OpenCode Go (Anthropic-compatible)');
  }

  protected getConfigPrefix(): string {
    return 'MINIMAX_';
  }

  protected getDefaultBaseUrl(): string {
    return 'https://opencode.ai/zen/go/v1';
  }

  protected getDefaultModel(): string {
    return 'minimax-m2.7';
  }

  protected validateApiKey(): void {
    if (!this.config.apiKey) {
      throw new Error('MiniMax API key is required. Set MINIMAX_API_KEY or OPENAI_API_KEY environment variable.');
    }
  }

  protected createModel() {
    const anthropic = createAnthropic({
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey,
    });
    return anthropic(this.config.model || 'minimax-m2.7');
  }

  protected buildHealthCheckUrl(): string {
    return `${this.config.baseUrl}/models`;
  }
}
