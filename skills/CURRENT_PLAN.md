## Status: IN PROGRESS

# Cycle 11: Assembly Constraint Tools - IN PROGRESS

## Overview

Enable the LLM to create and manage assembly constraints between multiple parts in FreeCAD. Users can describe assembly relationships in natural language ("make these two faces coincident", "align these axes", "add a 5mm offset between these surfaces") and Claude will execute the appropriate FreeCAD Assembly API calls to constrain components together.

This is a critical capability for multi-part designs - after creating individual parts (via PartDesign or Part workbench), users need to assemble them with constraints like Coincident, Parallel, Perpendicular, Angle, Distance, and Insert to define their spatial relationships.

## Prerequisites

The following must already exist:
- `sidecar/src/agent-tools.ts` - Custom tools infrastructure
- `sidecar/src/result-formatters.ts` - Result formatting utilities
- `src/Mod/LLMBridge/llm_bridge/query_handlers.py` - Object lookup and validation
- `src/Mod/LLMBridge/llm_bridge/boolean_handlers.py` - Reference for handler patterns
- Boolean operation tools working (Cycle 10 COMPLETED)

## Tasks

### 1. Assembly Constraint Handler Module

**File**: `src/Mod/LLMBridge/llm_bridge/assembly_handlers.py` (new file)

Create Python handlers for assembly constraint operations using FreeCAD's Assembly module (or A2plus/Assembly3 if available):

```python
# Assembly creation and management
def handle_create_assembly(name=None) -> dict
def handle_add_component_to_assembly(object_name, assembly_name) -> dict
def handle_remove_component_from_assembly(object_name, assembly_name) -> dict
def handle_list_assemblies() -> dict
def handle_list_assembly_components(assembly_name) -> dict

# Constraint creation
def handle_add_coincident_constraint(object1, subobject1, object2, subobject2, name=None) -> dict
def handle_add_parallel_constraint(object1, subobject1, object2, subobject2, name=None) -> dict
def handle_add_perpendicular_constraint(object1, subobject1, object2, subobject2, name=None) -> dict
def handle_add_angle_constraint(object1, subobject1, object2, subobject2, angle, name=None) -> dict
def handle_add_distance_constraint(object1, subobject1, object2, subobject2, distance, name=None) -> dict
def handle_add_insert_constraint(object1, subobject1, object2, subobject2, name=None) -> dict
def handle_add_tangent_constraint(object1, subobject1, object2, subobject2, name=None) -> dict
def handle_add_equal_constraint(object1, subobject1, object2, subobject2, name=None) -> dict
def handle_add_symmetric_constraint(object1, subobject1, object2, subobject2, symmetry_plane, name=None) -> dict

# Constraint modification
def handle_update_constraint_value(constraint_name, new_value) -> dict
def handle_remove_constraint(constraint_name) -> dict
def handle_list_constraints(assembly_name=None) -> dict
def handle_suppress_constraint(constraint_name) -> dict
def handle_activate_constraint(constraint_name) -> dict

# Subobject reference helpers
def get_subobject_reference(object_name, subobject_type, index) -> dict
```

Key implementation details:
- Use FreeCAD's Assembly module (or A2plus/Assembly3 workbench depending on availability)
- Support subobject references (faces, edges, vertices) for constraint definition
- Handle constraint types: Coincident, Parallel, Perpendicular, Angle, Distance, Insert, Tangent, Equal, Symmetric
- Support naming of constraints for later modification
- Return constraint info including type, referenced objects, and parameter values
- Handle errors gracefully (invalid references, over-constrained assemblies, conflicting constraints)
- Support constraint suppression/activation for iterative design

**Acceptance Criteria**:
- [ ] Assembly container creation and management
- [ ] Component addition/removal from assemblies
- [ ] All 9 constraint types supported
- [ ] Subobject references (faces, edges, vertices) work correctly
- [ ] Constraints are parametric (editable after creation)
- [ ] Clear error messages for invalid operations
- [ ] Constraint solver status reported

### 2. Assembly Management Tools

**File**: `sidecar/src/agent-tools.ts`

Add tools for assembly structure:

1. **`create_assembly`** - Create a new assembly container:
   - Parameters: `name` (optional name for the assembly)
   - Returns: `{success, assemblyName, message}`
   - Examples: "Create a new assembly", "Start an assembly named 'EngineAssembly'"

2. **`add_component_to_assembly`** - Add a part to an assembly:
   - Parameters: `objectName` (part to add), `assemblyName` (target assembly)
   - Returns: `{success, componentName, assemblyName, message}`
   - Examples: "Add the piston to the engine assembly", "Include the cylinder in this assembly"

3. **`remove_component_from_assembly`** - Remove a part from an assembly:
   - Parameters: `componentName` (to remove), `assemblyName` (target assembly)
   - Returns: `{success, removedComponent, message}`
   - Examples: "Remove the bolt from this assembly"

4. **`list_assemblies`** - List all assemblies in the document:
   - Parameters: none
   - Returns: `{success, assemblies: [{name, label, componentCount}]}`
   - Examples: "Show me all assemblies", "What assemblies exist?"

5. **`list_assembly_components`** - List components in a specific assembly:
   - Parameters: `assemblyName` (required)
   - Returns: `{success, assemblyName, components: [{name, position, constraintCount}]}`
   - Examples: "What parts are in the engine assembly?"

**Acceptance Criteria**:
- [ ] Assembly creation works
- [ ] Components can be added/removed
- [ ] Assembly listing shows correct info
- [ ] Works with both Part and PartDesign objects

### 3. Constraint Creation Tools

**File**: `sidecar/src/agent-tools.ts` (additional tools)

6. **`add_coincident_constraint`** - Make two subobjects coincident (face-face, edge-edge, point-point):
   - Parameters: `object1`, `subobject1` (type + index), `object2`, `subobject2`, `name` (optional)
   - Returns: `{success, constraintName, constraintType, objects, message}`
   - Examples: "Make these two faces coincident", "Align the back face of part1 with the front face of part2"

7. **`add_parallel_constraint`** - Make two linear subobjects parallel:
   - Parameters: `object1`, `subobject1`, `object2`, `subobject2`, `name` (optional)
   - Returns: `{success, constraintName, constraintType, message}`
   - Examples: "Make these edges parallel", "Align the axes to be parallel"

8. **`add_perpendicular_constraint`** - Make two subobjects perpendicular:
   - Parameters: `object1`, `subobject1`, `object2`, `subobject2`, `name` (optional)
   - Returns: `{success, constraintName, constraintType, message}`
   - Examples: "Make this face perpendicular to that face"

9. **`add_angle_constraint`** - Set an angle between two subobjects:
   - Parameters: `object1`, `subobject1`, `object2`, `subobject2`, `angle` (degrees), `name` (optional)
   - Returns: `{success, constraintName, constraintType, angle, message}`
   - Examples: "Set a 45 degree angle between these faces", "Add a 90 degree angle constraint"

10. **`add_distance_constraint`** - Set a distance between two subobjects:
    - Parameters: `object1`, `subobject1`, `object2`, `subobject2`, `distance` (mm), `name` (optional)
    - Returns: `{success, constraintName, constraintType, distance, message}`
    - Examples: "Set a 10mm gap between these faces", "Add a 5mm offset constraint"

11. **`add_insert_constraint`** - Insert one subobject into another (cylindrical fit):
    - Parameters: `object1`, `subobject1`, `object2`, `subobject2`, `name` (optional)
    - Returns: `{success, constraintName, constraintType, message}`
    - Examples: "Insert this pin into the hole", "Make the shaft fit into the bearing"

12. **`add_tangent_constraint`** - Make two subobjects tangent:
    - Parameters: `object1`, `subobject1`, `object2`, `subobject2`, `name` (optional)
    - Returns: `{success, constraintName, constraintType, message}`
    - Examples: "Make this cylinder tangent to the plane"

13. **`add_equal_constraint`** - Make two subobjects equal (length, radius):
    - Parameters: `object1`, `subobject1`, `object2`, `subobject2`, `name` (optional)
    - Returns: `{success, constraintName, constraintType, message}`
    - Examples: "Make these two circles equal radius", "Make these edges equal length"

14. **`add_symmetric_constraint`** - Make two subobjects symmetric about a plane:
    - Parameters: `object1`, `subobject1`, `object2`, `subobject2`, `symmetryPlane` (plane reference), `name` (optional)
    - Returns: `{success, constraintName, constraintType, message}`
    - Examples: "Make these features symmetric about the XY plane"

**Acceptance Criteria**:
- [ ] All constraint types implemented
- [ ] Subobject references work (Face1, Edge3, Vertex2, etc.)
- [ ] Constraints are properly named and tracked
- [ ] Angle and distance constraints use correct units

### 4. Constraint Modification Tools

**File**: `sidecar/src/agent-tools.ts` (additional tools)

15. **`update_constraint_value`** - Modify a constraint's parameter:
    - Parameters: `constraintName` (required), `newValue` (for angle/distance constraints)
    - Returns: `{success, constraintName, oldValue, newValue, message}`
    - Examples: "Change the angle to 60 degrees", "Update the gap to 15mm"

16. **`remove_constraint`** - Delete a constraint:
    - Parameters: `constraintName` (required)
    - Returns: `{success, removedConstraint, message}`
    - Examples: "Remove the coincident constraint", "Delete the last constraint added"

17. **`list_constraints`** - List all constraints in an assembly:
    - Parameters: `assemblyName` (optional, defaults to active assembly)
    - Returns: `{success, constraints: [{name, type, objects, value, status}]}`
    - Examples: "Show me all constraints", "What constraints are in this assembly?"

18. **`suppress_constraint`** - Temporarily disable a constraint:
    - Parameters: `constraintName` (required)
    - Returns: `{success, constraintName, message}`
    - Examples: "Temporarily disable this constraint"

19. **`activate_constraint`** - Re-enable a suppressed constraint:
    - Parameters: `constraintName` (required)
    - Returns: `{success, constraintName, message}`
    - Examples: "Re-enable the suppressed constraint"

**Acceptance Criteria**:
- [ ] Constraint modification works
- [ ] Values can be updated parametrically
- [ ] Suppression/activation works
- [ ] Constraint listing shows status

### 5. Python Bridge Extensions

**File**: `src/Mod/LLMBridge/llm_bridge/assembly_handlers.py` (extend)

Add WebSocket-accessible wrapper functions:

```python
# Called via execute_freecad_python
def handle_create_assembly_request(name=None)
def handle_add_component_request(object_name, assembly_name)
def handle_add_coincident_request(obj1, sub1, obj2, sub2, name=None)
def handle_add_angle_constraint_request(obj1, sub1, obj2, sub2, angle, name=None)
def handle_update_constraint_value_request(constraint_name, new_value)
def handle_list_constraints_request(assembly_name=None)
# ... etc for all tools
```

These wrap the core handlers and add:
- Document locking during modifications
- Object/subobject existence validation
- Assembly solver invocation after constraint changes
- Undo stack integration
- Event notifications for UI updates
- Constraint conflict detection

**Acceptance Criteria**:
- [ ] Functions accessible via WebSocket
- [ ] Assembly solver runs after changes
- [ ] Changes are undoable
- [ ] Viewport updates after constraint changes

### 6. Result Formatters Update

**File**: `sidecar/src/result-formatters.ts` (extend)

Add formatters for assembly operations:

```typescript
function formatAssemblyCreationResult(result: AssemblyCreationResult): string
function formatComponentList(result: ComponentListResult): string
function formatConstraintCreationResult(result: ConstraintCreationResult): string
function formatConstraintList(result: ConstraintListResult): string
function formatConstraintUpdate(result: ConstraintUpdateResult): string
```

Output should be human-readable summaries:
- "Created assembly 'EngineAssembly'"
- "Added 'Piston' to assembly 'EngineAssembly'"
- "Added Coincident constraint 'Coincident1' between Box:Face1 and Cylinder:Face2"
- "Added Angle constraint 'Angle1': 45 deg between Part1:Edge1 and Part2:Edge2"
- "Updated 'Angle1' from 45 deg to 60 deg"
- "Assembly has 5 constraints, all solved successfully"

**Acceptance Criteria**:
- [ ] Results are concise but informative
- [ ] Units displayed correctly (deg, mm)
- [ ] Constraint type and subobject references shown
- [ ] Assembly context included

### 7. Sidecar README Update

**File**: `sidecar/README.md`

Document the new tools:
- Tool names and parameters
- Example natural language commands
- Example tool invocations
- Constraint types reference table
- Subobject reference format (Face1, Edge2, etc.)
- Assembly workflow guidance
- Common constraint patterns and best practices

**Acceptance Criteria**:
- [ ] All new tools documented
- [ ] Examples cover common assembly scenarios
- [ ] Constraint type reference included
- [ ] Workflow examples provided

### 8. Test End-to-End

**Test Scenarios**:

1. **Basic Assembly Creation**:
   - Create two separate parts (box and cylinder)
   - Command: "Create a new assembly called 'TestAssembly'"
   - Verify: Assembly container created in model tree

2. **Add Components**:
   - Command: "Add the Box and Cylinder to TestAssembly"
   - Verify: Both parts appear under assembly in tree

3. **Coincident Constraint**:
   - Command: "Make the bottom face of the cylinder coincident with the top face of the box"
   - Verify: Constraint created, parts move to satisfy constraint

4. **Angle Constraint**:
   - Command: "Set a 30 degree angle between these faces"
   - Verify: Angle constraint applied, assembly updates

5. **Distance Constraint**:
   - Command: "Add a 10mm gap between these surfaces"
   - Verify: Distance constraint applied with correct offset

6. **Insert Constraint**:
   - Create a pin and hole
   - Command: "Insert the pin into the hole"
   - Verify: Cylindrical constraint created, parts align

7. **Multi-Constraint Assembly**:
   - Command: "Assemble these 4 parts with coincident and parallel constraints"
   - Verify: Multiple constraints work together, assembly solves

8. **Constraint Modification**:
   - Command: "Change the angle to 60 degrees"
   - Verify: Constraint updated, assembly repositions

9. **Constraint Listing**:
   - Command: "Show me all constraints in this assembly"
   - Verify: List shows all constraints with types and values

10. **Error Handling - Over-constrained**:
    - Add conflicting constraints
    - Command: "Add a perpendicular constraint" (when already constrained)
    - Verify: Clear error message about over-constrained assembly

11. **Error Handling - Invalid Reference**:
    - Command: "Make Face99 coincident" (when face doesn't exist)
    - Verify: Clear error message about invalid subobject

**Acceptance Criteria**:
- [ ] All scenarios pass
- [ ] Assembly solves correctly after each constraint
- [ ] Constraints are parametric and editable
- [ ] Error messages are actionable
- [ ] Viewport updates after constraint changes

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/assembly_handlers.py` - Assembly constraint handlers

### Modified Files:
1. `sidecar/src/agent-tools.ts` - Add 19 assembly tools (5 management, 9 creation, 5 modification)
2. `sidecar/src/result-formatters.ts` - Add formatters for assembly and constraint results
3. `sidecar/README.md` - Document assembly constraint tools
4. `src/Mod/LLMBridge/llm_bridge/__init__.py` - Register new handlers

## Dependencies

- FreeCAD Assembly module (or A2plus/Assembly3 workbench)
- Existing WebSocket bridge infrastructure
- Existing query handlers (for object lookup)
- Subobject reference handling (faces, edges, vertices)

## Out of Scope

This plan does NOT include:
- Advanced assembly features (gear constraints, screw constraints)
- Kinematic simulation (motion analysis)
- Interference detection during assembly
- Exploded view creation
- Bill of Materials (BOM) generation
- Assembly drawings and annotations
- Multi-level sub-assemblies (nested assemblies)

## Definition of Done

- [ ] Assembly handler module complete with all constraint types
- [ ] All 19 assembly tools implemented and working
- [ ] Subobject references work correctly
- [ ] Assembly solver integration functional
- [ ] Results formatted clearly for users
- [ ] End-to-end tests pass for all scenarios
- [ ] Documentation updated in sidecar README
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

Once assembly constraint tools are complete:
- Add Draft workbench tools (2D drafting, dimensions, annotations)
- Add TechDraw workbench integration (creating drawings from 3D models)
- Add advanced assembly features (kinematic constraints, motion)
- Add pattern and array tools for repetitive features
