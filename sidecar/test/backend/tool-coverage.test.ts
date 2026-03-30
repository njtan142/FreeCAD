import { describe, it, expect } from 'vitest';
import { extractToolNamesFromAgentTools, extractSwitchCases } from '../utils';
import * as fs from 'fs';
import * as path from 'path';

describe('Tool Coverage', () => {
  const agentToolsContent = fs.readFileSync(
    path.join(__dirname, '../../src/agent-tools.ts'),
    'utf-8'
  );
  const baseBackendContent = fs.readFileSync(
    path.join(__dirname, '../../src/backends/vercel-ai-backend-base.ts'),
    'utf-8'
  );

  it('should have cases for all tools in agent-tools.ts', () => {
    const agentTools = extractToolNamesFromAgentTools(agentToolsContent);
    const switchCases = extractSwitchCases(baseBackendContent);
    
    const missing = agentTools.filter(t => !switchCases.has(t));
    if (missing.length > 0) {
      console.log('Missing tools:', missing);
    }
    expect(missing).toHaveLength(0);
  });
});
