## Status: COMPLETED

# Current Plan: Enhanced Model Query Tools

## Overview

Expand the `query_model_state` tool to provide Claude with comprehensive visibility into the FreeCAD document structure. This enables Claude to understand existing models before modifying them, which is essential for iterative CAD workflows.

Currently, Claude can execute Python code and export models, but has limited ability to query what already exists in the document. This plan adds structured query capabilities for:
- Document structure and all objects
- Individual object properties and parameters
- Selected objects in the viewport
- Document history/undo stack
- Object dependencies and parent-child relationships

## Prerequisites

The following must already exist:
- `sidecar/src/agent-tools.ts` - Existing custom tools with basic `query_model_state`
- `src/Mod/LLMBridge/` - Python WebSocket execution bridge
- `sidecar/` - Node.js sidecar with Claude Agent SDK working end-to-end

## Tasks

### 1. Define Enhanced Query Tool Schema

**File**: `sidecar/src/agent-tools.ts`

Expand the tools to include:

1. **`query_model_state`** (enhanced) - Query with specific intent:
   - `intent`: "document_overview" | "object_details" | "selection" | "dependencies"
   - `objectName`: optional, for object-specific queries
   - Returns structured JSON instead of raw Python output

2. **`list_objects`** (new) - List all objects in active document:
   - Returns: array of `{name, label, type, visibility}`
   - Includes object type (Part::Box, Part::Cylinder, etc.)

3. **`get_object_properties`** (new) - Get detailed properties of a specific object:
   - Parameters: `objectName` (required)
   - Returns: `{name, label, type, placement, properties: {}}`
   - Includes dimensions, position, rotation, color, etc.

4. **`get_selection`** (new) - Get currently selected objects:
   - Returns: array of selected object names and types
   - Essential for context-aware operations

5. **`get_document_info`** (new) - Get document metadata:
   - Returns: `{name, label, objectCount, modified, filePath}`

**Acceptance Criteria**:
- [ ] Each tool has clear TypeScript type definitions
- [ ] Tools use Zod schemas for validation (if used in project)
- [ ] Tool descriptions are clear for Claude to understand when to use each

### 2. Implement Python Query Handlers

**File**: `src/Mod/LLMBridge/llm_bridge/query_handlers.py` (new file)

Create dedicated handler functions for each query type:

```python
def handle_document_overview() -> dict
def handle_object_details(object_name: str) -> dict
def handle_selection() -> dict
def handle_dependencies(object_name: str) -> dict
```

Each handler should:
- Use proper FreeCAD API calls (`FreeCAD.ActiveDocument`, `Gui.ActiveDocument`, etc.)
- Handle cases where document is None
- Catch and return errors gracefully
- Return JSON-serializable structures

**Acceptance Criteria**:
- [ ] All handlers return valid JSON structures
- [ ] Errors are caught and returned as structured error messages
- [ ] Handles edge cases (no document, invalid object names, etc.)
- [ ] Uses FreeCAD's API correctly (verify with existing Python console patterns)

### 3. Update Sidecar Tool Implementations

**File**: `sidecar/src/agent-tools.ts`

Update each tool to:
- Call the appropriate Python handler via WebSocket
- Parse the JSON response
- Format results for Claude consumption
- Handle connection errors gracefully

Example tool structure:
```typescript
const listObjectsTool = {
  name: 'list_objects',
  description: 'List all objects in the active FreeCAD document...',
  inputSchema: z.object({}),
  execute: async (input) => {
    const result = await freeCADBridge.execute('handle_list_objects()');
    return formatResult(result);
  }
};
```

**Acceptance Criteria**:
- [ ] All 5 tools implemented and registered with Claude Agent SDK
- [ ] Tools return formatted, readable output
- [ ] Error messages are clear and actionable
- [ ] Tools appear in Claude's available tool list

### 4. Add Query Result Formatting

**File**: `sidecar/src/result-formatters.ts` (new file)

Create utility functions to format query results for readability:
- Format object lists as tables
- Format properties as key-value pairs
- Truncate long outputs with "..." and character counts
- Highlight important values (dimensions, positions)

**Acceptance Criteria**:
- [ ] Formatters produce human-readable output
- [ ] Large result sets are paginated or truncated
- [ ] Output fits within Claude's context limits

### 5. Test Query Tools End-to-End

**Test Scenarios**:

1. **Empty Document**:
   - Start FreeCAD with new document
   - Call `list_objects` → should return empty array
   - Call `get_document_info` → should show 0 objects

2. **Document with Objects**:
   - Create cube via Python: `Part.makeBox(10,10,10)`
   - Call `list_objects` → should show the box
   - Call `get_object_properties` → should show dimensions, placement

3. **Selection Query**:
   - Select object in GUI
   - Call `get_selection` → should return selected object

4. **Error Handling**:
   - Call `get_object_properties` with invalid name
   - Should return clear error, not crash

**Acceptance Criteria**:
- [ ] All test scenarios pass
- [ ] Query response time < 2 seconds
- [ ] Results are accurate and match FreeCAD GUI state
- [ ] No crashes on edge cases

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/query_handlers.py` - Python query handlers
2. `sidecar/src/result-formatters.ts` - Result formatting utilities

### Modified Files:
1. `sidecar/src/agent-tools.ts` - Add/expand query tools
2. `src/Mod/LLMBridge/llm_bridge/server.py` - Import and register new handlers

## Dependencies

- FreeCAD Python API knowledge (Part, Gui, Document objects)
- Existing WebSocket bridge for Python execution
- Claude Agent SDK tool registration pattern

## Out of Scope

This plan does NOT include:
- Modifying existing geometry (that's for execute_freecad_python)
- File I/O operations (covered by export_model tool)
- Undo/redo stack manipulation
- Multi-document support (only ActiveDocument)

## Definition of Done

- [ ] All 5 query tools implemented and working
- [ ] Tools return structured, readable output
- [ ] Error handling works for all edge cases
- [ ] End-to-end tests pass
- [ ] Claude can successfully query document state and understand results
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

Once query tools are complete:
- Add tools for file operations (open, save, import formats)
- Or: Add conversation history persistence
- Or: Improve LLM prompt context with automatic state queries
