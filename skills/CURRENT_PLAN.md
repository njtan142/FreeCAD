## Status: IN PROGRESS (Cycle 34)

# Cycle 34: Add Comprehensive Testing Suite for Vercel AI Backends

## Overview

The Vercel AI backends (MiniMax, Gemini, OpenAI-compatible, Claude, Azure) share a common `buildToolCode` method in `VercelAIBackendBase` that generates Python code for each tool. With 324 tools defined in `agent-tools.ts`, Cycle 33 added ~97 missing tool cases, but there is no systematic way to verify:
1. All tools are covered in the switch statement
2. All backends generate identical code for each tool (backend parity)
3. Changes don't introduce regressions

This cycle creates a comprehensive test suite to verify tool coverage and backend parity.

## Plan

### Step 1: Set Up Test Infrastructure

**Files to Create:**
- `sidecar/test/backend/backend-tester.ts` - Mock FreeCAD bridge for testing
- `sidecar/test/backend/vercel-ai-backend.test.ts` - Test suite for Vercel AI backends

**Modify:**
- `sidecar/package.json` - Add test dependencies (Vitest, @vitest/ui)
- `sidecar/tsconfig.json` - Add test configuration

Add test dependencies:
```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 2: Create Tool Coverage Test

**File to Create:** `sidecar/test/backend/tool-coverage.test.ts`

Tests that verify:
- All 324 tools from `createAgentTools()` have corresponding cases in `buildToolCode` switch
- Extracts tool names from `agent-tools.ts` dynamically
- Reports any missing tools with their handler module
- Categorizes tools by handler module (draft_handlers, sketcher_handlers, etc.)

Test structure:
```typescript
describe('Tool Coverage', () => {
  it('should have cases for all tools in agent-tools.ts', () => {
    const agentTools = getToolNamesFromAgentTools();
    const switchCases = getSwitchCasesFromBuildToolCode();
    const missing = agentTools.filter(t => !switchCases.has(t));
    expect(missing).toHaveLength(0);
  });
  
  it('should categorize missing tools by handler module', () => {
    // Reports tools grouped by their handler module
  });
});
```

### Step 3: Create Backend Parity Test

**File to Create:** `sidecar/test/backend/backend-parity.test.ts`

Tests that verify all Vercel AI backends generate identical Python code for each tool:
- `VercelAIBackend` (MiniMax)
- `GeminiBackend`
- `ClaudeAIBackend`
- `AzureOpenAIBackend`
- `OpenAICompatibleBackend`

Test structure:
```typescript
describe('Backend Parity', () => {
  const backends = ['minimax', 'gemini', 'claude-ai', 'azure-openai', 'openai-compatible'];
  
  backends.forEach(backendName => {
    backends.forEach(otherBackend => {
      it(`${backendName} should generate same code as ${otherBackend}`, () => {
        // For each tool, verify code generated is identical
      });
    });
  });
});
```

### Step 4: Create Unit Tests for Tool Code Generation

**File to Create:** `sidecar/test/backend/tool-code-generation.test.ts`

Tests individual tool code generation:
```typescript
describe('Tool Code Generation', () => {
  describe('execute_freecad_python', () => {
    it('should build correct code for simple python execution', () => {
      const code = backend.buildToolCode('execute_freecad_python', { code: 'print(1)' });
      expect(code).toContain('FreeCADGui');
    });
  });
  
  describe('list_objects', () => {
    it('should build code that imports from llm_bridge', () => {
      const code = backend.buildToolCode('list_objects', {});
      expect(code).toContain('llm_bridge.query_handlers');
    });
  });
  
  // Test all major tool categories
  describe('Draft Tools', () => {
    // create_linear_dimension, create_radial_dimension, move, rotate, scale, etc.
  });
  
  describe('Sketcher Tools', () => {
    // create_sketch, add_sketch_geometry, add_constraint, etc.
  });
  
  describe('PartDesign Tools', () => {
    // create_pad, create_pocket, create_fillet, etc.
  });
  
  describe('Boolean Tools', () => {
    // boolean_fuse, boolean_cut, boolean_common, etc.
  });
  
  describe('Assembly Tools', () => {
    // create_assembly, add_component, etc.
  });
  
  describe('Mesh Tools', () => {
    // create_mesh, mesh_to_shape, etc.
  });
  
  describe('FEA Tools', () => {
    // run_fea_analysis, get_fea_results, etc.
  });
  
  describe('Path Tools', () => {
    // create_path_job, add_tool, etc.
  });
  
  describe('BIM Tools', () => {
    // create_wall, create_column, etc.
  });
  
  describe('Surface Tools', () => {
    // create_loft, create_sweep, etc.
  });
  
  describe('Kinematic Tools', () => {
    // initialize_kinematic_solver, solve_assembly, etc.
  });
  
  describe('Animation Tools', () => {
    // create_animation, add_keyframe, etc.
  });
  
  describe('View Tools', () => {
    // set_view_angle, zoom_to_fit, etc.
  });
  
  describe('Render Tools', () => {
    // render_view, set_render_quality, etc.
  });
  
  describe('Error Handling Tools', () => {
    // parse_error, suggest_undo_strategy, etc.
  });
});
```

### Step 5: Create Integration Tests for sendMessage Flow

**File to Create:** `sidecar/test/backend/send-message-integration.test.ts`

Tests the full `sendMessage` flow with mock bridge:
```typescript
describe('sendMessage Integration', () => {
  it('should handle tool call and return result', async () => {
    const mockBridge = createMockBridge({
      executePython: async (code: string) => ({
        success: true,
        output: '{"success": true, "data": []}',
        error: ''
      })
    });
    
    backend.setFreeCADBridge(mockBridge);
    
    const result = await backend.sendMessage(
      'List all objects',
      {},
      createAgentTools(mockBridge),
      (chunk) => {}
    );
    
    expect(result.content).toBeDefined();
  });
});
```

### Step 6: Create Backend-Specific Tests

**File to Create:** `sidecar/test/backend/gemini-backend.test.ts`

Tests backend-specific implementations:
```typescript
describe('Gemini Backend Specific', () => {
  it('should use correct health check URL', () => {
    const backend = new GeminiBackend();
    expect(backend.buildHealthCheckUrl()).toContain('generativelanguage');
  });
  
  it('should validate GEMINI_API_KEY', () => {
    expect(() => backend.validateApiKey()).toThrow();
  });
});
```

**Files to create for each backend:**
- `sidecar/test/backend/gemini-backend.test.ts`
- `sidecar/test/backend/minimax-backend.test.ts`
- `sidecar/test/backend/azure-backend.test.ts`
- `sidecar/test/backend/openai-compatible-backend.test.ts`

### Step 7: Create Test Utilities

**File to Create:** `sidecar/test/utils.ts`

Utility functions for tests:
```typescript
export function extractToolNames(agentToolsContent: string): string[];
export function extractSwitchCases(buildToolCodeContent: string): Set<string>;
export function createMockBridge(responses: MockBridgeResponses): MockFreeCADBridge;
export function categorizeToolsByHandler(toolNames: string[]): Map<string, string[]>;
```

## Files to Create

### Test Infrastructure
1. `sidecar/test/backend/tool-coverage.test.ts` - Verifies all 324 tools are covered
2. `sidecar/test/backend/backend-parity.test.ts` - Verifies all backends generate identical code
3. `sidecar/test/backend/tool-code-generation.test.ts` - Unit tests for each tool category
4. `sidecar/test/backend/send-message-integration.test.ts` - Full flow integration tests
5. `sidecar/test/backend/gemini-backend.test.ts` - Gemini-specific tests
6. `sidecar/test/backend/minimax-backend.test.ts` - MiniMax-specific tests
7. `sidecar/test/backend/azure-backend.test.ts` - Azure-specific tests
8. `sidecar/test/backend/openai-compatible-backend.test.ts` - OpenAI-compatible-specific tests
9. `sidecar/test/backend/backend-tester.ts` - Mock bridge and test utilities
10. `sidecar/test/utils.ts` - Shared test utilities

### Modified Files
1. `sidecar/package.json` - Add Vitest test framework
2. `sidecar/vitest.config.ts` - Vitest configuration

## Files to Modify

1. `sidecar/package.json` - Add test scripts and Vitest dependency
2. Create `sidecar/vitest.config.ts` for test configuration

## Acceptance Criteria

- [ ] `npm run test` runs all tests successfully
- [ ] Tool coverage test reports 0 missing tools (all 324 tools covered)
- [ ] Backend parity test passes for all backend pairs
- [ ] Each tool category has at least 3 representative tool tests
- [ ] Integration tests verify full `sendMessage` flow
- [ ] Each backend has specific tests for health check and configuration
- [ ] Test utilities can extract tool names from agent-tools.ts dynamically
- [ ] Tests run in < 60 seconds (unit tests only, no FreeCAD required)

## Definition of Done

- [ ] Vitest configured and running
- [ ] All 324 tools verified in switch statement coverage test
- [ ] Backend parity tests pass for all 5 backend pairs (10 pairs total)
- [ ] Tool code generation tests cover all major categories
- [ ] Integration tests verify tool execution flow
- [ ] Backend-specific tests verify health checks and configuration
- [ ] All tests pass with `npm run test:run`
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

**Performance Optimization and Caching for Tool Code Generation**

The 324 tools in agent-tools.ts each generate Python code via buildToolCode. This creates identical code strings repeatedly. Add caching layer to `VercelAIBackendBase.buildToolCode()` to cache generated Python code by tool name, reducing CPU overhead for repeated tool calls.
