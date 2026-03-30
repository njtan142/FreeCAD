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
- [x] **Cycle 9: PartDesign Feature Tools** (COMPLETED)
  - Created `src/Mod/LLMBridge/llm_bridge/feature_handlers.py` - PartDesign feature handlers
  - Added 12 PartDesign tools: `create_pad`, `create_pocket`, `create_revolution`, `create_groove`, `create_fillet`, `create_chamfer`, `update_feature_dimension`, `delete_feature`, `edit_feature_sketch`, `create_body`, `set_active_body`, `list_bodies`
  - Extended `sidecar/src/result-formatters.ts` with formatters for feature creation and body management results
  - Implemented PartDesign Body workflow with auto-body creation and feature dependency tracking
  - All end-to-end test scenarios passed (basic pad creation, pocket cut, revolution feature, fillet/chamfer addition, dimension update, multi-feature part, body management, error handling, through-all pocket)
- [x] **Cycle 10: Boolean Operation Tools** (COMPLETED)
  - Created `src/Mod/LLMBridge/llm_bridge/boolean_handlers.py` - Boolean operation handlers
  - Added 7 Boolean tools: `boolean_fuse`, `boolean_cut`, `boolean_common`, `make_compound`, `validate_shape`, `heal_shape`, `get_shape_info`
  - Extended `sidecar/src/result-formatters.ts` with formatters for Boolean operations and shape analysis results
  - Implemented shape validation and healing with tolerance checking
  - All end-to-end test scenarios passed (basic fuse/union, cut/difference, common/intersection, multi-object fuse, compound creation, shape validation, shape healing, shape info query, error handling)
- [x] **Cycle 16: Kinematic Solver and Motion Animation Tools** (COMPLETED)
- [x] **Cycle 17: Animation and Rendering Tools** (COMPLETED)
- [x] **Cycle 18: Mesh/Conversion Tools for 3D Printing** (COMPLETED)
- [x] **Cycle 19: FEA Integration Tools for Basic Stress Analysis** (COMPLETED)
- [x] **Cycle 20: Multi-Agent Backend Support - OpenCode Integration** (COMPLETED)
- [x] **Cycle 21: CAM/Path Workbench Tools for CNC Operations** (COMPLETED)
- [x] **Cycle 22: Advanced Surface Modeling Tools** (COMPLETED)
- [x] **Cycle 23: Essential Workflow Tools (Undo/Redo, Visibility, Selection, Measurement)** (COMPLETED)
- [x] **Cycle 24: Spreadsheet Workbench Tools (BOM & Parametric Tables)** (COMPLETED)
- [x] **Cycle 25: BIM Workbench Tools (Architecture-Specific Operations)** (COMPLETED)
- [x] **Cycle 26: Advanced Error Handling and Recovery Tools** (COMPLETED)
  - Created `src/Mod/LLMBridge/llm_bridge/error_handlers.py` - 13 error handling handlers
  - Added error parsing, categorization, traceback extraction, context analysis
  - Added recovery suggestions, validation, operation history tracking
  - Added undo strategy suggestions and safe retry functionality
- [ ] **URGENT: Vercel AI SDK + MiniMax Integration** — Use Vercel AI SDK for direct MiniMax API access with MCP tool support
  - Install `ai`, `@ai-sdk/mcp`, and `vercel-minimax-ai-provider` packages
  - Create `VercelAIBackend` using `streamText` with `createMCPClient` to connect to FreeCAD's MCP tools
  - Benefits: Direct API access (no opencode CLI needed), built-in tool calling, streaming support
  - MiniMax provides OpenAI-compatible API at `https://api.minimaxi.com/v1` with model `MiniMax-M2.7`
  - MCP tools auto-discovered and converted to AI SDK tools
  - Add `sidecar:dev:minimax` npm script for easy launching
- [ ] Define additional custom tools as needed
- [ ] **Multi-Agent Backend Support** — Support alternative LLM agents beyond Claude Code CLI
  - [x] **OpenCode integration** — Add OpenCode as an alternative agent backend (COMPLETED - Cycle 20)
    - OpenCode supports multiple LLM providers (OpenAI, Anthropic, Google, local models)
    - Would allow users to use GPT-4, Gemini, or local models for CAD operations
    - Requires adapter layer to translate between OpenCode's tool protocol and our MCP tools
  - [ ] **Gemini CLI integration** — Add Google's Gemini CLI as an agent backend
    - Direct access to Gemini models (Gemini 2.5 Pro, Flash, etc.)
    - May offer faster/cheaper inference for simpler CAD tasks
    - Requires adapter for Gemini's function calling format to our MCP tool interface
  - [x] **Agent backend abstraction layer** — Refactor sidecar to support pluggable agent backends (COMPLETED - Cycle 20)
    - Backend abstraction with AgentBackend interface
    - Backend registry for backend management
    - Backend selection via CLI flags
    - Tool translation layer for format conversion
    - Shared: FreeCAD bridge, MCP tool definitions, session management, context injection
    - Per-backend: prompt format, authentication, tool calling protocol, response parsing
