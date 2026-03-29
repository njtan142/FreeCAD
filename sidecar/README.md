# FreeCAD LLM Sidecar

Node.js sidecar application that bridges Claude Agent SDK with FreeCAD's Python execution environment.

## Architecture

```
FreeCAD GUI (Dock Widget)
       ↓ WebSocket (port 8765)
Node.js Sidecar
       ↓ WebSocket (port 8766)
FreeCAD Python Bridge
```

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- FreeCAD with LLM Bridge module installed

## Installation

1. Install dependencies:

```bash
cd sidecar
npm install
```

2. Build TypeScript:

```bash
npm run build
```

## Configuration

Configure via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DOCK_SERVER_PORT` | `8765` | Port for dock widget WebSocket server |
| `FREECAD_BRIDGE_PORT` | `8766` | Port for FreeCAD Python bridge |
| `FREECAD_BRIDGE_HOST` | `localhost` | Host for FreeCAD Python bridge |
| `ANTHROPIC_API_KEY` | - | Your Anthropic API key for Claude |

### Example `.env` file

Create a `.env` file in the sidecar directory:

```env
ANTHROPIC_API_KEY=your-api-key-here
DOCK_SERVER_PORT=8765
FREECAD_BRIDGE_PORT=8766
FREECAD_BRIDGE_HOST=localhost
```

## Usage

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm run build
npm start
```

## Available Tools

The sidecar provides these custom tools to Claude Agent SDK:

### Execution Tools

#### `execute_freecad_python(code: string)`

Executes arbitrary Python code in FreeCAD's environment.

**Example:**
```typescript
{
  name: "execute_freecad_python",
  arguments: {
    code: "import Part; Part.makeBox(10, 10, 10)"
  }
}
```

### Query Tools

#### `query_model_state(intent: string, objectName?: string)`

Queries the current state of the FreeCAD model with a specific intent.

**Query types:**
- `document_overview` - List all objects with names, types, visibility
- `object_details` - Get detailed properties of a specific object
- `selection` - Get currently selected objects in viewport
- `dependencies` - Get parent-child relationships

#### `list_objects()`

Lists all objects in the active FreeCAD document.

#### `get_object_properties(objectName: string)`

Gets detailed properties of a specific object (placement, dimensions, color).

#### `get_selection()`

Gets currently selected objects in the viewport.

#### `get_document_info()`

Gets document metadata (name, modified status, object count, file path).

### File Operation Tools

#### `save_document(filePath?: string, format?: "FCStd" | "FCBak")`

Save the current FreeCAD document to a file.

**Parameters:**
- `filePath` (optional): Full path to save. If omitted, saves to current document path.
- `format` (optional): Save format - "FCStd" (default) or "FCBak"

**Example:**
```typescript
{
  name: "save_document",
  arguments: {
    filePath: "C:/Projects/part.FCStd",
    format: "FCStd"
  }
}
```

#### `open_document(filePath: string)`

Open an existing CAD file in FreeCAD.

**Supported formats:** FCStd, FCBak, STEP, IGES, STL, OBJ, DXF, DWG

**Example:**
```typescript
{
  name: "open_document",
  arguments: {
    filePath: "C:/Projects/assembly.step"
  }
}
```

#### `export_to_format(filePath: string, format: "STEP" | "IGES" | "STL" | "OBJ" | "DXF" | "FCStd" | "FCBak")`

Export the current model to a specific CAD format.

**Format descriptions:**
- `STEP` - Industry standard for CAD data exchange (recommended for manufacturing)
- `IGES` - Older CAD exchange format
- `STL` - 3D printing format (mesh)
- `OBJ` - 3D geometry format (mesh)
- `DXF` - 2D drawing format
- `FCStd` - Native FreeCAD format
- `FCBak` - FreeCAD backup format (uncompressed)

**Example:**
```typescript
{
  name: "export_to_format",
  arguments: {
    filePath: "C:/Exports/part.stl",
    format: "STL"
  }
}
```

#### `list_recent_documents()`

List recently opened CAD files from FreeCAD's history.

**Example:**
```typescript
{
  name: "list_recent_documents",
  arguments: {}
}
```

#### `create_new_document(name?: string, type?: "Part" | "Assembly" | "Sketch")`

Create a new empty FreeCAD document.

**Parameters:**
- `name` (optional): Name for the new document
- `type` (optional): Document type - "Part" (default), "Assembly", or "Sketch"

**Example:**
```typescript
{
  name: "create_new_document",
  arguments: {
    name: "MyPart",
    type: "Part"
  }
}
```

### Parametric Editing Tools

The parametric editing tools allow you to modify existing CAD objects through natural language commands. These tools support unit-aware values (mm, cm, m, in, ft for length; deg, rad, grad for angles) and provide before/after feedback for all changes.

#### `set_object_property(objectName: string, propertyName: string, value: number | string)`

Set a single property on an object to a specific value.

**Parameters:**
- `objectName` (required): Name of the object to modify (e.g., "Box", "Cylinder001")
- `propertyName` (required): Name of the property to set (e.g., "Length", "Radius", "Height")
- `value` (required): Value to set. Can be:
  - Numeric value (e.g., `50`)
  - String with units (e.g., `"50mm"`, `"90deg"`, `"2.5m"`)

**Supported units:**
- Length: `mm`, `cm`, `m`, `in`, `ft` (internal unit: mm)
- Angle: `deg`, `rad`, `grad` (internal unit: radians)

**Response format:**
```json
{
  "success": true,
  "objectName": "Box",
  "objectLabel": "Box",
  "propertyName": "Length",
  "beforeValue": "50.00mm",
  "afterValue": "100.00mm",
  "message": "Set Length to 100.00mm"
}
```

**Example usage:**
```typescript
// Make a box 100mm long
{
  name: "set_object_property",
  arguments: {
    objectName: "Box",
    propertyName: "Length",
    value: "100mm"
  }
}

// Set cylinder radius to 5mm
{
  name: "set_object_property",
  arguments: {
    objectName: "Cylinder",
    propertyName: "Radius",
    value: 5
  }
}

// Rotate by setting Angle property
{
  name: "set_object_property",
  arguments: {
    objectName: "Box",
    propertyName: "Angle",
    value: "45deg"
  }
}
```

**Common properties by object type:**
- **Part::Box**: `Length`, `Width`, `Height`
- **Part::Cylinder**: `Radius`, `Height`, `Angle` (for partial cylinders)
- **Part::Sphere**: `Radius`, `Angle1`, `Angle2`, `Angle3`
- **Part::Cone**: `Radius1`, `Radius2`, `Height`
- **Part::Torus**: `Radius1`, `Radius2`

---

#### `update_dimensions(objectName: string, dimensions: Record<string, number | string>)`

Update multiple dimensional properties at once. Useful for resizing objects with a single command.

**Parameters:**
- `objectName` (required): Name of the object to modify
- `dimensions` (required): Object mapping property names to values, e.g., `{"Length": "100mm", "Width": "50mm"}`

**Response format:**
```json
{
  "success": true,
  "objectName": "Box",
  "objectLabel": "Box",
  "changes": [
    {"property": "Length", "beforeValue": "50.00mm", "afterValue": "100.00mm"},
    {"property": "Width", "beforeValue": "50.00mm", "afterValue": "75.00mm"}
  ],
  "changeCount": 2,
  "message": "Updated 2 dimension(s)"
}
```

**Example usage:**
```typescript
// Resize a box to specific dimensions
{
  name: "update_dimensions",
  arguments: {
    objectName: "Box",
    dimensions: {
      "Length": "120mm",
      "Width": "60mm",
      "Height": "30mm"
    }
  }
}

// Update cylinder dimensions
{
  name: "update_dimensions",
  arguments: {
    objectName: "Cylinder",
    dimensions: {
      "Radius": "15mm",
      "Height": "100mm"
    }
  }
}
```

---

#### `move_object(objectName: string, position?: {x: number, y: number, z: number}, offset?: {x: number, y: number, z: number}, relative?: boolean)`

Reposition an object to a new location. Supports both absolute positioning and relative offsets.

**Parameters:**
- `objectName` (required): Name of the object to move
- `position` (optional): Absolute target position as `{x, y, z}` coordinates in mm
- `offset` (optional): Relative offset as `{x, y, z}` in mm
- `relative` (optional): If `true`, treats `position` as an offset. Default: `false`

**Note:** Either `position` or `offset` must be provided. The object's rotation is preserved.

**Response format:**
```json
{
  "success": true,
  "objectName": "Box",
  "objectLabel": "Box",
  "beforePosition": {"x": 0, "y": 0, "z": 0},
  "afterPosition": {"x": 50, "y": 100, "z": 0},
  "displacement": "111.80mm",
  "message": "Moved object by 111.80mm"
}
```

**Example usage:**
```typescript
// Move to absolute position
{
  name: "move_object",
  arguments: {
    objectName: "Box",
    position: {"x": 100, "y": 50, "z": 0}
  }
}

// Move relative to current position (20mm up)
{
  name: "move_object",
  arguments: {
    objectName: "Cylinder",
    offset: {"x": 0, "y": 0, "z": 20},
    relative: true
  }
}

// Shorthand for relative movement
{
  name: "move_object",
  arguments: {
    objectName: "Box",
    position: {"x": 10, "y": 0, "z": 0},
    relative: true
  }
}
```

---

#### `rotate_object(objectName: string, angle: number | string, axis?: {x: number, y: number, z: number}, center?: {x: number, y: number, z: number})`

Rotate an object around a specified axis.

**Parameters:**
- `objectName` (required): Name of the object to rotate
- `angle` (required): Rotation angle. Can be:
  - Numeric value in radians
  - String with units: `"90deg"`, `"45deg"`, `"1.5rad"`
- `axis` (optional): Axis of rotation as a vector `{x, y, z}`. Default: `{x: 0, y: 0, z: 1}` (Z-axis)
- `center` (optional): Center point of rotation as `{x, y, z}` coordinates. Default: object's current position

**Response format:**
```json
{
  "success": true,
  "objectName": "Box",
  "objectLabel": "Box",
  "beforeRotation": {"axis": {"x": 0, "y": 0, "z": 1}, "angle": "0.00deg"},
  "afterRotation": {"axis": {"x": 0, "y": 0, "z": 1}, "angle": "90.00deg"},
  "rotationApplied": "90.00deg",
  "axis": {"x": 0, "y": 0, "z": 1},
  "message": "Rotated object by 90.00deg"
}
```

**Example usage:**
```typescript
// Rotate 90 degrees around Z-axis
{
  name: "rotate_object",
  arguments: {
    objectName: "Box",
    angle: "90deg",
    axis: {"x": 0, "y": 0, "z": 1}
  }
}

// Rotate 45 degrees around X-axis
{
  name: "rotate_object",
  arguments: {
    objectName: "Cylinder",
    angle: "45deg",
    axis: {"x": 1, "y": 0, "z": 0}
  }
}

// Rotate around a specific center point
{
  name: "rotate_object",
  arguments: {
    objectName: "Box",
    angle: "180deg",
    axis: {"x": 0, "y": 0, "z": 1},
    center: {"x": 0, "y": 0, "z": 0}
  }
}
```

---

#### `scale_object(objectName: string, scale?: number, scale_x?: number, scale_y?: number, scale_z?: number, uniform?: boolean)`

Scale an object uniformly or non-uniformly.

**Parameters:**
- `objectName` (required): Name of the object to scale
- `scale` (optional): Uniform scale factor (e.g., `2.0` for 2x size, `0.5` for half size)
- `scale_x`, `scale_y`, `scale_z` (optional): Non-uniform scale factors for each axis
- `uniform` (optional): If `true`, applies uniform scaling. Default: `true`

**Note:** Either `scale` or individual `scale_x`/`scale_y`/`scale_z` must be provided.

**Response format:**
```json
{
  "success": true,
  "objectName": "Box",
  "objectLabel": "Box",
  "scaleFactors": {"x": 2, "y": 2, "z": 2},
  "uniform": true,
  "beforeDimensions": {"x": 50, "y": 50, "z": 50},
  "afterDimensions": {"x": 100, "y": 100, "z": 100},
  "message": "Scaled object by factors (2, 2, 2)"
}
```

**Example usage:**
```typescript
// Scale uniformly by 2x
{
  name: "scale_object",
  arguments: {
    objectName: "Box",
    scale: 2,
    uniform: true
  }
}

// Scale to half size
{
  name: "scale_object",
  arguments: {
    objectName: "Cylinder",
    scale: 0.5
  }
}

// Non-uniform scaling (stretch along X-axis only)
{
  name: "scale_object",
  arguments: {
    objectName: "Box",
    scale_x: 2,
    scale_y: 1,
    scale_z: 1,
    uniform: false
  }
}
```

---

#### `set_expression(objectName: string, propertyName: string, expression: string)`

Create a parametric relationship by setting an expression on a property. Expressions allow properties to be driven by other object properties or mathematical formulas.

**Parameters:**
- `objectName` (required): Name of the object
- `propertyName` (required): Property to set expression on (e.g., "Length", "Radius")
- `expression` (required): Expression string. Can reference other properties using syntax like `"Body.Box.Length * 2"` or `"50mm"`

**Expression syntax:**
- Reference another object's property: `"ObjectName.PropertyName"`
- Mathematical operations: `+`, `-`, `*`, `/`, `^` (power)
- Functions: `sin()`, `cos()`, `tan()`, `sqrt()`, `abs()`, etc.
- Constants: `PI`, `e`
- Units: Append units like `"50mm"`, `"90deg"`

**Response format:**
```json
{
  "success": true,
  "objectName": "Box001",
  "objectLabel": "Box001",
  "propertyName": "Length",
  "expression": "Box.Length * 2",
  "previousExpression": null,
  "beforeValue": "50.00mm",
  "afterValue": "100.00mm",
  "message": "Set expression 'Box.Length * 2' on Length"
}
```

**Example usage:**
```typescript
// Make width always half of length
{
  name: "set_expression",
  arguments: {
    objectName: "Box",
    propertyName: "Width",
    expression: "Box.Length / 2"
  }
}

// Link two objects: second box length equals first box length
{
  name: "set_expression",
  arguments: {
    objectName: "Box001",
    propertyName: "Length",
    expression: "Box.Length"
  }
}

// Set expression with calculation
{
  name: "set_expression",
  arguments: {
    objectName: "Cylinder",
    propertyName: "Height",
    expression: "Box.Length * 2 + 10mm"
  }
}
```

---

#### `get_expression(objectName: string, propertyName?: string)`

Query existing expressions on an object. Returns expression information for a specific property or all properties with expressions.

**Parameters:**
- `objectName` (required): Name of the object
- `propertyName` (optional): Specific property to query. If omitted, returns all expressions on the object.

**Response format (specific property):**
```json
{
  "success": true,
  "objectName": "Box",
  "objectLabel": "Box",
  "expressions": {
    "Width": {
      "expression": "Box.Length / 2",
      "currentValue": "50.00mm",
      "hasExpression": true
    }
  },
  "expressionCount": 1,
  "message": "Found 1 expression(s)"
}
```

**Response format (all expressions):**
```json
{
  "success": true,
  "objectName": "Box",
  "objectLabel": "Box",
  "expressions": {
    "Width": {
      "expression": "Box.Length / 2",
      "currentValue": "50.00mm"
    },
    "Height": {
      "expression": "Box.Length / 4",
      "currentValue": "25.00mm"
    }
  },
  "expressionCount": 2,
  "message": "Found 2 expression(s)"
}
```

**Example usage:**
```typescript
// Get expression for specific property
{
  name: "get_expression",
  arguments: {
    objectName: "Box",
    propertyName: "Width"
  }
}

// Get all expressions on an object
{
  name: "get_expression",
  arguments: {
    objectName: "Box"
  }
}
```

---

#### `clear_expression(objectName: string, propertyName?: string)`

Remove expressions from an object's property, converting it back to a fixed value.

**Parameters:**
- `objectName` (required): Name of the object
- `propertyName` (optional): Specific property to clear. If omitted, clears all expressions on the object.

**Response format:**
```json
{
  "success": true,
  "objectName": "Box",
  "objectLabel": "Box",
  "clearedProperties": ["Width", "Height"],
  "clearedCount": 2,
  "message": "Cleared 2 expression(s)"
}
```

**Example usage:**
```typescript
// Clear expression from specific property
{
  name: "clear_expression",
  arguments: {
    objectName: "Box",
    propertyName: "Width"
  }
}

// Clear all expressions on an object
{
  name: "clear_expression",
  arguments: {
    objectName: "Box"
  }
}
```

### Sketcher Tools

The sketcher tools allow you to create and edit 2D sketches with geometric and dimensional constraints. Sketches are the foundation for parametric 3D features like pads, revolutions, and lofts.

---

#### `create_sketch(support?: string, mapMode?: string, name?: string)`

Create a new sketch on a plane or face.

**Parameters:**
- `support` (optional): Support specification for sketch placement, e.g., `"Body001.Face4"` or `"(Body001, ['Face4'])"`. If omitted, creates sketch on default XY plane.
- `mapMode` (optional): Map mode for sketch placement. Options: `"Deactivated"`, `"FlatFace"`, `"Plane"`, `"ThreePoints"`, `"ThreePlanes"`, `"Curved"`, `"Axis"`, `"Concentric"`, `"RefPlane"`. Default: `"FlatFace"`
- `name` (optional): Name for the sketch. If omitted, auto-generated (e.g., "Sketch", "Sketch001").

**Response format:**
```json
{
  "success": true,
  "sketchName": "Sketch",
  "sketchLabel": "Sketch",
  "documentName": "UnnamedDocument",
  "support": "(none)",
  "mapMode": "FlatFace",
  "message": "Created sketch 'Sketch' on FlatFace plane"
}
```

**Example usage:**
```typescript
// Create sketch on default XY plane
{
  name: "create_sketch",
  arguments: {}
}

// Create sketch on a specific face
{
  name: "create_sketch",
  arguments: {
    support: "Body.Face4",
    mapMode: "FlatFace"
  }
}

// Create named sketch on XY plane
{
  name: "create_sketch",
  arguments: {
    name: "ProfileSketch"
  }
}

// Create sketch on XZ base plane (using RefPlane map mode)
{
  name: "create_sketch",
  arguments: {
    mapMode: "RefPlane"
  }
}

// Create sketch with specific name on a face
{
  name: "create_sketch",
  arguments: {
    support: "Body001.Face1",
    mapMode: "FlatFace",
    name: "BaseSketch"
  }
}
```

**Base plane examples:**

FreeCAD supports creating sketches on the three standard base planes:

```typescript
// XY plane (default) - horizontal plane
{
  name: "create_sketch",
  arguments: {
    mapMode: "FlatFace"
  }
}

// XZ plane - vertical plane (front/back)
{
  name: "create_sketch",
  arguments: {
    mapMode: "Plane"
  }
}

// YZ plane - vertical plane (side)
{
  name: "create_sketch",
  arguments: {
    support: "YZ_Plane",  // If you have a reference plane object
    mapMode: "RefPlane"
  }
}
```

For standard base planes without support, use `mapMode: "Plane"` which allows sketch placement on any plane orientation.

---

#### `add_geometry(sketchName: string, geometryType: string, params: object)`

Add geometry elements to a sketch.

**Parameters:**
- `sketchName` (required): Name of the sketch to add geometry to
- `geometryType` (required): Type of geometry - `"line"`, `"circle"`, `"arc"`, `"rectangle"`, `"point"`
- `params` (required): Geometry parameters based on type:
  - `line`: `{ start: {x, y}, end: {x, y} }`
  - `circle`: `{ center: {x, y}, radius: number }`
  - `arc`: `{ center: {x, y}, radius: number, startAngle: number, endAngle: number }` (angles in degrees)
  - `rectangle`: `{ corner1: {x, y}, corner2: {x, y} }` - automatically adds coincident constraints at corners
  - `point`: `{ x: number, y: number }`

**Response format:**
```json
{
  "success": true,
  "sketchName": "Sketch",
  "sketchLabel": "Sketch",
  "geometryAdded": true,
  "geometryCount": 1,
  "geometry": [
    {
      "index": 0,
      "type": "LineSegment",
      "startPoint": {"x": 0, "y": 0},
      "endPoint": {"x": 50, "y": 0}
    }
  ],
  "message": "Added 1 geometry element(s) to sketch"
}
```

**Example usage:**
```typescript
// Add a horizontal line from origin to (50, 0)
{
  name: "add_geometry",
  arguments: {
    sketchName: "Sketch",
    geometryType: "line",
    params: { start: {x: 0, y: 0}, end: {x: 50, y: 0} }
  }
}

// Add a circle centered at (25, 25) with radius 10
{
  name: "add_geometry",
  arguments: {
    sketchName: "Sketch",
    geometryType: "circle",
    params: { center: {x: 25, y: 25}, radius: 10 }
  }
}

// Add a rectangle with corners at (0, 0) and (50, 30)
// Note: Rectangle automatically adds 4 lines with coincident constraints at corners
{
  name: "add_geometry",
  arguments: {
    sketchName: "Sketch",
    geometryType: "rectangle",
    params: { corner1: {x: 0, y: 0}, corner2: {x: 50, y: 30} }
  }
}

// Add an arc centered at (25, 25) with radius 10, from 0 to 90 degrees
{
  name: "add_geometry",
  arguments: {
    sketchName: "Sketch",
    geometryType: "arc",
    params: { center: {x: 25, y: 25}, radius: 10, startAngle: 0, endAngle: 90 }
  }
}

// Add a construction point at (20, 20)
{
  name: "add_geometry",
  arguments: {
    sketchName: "Sketch",
    geometryType: "point",
    params: { x: 20, y: 20 }
  }
}
```

---

#### `add_geometric_constraint(sketchName: string, constraintType: string, geoIndex1: number, pointPos1?: number, geoIndex2?: number, pointPos2?: number)`

Add a geometric constraint between sketch elements.

**Parameters:**
- `sketchName` (required): Name of the sketch
- `constraintType` (required): Constraint type:
  - `"coincident"` - Two points coincide (requires geoIndex1, geoIndex2)
  - `"horizontal"` - Line is horizontal (requires geoIndex1)
  - `"vertical"` - Line is vertical (requires geoIndex1)
  - `"parallel"` - Two lines are parallel (requires geoIndex1, geoIndex2)
  - `"perpendicular"` - Two lines are perpendicular (requires geoIndex1, geoIndex2)
  - `"tangent"` - Curve tangent to line/curve (requires geoIndex1, geoIndex2)
  - `"equal"` - Two lines equal length or two circles/arcs equal radius (requires geoIndex1, geoIndex2)
  - `"symmetric"` - Two points symmetric about a line/axis (requires geoIndex1, geoIndex2)
  - `"concentric"` - Two circles/arcs share same center (requires geoIndex1, geoIndex2)
  - `"midpoint"` - Point is midpoint of a line (requires geoIndex1, geoIndex2)
- `geoIndex1` (required): Index of first geometry element (0-based)
- `pointPos1` (optional): Point position on first element (1=start, 2=end, 3=center)
- `geoIndex2` (optional): Index of second geometry element (required for two-element constraints)
- `pointPos2` (optional): Point position on second element

**Response format:**
```json
{
  "success": true,
  "sketchName": "Sketch",
  "sketchLabel": "Sketch",
  "constraintAdded": true,
  "constraintCount": 1,
  "constraintIndex": 0,
  "constraintType": "perpendicular",
  "message": "Added perpendicular constraint to sketch"
}
```

**Example usage:**
```typescript
// Make a line horizontal
{
  name: "add_geometric_constraint",
  arguments: {
    sketchName: "Sketch",
    constraintType: "horizontal",
    geoIndex1: 0
  }
}

// Make two lines perpendicular
{
  name: "add_geometric_constraint",
  arguments: {
    sketchName: "Sketch",
    constraintType: "perpendicular",
    geoIndex1: 0,
    geoIndex2: 1
  }
}

// Make two lines parallel
{
  name: "add_geometric_constraint",
  arguments: {
    sketchName: "Sketch",
    constraintType: "parallel",
    geoIndex1: 1,
    geoIndex2: 2
  }
}

// Make two circles concentric
{
  name: "add_geometric_constraint",
  arguments: {
    sketchName: "Sketch",
    constraintType: "concentric",
    geoIndex1: 0,
    geoIndex2: 1
  }
}

// Make two lines equal length
{
  name: "add_geometric_constraint",
  arguments: {
    sketchName: "Sketch",
    constraintType: "equal",
    geoIndex1: 0,
    geoIndex2: 1
  }
}

// Make two points symmetric about a line
{
  name: "add_geometric_constraint",
  arguments: {
    sketchName: "Sketch",
    constraintType: "symmetric",
    geoIndex1: 0,
    geoIndex2: 1
  }
}

// Make a point the midpoint of a line
{
  name: "add_geometric_constraint",
  arguments: {
    sketchName: "Sketch",
    constraintType: "midpoint",
    geoIndex1: 0,
    geoIndex2: 1
  }
}

// Make two points coincident (end of line 0 with start of line 1)
{
  name: "add_geometric_constraint",
  arguments: {
    sketchName: "Sketch",
    constraintType: "coincident",
    geoIndex1: 0,
    pointPos1: 2,
    geoIndex2: 1,
    pointPos2: 1
  }
}
```

---

#### `add_dimensional_constraint(type: string, geometryIds: number[], value: number | string)`

Add a dimensional constraint (distance, angle, radius, or diameter) to sketch elements.

**Parameters:**
- `type` (required): Dimension type:
  - `"distance_x"` - Horizontal distance (DistanceX constraint)
  - `"distance_y"` - Vertical distance (DistanceY constraint)
  - `"distance"` - Distance between two points or length of a line (2+ geometry IDs)
  - `"angle"` - Angle between two lines (2 geometry IDs)
  - `"radius"` - Radius of circle/arc (1 geometry ID)
  - `"diameter"` - Diameter of circle (1 geometry ID)
- `geometryIds` (required): Array of geometry element IDs the constraint applies to
- `value` (required): Dimension value. Can be:
  - Numeric value in mm (for distances/radius/diameter) or radians (for angles)
  - String with units: `"50mm"`, `"90deg"`, `"30deg"`, `"5cm"`

**Response format:**
```json
{
  "success": true,
  "constraintType": "distance",
  "constraintId": 0,
  "geometryIds": [0, 1],
  "value": "50.00mm",
  "message": "Added distance constraint: 50.00mm (ID: 0)"
}
```

**Example usage:**
```typescript
// Set line length to 50mm
{
  name: "add_dimensional_constraint",
  arguments: {
    type: "distance",
    geometryIds: [0, 1],
    value: "50mm"
  }
}

// Set horizontal distance between points (distance_x)
{
  name: "add_dimensional_constraint",
  arguments: {
    type: "distance_x",
    geometryIds: [0, 1],
    value: "30mm"
  }
}

// Set vertical distance between points (distance_y)
{
  name: "add_dimensional_constraint",
  arguments: {
    type: "distance_y",
    geometryIds: [0, 1],
    value: "20mm"
  }
}

// Set angle between two lines to 90 degrees
{
  name: "add_dimensional_constraint",
  arguments: {
    type: "angle",
    geometryIds: [0, 1],
    value: "90deg"
  }
}

// Set circle radius to 10mm
{
  name: "add_dimensional_constraint",
  arguments: {
    type: "radius",
    geometryIds: [0],
    value: "10mm"
  }
}

// Set circle diameter to 25mm
{
  name: "add_dimensional_constraint",
  arguments: {
    type: "diameter",
    geometryIds: [0],
    value: "25mm"
  }
}
```

---

#### `set_constraint_value(constraintId: number, value: number | string)`

Modify the value of an existing dimensional constraint.

**Parameters:**
- `constraintId` (required): ID of the constraint to modify
- `value` (required): New value. Can be:
  - Numeric value in mm (for distances) or radians (for angles)
  - String with units: `"75mm"`, `"45deg"`, `"20mm"`

**Response format:**
```json
{
  "success": true,
  "constraintId": 0,
  "constraintType": "distance",
  "beforeValue": "50.00mm",
  "afterValue": "75.00mm",
  "message": "Updated constraint 0 from 50.00mm to 75.00mm"
}
```

**Example usage:**
```typescript
// Change a distance constraint to 75mm
{
  name: "set_constraint_value",
  arguments: {
    constraintId: 0,
    value: "75mm"
  }
}

// Change an angle constraint to 45 degrees
{
  name: "set_constraint_value",
  arguments: {
    constraintId: 2,
    value: "45deg"
  }
}

// Change a radius constraint to 15mm
{
  name: "set_constraint_value",
  arguments: {
    constraintId: 1,
    value: 15
  }
}
```

---

#### `list_sketch_constraints(sketchName?: string)`

List all constraints in a sketch.

**Parameters:**
- `sketchName` (optional): Name of the sketch to query. If omitted, uses the active sketch.

**Response format:**
```json
{
  "success": true,
  "sketchName": "Sketch",
  "constraints": [
    {
      "id": 0,
      "type": "distance",
      "geometryIds": [0, 1],
      "value": "50.00mm"
    },
    {
      "id": 1,
      "type": "horizontal",
      "geometryIds": [0],
      "value": null
    },
    {
      "id": 2,
      "type": "angle",
      "geometryIds": [0, 1],
      "value": "90.00deg"
    }
  ],
  "constraintCount": 3,
  "message": "Found 3 constraint(s)"
}
```

**Example usage:**
```typescript
// List constraints in active sketch
{
  name: "list_sketch_constraints",
  arguments: {}
}

// List constraints in a specific sketch
{
  name: "list_sketch_constraints",
  arguments: {
    sketchName: "Sketch001"
  }
}
```

---

#### `delete_constraint(constraintId: number, sketchName?: string)`

Remove a constraint from a sketch.

**Parameters:**
- `constraintId` (required): ID of the constraint to delete
- `sketchName` (optional): Name of the sketch. If omitted, uses the active sketch.

**Response format:**
```json
{
  "success": true,
  "constraintId": 0,
  "constraintType": "distance",
  "sketchName": "Sketch",
  "message": "Deleted constraint 0 (distance)"
}
```

**Example usage:**
```typescript
// Delete constraint with ID 0 from active sketch
{
  name: "delete_constraint",
  arguments: {
    constraintId: 0
  }
}

// Delete constraint from a specific sketch
{
  name: "delete_constraint",
  arguments: {
    constraintId: 2,
    sketchName: "Sketch001"
  }
}
```

---

#### `get_sketch_geometry(sketchName?: string)`

Query all geometry elements in a sketch.

**Parameters:**
- `sketchName` (optional): Name of the sketch to query. If omitted, uses the active sketch.

**Response format:**
```json
{
  "success": true,
  "sketchName": "Sketch",
  "geometry": [
    {
      "id": 0,
      "type": "line",
      "points": [{"x": 0, "y": 0}, {"x": 50, "y": 0}]
    },
    {
      "id": 1,
      "type": "line",
      "points": [{"x": 50, "y": 0}, {"x": 50, "y": 30}]
    },
    {
      "id": 2,
      "type": "circle",
      "center": {"x": 25, "y": 15},
      "radius": "10.00mm"
    }
  ],
  "geometryCount": 3,
  "message": "Found 3 geometry element(s)"
}
```

**Example usage:**
```typescript
// Get geometry from active sketch
{
  name: "get_sketch_geometry",
  arguments: {}
}

// Get geometry from a specific sketch
{
  name: "get_sketch_geometry",
  arguments: {
    sketchName: "Sketch001"
  }
}
```

### PartDesign Feature Tools

The PartDesign feature tools allow you to create and modify parametric 3D features from sketches. PartDesign is FreeCAD's feature-based modeling workbench where 3D objects are built from a series of additive and subtractive operations applied to sketches. These tools support the complete PartDesign workflow including body management, feature creation (pads, pockets, revolutions, grooves), and feature modification (fillets, chamfers, updates, deletions).

**PartDesign Workflow Overview:**

1. **Create or select a Body** - All PartDesign features must belong to a Body
2. **Create a Sketch** - Draw a 2D profile on a plane or face
3. **Create a Feature** - Extrude (Pad), cut (Pocket), revolve, or groove the sketch
4. **Modify Features** - Add fillets, chamfers, or update dimensions
5. **Repeat** - Add more sketches and features to build complex geometry

---

#### `create_body(name?: string)`

Create a new PartDesign Body container for feature-based modeling.

**Parameters:**
- `name` (optional): Name for the new body. If omitted, auto-generated (e.g., "Body", "Body001").

**Response format:**
```json
{
  "success": true,
  "bodyName": "Body",
  "bodyLabel": "Body",
  "documentName": "UnnamedDocument",
  "message": "Created PartDesign Body 'Body'"
}
```

**Example usage:**
```typescript
// Create a new body with auto-generated name
{
  name: "create_body",
  arguments: {}
}

// Create a named body
{
  name: "create_body",
  arguments: {
    name: "MainBody"
  }
}
```

**Notes:**
- A Body is required before creating PartDesign features (Pad, Pocket, etc.)
- If no body exists when creating a feature, one will be auto-created
- Multiple bodies can exist in a document for multi-part designs

---

#### `set_active_body(bodyName: string)`

Set the active body for subsequent PartDesign operations.

**Parameters:**
- `bodyName` (required): Name of the body to activate

**Response format:**
```json
{
  "success": true,
  "activeBody": "Body",
  "activeBodyLabel": "Body",
  "previousBody": "Body001",
  "message": "Set active body to 'Body'"
}
```

**Example usage:**
```typescript
// Set Body as the active body
{
  name: "set_active_body",
  arguments: {
    bodyName: "Body"
  }
}

// Switch to a different body
{
  name: "set_active_body",
  arguments: {
    bodyName: "MainBody"
  }
}
```

**Notes:**
- Only one body can be active at a time
- New features are automatically added to the active body
- Use `list_bodies` to see available bodies

---

#### `list_bodies()`

List all PartDesign bodies in the current document.

**Parameters:** None

**Response format:**
```json
{
  "success": true,
  "bodies": [
    {
      "name": "Body",
      "label": "Body",
      "featureCount": 5,
      "isActive": true
    },
    {
      "name": "Body001",
      "label": "SecondaryBody",
      "featureCount": 2,
      "isActive": false
    }
  ],
  "bodyCount": 2,
  "message": "Found 2 body(s)"
}
```

**Example usage:**
```typescript
// List all bodies in the document
{
  name: "list_bodies",
  arguments: {}
}
```

**Notes:**
- Returns body name, label, feature count, and active status
- Useful for understanding document structure before operations

---

#### `create_pad(sketchName: string, length: number | string, direction?: "normal" | "reverse" | "twoSides", upToFace?: string)`

Create a Pad feature by extruding a sketch to add material.

**Parameters:**
- `sketchName` (required): Name of the sketch to extrude
- `length` (required): Extrusion length. Can be:
  - Numeric value in mm (e.g., `20`)
  - String with units: `"20mm"`, `"2cm"`, `"1in"`
- `direction` (optional): Extrusion direction - `"normal"` (default), `"reverse"`, or `"twoSides"`
- `upToFace` (optional): Face name for "up to" extrusion (e.g., "Body.Face5"). If provided, `length` is ignored.

**Response format:**
```json
{
  "success": true,
  "featureName": "Pad",
  "featureLabel": "Pad",
  "bodyName": "Body",
  "sketchName": "Sketch",
  "length": "20.00mm",
  "direction": "normal",
  "message": "Created Pad 'Pad' with length 20.00mm"
}
```

**Example usage:**
```typescript
// Extrude a sketch 20mm in the normal direction
{
  name: "create_pad",
  arguments: {
    sketchName: "Sketch",
    length: "20mm"
  }
}

// Extrude 50mm in both directions (twoSides)
{
  name: "create_pad",
  arguments: {
    sketchName: "Sketch",
    length: 50,
    direction: "twoSides"
  }
}

// Extrude in reverse direction
{
  name: "create_pad",
  arguments: {
    sketchName: "Sketch",
    length: "30mm",
    direction: "reverse"
  }
}

// Extrude up to a specific face
{
  name: "create_pad",
  arguments: {
    sketchName: "Sketch",
    length: "100mm",
    upToFace: "Body001.Face5"
  }
}
```

**Natural language examples:**
- "Extrude this sketch 20mm"
- "Pad the sketch 50mm in both directions"
- "Create a pad feature with length 30mm"
- "Extrude the sketch up to the top face"

**Notes:**
- The sketch must already exist (use `create_sketch` first)
- If no active body exists, one will be auto-created
- Pad is an additive feature (adds material)

---

#### `create_pocket(sketchName: string, depth: number | string, throughAll?: boolean)`

Create a Pocket feature by extruding a sketch to remove material (cut).

**Parameters:**
- `sketchName` (required): Name of the sketch to use for the cut
- `depth` (required): Pocket depth. Can be:
  - Numeric value in mm (e.g., `10`)
  - String with units: `"10mm"`, `"1cm"`, `"0.5in"`
- `throughAll` (optional): If `true`, cuts through all material (default: `false`)

**Response format:**
```json
{
  "success": true,
  "featureName": "Pocket",
  "featureLabel": "Pocket",
  "bodyName": "Body",
  "sketchName": "Sketch",
  "depth": "10.00mm",
  "throughAll": false,
  "message": "Created Pocket 'Pocket' with depth 10.00mm"
}
```

**Example usage:**
```typescript
// Cut a pocket 10mm deep
{
  name: "create_pocket",
  arguments: {
    sketchName: "Sketch",
    depth: "10mm"
  }
}

// Create a through-all pocket (cuts through entire body)
{
  name: "create_pocket",
  arguments: {
    sketchName: "Sketch",
    depth: "50mm",
    throughAll: true
  }
}

// Cut a pocket 5mm deep
{
  name: "create_pocket",
  arguments: {
    sketchName: "Sketch001",
    depth: 5
  }
}
```

**Natural language examples:**
- "Cut a pocket 10mm deep using this sketch"
- "Make a through-all pocket with this circle"
- "Create a pocket feature 5mm deep"
- "Cut through the entire body using this sketch"

**Notes:**
- Pocket is a subtractive feature (removes material)
- Requires an existing solid body to cut from
- `throughAll: true` ignores the `depth` parameter

---

#### `create_revolution(sketchName: string, axis?: "vertical" | "horizontal" | "custom", angle?: number | string)`

Create a Revolution feature by revolving a sketch around an axis.

**Parameters:**
- `sketchName` (required): Name of the sketch to revolve
- `axis` (optional): Revolution axis - `"vertical"` (default, Z-axis), `"horizontal"` (X-axis), or `"custom"`
- `angle` (optional): Revolution angle. Can be:
  - Numeric value in degrees (e.g., `360`)
  - String with units: `"360deg"`, `"180deg"`, `"1.5rad"`
  - Default: `360` (full revolution)

**Response format:**
```json
{
  "success": true,
  "featureName": "Revolution",
  "featureLabel": "Revolution",
  "bodyName": "Body",
  "sketchName": "Sketch",
  "axis": "vertical",
  "angle": "360.00deg",
  "message": "Created Revolution 'Revolution' with angle 360.00deg around vertical axis"
}
```

**Example usage:**
```typescript
// Revolve a profile 360 degrees around the vertical axis
{
  name: "create_revolution",
  arguments: {
    sketchName: "Sketch",
    axis: "vertical",
    angle: 360
  }
}

// Revolve 180 degrees around horizontal axis
{
  name: "create_revolution",
  arguments: {
    sketchName: "Sketch",
    axis: "horizontal",
    angle: "180deg"
  }
}

// Full revolution (default angle is 360)
{
  name: "create_revolution",
  arguments: {
    sketchName: "Sketch",
    axis: "vertical"
  }
}

// Partial revolution with radians
{
  name: "create_revolution",
  arguments: {
    sketchName: "Sketch",
    angle: "1.5rad"
  }
}
```

**Natural language examples:**
- "Revolve this profile 360 degrees"
- "Create a revolution feature around the vertical axis"
- "Revolve the sketch 180 degrees around the horizontal axis"
- "Make a half-revolution of this profile"

**Notes:**
- Revolution is an additive feature (adds material)
- Commonly used for creating cylindrical or rotationally symmetric parts
- The sketch should typically be a half-profile for full revolutions

---

#### `create_groove(sketchName: string, axis?: "vertical" | "horizontal" | "custom", angle?: number | string)`

Create a Groove feature (revolved cut) by revolving a sketch to remove material.

**Parameters:**
- `sketchName` (required): Name of the sketch to revolve for the cut
- `axis` (optional): Revolution axis - `"vertical"` (default), `"horizontal"`, or `"custom"`
- `angle` (optional): Revolution angle (default: `360`). Same format as `create_revolution`.

**Response format:**
```json
{
  "success": true,
  "featureName": "Groove",
  "featureLabel": "Groove",
  "bodyName": "Body",
  "sketchName": "Sketch",
  "axis": "vertical",
  "angle": "360.00deg",
  "message": "Created Groove 'Groove' with angle 360.00deg around vertical axis"
}
```

**Example usage:**
```typescript
// Cut a groove by revolving 360 degrees
{
  name: "create_groove",
  arguments: {
    sketchName: "Sketch",
    axis: "vertical",
    angle: 360
  }
}

// Create a partial groove (180 degrees)
{
  name: "create_groove",
  arguments: {
    sketchName: "Sketch",
    angle: "180deg"
  }
}
```

**Natural language examples:**
- "Cut a groove by revolving this sketch"
- "Create a grooved cut 360 degrees around the axis"
- "Make a partial groove 90 degrees"

**Notes:**
- Groove is a subtractive feature (removes material)
- Similar to Revolution but cuts instead of adds
- Useful for creating threads, O-ring grooves, or decorative cuts

---

#### `create_fillet(featureName: string, edges: number[] | "all", radius: number | string)`

Add a Fillet feature to round edges of a solid.

**Parameters:**
- `featureName` (required): Name of the base feature to fillet (e.g., "Pad", "Body" for entire body)
- `edges` (required): Edges to fillet:
  - Array of edge indices (0-based): `[0, 1, 2]`
  - String `"all"` to fillet all accessible edges
- `radius` (required): Fillet radius. Can be:
  - Numeric value in mm (e.g., `3`)
  - String with units: `"3mm"`, `"0.5cm"`, `"1/8in"`

**Response format:**
```json
{
  "success": true,
  "featureName": "Fillet",
  "featureLabel": "Fillet",
  "bodyName": "Body",
  "baseFeature": "Pad",
  "radius": "3.00mm",
  "edgesCount": 4,
  "message": "Created Fillet 'Fillet' with radius 3.00mm on 4 edge(s)"
}
```

**Example usage:**
```typescript
// Fillet all edges with 3mm radius
{
  name: "create_fillet",
  arguments: {
    featureName: "Pad",
    edges: "all",
    radius: "3mm"
  }
}

// Fillet specific edges (indices 0, 1, 2)
{
  name: "create_fillet",
  arguments: {
    featureName: "Body",
    edges: [0, 1, 2],
    radius: 5
  }
}

// Fillet vertical edges of a pad
{
  name: "create_fillet",
  arguments: {
    featureName: "Pad",
    edges: [0, 2, 4, 6],
    radius: "2mm"
  }
}
```

**Natural language examples:**
- "Add a 3mm fillet to all edges"
- "Fillet the top edges with 5mm radius"
- "Round the corners with a 2mm fillet"

**Notes:**
- Fillet is an additive feature (adds material to round edges)
- Edge indices are 0-based and depend on the feature's geometry
- Use `"all"` for convenience when filleting many edges
- Multiple fillet features can be added to the same body

---

#### `create_chamfer(featureName: string, edges: number[] | "all", distance: number | string)`

Add a Chamfer feature to bevel edges of a solid.

**Parameters:**
- `featureName` (required): Name of the base feature to chamfer
- `edges` (required): Edges to chamfer (same format as `create_fillet`)
- `distance` (required): Chamfer distance (size of the bevel). Can be:
  - Numeric value in mm (e.g., `2`)
  - String with units: `"2mm"`, `"1/16in"`

**Response format:**
```json
{
  "success": true,
  "featureName": "Chamfer",
  "featureLabel": "Chamfer",
  "bodyName": "Body",
  "baseFeature": "Pad",
  "distance": "2.00mm",
  "edgesCount": 4,
  "message": "Created Chamfer 'Chamfer' with distance 2.00mm on 4 edge(s)"
}
```

**Example usage:**
```typescript
// Chamfer all edges with 2mm distance
{
  name: "create_chamfer",
  arguments: {
    featureName: "Pad",
    edges: "all",
    distance: "2mm"
  }
}

// Chamfer specific edges
{
  name: "create_chamfer",
  arguments: {
    featureName: "Body",
    edges: [0, 1],
    distance: 1.5
  }
}
```

**Natural language examples:**
- "Add a 2mm chamfer to all edges"
- "Bevel the top edges with 1.5mm chamfer"
- "Chamfer the edges of the pad"

**Notes:**
- Chamfer removes material to create a beveled edge (typically 45 degrees)
- Alternative to fillet for a different edge treatment
- Distance is measured perpendicular to the original edge

---

#### `update_feature(featureName: string, dimension: string, value: number | string)`

Update a dimensional parameter of an existing feature.

**Parameters:**
- `featureName` (required): Name of the feature to update (e.g., "Pad", "Pocket001")
- `dimension` (required): Dimension to update:
  - `"length"` - For Pad, Pocket (extrusion length/depth)
  - `"angle"` - For Revolution, Groove (revolution angle)
  - `"radius"` - For Fillet (fillet radius)
  - `"distance"` - For Chamfer (chamfer distance)
- `value` (required): New value. Can be:
  - Numeric value (mm for length/distance/radius, degrees for angle)
  - String with units: `"50mm"`, `"180deg"`, `"5mm"`

**Response format:**
```json
{
  "success": true,
  "featureName": "Pad",
  "featureLabel": "Pad",
  "dimension": "length",
  "beforeValue": "20.00mm",
  "afterValue": "50.00mm",
  "message": "Updated Pad length from 20.00mm to 50.00mm"
}
```

**Example usage:**
```typescript
// Change pad length to 50mm
{
  name: "update_feature",
  arguments: {
    featureName: "Pad",
    dimension: "length",
    value: "50mm"
  }
}

// Update revolution angle to 180 degrees
{
  name: "update_feature",
  arguments: {
    featureName: "Revolution",
    dimension: "angle",
    value: 180
  }
}

// Change fillet radius to 5mm
{
  name: "update_feature",
  arguments: {
    featureName: "Fillet",
    dimension: "radius",
    value: "5mm"
  }
}

// Update pocket depth to 15mm
{
  name: "update_feature",
  arguments: {
    featureName: "Pocket",
    dimension: "length",
    value: "15mm"
  }
}
```

**Natural language examples:**
- "Change the pad length to 30mm"
- "Update the revolution angle to 180 degrees"
- "Make the fillet radius 5mm"
- "Increase the pocket depth to 20mm"

**Notes:**
- Features are parametric - dimensions can be changed after creation
- The model automatically regenerates with the new dimension
- Use `list_bodies` or query tools to find feature names

---

#### `replace_sketch(featureName: string, newSketchName: string)`

Replace the sketch used by an existing feature with a different sketch.

**Parameters:**
- `featureName` (required): Name of the feature to modify (e.g., "Pad", "Pocket")
- `newSketchName` (required): Name of the new sketch to use

**Response format:**
```json
{
  "success": true,
  "featureName": "Pad",
  "featureLabel": "Pad",
  "oldSketch": "Sketch",
  "newSketch": "Sketch001",
  "message": "Replaced sketch for Pad from 'Sketch' to 'Sketch001'"
}
```

**Example usage:**
```typescript
// Replace the sketch used by a pad feature
{
  name: "replace_sketch",
  arguments: {
    featureName: "Pad",
    newSketchName: "Sketch001"
  }
}

// Update a pocket to use a different sketch
{
  name: "replace_sketch",
  arguments: {
    featureName: "Pocket",
    newSketchName: "UpdatedSketch"
  }
}
```

**Natural language examples:**
- "Use this new sketch for the pad feature"
- "Replace the sketch used by the pocket"
- "Update the feature to use the updated sketch"

**Notes:**
- The feature geometry updates to match the new sketch
- Useful for iterating on designs without recreating features
- The new sketch must be compatible with the feature type

---

#### `delete_feature(featureName: string)`

Remove a feature from a PartDesign body.

**Parameters:**
- `featureName` (required): Name of the feature to delete (e.g., "Fillet", "Pocket001")

**Response format:**
```json
{
  "success": true,
  "deletedFeature": "Fillet",
  "deletedFeatureLabel": "Fillet",
  "bodyName": "Body",
  "message": "Deleted feature 'Fillet' from Body"
}
```

**Example usage:**
```typescript
// Delete a fillet feature
{
  name: "delete_feature",
  arguments: {
    featureName: "Fillet"
  }
}

// Remove a pocket from the body
{
  name: "delete_feature",
  arguments: {
    featureName: "Pocket001"
  }
}
```

**Natural language examples:**
- "Delete the last fillet"
- "Remove the pocket feature"
- "Delete the chamfer from the body"

**Notes:**
- Deleting a feature removes it from the feature tree
- Dependent features (children) may also be affected
- The operation is undoable via FreeCAD's undo stack
- Use `list_bodies` to see the current feature tree

---

### Boolean Operation Tools

The Boolean operation tools allow you to perform boolean operations on shapes, validate and heal geometry, and query shape properties. These tools work with any shape objects in FreeCAD, including imported STEP/IGES files and native Part/PartDesign features.

---

#### `boolean_fuse(baseShape: string, toolShapes: string[], resultName?: string)`

Perform a boolean union (fuse) operation on two or more shapes.

**Parameters:**
- `baseShape` (required): Name of the base shape/object
- `toolShapes` (required): Array of shape/object names to fuse with the base
- `resultName` (optional): Name for the resulting fused shape. If omitted, auto-generated.

**Response format:**
```json
{
  "success": true,
  "resultName": "Fuse",
  "resultLabel": "Fuse",
  "shapeType": "Solid",
  "volume": 15000.00,
  "message": "Boolean fuse completed successfully"
}
```

**Example usage:**
```typescript
// Fuse two shapes
{
  name: "boolean_fuse",
  arguments: {
    baseShape: "Box",
    toolShapes: ["Cylinder"]
  }
}

// Fuse multiple shapes with custom result name
{
  name: "boolean_fuse",
  arguments: {
    baseShape: "Box",
    toolShapes: ["Cylinder", "Sphere"],
    resultName: "CombinedPart"
  }
}
```

**Natural language examples:**
- "Fuse the box and cylinder together"
- "Combine these shapes into one"
- "Union the box with the cylinder and sphere"

**Notes:**
- The result is a single unified shape
- All shapes must overlap or touch for a meaningful result
- The original shapes remain in the document

---

#### `boolean_cut(baseShape: string, toolShapes: string[], resultName?: string)`

Perform a boolean cut (subtract) operation - subtract tool shapes from a base shape.

**Parameters:**
- `baseShape` (required): Name of the base shape/object to cut from
- `toolShapes` (required): Array of shape/object names to subtract from the base
- `resultName` (optional): Name for the resulting cut shape. If omitted, auto-generated.

**Response format:**
```json
{
  "success": true,
  "resultName": "Cut",
  "resultLabel": "Cut",
  "shapeType": "Solid",
  "volume": 8000.00,
  "message": "Boolean cut completed successfully"
}
```

**Example usage:**
```typescript
// Cut one shape from another
{
  name: "boolean_cut",
  arguments: {
    baseShape: "Box",
    toolShapes: ["Cylinder"]
  }
}

// Cut multiple shapes with custom result name
{
  name: "boolean_cut",
  arguments: {
    baseShape: "Box",
    toolShapes: ["Cylinder", "Sphere"],
    resultName: "CutPart"
  }
}
```

**Natural language examples:**
- "Cut the cylinder from the box"
- "Subtract the sphere from the cube"
- "Make a hole using the cylinder"

**Notes:**
- Creates cuts, holes, or cavities in the base shape
- Tool shapes must intersect with the base shape
- The original shapes remain in the document

---

#### `boolean_common(baseShape: string, toolShapes: string[], resultName?: string)`

Perform a boolean intersection (common) operation - find the shared volume between shapes.

**Parameters:**
- `baseShape` (required): Name of the base shape/object
- `toolShapes` (required): Array of shape/object names to intersect with the base
- `resultName` (optional): Name for the resulting intersection shape. If omitted, auto-generated.

**Response format:**
```json
{
  "success": true,
  "resultName": "Common",
  "resultLabel": "Common",
  "shapeType": "Solid",
  "volume": 2500.00,
  "message": "Boolean intersection completed successfully"
}
```

**Example usage:**
```typescript
// Intersect two shapes
{
  name: "boolean_common",
  arguments: {
    baseShape: "Box",
    toolShapes: ["Cylinder"]
  }
}

// Intersect multiple shapes with custom result name
{
  name: "boolean_common",
  arguments: {
    baseShape: "Box",
    toolShapes: ["Cylinder", "Sphere"],
    resultName: "CommonPart"
  }
}
```

**Natural language examples:**
- "Find the intersection of the box and cylinder"
- "Get the common volume between these shapes"
- "Intersect all three shapes"

**Notes:**
- Returns only the overlapping/shared volume
- Shapes must overlap for a non-empty result
- Useful for finding fit or interference

---

#### `make_compound(shapes: string[], resultName?: string)`

Create a compound of multiple shapes - groups shapes together without boolean fusion.

**Parameters:**
- `shapes` (required): Array of shape/object names to compound
- `resultName` (optional): Name for the resulting compound. If omitted, auto-generated.

**Response format:**
```json
{
  "success": true,
  "resultName": "Compound",
  "resultLabel": "Compound",
  "shapeCount": 3,
  "message": "Created compound with 3 shapes"
}
```

**Example usage:**
```typescript
// Compound two shapes
{
  name: "make_compound",
  arguments: {
    shapes: ["Box", "Cylinder"]
  }
}

// Compound multiple shapes with custom name
{
  name: "make_compound",
  arguments: {
    shapes: ["Box", "Cylinder", "Sphere"],
    resultName: "Assembly"
  }
}
```

**Natural language examples:**
- "Group the box and cylinder together"
- "Make a compound of all these parts"
- "Combine these shapes into an assembly"

**Notes:**
- Unlike `boolean_fuse`, shapes remain distinct solids within the compound
- No boolean operation is performed - shapes are just grouped
- Useful for treating multiple parts as a single object for transformations
- Each shape retains its individual identity

---

#### `validate_shape(shapeName: string)`

Validate a shape for integrity and detect defects.

**Parameters:**
- `shapeName` (required): Name of the shape/object to validate

**Response format:**
```json
{
  "success": true,
  "shapeName": "ImportedPart",
  "shapeLabel": "ImportedPart",
  "isValid": false,
  "issues": [
    {
      "type": "FreeEdges",
      "description": "Shape has 4 free edges"
    },
    {
      "type": "NonManifoldEdges",
      "description": "Shape has 2 non-manifold edges"
    }
  ],
  "issueCount": 2,
  "message": "Validation completed: 2 issues found"
}
```

**Example usage:**
```typescript
// Validate a shape
{
  name: "validate_shape",
  arguments: {
    shapeName: "Pad"
  }
}

// Validate an imported part
{
  name: "validate_shape",
  arguments: {
    shapeName: "ImportedPart"
  }
}
```

**Natural language examples:**
- "Check if this shape is valid"
- "Validate the imported STEP file"
- "Are there any issues with this shape?"

**Detected issues:**
- `FreeEdges` - Edges not connected to faces
- `NonManifoldEdges` - Edges shared by more than two faces
- `InvalidOrientation` - Faces with incorrect normal orientation
- `SelfIntersections` - Shape intersects itself
- `DegenerateFaces` - Faces with zero or near-zero area

**Notes:**
- Use before boolean operations to ensure shape integrity
- Recommended for imported CAD files (STEP, IGES)
- If issues are found, consider using `heal_shape`

---

#### `heal_shape(shapeName: string, tolerance?: number | string)`

Attempt to fix shape defects and improve shape quality.

**Parameters:**
- `shapeName` (required): Name of the shape/object to heal
- `tolerance` (optional): Healing tolerance value. Can be:
  - Numeric value in mm (e.g., `0.1`)
  - String with units: `"0.1mm"`, `"0.01mm"`
  - Default: `0.1mm`

**Response format:**
```json
{
  "success": true,
  "shapeName": "ImportedPart",
  "shapeLabel": "ImportedPart",
  "issuesFixed": 2,
  "remainingIssues": 0,
  "message": "Healing completed: 2 issues fixed"
}
```

**Example usage:**
```typescript
// Heal with default tolerance
{
  name: "heal_shape",
  arguments: {
    shapeName: "ImportedPart"
  }
}

// Heal with custom tolerance
{
  name: "heal_shape",
  arguments: {
    shapeName: "ImportedPart",
    tolerance: "0.01mm"
  }
}

// Heal with numeric tolerance
{
  name: "heal_shape",
  arguments: {
    shapeName: "BadShape",
    tolerance: 0.05
  }
}
```

**Natural language examples:**
- "Fix the issues with this shape"
- "Heal the imported part"
- "Repair this geometry with 0.01mm tolerance"

**Fixes applied:**
- Small gaps between faces
- Tolerance issues
- Invalid edge connections
- Degenerate geometry
- Free edges
- Non-manifold conditions

**Notes:**
- Use after `validate_shape` reports issues
- Smaller tolerance = more precise but may fix fewer issues
- Larger tolerance = more aggressive healing
- Recommended for imported CAD files

---

#### `get_shape_info(shapeName: string)`

Get detailed information about a shape's properties and topology.

**Parameters:**
- `shapeName` (required): Name of the shape/object to query

**Response format:**
```json
{
  "success": true,
  "shapeName": "Pad",
  "shapeLabel": "Pad",
  "shapeType": "Solid",
  "topology": {
    "vertices": 8,
    "edges": 12,
    "faces": 6,
    "wires": 6,
    "shells": 1,
    "solids": 1,
    "compounds": 0
  },
  "properties": {
    "volume": 1000.00,
    "area": 600.00,
    "centerOfMass": {"x": 5.00, "y": 5.00, "z": 5.00},
    "boundingBox": {
      "minX": 0, "minY": 0, "minZ": 0,
      "maxX": 10, "maxY": 10, "maxZ": 10,
      "xSize": 10, "ySize": 10, "zSize": 10
    }
  },
  "message": "Shape info retrieved successfully"
}
```

**Example usage:**
```typescript
// Get shape info
{
  name: "get_shape_info",
  arguments: {
    shapeName: "Pad"
  }
}

// Query an imported part
{
  name: "get_shape_info",
  arguments: {
    shapeName: "ImportedPart"
  }
}
```

**Natural language examples:**
- "Get information about this shape"
- "What are the properties of the pad?"
- "Tell me about the volume and dimensions"

**Information returned:**
- **Topology counts**: Vertices, edges, faces, wires, shells, solids, compounds
- **Volume**: Total volume of the shape (in mm³)
- **Surface Area**: Total surface area (in mm²)
- **Center of Mass**: 3D coordinates of the center of mass
- **Bounding Box**: Min/max coordinates and dimensions (X, Y, Z size)

**Notes:**
- Useful for understanding shape complexity
- Volume and area useful for mass properties calculations
- Bounding box helps with placement and fit analysis

---

### Assembly Constraint Tools

The assembly constraint tools allow you to create and manage assemblies with parametric constraints between multiple parts. After creating individual parts using Part or PartDesign workbenches, you can assemble them together using constraints like Coincident, Parallel, Perpendicular, Angle, Distance, and more to define their spatial relationships.

**Assembly Workflow Overview:**

1. **Create Parts** - Build individual components using Part/PartDesign tools
2. **Create Assembly** - Create an assembly container to hold parts
3. **Add Components** - Add parts to the assembly
4. **Apply Constraints** - Define spatial relationships between parts
5. **Modify/Remove** - Adjust or remove constraints as needed
6. **Solve** - Assembly solver positions parts according to constraints

---

#### Assembly Management Tools

##### `create_assembly(name?: string)`

Create a new empty assembly container.

**Parameters:**
- `name` (optional): Name for the new assembly. If omitted, auto-generated.

**Response format:**
```json
{
  "success": true,
  "assemblyName": "Assembly",
  "assemblyLabel": "Assembly",
  "documentName": "UnnamedDocument",
  "componentCount": 0,
  "constraintCount": 0,
  "message": "Created assembly 'Assembly'"
}
```

**Example usage:**
```typescript
// Create a new assembly with auto-generated name
{
  name: "create_assembly",
  arguments: {}
}

// Create a named assembly
{
  name: "create_assembly",
  arguments: {
    name: "EngineAssembly"
  }
}
```

**Natural language examples:**
- "Create a new assembly"
- "Start an assembly named 'EngineAssembly'"
- "Create an empty assembly to hold the parts"

---

##### `add_component_to_assembly(objectName: string, assemblyName: string)`

Add an existing part or body to an assembly.

**Parameters:**
- `objectName` (required): Name of the part/body to add
- `assemblyName` (required): Name of the target assembly

**Response format:**
```json
{
  "success": true,
  "componentName": "Piston",
  "assemblyName": "EngineAssembly",
  "message": "Added 'Piston' to assembly 'EngineAssembly'"
}
```

**Example usage:**
```typescript
// Add a part to an assembly
{
  name: "add_component_to_assembly",
  arguments: {
    objectName: "Piston",
    assemblyName: "EngineAssembly"
  }
}

// Add a body to an assembly
{
  name: "add_component_to_assembly",
  arguments: {
    objectName: "Body",
    assemblyName: "Assembly"
  }
}
```

**Natural language examples:**
- "Add the piston to the engine assembly"
- "Include the cylinder in this assembly"
- "Put the bracket part into the main assembly"

---

##### `remove_component_from_assembly(componentName: string, assemblyName: string)`

Remove a part from an assembly.

**Parameters:**
- `componentName` (required): Name of the component to remove
- `assemblyName` (required): Name of the source assembly

**Response format:**
```json
{
  "success": true,
  "removedComponent": "Bolt",
  "assemblyName": "EngineAssembly",
  "message": "Removed 'Bolt' from assembly 'EngineAssembly'"
}
```

**Example usage:**
```typescript
{
  name: "remove_component_from_assembly",
  arguments: {
    componentName: "Bolt",
    assemblyName: "EngineAssembly"
  }
}
```

**Natural language examples:**
- "Remove the bolt from this assembly"
- "Take the gasket out of the assembly"
- "Ungroup the part from the assembly"

---

##### `list_assemblies()`

List all assemblies in the current document.

**Parameters:** None

**Response format:**
```json
{
  "success": true,
  "assemblies": [
    {
      "name": "Assembly",
      "label": "Assembly",
      "componentCount": 4,
      "constraintCount": 6
    },
    {
      "name": "SubAssembly",
      "label": "SubAssembly",
      "componentCount": 2,
      "constraintCount": 3
    }
  ],
  "assemblyCount": 2,
  "message": "Found 2 assembly(ies)"
}
```

**Example usage:**
```typescript
{
  name: "list_assemblies",
  arguments: {}
}
```

**Natural language examples:**
- "Show me all assemblies"
- "What assemblies exist in this document?"
- "List all assembly containers"

---

##### `list_assembly_components(assemblyName: string)`

List all components in a specific assembly.

**Parameters:**
- `assemblyName` (required): Name of the assembly to query

**Response format:**
```json
{
  "success": true,
  "assemblyName": "EngineAssembly",
  "components": [
    {
      "name": "Cylinder",
      "label": "Cylinder",
      "position": {"x": 0, "y": 0, "z": 0}
    },
    {
      "name": "Piston",
      "label": "Piston",
      "position": {"x": 0, "y": 0, "z": 25}
    }
  ],
  "componentCount": 2,
  "message": "Found 2 component(s) in 'EngineAssembly'"
}
```

**Example usage:**
```typescript
{
  name: "list_assembly_components",
  arguments: {
    assemblyName: "EngineAssembly"
  }
}
```

**Natural language examples:**
- "What parts are in the engine assembly?"
- "Show me components of this assembly"
- "List all parts in the main assembly"

---

#### Constraint Creation Tools

The constraint creation tools define spatial relationships between subobjects (faces, edges, vertices) of assembly components. All constraint tools share these common parameters:

**Common Parameters:**
- `object1` (required): Name of first component
- `subobject1` (required): Subobject reference for first component (e.g., "Face1", "Edge2", "Vertex3")
- `object2` (required): Name of second component
- `subobject2` (required): Subobject reference for second component
- `name` (optional): Custom name for the constraint

**Subobject Reference Format:**
- `FaceN` - Nth face (e.g., "Face1", "Face4")
- `EdgeN` - Nth edge (e.g., "Edge1", "Edge3")
- `VertexN` - Nth vertex (e.g., "Vertex1", "Vertex2")

**Response format (all constraint tools):**
```json
{
  "success": true,
  "constraintName": "Coincident1",
  "constraintType": "Coincident",
  "objects": ["Cylinder:Face1", "Box:Face6"],
  "message": "Added Coincident constraint 'Coincident1'"
}
```

---

##### `add_coincident_constraint(object1: string, subobject1: string, object2: string, subobject2: string, name?: string)`

Make two subobjects coincident (touching, sharing the same geometry).

**Applies to:** Face-Face, Edge-Edge, Vertex-Vertex

**Example usage:**
```typescript
{
  name: "add_coincident_constraint",
  arguments: {
    object1: "Cylinder",
    subobject1: "Face1",
    object2: "Box",
    subobject2: "Face6"
  }
}
```

**Natural language examples:**
- "Make these two faces coincident"
- "Align the bottom of the cylinder with the top of the box"
- "Attach the face of the bracket to the face of the plate"

---

##### `add_parallel_constraint(object1: string, subobject1: string, object2: string, subobject2: string, name?: string)`

Make two linear subobjects parallel (facing the same direction).

**Applies to:** Face-Face (planar), Edge-Edge (linear)

**Example usage:**
```typescript
{
  name: "add_parallel_constraint",
  arguments: {
    object1: "Plate",
    subobject1: "Edge1",
    object2: "Rail",
    subobject2: "Edge3"
  }
}
```

**Natural language examples:**
- "Make these edges parallel"
- "Align the axes to be parallel"
- "Make the slot parallel to the rail"

---

##### `add_perpendicular_constraint(object1: string, subobject1: string, object2: string, subobject2: string, name?: string)`

Make two subobjects perpendicular (at 90 degrees to each other).

**Applies to:** Face-Face, Edge-Edge

**Example usage:**
```typescript
{
  name: "add_perpendicular_constraint",
  arguments: {
    object1: "Box",
    subobject1: "Face1",
    object2: "Rod",
    subobject2: "Face2"
  }
}
```

**Natural language examples:**
- "Make this face perpendicular to that face"
- "Set these edges at 90 degrees"
- "Make the mounting plate perpendicular to the base"

---

##### `add_angle_constraint(object1: string, subobject1: string, object2: string, subobject2: string, angle: number | string, name?: string)`

Set a specific angle between two subobjects.

**Parameters:**
- `angle` (required): Angle value. Can be:
  - Numeric value in degrees (e.g., `45`)
  - String with units: `"45deg"`, `"30deg"`, `"1.57rad"`

**Applies to:** Face-Face, Edge-Edge

**Example usage:**
```typescript
// Set 45 degree angle between faces
{
  name: "add_angle_constraint",
  arguments: {
    object1: "Plate",
    subobject1: "Face1",
    object2: "Mount",
    subobject2: "Face2",
    angle: 45
  }
}

// Set 30 degree angle with units
{
  name: "add_angle_constraint",
  arguments: {
    object1: "Arm",
    subobject1: "Edge1",
    object2: "Base",
    subobject2: "Edge2",
    angle: "30deg"
  }
}
```

**Natural language examples:**
- "Set a 45 degree angle between these faces"
- "Add a 30 degree angle constraint"
- "Angle the bracket at 60 degrees to the plate"

---

##### `add_distance_constraint(object1: string, subobject1: string, object2: string, subobject2: string, distance: number | string, name?: string)`

Set a distance between two subobjects.

**Parameters:**
- `distance` (required): Distance value. Can be:
  - Numeric value in mm (e.g., `10`)
  - String with units: `"10mm"`, `"1cm"`, `"0.5in"`

**Applies to:** Face-Face, Edge-Edge, Vertex-Vertex

**Example usage:**
```typescript
// Set 10mm distance between faces
{
  name: "add_distance_constraint",
  arguments: {
    object1: "Box",
    subobject1: "Face1",
    object2: "Plate",
    subobject2: "Face3",
    distance: 10
  }
}

// Set 5mm gap with units
{
  name: "add_distance_constraint",
  arguments: {
    object1: "Gear",
    subobject1: "Face2",
    object2: "Bearing",
    subobject2: "Face1",
    distance: "5mm"
  }
}
```

**Natural language examples:**
- "Set a 10mm gap between these faces"
- "Add a 5mm offset constraint"
- "Position the plate 20mm from the bracket"

---

##### `add_insert_constraint(object1: string, subobject1: string, object2: string, subobject2: string, name?: string)`

Insert one cylindrical subobject into another (axial fit constraint).

**Applies to:** Cylindrical Face-Cylindrical Face (shaft into hole)

**Example usage:**
```typescript
{
  name: "add_insert_constraint",
  arguments: {
    object1: "Shaft",
    subobject1: "Face1",
    object2: "Bearing",
    subobject2: "Face2"
  }
}
```

**Natural language examples:**
- "Insert the pin into the hole"
- "Make the shaft fit into the bearing"
- "Put the axle into the bushing"

---

##### `add_tangent_constraint(object1: string, subobject1: string, object2: string, subobject2: string, name?: string)`

Make two subobjects tangent (touching at exactly one point/line, no intersection).

**Applies to:** Face-Face, Edge-Curve, Curve-Edge

**Example usage:**
```typescript
{
  name: "add_tangent_constraint",
  arguments: {
    object1: "Cylinder",
    subobject1: "Face1",
    object2: "Plane",
    subobject2: "Face1"
  }
}
```

**Natural language examples:**
- "Make this cylinder tangent to the plane"
- "Add a tangent constraint between the wheel and ground"
- "Set the gear tangent to the rack"

---

##### `add_equal_constraint(object1: string, subobject1: string, object2: string, subobject2: string, name?: string)`

Make two subobjects equal (same length, radius, or size).

**Applies to:** Edge-Edge (length), Circle-Arc (radius)

**Example usage:**
```typescript
{
  name: "add_equal_constraint",
  arguments: {
    object1: "Pin1",
    subobject1: "Edge1",
    object2: "Pin2",
    subobject2: "Edge1"
  }
}
```

**Natural language examples:**
- "Make these two circles equal radius"
- "Make these edges equal length"
- "Set the bore holes to equal diameter"

---

##### `add_symmetric_constraint(object1: string, subobject1: string, object2: string, subobject2: string, symmetryPlane: string, name?: string)`

Make two subobjects symmetric about a plane.

**Parameters:**
- `symmetryPlane` (required): Reference plane for symmetry (e.g., "XY_Plane", "Face3")

**Applies to:** Vertex-Vertex, Edge-Edge, Face-Face

**Example usage:**
```typescript
{
  name: "add_symmetric_constraint",
  arguments: {
    object1: "Hole1",
    subobject1: "Vertex1",
    object2: "Hole2",
    subobject2: "Vertex1",
    symmetryPlane: "YZ_Plane"
  }
}
```

**Natural language examples:**
- "Make these features symmetric about the XY plane"
- "Center the holes symmetrically about the plate center"
- "Set the mounting holes symmetric about the centerline"

---

#### Constraint Modification Tools

##### `update_constraint_value(constraintName: string, newValue: number | string)`

Modify the value of an angle or distance constraint.

**Parameters:**
- `constraintName` (required): Name of the constraint to update
- `newValue` (required): New value. Can be:
  - Numeric value (degrees for angle, mm for distance)
  - String with units: `"60deg"`, `"15mm"`

**Response format:**
```json
{
  "success": true,
  "constraintName": "Angle1",
  "constraintType": "Angle",
  "oldValue": "45.00deg",
  "newValue": "60.00deg",
  "message": "Updated 'Angle1' from 45.00deg to 60.00deg"
}
```

**Example usage:**
```typescript
// Change angle constraint
{
  name: "update_constraint_value",
  arguments: {
    constraintName: "Angle1",
    newValue: 60
  }
}

// Change distance constraint with units
{
  name: "update_constraint_value",
  arguments: {
    constraintName: "Gap1",
    newValue: "15mm"
  }
}
```

**Natural language examples:**
- "Change the angle to 60 degrees"
- "Update the gap to 15mm"
- "Set the distance between parts to 20mm"

---

##### `remove_constraint(constraintName: string)`

Delete a constraint from an assembly.

**Response format:**
```json
{
  "success": true,
  "removedConstraint": "Coincident1",
  "constraintType": "Coincident",
  "message": "Removed constraint 'Coincident1'"
}
```

**Example usage:**
```typescript
{
  name: "remove_constraint",
  arguments: {
    constraintName: "Coincident1"
  }
}
```

**Natural language examples:**
- "Remove the coincident constraint"
- "Delete the last constraint added"
- "Unconstrain the angle between these parts"

---

##### `list_constraints(assemblyName?: string)`

List all constraints in an assembly.

**Parameters:**
- `assemblyName` (optional): Name of the assembly. If omitted, lists from active assembly.

**Response format:**
```json
{
  "success": true,
  "assemblyName": "EngineAssembly",
  "constraints": [
    {
      "name": "Coincident1",
      "type": "Coincident",
      "objects": ["Cylinder:Face1", "Box:Face6"],
      "value": null,
      "status": "active"
    },
    {
      "name": "Distance1",
      "type": "Distance",
      "objects": ["Gear:Face2", "Bearing:Face1"],
      "value": "5.00mm",
      "status": "active"
    }
  ],
  "constraintCount": 2,
  "message": "Found 2 constraint(s) in 'EngineAssembly'"
}
```

**Example usage:**
```typescript
// List all constraints in active assembly
{
  name: "list_constraints",
  arguments: {}
}

// List constraints in specific assembly
{
  name: "list_constraints",
  arguments: {
    assemblyName: "EngineAssembly"
  }
}
```

**Natural language examples:**
- "Show me all constraints"
- "What constraints are in this assembly?"
- "List all constraints in the engine assembly"

---

##### `suppress_constraint(constraintName: string)`

Temporarily disable a constraint without deleting it.

**Response format:**
```json
{
  "success": true,
  "constraintName": "Distance1",
  "previousStatus": "active",
  "newStatus": "suppressed",
  "message": "Suppressed constraint 'Distance1'"
}
```

**Example usage:**
```typescript
{
  name: "suppress_constraint",
  arguments: {
    constraintName: "Distance1"
  }
}
```

**Natural language examples:**
- "Temporarily disable this constraint"
- "Suppress the distance constraint"
- "Turn off the angle constraint temporarily"

**Notes:**
- Suppressed constraints are excluded from the assembly solver
- Parts will move freely until the constraint is reactivated
- Use `activate_constraint` to re-enable

---

##### `activate_constraint(constraintName: string)`

Re-enable a previously suppressed constraint.

**Response format:**
```json
{
  "success": true,
  "constraintName": "Distance1",
  "previousStatus": "suppressed",
  "newStatus": "active",
  "message": "Activated constraint 'Distance1'"
}
```

**Example usage:**
```typescript
{
  name: "activate_constraint",
  arguments: {
    constraintName: "Distance1"
  }
}
```

**Natural language examples:**
- "Re-enable the suppressed constraint"
- "Activate the angle constraint"
- "Turn the distance constraint back on"

---

#### Constraint Types Reference

| Constraint Type | Description | Applies To | Parameters |
|-----------------|-------------|------------|------------|
| `Coincident` | Two subobjects share the same geometry | Face-Face, Edge-Edge, Vertex-Vertex | - |
| `Parallel` | Two subobjects face the same direction | Face-Face, Edge-Edge | - |
| `Perpendicular` | Two subobjects are at 90 degrees | Face-Face, Edge-Edge | - |
| `Angle` | Set specific angle between subobjects | Face-Face, Edge-Edge | `angle` (degrees) |
| `Distance` | Set distance between subobjects | Face-Face, Edge-Edge, Vertex-Vertex | `distance` (mm) |
| `Insert` | Cylindrical insertion (shaft into hole) | Cylinder-Cylinder | - |
| `Tangent` | Subobjects touch at exactly one point/line | Face-Face, Edge-Curve | - |
| `Equal` | Subobjects have equal size | Edge-Edge, Circle-Arc | - |
| `Symmetric` | Subobjects symmetric about a plane | Vertex-Vertex, Edge-Edge, Face-Face | `symmetryPlane` |

---

#### Subobject Reference Format

Subobjects are referenced using the format `ObjectName.SubobjectTypeN`:

| Format | Example | Description |
|--------|---------|-------------|
| `FaceN` | `Box.Face1` | Nth face of an object |
| `EdgeN` | `Cylinder.Edge3` | Nth edge of an object |
| `VertexN` | `Part.Vertex1` | Nth vertex of an object |

**Finding Subobject Indices:**

1. **Query the model** - Use `query_model_state` with `object_details` intent
2. **Select in viewport** - Click on a subobject in FreeCAD to see its reference
3. **Use natural language** - Describe the subobject (e.g., "top face", "bottom edge")

**Examples:**
- `Body.Face1` - First face of "Body"
- `Cylinder.Face2` - Second face (cylindrical surface) of "Cylinder"
- `Box.Edge1` - First edge of "Box"
- `Assembly.Vertex3` - Third vertex of "Assembly"

---

#### Assembly Workflow Guidance

**Basic Assembly Workflow:**

1. **Prepare Parts** - Create or import all individual components
2. **Create Assembly** - `create_assembly` to make a container
3. **Add Components** - `add_component_to_assembly` for each part
4. **Ground First Part** - Add a coincident constraint to fix one part in place
5. **Add Mating Constraints** - Use coincident, parallel, etc. to define relationships
6. **Solve and Verify** - Assembly solver positions all parts
7. **Adjust as Needed** - Use `update_constraint_value` to modify

**Common Assembly Patterns:**

**Pattern 1: Simple Stack**
```
1. Create assembly "StackAssembly"
2. Add BasePlate and TopPlate
3. Coincident: BasePlate.Face6 with TopPlate.Face1
```
Result: Plates stacked directly on each other

**Pattern 2: Parallel Parts**
```
1. Create assembly "SlideAssembly"
2. Add Slider and Guide
3. Parallel: Slider.Face1 with Guide.Face1
4. Distance: Slider.Face3 to Guide.Face3 = 5mm
```
Result: Parts slide parallel with 5mm gap

**Pattern 3: Shaft Assembly**
```
1. Create assembly "BearingAssembly"
2. Add Shaft, Bearing, and Housing
3. Insert: Shaft.Face1 with Bearing.Face1
4. Insert: Bearing.Face2 with Housing.Face1
```
Result: Bearing sandwiched between shaft and housing

**Pattern 4: Angle Bracket**
```
1. Create assembly "CornerAssembly"
2. Add VerticalPlate and HorizontalPlate
3. Coincident: VerticalPlate.Face4 with HorizontalPlate.Face4 (shared edge)
4. Angle: VerticalPlate.Face1 to HorizontalPlate.Face1 = 90deg
```
Result: Plates at right angles forming a corner

---

#### Common Constraint Patterns and Best Practices

**Do's:**

- **Ground one part first** - Always fix one component with a coincident constraint to ground before adding other constraints
- **Use descriptive names** - Name constraints meaningfully (e.g., "BasePlateToGround" instead of "Constraint1")
- **Start simple** - Begin with basic coincident constraints before adding complex angle/distance constraints
- **Verify solvability** - Check that constraints don't conflict (over-constrained) or leave parts floating (under-constrained)
- **Use suppress for iteration** - Use `suppress_constraint` when testing different configurations

**Don'ts:**

- **Don't over-constrain** - Too many constraints can make the assembly unsolvable
- **Don't conflicting constraints** - Avoid setting contradictory constraints (e.g., distance=5mm AND coincident on same faces)
- **Don't use wrong subobject types** - Ensure constraint types match subobject geometry (e.g., Insert constraint requires cylindrical faces)
- **Don't forget units** - Always specify units when setting angle or distance values

**Troubleshooting:**

| Problem | Cause | Solution |
|---------|-------|----------|
| Parts don't move | Assembly is over-constrained | Remove some constraints |
| Parts fly apart | Under-constrained | Add more constraints |
| Constraint fails | Invalid subobject reference | Verify Face/Edge/Vertex indices |
| Can't solve | Conflicting constraints | Check for contradictory values |
| Unexpected position | Wrong constraint direction | Try different face combinations |

---

### Draft Workbench Tools

The Draft workbench tools allow you to create and modify 2D geometry, dimensions, and annotations. Draft objects are the foundation for technical drawings, 2D layouts, and can be used to create 3D features via extrusion or revolution.

**Draft Workbench Overview:**

- **Geometry Creation** - Points, lines, circles, arcs, ellipses, rectangles, polygons, BSplines, Bezier curves
- **Dimensions** - Linear, radial, and angular dimensions that link to geometry parametrically
- **Annotations** - Text labels for documentation and callouts
- **Modifications** - Move, rotate, scale, offset, join, and split operations
- **Working Plane** - The XY, XZ, or YZ plane determines where geometry is created

---

#### Geometry Creation Tools

##### `create_point(x: number, y: number, z?: number, name?: string)`

Create a point in 3D space.

**Parameters:**
- `x` (required): X coordinate in mm
- `y` (required): Y coordinate in mm
- `z` (optional): Z coordinate in mm (default: 0)
- `name` (optional): Name for the point object

**Response format:**
```json
{
  "success": true,
  "objectName": "Point",
  "objectType": "Point",
  "coordinates": {"x": 10, "y": 20, "z": 0},
  "message": "Created Point 'Point' at (10, 20, 0)"
}
```

**Example usage:**
```typescript
// Create a point at origin
{
  name: "create_point",
  arguments: { x: 0, y: 0, z: 0 }
}

// Create a point at (100, 50)
{
  name: "create_point",
  arguments: { x: 100, y: 50 }
}

// Create a named point
{
  name: "create_point",
  arguments: { x: 25, y: 75, z: 10, name: "PointA" }
}
```

**Natural language examples:**
- "Create a point at (0, 0, 0)"
- "Add a point at the origin"
- "Create a point named PointA at (100, 50)"

---

##### `create_line(startX: number, startY: number, startZ: number, endX: number, endY: number, endZ: number, name?: string)`

Create a line segment between two points.

**Parameters:**
- `startX`, `startY`, `startZ` (required): Start point coordinates in mm
- `endX`, `endY`, `endZ` (required): End point coordinates in mm
- `name` (optional): Name for the line object

**Response format:**
```json
{
  "success": true,
  "objectName": "Line",
  "objectType": "Line",
  "startPoint": {"x": 0, "y": 0, "z": 0},
  "endPoint": {"x": 100, "y": 50, "z": 0},
  "message": "Created Line 'Line' from (0, 0, 0) to (100, 50, 0)"
}
```

**Example usage:**
```typescript
// Create a horizontal line
{
  name: "create_line",
  arguments: { startX: 0, startY: 0, startZ: 0, endX: 100, endY: 0, endZ: 0 }
}

// Create a diagonal line
{
  name: "create_line",
  arguments: { startX: 0, startY: 0, startZ: 0, endX: 50, endY: 80, endZ: 0, name: "Diagonal" }
}
```

**Natural language examples:**
- "Draw a line from (0,0) to (100,0)"
- "Create a line from point A to point B"
- "Add a diagonal line from origin to (50, 80)"

---

##### `create_circle(centerX: number, centerY: number, centerZ: number, radius: number | string, name?: string)`

Create a circle with a given center and radius.

**Parameters:**
- `centerX`, `centerY`, `centerZ` (required): Center point coordinates in mm
- `radius` (required): Circle radius. Can be numeric (mm) or string with units ("10mm")
- `name` (optional): Name for the circle object

**Response format:**
```json
{
  "success": true,
  "objectName": "Circle",
  "objectType": "Circle",
  "center": {"x": 50, "y": 50, "z": 0},
  "radius": "10.00mm",
  "message": "Created Circle 'Circle' at (50, 50, 0) with 10.00mm radius"
}
```

**Example usage:**
```typescript
// Create a 10mm radius circle at origin
{
  name: "create_circle",
  arguments: { centerX: 0, centerY: 0, centerZ: 0, radius: 10 }
}

// Create a circle with units
{
  name: "create_circle",
  arguments: { centerX: 50, centerY: 50, centerZ: 0, radius: "25mm", name: "Hole" }
}
```

**Natural language examples:**
- "Create a 10mm radius circle at (50, 50)"
- "Draw a circle with 25mm radius"
- "Add a circle named Hole at the origin with 5mm radius"

---

##### `create_arc(centerX: number, centerY: number, centerZ: number, radius: number | string, startAngle: number, endAngle: number, name?: string)`

Create a circular arc.

**Parameters:**
- `centerX`, `centerY`, `centerZ` (required): Center point coordinates in mm
- `radius` (required): Arc radius. Can be numeric or string with units
- `startAngle` (required): Start angle in degrees
- `endAngle` (required): End angle in degrees
- `name` (optional): Name for the arc object

**Response format:**
```json
{
  "success": true,
  "objectName": "Arc",
  "objectType": "Arc",
  "center": {"x": 0, "y": 0, "z": 0},
  "radius": "10.00mm",
  "startAngle": "0.00deg",
  "endAngle": "90.00deg",
  "message": "Created Arc 'Arc' from 0.00deg to 90.00deg with 10.00mm radius"
}
```

**Example usage:**
```typescript
// Create a 90 degree arc
{
  name: "create_arc",
  arguments: { centerX: 0, centerY: 0, centerZ: 0, radius: 50, startAngle: 0, endAngle: 90 }
}

// Create a semicircle arc
{
  name: "create_arc",
  arguments: { centerX: 0, centerY: 0, centerZ: 0, radius: "20mm", startAngle: 0, endAngle: 180, name: "SemiCircle" }
}
```

**Natural language examples:**
- "Create a 90 degree arc starting at 0"
- "Draw an arc from 0 to 180 degrees"
- "Add a semicircle arc with 20mm radius"

---

##### `create_ellipse(centerX: number, centerY: number, centerZ: number, majorRadius: number | string, minorRadius: number | string, name?: string)`

Create an ellipse.

**Parameters:**
- `centerX`, `centerY`, `centerZ` (required): Center point coordinates in mm
- `majorRadius` (required): Major (long) axis radius. Can be numeric or string with units
- `minorRadius` (required): Minor (short) axis radius. Can be numeric or string with units
- `name` (optional): Name for the ellipse object

**Response format:**
```json
{
  "success": true,
  "objectName": "Ellipse",
  "objectType": "Ellipse",
  "center": {"x": 0, "y": 0, "z": 0},
  "majorRadius": "50.00mm",
  "minorRadius": "30.00mm",
  "message": "Created Ellipse 'Ellipse' at (0, 0, 0) with major 50.00mm, minor 30.00mm"
}
```

**Example usage:**
```typescript
// Create an ellipse with 50mm major and 30mm minor radius
{
  name: "create_ellipse",
  arguments: { centerX: 0, centerY: 0, centerZ: 0, majorRadius: 50, minorRadius: 30 }
}

// Create a named ellipse
{
  name: "create_ellipse",
  arguments: { centerX: 100, centerY: 100, centerZ: 0, majorRadius: "40mm", minorRadius: "25mm", name: "EllipseA" }
}
```

**Natural language examples:**
- "Create an ellipse with 50mm and 30mm axes"
- "Draw an ellipse at the origin with 40mm major and 25mm minor"
- "Add an ellipse with major radius 60mm and minor radius 35mm"

---

##### `create_rectangle(width: number | string, height: number | string, name?: string)`

Create a rectangle.

**Parameters:**
- `width` (required): Rectangle width. Can be numeric or string with units
- `height` (required): Rectangle height. Can be numeric or string with units
- `name` (optional): Name for the rectangle object

**Response format:**
```json
{
  "success": true,
  "objectName": "Rectangle",
  "objectType": "Rectangle",
  "width": "100.00mm",
  "height": "50.00mm",
  "message": "Created Rectangle 'Rectangle' with 100.00mm x 50.00mm"
}
```

**Example usage:**
```typescript
// Create a 100mm by 50mm rectangle
{
  name: "create_rectangle",
  arguments: { width: 100, height: 50 }
}

// Create a rectangle with units
{
  name: "create_rectangle",
  arguments: { width: "80mm", height: "40mm", name: "Plate" }
}
```

**Natural language examples:**
- "Create a 100mm by 50mm rectangle"
- "Draw a rectangle 80mm wide and 40mm tall"
- "Add a rectangle named Plate with dimensions 120mm by 60mm"

---

##### `create_polygon(sides: number, radius: number | string, name?: string)`

Create a regular polygon.

**Parameters:**
- `sides` (required): Number of sides (3-12 for triangle to dodecagon)
- `radius` (required): Radius from center to vertices. Can be numeric or string with units
- `name` (optional): Name for the polygon object

**Response format:**
```json
{
  "success": true,
  "objectName": "Polygon",
  "objectType": "Polygon",
  "sides": 6,
  "radius": "20.00mm",
  "message": "Created Polygon 'Polygon' with 6 sides and 20.00mm radius"
}
```

**Example usage:**
```typescript
// Create a hexagon with 20mm radius
{
  name: "create_polygon",
  arguments: { sides: 6, radius: 20 }
}

// Create an octagon
{
  name: "create_polygon",
  arguments: { sides: 8, radius: "15mm", name: "OctagonPart" }
}
```

**Natural language examples:**
- "Create a hexagon with 20mm radius"
- "Draw an octagon"
- "Add a pentagon (5 sides) with 25mm radius"

---

##### `create_bspline(points: Array<{x: number, y: number, z?: number}>, name?: string)`

Create a B-spline curve through specified points.

**Parameters:**
- `points` (required): Array of 3D points [{x, y, z}, ...] - minimum 2 points
- `name` (optional): Name for the BSpline object

**Response format:**
```json
{
  "success": true,
  "objectName": "BSpline",
  "objectType": "BSpline",
  "pointCount": 3,
  "message": "Created BSpline 'BSpline' through 3 points"
}
```

**Example usage:**
```typescript
// Create a B-spline through three points
{
  name: "create_bspline",
  arguments: {
    points: [
      {x: 0, y: 0, z: 0},
      {x: 50, y: 80, z: 0},
      {x: 100, y: 0, z: 0}
    ]
  }
}

// Create a named B-spline
{
  name: "create_bspline",
  arguments: {
    points: [
      {x: 0, y: 0},
      {x: 25, y: 50},
      {x: 50, y: 25},
      {x: 75, y: 75},
      {x: 100, y: 50}
    ],
    name: "CurveA"
  }
}
```

**Natural language examples:**
- "Create a B-spline through these points"
- "Draw a smooth curve through (0,0), (50,80), (100,0)"
- "Add a B-spline named CurveA through five control points"

---

##### `create_bezier(points: Array<{x: number, y: number, z?: number}>, name?: string)`

Create a Bezier curve through control points.

**Parameters:**
- `points` (required): Array of 3D control points [{x, y, z}, ...] - minimum 2 points
- `name` (optional): Name for the Bezier object

**Response format:**
```json
{
  "success": true,
  "objectName": "Bezier",
  "objectType": "BezierCurve",
  "pointCount": 4,
  "message": "Created BezierCurve 'Bezier' with 4 control points"
}
```

**Example usage:**
```typescript
// Create a Bezier curve with 4 control points
{
  name: "create_bezier",
  arguments: {
    points: [
      {x: 0, y: 0, z: 0},
      {x: 20, y: 100, z: 0},
      {x: 80, y: 100, z: 0},
      {x: 100, y: 0, z: 0}
    ]
  }
}

// Create a named Bezier
{
  name: "create_bezier",
  arguments: {
    points: [{x: 0, y: 0}, {x: 30, y: 60}, {x: 70, y: 40}, {x: 100, y: 80}],
    name: "BezierCurve"
  }
}
```

**Natural language examples:**
- "Create a Bezier curve"
- "Draw a smooth curve through these control points"
- "Add a Bezier curve named Curve1 with four points"

---

##### `create_wire(points: Array<{x: number, y: number, z?: number}>, closed?: boolean, name?: string)`

Create a polyline/wire (connected line segments) from a series of points.

**Parameters:**
- `points` (required): Array of 3D points [{x, y, z}, ...] - minimum 2 points
- `closed` (optional): Whether to close the wire (connect last to first). Default: false
- `name` (optional): Name for the wire object

**Response format:**
```json
{
  "success": true,
  "objectName": "Wire",
  "objectType": "Wire",
  "pointCount": 4,
  "closed": false,
  "message": "Created Wire 'Wire' with 4 points"
}
```

**Example usage:**
```typescript
// Create an open polyline
{
  name: "create_wire",
  arguments: {
    points: [
      {x: 0, y: 0, z: 0},
      {x: 50, y: 0, z: 0},
      {x: 50, y: 50, z: 0},
      {x: 100, y: 50, z: 0}
    ]
  }
}

// Create a closed shape (rectangle)
{
  name: "create_wire",
  arguments: {
    points: [
      {x: 0, y: 0, z: 0},
      {x: 100, y: 0, z: 0},
      {x: 100, y: 100, z: 0},
      {x: 0, y: 100, z: 0}
    ],
    closed: true,
    name: "RectangleOutline"
  }
}
```

**Natural language examples:**
- "Create a wire through these points"
- "Draw a polyline from (0,0) to (50,0) to (50,50)"
- "Create a closed rectangle outline"

---

#### Dimension and Annotation Tools

##### `create_linear_dimension(startX: number, startY: number, startZ: number, endX: number, endY: number, endZ: number, offset?: number | string, name?: string)`

Create a linear dimension between two points.

**Parameters:**
- `startX`, `startY`, `startZ` (required): Start point coordinates in mm
- `endX`, `endY`, `endZ` (required): End point coordinates in mm
- `offset` (optional): Offset distance from the measured line. Can be numeric or string with units
- `name` (optional): Name for the dimension object

**Response format:**
```json
{
  "success": true,
  "objectName": "Dimension",
  "objectType": "LinearDimension",
  "measurement": "100.00mm",
  "startPoint": {"x": 0, "y": 0, "z": 0},
  "endPoint": {"x": 100, "y": 0, "z": 0},
  "offset": "5.00mm",
  "message": "Created LinearDimension 'Dimension': 100.00mm"
}
```

**Example usage:**
```typescript
// Create a 100mm dimension
{
  name: "create_linear_dimension",
  arguments: { startX: 0, startY: 0, startZ: 0, endX: 100, endY: 0, endZ: 0 }
}

// Create a dimension with offset
{
  name: "create_linear_dimension",
  arguments: { startX: 0, startY: 0, startZ: 0, endX: 50, endY: 0, endZ: 0, offset: 10, name: "WidthDim" }
}
```

**Natural language examples:**
- "Add a dimension from (0,0,0) to (100,0,0)"
- "Dimension this edge"
- "Add a 50mm dimension with 5mm offset"

---

##### `create_radial_dimension(objectName: string, name?: string)`

Create a radial dimension (radius) for a circle or arc.

**Parameters:**
- `objectName` (required): Name of the circle or arc object to dimension
- `name` (optional): Name for the dimension object

**Response format:**
```json
{
  "success": true,
  "objectName": "Dimension",
  "objectType": "RadiusDimension",
  "targetObject": "Circle",
  "measurement": "10.00mm",
  "message": "Created RadiusDimension 'Dimension' for 'Circle': 10.00mm"
}
```

**Example usage:**
```typescript
// Add radius dimension to a circle
{
  name: "create_radial_dimension",
  arguments: { objectName: "Circle" }
}

// Add named radius dimension
{
  name: "create_radial_dimension",
  arguments: { objectName: "Hole", name: "HoleRadiusDim" }
}
```

**Natural language examples:**
- "Add a radius dimension to this circle"
- "Dimension the arc"
- "Show the radius of Circle as a dimension"

---

##### `create_angular_dimension(objectName1: string, objectName2: string, name?: string)`

Create an angular dimension between two lines.

**Parameters:**
- `objectName1` (required): Name of first line object
- `objectName2` (required): Name of second line object
- `name` (optional): Name for the dimension object

**Response format:**
```json
{
  "success": true,
  "objectName": "Dimension",
  "objectType": "AngularDimension",
  "line1": "Line1",
  "line2": "Line2",
  "measurement": "45.00deg",
  "message": "Created AngularDimension 'Dimension' between 'Line1' and 'Line2': 45.00deg"
}
```

**Example usage:**
```typescript
// Create angular dimension between two lines
{
  name: "create_angular_dimension",
  arguments: { objectName1: "Line1", objectName2: "Line2" }
}

// Create named angular dimension
{
  name: "create_angular_dimension",
  arguments: { objectName1: "EdgeA", objectName2: "EdgeB", name: "AngleDim" }
}
```

**Natural language examples:**
- "Add an angle dimension between these lines"
- "Show the angle between Line1 and Line2"
- "Create an angular dimension for the corner"

---

##### `create_text(text: string, x: number, y: number, z?: number, name?: string)`

Create a text annotation at a specified position.

**Parameters:**
- `text` (required): Text content to display
- `x`, `y`, `z` (required): Position coordinates in mm (z defaults to 0)
- `name` (optional): Name for the text object

**Response format:**
```json
{
  "success": true,
  "objectName": "Text",
  "objectType": "Text",
  "text": "DANGER",
  "position": {"x": 100, "y": 100, "z": 0},
  "message": "Created Text 'Text' at (100, 100, 0): 'DANGER'"
}
```

**Example usage:**
```typescript
// Create a warning text
{
  name: "create_text",
  arguments: { text: "DANGER", x: 100, y: 100, z: 0 }
}

// Create a label
{
  name: "create_text",
  arguments: { text: "MAX 50mm", x: 50, y: 50, z: 0, name: "MaxLabel" }
}

// Create multiline text
{
  name: "create_text",
  arguments: { text: "Part A\nRevision 1", x: 0, y: 0, z: 0, name: "TitleBlock" }
}
```

**Natural language examples:**
- "Add text 'DANGER' at (100, 100)"
- "Create a label 'MAX 50mm' at the center"
- "Add title block text at the origin"

---

#### Modification Tools

##### `move_object(objectNames: string[], deltaX: number, deltaY: number, deltaZ: number)`

Move one or more objects by a translation vector.

**Parameters:**
- `objectNames` (required): Array of object names to move
- `deltaX`, `deltaY`, `deltaZ` (required): Translation vector components in mm

**Response format:**
```json
{
  "success": true,
  "objectNames": ["Circle", "Rectangle"],
  "delta": {"x": 10, "y": 20, "z": 0},
  "message": "Moved 2 objects by (10, 20, 0)"
}
```

**Example usage:**
```typescript
// Move a single object
{
  name: "move_object",
  arguments: { objectNames: ["Circle"], deltaX: 50, deltaY: 0, deltaZ: 0 }
}

// Move multiple objects
{
  name: "move_object",
  arguments: { objectNames: ["Box", "Cylinder"], deltaX: 10, deltaY: 10, deltaZ: 5 }
}
```

**Natural language examples:**
- "Move this 10mm to the right"
- "Move the circle 50mm in the X direction"
- "Translate these objects by (10, 20, 0)"

---

##### `rotate_object(objectNames: string[], angle: number | string, centerX?: number, centerY?: number, centerZ?: number)`

Rotate one or more objects around a center point.

**Parameters:**
- `objectNames` (required): Array of object names to rotate
- `angle` (required): Rotation angle. Can be numeric (radians) or string with units ("45deg")
- `centerX`, `centerY`, `centerZ` (optional): Center of rotation coordinates (default: object's current position)

**Response format:**
```json
{
  "success": true,
  "objectNames": ["Rectangle"],
  "angle": "45.00deg",
  "center": {"x": 0, "y": 0, "z": 0},
  "message": "Rotated 'Rectangle' by 45.00deg around (0, 0, 0)"
}
```

**Example usage:**
```typescript
// Rotate 45 degrees around origin
{
  name: "rotate_object",
  arguments: { objectNames: ["Rectangle"], angle: "45deg", centerX: 0, centerY: 0, centerZ: 0 }
}

// Rotate 90 degrees
{
  name: "rotate_object",
  arguments: { objectNames: ["Circle"], angle: 1.5708 }  // radians
}

// Rotate multiple objects
{
  name: "rotate_object",
  arguments: { objectNames: ["Line1", "Line2"], angle: "90deg", centerX: 0, centerY: 0, centerZ: 0 }
}
```

**Natural language examples:**
- "Rotate 45 degrees"
- "Rotate around (0, 0, 0)"
- "Rotate the rectangle 90 degrees around its center"

---

##### `scale_object(objectNames: string[], scale: number | string, centerX?: number, centerY?: number, centerZ?: number)`

Scale one or more objects uniformly from a center point.

**Parameters:**
- `objectNames` (required): Array of object names to scale
- `scale` (required): Scale factor (e.g., 2.0 for 2x size, 0.5 for half size)
- `centerX`, `centerY`, `centerZ` (optional): Center of scaling coordinates (default: object's current position)

**Response format:**
```json
{
  "success": true,
  "objectNames": ["Rectangle"],
  "scaleFactor": 2,
  "center": {"x": 0, "y": 0, "z": 0},
  "message": "Scaled 'Rectangle' by factor 2 around (0, 0, 0)"
}
```

**Example usage:**
```typescript
// Scale by 2x
{
  name: "scale_object",
  arguments: { objectNames: ["Circle"], scale: 2 }
}

// Scale to half size around specific center
{
  name: "scale_object",
  arguments: { objectNames: ["Rectangle"], scale: 0.5, centerX: 0, centerY: 0, centerZ: 0 }
}
```

**Natural language examples:**
- "Scale by 2"
- "Make this twice as big"
- "Scale the rectangle to half size"

---

##### `offset_object(objectName: string, distance: number | string)`

Create an offset copy of a draft object at a specified distance.

**Parameters:**
- `objectName` (required): Name of the object to offset
- `distance` (required): Offset distance. Can be numeric or string with units (positive = outward/right, negative = inward/left)

**Response format:**
```json
{
  "success": true,
  "originalName": "Line",
  "newObjectName": "Line_Offset",
  "distance": "10.00mm",
  "message": "Created offset of 'Line' by 10.00mm"
}
```

**Example usage:**
```typescript
// Offset a line by 10mm
{
  name: "offset_object",
  arguments: { objectName: "Line", distance: 10 }
}

// Offset with units
{
  name: "offset_object",
  arguments: { objectName: "Rectangle", distance: "5mm" }
}
```

**Natural language examples:**
- "Offset this by 5mm"
- "Create a parallel line 10mm away"
- "Offset the rectangle inward by 3mm"

---

##### `join_objects(objectNames: string[])`

Join multiple draft objects into a single polyline or compound.

**Parameters:**
- `objectNames` (required): Array of object names to join (lines, arcs, etc.)

**Response format:**
```json
{
  "success": true,
  "originalNames": ["Line1", "Line2", "Arc1"],
  "newObjectName": "Polyline",
  "objectType": "Polyline",
  "message": "Joined 3 objects into 'Polyline'"
}
```

**Example usage:**
```typescript
// Join two lines
{
  name: "join_objects",
  arguments: { objectNames: ["Line1", "Line2"] }
}

// Join multiple objects
{
  name: "join_objects",
  arguments: { objectNames: ["Line1", "Line2", "Arc1", "Line3"] }
}
```

**Natural language examples:**
- "Join these lines"
- "Merge these shapes into one"
- "Connect the line and arc into a polyline"

---

##### `split_object(objectName: string, points: Array<{x: number, y: number, z?: number}>)`

Split a draft object at specified points.

**Parameters:**
- `objectName` (required): Name of the object to split
- `points` (required): Array of 3D points [{x, y, z}, ...] where splits occur

**Response format:**
```json
{
  "success": true,
  "originalName": "Line",
  "newObjectNames": ["Line001", "Line002", "Line003"],
  "splitCount": 2,
  "message": "Split 'Line' into 3 objects at 2 points"
}
```

**Example usage:**
```typescript
// Split a line at one point
{
  name: "split_object",
  arguments: { objectName: "Line", points: [{x: 50, y: 0, z: 0}] }
}

// Split at multiple points
{
  name: "split_object",
  arguments: { objectName: "Polyline", points: [{x: 25, y: 0, z: 0}, {x: 75, y: 0, z: 0}] }
}
```

**Natural language examples:**
- "Split this line at this point"
- "Break this into two pieces"
- "Divide the polyline at the midpoint"

---

#### Draft Query Tools

##### `list_draft_objects()`

List all Draft objects in the current document.

**Parameters:** None

**Response format:**
```json
{
  "success": true,
  "objects": [
    { "name": "Point", "type": "Point", "layer": null, "visible": true },
    { "name": "Line", "type": "Line", "layer": null, "visible": true },
    { "name": "Circle", "type": "Circle", "layer": null, "visible": true }
  ],
  "objectCount": 3,
  "message": "Found 3 draft object(s)"
}
```

**Example usage:**
```typescript
{
  name: "list_draft_objects",
  arguments: {}
}
```

**Natural language examples:**
- "Show all draft objects"
- "What geometry have I created?"
- "List all Draft workbench objects"

---

##### `get_working_plane()`

Get the current Draft working plane configuration.

**Parameters:** None

**Response format:**
```json
{
  "success": true,
  "plane": "XY",
  "position": {"x": 0, "y": 0, "z": 0},
  "normal": {"x": 0, "y": 0, "z": 1},
  "offset": 0,
  "message": "Working plane is XY at offset 0"
}
```

**Example usage:**
```typescript
{
  name: "get_working_plane",
  arguments: {}
}
```

**Natural language examples:**
- "What's the current working plane?"
- "Show me the current Draft plane"
- "What plane am I working on?"

---

##### `set_working_plane(plane: "XY" | "XZ" | "YZ", offset?: number | string)`

Set the Draft working plane.

**Parameters:**
- `plane` (required): Plane identifier - "XY" (horizontal), "XZ" (vertical front/back), "YZ" (vertical side)
- `offset` (optional): Offset distance from the plane. Can be numeric or string with units

**Response format:**
```json
{
  "success": true,
  "plane": "XZ",
  "offset": "5.00mm",
  "message": "Working plane set to XZ at offset 5.00mm"
}
```

**Example usage:**
```typescript
// Set to XY plane (horizontal)
{
  name: "set_working_plane",
  arguments: { plane: "XY" }
}

// Set to XZ plane with offset
{
  name: "set_working_plane",
  arguments: { plane: "XZ", offset: 10 }
}

// Set to YZ plane
{
  name: "set_working_plane",
  arguments: { plane: "YZ" }
}
```

**Natural language examples:**
- "Set working plane to XZ"
- "Switch to XY plane"
- "Set working plane to XY with 5mm offset"

---

#### Geometry Types Reference

| Type | Description | Parameters | Natural Language Example |
|------|-------------|------------|-------------------------|
| `Point` | Single point in 3D space | x, y, z | "Create a point at (10, 20)" |
| `Line` | Straight line segment | startX, startY, startZ, endX, endY, endZ | "Draw a line from (0,0) to (100,0)" |
| `Circle` | Full circle | centerX, centerY, centerZ, radius | "Create a 10mm radius circle at origin" |
| `Arc` | Circular arc | centerX, centerY, centerZ, radius, startAngle, endAngle | "Create a 90 degree arc" |
| `Ellipse` | Ellipse | centerX, centerY, centerZ, majorRadius, minorRadius | "Create an ellipse 50mm by 30mm" |
| `Rectangle` | Rectangle | width, height | "Create a 100mm by 50mm rectangle" |
| `Polygon` | Regular polygon (3-12 sides) | sides, radius | "Create a hexagon with 20mm radius" |
| `BSpline` | B-spline curve | points array | "Create a B-spline through these points" |
| `BezierCurve` | Bezier curve | points array | "Create a Bezier curve" |

---

#### Dimension Types Reference

| Type | Description | Parameters | Natural Language Example |
|------|-------------|------------|-------------------------|
| `LinearDimension` | Distance between two points | startX, startY, startZ, endX, endY, endZ | "Add a dimension from A to B" |
| `RadiusDimension` | Radius of circle/arc | objectName | "Add radius dimension to this circle" |
| `AngularDimension` | Angle between two lines | objectName1, objectName2 | "Show angle between these lines" |
| `Text` | Text annotation | text, x, y, z | "Add text 'DANGER' at (100,100)" |

---

#### Common Drafting Workflows

**Workflow 1: Simple 2D Drawing**

```
1. Set working plane: set_working_plane({ plane: "XY" })
2. Create geometry: create_rectangle({ width: 100, height: 50 })
3. Add dimensions: create_linear_dimension({ startX: 0, startY: 0, startZ: 0, endX: 100, endY: 0, endZ: 0 })
4. Add text labels: create_text({ text: "Front View", x: 50, y: -10 })
```

**Workflow 2: Technical Drawing with Multiple Views**

```
1. Set working plane to XY (top view)
2. Create main rectangle for front view
3. Create linear dimensions for width and height
4. Set working plane to XZ (side view)
5. Create geometry aligned to side view
6. Add dimensions for depth
7. Set working plane to YZ (front view)  
8. Add text annotations for labels
```

**Workflow 3: Parametric Dimensioned Drawing**

```
1. Create baseline geometry (lines, circles)
2. Add radial dimensions to circles: create_radial_dimension({ objectName: "Circle" })
3. Add linear dimensions: create_linear_dimension({ startX: 0, startY: 0, endX: 100, endY: 0 })
4. Modify geometry with move_object or rotate_object
5. Dimensions update parametrically
```

**Workflow 4: Complex Curve Creation**

```
1. Define control points for B-spline: create_bspline({ points: [...] })
2. Adjust curve by adding/moving points
3. Create offset copies: offset_object({ objectName: "BSpline", distance: 10 })
4. Join related curves: join_objects({ objectNames: ["BSpline", "BSpline_Offset"] })
```

**Workflow 5: Layout and Assembly Drawing**

```
1. Set working plane to XY
2. Create title block rectangle at origin
3. Add text for company name, part number, revision
4. Create view frames: create_rectangle({ width: 200, height: 150 })
5. Add part geometry in each view
6. Add dimensions and annotations
7. List all draft objects to verify completeness
```

---

### TechDraw Workbench Tools

The TechDraw workbench tools allow you to create 2D drawing pages from 3D models, add dimensions, annotations, and export technical drawings for manufacturing or documentation.

**TechDraw Overview:**

TechDraw is FreeCAD's dedicated workbench for generating 2D drawings from 3D models. It supports multiple projection types (Third Angle and First Angle), standard paper sizes, and parametric views that update when the source 3D model changes.

**Drawing Workflow (3D Model → 2D Drawing):**

```
1. 3D Model (Part/PartDesign) → Create drawing page with template
2. Create projection views (front, top, side, isometric, section)
3. Add dimensions (linear, radial, diameter, angular)
4. Add annotations (text, balloons, symbols)
5. Export to SVG/PDF for distribution
```

**View Types Reference:**

| View Type | Description | Use Case |
|-----------|-------------|----------|
| Front View | Primary elevation view | Main detail specification |
| Top View | Plan view from above | Floor plans, top-down layouts |
| Side View | Left or right elevation | Width/depth specifications |
| Isometric View | 3D representation at 30° | Visual documentation |
| Section View | Cut-through view | Internal features |
| Detail View | Enlarged portion | Showing fine details |
| Projection Group | Multiple views arranged | Standard 3-view drawings |

**Export Formats:**

| Format | Description | Best For |
|--------|-------------|----------|
| SVG | Scalable Vector Graphics | Web, printable documents |
| PDF | Portable Document Format | Manufacturing, archival |

---

#### Page Management Tools

##### `create_drawing_page(template?: string, paperSize?: string)`

Create a new TechDraw page with a standard template.

**Parameters:**
- `template` (optional): Template name. Default: "A4_Landscape". Options: "A4_Landscape", "A4_Portrait", "A3_Landscape", "A3_Portrait", "Letter_Landscape", "Letter_Portrait"
- `paperSize` (optional): Paper size override. Format: "A4", "A3", "Letter", etc.

**Response format:**
```json
{
  "success": true,
  "pageName": "Page",
  "template": "A4_Landscape",
  "paperSize": "A4",
  "message": "Created TechDraw page 'Page' with A4_Landscape template"
}
```

**Example usage:**
```typescript
{
  name: "create_drawing_page",
  arguments: {}
}

// Create A3 landscape page
{
  name: "create_drawing_page",
  arguments: {
    template: "A3_Landscape"
  }
}
```

**Natural language examples:**
- "Create a new drawing page"
- "Start a new A4 landscape drawing"
- "Create an A3 page for the drawing"

---

##### `list_drawing_pages()`

List all TechDraw pages in the current document.

**Parameters:** None

**Response format:**
```json
{
  "success": true,
  "pages": [
    {
      "name": "Page",
      "template": "A4_Landscape",
      "viewCount": 3
    },
    {
      "name": "Page001",
      "template": "A3_Landscape",
      "viewCount": 1
    }
  ],
  "pageCount": 2,
  "message": "Found 2 TechDraw page(s)"
}
```

**Example usage:**
```typescript
{
  name: "list_drawing_pages",
  arguments: {}
}
```

**Natural language examples:**
- "Show all drawing pages"
- "What pages do I have?"
- "List all TechDraw pages"

---

##### `delete_drawing_page(pageName: string)`

Delete a TechDraw page.

**Parameters:**
- `pageName` (required): Name of the page to delete

**Response format:**
```json
{
  "success": true,
  "pageName": "Page",
  "message": "Deleted TechDraw page 'Page'"
}
```

**Example usage:**
```typescript
{
  name: "delete_drawing_page",
  arguments: {
    pageName: "Page"
  }
}
```

**Natural language examples:**
- "Delete the drawing page"
- "Remove this page"
- "Delete Page001"

---

#### View Creation Tools

##### `create_standard_view(sourceObject: string, viewName?: string, projectionType?: "Third" | "First")`

Create a standard projection view of a 3D object.

**Parameters:**
- `sourceObject` (required): Name of the 3D object to project
- `viewName` (optional): Name for the view. If omitted, auto-generated
- `projectionType` (optional): Projection standard - "Third" (Third Angle, default) or "First" (First Angle)

**Response format:**
```json
{
  "success": true,
  "viewName": "View",
  "sourceObject": "Body",
  "projectionType": "Third",
  "position": {"x": 100, "y": 100},
  "message": "Created projection view of 'Body' (Third Angle)"
}
```

**Example usage:**
```typescript
{
  name: "create_standard_view",
  arguments: {
    sourceObject: "Body"
  }
}

// First angle projection
{
  name: "create_standard_view",
  arguments: {
    sourceObject: "Part",
    projectionType: "First"
  }
}
```

**Natural language examples:**
- "Add a front view of this part"
- "Create a third-angle projection of the body"
- "Project the assembly using first angle notation"

**Notes:**
- Third Angle projection: Left view is left, top view is top (US standard)
- First Angle projection: Left view is right, top view is top (European standard)

---

##### `create_isometric_view(sourceObject: string, viewName?: string)`

Create an isometric (3D representation) view of an object.

**Parameters:**
- `sourceObject` (required): Name of the 3D object
- `viewName` (optional): Name for the view. If omitted, auto-generated

**Response format:**
```json
{
  "success": true,
  "viewName": "IsoView",
  "sourceObject": "Body",
  "message": "Created isometric view of 'Body'"
}
```

**Example usage:**
```typescript
{
  name: "create_isometric_view",
  arguments: {
    sourceObject: "Body"
  }
}

// Named isometric view
{
  name: "create_isometric_view",
  arguments: {
    sourceObject: "Assembly",
    viewName: "MainIso"
  }
}
```

**Natural language examples:**
- "Create an isometric view"
- "Show me an isometric of this part"
- "Add an isometric view to the drawing"

---

##### `create_top_view(sourceObject: string, viewName?: string)`

Create a top (plan) view - looking down from above.

**Parameters:**
- `sourceObject` (required): Name of the 3D object
- `viewName` (optional): Name for the view

**Response format:**
```json
{
  "success": true,
  "viewName": "TopView",
  "sourceObject": "Body",
  "message": "Created top view of 'Body'"
}
```

**Example usage:**
```typescript
{
  name: "create_top_view",
  arguments: {
    sourceObject: "Body"
  }
}
```

**Natural language examples:**
- "Add a top view"
- "Create a plan view from above"
- "Show the top orthographic projection"

---

##### `create_front_view(sourceObject: string, viewName?: string)`

Create a front view - looking at the front face.

**Parameters:**
- `sourceObject` (required): Name of the 3D object
- `viewName` (optional): Name for the view

**Response format:**
```json
{
  "success": true,
  "viewName": "FrontView",
  "sourceObject": "Body",
  "message": "Created front view of 'Body'"
}
```

**Example usage:**
```typescript
{
  name: "create_front_view",
  arguments: {
    sourceObject: "Body"
  }
}
```

**Natural language examples:**
- "Add a front view"
- "Create elevation from front"
- "Show the front elevation"

---

##### `create_side_view(sourceObject: string, side: "Left" | "Right", viewName?: string)`

Create a left or right side view.

**Parameters:**
- `sourceObject` (required): Name of the 3D object
- `side` (required): "Left" or "Right"
- `viewName` (optional): Name for the view

**Response format:**
```json
{
  "success": true,
  "viewName": "RightSideView",
  "sourceObject": "Body",
  "side": "Right",
  "message": "Created right side view of 'Body'"
}
```

**Example usage:**
```typescript
{
  name: "create_side_view",
  arguments: {
    sourceObject: "Body",
    side: "Right"
  }
}

// Left side view
{
  name: "create_side_view",
  arguments: {
    sourceObject: "Body",
    side: "Left",
    viewName: "LeftSide"
  }
}
```

**Natural language examples:**
- "Add a right side view"
- "Create a left elevation"
- "Show the left side orthographic projection"

---

##### `create_section_view(sourceObject: string, cutLine: {start: {x: number, y: number}, end: {x: number, y: number}}, viewName?: string)`

Create a section (cut-through) view showing internal features.

**Parameters:**
- `sourceObject` (required): Name of the 3D object
- `cutLine` (required): Start and end points of the cut line as JSON `{start: {x, y}, end: {x, y}}`
- `viewName` (optional): Name for the view

**Response format:**
```json
{
  "success": true,
  "viewName": "SectionView",
  "sourceObject": "Body",
  "cutLine": {"start": {"x": 0, "y": 50}, "end": {"x": 100, "y": 50}},
  "message": "Created section view of 'Body'"
}
```

**Example usage:**
```typescript
{
  name: "create_section_view",
  arguments: {
    sourceObject: "Body",
    cutLine: {
      start: {x: 0, y: 50},
      end: {x: 100, y: 50}
    }
  }
}
```

**Natural language examples:**
- "Create a cross-section view"
- "Section through the middle horizontally"
- "Show a vertical cut through the center"

**Notes:**
- Section views reveal internal structure
- Hatch patterns are applied to cut surfaces automatically

---

##### `create_projection_group(sourceObject: string, views: string[], viewName?: string)`

Create a projection group with multiple related views.

**Parameters:**
- `sourceObject` (required): Name of the 3D object
- `views` (required): Array of view types to include, e.g., `["Front", "Top", "RightSide"]`
- `viewName` (optional): Name for the projection group

**Response format:**
```json
{
  "success": true,
  "groupName": "ProjectionGroup",
  "views": ["Front", "Top", "RightSide"],
  "sourceObject": "Body",
  "message": "Created projection group with 3 views"
}
```

**Example usage:**
```typescript
{
  name: "create_projection_group",
  arguments: {
    sourceObject: "Body",
    views: ["Front", "Top", "RightSide"]
  }
}

// Include isometric
{
  name: "create_projection_group",
  arguments: {
    sourceObject: "Assembly",
    views: ["Front", "Top", "RightSide", "Isometric"]
  }
}
```

**Natural language examples:**
- "Create front, top, and side views"
- "Add standard three-view projection"
- "Generate a complete projection group with isometric"

---

#### Dimension Tools

##### `add_linear_dimension(pageName: string, viewName: string, startPoint: {x: number, y: number}, endPoint: {x: number, y: number})`

Add a linear (aligned) dimension between two points in a view.

**Parameters:**
- `pageName` (required): Name of the TechDraw page
- `viewName` (required): Name of the view to dimension
- `startPoint` (required): Start point as `{x, y}` coordinates in the view
- `endPoint` (required): End point as `{x, y}` coordinates in the view

**Response format:**
```json
{
  "success": true,
  "dimensionName": "LinearDimension",
  "measurement": "50.00mm",
  "startPoint": {"x": 10, "y": 20},
  "endPoint": {"x": 60, "y": 20},
  "message": "Added LinearDimension: 50.00mm"
}
```

**Example usage:**
```typescript
{
  name: "add_linear_dimension",
  arguments: {
    pageName: "Page",
    viewName: "FrontView",
    startPoint: {"x": 10, "y": 20},
    endPoint: {"x": 60, "y": 20}
  }
}
```

**Natural language examples:**
- "Add a dimension from point (10, 20) to (60, 20)"
- "Dimension this edge"
- "Add a 50mm dimension between these points"

---

##### `add_radial_dimension(pageName: string, viewName: string, circleName: string)`

Add a radial (radius) dimension to a circle in a view.

**Parameters:**
- `pageName` (required): Name of the TechDraw page
- `viewName` (required): Name of the view containing the circle
- `circleName` (required): Name of the circle object in the 3D model

**Response format:**
```json
{
  "success": true,
  "dimensionName": "RadiusDimension",
  "measurement": "10.00mm",
  "circleName": "Hole",
  "message": "Added RadiusDimension: 10.00mm"
}
```

**Example usage:**
```typescript
{
  name: "add_radial_dimension",
  arguments: {
    pageName: "Page",
    viewName: "TopView",
    circleName: "Hole"
  }
}
```

**Natural language examples:**
- "Add radius dimension to this circle"
- "Show the diameter as a radius"
- "Dimension the hole with radius R"

---

##### `add_diameter_dimension(pageName: string, viewName: string, circleName: string)`

Add a diameter dimension to a circle in a view.

**Parameters:**
- `pageName` (required): Name of the TechDraw page
- `viewName` (required): Name of the view containing the circle
- `circleName` (required): Name of the circle object

**Response format:**
```json
{
  "success": true,
  "dimensionName": "DiameterDimension",
  "measurement": "20.00mm",
  "circleName": "Hole",
  "message": "Added DiameterDimension: 20.00mm"
}
```

**Example usage:**
```typescript
{
  name: "add_diameter_dimension",
  arguments: {
    pageName: "Page",
    viewName: "TopView",
    circleName: "Hole"
  }
}
```

**Natural language examples:**
- "Add diameter dimension to this circle"
- "Show this as diameter not radius"
- "Add a Ø20mm diameter callout"

---

##### `add_angular_dimension(pageName: string, viewName: string, line1Name: string, line2Name: string)`

Add an angular dimension between two lines in a view.

**Parameters:**
- `pageName` (required): Name of the TechDraw page
- `viewName` (required): Name of the view
- `line1Name` (required): Name of first line object in 3D model
- `line2Name` (required): Name of second line object in 3D model

**Response format:**
```json
{
  "success": true,
  "dimensionName": "AngularDimension",
  "measurement": "45.00deg",
  "line1Name": "Line1",
  "line2Name": "Line2",
  "message": "Added AngularDimension: 45.00deg"
}
```

**Example usage:**
```typescript
{
  name: "add_angular_dimension",
  arguments: {
    pageName: "Page",
    viewName: "FrontView",
    line1Name: "Line1",
    line2Name: "Line2"
  }
}
```

**Natural language examples:**
- "Add angle between these lines"
- "Show this angle as 45 degrees"
- "Dimension the corner angle"

---

#### Annotation Tools

##### `add_text_annotation(pageName: string, text: string, x: number, y: number)`

Add a text annotation to a TechDraw page.

**Parameters:**
- `pageName` (required): Name of the TechDraw page
- `text` (required): Text content to display
- `x` (required): X coordinate position on the page
- `y` (required): Y coordinate position on the page

**Response format:**
```json
{
  "success": true,
  "textName": "Text",
  "text": "PART-A",
  "position": {"x": 20, "y": 50},
  "message": "Added text 'PART-A' at (20, 50)"
}
```

**Example usage:**
```typescript
{
  name: "add_text_annotation",
  arguments: {
    pageName: "Page",
    text: "PART-A",
    x: 20,
    y: 50
  }
}

// Title block text
{
  name: "add_text_annotation",
  arguments: {
    pageName: "Page",
    text: "DRAWING TITLE",
    x: 100,
    y: 280,
    name: "Title"
  }
}
```

**Natural language examples:**
- "Add title 'Part A' here"
- "Label this view"
- "Add revision text to the title block"

---

##### `add_balloon(pageName: string, viewName: string, targetPoint: {x: number, y: number}, text?: string)`

Add a balloon annotation (circled number) to identify components.

**Parameters:**
- `pageName` (required): Name of the TechDraw page
- `viewName` (required): Name of the view
- `targetPoint` (required): Target point as `{x, y}` coordinates in the view
- `text` (optional): Balloon text/number. If omitted, auto-increments

**Response format:**
```json
{
  "success": true,
  "balloonName": "Balloon",
  "text": "1",
  "targetPoint": {"x": 50, "y": 50},
  "message": "Added balloon '1' at (50, 50)"
}
```

**Example usage:**
```typescript
{
  name: "add_balloon",
  arguments: {
    pageName: "Page",
    viewName: "IsoView",
    targetPoint: {"x": 50, "y": 50}
  }
}

// Balloon with custom text
{
  name: "add_balloon",
  arguments: {
    pageName: "Page",
    viewName: "IsoView",
    targetPoint: {"x": 50, "y": 50},
    text: "A"
  }
}
```

**Natural language examples:**
- "Add balloon to this component"
- "Number this part"
- "Add balloon with text 'A' to the main body"

---

#### Export Tools

##### `export_to_svg(pageName: string, outputPath: string)`

Export a TechDraw page to SVG format.

**Parameters:**
- `pageName` (required): Name of the TechDraw page to export
- `outputPath` (required): Full path for the output SVG file

**Response format:**
```json
{
  "success": true,
  "pageName": "Page",
  "outputPath": "C:/Drawings/part.svg",
  "message": "Exported 'Page' to C:/Drawings/part.svg"
}
```

**Example usage:**
```typescript
{
  name: "export_to_svg",
  arguments: {
    pageName: "Page",
    outputPath: "C:/Drawings/part.svg"
  }
}
```

**Natural language examples:**
- "Export to SVG"
- "Save as vector drawing"
- "Export the drawing to SVG format"

**Notes:**
- SVG is scalable vector format, ideal for web or print
- All views and dimensions are preserved

---

##### `export_to_pdf(pageName: string, outputPath: string)`

Export a TechDraw page to PDF format.

**Parameters:**
- `pageName` (required): Name of the TechDraw page to export
- `outputPath` (required): Full path for the output PDF file

**Response format:**
```json
{
  "success": true,
  "pageName": "Page",
  "outputPath": "C:/Drawings/part.pdf",
  "message": "Exported 'Page' to C:/Drawings/part.pdf"
}
```

**Example usage:**
```typescript
{
  name: "export_to_pdf",
  arguments: {
    pageName: "Page",
    outputPath: "C:/Drawings/part.pdf"
  }
}
```

**Natural language examples:**
- "Export to PDF"
- "Generate PDF of drawing"
- "Save the drawing as PDF"

**Notes:**
- PDF is ideal for printing and archival
- Standard format for manufacturing documentation

---

#### Common TechDraw Workflows

**Workflow 1: Basic Part Drawing**

```
1. Create drawing page: create_drawing_page({ template: "A4_Landscape" })
2. Create isometric view: create_isometric_view({ sourceObject: "Body" })
3. Create front view: create_front_view({ sourceObject: "Body" })
4. Add linear dimension: add_linear_dimension({ pageName: "Page", viewName: "Front", startPoint: {x: 0, y: 0}, endPoint: {x: 50, y: 0} })
5. Export to PDF: export_to_pdf({ pageName: "Page", outputPath: "drawing.pdf" })
```

**Workflow 2: Standard Three-View Projection**

```
1. Create drawing page: create_drawing_page({})
2. Create projection group: create_projection_group({ sourceObject: "Body", views: ["Front", "Top", "RightSide"] })
3. Add dimensions to each view
4. Export to SVG: export_to_svg({ pageName: "Page", outputPath: "drawing.svg" })
```

**Workflow 3: Detailed Manufacturing Drawing**

```
1. Create page with A3 template
2. Create multiple views (isometric, front, top, side, section)
3. Add all dimensions (linear, radial, diameter, angular)
4. Add text annotations for part number, revision, tolerances
5. Add balloons for bill of materials reference
6. Export to PDF for manufacturing
```

---

### Export Tool (Legacy)

#### `export_model(filePath: string, format: string)`

Exports the current model to a file. (Use `export_to_format` for more options)

**Supported formats:** STEP, STL, OBJ, DXF, FCStd

## API

### Dock Server (WebSocket)

Connect to `ws://localhost:8765` from FreeCAD dock widget.

**Message format:**

```json
{
  "type": "chat",
  "content": "Create a box 10x10x10",
  "timestamp": 1234567890
}
```

**Response types:**
- `response` - Normal response with output
- `error` - Error message
- `status` - Status update

### FreeCAD Bridge (WebSocket)

Connects to `ws://localhost:8766` (FreeCAD Python bridge).

**Request format:**

```json
{
  "type": "execute",
  "code": "import Part; Part.makeBox(10, 10, 10)",
  "id": "unique-id"
}
```

**Response format:**

```json
{
  "type": "result",
  "output": "Box created successfully",
  "success": true
}
```

## Development

### Build

```bash
npm run build
```

### Clean

```bash
npm run clean
```

### Type checking

```bash
npx tsc --noEmit
```

## Troubleshooting

### Connection refused to FreeCAD bridge

Ensure FreeCAD is running and the LLMBridge module is loaded. The Python WebSocket server should be listening on port 8766.

### Claude Agent SDK not connecting

Verify `ANTHROPIC_API_KEY` is set correctly in your environment.

### Port already in use

Change the port via environment variables:
```bash
export DOCK_SERVER_PORT=8767
npm run dev
```

## License

MIT
