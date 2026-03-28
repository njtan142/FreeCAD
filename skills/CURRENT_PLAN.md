## Status: COMPLETED

# Current Plan: Conversation History and Context Management

## Overview

Add conversation persistence and automatic context injection to make the LLM integration more practical for extended CAD workflows. Currently, each conversation is ephemeral and Claude lacks awareness of prior operations. This plan adds:

1. **Conversation History Persistence** - Save/load chat sessions to disk
2. **Automatic Context Injection** - Query model state before Claude executes operations
3. **Session Management Tools** - List, resume, and delete conversation sessions

This enables users to:
- Resume CAD sessions after restarting FreeCAD
- Maintain context across multiple modeling sessions
- Have Claude work with up-to-date model state automatically

## Prerequisites

The following must already exist:
- `sidecar/src/agent-tools.ts` - Custom tools infrastructure
- `sidecar/src/file-utils.ts` - File path utilities (from previous plan)
- `sidecar/src/result-formatters.ts` - Result formatting utilities
- File operation tools working (save/open/export)
- End-to-end integration verified

## Tasks

### 1. Conversation History Data Structure

**File**: `sidecar/src/types.ts` (new file)

Define TypeScript interfaces:

```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

interface ChatSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  documentPath?: string; // Associated CAD file
}

interface ToolCall {
  name: string;
  arguments: any;
}

interface ToolResult {
  toolName: string;
  result: any;
  isError?: boolean;
}
```

**Acceptance Criteria**:
- [ ] Types cover all message metadata needed
- [ ] Sessions include document association
- [ ] Tool calls and results are tracked

### 2. Session Storage Manager

**File**: `sidecar/src/session-manager.ts` (new file)

Create session management utilities:

```typescript
// Session lifecycle
function createSession(name: string, documentPath?: string): ChatSession
function loadSession(sessionId: string): ChatSession | null
function saveSession(session: ChatSession): void
function deleteSession(sessionId: string): void
function listSessions(): SessionSummary[]

// Message management
function addMessage(sessionId: string, message: ChatMessage): void
function getMessages(sessionId: string, limit?: number): ChatMessage[]

// Storage location
function getSessionDir(): string // Platform-specific path
function getSessionFile(sessionId: string): string // Full path
```

Key implementation details:
- Store sessions as JSON files in platform-specific directory
- Use UUID for session IDs
- Auto-save after each message
- Implement session naming (auto-generate from first user message)
- Handle file I/O errors gracefully

**Acceptance Criteria**:
- [ ] Sessions persist across sidecar restarts
- [ ] Session files are human-readable JSON
- [ ] List sessions returns metadata only (not full messages)
- [ ] Handles concurrent access safely
- [ ] Cross-platform path handling (Windows/Linux/Mac)

### 3. Session Management Tools

**File**: `sidecar/src/agent-tools.ts`

Add three new tools:

1. **`save_chat_session`** - Save current conversation:
   - Parameters: `name` (optional, auto-generate if omitted), `includeToolHistory` (default: true)
   - Returns: `{success, sessionId, filePath}`

2. **`load_chat_session`** - Load a saved session:
   - Parameters: `sessionId` (required)
   - Returns: `{success, sessionName, messageCount, documentPath}`

3. **`list_chat_sessions`** - List available sessions:
   - Parameters: `limit` (optional, default: 10)
   - Returns: Array of `{sessionId, name, createdAt, updatedAt, messageCount}`

**Acceptance Criteria**:
- [ ] Tools integrated into agent SDK
- [ ] Session listing is paginated
- [ ] Load session provides context to Claude about what was discussed

### 4. Automatic Context Injection

**File**: `sidecar/src/context-injector.ts` (new file)

Create context injection system:

```typescript
interface ContextInjectionConfig {
  queryBeforeOperations: boolean;
  includeSelectedObjects: boolean;
  includeDocumentInfo: boolean;
  maxContextLength: number; // Token limit awareness
}

function buildContextPrompt(injection: ContextInjection): string
function shouldInjectContext(lastMessage: ChatMessage): boolean
function getContextInjectionPrompt(): string
```

Context to inject automatically:
- Current document name and object count
- Selected objects (if any)
- Recent tool execution results (last 3 operations)
- Document modification status

**Integration Point**: Modify the agent initialization in `sidecar/src/index.ts` to include context injection before processing user messages.

**Acceptance Criteria**:
- [ ] Context is injected before Claude processes user requests
- [ ] Context stays within reasonable token limits
- [ ] Injection is configurable per session
- [ ] Claude receives updated model state automatically

### 5. Update Sidecar Entry Point

**File**: `sidecar/src/index.ts`

Modify to:
- Initialize session manager on startup
- Load last session if `--resume` flag is provided
- Set up context injection in agent configuration
- Add CLI options for session management

```typescript
// Example CLI args
// --resume <sessionId>
// --session <sessionName>
// --list-sessions
```

**Acceptance Criteria**:
- [ ] Sidecar accepts session-related CLI arguments
- [ ] Session manager initialized before agent starts
- [ ] Context injection configured in agent

### 6. Update Dock Widget for Session Display

**File**: `src/Gui/LLMDockWidget.cpp` (modification)

Add UI elements:
- Session name display in dock title bar
- "Save Session" button
- "Load Session" menu action
- Session indicator (new/modified/loaded)

**File**: `src/Gui/LLMDockWidget.h`

Add slots:
- `onSaveSession()`
- `onLoadSession()`
- `updateSessionDisplay(const QString& sessionName)`

**Acceptance Criteria**:
- [ ] Current session name visible in UI
- [ ] Save/load actions accessible from dock
- [ ] UI updates when session changes

### 7. Test End-to-End

**Test Scenarios**:

1. **Save Session**:
   - Start conversation with 5+ messages
   - Save session with custom name
   - Verify JSON file created on disk
   - Check file contains all messages

2. **Load Session**:
   - Restart sidecar
   - Load saved session
   - Verify messages restored
   - Claude has context of prior conversation

3. **List Sessions**:
   - Create 3 sessions
   - List sessions via tool
   - Verify metadata correct (names, timestamps, counts)

4. **Context Injection**:
   - Create box in FreeCAD
   - Ask Claude "what objects exist?"
   - Verify Claude reports current state without explicit query
   - Modify model, ask again
   - Verify updated context

5. **Resume Flag**:
   - Start sidecar with `--resume <sessionId>`
   - Verify session loaded automatically
   - Claude continues conversation

**Acceptance Criteria**:
- [ ] All scenarios pass
- [ ] Session files are valid JSON
- [ ] Context injection provides useful information
- [ ] No message loss across restarts

## Files to Create/Modify

### New Files:
1. `sidecar/src/types.ts` - TypeScript type definitions
2. `sidecar/src/session-manager.ts` - Session storage and lifecycle
3. `sidecar/src/context-injector.ts` - Automatic context injection
4. `sidecar/src/cli-options.ts` - Command-line argument parsing

### Modified Files:
1. `sidecar/src/agent-tools.ts` - Add session management tools
2. `sidecar/src/index.ts` - Initialize session manager, add CLI handling
3. `src/Gui/LLMDockWidget.cpp` - Add session UI elements
4. `src/Gui/LLMDockWidget.h` - Add session-related slots
5. `sidecar/README.md` - Document session management features

## Dependencies

- Node.js `fs` module for file I/O
- UUID generation (use `crypto.randomUUID()` or add `uuid` package)
- FreeCAD document state query tools (already implemented)
- Existing tool infrastructure

## Out of Scope

This plan does NOT include:
- Cloud sync for sessions
- Session search/full-text search
- Export sessions to PDF/Markdown
- Session branching/versioning
- Multi-user session sharing

## Definition of Done

- [x] All 3 session management tools implemented and working
- [x] Sessions persist as JSON files
- [x] Context injection provides useful model state to Claude
- [x] Dock widget displays current session info
- [x] CLI flags for session management work
- [x] End-to-end tests pass for all scenarios
- [x] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

Once conversation history and context management are complete:
- Add advanced modeling tools (boolean operations, parametric features)
- Or: Add assembly constraint tools for multi-part designs
- Or: Add sketch constraint solving integration
