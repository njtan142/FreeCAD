# FreeCAD LLM Sidecar - Bug Fixes and Architecture

## Overview

This document describes the LLM Sidecar implementation for FreeCAD and the bugs that were found and fixed during debugging.

## Architecture

### Components

1. **FreeCAD LLM Panel (C++)** - `src/Gui/LLMDockWidget.cpp`
   - UI component that sends user messages and displays responses
   - Communicates with Python bridge via C++ callbacks

2. **Python Bridge** - `src/Mod/LLMBridge/llm_bridge/`
   - `llm_panel_bridge.py` - Manages connection to sidecar, handles callbacks
   - `sidecar_client.py` - WebSocket client that connects to the Node.js sidecar

3. **Node.js Sidecar** - `sidecar/src/`
   - `dock-server.ts` - WebSocket server that receives chat messages and calls Claude Agent SDK
   - `freecad-bridge.ts` - WebSocket client that queries FreeCAD for context injection
   - `context-injector.ts` - Builds context prompts from FreeCAD state

### Communication Flow

```
User types message in FreeCAD UI
    ↓
C++ LLMDockWidget sends to Python bridge (via llm_panel_bridge.send_message)
    ↓
Python sidecar_client sends to Node.js sidecar (WebSocket port 8765)
    ↓
Node.js dock-server receives, calls Claude Agent SDK (query())
    ↓
SDK calls tools → freecad-bridge → FreeCAD Python bridge (WebSocket port 8766)
    ↓
Response flows back through the chain to the UI
```

## Bugs Found and Fixed

### Bug 1: FreeCADBridge Promise Never Resolved

**File:** `sidecar/src/freecad-bridge.ts`

**Problem:** The `executePython()` method sent messages to FreeCAD and waited for responses, but the response handling never resolved the promise.

**Root Cause:** The Python side (FreeCAD) sends messages with `success`, `stdout`, `result` fields but NO `type` field. The TypeScript code checked for `message.type === 'result' || message.type === 'response'` which was always false.

**Fix:**
```typescript
// Before:
if (message.type === 'result' || message.type === 'response') {

// After:
if (message.type === 'result' || message.type === 'response' || message.success !== undefined) {
```

### Bug 2: Wrong Output Field Used

**File:** `sidecar/src/freecad-bridge.ts`

**Problem:** When resolving the promise, the code used `message.output || message.result` but Python sends the actual data in `stdout`.

**Fix:**
```typescript
// Before:
output: message.output || message.result || ''

// After:
const output = message.stdout || message.output || message.result || '';
```

### Bug 3: Query Error Caught and Overwritten

**File:** `sidecar/src/dock-server.ts`

**Problem:** When the SDK returned an error result (like rate limit), the `queryError` was properly set, but then the `catch` block overwrote it with "Claude Code process exited with code 1".

**Fix:**
```typescript
// Before:
} catch (error) {
  queryError = error instanceof Error ? error.message : 'Unknown query error';
}

// After:
} catch (error) {
  if (!queryError) {
    queryError = error instanceof Error ? error.message : 'Unknown query error';
  }
}
```

### Bug 4: Error Responses Not Displayed in UI

**File:** `sidecar/src/dock-server.ts`

**Problem:** When `message.is_error === true`, the error message was being appended to `fullResponse` instead of being treated as an error.

**Fix:**
```typescript
// Before:
if (message.subtype === 'success') {
  fullResponse += message.result;
} else {
  queryError = `Query failed: ${message.errors?.join(', ') || message.subtype}`;
}

// After:
if (message.subtype === 'success' && message.is_error !== true) {
  fullResponse += (message as any).result || '';
} else {
  queryError = `Query failed: ${(message as any).result || (message as any).errors?.join(', ') || message.subtype}`;
}
```

### Bug 5: C++ Response Callback Never Called

**File:** `src/Mod/LLMBridge/llm_bridge/llm_panel_bridge.py`

**Problem:** The `_on_response` function only called registered Python callbacks (`_response_callbacks`), but nothing was ever registered there. The C++ side has a `response_callback` function defined but it was never called.

**Fix:** Modified `_on_response` to also call the C++ `response_callback` directly:
```python
# Also call the C++ response_callback directly for backward compatibility
try:
    import llm_bridge.llm_panel_bridge as mp_bridge
    if hasattr(mp_bridge, 'response_callback'):
        mp_bridge.response_callback(response)
except Exception as e:
    App.Console.PrintError(f"LLMPanelBridge: C++ callback error - {e}\n")
```

## Message Format

### Sidecar → Python Client

The sidecar sends messages with this format:
```json
{
  "type": "error" | "response" | "status",
  "content": "message text",
  "timestamp": 1234567890
}
```

### Python Client → Sidecar

```json
{
  "type": "chat",
  "message": "user message",
  "conversation_id": "uuid",
  "history": [{"role": "user", "content": "..."}]
}
```

## Running the Sidecar

```bash
# Development mode (uses ts-node, auto-reloads)
npm run sidecar:dev

# Production mode (uses compiled JS)
npm run sidecar:start
```

## Important Notes

1. **Rate Limits**: When using Claude API, rate limits will cause error responses to be sent back with `type: "error"` and `is_error: true`.

2. **Context Injection**: Before each chat message, the sidecar queries FreeCAD for document info and selection state to provide context to the LLM.

3. **WebSocket Ports**:
   - 8765: DockServer (receives chat from FreeCAD)
   - 8766: FreeCADBridge (queries FreeCAD from sidecar)

## Debugging

Enable verbose logging in `dock-server.ts` and `freecad-bridge.ts` by setting `console.log` statements. The sidecar outputs show:
- SDK message types and contents
- FreeCAD bridge communication
- Context injection progress
