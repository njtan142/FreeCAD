import { describe, it, expect, beforeEach } from 'vitest';
import { VercelAIBackend } from '../../src/backends/vercel-ai-backend';
import { createMockBridge } from '../utils';

describe('sendMessage Integration', () => {
  let backend: VercelAIBackend;

  beforeEach(() => {
    backend = new VercelAIBackend();
    process.env.MINIMAX_API_KEY = 'test-key';
  });

  it('should require api key', async () => {
    const emptyBackend = new VercelAIBackend();
    const result = await emptyBackend.sendMessage('hello', {}, [], () => {});
    expect(result.error).toContain('API key not configured');
  });

  it('should handle execute_freecad_python tool via bridge', async () => {
    const mockBridge = createMockBridge({
      executePython: async (code: string) => {
        if (code.includes('FreeCADGui')) {
          return { success: true, output: '{"success": true}' };
        }
        return { success: true, output: '{}' };
      }
    });
    backend.setFreeCADBridge(mockBridge);
  });

  it('should use buildToolCode for known tools', () => {
    const code = backend.buildToolCode('list_objects', {});
    expect(code).toContain('llm_bridge.query_handlers');
    expect(code).toContain('handle_list_objects');
  });

  it('should return error for unknown tools', () => {
    const code = backend.buildToolCode('unknown_tool', {});
    expect(code).toContain('not yet supported');
  });

  it('should build correct query_model_state code for document_overview', () => {
    const code = backend.buildToolCode('query_model_state', { intent: 'document_overview' });
    expect(code).toContain('handle_document_overview');
  });

  it('should build correct query_model_state code for object_details', () => {
    const code = backend.buildToolCode('query_model_state', { intent: 'object_details', objectName: 'Box' });
    expect(code).toContain('handle_object_details');
  });

  it('should build correct query_model_state code for selection', () => {
    const code = backend.buildToolCode('query_model_state', { intent: 'selection' });
    expect(code).toContain('handle_selection');
  });

  it('should build correct query_model_state code for dependencies', () => {
    const code = backend.buildToolCode('query_model_state', { intent: 'dependencies', objectName: 'Box' });
    expect(code).toContain('handle_dependencies');
  });

  it('should build save_document code correctly', () => {
    const code = backend.buildToolCode('save_document', { filePath: '/path/to/file.FCStd' });
    expect(code).toContain('handle_save_document');
  });

  it('should build open_document code correctly', () => {
    const code = backend.buildToolCode('open_document', { filePath: '/path/to/file.FCStd' });
    expect(code).toContain('handle_open_document');
  });

  it('should build export_to_format code correctly', () => {
    const code = backend.buildToolCode('export_to_format', { filePath: '/path/to/file.step', format: 'STEP' });
    expect(code).toContain('handle_export_to_format');
  });
});
