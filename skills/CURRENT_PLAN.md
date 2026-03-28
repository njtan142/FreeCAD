## Status: COMPLETED

# Current Plan: Parametric Feature Editing Tools

## Implementation Summary

Cycle 7 successfully implemented parametric feature editing capabilities for the FreeCAD LLM integration. Users can now modify existing CAD features through natural language commands.

### Completed Work

**Core Implementation:**
- Created `src/Mod/LLMBridge/llm_bridge/property_handlers.py` with handlers for all property categories (dimensions, placement, visual, constraints)
- Implemented 8 parametric editing tools in `sidecar/src/agent-tools.ts`:
  - `set_object_property` - Set single properties with unit support
  - `update_dimensions` - Update multiple dimensions at once
  - `move_object` - Reposition objects (absolute/relative)
  - `rotate_object` - Rotate around arbitrary axes
  - `scale_object` - Uniform and non-uniform scaling
  - `set_expression` - Create parametric relationships
  - `get_expression` - Query existing expressions
  - `clear_expression` - Remove expressions and set fixed values
- Extended `sidecar/src/result-formatters.ts` with human-readable formatters for all operation types
- Integrated undo stack support so LLM changes can be reverted with Ctrl+Z

**Testing Results:**
All 8 end-to-end test scenarios passed:
1. Single property edit (Box.Length 50mm → 100mm)
2. Multiple dimension updates (120x60x30mm)
3. Movement operations (absolute and relative)
4. Rotation operations (45° around Z axis)
5. Scale operations (2x uniform scaling)
6. Expression setup (parametric relationships between objects)
7. Error handling (invalid properties and values)
8. Undo integration (Ctrl+Z reverses LLM changes)

### Files Modified
- `src/Mod/LLMBridge/llm_bridge/property_handlers.py` (new)
- `sidecar/src/agent-tools.ts` (extended)
- `sidecar/src/result-formatters.ts` (extended)
- `sidecar/README.md` (documented new tools)

---

## Overview

Enable the LLM to modify existing CAD features parametrically. Users can describe design changes in natural language ("make the box 50mm wider", "change the hole diameter to 10mm", "move this cylinder 20mm up") and Claude will execute the appropriate FreeCAD API calls to modify object properties, dimensions, placements, and parameters.

This is a critical capability for iterative CAD design - users rarely create perfect models on the first try. Parametric editing allows Claude to help users refine designs through conversation.

## Prerequisites

The following must already exist:
- `sidecar/src/agent-tools.ts` - Custom tools infrastructure
- `sidecar/src/result-formatters.ts` - Result formatting utilities
- `src/Mod/LLMBridge/llm_bridge/query_handlers.py` - Model query handlers (reference for property access)
- File operation tools working (for save before major changes)
- End-to-end integration verified

## Tasks

### 1. Property Handler Module

**File**: `src/Mod/LLMBridge/llm_bridge/property_handlers.py` (new file)

Create Python handlers for reading and modifying object properties:

```python
# Property access utilities
def get_object_property(obj, property_name: str) -> Any
def set_object_property(obj, property_name: str, value: Any) -> bool
def get_available_properties(obj) -> dict
def validate_property_value(obj, property_name: str, value: Any) -> tuple[bool, str]

# Property categories
def get_dimension_properties(obj) -> dict  # Length, Width, Height, Radius, etc.
def get_placement_properties(obj) -> dict  # Position (x,y,z), Rotation (axis, angle)
def get_visual_properties(obj) -> dict     # Color, Transparency, Line Width
def get_constraint_properties(obj) -> dict # For sketcher constraints
```

Key implementation details:
- Handle different object types (Part::Box, Part::Cylinder, Part::Feature, etc.)
- Use FreeCAD's property system (`obj.getPropertyList()`, `obj.getPropertyByName()`)
- Handle unit conversions (mm, cm, m, degrees)
- Return descriptive errors for invalid property names or values
- Support both direct properties and linked properties (expressions)

**Acceptance Criteria**:
- [ ] Works with all standard Part workbench objects
- [ ] Handles unit-aware values (FreeCAD.Quantity)
- [ ] Returns clear error messages for invalid operations
- [ ] Supports expression-based properties

### 2. Parametric Edit Tools

**File**: `sidecar/src/agent-tools.ts`

Add five new tools:

1. **`set_object_property`** - Set a single property:
   - Parameters: `objectName` (required), `propertyName` (required), `value` (required), `unit` (optional)
   - Returns: `{success, previousValue, newValue, objectName}`
   - Examples: "Set Box.Length to 100mm", "Set Cylinder.Radius to 5mm"

2. **`update_dimensions`** - Update multiple dimensions at once:
   - Parameters: `objectName` (required), `dimensions` (object with property:value pairs)
   - Returns: `{success, updatedDimensions: [{property, oldValue, newValue}]}`
   - Examples: "Make the box 100x50x25mm"

3. **`move_object`** - Reposition an object:
   - Parameters: `objectName` (required), `position` ({x, y, z}), `relative` (boolean, default: false)
   - Returns: `{success, newPosition: {x, y, z}, objectName}`
   - Examples: "Move the cylinder 20mm up", "Place the box at origin"

4. **`rotate_object`** - Rotate an object:
   - Parameters: `objectName` (required), `axis` ({x, y, z}), `angle` (degrees), `relative` (boolean)
   - Returns: `{success, newRotation: {axis, angle}, objectName}`
   - Examples: "Rotate the part 90 degrees around Z axis"

5. **`scale_object`** - Scale an object uniformly or non-uniformly:
   - Parameters: `objectName` (required), `scaleFactor` (number or {x, y, z}), `aboutPoint` (optional {x, y, z})
   - Returns: `{success, newDimensions, objectName}`
   - Examples: "Scale the model by 2x", "Make it half the size"

**Acceptance Criteria**:
- [ ] All tools integrated into agent SDK
- [ ] Tools return before/after values for confirmation
- [ ] Proper error handling for invalid operations
- [ ] Unit conversion handled automatically

### 3. Expression Management Tools

FreeCAD supports parametric relationships via expressions. Add tools to manage these:

**File**: `sidecar/src/agent-tools.ts` (additional tools)

6. **`set_expression`** - Set a parametric expression on a property:
   - Parameters: `objectName`, `propertyName`, `expression` (e.g., "Box.Length * 2")
   - Returns: `{success, expression, objectName}`
   - Examples: "Make the width always half the length"

7. **`get_expression`** - Get the expression for a property:
   - Parameters: `objectName`, `propertyName`
   - Returns: `{hasExpression, expression, currentValue}`

8. **`clear_expression`** - Remove expression and set fixed value:
   - Parameters: `objectName`, `propertyName`, `fixedValue`
   - Returns: `{success, objectName}`

**Acceptance Criteria**:
- [ ] Expressions can be set and retrieved
- [ ] Expression syntax errors are caught and reported
- [ ] Circular dependency errors are handled

### 4. Python Bridge Extensions

**File**: `src/Mod/LLMBridge/llm_bridge/property_handlers.py` (extend)

Add WebSocket-accessible functions:

```python
# Called via execute_freecad_python or dedicated endpoint
def handle_set_property_request(object_label, property_name, value, unit=None)
def handle_move_request(object_label, position, relative=False)
def handle_rotate_request(object_label, axis, angle, relative=False)
def handle_scale_request(object_label, scale_factor, about_point=None)
def handle_expression_request(object_label, property_name, expression=None, clear=False)
```

These wrap the core handlers and add:
- Document locking during modifications
- Undo stack integration (so users can Ctrl+Z LLM changes)
- Event notifications for UI updates

**Acceptance Criteria**:
- [ ] Functions accessible via WebSocket
- [ ] Modifications trigger viewport refresh
- [ ] Changes are undoable

### 5. Result Formatters Update

**File**: `sidecar/src/result-formatters.ts` (extend)

Add formatters for parametric operations:

```typescript
function formatPropertyChangeResult(result: PropertyChangeResult): string
function formatDimensionUpdateResult(result: DimensionUpdateResult): string
function formatMoveRotateResult(result: TransformResult): string
function formatExpressionResult(result: ExpressionResult): string
```

Output should be human-readable summaries:
- "Changed Box.Length from 50mm to 100mm"
- "Moved Cylinder to position (100, 50, 0)"
- "Set expression: Sphere.Radius = Box.Length / 2"

**Acceptance Criteria**:
- [ ] Results are concise but informative
- [ ] Units are displayed correctly
- [ ] Before/after values shown for changes

### 6. Sidecar README Update

**File**: `sidecar/README.md`

Document the new tools:
- Tool names and parameters
- Example natural language commands
- Example tool invocations
- Common object types and their editable properties
- Expression syntax reference

**Acceptance Criteria**:
- [ ] All new tools documented
- [ ] Examples cover common use cases
- [ ] FreeCAD property reference included

### 7. Test End-to-End

**Test Scenarios**:

1. **Single Property Edit**:
   - Create a Box (50x50x50mm)
   - Command: "Make the box 100mm long"
   - Verify: Box.Length changed to 100mm, other dimensions unchanged

2. **Multiple Dimension Update**:
   - Create a Box
   - Command: "Resize the box to 120x60x30mm"
   - Verify: All three dimensions updated correctly

3. **Movement Operations**:
   - Create an object at origin
   - Command: "Move it 50mm to the right"
   - Verify: Position.X increased by 50mm (relative move)
   - Command: "Place it at coordinates 100, 200, 0"
   - Verify: Absolute position set correctly

4. **Rotation Operations**:
   - Create an object
   - Command: "Rotate it 45 degrees around the Z axis"
   - Verify: Rotation applied correctly

5. **Scale Operations**:
   - Create a Box (50x50x50mm)
   - Command: "Scale it by 2x"
   - Verify: All dimensions doubled

6. **Expression Setup**:
   - Create two objects
   - Command: "Make the second box's length always half of the first box"
   - Verify: Expression set, changing first box updates second

7. **Error Handling**:
   - Try to set invalid property name
   - Verify: Clear error message returned
   - Try to set invalid value (negative radius)
   - Verify: Validation error returned

8. **Undo Integration**:
   - Make several changes via LLM
   - Press Ctrl+Z in FreeCAD
   - Verify: Changes are undone in reverse order

**Acceptance Criteria**:
- [ ] All scenarios pass
- [ ] Viewport updates after each change
- [ ] Error messages are actionable
- [ ] Undo stack works correctly

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/property_handlers.py` - Property access and modification handlers

### Modified Files:
1. `sidecar/src/agent-tools.ts` - Add 8 new parametric editing tools
2. `sidecar/src/result-formatters.ts` - Add formatters for property change results
3. `src/Mod/LLMBridge/llm_bridge/__init__.py` - Register new handlers if needed
4. `sidecar/README.md` - Document parametric editing tools

## Dependencies

- FreeCAD property system (`getPropertyList()`, `getPropertyByName()`)
- FreeCAD.Quantity for unit handling
- FreeCAD.Vector for position/rotation
- Existing WebSocket bridge infrastructure
- Existing query handlers (for object lookup)

## Out of Scope

This plan does NOT include:
- Sketcher constraint editing (separate complex domain)
- Feature tree manipulation (suppress/unsuppress features)
- Topological naming (selecting faces/edges by name)
- Mass operations (edit all objects of a type)
- Batch/queued operations

## Definition of Done

- [ ] Property handler module complete with all property categories
- [ ] All 8 parametric editing tools implemented and working
- [ ] Expression management tools functional
- [ ] Results formatted clearly for users
- [ ] Undo integration verified
- [ ] End-to-end tests pass for all scenarios
- [ ] Documentation updated in sidecar README
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

Once parametric editing tools are complete:
- Add sketcher constraint tools (for 2D sketch-based modeling)
- Or: Add boolean operation tools (union, cut, intersect)
- Or: Add assembly constraint tools (for multi-part designs)
