/**
 * OpenAI-Compatible Backend
 *
 * Implements AgentBackend interface using Vercel AI SDK's @ai-sdk/openai provider.
 * Supports Ollama, LM Studio, Groq, and any OpenAI-compatible API.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { VercelAIBackendBase } from './vercel-ai-backend-base';

export class OpenAICompatibleBackend extends VercelAIBackendBase {
  constructor() {
    super('openai-compatible', 'OpenAI-compatible providers (Ollama, LM Studio, Groq)');
  }

  protected getConfigPrefix(): string {
    return 'OPENAI_COMPATIBLE_';
  }

  protected getDefaultBaseUrl(): string {
    return 'http://localhost:11434/v1';
  }

  protected getDefaultModel(): string {
    return 'llama3.2';
  }

  protected validateApiKey(): void {
    // API key optional for local providers
  }

  protected createModel() {
    const openai = createOpenAI({
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey,
    });
    return openai(this.config.model || 'llama3.2');
  }

  protected buildHealthCheckUrl(): string {
    return `${this.config.baseUrl}/models`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const isLocal = this.config.apiKey === 'no-key' ||
                      this.config.baseUrl?.includes('localhost') ||
                      this.config.baseUrl?.includes('127.0.0.1');

      if (isLocal) {
        try {
          const response = await fetch(`${this.config.baseUrl}/models`, { method: 'GET' });
          return response.ok;
        } catch {
          return false;
        }
      } else {
        if (!this.config.apiKey) {
          return false;
        }
        const response = await fetch(`${this.config.baseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        });
        return response.ok;
      }
    } catch {
      return false;
    }
  }
}
