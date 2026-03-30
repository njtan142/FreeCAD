import { FreeCADBridge } from '../../src/backends/vercel-ai-backend-base';

export interface MockFreeCADBridge extends FreeCADBridge {
  executePython: jest.Mock<Promise<{ success: boolean; output: string; error?: string }>, [string]>;
  isConnected: jest.Mock<boolean, []>;
  connect: jest.Mock<Promise<void>, []>;
  executionHistory: string[];
}

export function createMockBridge() {
  const executionHistory: string[] = [];
  
  const mockBridge: MockFreeCADBridge = {
    isConnected: jest.fn(() => true),
    connect: jest.fn(async () => {}),
    executePython: jest.fn(async (code: string) => {
      executionHistory.push(code);
      return { success: true, output: '{"success": true}' };
    }),
    executionHistory,
  };

  return mockBridge;
}

export function createFailingMockBridge() {
  return {
    isConnected: jest.fn(() => false),
    connect: jest.fn(async () => {
      throw new Error('Connection failed');
    }),
    executePython: jest.fn(async () => ({
      success: false,
      output: '',
      error: 'Bridge not connected',
    })),
  };
}

export function createSuccessfulMockBridge(output: string) {
  return {
    isConnected: jest.fn(() => true),
    connect: jest.fn(async () => {}),
    executePython: jest.fn(async () => ({
      success: true,
      output,
    })),
  };
}
