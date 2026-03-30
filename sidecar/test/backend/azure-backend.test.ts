import { describe, it, expect, beforeEach } from 'vitest';
import { AzureOpenAIBackend } from '../../src/backends/azure-openai-backend';

describe('Azure Backend Specific', () => {
  let backend: AzureOpenAIBackend;

  beforeEach(() => {
    backend = new AzureOpenAIBackend();
    process.env.AZURE_OPENAI_API_KEY = 'test-azure-key';
    process.env.AZURE_OPENAI_RESOURCE = 'test-resource';
    process.env.AZURE_OPENAI_DEPLOYMENT = 'test-deployment';
  });

  it('should have correct name', () => {
    expect(backend.name).toBe('azure-openai');
  });

  it('should have correct description', () => {
    expect(backend.description).toBe('Azure OpenAI via Vercel AI SDK');
  });

  it('should use correct config prefix', () => {
    expect((backend as any).getConfigPrefix()).toBe('AZURE_OPENAI_');
  });

  it('should have correct health check headers', () => {
    const headers = (backend as any).getHealthCheckHeaders();
    expect(headers['api-key']).toBe('test-azure-key');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should validate all required environment variables', () => {
    expect(() => (backend as any).validateApiKey()).not.toThrow();
  });

  it('should throw when API key is missing', () => {
    const emptyBackend = new AzureOpenAIBackend();
    expect(() => (emptyBackend as any).validateApiKey()).toThrow('Azure OpenAI API key is required');
  });

  it('should throw when resource is missing', () => {
    delete process.env.AZURE_OPENAI_RESOURCE;
    const emptyBackend = new AzureOpenAIBackend();
    expect(() => (emptyBackend as any).validateApiKey()).toThrow('Azure OpenAI resource is required');
  });

  it('should throw when deployment is missing', () => {
    delete process.env.AZURE_OPENAI_DEPLOYMENT;
    const emptyBackend = new AzureOpenAIBackend();
    expect(() => (emptyBackend as any).validateApiKey()).toThrow('Azure OpenAI deployment is required');
  });

  it('should build correct health check URL', () => {
    const healthCheckUrl = (backend as any).buildHealthCheckUrl();
    expect(healthCheckUrl).toContain('test-resource.openai.azure.com');
    expect(healthCheckUrl).toContain('test-deployment');
  });
});
