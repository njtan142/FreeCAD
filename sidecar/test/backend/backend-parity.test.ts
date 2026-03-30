import { describe, it, expect, beforeEach } from 'vitest';
import { VercelAIBackend } from '../../src/backends/vercel-ai-backend';
import { GeminiBackend } from '../../src/backends/gemini-ai-backend';
import { AzureOpenAIBackend } from '../../src/backends/azure-openai-backend';
import { OpenAICompatibleBackend } from '../../src/backends/openai-compatible-backend';

interface BackendInstance {
  name: string;
  backend: VercelAIBackend | GeminiBackend | AzureOpenAIBackend | OpenAICompatibleBackend;
}

const backends: BackendInstance[] = [];

describe('Backend Parity', () => {
  beforeEach(() => {
    backends.length = 0;
    
    process.env.MINIMAX_API_KEY = 'test-minimax-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.OPENAI_COMPATIBLE_API_KEY = 'test-openai-compatible-key';
    
    backends.push({ name: 'minimax', backend: new VercelAIBackend() });
    backends.push({ name: 'gemini', backend: new GeminiBackend() });
    backends.push({ name: 'openai-compatible', backend: new OpenAICompatibleBackend() });
  });

  const testTools = [
    'list_objects',
    'get_object_properties',
    'get_selection',
    'save_document',
    'create_sketch',
    'create_pad',
    'boolean_fuse',
    'create_point',
    'create_linear_dimension',
    'move_object',
    'create_linear_pattern',
    'create_assembly',
    'create_drawing_page',
    'create_loft',
    'initialize_kinematic_solver',
    'set_view_angle',
    'render_view',
    'shape_to_mesh',
    'create_fea_analysis',
    'create_path_job',
    'create_spreadsheet',
    'create_wall',
    'measure_distance',
  ];

  testTools.forEach(toolName => {
    it(`should generate same code for ${toolName} across all backends`, () => {
      const codes: Map<string, string> = new Map();
      
      backends.forEach(({ name, backend }) => {
        const code = (backend as any).buildToolCode(toolName, { test: 'param' });
        codes.set(name, code);
      });

      const firstCode = codes.get(backends[0].name);
      codes.forEach((code, backendName) => {
        if (backendName !== backends[0].name) {
          expect(code).toBe(firstCode);
        }
      });
    });
  });

  it('should handle execute_freecad_python differently (special case)', () => {
    backends.forEach(({ name, backend }) => {
      const code = (backend as any).buildToolCode('execute_freecad_python', { code: 'print(1)' });
      expect(code).toContain('FreeCADGui');
    });
  });
});
