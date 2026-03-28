# FreeCAD LLM Integration

## Vision

Embed an LLM chat panel directly inside FreeCAD that can execute Python commands in the live FreeCAD session. Users describe what they want in natural language, the LLM translates it to FreeCAD Python API calls and executes them — iteratively building, modifying, and simulating CAD models.

## Architecture

```
FreeCAD Qt GUI
  ├── Normal CAD viewports, toolbars, workbenches
  └── LLM Panel (QDockWidget)
        ├── Chat UI (Qt widgets)
        └── WebSocket client → Node.js sidecar server
              └── Claude Agent SDK → Claude Code CLI
                    └── Custom tool: execute_freecad_python(code)
                          └── Sends Python to FreeCAD's running interpreter via WebSocket
```

### Components

1. **FreeCAD LLM Dock Widget** (`src/Gui/`) — Qt dock panel with chat UI embedded in FreeCAD's main window
2. **Python Execution Bridge** — WebSocket server running inside FreeCAD that accepts Python code strings, executes them in FreeCAD's interpreter, and returns results
3. **Node.js Sidecar** — External process using `@anthropic-ai/claude-agent-sdk` to connect Claude Code to FreeCAD's WebSocket bridge
4. **Custom Tools** — Tool definitions that let Claude execute FreeCAD Python, query model state, export files, etc.

### Key FreeCAD Source Areas

- `src/Gui/DockWindow.cpp/.h` — Dock widget system
- `src/Gui/DockWindowManager.cpp/.h` — Dock management
- `src/Gui/PythonConsole.cpp/.h` — Existing Python console (reference for execution)
- `src/Gui/MainWindow.cpp` — Main window where dock gets registered
- `src/Mod/` — Workbench modules

### Tech Stack

- FreeCAD side: C++ (Qt) for the dock widget, Python for the execution bridge
- Sidecar: Node.js + `@anthropic-ai/claude-agent-sdk`
- Communication: WebSocket between FreeCAD and sidecar

## Approach

This is a diverging fork. We modify FreeCAD directly without worrying about upstream compatibility, though we'll try to stay updated with upstream when possible.

## Progress

- [x] Forked FreeCAD (https://github.com/njtan142/FreeCAD)
- [x] Explored codebase structure and identified key integration points
- [x] Defined architecture and component breakdown
- [x] Created skill-based development workflow (plan → implement → review cycle)
- [x] Build the Python WebSocket execution bridge inside FreeCAD (`src/Mod/LLMBridge/`)
- [x] Build the LLM dock widget (Qt/C++)
  - Created `LLMChatWidget` for displaying chat messages with different styles for user/assistant/system
  - Created `LLMDockWidget` as the main dock panel with chat UI and input field
  - Created Python bridge modules (`sidecar_client.py`, `llm_panel_bridge.py`) for sidecar communication
  - Integrated dock widget into `MainWindow.cpp` with registration in `DockWindowManager`
  - Added stub placeholder responses for when sidecar is not connected
- [x] Build the Node.js sidecar with Claude Agent SDK
  - Created `sidecar/package.json` with dependencies (`@anthropic-ai/claude-agent-sdk`, `ws`)
  - Created `sidecar/tsconfig.json` for TypeScript configuration
  - Created `sidecar/src/index.ts` main entry point with configuration and startup logic
  - Created `sidecar/src/dock-server.ts` WebSocket server for dock widget (port 8765)
  - Created `sidecar/src/freecad-bridge.ts` WebSocket client to FreeCAD Python bridge (port 8766)
  - Created `sidecar/src/agent-tools.ts` with custom tools: `execute_freecad_python`, `query_model_state`, `export_model`
  - Created `sidecar/README.md` with setup instructions
- [x] End-to-end integration and testing
  - Created `sidecar/.env.example` - Environment variable template
  - Created `scripts/start-llm-integration.bat` - Windows startup script
  - Created `scripts/start-llm-integration.sh` - Linux/Mac startup script
  - Created `skills/INTEGRATION_GUIDE.md` - Setup and troubleshooting guide
  - Fixed port configuration mismatches (FreeCAD bridge: 8766, Dock server: 8765)
  - Verified all components connect properly
- [x] Enhanced Model Query Tools
  - Created `src/Mod/LLMBridge/llm_bridge/query_handlers.py` - Python handlers for document introspection
  - Created `sidecar/src/result-formatters.ts` - Result formatting utilities for readable output
  - Enhanced `query_model_state` tool with structured intents (document_overview, object_details, selection, dependencies)
  - Added `list_objects` tool - List all objects with name, type, visibility
  - Added `get_object_properties` tool - Get detailed properties (dimensions, placement, color)
  - Added `get_selection` tool - Get currently selected objects in viewport
  - Added `get_document_info` tool - Get document metadata (name, modified status, object count)
- [x] File Operations Tools
  - Created `src/Mod/LLMBridge/llm_bridge/file_handlers.py` - Python handlers for file operations
  - Created `sidecar/src/file-utils.ts` - Path validation and format utilities
  - Added `save_document` tool - Save current document (FCStd, FCBak formats)
  - Added `open_document` tool - Open existing CAD files
  - Added `export_to_format` tool - Export to STEP, IGES, STL, OBJ, DXF formats
  - Added `list_recent_documents` tool - Show recently opened files
  - Added `create_new_document` tool - Create new empty documents
  - Updated `sidecar/README.md` with file operation tools documentation
- [x] Conversation History and Context Management
  - Created `sidecar/src/types.ts` - TypeScript type definitions for messages, sessions, and context
  - Created `sidecar/src/session-manager.ts` - Session storage as JSON files with lifecycle management
  - Created `sidecar/src/context-injector.ts` - Automatic model state injection before Claude responds
  - Added session management tools: `save_chat_session`, `load_chat_session`, `list_chat_sessions`
  - Added CLI flags: `--resume <sessionId>`, `--session <name>`, `--list-sessions`, `--no-context-injection`
  - Updated `LLMDockWidget` with session display label and session management menu
- [x] **Cycle 7: Parametric Feature Editing Tools** (COMPLETED)
  - Created `src/Mod/LLMBridge/llm_bridge/property_handlers.py` - Property access and modification handlers
  - Added 8 parametric editing tools: `set_object_property`, `update_dimensions`, `move_object`, `rotate_object`, `scale_object`, `set_expression`, `get_expression`, `clear_expression`
  - Extended `sidecar/src/result-formatters.ts` with formatters for property change results
  - Implemented undo stack integration for LLM changes
  - All end-to-end test scenarios passed (single property edit, multi-dimension update, movement, rotation, scale, expressions, error handling, undo)
- [x] **Cycle 8: Sketcher Constraint Tools** (COMPLETED)
  - Created `src/Mod/LLMBridge/llm_bridge/sketcher_handlers.py` - Sketch and constraint handlers
  - Added 8 sketcher tools: `create_sketch`, `add_sketch_geometry`, `delete_sketch_geometry`, `get_sketch_geometry`, `add_constraint`, `remove_constraint`, `list_constraints`, `update_constraint`
  - Extended `sidecar/src/result-formatters.ts` with formatters for sketcher results
  - Implemented sketch solver status checking and constraint conflict handling
  - All end-to-end test scenarios passed (basic sketch creation, rectangle, constraints, dimensional constraints, geometric relationships, circle with constraints, over-constraint handling, constraint modification)
- [ ] Define additional custom tools as needed
