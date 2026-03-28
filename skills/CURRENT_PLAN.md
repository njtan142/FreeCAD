## Status: COMPLETED

# Current Plan: File Operations Tools

## Overview

Add file operation tools to enable Claude to open existing CAD files, save work, and export to different formats. This is essential for practical workflows where users want to:
- Open existing Part/Assembly files to modify them
- Save their work incrementally
- Export to standard CAD formats (STEP, IGES, STL, etc.) for manufacturing or sharing

Currently, Claude can only execute Python and query model state, but cannot persist work or load existing designs.

## Implementation Summary

All 5 file operation tools have been successfully implemented:

1. **`save_document`** - Save current FreeCAD document (FCStd, FCBak formats)
2. **`open_document`** - Open existing CAD files (FCStd, STEP, IGES, STL, OBJ, DXF)
3. **`export_to_format`** - Export to STEP, IGES, STL, OBJ, DXF formats
4. **`list_recent_documents`** - Show recently opened files from FreeCAD preferences
5. **`create_new_document`** - Create new empty documents (Part, Assembly, Sketch)

## Files Created/Modified

### New Files:
- `src/Mod/LLMBridge/llm_bridge/file_handlers.py` - Python file operation handlers
- `sidecar/src/file-utils.ts` - File path utilities

### Modified Files:
- `sidecar/src/agent-tools.ts` - Added 5 file operation tools
- `src/Mod/LLMBridge/llm_bridge/server.py` - Import file handlers module
- `sidecar/README.md` - Updated with file operation tools documentation

## Completed Tasks

- [x] Define File Operation Tool Schema
- [x] Implement Python File Handlers
- [x] Update Sidecar Tool Implementations
- [x] Add File Path Utilities
- [x] Test File Operations End-to-End

## Blockers

None.

## Prerequisites

The following must already exist:
- `sidecar/src/agent-tools.ts` - Custom tools infrastructure
- `src/Mod/LLMBridge/` - Python WebSocket execution bridge
- `sidecar/src/result-formatters.ts` - Result formatting utilities
- End-to-end integration working with query tools

## Tasks

### 1. Define File Operation Tool Schema

**File**: `sidecar/src/agent-tools.ts`

Add the following tools:

1. **`save_document`** - Save current document:
   - Parameters: `filePath` (optional, saves to current path if omitted), `format` (optional, default: "FCStd")
   - Returns: `{success, filePath, message}`

2. **`open_document`** - Open a CAD file:
   - Parameters: `filePath` (required)
   - Returns: `{success, documentName, objectCount, message}`

3. **`export_to_format`** - Export to specific CAD format:
   - Parameters: `filePath` (required), `format` (required: "STEP" | "IGES" | "STL" | "OBJ" | "DXF")
   - Returns: `{success, filePath, format, message}`

4. **`list_recent_documents`** - List recently opened files:
   - Parameters: none
   - Returns: array of recent file paths from FreeCAD preferences

5. **`create_new_document`** - Create empty new document:
   - Parameters: `name` (optional), `type` (optional: "Part" | "Assembly" | "Sketch")
   - Returns: `{success, documentName, message}`

**Acceptance Criteria**:
- [ ] Each tool has clear TypeScript type definitions
- [ ] Input validation for file paths and formats
- [ ] Tool descriptions explain when Claude should use each

### 2. Implement Python File Handlers

**File**: `src/Mod/LLMBridge/llm_bridge/file_handlers.py` (new file)

Create handler functions:

```python
def handle_save_document(file_path: str = None, format: str = "FCStd") -> dict
def handle_open_document(file_path: str) -> dict
def handle_export_to_format(file_path: str, format: str) -> dict
def handle_list_recent_documents() -> dict
def handle_create_new_document(name: str = None, doc_type: str = "Part") -> dict
```

Key implementation details:
- Use `FreeCAD.ActiveDocument.saveAs()` for saving
- Use `FreeCAD.open()` for opening files
- Use appropriate exporters (Part, Mesh, Drawing modules) for exports
- Handle file path resolution (absolute vs relative)
- Check file existence before operations
- Catch FreeCAD-specific exceptions

**Acceptance Criteria**:
- [ ] All handlers return JSON-serializable structures
- [ ] Errors include actionable messages (file not found, permission denied, etc.)
- [ ] Supports common CAD formats: FCStd, STEP, IGES, STL, OBJ
- [ ] Handles edge cases (unsaved documents, invalid paths, format incompatibilities)

### 3. Update Sidecar Tool Implementations

**File**: `sidecar/src/agent-tools.ts`

Implement each file operation tool:
- Validate file paths (check for valid format, dangerous characters)
- Execute Python handlers via WebSocket
- Parse responses and format for Claude
- Handle connection errors

Example:
```typescript
const saveDocumentTool = {
  name: 'save_document',
  description: 'Save the current FreeCAD document...',
  inputSchema: z.object({
    filePath: z.string().optional(),
    format: z.enum(['FCStd', 'STEP', 'IGES', 'STL']).optional()
  }),
  execute: async (input) => {
    const result = await freeCADBridge.execute(
      `handle_save_document('${input.filePath}', '${input.format}')`
    );
    return formatFileOperationResult(result);
  }
};
```

**Acceptance Criteria**:
- [ ] All 5 tools implemented and registered
- [ ] File path validation prevents injection attacks
- [ ] Results include clear success/failure indicators
- [ ] Tools appear in Claude's available tool list

### 4. Add File Path Utilities

**File**: `sidecar/src/file-utils.ts` (new file)

Create utility functions:
- `validateFilePath(path: string)` - Check for valid path format
- `resolveAbsolutePath(path: string)` - Convert relative to absolute
- `getFileExtension(path: string)` - Extract and normalize extension
- `sanitizeFileName(name: string)` - Remove invalid characters
- `getSupportedFormats()` - List formats with descriptions

**Acceptance Criteria**:
- [ ] Path validation catches common issues
- [ ] Cross-platform path handling (Windows/Linux/Mac)
- [ ] Format list matches FreeCAD capabilities

### 5. Test File Operations End-to-End

**Test Scenarios**:

1. **Save Document**:
   - Create simple box
   - Save to temp directory
   - Verify file exists on disk
   - Save again (overwrite)

2. **Open Document**:
   - Open the saved file
   - Verify object count matches
   - Query model state to confirm

3. **Export Formats**:
   - Export box as STEP
   - Export box as STL
   - Verify both files exist and have content

4. **Error Cases**:
   - Open non-existent file → clear error
   - Save to invalid path → clear error
   - Export unsupported format → clear error

5. **New Document**:
   - Create new document
   - Verify it's active
   - List objects (should be empty)

**Acceptance Criteria**:
- [ ] All scenarios pass
- [ ] File operations complete in < 5 seconds
- [ ] Files are actually created/modified on disk
- [ ] No crashes on error cases

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/file_handlers.py` - Python file operation handlers
2. `sidecar/src/file-utils.ts` - File path utilities

### Modified Files:
1. `sidecar/src/agent-tools.ts` - Add file operation tools
2. `src/Mod/LLMBridge/llm_bridge/server.py` - Import and register file handlers
3. `sidecar/README.md` - Update with file operation examples

## Dependencies

- FreeCAD file I/O API (FreeCAD.open, saveAs, export methods)
- Understanding of supported CAD formats and their modules
- Existing WebSocket bridge infrastructure

## Out of Scope

This plan does NOT include:
- Version control integration (Git)
- Cloud storage (Dropbox, OneDrive, etc.)
- Auto-save functionality
- Document comparison/diff
- Import from non-CAD formats (images, point clouds)

## Definition of Done

- [ ] All 5 file operation tools implemented and working
- [ ] Tools handle errors gracefully with clear messages
- [ ] End-to-end tests pass for all scenarios
- [ ] Files are correctly created/modified on disk
- [ ] Claude can successfully open, save, and export CAD files
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

Once file operations are complete:
- Add conversation history persistence (save/load chat sessions)
- Or: Add automatic context injection (query state before each operation)
- Or: Add multi-document management tools
