## Status: COMPLETED

# Current Plan: Python WebSocket Execution Bridge

## Overview

Build a Python-based WebSocket server that runs inside FreeCAD's process, accepting Python code strings over WebSocket connections, executing them in FreeCAD's live interpreter, and returning results (stdout, stderr, return values). This is the foundational communication layer that the Node.js sidecar will connect to.

## Why This Step

Per PROJECT.md, this is the next item on the roadmap. The WebSocket bridge is the critical link between the external LLM agent and FreeCAD's internals. Without it, nothing else works. It has no dependencies on other unbuilt components -- it only needs FreeCAD's existing Python interpreter, which is already running.

## Design Decisions

1. **Pure Python implementation** -- no C++ changes needed for this step. FreeCAD's Python environment includes `asyncio` (stdlib). For WebSocket support we use `asyncio` low-level protocols or the `websockets` library (pip-installable). To avoid external dependencies initially, we will use a **simple TCP-based JSON protocol** first, with a thin wrapper that can be swapped to WebSocket later. Actually, since the Node.js sidecar needs standard WebSocket, we should use proper WebSocket from the start. We will include `websockets` as a dependency note, or implement a minimal WebSocket handshake manually.

2. **Threading model** -- FreeCAD's GUI runs on the main thread. Python execution in FreeCAD also happens on the main thread (with GIL). The WebSocket server must run in a **background thread** with its own asyncio event loop. When code needs to execute, it must be dispatched to the **main thread** using Qt's signal/slot mechanism (`QTimer.singleShot(0, callback)` or `QMetaObject.invokeMethod`). This is how the existing Python console works.

3. **FreeCAD Mod structure** -- We create a new module `src/Mod/LLMBridge/` following FreeCAD's standard module pattern (Init.py, InitGui.py, and the actual Python package).

## Files to Create

### 1. `src/Mod/LLMBridge/Init.py`
FreeCAD module registration (non-GUI). Sets up the module parameter group.

```python
ParGrp = App.ParamGet("System parameter:Modules").GetGroup("LLMBridge")
ParGrp.SetString("WorkBenchName", "LLMBridge")
ParGrp.SetString("WorkBenchModule", "LLMBridge.py")
```

### 2. `src/Mod/LLMBridge/InitGui.py`
GUI-side initialization. Auto-starts the WebSocket bridge server when FreeCAD GUI loads.

- Import and start the bridge server
- Register it so it can be stopped on shutdown

### 3. `src/Mod/LLMBridge/llm_bridge/__init__.py`
Package init.

### 4. `src/Mod/LLMBridge/llm_bridge/server.py`
The core WebSocket server. Key responsibilities:

- Run an asyncio event loop in a background thread
- Accept WebSocket connections on a configurable port (default: 9876)
- Receive JSON messages with structure: `{"type": "execute", "code": "...", "id": "request-uuid"}`
- Dispatch code execution to FreeCAD's main thread
- Capture stdout/stderr during execution using `io.StringIO` redirects
- Return JSON responses: `{"id": "request-uuid", "success": true/false, "result": "...", "stdout": "...", "stderr": "..."}`
- Handle connection lifecycle (connect, disconnect, errors)

Implementation approach:
- Use `websockets` library (asyncio-based). If not available, fall back to a raw-socket JSON-line protocol.
- Use `threading.Thread(daemon=True)` for the event loop thread.
- Use `FreeCADGui.getMainWindow()` and `QTimer.singleShot()` to marshal execution onto the main thread.
- Use `threading.Event` to wait for the main-thread execution to complete before sending the response.

### 5. `src/Mod/LLMBridge/llm_bridge/executor.py`
Python code executor that safely runs code in FreeCAD's interpreter context.

- Redirect stdout/stderr to capture output
- Execute code using `exec()` in a namespace that includes `FreeCAD`, `FreeCADGui`, `Part`, etc.
- Catch exceptions and format tracebacks
- Return structured results

### 6. `src/Mod/LLMBridge/llm_bridge/main_thread.py`
Utility for dispatching callables to FreeCAD's main (GUI) thread and waiting for results.

- Uses `QTimer.singleShot(0, callback)` pattern
- Returns a `concurrent.futures.Future` that resolves when execution completes
- Thread-safe

### 7. `src/Mod/LLMBridge/CMakeLists.txt`
CMake file to install the Python module files into the correct location.

## Files to Modify

### 8. `src/Mod/CMakeLists.txt`
Add `add_subdirectory(LLMBridge)` to include the new module in the build.

## Protocol Specification

### Request (client -> server)
```json
{
  "type": "execute",
  "code": "import Part\nbox = Part.makeBox(10, 10, 10)\nApp.ActiveDocument.addObject('Part::Feature', 'Box').Shape = box",
  "id": "uuid-string"
}
```

### Response (server -> client)
```json
{
  "id": "uuid-string",
  "success": true,
  "result": "None",
  "stdout": "",
  "stderr": ""
}
```

### Error Response
```json
{
  "id": "uuid-string",
  "success": false,
  "error": "NameError: name 'foo' is not defined",
  "traceback": "Traceback (most recent call last):\n  ...",
  "stdout": "",
  "stderr": ""
}
```

## Acceptance Criteria

1. **Module loads**: FreeCAD starts without errors with the LLMBridge module present
2. **Server starts**: On FreeCAD GUI startup, a WebSocket server begins listening on port 9876 (visible in FreeCAD's Python console output or Report View)
3. **Code execution works**: A simple WebSocket client (e.g., Python script or `wscat`) can connect and send an `execute` request with code like `FreeCAD.ActiveDocument.Name`, and receive a correct response
4. **Output capture**: stdout from `print()` calls in executed code is captured and returned in the response
5. **Error handling**: Invalid Python code returns a proper error response with traceback, does not crash FreeCAD
6. **Main thread execution**: Code that modifies the document or GUI (e.g., creating a Part::Box) works correctly because it runs on the main thread
7. **Clean shutdown**: When FreeCAD closes, the WebSocket server thread stops cleanly

## Dependencies

- Python `websockets` library (pip install). If unavailable, the server should log a clear error message explaining how to install it.
- No C++ compilation required for this step.

## Notes

- The `websockets` library is well-supported, async-native, and lightweight. It is the standard choice for Python WebSocket servers.
- We intentionally keep this step Python-only to enable fast iteration. The C++ dock widget comes in a later step.
- Port 9876 is arbitrary but unlikely to conflict. It should be configurable via FreeCAD preferences.
- Security: This binds to localhost only. No remote access by default.
