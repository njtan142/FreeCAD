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
