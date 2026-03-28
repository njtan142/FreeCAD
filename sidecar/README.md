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

#### `create_sketch(plane?: string, faceName?: string)`

Create a new sketch on a specified plane or face.

**Parameters:**
- `plane` (optional): Plane to create sketch on. Options: `"XY"`, `"XZ"`, `"YZ"`, or custom plane object name. Default: `"XY"`
- `faceName` (optional): Name of a face to attach the sketch to. If provided, `plane` is ignored.

**Response format:**
```json
{
  "success": true,
  "sketchName": "Sketch",
  "sketchLabel": "Sketch",
  "plane": "XY",
  "faceName": null,
  "message": "Created sketch on XY plane"
}
```

**Example usage:**
```typescript
// Create sketch on default XY plane
{
  name: "create_sketch",
  arguments: {}
}

// Create sketch on XZ plane
{
  name: "create_sketch",
  arguments: {
    plane: "XZ"
  }
}

// Create sketch on a specific face
{
  name: "create_sketch",
  arguments: {
    faceName: "Box.Face1"
  }
}
```

---

#### `add_geometry(type: string, points: Array<{x: number, y: number}>, radius?: number, center?: {x: number, y: number})`

Add geometric elements to a sketch.

**Parameters:**
- `type` (required): Geometry type - `"line"`, `"circle"`, `"arc"`, `"rectangle"`, `"point"`
- `points` (required): Array of points defining the geometry:
  - For `line`: `[{x, y}, {x, y}]` (start and end points)
  - For `rectangle`: `[{x, y}, {x, y}]` (opposite corners)
  - For `circle`: `[{x, y}]` (single point on circumference, use with `center` and `radius`)
  - For `arc`: `[{x, y}, {x, y}, {x, y}]` (start, end, and a point on arc)
  - For `point`: `[{x, y}]` (single point)
- `radius` (optional): Radius for circles and arcs
- `center` (optional): Center point `{x, y}` for circles and arcs

**Response format:**
```json
{
  "success": true,
  "geometryType": "line",
  "geometryId": 0,
  "points": [{"x": 0, "y": 0}, {"x": 50, "y": 0}],
  "message": "Added line geometry (ID: 0)"
}
```

**Example usage:**
```typescript
// Add a horizontal line from origin to (50, 0)
{
  name: "add_geometry",
  arguments: {
    type: "line",
    points: [{"x": 0, "y": 0}, {"x": 50, "y": 0}]
  }
}

// Add a circle centered at (25, 25) with radius 10
{
  name: "add_geometry",
  arguments: {
    type: "circle",
    center: {"x": 25, "y": 25},
    radius: 10,
    points: [{"x": 35, "y": 25}]
  }
}

// Add a rectangle with corners at (0, 0) and (40, 30)
{
  name: "add_geometry",
  arguments: {
    type: "rectangle",
    points: [{"x": 0, "y": 0}, {"x": 40, "y": 30}]
  }
}

// Add an arc from (0, 0) to (30, 0) passing through (15, 15)
{
  name: "add_geometry",
  arguments: {
    type: "arc",
    points: [{"x": 0, "y": 0}, {"x": 30, "y": 0}, {"x": 15, "y": 15}]
  }
}

// Add a construction point
{
  name: "add_geometry",
  arguments: {
    type: "point",
    points: [{"x": 20, "y": 20}]
  }
}
```

---

#### `add_geometric_constraint(type: string, geometryIds: number[], value?: number | string)`

Add a geometric constraint between sketch elements.

**Parameters:**
- `type` (required): Constraint type:
  - `"coincident"` - Two points coincide (2 geometry IDs: point1, point2)
  - `"horizontal"` - Line is horizontal (1 geometry ID: line)
  - `"vertical"` - Line is vertical (1 geometry ID: line)
  - `"parallel"` - Two lines are parallel (2 geometry IDs: line1, line2)
  - `"perpendicular"` - Two lines are perpendicular (2 geometry IDs: line1, line2)
  - `"tangent"` - Curve tangent to line/curve (2 geometry IDs)
  - `"equal"` - Two lines equal length or two circles/arcs equal radius (2 geometry IDs)
  - `"symmetric"` - Two points symmetric about a line/axis (3 geometry IDs: point1, point2, line/axis)
  - `"concentric"` - Two circles/arcs share same center (2 geometry IDs)
  - `"midpoint"` - Point is midpoint of a line (2 geometry IDs: point, line)
- `geometryIds` (required): Array of geometry element IDs the constraint applies to
- `value` (optional): Additional value for certain constraints (rarely used)

**Response format:**
```json
{
  "success": true,
  "constraintType": "perpendicular",
  "constraintId": 0,
  "geometryIds": [0, 1],
  "message": "Added perpendicular constraint (ID: 0)"
}
```

**Example usage:**
```typescript
// Make a line horizontal
{
  name: "add_geometric_constraint",
  arguments: {
    type: "horizontal",
    geometryIds: [0]
  }
}

// Make two lines perpendicular
{
  name: "add_geometric_constraint",
  arguments: {
    type: "perpendicular",
    geometryIds: [0, 1]
  }
}

// Make two lines parallel
{
  name: "add_geometric_constraint",
  arguments: {
    type: "parallel",
    geometryIds: [1, 2]
  }
}

// Make two circles concentric
{
  name: "add_geometric_constraint",
  arguments: {
    type: "concentric",
    geometryIds: [0, 1]
  }
}

// Make two lines equal length
{
  name: "add_geometric_constraint",
  arguments: {
    type: "equal",
    geometryIds: [0, 1]
  }
}
```

---

#### `add_dimensional_constraint(type: string, geometryIds: number[], value: number | string)`

Add a dimensional constraint (distance, angle, radius, or diameter) to sketch elements.

**Parameters:**
- `type` (required): Dimension type:
  - `"distance"` - Distance between two points or point to line (2+ geometry IDs)
  - `"horizontal_distance"` - Horizontal distance between points (2 geometry IDs)
  - `"vertical_distance"` - Vertical distance between points (2 geometry IDs)
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

// Set horizontal distance between points
{
  name: "add_dimensional_constraint",
  arguments: {
    type: "horizontal_distance",
    geometryIds: [0, 1],
    value: "30mm"
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
