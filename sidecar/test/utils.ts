export interface MockBridgeResponses {
  executePython?: (code: string) => Promise<{ success: boolean; output: string; error?: string }>;
  isConnected?: () => boolean;
  connect?: () => Promise<void>;
}

export function createMockBridge(responses: MockBridgeResponses) {
  return {
    isConnected: responses.isConnected || (() => true),
    connect: responses.connect || (async () => {}),
    executePython: responses.executePython || (async () => ({ success: true, output: '{}' })),
  };
}

export function extractToolNamesFromAgentTools(content: string): string[] {
  const regex = /name:\s*['"]([^'"]+)['"]/g;
  const names: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    names.push(match[1]);
  }
  return names;
}

export function extractSwitchCases(buildToolCodeContent: string): Set<string> {
  const regex = /case\s+['"]([^'"]+)['"]/g;
  const cases = new Set<string>();
  let match;
  while ((match = regex.exec(buildToolCodeContent)) !== null) {
    cases.add(match[1]);
  }
  return cases;
}

export function categorizeToolsByHandler(toolNames: string[]): Map<string, string[]> {
  const handlerMap: Map<string, string[]> = new Map();
  
  const handlerPatterns: Record<string, RegExp[]> = {
    'draft': [/linear_dimension/, /radial_dimension/, /angular_dimension/, /ordinate_dimension/],
    'sketcher': [/sketch/, /sketcher_geometry/, /sketch_constraint/],
    'part_design': [/pad/, /pocket/, /revolution/, /groove/, /fillet/, /chamfer/, /hole/, /boolean/],
    'assembly': [/assembly/, /kinematic_solver/, /joint/],
    'drawing': [/drawing/, /dimension/, /projection/],
    'render': [/render/, /raytracing/],
    'path': [/path_job/, /tool/, /milling/, /cutting/, /path/],
    'surface': [/surface/, /mesh/, /refine/],
    'inspection': [/measure/, /distance/, /area/, /volume/],
    'spreadsheet': [/spreadsheet/, /cell/],
    ' FEM ': [/fea/, /analysis/, /mesh/, /constraint/, /result/],
    'arch': [/wall/, /structure/, /window/, /door/, /roof/],
  };

  for (const toolName of toolNames) {
    let assigned = false;
    for (const [handler, patterns] of Object.entries(handlerPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(toolName)) {
          const existing = handlerMap.get(handler) || [];
          existing.push(toolName);
          handlerMap.set(handler, existing);
          assigned = true;
          break;
        }
      }
      if (assigned) break;
    }
    if (!assigned) {
      const other = handlerMap.get('other') || [];
      other.push(toolName);
      handlerMap.set('other', other);
    }
  }

  return handlerMap;
}
