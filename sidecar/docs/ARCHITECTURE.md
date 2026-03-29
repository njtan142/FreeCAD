# FreeCAD LLM Sidecar - Architecture

## Overview

The FreeCAD LLM Sidecar is a Node.js application that provides Claude AI integration for FreeCAD through a chat interface. It acts as a bridge between FreeCAD's UI and Claude's Agent SDK.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FreeCAD Application                        │
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │  LLMDockWidget   │    │      Python Bridge                │  │
│  │  (C++ UI)        │───▶│  llm_panel_bridge.py             │  │
│  │                  │    │  - Manages callbacks               │  │
│  │  - Chat UI       │    │  - sidecar_client.py              │  │
│  │  - Input field   │    │    - WebSocket client (8765)      │  │
│  │  - Message list  │    │    - Async communication          │  │
│  └──────────────────┘    └───────────────────────────────────┘  │
│                                    │                              │
│                                    │  Python WebSocket            │
└────────────────────────────────────┼──────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Node.js Sidecar                              │
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │   DockServer     │    │       FreeCADBridge               │  │
│  │   (Port 8765)    │    │       (Port 8766)                │  │
│  │                  │    │                                   │  │
│  │  - Receives chat │    │  - Connects to FreeCAD Python    │  │
│  │  - Sends re-     │    │  - Executes Python code          │  │
│  │    sponses       │    │  - Returns document state        │  │
│  │  - Calls SDK     │    │                                   │  │
│  └──────────────────┘    └───────────────────────────────────┘  │
│            │                           ▲                         │
│            │                           │                         │
│            ▼                           │                         │
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │ Claude Agent SDK │    │       Context Injector             │  │
│  │  query()         │───▶│  - Gets document info             │  │
│  │                  │    │  - Gets selection state            │  │
│  │  - MCP tools     │    │  - Builds context prompt          │  │
│  │  - Rate limits   │    │                                   │  │
│  └──────────────────┘    └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                          ┌───────────────────┐
                          │   Claude API      │
                          │   (claude.ai)     │
                          └───────────────────┘
```

## Component Details

### 1. DockServer (`dock-server.ts`)

**Purpose:** Main WebSocket server that receives chat messages from FreeCAD and coordinates with Claude Agent SDK.

**Key Responsibilities:**
- Accept WebSocket connections from FreeCAD UI (port 8765)
- Receive chat messages and conversation history
- Inject FreeCAD context before sending to Claude
- Call `query()` from Claude Agent SDK
- Stream responses back to FreeCAD UI

**Key Functions:**
- `handleChatMessage()` - Main chat handling
- `handleConnection()` - WebSocket connection management
- `sendToClient()` - Send messages back to FreeCAD

### 2. FreeCADBridge (`freecad-bridge.ts`)

**Purpose:** WebSocket client that runs in the sidecar to query FreeCAD for context.

**Key Responsibilities:**
- Connect to FreeCAD Python WebSocket server (port 8766)
- Execute Python code in FreeCAD
- Query document state, selection, etc.

**Key Functions:**
- `executePython(code)` - Execute Python in FreeCAD, returns Promise
- `connect()` - Connect to FreeCAD
- `isConnected()` - Check connection status

### 3. Context Injector (`context-injector.ts`)

**Purpose:** Build context prompts from FreeCAD state for Claude.

**Key Functions:**
- `getContextInjectionPrompt()` - Main entry point
- `buildContextPrompt()` - Get document info and selection
- `getDocumentInfo()` - Query current document state
- `getSelection()` - Query selected objects
- `shouldInjectContext()` - Determine if context needed

### 4. Python Bridge (`llm_panel_bridge.py`)

**Purpose:** Bridge between C++ UI and Node.js sidecar.

**Key Responsibilities:**
- Initialize SidecarClientSync
- Manage response callbacks
- Handle connection to sidecar

**Key Functions:**
- `send_message(text)` - Send chat message
- `register_callback(callback)` - Register response callback
- `_on_response()` - Handle incoming responses
- `_on_connection_change()` - Handle connection changes

### 5. SidecarClient (`sidecar_client.py`)

**Purpose:** Async WebSocket client for sidecar communication.

**Key Classes:**
- `SidecarClient` - Async WebSocket client
- `SidecarClientSync` - Synchronous wrapper for threading

**Key Methods:**
- `connect()` - Connect to sidecar WebSocket
- `send_message()` - Send chat message
- `_process_response()` - Process incoming messages

## Data Flow

### Sending a Chat Message

1. User types in FreeCAD LLMDockWidget (C++)
2. C++ calls `llm_panel_bridge.send_message(text)`
3. Python bridge sends via WebSocket to sidecar (port 8765)
4. DockServer receives on port 8765
5. DockServer calls `context-injector` to get FreeCAD state
6. ContextInjector calls FreeCADBridge to query FreeCAD (port 8766)
7. FreeCADBridge sends to FreeCAD Python WebSocket
8. FreeCAD executes Python and returns result
9. ContextInjector builds context prompt
10. DockServer calls `query()` from Claude Agent SDK
11. SDK processes with Claude API, potentially calling tools
12. SDK yields messages (streamed back)
13. DockServer sends responses to Python client
14. Python client receives and calls `_on_response()`
15. C++ callback invoked via `response_callback`
16. UI updated with response

### Message Types

**Client → Sidecar:**
```python
{
    "type": "chat",
    "message": "user message text",
    "conversation_id": "uuid",
    "history": [{"role": "user", "content": "..."}]
}
```

**Sidecar → Client:**
```python
# Success response
{
    "type": "response",
    "content": "Claude's response",
    "timestamp": 1234567890
}

# Error response
{
    "type": "error",
    "content": "Error: You've hit your limit",
    "timestamp": 1234567890
}

# Status update
{
    "type": "status",
    "content": "Connected to FreeCAD LLM Sidecar",
    "timestamp": 1234567890
}
```

## Configuration

### Environment Variables
- `ANTHROPIC_API_KEY` - API key for Claude (optional if using Claude Code CLI auth)

### MCP Server Configuration

The sidecar creates an MCP server named `freecad-tools` with tools defined in `agent-tools.ts`. These tools wrap FreeCAD Python functions.

### Context Injection

Config in `context-injector.ts`:
- `queryBeforeOperations` - Whether to query FreeCAD before each operation
- `includeDocumentInfo` - Include document metadata
- `includeSelectedObjects` - Include selection state
- `maxContextLength` - Maximum context length

## Error Handling

### Rate Limits
When Claude API rate limit is hit, the SDK returns:
```json
{
    "type": "result",
    "subtype": "success",
    "is_error": true,
    "result": "You've hit your limit · resets 9pm (Asia/Manila)"
}
```

### Connection Issues
- Sidecar disconnects → Python client auto-reconnects
- FreeCAD bridge disconnects → Context injection skipped with warning

## Dependencies

### Node.js Sidecar
- `@anthropic-ai/claude-agent-sdk` - Claude Agent SDK
- `ws` - WebSocket server
- `typescript` - TypeScript support

### Python Bridge
- `websockets` - Async WebSocket client
- FreeCAD Python environment

## Running

```bash
# Start sidecar in development mode
npm run sidecar:dev

# Start in production mode
npm run sidecar:start

# Build TypeScript
cd sidecar && npm run build
```
