# Cycle 20 Review: Multi-Agent Backend Support - OpenCode Integration

## Status: INCOMPLETE - MAJOR ARCHITECTURAL ISSUES

## Verdict: FAIL - Backend abstraction is not integrated into message flow

---

## Critical Issues

### 1. Backend `sendMessage()` Never Called
**Location:** `sidecar/src/dock-server.ts:326` and `sidecar/src/index.ts`

**Problem:** The backends (`ClaudeBackend`, `OpenCodeBackend`) are registered and initialized in `index.ts`, but their `sendMessage()` method is **never called**. The `dock-server.ts` still uses `query()` from `@anthropic-ai/claude-agent-sdk` directly (line 326).

**Evidence:**
```typescript
// index.ts lines 198-205: Backend is initialized
await backend.initialize(backendConfig);
backendRegistry.setCurrent(selectedBackend);

// BUT in dock-server.ts lines 326-334, the old SDK is still used directly:
const queryGenerator = query({
  prompt: fullPrompt,
  options: {
    mcpServers: {
      'freecad-tools': this.mcpServer,
    },
    maxTurns: 30,
  },
});
```

**Impact:** The entire backend abstraction layer is dead code. Messages are still routed through the Claude Agent SDK regardless of which backend is selected.

---

### 2. Missing `mcp-tool-wrapper.ts` File
**Location:** `sidecar/src/backends/claude-backend.ts:41`

```typescript
args: ['ts-node', path.join(__dirname, 'mcp-tool-wrapper.ts'), tool.name],
```

**Problem:** This file does not exist in the repository. The `createMcpConfig()` method references a wrapper script that was never created.

**Impact:** If the backend were ever actually used, it would fail when trying to spawn the MCP tool wrapper.

---

### 3. API Key Passed as Command-Line Argument
**Location:** `sidecar/src/backends/opencode-backend.ts:114-115`

```typescript
if (this.config.apiKey) {
  args.push('--api-key', this.config.apiKey);
}
```

**Security Issue:** Passing API keys as command-line arguments exposes them in:
- Process lists (`ps aux` or Task Manager)
- Shell history
- Log files

**Recommendation:** Use environment variables instead, or a configuration file.

---

### 4. Message Passed as CLI Argument Without Sanitization
**Location:** `sidecar/src/backends/opencode-backend.ts:128`

```typescript
args.push(message);
```

**Potential Issue:** The user message is passed directly as a command-line argument. If the message contains shell metacharacters, it could cause issues. While `spawn` with array arguments is safer than shell execution, the message could still cause CLI parsing issues.

---

## Medium Issues

### 5. Unused `MCPToolTranslator` Class
**Location:** `sidecar/src/tool-translator.ts:115-151`

The `MCPToolTranslator` class is defined but never instantiated or used by any backend. The `OpenCodeToolTranslator` is used by `OpenCodeBackend`, but `MCPToolTranslator` is dead code.

---

### 6. Type Definition Duplication
**Location:** `sidecar/src/agent-backend.ts:32-40` vs `sidecar/src/types.ts:19-27`

`BackendConfig` is defined in both files with identical structure. This could lead to confusion and maintenance issues.

---

### 7. Incomplete Error Handling for `loadOpenCodeConfig`
**Location:** `sidecar/src/backend-config.ts:73,84`

```typescript
} catch (err) {
  // Config file doesn't exist or is invalid, ignore
}
```

The error is caught but silently ignored. If there's a JSON parse error or permission issue, the user won't know.

---

## Plan Compliance Analysis

| Plan Item | Status | Notes |
|-----------|--------|-------|
| `agent-backend.ts` interface | ✅ Done | Correctly implements `AgentBackend` interface |
| `claude-backend.ts` | ⚠️ Partial | Backend adapter exists but never called; references missing file |
| `opencode-backend.ts` | ⚠️ Partial | Backend adapter exists but never called |
| `backend-registry.ts` | ✅ Done | Registry works correctly |
| `tool-translator.ts` | ⚠️ Partial | `OpenCodeToolTranslator` used, `MCPToolTranslator` unused |
| `backend-config.ts` | ✅ Done | Config loading works |
| `index.ts` CLI args | ✅ Done | Backend selection CLI works |
| `types.ts` updates | ✅ Done | `ToolCall` and `BackendConfig` added |
| README documentation | ✅ Done | Documentation updated |

---

## Summary

The Cycle 20 implementation created the **skeleton** of a multi-backend architecture but did not **integrate** it into the actual message flow. The dock-server still uses the Claude Agent SDK directly, making the backend abstraction layer non-functional.

**To fix this, the dock-server would need to:**
1. Import the `backendRegistry` from `index.ts`
2. Replace the `query()` call with `backend.sendMessage()`
3. Handle streaming responses via the `onChunk` callback
4. Remove the direct dependency on `@anthropic-ai/claude-agent-sdk` for message processing

This is a significant architectural change that was not completed in Cycle 20.

---

## Files Changed
- `sidecar/src/agent-backend.ts` - New
- `sidecar/src/backends/claude-backend.ts` - New
- `sidecar/src/backends/opencode-backend.ts` - New
- `sidecar/src/backend-registry.ts` - New
- `sidecar/src/tool-translator.ts` - New
- `sidecar/src/backend-config.ts` - New
- `sidecar/src/index.ts` - Modified
- `sidecar/src/types.ts` - Modified
- `sidecar/README.md` - Modified
