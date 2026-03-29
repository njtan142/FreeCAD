# Cycle 20 Review (Re-Review): Multi-Agent Backend Support - OpenCode Integration

## Status: IN PROGRESS - Build Errors Prevent Compilation

## Verdict: FAIL - TypeScript compilation errors must be fixed

---

## Critical Issues (From Previous Review - Status)

### 1. Backend `sendMessage()` Never Called
**Status:** ✅ FIXED

The `dock-server.ts:323` now properly calls `backend.sendMessage()`:
```typescript
const response = await backend.sendMessage(
  fullPrompt,
  context,
  tools,
  (chunk: string) => { ... }
);
```

---

### 2. Missing `mcp-tool-wrapper.ts` File
**Status:** ✅ FIXED

The `claude-backend.ts` no longer references this file. The old `claude-code-process.ts` still has the reference but is not imported anywhere (superseded by `claude-backend.ts`).

---

### 3. API Key Passed as Command-Line Argument
**Status:** ✅ FIXED

`opencode-backend.ts:47-49` now uses environment variable:
```typescript
const env = { ...process.env };
if (this.config.apiKey) {
  env.OPENAI_API_KEY = this.config.apiKey;
}
```

---

### 4. Message Passed as CLI Argument
**Status:** ✅ FIXED

`opencode-backend.ts:95-102` now uses stdin:
```typescript
const input = JSON.stringify({
  message: fullMessage,
  tools: translatedTools,
}) + '\n';

proc.stdin?.write(input, () => {
  proc.stdin?.end();
});
```

---

### 5. Unused `MCPToolTranslator` Class
**Status:** ✅ FIXED

Source `tool-translator.ts` only contains `OpenCodeToolTranslator`. Note: `dist/` files are stale and still contain old code.

---

### 6. Type Definition Duplication
**Status:** ✅ FIXED

`agent-backend.ts:7-8` imports from `types.ts` and re-exports:
```typescript
import { ToolCall, BackendConfig, MCPTool } from './types';
export { ToolCall, BackendConfig, MCPTool };
```

---

### 7. Silent Error Ignores
**Status:** ✅ FIXED

`backend-config.ts:73-75, 84-85` now uses `console.warn`:
```typescript
} catch (err) {
  console.warn('[BackendConfig] Failed to load opencode config:', ...);
}
```

---

## New Critical Issues

### 8. TypeScript Build Errors
**Location:** `sidecar/src/dock-server.ts:69-70`

```typescript
documentInfo: this.config.freeCADBridge.getDocumentInfo?.() ?? undefined,
selectedObjects: this.config.freeCADBridge.getSelectedObjects?.() ?? undefined,
```

**Problem:** `FreeCADBridge` class does not have `getDocumentInfo` or `getSelectedObjects` methods. These are called with optional chaining but TypeScript still errors because the properties don't exist on the type.

**Impact:** Code does not compile (`npm run build` fails).

**Fix Required:** Either:
1. Add `getDocumentInfo()` and `getSelectedObjects()` methods to `FreeCADBridge` class
2. Or remove these calls and use Python code execution to get this information

---

## Verification Summary

| Issue | Status |
|-------|--------|
| Backend sendMessage() called | ✅ FIXED |
| mcp-tool-wrapper.ts exists | ✅ FIXED |
| API key via env var | ✅ FIXED |
| Message via stdin | ✅ FIXED |
| MCPToolTranslator removed | ✅ FIXED |
| Type duplication resolved | ✅ FIXED |
| Error logging added | ✅ FIXED |
| Code compiles | ❌ BROKEN |

---

## Plan Compliance Analysis

| Plan Item | Status | Notes |
|-----------|--------|-------|
| `agent-backend.ts` interface | ✅ Done | Correctly implements `AgentBackend` interface |
| `claude-backend.ts` | ✅ Done | Backend adapter properly implemented |
| `opencode-backend.ts` | ✅ Done | Backend adapter properly implemented |
| `backend-registry.ts` | ✅ Done | Registry works correctly |
| `tool-translator.ts` | ✅ Done | Only `OpenCodeToolTranslator` exists |
| `backend-config.ts` | ✅ Done | Config loading works with proper logging |
| `index.ts` CLI args | ✅ Done | Backend selection CLI works |
| `types.ts` updates | ✅ Done | Types properly defined and exported |
| **Build succeeds** | ❌ FAIL | TypeScript errors prevent compilation |

---

## Files Reviewed
- `sidecar/src/dock-server.ts` - Backend integration works, but build errors
- `sidecar/src/backends/opencode-backend.ts` - Security fixes verified
- `sidecar/src/backends/claude-backend.ts` - Properly refactored
- `sidecar/src/backend-registry.ts` - Correct implementation
- `sidecar/src/backend-config.ts` - Proper error logging
- `sidecar/src/agent-backend.ts` - Clean interface, imports from types.ts
- `sidecar/src/tool-translator.ts` - Only one translator class
- `sidecar/src/index.ts` - Proper backend initialization
- `sidecar/src/types.ts` - Single source of truth for types
- `sidecar/src/freecad-bridge.ts` - Missing methods referenced by dock-server

---

## Recommendation

**Before this cycle can be marked complete:**

1. **Fix TypeScript build errors** - Add missing methods to `FreeCADBridge` or refactor `buildMessageContext()` to not use them
2. **Rebuild dist files** - Current compiled output is stale and contains old code
3. **Verify runtime** - Once compiled, verify backend switching actually works end-to-end
