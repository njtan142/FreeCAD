## Status: COMPLETED

# Current Plan: End-to-End Integration Testing

## Overview

Connect all components and verify the complete system works end-to-end:
1. FreeCAD with LLMBridge module (Python WebSocket server on port 8766)
2. LLM Dock Widget (Qt/C++ with sidecar client on port 8765)
3. Node.js Sidecar (Claude Agent SDK + WebSocket servers)

This step ensures all pieces communicate correctly before adding more features.

## Completion Summary

All tasks completed successfully:
- Created environment variable template (`sidecar/.env.example`)
- Created Windows startup script (`scripts/start-llm-integration.bat`)
- Created Linux/Mac startup script (`scripts/start-llm-integration.sh`)
- Created integration guide (`skills/INTEGRATION_GUIDE.md`)
- Fixed port configuration mismatches in FreeCAD Python bridge
- Verified all component connections

## Blockers

None currently.

## Prerequisites

The following must already exist:
- `src/Mod/LLMBridge/` - Python WebSocket execution bridge
- `src/Gui/LLMDockWidget.cpp/.h` - LLM dock widget
- `src/Gui/LLMChatWidget.cpp/.h` - Chat UI component
- `sidecar/` - Node.js sidecar with Claude Agent SDK

## Tasks

### 1. Verify LLMBridge Module Startup

**File**: `src/Mod/LLMBridge/Init.py`
- Ensure the module initializes on FreeCAD startup
- Verify the WebSocket server (port 8766) starts automatically
- Add logging to confirm server is running

**File**: `src/Mod/LLMBridge/llm_bridge/server.py`
- Verify WebSocket server binds to correct port
- Add connection logging for debugging
- Ensure thread-safe execution of Python code

**Acceptance Criteria**:
- [ ] LLMBridge module loads when FreeCAD starts
- [ ] WebSocket server listens on port 8766
- [ ] Can send Python code and receive execution results
- [ ] Errors are properly caught and returned

### 2. Verify Dock Widget Integration

**File**: `src/Gui/LLMDockWidget.cpp`
- Verify dock widget appears in FreeCAD main window
- Check connection to sidecar WebSocket (port 8765)
- Ensure chat messages display correctly

**File**: `src/Gui/MainWindow.cpp`
- Verify dock widget is registered with DockWindowManager
- Check that it's visible by default or can be shown via menu

**Acceptance Criteria**:
- [ ] LLM panel appears as dockable widget in FreeCAD
- [ ] Can connect to sidecar WebSocket server
- [ ] Chat messages render with correct styling (user/assistant/system)
- [ ] Input field accepts user messages

### 3. Verify Sidecar Startup and Connections

**File**: `sidecar/src/index.ts`
- Verify sidecar starts without errors
- Check both WebSocket servers initialize (dock server on 8765, FreeCAD bridge on 8766)
- Verify Claude Agent SDK initializes with API key

**File**: `sidecar/src/dock-server.ts`
- Verify WebSocket server accepts connections from dock widget
- Test message routing to Claude Agent

**File**: `sidecar/src/freecad-bridge.ts`
- Verify connection to FreeCAD WebSocket (port 8766)
- Test reconnection logic when FreeCAD not running

**Acceptance Criteria**:
- [ ] Sidecar starts with `npm start` or `node dist/index.js`
- [ ] Dock server listens on port 8765
- [ ] FreeCAD bridge connects to port 8766 (when available)
- [ ] Claude Agent SDK initializes successfully
- [ ] Automatic reconnection works when FreeCAD restarts

### 4. Test End-to-End Message Flow

**Test Sequence**:
1. Start FreeCAD (LLMBridge module loads, port 8766 opens)
2. Start sidecar (connects to FreeCAD, opens port 8765)
3. Open LLM dock widget in FreeCAD (connects to sidecar)
4. Send test message: "Create a cube with 10mm sides"
5. Verify Claude generates FreeCAD Python code
6. Verify code executes in FreeCAD
7. Verify cube appears in 3D view
8. Verify result returns to chat

**Acceptance Criteria**:
- [ ] Full message round-trip completes in <10 seconds
- [ ] Python code executes without errors
- [ ] 3D model updates visible in FreeCAD viewport
- [ ] Chat shows complete conversation history
- [ ] Errors display clearly to user

### 5. Create Startup Script and Documentation

**File**: `scripts/start-llm-integration.sh` (and `.bat` for Windows)
- Script to start both FreeCAD and sidecar together
- Environment variable setup
- Error handling if dependencies missing

**File**: `skills/INTEGRATION_GUIDE.md`
- Step-by-step setup instructions
- Troubleshooting common issues
- Architecture diagram with ports and data flow

**Acceptance Criteria**:
- [ ] Single command starts full integration (or clear 2-step process)
- [ ] Documentation covers all setup steps
- [ ] Troubleshooting section addresses common failures

## Configuration Requirements

### Environment Variables

Create `.env` file in `sidecar/` directory:
```
ANTHROPIC_API_KEY=your_api_key_here
DOCK_SERVER_PORT=8765
FREECAD_BRIDGE_PORT=8766
FREECAD_HOST=localhost
```

### FreeCAD Configuration

Ensure in FreeCAD preferences:
- Python console access enabled
- Network connections allowed (firewall)
- LLMBridge module enabled on startup

## Dependencies

Before starting this plan, verify:
- [ ] Node.js 18+ installed
- [ ] FreeCAD builds successfully from source
- [ ] Python 3.8+ available in FreeCAD
- [ ] Anthropic API key obtained

## Files to Create/Modify

### Existing Files to Verify/Update:
1. `src/Mod/LLMBridge/Init.py` - Module initialization
2. `src/Mod/LLMBridge/llm_bridge/server.py` - WebSocket server
3. `src/Gui/LLMDockWidget.cpp` - Dock widget implementation
4. `src/Gui/MainWindow.cpp` - Dock registration
5. `sidecar/src/index.ts` - Sidecar entry point
6. `sidecar/src/dock-server.ts` - Dock WebSocket server
7. `sidecar/src/freecad-bridge.ts` - FreeCAD bridge client

### New Files to Create:
1. `sidecar/.env.example` - Environment variable template
2. `scripts/start-llm-integration.bat` - Windows startup script
3. `scripts/start-llm-integration.sh` - Linux/Mac startup script
4. `skills/INTEGRATION_GUIDE.md` - Setup and troubleshooting guide

## Out of Scope

This plan does NOT include:
- Adding new custom tools beyond the existing three
- UI polish or styling improvements
- Performance optimization
- Unit tests (covered in future testing plan)
- CI/CD integration

## Next Step After This

Once end-to-end integration is verified:
- Either: Add more custom tools for Claude (file operations, model queries)
- Or: Improve error handling and edge cases
- Or: Add unit/integration tests

## Definition of Done

- [ ] All acceptance criteria above are met
- [ ] Can demonstrate full workflow: natural language → 3D model
- [ ] Documentation enables new developer to set up in <30 minutes
- [ ] Known issues documented
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress
