## Status: COMPLETED

# Current Plan: Node.js Sidecar with Claude Agent SDK

## Implementation Summary

All files from the plan have been created:

### Created Files:
1. `sidecar/package.json` - Node.js dependencies (`@anthropic-ai/claude-agent-sdk`, `ws`)
2. `sidecar/tsconfig.json` - TypeScript configuration
3. `sidecar/src/index.ts` - Main entry point with configuration and startup logic
4. `sidecar/src/dock-server.ts` - WebSocket server for dock widget (port 8765)
5. `sidecar/src/freecad-bridge.ts` - WebSocket client to FreeCAD Python bridge (port 8766)
6. `sidecar/src/agent-tools.ts` - Custom tools for Claude Agent SDK
7. `sidecar/README.md` - Setup instructions

## Acceptance Criteria Status

- [x] Uses `@anthropic-ai/claude-agent-sdk` for Claude integration
- [x] Uses `ws` package for WebSocket support
- [x] Implements `execute_freecad_python(code: string)` tool
- [x] Dock widget server listens on port 8765
- [x] FreeCAD bridge connects to port 8766 (Python side)
- [x] Configuration via environment variables
- [x] Error handling when connections unavailable
- [x] Additional tools: `query_model_state`, `export_model`

## Notes

- TypeScript project with ES2022 target
- Graceful shutdown handling (SIGINT, SIGTERM)
- Automatic reconnection logic for FreeCAD bridge (up to 3 attempts)
- 30-second timeout on Python code execution
- Non-blocking connection attempts (won't fail if FreeCAD not running)

## Original Plan (Reference)

### Overview

Build the Node.js sidecar that bridges Claude Agent SDK with FreeCAD's Python execution environment. The sidecar runs as an external process that:
- Accepts WebSocket connections from the FreeCAD LLM dock widget
- Uses Claude Agent SDK to process natural language requests
- Executes generated Python code via the FreeCAD WebSocket bridge
- Returns results back to the dock widget

### Why This Step

Per PROJECT.md, after the LLM dock widget (completed), the next component is the Node.js sidecar. This provides the intelligence layer that processes user requests and translates them into FreeCAD Python API calls.

### Design Decisions

1. **Modular architecture** -- Separate concerns into distinct modules:
   - `index.ts`: Application bootstrap and configuration
   - `dock-server.ts`: WebSocket server for dock widget communication
   - `freecad-bridge.ts`: WebSocket client to FreeCAD Python bridge
   - `agent-tools.ts`: Custom tool definitions for Claude Agent SDK

2. **Environment-based configuration** -- Use environment variables for ports and hosts to allow easy customization without code changes.

3. **Resilient connections** -- Implement automatic reconnection logic for the FreeCAD bridge with exponential backoff.

4. **Tool-based approach** -- Define custom tools that Claude can call, providing clear separation between AI decision-making and execution.

5. **Error handling** -- Graceful degradation when FreeCAD is not running; non-blocking connection attempts.

### Files Created

1. `sidecar/package.json` - Dependencies and scripts
2. `sidecar/tsconfig.json` - TypeScript configuration
3. `sidecar/src/index.ts` - Main entry point
4. `sidecar/src/dock-server.ts` - WebSocket server
5. `sidecar/src/freecad-bridge.ts` - WebSocket client
6. `sidecar/src/agent-tools.ts` - Custom tools
7. `sidecar/README.md` - Documentation

### Next Step After This

End-to-end integration testing:
1. Start FreeCAD with LLMBridge module
2. Start the Node.js sidecar
3. Test dock widget communication
4. Verify Python code execution
5. Test Claude Agent SDK integration
