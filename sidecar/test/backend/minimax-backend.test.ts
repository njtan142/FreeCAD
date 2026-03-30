import { describe, it, expect, beforeEach } from 'vitest';
import { VercelAIBackend } from '../../src/backends/vercel-ai-backend';

describe('MiniMax Backend Specific', () => {
  let backend: VercelAIBackend;

  beforeEach(() => {
    backend = new VercelAIBackend();
    process.env.MINIMAX_API_KEY = 'test-minimax-key';
  });

  it('should have correct name', () => {
    expect(backend.name).toBe('minimax');
  });

  it('should have correct description', () => {
    expect(backend.description).toBe('MiniMax via Vercel AI SDK');
  });

  it('should use correct config prefix', () => {
    expect((backend as any).getConfigPrefix()).toBe('MINIMAX_');
  });

  it('should have correct default base URL', () => {
    expect((backend as any).getDefaultBaseUrl()).toBe('https://api.minimaxi.com/v1');
  });

  it('should have correct default model', () => {
    expect((backend as any).getDefaultModel()).toBe('MiniMax-M2.7');
  });

  it('should validate API key exists', () => {
    expect(() => (backend as any).validateApiKey()).not.toThrow();
  });

  it('should throw when API key is missing', () => {
    const emptyBackend = new VercelAIBackend();
    expect(() => (emptyBackend as any).validateApiKey()).toThrow('MiniMax API key is required');
  });

  it('should build correct health check URL', () => {
    const healthCheckUrl = (backend as any).buildHealthCheckUrl();
    expect(healthCheckUrl).toContain('api.minimaxi.com/v1/models');
  });

  it('should build tool code correctly for list_objects', () => {
    const code = backend.buildToolCode('list_objects', {});
    expect(code).toContain('llm_bridge.query_handlers');
  });
});
