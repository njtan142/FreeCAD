import { describe, it, expect, beforeEach } from 'vitest';
import { OpenAICompatibleBackend } from '../../src/backends/openai-compatible-backend';

describe('OpenAI-Compatible Backend Specific', () => {
  let backend: OpenAICompatibleBackend;

  beforeEach(() => {
    backend = new OpenAICompatibleBackend();
    process.env.OPENAI_COMPATIBLE_API_KEY = 'test-key';
    process.env.OPENAI_COMPATIBLE_BASE_URL = 'http://localhost:11434/v1';
  });

  it('should have correct name', () => {
    expect(backend.name).toBe('openai-compatible');
  });

  it('should have correct description', () => {
    expect(backend.description).toBe('OpenAI-compatible providers (Ollama, LM Studio, Groq)');
  });

  it('should use correct config prefix', () => {
    expect((backend as any).getConfigPrefix()).toBe('OPENAI_COMPATIBLE_');
  });

  it('should have correct default base URL', () => {
    expect((backend as any).getDefaultBaseUrl()).toBe('http://localhost:11434/v1');
  });

  it('should have correct default model', () => {
    expect((backend as any).getDefaultModel()).toBe('llama3.2');
  });

  it('should not require API key for local providers', () => {
    expect(() => (backend as any).validateApiKey()).not.toThrow();
  });

  it('should build correct health check URL', () => {
    const healthCheckUrl = (backend as any).buildHealthCheckUrl();
    expect(healthCheckUrl).toContain('/models');
  });

  it('should handle health check for local providers', async () => {
    const mockFetch = jest.fn(() => Promise.resolve({ ok: true }));
    global.fetch = mockFetch;
    
    const result = await backend.healthCheck();
    expect(result).toBe(true);
  });
});
