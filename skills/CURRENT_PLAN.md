## Status: IN PROGRESS (Cycle 20)

# Cycle 20: Multi-Agent Backend Support - OpenCode Integration

## Overview

Add OpenCode as an alternative agent backend to the FreeCAD LLM integration. OpenCode supports multiple LLM providers (OpenAI, Anthropic, Google, local models) and would allow users to use GPT-4, Gemini, or local models for CAD operations.

This requires an adapter layer to translate between OpenCode's tool protocol and our MCP tools, plus backend abstraction in the sidecar.

## Prerequisites

- `sidecar/src/index.ts` - Current main entry point (tightly coupled to Claude Agent SDK)
- `sidecar/src/agent-tools.ts` - Existing MCP tool definitions
- `sidecar/src/dock-server.ts` - WebSocket server for dock widget
- `sidecar/src/freecad-bridge.ts` - WebSocket client to FreeCAD
- `sidecar/src/session-manager.ts` - Session management
- `sidecar/src/context-injector.ts` - Context injection

## Tasks

### 1. Backend Abstraction Layer

**File**: `sidecar/src/agent-backend.ts` (new file)

Create the agent backend interface:

```typescript
export interface AgentBackend {
  name: string;
  description: string;
  
  // Initialize the backend with config
  initialize(config: BackendConfig): Promise<void>;
  
  // Send a message and get response stream
  sendMessage(
    message: string,
    context: MessageContext,
    tools: MCPTool[],
    onChunk: (chunk: string) => void
  ): Promise<AgentResponse>;
  
  // Check if backend is available/healthy
  healthCheck(): Promise<boolean>;
  
  // Cleanup
  disconnect(): Promise<void>;
}

export interface BackendConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  error?: string;
}
```

**Acceptance Criteria**:
- [ ] Interface is clean and minimal
- [ ] All required methods defined
- [ ] TypeScript types properly exported

### 2. Claude Backend Adapter (Refactor)

**File**: `sidecar/src/backends/claude-backend.ts` (new file)

Refactor existing Claude Code logic into a proper backend adapter:

```typescript
import { AgentBackend, BackendConfig, AgentResponse } from '../agent-backend';
import { MessageContext, MCPTool } from '../types';

export class ClaudeBackend implements AgentBackend {
  readonly name = 'claude';
  readonly description = 'Anthropic Claude (via Claude Code CLI)';
  
  private childProcess: ChildProcess | null = null;
  
  async initialize(config: BackendConfig): Promise<void> { ... }
  async sendMessage(...): Promise<AgentResponse> { ... }
  async healthCheck(): Promise<boolean> { ... }
  async disconnect(): Promise<void> { ... }
}
```

**Acceptance Criteria**:
- [ ] Existing Claude Code functionality preserved
- [ ] Implements AgentBackend interface
- [ ] Proper process management for CLI

### 3. OpenCode Backend Adapter

**File**: `sidecar/src/backends/opencode-backend.ts` (new file)

Create OpenCode backend adapter:

```typescript
import { AgentBackend, BackendConfig, AgentResponse } from '../agent-backend';
import { MessageContext, MCPTool } from '../types';
import { spawn } from 'child_process';
import { ToolCall } from '../types';

export class OpenCodeBackend implements AgentBackend {
  readonly name = 'opencode';
  readonly description = 'Multi-LLM backend (OpenAI, Anthropic, Google, local)';
  
  private process: ChildProcess | null = null;
  private MessageContext: MessageContext;
  
  async initialize(config: BackendConfig): Promise<void> { ... }
  
  async sendMessage(
    message: string,
    context: MessageContext,
    tools: MCPTool[],
    onChunk: (chunk: string) => void
  ): Promise<AgentResponse> { ... }
  
  async healthCheck(): Promise<boolean> { ... }
  async disconnect(): Promise<void> { ... }
  
  // OpenCode-specific tool translation
  private translateToolsToOpenCode(tools: MCPTool[]): any { ... }
  private parseOpenCodeResponse(response: any): AgentResponse { ... }
}
```

Key implementation details:
- OpenCode uses a different tool calling format (function_call vs tool_use)
- Need to translate our MCP tool definitions to OpenCode's format
- OpenCode streams responses via stdout
- Configuration via environment variables or config file

**Acceptance Criteria**:
- [ ] Connects to OpenCode CLI
- [ ] Sends properly formatted tools to OpenCode
- [ ] Receives and parses tool call responses
- [ ] Streams responses back to caller

### 4. Backend Registry

**File**: `sidecar/src/backend-registry.ts` (new file)

Central registry for backend management:

```typescript
import { AgentBackend } from './agent-backend';
import { ClaudeBackend } from './backends/claude-backend';
import { OpenCodeBackend } from './backends/opencode-backend';

export class BackendRegistry {
  private backends: Map<string, AgentBackend> = new Map();
  private currentBackend: AgentBackend | null = null;
  
  register(backend: AgentBackend): void { ... }
  get(name: string): AgentBackend | undefined { ... }
  setCurrent(name: string): void { ... }
  getCurrent(): AgentBackend | null { ... }
  listBackends(): Array<{name: string, description: string}> { ... }
}

export const backendRegistry = new BackendRegistry();
```

**Acceptance Criteria**:
- [ ] Can register multiple backends
- [ ] Can switch between backends
- [ ] Current backend is tracked

### 5. Backend Selection in Main Entry

**File**: `sidecar/src/index.ts` (modify)

Update main entry point to support backend selection:

```typescript
import { backendRegistry } from './backend-registry';
import { OpenCodeBackend } from './backends/opencode-backend';
import { ClaudeBackend } from './backends/claude-backend';

// CLI argument parsing
const args = parseArgs(process.argv);
const selectedBackend = args.backend || 'claude';

// Register backends
backendRegistry.register(new ClaudeBackend());
backendRegistry.register(new OpenCodeBackend());

// Initialize selected backend
const backend = backendRegistry.get(selectedBackend);
if (!backend) {
  console.error(`Unknown backend: ${selectedBackend}`);
  process.exit(1);
}

await backend.initialize(getBackendConfig(selectedBackend));
```

CLI flags:
- `--backend <name>` or `-b <name>` - Select backend (default: claude)
- `--list-backends` - List available backends
- `--openai`, `--anthropic`, `--google` - Quick backend+provider selection

**Acceptance Criteria**:
- [ ] Default backend is Claude (backward compatible)
- [ ] `--backend opencode` switches to OpenCode
- [ ] `--list-backends` shows available options
- [ ] Environment variables configure each backend

### 6. Tool Translation Layer

**File**: `sidecar/src/tool-translator.ts` (new file)

Translate between MCP tool format and backend-specific formats:

```typescript
import { MCPTool } from './types';

export interface ToolTranslator {
  toBackendFormat(tools: MCPTool[]): any;
  fromBackendFormat(response: any): ToolCall[];
}

export class OpenCodeToolTranslator implements ToolTranslator {
  toBackendFormat(tools: MCPTool[]): any {
    // Convert MCP tools to OpenCode function format
    // OpenCode uses: { functions: [{ name, description, parameters }] }
  }
  
  fromBackendFormat(response: any): ToolCall[] {
    // Parse OpenCode's function_call responses to our ToolCall format
  }
}

export class MCPToolTranslator implements ToolTranslator {
  // For Claude which already uses MCP-like format
  toBackendFormat(tools: MCPTool[]): any { ... }
  fromBackendFormat(response: any): ToolCall[] { ... }
}
```

**Acceptance Criteria**:
- [ ] MCP tools correctly translated to OpenCode format
- [ ] OpenCode responses correctly parsed to ToolCall[]
- [ ] Error handling for malformed responses

### 7. Backend Configuration

**File**: `sidecar/src/backend-config.ts` (new file)

Load and manage backend-specific configuration:

```typescript
export function getBackendConfig(backendName: string): BackendConfig {
  switch (backendName) {
    case 'opencode':
      return {
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL || 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY,
      };
    case 'claude':
    default:
      return {
        // Claude uses CLI, no API config needed
      };
  }
}

export function loadOpenCodeConfig(): void {
  // Read ~/.opencode/config or ./opencode.config.json
  // Environment variables override config file
}
```

**Acceptance Criteria**:
- [ ] Environment variables take precedence
- [ ] Config file support for OpenCode
- [ ] Clear error messages for missing required config

### 8. Update Types

**File**: `sidecar/src/types.ts` (modify)

Add ToolCall type if not present, ensure all types export:

```typescript
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface BackendConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
```

### 9. Test End-to-End

**Test Scenarios**:

1. **List Backends**:
   - Command: `npm start -- --list-backends`
   - Verify: Shows "claude" and "opencode" backends

2. **Switch to OpenCode**:
   - Command: `npm start -- --backend opencode`
   - Verify: Connects using OpenCode
   - Verify: Tools are translated correctly
   - Verify: Responses stream properly

3. **OpenAI Provider**:
   - Set: `OPENAI_API_KEY=xxx OPENAI_MODEL=gpt-4`
   - Command: `npm start -- --backend opencode`
   - Verify: Connects to OpenAI API

4. **Tool Call Round-Trip**:
   - Send: "Create a box 10x10x10"
   - Verify: OpenCode receives properly formatted tools
   - Verify: Tool call returned and executed in FreeCAD

5. **Error Handling**:
   - Missing API key: Clear error message
   - Invalid backend: Lists available backends
   - Backend disconnects: Graceful error handling

**Acceptance Criteria**:
- [ ] All scenarios pass
- [ ] Both Claude and OpenCode backends work
- [ ] Tool translation is accurate

## Files to Create/Modify

### New Files:
1. `sidecar/src/agent-backend.ts` - Backend interface
2. `sidecar/src/backends/claude-backend.ts` - Refactored Claude backend
3. `sidecar/src/backends/opencode-backend.ts` - OpenCode backend adapter
4. `sidecar/src/backend-registry.ts` - Backend registry
5. `sidecar/src/tool-translator.ts` - Tool format translation
6. `sidecar/src/backend-config.ts` - Backend configuration

### Modified Files:
1. `sidecar/src/index.ts` - Add backend selection CLI args
2. `sidecar/src/types.ts` - Add ToolCall type, BackendConfig

## Dependencies

- OpenCode CLI (`npm install -g opencode`)
- Existing sidecar infrastructure
- Environment variable support for API keys

## Out of Scope

This plan does NOT include:
- Gemini CLI specific integration (deferred to after OpenCode)
- Backend-specific UI dropdown in LLM dock widget (future work)
- Streaming JSON for large responses (future optimization)
- Backend health monitoring and failover (future work)

## Definition of Done

- [x] AgentBackend interface defined
- [x] Claude backend refactored to adapter pattern
- [x] OpenCode backend adapter implemented
- [x] Backend registry created
- [x] Tool translation layer working
- [x] CLI backend selection works
- [x] Environment variable configuration works
- [x] End-to-end tests pass (OpenCode with GPT-4)
- [ ] Documentation updated
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

Once Multi-Agent Backend Support is complete:
- CAM/Path workbench tools for CNC operations
- Advanced surface modeling tools (blend, offset, sections)
