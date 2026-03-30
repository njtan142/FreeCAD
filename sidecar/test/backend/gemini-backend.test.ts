import { describe, it, expect, beforeEach } from 'vitest';
import { GeminiBackend } from '../../src/backends/gemini-ai-backend';

describe('Gemini Backend Specific', () => {
  let backend: GeminiBackend;

  beforeEach(() => {
    backend = new GeminiBackend();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
  });

  it('should have correct name', () => {
    expect(backend.name).toBe('gemini');
  });

  it('should have correct description', () => {
    expect(backend.description).toBe('Google Gemini via Vercel AI SDK');
  });

  it('should use correct config prefix', () => {
    expect((backend as any).getConfigPrefix()).toBe('GEMINI_');
  });

  it('should have correct default base URL', () => {
    expect((backend as any).getDefaultBaseUrl()).toContain('generativelanguage');
  });

  it('should have correct default model', () => {
    expect((backend as any).getDefaultModel()).toBe('gemini-2.0-flash');
  });

  it('should validate API key exists', () => {
    expect(() => (backend as any).validateApiKey()).not.toThrow();
  });

  it('should throw when API key is missing', () => {
    const emptyBackend = new GeminiBackend();
    expect(() => (emptyBackend as any).validateApiKey()).toThrow('Gemini API key is required');
  });

  it('should build correct health check URL', () => {
    const healthCheckUrl = (backend as any).buildHealthCheckUrl();
    expect(healthCheckUrl).toContain('generativelanguage.googleapis.com');
    expect(healthCheckUrl).toContain('key=');
  });

  it('should have correct health check headers', () => {
    const headers = (backend as any).getHealthCheckHeaders();
    expect(headers['Content-Type']).toBe('application/json');
  });
});
