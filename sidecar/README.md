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
