/**
 * Google Gemini Backend via Vercel AI SDK
 *
 * Implements AgentBackend interface using Vercel AI SDK for direct Google Gemini API access.
 * Provides native streaming, built-in tool calling, and MCP tool integration.
 */

import { google } from '@ai-sdk/google';
import { VercelAIBackendBase } from './vercel-ai-backend-base';

export class GeminiBackend extends VercelAIBackendBase {
  constructor() {
    super('gemini', 'Google Gemini via Vercel AI SDK');
  }

  protected getConfigPrefix(): string {
    return 'GEMINI_';
  }

  protected getDefaultBaseUrl(): string {
    return 'https://generativelanguage.googleapis.com/v1beta';
  }

  protected getDefaultModel(): string {
    return 'gemini-2.0-flash';
  }

  protected validateApiKey(): void {
    if (!this.config.apiKey) {
      throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable.');
    }
  }

  protected createModel() {
    return google(this.config.model || 'gemini-2.0-flash', {
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey,
    });
  }

  protected buildHealthCheckUrl(): string {
    return `${this.config.baseUrl}/models?key=${this.config.apiKey}`;
  }

  protected getHealthCheckHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json' };
  }
}
