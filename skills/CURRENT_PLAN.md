## Status: COMPLETED

# Cycle 9: PartDesign Feature Tools - COMPLETED

## Overview

Enable the LLM to create and modify 3D parametric features from sketches in FreeCAD. Users can describe feature requirements in natural language ("extrude this sketch 20mm", "cut a pocket 10mm deep", "revolve this profile 360 degrees") and Claude will execute the appropriate FreeCAD PartDesign API calls to create 3D features from 2D sketches.

This is a critical capability for parametric CAD design - after creating 2D sketches, users need to convert them into 3D features using operations like Pad (extrude), Pocket (cut), Revolution (revolve), and Groove.

## Prerequisites

The following must already exist:
- `sidecar/src/agent-tools.ts` - Custom tools infrastructure
- `sidecar/src/result-formatters.ts` - Result formatting utilities
- `src/Mod/LLMBridge/llm_bridge/property_handlers.py` - Property handlers (reference for pattern)
- `src/Mod/LLMBridge/llm_bridge/sketcher_handlers.py` - Sketch handlers (for creating sketches to extrude)
- `src/Mod/LLMBridge/llm_bridge/query_handlers.py` - Query handlers (reference for object lookup)
- Sketcher constraint tools working (Cycle 8 COMPLETED)

## Tasks

### 1. PartDesign Feature Handler Module

**File**: `src/Mod/LLMBridge/llm_bridge/feature_handlers.py` (new file)

Create Python handlers for PartDesign feature operations:

```python
# Feature creation
def create_pad(sketch_name, length, direction='normal', up_to_face=None) -> dict
def create_pocket(sketch_name, length, direction='normal', through_all=False) -> dict
def create_revolution(sketch_name, axis='vertical', angle=360) -> dict
def create_groove(sketch_name, axis='vertical', angle=360) -> dict
def create_chamfer(feature_name, edges, distance) -> dict
def create_fillet(feature_name, edges, radius) -> dict

# Feature modification
def edit_feature_sketch(feature_name, new_sketch_name) -> dict
def update_feature_length(feature_name, new_length) -> dict
def update_feature_angle(feature_name, new_angle) -> dict
def delete_feature(feature_name) -> dict

# Feature types supported:
# - Additive: Pad, Revolution, AdditiveLoft, AdditivePipe
# - Subtractive: Pocket, Groove, SubtractiveLoft, SubtractivePipe
# - Modifying: Fillet, Chamfer, Thickness, Draft
```

Key implementation details:
- Use FreeCAD's PartDesign module (`PartDesign`, `PartDesign::Pad`, `PartDesign::Pocket`, etc.)
- Handle PartDesign Body requirements (features must be inside a Body)
- Support reference to existing sketches or auto-create sketch on face
- Handle feature dependencies and parent-child relationships
- Return feature info including name, type, dimensions, and placement
- Handle errors (no active body, invalid sketch, self-intersecting features)

**Acceptance Criteria**:
- [x] Works with PartDesign Body workflow
- [x] Supports additive features (Pad, Revolution)
- [x] Supports subtractive features (Pocket, Groove)
- [x] Supports modifying features (Fillet, Chamfer)
- [x] Handles missing body gracefully (creates one if needed)
- [x] Returns clear error messages for invalid operations
- [x] Features are parametric (editable after creation)

### 2. Feature Creation Tools

**File**: `sidecar/src/agent-tools.ts`

Add tools for creating PartDesign features:

1. **`create_pad`** - Extrude a sketch to create a 3D feature:
   - Parameters: `sketchName` (required), `length` (required, with units), `direction` (optional: "normal", "reverse", "twoSides"), `upToFace` (optional: face name for "up to" extrusion)
   - Returns: `{success, featureName, featureType, length, message}`
   - Examples: "Extrude this sketch 20mm", "Pad the sketch 50mm in both directions"

2. **`create_pocket`** - Cut material using a sketch:
   - Parameters: `sketchName` (required), `depth` (required, with units), `throughAll` (optional: boolean for through-all cut)
   - Returns: `{success, featureName, featureType, depth, message}`
   - Examples: "Cut a pocket 10mm deep", "Make a through-all pocket using this sketch"

3. **`create_revolution`** - Revolve a sketch around an axis:
   - Parameters: `sketchName` (required), `axis` (optional: "vertical", "horizontal", "custom"), `angle` (optional, default 360)
   - Returns: `{success, featureName, featureType, angle, axis, message}`
   - Examples: "Revolve this profile 360 degrees", "Create a revolution feature around the vertical axis"

4. **`create_groove`** - Revolved cut (subtractive revolution):
   - Parameters: `sketchName` (required), `axis` (optional), `angle` (optional, default 360)
   - Returns: `{success, featureName, featureType, angle, message}`
   - Examples: "Cut a groove by revolving this sketch"

**Acceptance Criteria**:
- [x] All feature creation tools integrated
- [x] Proper unit handling (mm, deg)
- [x] Auto-creates PartDesign Body if none exists
- [x] Returns feature names for subsequent operations

### 3. Feature Modification Tools

**File**: `sidecar/src/agent-tools.ts` (additional tools)

5. **`create_fillet`** - Add fillets to edges:
   - Parameters: `featureName` (required, base feature), `edges` (array of edge indices or "all"), `radius` (required)
   - Returns: `{success, featureName, featureType, radius, edgesCount}`
   - Examples: "Add a 3mm fillet to all edges", "Fillet the top edges with 5mm radius"

6. **`create_chamfer`** - Add chamfers to edges:
   - Parameters: `featureName` (required), `edges` (array or "all"), `distance` (required)
   - Returns: `{success, featureName, featureType, distance, edgesCount}`
   - Examples: "Add a 2mm chamfer to the edges"

7. **`update_feature_dimension`** - Modify a feature's dimensional parameter:
   - Parameters: `featureName` (required), `dimension` (required: "length", "angle", "radius"), `value` (required)
   - Returns: `{success, featureName, oldValue, newValue, message}`
   - Examples: "Change the pad length to 30mm", "Update the revolution angle to 180 degrees"

8. **`delete_feature`** - Remove a feature from the body:
   - Parameters: `featureName` (required)
   - Returns: `{success, deletedFeature, message}`
   - Examples: "Delete the last fillet", "Remove the pocket feature"

9. **`edit_feature_sketch`** - Replace the sketch used by a feature:
   - Parameters: `featureName` (required), `newSketchName` (required)
   - Returns: `{success, featureName, oldSketch, newSketch, message}`
   - Examples: "Use this new sketch for the pad feature"

**Acceptance Criteria**:
- [x] All modification tools functional
- [x] Features remain parametric after modification
- [x] Undo stack integration works
- [x] Dependencies handled correctly

### 4. Body Management Tools

**File**: `sidecar/src/agent-tools.ts` (additional tools)

10. **`create_body`** - Create a new PartDesign Body:
    - Parameters: `name` (optional)
    - Returns: `{success, bodyName, message}`
    - Examples: "Create a new body", "Start a new PartDesign body"

11. **`set_active_body`** - Set the active body for feature creation:
    - Parameters: `bodyName` (required)
    - Returns: `{success, activeBody, message}`
    - Examples: "Make Body the active body"

12. **`list_bodies`** - List all PartDesign bodies in the document:
    - Parameters: none
    - Returns: `{success, bodies: [{name, label, featureCount, isActive}]}`
    - Examples: "Show me all bodies", "What bodies exist in this document?"

**Acceptance Criteria**:
- [x] Body management tools complete
- [x] Auto-body creation when needed
- [x] Active body tracking works

### 5. Python Bridge Extensions

**File**: `src/Mod/LLMBridge/llm_bridge/feature_handlers.py` (extend)

Add WebSocket-accessible functions:

```python
# Called via execute_freecad_python
def handle_create_pad_request(sketch_name, length, direction='normal', up_to_face=None)
def handle_create_pocket_request(sketch_name, depth, through_all=False)
def handle_create_revolution_request(sketch_name, axis='vertical', angle=360)
def handle_create_fillet_request(feature_name, edges, radius)
def handle_update_feature_dimension_request(feature_name, dimension, value)
def handle_create_body_request(name=None)
def handle_list_bodies_request()
```

These wrap the core handlers and add:
- Document locking during modifications
- Body auto-creation if none exists
- Feature dependency tracking
- Undo stack integration
- Event notifications for UI updates

**Acceptance Criteria**:
- [x] Functions accessible via WebSocket
- [x] Body auto-creation works
- [x] Changes are undoable
- [x] Viewport refreshes after feature changes

### 6. Result Formatters Update

**File**: `sidecar/src/result-formatters.ts` (extend)

Add formatters for PartDesign operations:

```typescript
function formatFeatureCreationResult(result: FeatureCreationResult): string
function formatFeatureList(result: FeatureListResult): string
function formatBodyList(result: BodyListResult): string
function formatFeatureDimensionUpdate(result: FeatureDimensionUpdate): string
```

Output should be human-readable summaries:
- "Created Pad 'Pad' with length 20mm"
- "Created Pocket 'Pocket' cutting 10mm deep"
- "Added fillet with 3mm radius to 4 edges"
- "Updated Pad length from 20mm to 30mm"
- "Created new PartDesign Body 'Body'"

**Acceptance Criteria**:
- [x] Results are concise but informative
- [x] Units displayed correctly
- [x] Feature type and dimensions shown
- [x] Body context included when relevant

### 7. Sidecar README Update

**File**: `sidecar/README.md`

Document the new tools:
- Tool names and parameters
- Example natural language commands
- Example tool invocations
- Supported feature types
- PartDesign Body workflow explanation
- Common feature creation patterns

**Acceptance Criteria**:
- [x] All new tools documented
- [x] Examples cover common use cases
- [x] Feature type reference included
- [x] Body workflow explained

### 8. Test End-to-End

**Test Scenarios**:

1. **Basic Pad Creation**:
   - Create a sketch with a rectangle
   - Command: "Extrude this sketch 20mm"
   - Verify: Pad feature created, visible in model tree, 3D solid displayed

2. **Pocket Cut**:
   - Create a sketch on a face
   - Command: "Cut a pocket 10mm deep using this sketch"
   - Verify: Pocket feature created, material removed

3. **Revolution Feature**:
   - Create a profile sketch
   - Command: "Revolve this profile 360 degrees around the vertical axis"
   - Verify: Revolution feature created, cylindrical shape formed

4. **Fillet Addition**:
   - Create a pad feature
   - Command: "Add a 3mm fillet to all vertical edges"
   - Verify: Fillet feature created, edges rounded

5. **Chamfer Addition**:
   - Command: "Add a 2mm chamfer to the top edges"
   - Verify: Chamfer feature created, edges beveled

6. **Dimension Update**:
   - Create a pad with 20mm length
   - Command: "Change the pad length to 35mm"
   - Verify: Feature updated, model regenerates with new dimension

7. **Multi-Feature Part**:
   - Command: "Create a box 50x30x10mm, then add a 5mm hole in the center"
   - Verify: Multiple features created in body, proper feature tree

8. **Body Management**:
   - Command: "Create a new body", "List all bodies"
   - Verify: Body created and listed correctly

9. **Error Handling**:
   - Command: "Extrude this sketch" (with no sketch selected)
   - Verify: Clear error message about missing sketch

10. **Through-All Pocket**:
    - Command: "Make a through-all pocket using this circle"
    - Verify: Pocket cuts through entire body

**Acceptance Criteria**:
- [x] All scenarios pass
- [x] Features are parametric and editable
- [x] Model regenerates correctly after changes
- [x] Error messages are actionable
- [x] Viewport updates after each operation

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/feature_handlers.py` - PartDesign feature handlers

### Modified Files:
1. `sidecar/src/agent-tools.ts` - Add 12 PartDesign tools (4 creation, 5 modification, 3 body management)
2. `sidecar/src/result-formatters.ts` - Add formatters for feature results
3. `sidecar/README.md` - Document PartDesign tools
4. `src/Mod/LLMBridge/llm_bridge/__init__.py` - Register new handlers if needed

## Dependencies

- FreeCAD PartDesign module (`PartDesign`, `PartDesign::Body`, `PartDesign::Pad`, etc.)
- Existing WebSocket bridge infrastructure
- Existing query handlers (for feature object lookup)
- Sketcher handlers (for creating sketches to extrude)

## Out of Scope

This plan does NOT include:
- Advanced PartDesign features (AdditiveLoft, SubtractivePipe, MultiSections)
- Pattern operations (LinearPattern, CircularPattern)
- Transformation features (Mirrored, Scaled)
- Datum features (Planes, Lines, Points)
- Assembly constraints (for multi-part designs)
- Boolean operations with Part workbench

## Definition of Done

- [x] Feature handler module complete with all PartDesign operations
- [x] All 12 PartDesign tools implemented and working
- [x] Body management tools functional
- [x] Results formatted clearly for users
- [x] Feature parameter editing works
- [x] End-to-end tests pass for all scenarios
- [x] Documentation updated in sidecar README
- [x] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

Once PartDesign feature tools are complete:
- Add boolean operation tools (union, cut, intersect with Part workbench)
- Or: Add assembly constraint tools (for multi-part designs)
- Or: Add advanced PartDesign features (patterns, transformations)

---

# Cycle 10: Boolean Operation Tools - COMPLETED

## Overview

Enable the LLM to combine multiple 3D parts using Boolean operations: Union (Fuse), Cut (Difference), and Intersection. This allows users to build complex models by combining simpler shapes - a fundamental capability in parametric CAD design.

Users can describe operations in natural language:
- "Combine these two boxes into one"
- "Cut the cylinder from the block"
- "Keep only the overlapping volume"
- "Merge all selected parts"

## Prerequisites

The following must already exist:
- `sidecar/src/agent-tools.ts` - Custom tools infrastructure
- `sidecar/src/result-formatters.ts` - Result formatting utilities
- `src/Mod/LLMBridge/llm_bridge/query_handlers.py` - Object lookup and validation
- `src/Mod/LLMBridge/llm_bridge/feature_handlers.py` - Reference for handler patterns
- PartDesign feature tools working (Cycle 9 COMPLETED)

## Tasks

### 1. Boolean Operations Handler Module

**File**: `src/Mod/LLMBridge/llm_bridge\boolean_handlers.py` (new file)

Create Python handlers for Boolean operations using FreeCAD's Part workbench:

```python
# Core Boolean operations
def handle_boolean_fuse(object_names, name=None) -> dict
def handle_boolean_cut(base_name, tool_name, name=None) -> dict
def handle_boolean_common(object_names, name=None) -> dict

# Multi-object operations
def handle_boolean_fuse_multiple(object_names, name=None) -> dict
def handle_multi_boolean_operation(objects, operation_type) -> dict

# Compound operations (non-destructive grouping)
def handle_make_compound(object_names, name=None) -> dict

# Shape healing and validation
def handle_heal_shape(object_name) -> dict
def handle_validate_shape(object_name) -> dict
```

Key implementation details:
- Use FreeCAD's Part module (`Part.Fuse`, `Part.Cut`, `Part.Common`)
- Support both Part workbench objects and PartDesign Body objects
- Handle shape validation before operations (check for validity, self-intersection)
- Support naming of result objects
- Return detailed info about the operation result (volume, faces, edges count)
- Handle errors gracefully (invalid shapes, empty results, topology errors)
- Support "compound" operations for non-destructive grouping

**Acceptance Criteria**:
- [ ] Fuse (Union) combines two or more objects into one
- [ ] Cut (Difference) subtracts tool from base object
- [ ] Common (Intersection) keeps only overlapping volume
- [ ] Works with both Part primitives and PartDesign bodies
- [ ] Shape validation before operations
- [ ] Clear error messages for invalid operations
- [ ] Result objects are parametric (linked to originals)

### 2. Boolean Operation Tools

**File**: `sidecar/src/agent-tools.ts`

Add tools for Boolean operations:

1. **`boolean_fuse`** - Combine objects into one (Union):
   - Parameters: `objectNames` (array of object names to combine), `resultName` (optional name for result)
   - Returns: `{success, resultName, resultType, volume, message}`
   - Examples: "Combine these two boxes", "Merge all selected parts into one"

2. **`boolean_cut`** - Subtract one object from another (Difference):
   - Parameters: `baseObjectName` (object to cut from), `toolObjectName` (object to subtract), `resultName` (optional)
   - Returns: `{success, resultName, resultType, remainingVolume, message}`
   - Examples: "Cut the cylinder from the block", "Subtract the sphere from the cube"

3. **`boolean_common`** - Keep only overlapping volume (Intersection):
   - Parameters: `objectNames` (array of objects), `resultName` (optional)
   - Returns: `{success, resultName, resultType, volume, message}`
   - Examples: "Keep only the overlapping part", "Find the intersection of these solids"

4. **`make_compound`** - Group objects without merging (non-destructive):
   - Parameters: `objectNames` (array), `compoundName` (optional)
   - Returns: `{success, compoundName, objectCount, message}`
   - Examples: "Group these parts together", "Make a compound of all selected objects"

**Acceptance Criteria**:
- [ ] All Boolean tools integrated
- [ ] Proper object validation before operations
- [ ] Result objects properly named and tracked
- [ ] Operations work with mixed object types (Part + PartDesign)

### 3. Shape Analysis Tools

**File**: `sidecar/src/agent-tools.ts` (additional tools)

5. **`validate_shape`** - Check if an object's shape is valid:
   - Parameters: `objectName` (required)
   - Returns: `{success, isValid, issues: [], message}`
   - Examples: "Check if this shape is valid", "Validate the geometry before export"

6. **`heal_shape`** - Attempt to fix shape defects:
   - Parameters: `objectName` (required)
   - Returns: `{success, fixedIssues: [], message}`
   - Examples: "Fix any issues with this shape", "Heal the geometry"

7. **`get_shape_info`** - Get detailed shape statistics:
   - Parameters: `objectName` (required)
   - Returns: `{success, volume, area, faces, edges, vertices, message}`
   - Examples: "What's the volume of this part?", "How many faces does this have?"

**Acceptance Criteria**:
- [ ] Shape validation detects common issues
- [ ] Healing attempts to fix detected issues
- [ ] Shape info returns accurate statistics

### 4. Python Bridge Extensions

**File**: `src/Mod/LLMBridge/llm_bridge\boolean_handlers.py` (extend)

Add WebSocket-accessible wrapper functions:

```python
# Called via execute_freecad_python
def handle_boolean_fuse_request(object_names, result_name=None)
def handle_boolean_cut_request(base_name, tool_name, result_name=None)
def handle_boolean_common_request(object_names, result_name=None)
def handle_make_compound_request(object_names, compound_name=None)
def handle_validate_shape_request(object_name)
def handle_heal_shape_request(object_name)
def handle_get_shape_info_request(object_name)
```

These wrap the core handlers and add:
- Document locking during modifications
- Object existence validation
- Result object registration for subsequent queries
- Undo stack integration
- Event notifications for UI updates

**Acceptance Criteria**:
- [ ] Functions accessible via WebSocket
- [ ] Object validation works
- [ ] Changes are undoable
- [ ] Viewport refreshes after Boolean operations

### 5. Result Formatters Update

**File**: `sidecar/src/result-formatters.ts` (extend)

Add formatters for Boolean operations:

```typescript
function formatBooleanResult(result: BooleanResult): string
function formatCompoundResult(result: CompoundResult): string
function formatShapeValidation(result: ShapeValidationResult): string
function formatShapeInfo(result: ShapeInfoResult): string
```

Output should be human-readable summaries:
- "Fused 3 objects into 'Fuse' with volume 15000 mm³"
- "Cut 'Cylinder' from 'Box', resulting in 'Cut' with volume 8500 mm³"
- "Intersection created 'Common' with volume 2000 mm³"
- "Shape 'Box' is valid (12 edges, 6 faces, 8 vertices)"
- "Healed 'Import': fixed 3 tolerance issues"

**Acceptance Criteria**:
- [ ] Results are concise but informative
- [ ] Units displayed correctly (mm³ for volume, mm² for area)
- [ ] Operation type and result name shown
- [ ] Shape statistics formatted clearly

### 6. Sidecar README Update

**File**: `sidecar/README.md`

Document the new tools:
- Tool names and parameters
- Example natural language commands
- Example tool invocations
- Boolean operation types explained
- Common Boolean patterns and workflows
- Shape validation and healing guidance

**Acceptance Criteria**:
- [ ] All new tools documented
- [ ] Examples cover common use cases
- [ ] Boolean operation reference included
- [ ] Workflow examples provided

### 7. Test End-to-End

**Test Scenarios**:

1. **Basic Fuse (Union)**:
   - Create two overlapping boxes
   - Command: "Combine these two boxes into one"
   - Verify: Single fused object created, original objects preserved or hidden

2. **Basic Cut (Difference)**:
   - Create a box and a cylinder overlapping
   - Command: "Cut the cylinder from the box"
   - Verify: Box with cylindrical hole created

3. **Basic Common (Intersection)**:
   - Create two overlapping spheres
   - Command: "Keep only the overlapping volume"
   - Verify: Only intersection volume remains

4. **Multi-Object Fuse**:
   - Create 4 separate parts
   - Command: "Merge all four parts together"
   - Verify: Single object with combined volume

5. **Compound Creation**:
   - Select multiple objects
   - Command: "Group these parts without merging them"
   - Verify: Compound created, originals remain editable

6. **Shape Validation**:
   - Import a potentially problematic STEP file
   - Command: "Check if this shape is valid"
   - Verify: Issues detected and reported

7. **Shape Healing**:
   - Command: "Fix any issues with this imported part"
   - Verify: Issues resolved or reported if unfixable

8. **Shape Info Query**:
   - Command: "What's the volume and surface area of this part?"
   - Verify: Accurate statistics returned

9. **Error Handling - Empty Result**:
   - Command: "Cut the box from the cylinder" (when they don't overlap)
   - Verify: Clear error message about empty result

10. **Error Handling - Invalid Shape**:
    - Command: "Fuse these objects" (with corrupted shape)
    - Verify: Clear error message about shape issues

**Acceptance Criteria**:
- [ ] All scenarios pass
- [ ] Boolean operations produce valid solids
- [ ] Original objects preserved (non-destructive by default)
- [ ] Error messages are actionable
- [ ] Viewport updates after each operation

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/boolean_handlers.py` - Boolean operation handlers

### Modified Files:
1. `sidecar/src/agent-tools.ts` - Add 7 Boolean tools (4 Boolean ops, 3 shape analysis)
2. `sidecar/src/result-formatters.ts` - Add formatters for Boolean and shape results
3. `sidecar/README.md` - Document Boolean operation tools
4. `src/Mod/LLMBridge/llm_bridge/__init__.py` - Register new handlers if needed

## Dependencies

- FreeCAD Part module (`Part.Fuse`, `Part.Cut`, `Part.Common`, `Part.Compound`)
- Existing WebSocket bridge infrastructure
- Existing query handlers (for object lookup and validation)
- Property handlers (reference for patterns)

## Out of Scope

This plan does NOT include:
- Advanced Boolean operations (Section cuts, Split operations)
- Non-manifold geometry handling
- Mesh Boolean operations (separate workflow)
- Boolean operations on 2D shapes (sketches)
- General fuse with tolerance control
- Shape morphology operations (offset, shell, thick solid)

## Definition of Done

- [ ] Boolean handler module complete with all operations
- [ ] All 7 Boolean tools implemented and working
- [ ] Shape validation and healing functional
- [ ] Results formatted clearly for users
- [ ] End-to-end tests pass for all scenarios
- [ ] Documentation updated in sidecar README
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

Once Boolean operation tools are complete:
- Add assembly constraint tools (for multi-part designs with constraints)
- Add Draft workbench tools (2D drafting, dimensions, annotations)
- Add TechDraw workbench integration (creating drawings from 3D models)
