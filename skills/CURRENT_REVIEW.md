## Review: Conversation History and Context Management

### Verdict: NEEDS_FIXES

### Summary:
The implementation adds session management tools and context injection infrastructure, but has critical gaps: (1) context injection is defined but never actually integrated into the agent query flow, (2) session management tools don't actually save/load messages to the session (they only manage session metadata), and (3) the dock widget session UI commands use undefined protocol commands that the sidecar doesn't handle.

### Issues:

1. **[sidecar/src/index.ts:173-188]** Context injection is configured but never used. The `getContextInjectionPrompt` and `createContextMessage` functions are imported but never called. The context should be injected into the agent's query prompt before processing user messages, but the `dock-server.ts` handleChatMessage method doesn't include any context injection.

2. **[sidecar/src/dock-server.ts:104-145]** The `handleChatMessage` method sends user messages directly to Claude Agent SDK without injecting CAD context. According to the plan, context (document info, selected objects, recent operations) should be automatically queried and prepended to user messages before Claude processes them.

3. **[sidecar/src/agent-tools.ts:1130-1180]** The `save_chat_session` tool loads the session from disk and calls `saveSession`, but messages are never being added to the session in the first place. There's no integration point where chat messages are automatically persisted to the session via `addMessage()` from `session-manager.ts`.

4. **[sidecar/src/agent-tools.ts:1187-1220]** The `load_chat_session` tool sets the current session ID but doesn't actually restore the conversation history to the dock widget. There's no mechanism to send the loaded messages back to the FreeCAD dock widget.

5. **[src/Gui/LLMDockWidget.cpp:376-400]** The `onSaveSession` and `onLoadSession` methods send commands like `/save_session` and `/load_session` via `llm_panel_bridge.send_message()`, but there's no corresponding handler in the sidecar to process these slash commands. The dock widget expects a response that never comes.

6. **[sidecar/src/session-manager.ts:189-196]** The `addMessage` function loads the session, pushes a message, and saves it back - but this creates a race condition for concurrent access. If two messages are added rapidly, both will load the same state, and the second save will overwrite the first message.

7. **[sidecar/src/context-injector.ts:73-95]** The `getDocumentInfo` and `getSelection` functions call Python code via the bridge, but if the bridge isn't connected yet, these will throw errors that are silently swallowed. This could result in Claude operating with stale or no context without any indication.

### Suggested Fixes:

1. **Integrate context injection into the query flow**: Modify `dock-server.ts` to call `getContextInjectionPrompt()` before sending the user's message to Claude. Prepend the context as a system message or include it in the prompt.

2. **Add message persistence hook**: Create a function in `agent-tools.ts` or `dock-server.ts` that calls `addMessage(sessionId, message)` after each user message is received and after each assistant response is generated.

3. **Implement message restoration**: When `load_chat_session` is called, send the loaded messages back to the dock widget via WebSocket so the UI can display the conversation history.

4. **Add slash command handler**: In `dock-server.ts`, parse incoming messages for `/save_session` and `/load_session` commands and route them to the appropriate session management functions.

5. **Fix race condition in addMessage**: Use a simple queue or debounce mechanism, or better yet, keep the session in memory and batch writes to disk.

6. **Add connection status check to context injection**: Make `getContextInjectionPrompt` return a warning message if the bridge isn't connected, so Claude knows the context may be stale.

## Re-review After Fixes

### Verdict: PASS

### Verification:
- [x] Issue 1 fixed: Context injection is now integrated into the query flow. The `dock-server.ts` file imports `getContextInjectionPrompt`, `createContextMessage`, and `shouldInjectContext` from `context-injector.ts` and calls them in `handleChatMessage` (lines 285-301) to build the full prompt with CAD context before sending to Claude Agent SDK.

- [x] Issue 2 fixed: Messages are now persisted via `addMessage()` calls. User messages are persisted at line 264-267, assistant responses at lines 328-335, and error messages at lines 348-355. All use async error handling to avoid blocking the response flow.

- [x] Issue 3 fixed: Slash command handlers added in `dock-server.ts` (lines 138-236). The `handleSlashCommand` method processes `/save_session` and `/load_session` commands, creating/updating sessions and sending appropriate responses back to the dock widget.

- [x] Issue 4 fixed: Message restoration implemented. When `/load_session` is called, the loaded conversation history is sent to the dock widget via a `restore` type message (lines 213-220) containing the full `messages` array from the session.

- [x] Issue 5 fixed: Race condition resolved with per-session message queue. The `session-manager.ts` file (lines 237-277) implements a `messageQueue` Map that serializes writes per sessionId using Promise chaining. Each `addMessage` call is now async and waits for the previous operation to complete before proceeding.

- [x] Issue 6 fixed: Connection status check added to context injection. The `getContextInjectionPrompt` function in `context-injector.ts` (lines 180-183) now returns a warning message when the FreeCAD bridge is not connected, so Claude is aware that CAD context is unavailable.

### New Issues (if any):
- None. All fixes are correct and complete. The implementation properly addresses all identified issues:
  - Context injection is called conditionally based on `shouldInjectContext()` 
  - Message persistence uses async error handling to prevent blocking
  - Slash commands are properly parsed and routed
  - Session restoration sends full message history to the dock
  - Race condition is prevented with per-session Promise queue
  - Bridge disconnection is reported as a warning to Claude
