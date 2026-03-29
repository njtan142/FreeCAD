## Status: IN PROGRESS (Cycle 23)

# Cycle 23: Undo/Redo, Visibility, and Measurement Tools

## Overview

Add critical workflow tools that are missing from the current implementation:
- **Undo/Redo tools** — Essential for LLM workflows since the LLM will make mistakes and need to revert changes
- **Visibility management tools** — Toggle object visibility in the viewport
- **Measurement tools** — Measure distances, angles, and other geometric properties

These tools form a coherent unit focused on **workflow fundamentals** that improve the LLM's ability to iterate and verify CAD operations.

## Prerequisites

- `src/Mod/LLMBridge/llm_bridge/__init__.py` - Existing module structure
- `sidecar/src/agent-tools.ts` - Existing tool definitions
- `sidecar/src/result-formatters.ts` - Existing result formatters

## Tasks

### 1. Create workflow_handlers.py (Python)

**File**: `src/Mod/LLMBridge/llm_bridge/workflow_handlers.py` (create new)

Handlers for undo/redo and visibility management:

#### Undo/Redo Functions
- `handle_undo()` — Undo the last operation
- `handle_redo()` — Redo the last undone operation
- `handle_get_undo_stack_size()` — Get current undo/redo stack depth

#### Visibility Functions
- `handle_show_object(obj_name)` — Show a hidden object
- `handle_hide_object(obj_name)` — Hide an object
- `handle_toggle_visibility(obj_name)` — Toggle visibility state
- `handle_show_all()` — Show all objects in document
- `handle_hide_all()` — Hide all objects in document
- `handle_get_visible_objects()` — List currently visible objects
- `handle_set_object_visibility(obj_name, visible)` — Set visibility state explicitly

#### Selection Functions (related workflow)
- `handle_select_object(obj_name)` — Select an object
- `handle_deselect_object(obj_name)` — Deselect an object
- `handle_select_all()` — Select all objects
- `handle_clear_selection()` — Clear current selection
- `handle_is_selected(obj_name)` — Check if object is selected

**Acceptance Criteria**:
- [ ] All handlers return JSON with success/error structure
- [ ] Undo/redo properly use FreeCAD's Document.Undo/Redo stack
- [ ] Visibility changes update the GUI correctly

### 2. Create measurement_handlers.py (Python)

**File**: `src/Mod/LLMBridge/llm_bridge/measurement_handlers.py` (create new)

Handlers for geometric measurement:

#### Distance Measurement
- `handle_measure_distance(point1, point2)` — Measure distance between two points
- `handle_measure_object_distance(obj1_name, obj2_name)` — Measure minimum distance between two objects

#### Angle Measurement
- `handle_measure_angle(point1, point2, point3)` — Measure angle at point2 formed by point1-point2-point3

#### Length Measurement
- `handle_measure_length(obj_name)` — Get length of a line/wire/edge

#### Area Measurement
- `handle_measure_area(obj_name)` — Get surface area of a face or object

#### Measurement Utilities
- `handle_get_measure_info(obj_name)` — Get all measurement info for an object

**Acceptance Criteria**:
- [ ] All measurements return numeric values with units
- [ ] Measurements work with Draft, Part, and PartDesign objects

### 3. Add Tool Definitions to agent-tools.ts

**File**: `sidecar/src/agent-tools.ts` (modify)

Add undo/redo/visibility tools after existing tools in `createAgentTools()`:

```typescript
// Undo/Redo tools
createUndoTool(freeCADBridge),
createRedoTool(freeCADBridge),
getUndoStackSizeTool(freeCADBridge),

// Visibility tools
showObjectTool(freeCADBridge),
hideObjectTool(freeCADBridge),
toggleVisibilityTool(freeCADBridge),
showAllObjectsTool(freeCADBridge),
hideAllObjectsTool(freeCADBridge),
getVisibleObjectsTool(freeCADBridge),
setObjectVisibilityTool(freeCADBridge),

// Selection tools (workflow helpers)
selectObjectTool(freeCADBridge),
deselectObjectTool(freeCADBridge),
selectAllObjectsTool(freeCADBridge),
clearSelectionTool(freeCADBridge),
isObjectSelectedTool(freeCADBridge),

// Measurement tools
measureDistanceTool(freeCADBridge),
measureObjectDistanceTool(freeCADBridge),
measureAngleTool(freeCADBridge),
measureLengthTool(freeCADBridge),
measureAreaTool(freeCADBridge),
getMeasureInfoTool(freeCADBridge),
```

### 4. Add Result Formatters

**File**: `sidecar/src/result-formatters.ts` (modify)

Add formatters:
```typescript
formatUndoResult(data)
formatRedoResult(data)
formatUndoStackSize(data)
formatVisibilityChange(data)
formatVisibleObjectsList(data)
formatSelectionChange(data)
formatMeasurement(data)
formatDistanceMeasurement(data)
formatAngleMeasurement(data)
```

### 5. Update __init__.py Exports

**File**: `src/Mod/LLMBridge/llm_bridge/__init__.py` (modify)

Add exports for new handlers to `__all__`:
```python
# From workflow_handlers.py
'handle_undo',
'handle_redo', 
'handle_get_undo_stack_size',
'handle_show_object',
'handle_hide_object',
'handle_toggle_visibility',
'handle_show_all',
'handle_hide_all',
'handle_get_visible_objects',
'handle_set_object_visibility',
'handle_select_object',
'handle_deselect_object',
'handle_select_all',
'handle_clear_selection',
'handle_is_selected',
# From measurement_handlers.py
'handle_measure_distance',
'handle_measure_object_distance',
'handle_measure_angle',
'handle_measure_length',
'handle_measure_area',
'handle_get_measure_info',
```

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/workflow_handlers.py` - Undo/redo and visibility handlers
2. `src/Mod/LLMBridge/llm_bridge/measurement_handlers.py` - Measurement handlers

### Modified Files:
1. `src/Mod/LLMBridge/llm_bridge/__init__.py` - Add exports for new handlers
2. `sidecar/src/agent-tools.ts` - Add 16 new tools
3. `sidecar/src/result-formatters.ts` - Add 9 new formatters

## Test Scenarios

1. **Undo/Redo Flow**:
   - Create a box, undo, verify it's removed, redo, verify it returns
   - Create multiple features, undo stack shows correct depth

2. **Visibility Toggle**:
   - Create two cubes, hide one, verify only one is visible
   - Toggle visibility on an object, verify state changes
   - Show all / hide all operations

3. **Selection Management**:
   - Select object, verify it's in selection
   - Deselect, clear selection, select all operations

4. **Distance Measurement**:
   - Measure between two points, verify correct distance
   - Measure between two cubes, verify minimum distance

5. **Angle Measurement**:
   - Create three points, measure angle, verify correct value

6. **Length/Area Measurement**:
   - Create a line, measure length, verify correct value
   - Create a face, measure area, verify correct value

**Acceptance Criteria**:
- [ ] All 16 new tools defined with Zod schema validation
- [ ] All 9 new result formatters implemented
- [ ] All handlers properly export from __init__.py
- [ ] Test scenarios pass

## Definition of Done

- [ ] workflow_handlers.py created with 14 handlers
- [ ] measurement_handlers.py created with 6 handlers
- [ ] All handlers exported in __init__.py
- [ ] 16 new tools added to agent-tools.ts
- [ ] 9 new result formatters added
- [ ] All tools integrated in createAgentTools()
- [ ] End-to-end test scenarios pass
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

After workflow fundamentals are complete, potential next cycles:
- Spreadsheet workbench tools (BOM, parametric tables)
- BIM workbench tools (architecture-specific operations)
- Advanced error handling and recovery tools
- Gemini CLI integration (alternative backend)
