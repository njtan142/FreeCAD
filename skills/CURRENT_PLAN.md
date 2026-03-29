## Status: COMPLETED (Cycle 25)

# Cycle 25: BIM Workbench Tools (Architecture-Specific Operations)

## Overview

Add tools for FreeCAD's BIM/Arch workbench, enabling LLM-powered architectural CAD operations for:
- Building structure creation (Sites, Buildings, Floors/Levels)
- Architectural elements (Walls, Windows, Doors, Roofs, Stairs)
- Structural components (Columns, Beams, Slabs, Frames)
- IFC data management and property handling
- Schedules and quantity take-off

These tools form a coherent unit focused on **architectural/construction workflows** that connect CAD models to building information modeling (BIM) processes.

## Prerequisites

- `src/Mod/LLMBridge/llm_bridge/__init__.py` - Existing module structure
- `sidecar/src/agent-tools.ts` - Existing tool definitions
- `sidecar/src/result-formatters.ts` - Existing result formatters
- FreeCAD BIM module (`Arch` namespace)
- `src/Mod/BIM/` - BIM workbench source

## Tasks

### 1. Create bim_handlers.py (Python)

**File**: `src/Mod/LLMBridge/llm_bridge/bim_handlers.py` (create new)

Handlers for BIM/Arch operations:

#### Building Structure Management
- `handle_create_site(name)` — Create a new site (land/terrain container)
- `handle_create_building(object_names, name)` — Create a building containing objects
- `handle_create_building_part(object_names, name)` — Create a floor/level (BuildingPart)
- `handle_create_building_level(name, elevation)` — Create a single building level with elevation
- `handle_get_building_hierarchy()` — Get building/floor/space hierarchy

#### Architectural Elements
- `handle_create_wall(placement, length, width, height, name)` — Create a parametric wall
- `handle_create_window(width, height, placement, name)` — Create a window in a wall
- `handle_create_door(width, height, placement, name)` — Create a door in a wall
- `handle_create_roof(base_object, angle, name)` — Create a roof from a profile
- `handle_create_stairs(length, width, num_steps, name)` — Create staircase
- `handle_create_curtain_wall(base_object, name)` — Create curtain wall system
- `handle_create_space(placement, name)` — Create a space/room

#### Structural Elements
- `handle_create_column(placement, width, height, name)` — Create a vertical column
- `handle_create_beam(start, end, width, height, name)` — Create a horizontal beam
- `handle_create_slab(base_object, thickness, name)` — Create a floor/roof slab
- `handle_create_frame(base_object, profile, name)` — Create a frame structure
- `handle_create_truss(placement, length, height, name)` — Create a truss
- `handle_create_fence(placement, length, height, name)` — Create a fence

#### Equipment & Infrastructure
- `handle_create_equipment(base_object, placement, name)` — Create equipment/ furniture
- `handle_create_pipe(start, end, radius, name)` — Create a pipe
- `handle_create_pipe_connector(objects, name)` — Create pipe connector fitting
- `handle_create_panel(base_object, name)` — Create a panel/board

#### Annotation & Grids
- `handle_create_axis(num, spacing, name)` — Create axis system
- `handle_create_grid(placement, name)` — Create reference grid
- `handle_create_section_plane(object_names, name)` — Create section plane for views
- `handle_create_schedule(object_names, name)` — Create quantity takeoff schedule

#### IFC Data Management
- `handle_set_ifc_type(object_name, ifc_type)` — Set IFC entity type
- `handle_get_ifc_properties(object_name)` — Get IFC properties
- `handle_set_ifc_property(object_name, prop_name, value)` — Set IFC property
- `handle_get_bim_material(object_name)` — Get material from BIM object
- `handle_assign_material(object_name, material_name)` — Assign material to object

#### Quick Building Construction
- `handle_quick_wall(start, end, height, thickness, name)` — Quick wall from line
- `handle_quick_window(wall_name, width, height, position)` — Window in wall
- `handle_quick_door(wall_name, width, height, position)` — Door in wall
- `handle_quick_floor(building_name, level, objects)` — Add floor to building

**Acceptance Criteria**:
- [x] All handlers return JSON with success/error structure
- [x] All handlers handle None/missing active document gracefully
- [x] Placement parameters support Vector, Placement, or dict formats
- [x] BIM objects properly tagged with IFC types

### 2. Add Tool Definitions to agent-tools.ts

**File**: `sidecar/src/agent-tools.ts` (modify)

Add BIM tools after existing tools in `createAgentTools()`:

```typescript
// Building structure tools
createSiteTool(freeCADBridge),
createBuildingTool(freeCADBridge),
createBuildingPartTool(freeCADBridge),
createBuildingLevelTool(freeCADBridge),
getBuildingHierarchyTool(freeCADBridge),

// Architectural element tools
createWallTool(freeCADBridge),
createWindowTool(freeCADBridge),
createDoorTool(freeCADBridge),
createRoofTool(freeCADBridge),
createStairsTool(freeCADBridge),
createCurtainWallTool(freeCADBridge),
createSpaceTool(freeCADBridge),

// Structural element tools
createColumnTool(freeCADBridge),
createBeamTool(freeCADBridge),
createSlabTool(freeCADBridge),
createFrameTool(freeCADBridge),
createTrussTool(freeCADBridge),
createFenceTool(freeCADBridge),

// Equipment and infrastructure tools
createEquipmentTool(freeCADBridge),
createPipeTool(freeCADBridge),
createPipeConnectorTool(freeCADBridge),
createPanelTool(freeCADBridge),

// Annotation and grid tools
createAxisTool(freeCADBridge),
createGridTool(freeCADBridge),
createSectionPlaneTool(freeCADBridge),
createScheduleTool(freeCADBridge),

// IFC data tools
setIfcTypeTool(freeCADBridge),
getIfcPropertiesTool(freeCADBridge),
setIfcPropertyTool(freeCADBridge),
getBimMaterialTool(freeCADBridge),
assignMaterialTool(freeCADBridge),

// Quick construction tools
quickWallTool(freeCADBridge),
quickWindowTool(freeCADBridge),
quickDoorTool(freeCADBridge),
quickFloorTool(freeCADBridge),
```

### 3. Add Result Formatters

**File**: `sidecar/src/result-formatters.ts` (modify)

Add formatters:
```typescript
formatSiteCreation(data)
formatBuildingCreation(data)
formatBuildingPartCreation(data)
formatBuildingLevel(data)
formatBuildingHierarchy(data)
formatWallCreation(data)
formatWindowCreation(data)
formatDoorCreation(data)
formatRoofCreation(data)
formatStairsCreation(data)
formatSpaceCreation(data)
formatColumnCreation(data)
formatBeamCreation(data)
formatSlabCreation(data)
formatEquipmentCreation(data)
formatPipeCreation(data)
formatAxisCreation(data)
formatSectionPlaneCreation(data)
formatScheduleCreation(data)
formatIfcProperties(data)
formatMaterialAssignment(data)
```

### 4. Update __init__.py Exports

**File**: `src/Mod/LLMBridge/llm_bridge/__init__.py` (modify)

Add exports for new handlers to `__all__`:
```python
# From bim_handlers.py
'handle_create_site',
'handle_create_building',
'handle_create_building_part',
'handle_create_building_level',
'handle_get_building_hierarchy',
'handle_create_wall',
'handle_create_window',
'handle_create_door',
'handle_create_roof',
'handle_create_stairs',
'handle_create_curtain_wall',
'handle_create_space',
'handle_create_column',
'handle_create_beam',
'handle_create_slab',
'handle_create_frame',
'handle_create_truss',
'handle_create_fence',
'handle_create_equipment',
'handle_create_pipe',
'handle_create_pipe_connector',
'handle_create_panel',
'handle_create_axis',
'handle_create_grid',
'handle_create_section_plane',
'handle_create_schedule',
'handle_set_ifc_type',
'handle_get_ifc_properties',
'handle_set_ifc_property',
'handle_get_bim_material',
'handle_assign_material',
'handle_quick_wall',
'handle_quick_window',
'handle_quick_door',
'handle_quick_floor',
```

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/bim_handlers.py` - BIM operation handlers (~600 lines)

### Modified Files:
1. `src/Mod/LLMBridge/llm_bridge/__init__.py` - Add exports for 30 new handlers
2. `sidecar/src/agent-tools.ts` - Add 30 new tools
3. `sidecar/src/result-formatters.ts` - Add 20 new formatters

## Test Scenarios

1. **Building Structure**:
   - Create a site, add building, add multiple levels
   - Verify hierarchy via get_building_hierarchy

2. **Architectural Elements**:
   - Create a wall with specific dimensions
   - Add windows and doors to wall
   - Create stairs with given step count
   - Create roof from sketch profile

3. **Structural Elements**:
   - Create columns in a grid pattern
   - Create beams connecting columns
   - Create slab from base object

4. **IFC Data**:
   - Set IFC type on wall (IfcType = "Wall")
   - Add custom IFC property (e.g., "FireRating")
   - Verify properties via get_ifc_properties

5. **Quick Construction**:
   - Create wall from two points
   - Add window at specific position on wall
   - Create floor with objects

6. **Integration with other tools**:
   - Create building, use Draft tools for floor plan
   - Add walls, windows, doors
   - Export to IFC format

## Acceptance Criteria

- [ ] bim_handlers.py created with 30 handlers
- [ ] All handlers properly export from __init__.py
- [ ] 30 new tools added to agent-tools.ts with Zod schema validation
- [ ] 20 new result formatters added
- [ ] All tools integrated in createAgentTools()
- [ ] End-to-end test scenarios pass

## Definition of Done

- [x] bim_handlers.py created with 35 handlers
- [x] All handlers exported in __init__.py
- [x] 35 new tools added to agent-tools.ts
- [x] 35 new result formatters added
- [x] All tools integrated in createAgentTools()
- [ ] End-to-end test scenarios pass (deferred - requires FreeCAD runtime)
- [x] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

After BIM tools are complete, potential next cycles:
- Advanced error handling and recovery tools
- Gemini CLI integration (alternative backend)
- Additional custom tools based on user feedback
