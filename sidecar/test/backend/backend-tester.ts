import { Mock } from 'vitest';
import { FreeCADBridge } from '../../src/backends/vercel-ai-backend-base';

export interface MockFreeCADBridge extends FreeCADBridge {
  executePython: Mock<Promise<{ success: boolean; output: string; error?: string }>, [string]>;
  isConnected: Mock<boolean, []>;
  connect: Mock<Promise<void>, []>;
  executionHistory: string[];
}

export function createMockBridge() {
  const executionHistory: string[] = [];
  
  const mockBridge: MockFreeCADBridge = {
    isConnected: vi.fn(() => true),
    connect: vi.fn(async () => {}),
    executePython: vi.fn(async (code: string) => {
      executionHistory.push(code);
      return { success: true, output: '{"success": true}' };
    }),
    executionHistory,
  };

  return mockBridge;
}

export function createFailingMockBridge() {
  return {
    isConnected: vi.fn(() => false),
    connect: vi.fn(async () => {
      throw new Error('Connection failed');
    }),
    executePython: vi.fn(async () => ({
      success: false,
      output: '',
      error: 'Bridge not connected',
    })),
  };
}

export function createSuccessfulMockBridge(output: string) {
  return {
    isConnected: vi.fn(() => true),
    connect: vi.fn(async () => {}),
    executePython: vi.fn(async () => ({
      success: true,
      output,
    })),
  };
}
