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
- [ ] Works with PartDesign Body workflow
- [ ] Supports additive features (Pad, Revolution)
- [ ] Supports subtractive features (Pocket, Groove)
- [ ] Supports modifying features (Fillet, Chamfer)
- [ ] Handles missing body gracefully (creates one if needed)
- [ ] Returns clear error messages for invalid operations
- [ ] Features are parametric (editable after creation)

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
- [ ] All feature creation tools integrated
- [ ] Proper unit handling (mm, deg)
- [ ] Auto-creates PartDesign Body if none exists
- [ ] Returns feature names for subsequent operations

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
- [ ] All modification tools functional
- [ ] Features remain parametric after modification
- [ ] Undo stack integration works
- [ ] Dependencies handled correctly

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
- [ ] Body management tools complete
- [ ] Auto-body creation when needed
- [ ] Active body tracking works

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
- [ ] Functions accessible via WebSocket
- [ ] Body auto-creation works
- [ ] Changes are undoable
- [ ] Viewport refreshes after feature changes

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
- [ ] Results are concise but informative
- [ ] Units displayed correctly
- [ ] Feature type and dimensions shown
- [ ] Body context included when relevant

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
- [ ] All new tools documented
- [ ] Examples cover common use cases
- [ ] Feature type reference included
- [ ] Body workflow explained

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
- [ ] All scenarios pass
- [ ] Features are parametric and editable
- [ ] Model regenerates correctly after changes
- [ ] Error messages are actionable
- [ ] Viewport updates after each operation

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

- [ ] Feature handler module complete with all PartDesign operations
- [ ] All 12 PartDesign tools implemented and working
- [ ] Body management tools functional
- [ ] Results formatted clearly for users
- [ ] Feature parameter editing works
- [ ] End-to-end tests pass for all scenarios
- [ ] Documentation updated in sidecar README
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

Once PartDesign feature tools are complete:
- Add boolean operation tools (union, cut, intersect with Part workbench)
- Or: Add assembly constraint tools (for multi-part designs)
- Or: Add advanced PartDesign features (patterns, transformations)
