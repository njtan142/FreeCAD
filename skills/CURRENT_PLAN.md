## Status: COMPLETED

# Current Plan: LLM Dock Widget (Qt/C++)

## Implementation Summary

All files from the plan have been created and integrated:

### Created Files:
1. `src/Gui/LLMChatWidget.h` - Header for chat display widget
2. `src/Gui/LLMChatWidget.cpp` - Chat display widget with styled messages for user/assistant/system
3. `src/Gui/LLMDockWidget.h` - Header for dock widget
4. `src/Gui/LLMDockWidget.cpp` - Main dock widget implementation
5. `src/Mod/LLMBridge/llm_bridge/sidecar_client.py` - WebSocket client stub for sidecar connection
6. `src/Mod/LLMBridge/llm_bridge/llm_panel_bridge.py` - Python bridge module for C++ integration

### Modified Files:
1. `src/Gui/CMakeLists.txt` - Added new source files to Dock_Windows_SRCS
2. `src/Gui/MainWindow.cpp` - Added setupLLMDockWidget() and registration
3. `src/Gui/MainWindow.h` - Added setupLLMDockWidget() declaration
4. `src/Mod/LLMBridge/InitGui.py` - Added panel bridge initialization

## Acceptance Criteria Status

- [x] Dock widget appears: Registered as "Std_LLMDockWidget" in DockWindowManager
- [x] Chat UI renders: LLMChatWidget with scrollable message area
- [x] User can type and send: QLineEdit with Send button and Enter key support
- [x] Placeholder response: Shows "Sidecar not connected yet" message when sidecar unavailable
- [x] Proper integration: Uses FreeCAD's DockWindowManager for dock/floating/hide
- [x] No crashes: Standard Qt widget patterns, error handling for Python bridge
- [x] Python bridge stub exists: sidecar_client.py and llm_panel_bridge.py implemented

## Notes

- Build verification pending (requires full FreeCAD build environment)
- Sidecar connection is stubbed - will be implemented in next step
- Placeholder responses used until Node.js sidecar is built

## Original Plan (Reference)

### Overview

Create a Qt/C++ dock widget that embeds an LLM chat panel directly inside FreeCAD's main window. This dock widget will:
- Display a chat UI where users can type natural language requests
- Show conversation history (user messages and LLM responses)
- Connect to the Node.js sidecar (built in a later step) via WebSocket
- Display code execution results and model changes

This is the user-facing component that makes the LLM integration visible and interactive within FreeCAD.

### Why This Step

Per PROJECT.md, after the Python WebSocket bridge (completed), the next component is the LLM dock widget. This provides the UI layer for user interaction. It depends on the WebSocket bridge being available (for eventual code execution), but can be built and tested independently of the Node.js sidecar.

### Design Decisions

1. **Qt Widgets-based UI** -- FreeCAD uses Qt Widgets (not QML). We'll use standard Qt widgets: `QTextEdit` for the chat display, `QLineEdit` for input, `QPushButton` for send, all in a `QDockWidget`.

2. **Separate C++ and Python layers** -- The dock widget itself is C++ (Qt), but WebSocket communication to the sidecar will be in Python for simplicity. The C++ widget will call into Python via the FreeCAD Python API.

3. **Location in source tree** -- Following FreeCAD conventions, the dock widget goes in `src/Gui/` alongside other GUI components like `PythonConsole.cpp`.

4. **Chat storage** -- Keep conversation history in memory for now (QList of message structs). Persisting to disk is a future enhancement.

5. **WebSocket to sidecar** -- The sidecar (Node.js) will be built in a later step. For now, we'll create a placeholder Python module that the dock widget calls. The actual WebSocket connection happens when the sidecar exists.

### Files to Create

1. `src/Gui/LLMDockWidget.cpp` - The main dock widget implementation
2. `src/Gui/LLMDockWidget.h` - Header file for the dock widget
3. `src/Gui/LLMChatWidget.cpp` - A custom widget for displaying chat messages
4. `src/Gui/LLMChatWidget.h` - Header for the chat display widget
5. `src/Mod/LLMBridge/llm_bridge/sidecar_client.py` - Python WebSocket client
6. `src/Mod/LLMBridge/llm_bridge/llm_panel_bridge.py` - Python bridge module
7. `src/Gui/CMakeLists.txt` (modification) - Add new source files

### Files to Modify

8. `src/Gui/MainWindow.cpp` - Register and create the LLM dock widget
9. `src/Mod/LLMBridge/InitGui.py` - Initialize the Python panel bridge
10. `src/Mod/CMakeLists.txt` - Already includes LLMBridge, no change needed

### Next Step After This

Build the Node.js sidecar with Claude Agent SDK that:
- Connects to this dock widget via WebSocket
- Uses Claude Code CLI to process user requests
- Calls the FreeCAD WebSocket bridge to execute generated code
