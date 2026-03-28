## Status: COMPLETED

# Current Plan: Sketcher Constraint Tools

## Overview

Enable the LLM to create and modify 2D sketches with geometric constraints in FreeCAD. Users can describe sketch requirements in natural language ("draw a rectangle with equal sides", "make a circle tangent to this line", "add a horizontal constraint to this edge") and Claude will execute the appropriate FreeCAD Sketcher API calls to create sketches, add geometry, and apply constraints.

This is a critical capability for parametric CAD design - sketches are the foundation of most 3D features (pads, pockets, revolutions) in FreeCAD's PartDesign workbench.

## Prerequisites

The following must already exist:
- `sidecar/src/agent-tools.ts` - Custom tools infrastructure
- `sidecar/src/result-formatters.ts` - Result formatting utilities
- `src/Mod/LLMBridge/llm_bridge/property_handlers.py` - Property handlers (reference for pattern)
- `src/Mod/LLMBridge/llm_bridge/query_handlers.py` - Query handlers (reference for object lookup)
- Parametric editing tools working (for modifying sketch-based features)

## Tasks

### 1. Sketcher Handler Module

**File**: `src/Mod/LLMBridge/llm_bridge/sketcher_handlers.py` (new file)

Create Python handlers for sketch operations and constraint management:

```python
# Sketch creation and management
def create_new_sketch(doc, plane_name="XY") -> dict
def get_sketch_geometry(sketch_obj) -> dict
def add_sketch_geometry(sketch_obj, geo_type, params) -> dict
def delete_sketch_geometry(sketch_obj, geo_index) -> dict

# Constraint operations
def add_constraint(sketch_obj, constraint_type, geo_indices, params) -> dict
def remove_constraint(sketch_obj, constraint_index) -> dict
def get_constraints(sketch_obj) -> list
def update_constraint_value(sketch_obj, constraint_index, value) -> dict

# Constraint types supported:
# - Geometric: Horizontal, Vertical, Parallel, Perpendicular, Tangent, Coincident, Midpoint
# - Dimensional: Distance, Angle, Radius, Diameter
# - Symmetry: Symmetric, Equal
```

Key implementation details:
- Use FreeCAD's Sketcher module (`Sketcher`, `Sketcher.Constraint`)
- Handle sketch coordinate systems (local sketch coordinates vs global)
- Support constraint value units (mm, degrees)
- Return sketch geometry and constraint lists for verification
- Handle constraint conflicts and over-constraint errors

**Acceptance Criteria**:
- [ ] Works with PartDesign Body sketches
- [ ] Supports all common constraint types
- [ ] Handles constraint conflicts gracefully
- [ ] Returns clear error messages for invalid operations
- [ ] Supports both 2D and mapped sketches (on faces)

### 2. Sketch Creation Tools

**File**: `sidecar/src/agent-tools.ts`

Add tools for creating and managing sketches:

1. **`create_sketch`** - Create a new sketch on a plane or face:
   - Parameters: `plane` ("XY", "XZ", "YZ", or face reference), `name` (optional)
   - Returns: `{success, sketchName, sketchId, plane}`
   - Examples: "Create a sketch on the XY plane", "Start a new sketch on the top face"

2. **`add_sketch_geometry`** - Add geometry to a sketch:
   - Parameters: `sketchName` (required), `geometryType` (line, circle, rectangle, arc, point), `params` (coordinates, radii)
   - Returns: `{success, sketchName, geometryIndex, geometryType}`
   - Examples: "Add a line from (0,0) to (50,0)", "Draw a circle at origin with radius 20mm"

3. **`delete_sketch_geometry`** - Remove geometry from a sketch:
   - Parameters: `sketchName` (required), `geometryIndex` (required)
   - Returns: `{success, sketchName, deletedIndex}`
   - Examples: "Delete the first line in the sketch"

4. **`get_sketch_geometry`** - List all geometry in a sketch:
   - Parameters: `sketchName` (required)
   - Returns: `{success, sketchName, geometry: [{type, index, points, ...}]}`
   - Examples: "Show me what's in this sketch"

**Acceptance Criteria**:
- [ ] All sketch creation tools integrated
- [ ] Geometry types: Line, Circle, Arc, Rectangle, Point
- [ ] Returns geometry indices for constraint reference
- [ ] Proper error handling for invalid operations

### 3. Constraint Management Tools

**File**: `sidecar/src/agent-tools.ts` (additional tools)

5. **`add_constraint`** - Add a geometric or dimensional constraint:
   - Parameters: `sketchName` (required), `constraintType` (required), `geometryIndices` (array), `value` (optional for dimensional)
   - Returns: `{success, sketchName, constraintIndex, constraintType}`
   - Examples: "Make this line horizontal", "Set the distance between these points to 50mm", "Make these two lines parallel"

6. **`remove_constraint`** - Remove a constraint from a sketch:
   - Parameters: `sketchName` (required), `constraintIndex` (required)
   - Returns: `{success, sketchName, removedIndex}`
   - Examples: "Remove the first constraint"

7. **`list_constraints`** - List all constraints on a sketch:
   - Parameters: `sketchName` (required)
   - Returns: `{success, sketchName, constraints: [{index, type, geometry, value}]}`
   - Examples: "What constraints are on this sketch?"

8. **`update_constraint`** - Update a dimensional constraint value:
   - Parameters: `sketchName` (required), `constraintIndex` (required), `value` (required)
   - Returns: `{success, sketchName, constraintIndex, oldValue, newValue}`
   - Examples: "Change the distance constraint to 60mm"

**Constraint Types Supported**:
- `horizontal` - Make line horizontal
- `vertical` - Make line vertical
- `parallel` - Make two lines parallel
- `perpendicular` - Make two lines perpendicular
- `tangent` - Make curves tangent
- `coincident` - Make points coincident
- `midpoint` - Point at line midpoint
- `equal` - Equal length/radius
- `symmetric` - Points symmetric about line
- `distance` - Distance between points/lines
- `angle` - Angle between lines
- `radius` - Circle/arc radius
- `diameter` - Circle diameter

**Acceptance Criteria**:
- [ ] All constraint types supported
- [ ] Dimensional constraints accept unit values
- [ ] Constraint conflicts detected and reported
- [ ] Over-constrained sketches handled gracefully

### 4. Python Bridge Extensions

**File**: `src/Mod/LLMBridge/llm_bridge/sketcher_handlers.py` (extend)

Add WebSocket-accessible functions:

```python
# Called via execute_freecad_python
def handle_create_sketch_request(plane="XY", name=None)
def handle_add_geometry_request(sketch_name, geometry_type, params)
def handle_add_constraint_request(sketch_name, constraint_type, geo_indices, value=None)
def handle_list_constraints_request(sketch_name)
def handle_get_sketch_geometry_request(sketch_name)
```

These wrap the core handlers and add:
- Document locking during modifications
- Sketch solver status checking
- Undo stack integration
- Event notifications for UI updates

**Acceptance Criteria**:
- [ ] Functions accessible via WebSocket
- [ ] Sketch solver status reported
- [ ] Changes are undoable
- [ ] Viewport refreshes after sketch changes

### 5. Result Formatters Update

**File**: `sidecar/src/result-formatters.ts` (extend)

Add formatters for sketcher operations:

```typescript
function formatSketchCreationResult(result: SketchCreationResult): string
function formatGeometryResult(result: GeometryResult): string
function formatConstraintList(result: ConstraintListResult): string
function formatConstraintChange(result: ConstraintChangeResult): string
```

Output should be human-readable summaries:
- "Created sketch 'Sketch' on XY plane"
- "Added line from (0,0) to (50,0)"
- "Added horizontal constraint on Line1"
- "Set distance constraint to 50mm"
- "Sketch is fully constrained"

**Acceptance Criteria**:
- [ ] Results are concise but informative
- [ ] Units displayed correctly for dimensional constraints
- [ ] Sketch constraint status shown (under/fully/over-constrained)

### 6. Sidecar README Update

**File**: `sidecar/README.md`

Document the new tools:
- Tool names and parameters
- Example natural language commands
- Example tool invocations
- Supported geometry types
- Supported constraint types with syntax
- Common sketch creation patterns

**Acceptance Criteria**:
- [ ] All new tools documented
- [ ] Examples cover common use cases
- [ ] Constraint type reference included
- [ ] Sketch coordinate system explained

### 7. Test End-to-End

**Test Scenarios**:

1. **Basic Sketch Creation**:
   - Command: "Create a sketch on the XY plane"
   - Verify: New sketch created, visible in model tree

2. **Add Rectangle**:
   - Create a sketch
   - Command: "Add a rectangle with corners at (0,0) and (50,30)"
   - Verify: Four lines forming rectangle in sketch

3. **Apply Constraints**:
   - Create a sketch with two lines
   - Command: "Make the first line horizontal"
   - Verify: Horizontal constraint applied, line aligned

4. **Dimensional Constraints**:
   - Create a sketch with a line
   - Command: "Set the line length to 50mm"
   - Verify: Distance constraint applied, line measures 50mm

5. **Geometric Relationships**:
   - Create two lines
   - Command: "Make these lines parallel and equal length"
   - Verify: Both constraints applied correctly

6. **Circle with Constraints**:
   - Create a sketch
   - Command: "Add a circle at origin with 20mm radius, make it tangent to a line"
   - Verify: Circle created, tangent constraint applied

7. **Over-Constraint Handling**:
   - Create a fully constrained sketch
   - Command: "Add another distance constraint"
   - Verify: Clear error about over-constraining

8. **Constraint Modification**:
   - Create a dimensioned sketch
   - Command: "Change the width to 60mm"
   - Verify: Constraint value updated, sketch regenerates

**Acceptance Criteria**:
- [ ] All scenarios pass
- [ ] Sketch solver reports correct status
- [ ] Error messages are actionable
- [ ] Viewport updates after each change

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/sketcher_handlers.py` - Sketch and constraint handlers

### Modified Files:
1. `sidecar/src/agent-tools.ts` - Add 8 sketcher tools
2. `sidecar/src/result-formatters.ts` - Add formatters for sketcher results
3. `sidecar/README.md` - Document sketcher tools
4. `src/Mod/LLMBridge/llm_bridge/__init__.py` - Register new handlers if needed

## Dependencies

- FreeCAD Sketcher module (`Sketcher`, `Sketcher.Constraint`)
- FreeCAD PartDesign module (for body sketches)
- Existing WebSocket bridge infrastructure
- Existing query handlers (for sketch object lookup)

## Out of Scope

This plan does NOT include:
- Sketcher external geometry references (complex edge cases)
- Constraint migration between sketches
- Sketch mirroring/pattern operations
- Advanced sketcher tools (conics, ellipses, B-splines)
- Sketch validation and repair tools

## Definition of Done

- [ ] Sketcher handler module complete with all geometry and constraint operations
- [ ] All 8 sketcher tools implemented and working
- [ ] Results formatted clearly for users
- [ ] Constraint status reporting functional
- [ ] End-to-end tests pass for all scenarios
- [ ] Documentation updated in sidecar README
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

Once sketcher constraint tools are complete:
- Add boolean operation tools (union, cut, intersect)
- Or: Add PartDesign feature tools (Pad, Pocket, Revolution, Groove)
- Or: Add assembly constraint tools (for multi-part designs)
