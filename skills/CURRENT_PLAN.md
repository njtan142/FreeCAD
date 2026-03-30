## Status: COMPLETED (Cycle 26)

# Cycle 26: Advanced Error Handling and Recovery Tools

## Overview

Add sophisticated error handling and recovery tools that help the LLM diagnose problems, suggest fixes, and recover from errors gracefully. This makes the integration more robust and user-friendly by transforming cryptic Python/FreeCAD errors into actionable guidance.

Key capabilities:
- Parse and categorize FreeCAD Python errors with context
- Provide recovery suggestions based on error type
- Track operation history for debugging
- Validate operations before execution to prevent errors
- Offer intelligent undo/recovery recommendations
- Extract error patterns and provide structured feedback

## Prerequisites

- `src/Mod/LLMBridge/llm_bridge/__init__.py` - Existing module structure
- `sidecar/src/agent-tools.ts` - Existing tool definitions
- `src/Mod/LLMBridge/llm_bridge/server.py` - WebSocket server
- FreeCAD Python interpreter access

## Tasks

### 1. Create error_handlers.py (Python)

**File**: `src/Mod/LLMBridge/llm_bridge/error_handlers.py` (create new)

Handlers for error analysis and recovery:

#### Error Parsing and Analysis
- `handle_parse_error(error_text)` — Parse Python/FreeCAD error text into structured data
- `handle_get_error_category(error_text)` — Categorize error (AttributeError, TypeError, ValueError, etc.)
- `handle_extract_traceback_info(traceback_text)` — Extract file, line, function from traceback
- `handle_analyze_error_context(error_text, operation_type)` — Analyze error in context of the operation attempted

#### Recovery Suggestions
- `handle_get_recovery_suggestions(error_text, operation)` — Get suggested fixes based on error and operation
- `handle_validate_operation(object_name, operation)` — Validate an operation can succeed before attempting
- `handle_get_common_errors(operation_type)` — Get common errors for a given operation type

#### Operation Tracking
- `handle_get_operation_history(count)` — Get recent operations with their status
- `handle_get_last_error()` — Get the most recent error details
- `handle_clear_error_history()` — Clear the error tracking history

#### Error Recovery Actions
- `handle_suggest_undo_strategy(object_name, failed_operation)` — Suggest undo approach after failed operation
- `handle_recover_from_validation_error(validation_result)` — Generate recovery code for validation failures
- `handle_safe_retry(operation, parameters)` — Execute operation with additional safety checks

**Error Categories**:
```python
ERROR_CATEGORIES = {
    "ATTRIBUTE_ERROR": "Object does not have the requested attribute",
    "TYPE_ERROR": "Wrong type for operation (e.g., string instead of number)",
    "VALUE_ERROR": "Invalid value provided to function",
    "REFERENCE_ERROR": "Referenced object not found in document",
    "CONSTRAINT_ERROR": "Geometric constraint conflict",
    "SOLVER_ERROR": "Sketch solver failed to converge",
    "BOOLEAN_ERROR": "Boolean operation failed",
    "DOCUMENT_ERROR": "Document operation failed",
    "PLACEMENT_ERROR": "Invalid placement/position",
    "EXPRESSION_ERROR": "Invalid expression syntax",
    "PERMISSION_ERROR": "Object is locked or read-only",
    "MEMORY_ERROR": "Insufficient memory for operation",
}
```

**Acceptance Criteria**:
- [x] All handlers return JSON with success/error structure
- [x] All handlers handle None/missing active document gracefully
- [x] Error parsing handles multi-line tracebacks
- [x] Recovery suggestions are context-aware

### 2. Add Tool Definitions to agent-tools.ts

**File**: `sidecar/src/agent-tools.ts` (modify)

Add error handling tools after existing tools in `createAgentTools()`:

```typescript
// Error handling and recovery tools
parseErrorTool(freeCADBridge),
categorizeErrorTool(freeCADBridge),
extractTracebackInfoTool(freeCADBridge),
analyzeErrorContextTool(freeCADBridge),
getRecoverySuggestionsTool(freeCADBridge),
validateOperationTool(freeCADBridge),
getCommonErrorsTool(freeCADBridge),
getOperationHistoryTool(freeCADBridge),
getLastErrorTool(freeCADBridge),
clearErrorHistoryTool(freeCADBridge),
suggestUndoStrategyTool(freeCADBridge),
recoverFromValidationErrorTool(freeCADBridge),
safeRetryOperationTool(freeCADBridge),
```

### 3. Add Result Formatters

**File**: `sidecar/src/result-formatters.ts` (modify)

Add formatters:
```typescript
formatErrorParse(data)
formatErrorCategory(data)
formatTracebackInfo(data)
formatErrorContext(data)
formatRecoverySuggestions(data)
formatValidationResult(data)
formatCommonErrors(data)
formatOperationHistory(data)
formatLastError(data)
formatUndoStrategy(data)
```

### 4. Update __init__.py Exports

**File**: `src/Mod/LLMBridge/llm_bridge/__init__.py` (modify)

Add exports for new handlers to `__all__`:
```python
from .error_handlers import (
    handle_parse_error,
    handle_get_error_category,
    handle_extract_traceback_info,
    handle_analyze_error_context,
    handle_get_recovery_suggestions,
    handle_validate_operation,
    handle_get_common_errors,
    handle_get_operation_history,
    handle_get_last_error,
    handle_clear_error_history,
    handle_suggest_undo_strategy,
    handle_recover_from_validation_error,
    handle_safe_retry,
)
```

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/error_handlers.py` - Error handling handlers (~500 lines)

### Modified Files:
1. `src/Mod/LLMBridge/llm_bridge/__init__.py` - Add exports for 13 new handlers
2. `sidecar/src/agent-tools.ts` - Add 13 new tools
3. `sidecar/src/result-formatters.ts` - Add 10 new formatters

## Test Scenarios

1. **Error Parsing**:
   - Parse a Python AttributeError traceback
   - Parse a FreeCAD constraint error
   - Extract line numbers and function names from multi-line traceback

2. **Error Recovery**:
   - Get recovery suggestions for a failed pad operation
   - Validate a sketch can be solved before constraint application
   - Get common errors for boolean operations

3. **Operation History**:
   - Track operations and retrieve history
   - Get last error with full context
   - Clear history and verify

4. **Validation and Retry**:
   - Validate object exists before operation
   - Use safe_retry with additional checks
   - Get undo strategy after failed operation

5. **Integration**:
   - Integrate error parsing into existing tool responses
   - Use validation before sketch constraint operations
   - Provide recovery suggestions in error messages

## Acceptance Criteria

- [ ] error_handlers.py created with 13 handlers
- [ ] All handlers properly export from __init__.py
- [ ] 13 new tools added to agent-tools.ts with Zod schema validation
- [ ] 10 new result formatters added
- [ ] All tools integrated in createAgentTools()
- [ ] End-to-end test scenarios pass

## Definition of Done

- [ ] error_handlers.py created with 13 handlers
- [ ] All handlers exported in __init__.py
- [ ] 13 new tools added to agent-tools.ts
- [ ] 13 new result formatters added
- [ ] All tools integrated in createAgentTools()
- [ ] End-to-end test scenarios pass
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

**URGENT: Vercel AI SDK + MiniMax Integration** (Move to immediately after Cycle 26)

Use Vercel AI SDK (`@ai-sdk`) for direct MiniMax API access with native MCP tool support:
- Install: `ai`, `@ai-sdk/mcp`, `vercel-minimax-ai-provider`
- Create `VercelAIBackend` using `streamText` + `createMCPClient` to connect FreeCAD MCP tools
- Benefits: Direct API (no opencode CLI), built-in tool calling, automatic streaming
- MiniMax endpoint: `https://api.minimaxi.com/v1`, model: `MiniMax-M2.7`
- MCP tools auto-discovered and converted to AI SDK tools

After MiniMax integration:
- Gemini CLI integration (alternative backend)
- Additional custom tools based on user feedback
- Drawing/annotation tools
- Report generation tools
