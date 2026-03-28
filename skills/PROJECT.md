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
- [ ] **Next**: Build the Node.js sidecar with Claude Agent SDK
- [ ] Define custom tool interface
- [ ] End-to-end integration and testing
