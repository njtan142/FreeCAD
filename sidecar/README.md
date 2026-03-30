# FreeCAD LLM Sidecar

Node.js sidecar application that bridges LLM agent backends with FreeCAD's Python execution environment.

## Architecture

```
FreeCAD GUI (Dock Widget)
       ↓ WebSocket (port 8765)
Node.js Sidecar
       ↓ WebSocket (port 8766)
FreeCAD Python Bridge
```

### Multi-Agent Backend Architecture

The sidecar supports multiple LLM agent backends through a modular adapter pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     Sidecar Application                      │
├─────────────────────────────────────────────────────────────┤
│  Backend Registry                                           │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ ClaudeBackend   │  │ OpenCodeBackend │  ┌───────────┐  │
│  │ (Claude Code)   │  │ (Multi-LLM)     │  │ Future... │  │
│  └─────────────────┘  └─────────────────┘  └───────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Tool Translation Layer                                     │
│  (Translates MCP tools to backend-specific formats)         │
├─────────────────────────────────────────────────────────────┤
│  WebSocket Server / Bridge Client                          │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Backend Registry**: Central registry managing backend adapters
- **AgentBackend Interface**: Common interface all backends must implement
- **Tool Translation Layer**: Translates MCP tool definitions to backend-specific formats
- **Backend Adapters**: Backend-specific implementations (Claude, OpenCode)

## Backend Support

The sidecar supports multiple LLM backends:

| Backend | Description | LLM Providers |
|---------|-------------|---------------|
| `claude` | Anthropic Claude via Claude Code CLI | Claude (Anthropic) |
| `opencode` | OpenCode multi-LLM backend | OpenAI, Anthropic, Google, local models |
| `gemini` | Google Gemini via Vercel AI SDK | Gemini (Google) |
| (future) | Additional backends | Various providers |

### Backend Comparison

| Feature | Claude | OpenCode | Gemini |
|---------|--------|----------|--------|
| **API Type** | CLI-based | CLI + API | API |
| **Provider** | Anthropic only | Multiple (OpenAI, Anthropic, Google, local) | Google only |
| **Configuration** | API key | API key or config file | API key |
| **Tool Format** | MCP-native | Function calling format | Function calling |
| **Streaming** | Via CLI | Via stdout | Via SDK |
| **Local Models** | No | Yes | No |

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- FreeCAD with LLM Bridge module installed
- For Claude backend: Claude Code CLI (`npm install -g @anthropic/claude-code`)
- For OpenCode backend: OpenCode CLI (`npm install -g opencode`)

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

### Backend Selection

Use the `--backend` or `-b` flag to select which backend to use:

```bash
# Use Claude (default)
npm start -- --backend claude

# Use OpenCode
npm start -- --backend opencode

# List available backends
npm start -- --list-backends
```

### Environment Variables

Configure via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DOCK_SERVER_PORT` | `8765` | Port for dock widget WebSocket server |
| `FREECAD_BRIDGE_PORT` | `8766` | Port for FreeCAD Python bridge |
| `FREECAD_BRIDGE_HOST` | `localhost` | Host for FreeCAD Python bridge |
| `BACKEND` | `claude` | Default backend to use |

### Claude Backend Configuration

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key for Claude |

### OpenCode Backend Configuration

OpenCode supports multiple LLM providers. Configure via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4` | OpenAI model to use |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI base URL |
| `ANTHROPIC_API_KEY` | - | Anthropic API key (for Claude via OpenCode) |
| `ANTHROPIC_MODEL` | `claude-3-5-sonnet-20241022` | Anthropic model |
| `GOOGLE_API_KEY` | - | Google API key |
| `GOOGLE_MODEL` | `gemini-pro` | Google model |

Alternatively, configure OpenCode via config file at `~/.opencode/config` or `./opencode.config.json`:

```json
{
  "provider": "openai",
  "model": "gpt-4",
  "api_key": "your-api-key-here"
}
```

Environment variables take precedence over config file settings.

### Gemini Backend Configuration

The Gemini backend uses Google Gemini models via Vercel AI SDK. Configure via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | - | Google AI API key (required) |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Model name |
| `GEMINI_BASE_URL` | Google AI default | Custom API endpoint |
| `GEMINI_TEMPERATURE` | `0.7` | Sampling temperature |
| `GEMINI_MAX_TOKENS` | `4096` | Max response tokens |

**Available Models:**

| Model | Description |
|-------|-------------|
| `gemini-2.5-pro` | Most capable, for complex reasoning |
| `gemini-2.0-flash` | Fast, cost-effective (recommended) |
| `gemini-2.0-flash-lite` | Lightweight, fastest |
| `gemini-1.5-pro` | Legacy, still capable |
| `gemini-1.5-flash` | Legacy, balanced |

### Example `.env` file

Create a `.env` file in the sidecar directory:

```env
# Backend selection
BACKEND=opencode

# OpenCode configuration
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4

# Or Claude configuration
# ANTHROPIC_API_KEY=your-api-key-here

# Ports
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

### Backend-Specific Usage

**Using Claude backend:**
```bash
ANTHROPIC_API_KEY=your-key npm start -- --backend claude
```

**Using OpenCode with OpenAI:**
```bash
OPENAI_API_KEY=your-key npm start -- --backend opencode
```

**Using OpenCode with local model:**
```bash
OPENAI_API_KEY=local npm start -- --backend opencode
```

**Using Gemini backend:**
```bash
GEMINI_API_KEY=your-key npm run dev:gemini
```

Or with explicit backend flag:
```bash
GEMINI_API_KEY=your-key npm start -- --backend gemini
```

## Tool Translation Layer

The tool translation layer enables compatibility between the sidecar's MCP tool definitions and backend-specific tool formats. Each backend adapter includes a translator to convert:

1. **MCP Tool Definitions → Backend Format**: Translates FreeCAD's tool definitions (execute_freecad_python, set_object_property, etc.) to the backend's function calling format

2. **Backend Responses → ToolCall Format**: Parses backend responses containing tool calls into a unified `ToolCall` format for execution

The translation layer handles differences such as:
- Tool name and parameter formatting
- Argument encoding (JSON vs special formats)
- Response parsing for tool call results

## Adding a New Backend

To add support for a new LLM backend:

1. **Create the backend adapter** in `src/backends/<backend-name>-backend.ts`:
   ```typescript
   import { AgentBackend, BackendConfig, AgentResponse } from '../agent-backend';
   import { MessageContext, MCPTool } from '../types';

   export class <BackendName>Backend implements AgentBackend {
     readonly name = '<backend-name>';
     readonly description = 'Description of the backend';

     async initialize(config: BackendConfig): Promise<void> { ... }
     async sendMessage(message: string, context: MessageContext, tools: MCPTool[], onChunk: (chunk: string) => void): Promise<AgentResponse> { ... }
     async healthCheck(): Promise<boolean> { ... }
     async disconnect(): Promise<void> { ... }
   }
   ```

2. **Create a tool translator** in `src/tool-translator.ts`:
   ```typescript
   export class <BackendName>ToolTranslator implements ToolTranslator {
     toBackendFormat(tools: MCPTool[]): any { ... }
     fromBackendFormat(response: any): ToolCall[] { ... }
   }
   ```

3. **Register the backend** in `src/index.ts`:
   ```typescript
   import { <BackendName>Backend } from './backends/<backend-name>-backend';
   backendRegistry.register(new <BackendName>Backend());
   ```

4. **Add configuration** in `src/backend-config.ts` if needed

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

### Pattern and Array Tools

The pattern and array tools allow you to create parametric pattern features in PartDesign. Patterns replicate a source feature (pad, pocket, hole, etc.) in linear, polar, rectangular, or path-based arrangements. Patterns are associative by default - when the source feature changes, all pattern copies update automatically.

**Pattern Workflow Overview:**

1. **Create Source Feature** - Build a feature to pattern (pad, pocket, sketch-based cut)
2. **Create Pattern** - Choose pattern type and specify arrangement
3. **Adjust Parameters** - Modify count, spacing, angle as needed
4. **Update/Remove** - Change pattern or delete when no longer needed

---

#### `create_linear_pattern(sourceObject: string, direction: object, count: number, spacing: number | string, createLinks?: boolean, name?: string)`

Create a 1D linear pattern that replicates a feature along a direction vector.

**Parameters:**
- `sourceObject` (required): Name of the feature to pattern (e.g., "Pocket", "Pad001")
- `direction` (required): Direction vector as `{x, y, z}` or object name (edge name) to align with
- `count` (required): Number of copies (including original), integer >= 2
- `spacing` (required): Distance between copies. Can be numeric (mm) or string with units: `"10mm"`, `"2cm"`
- `createLinks` (optional): If `true` (default), pattern copies are linked to source and update when source changes
- `name` (optional): Name for the pattern. If omitted, auto-generated

**Response format:**
```json
{
  "success": true,
  "patternName": "LinearPattern",
  "patternLabel": "LinearPattern",
  "sourceObject": "Pocket",
  "count": 5,
  "spacing": "10.00mm",
  "direction": {"x": 1, "y": 0, "z": 0},
  "createLinks": true,
  "message": "Created LinearPattern 'LinearPattern' with 5 copies, 10.00mm spacing"
}
```

**Example usage:**
```typescript
// Create a linear pattern of 5 holes 10mm apart
{
  name: "create_linear_pattern",
  arguments: {
    sourceObject: "Pocket",
    direction: {"x": 1, "y": 0, "z": 0},
    count: 5,
    spacing: "10mm"
  }
}

// Create pattern along Y-axis with 20mm spacing
{
  name: "create_linear_pattern",
  arguments: {
    sourceObject: "Pad001",
    direction: {"x": 0, "y": 1, "z": 0},
    count: 3,
    spacing: 20,
    name: "VerticalPattern"
  }
}
```

**Natural language examples:**
- "Create a linear pattern of 5 holes"
- "Array these slots 10mm apart along the X axis"
- "Make a horizontal pattern with 20mm spacing"
- "Pattern the cylinder 4 times along the Y direction"

---

#### `update_linear_pattern(patternName: string, count?: number, spacing?: number | string)`

Modify an existing linear pattern's count or spacing.

**Parameters:**
- `patternName` (required): Name of the linear pattern to update
- `count` (optional): New number of copies
- `spacing` (optional): New spacing value. Can be numeric or string with units

**Response format:**
```json
{
  "success": true,
  "patternName": "LinearPattern",
  "count": 8,
  "spacing": "15.00mm",
  "message": "Updated LinearPattern: now 8 copies, 15.00mm spacing"
}
```

**Example usage:**
```typescript
// Change pattern to 8 copies
{
  name: "update_linear_pattern",
  arguments: {
    patternName: "LinearPattern",
    count: 8
  }
}

// Double the spacing
{
  name: "update_linear_pattern",
  arguments: {
    patternName: "LinearPattern",
    spacing: "20mm"
  }
}
```

**Natural language examples:**
- "Change the pattern to 8 copies"
- "Double the spacing to 20mm"
- "Update the linear pattern to have 10 instances"

---

#### `create_polar_pattern(sourceObject: string, centerPoint: object, axis: object, count: number, angle?: number | string, createLinks?: boolean, name?: string)`

Create a polar (circular) pattern that replicates a feature around an axis.

**Parameters:**
- `sourceObject` (required): Name of the feature to pattern
- `centerPoint` (required): Center of rotation as `{x, y, z}`
- `axis` (required): Axis of rotation as `{x, y, z}` (e.g., `{"x": 0, "y": 0, "z": 1}` for Z-axis)
- `count` (required): Number of copies (including original), integer >= 2
- `angle` (optional): Total angular span in degrees. Default: `360`. Can be numeric or string: `"270deg"`
- `createLinks` (optional): If `true` (default), copies are linked to source
- `name` (optional): Name for the pattern

**Response format:**
```json
{
  "success": true,
  "patternName": "PolarPattern",
  "patternLabel": "PolarPattern",
  "sourceObject": "Pocket",
  "count": 6,
  "angle": "360.00deg",
  "centerPoint": {"x": 0, "y": 0, "z": 0},
  "axis": {"x": 0, "y": 0, "z": 1},
  "message": "Created PolarPattern 'PolarPattern' with 6 instances around 360.00deg"
}
```

**Example usage:**
```typescript
// Create 6 bolts in a full circle
{
  name: "create_polar_pattern",
  arguments: {
    sourceObject: "Pocket",
    centerPoint: {"x": 0, "y": 0, "z": 0},
    axis: {"x": 0, "y": 0, "z": 1},
    count: 6
  }
}

// Create pattern around 270 degrees
{
  name: "create_polar_pattern",
  arguments: {
    sourceObject: "Pad001",
    centerPoint: {"x": 0, "y": 0, "z": 0},
    axis: {"x": 0, "y": 0, "z": 1},
    count: 4,
    angle: "270deg",
    name: "PartialPolar"
  }
}
```

**Natural language examples:**
- "Create a polar pattern of 6 bolts"
- "Array around 270 degrees"
- "Make a circular pattern of 8 holes"
- "Pattern the feature around the Z axis"

---

#### `update_polar_pattern(patternName: string, count?: number, angle?: number | string)`

Modify an existing polar pattern's count or angle.

**Parameters:**
- `patternName` (required): Name of the polar pattern to update
- `count` (optional): New number of copies
- `angle` (optional): New angular span in degrees

**Response format:**
```json
{
  "success": true,
  "patternName": "PolarPattern",
  "count": 8,
  "angle": "180.00deg",
  "message": "Updated PolarPattern: now 8 copies, 180.00deg span"
}
```

**Example usage:**
```typescript
// Increase to 8 instances
{
  name: "update_polar_pattern",
  arguments: {
    patternName: "PolarPattern",
    count: 8
  }
}

// Reduce to 180 degree arc
{
  name: "update_polar_pattern",
  arguments: {
    patternName: "PolarPattern",
    angle: 180
  }
}
```

**Natural language examples:**
- "Increase to 8 instances"
- "Reduce angle to 180 degrees"
- "Change the polar pattern to 12 copies"

---

#### `create_rectangular_pattern(sourceObject: string, directionX: object, countX: number, spacingX: number | string, directionY: object, countY: number, spacingY: number | string, createLinks?: boolean, name?: string)`

Create a 2D rectangular grid pattern that replicates a feature in two directions.

**Parameters:**
- `sourceObject` (required): Name of the feature to pattern
- `directionX` (required): First direction vector as `{x, y, z}`
- `countX` (required): Number of copies in X direction (including original)
- `spacingX` (required): Spacing in X direction
- `directionY` (required): Second direction vector as `{x, y, z}`
- `countY` (required): Number of copies in Y direction (including original)
- `spacingY` (required): Spacing in Y direction
- `createLinks` (optional): If `true` (default), copies are linked to source
- `name` (optional): Name for the pattern

**Response format:**
```json
{
  "success": true,
  "patternName": "RectangularPattern",
  "patternLabel": "RectangularPattern",
  "sourceObject": "Pocket",
  "countX": 3,
  "countY": 4,
  "totalCount": 12,
  "spacingX": "10.00mm",
  "spacingY": "15.00mm",
  "message": "Created RectangularPattern 'RectPattern': 3x4 grid (12 total copies)"
}
```

**Example usage:**
```typescript
// Create 3x4 grid pattern
{
  name: "create_rectangular_pattern",
  arguments: {
    sourceObject: "Pocket",
    directionX: {"x": 1, "y": 0, "z": 0},
    countX: 3,
    spacingX: "10mm",
    directionY: {"x": 0, "y": 1, "z": 0},
    countY: 4,
    spacingY: "15mm"
  }
}

// Create 5x5 grid with custom name
{
  name: "create_rectangular_pattern",
  arguments: {
    sourceObject: "Pad001",
    directionX: {"x": 1, "y": 0, "z": 0},
    countX: 5,
    spacingX: 20,
    directionY: {"x": 0, "y": 1, "z": 0},
    countY: 5,
    spacingY: 20,
    name: "GridPattern"
  }
}
```

**Natural language examples:**
- "Create a 3x4 rectangular array"
- "Make a 5 by 5 grid"
- "Pattern as a 4x6 matrix with 10mm spacing"
- "Create a grid pattern 3 across and 4 down"

---

#### `create_path_pattern(sourceObject: string, pathObject: string, count: number, spacing: number | string, alignToPath?: boolean, createLinks?: boolean, name?: string)`

Create a pattern that distributes copies along a path (wire or sketch edge).

**Parameters:**
- `sourceObject` (required): Name of the feature to pattern
- `pathObject` (required): Name of the path object or sketch containing the path
- `count` (required): Number of copies (including original)
- `spacing` (required): Distance between copies along the path
- `alignToPath` (optional): If `true` (default), copies rotate to follow the path tangent
- `createLinks` (optional): If `true` (default), copies are linked to source
- `name` (optional): Name for the pattern

**Response format:**
```json
{
  "success": true,
  "patternName": "PathPattern",
  "patternLabel": "PathPattern",
  "sourceObject": "Pocket",
  "pathObject": "Sketch",
  "count": 5,
  "spacing": "20.00mm",
  "alignToPath": true,
  "message": "Created PathPattern 'PathPattern' with 5 copies along path"
}
```

**Example usage:**
```typescript
// Pattern along a sketch edge
{
  name: "create_path_pattern",
  arguments: {
    sourceObject: "Pocket",
    pathObject: "Sketch",
    count: 5,
    spacing: "20mm"
  }
}

// Pattern along path without rotation
{
  name: "create_path_pattern",
  arguments: {
    sourceObject: "Pad001",
    pathObject: "Sketch001",
    count: 8,
    spacing: 15,
    alignToPath: false,
    name: "LinearPathPattern"
  }
}
```

**Natural language examples:**
- "Pattern along this curve"
- "Array along the sketch edge"
- "Distribute 5 copies along this path"
- "Create a path-based pattern"

---

#### `create_transform_link(sourceObject: string, xTranslation: number, yTranslation: number, zTranslation: number, xCount: number, yCount?: number, zCount?: number, name?: string)`

Create positioned links (transform pattern) that replicate a feature at specified translation intervals in 3D space.

**Parameters:**
- `sourceObject` (required): Name of the feature to pattern
- `xTranslation` (required): Translation distance in X direction (mm)
- `yTranslation` (required): Translation distance in Y direction (mm)
- `zTranslation` (required): Translation distance in Z direction (mm)
- `xCount` (required): Number of copies in X direction (including original)
- `yCount` (optional): Number of copies in Y direction. Default: 1
- `zCount` (optional): Number of copies in Z direction. Default: 1
- `name` (optional): Name for the transform

**Response format:**
```json
{
  "success": true,
  "transformName": "TransformLink",
  "transformLabel": "TransformLink",
  "sourceObject": "Pad",
  "xCount": 3,
  "yCount": 2,
  "zCount": 1,
  "totalCount": 6,
  "xTranslation": "10.00mm",
  "yTranslation": "20.00mm",
  "zTranslation": "0.00mm",
  "message": "Created TransformLink 'TransformLink': 3x2x1 grid (6 total copies)"
}
```

**Example usage:**
```typescript
// Transform 3 times in X direction only
{
  name: "create_transform_link",
  arguments: {
    sourceObject: "Pad",
    xTranslation: 10,
    yTranslation: 0,
    zTranslation: 0,
    xCount: 3
  }
}

// Create 3x2x1 grid pattern
{
  name: "create_transform_link",
  arguments: {
    sourceObject: "Cylinder",
    xTranslation: 15,
    yTranslation: 20,
    zTranslation: 0,
    xCount: 3,
    yCount: 2,
    zCount: 1,
    name: "GridTransform"
  }
}
```

**Natural language examples:**
- "Transform this feature 3 times in X direction"
- "Create a 3x2 grid of the cylinder"
- "Make 6 copies (3x1x2) with 15mm spacing"
- "Array in 3D space with 10mm increments"

---

#### `get_pattern_info(patternName: string)`

Get detailed information about a pattern including its type, parameters, and positions.

**Parameters:**
- `patternName` (required): Name of the pattern to query

**Response format:**
```json
{
  "success": true,
  "patternName": "LinearPattern",
  "patternLabel": "LinearPattern",
  "type": "LinearPattern",
  "sourceObject": "Pocket",
  "count": 5,
  "spacing": "10.00mm",
  "direction": {"x": 1, "y": 0, "z": 0},
  "createLinks": true,
  "positions": [
    {"x": 0, "y": 0, "z": 0},
    {"x": 10, "y": 0, "z": 0},
    {"x": 20, "y": 0, "z": 0},
    {"x": 30, "y": 0, "z": 0},
    {"x": 40, "y": 0, "z": 0}
  ],
  "message": "Pattern info retrieved successfully"
}
```

**Example usage:**
```typescript
// Get pattern details
{
  name: "get_pattern_info",
  arguments: {
    patternName: "LinearPattern"
  }
}
```

**Natural language examples:**
- "Show pattern details"
- "What are the pattern parameters?"
- "Tell me about this polar pattern"

---

#### `delete_pattern(patternName: string)`

Remove a pattern from the document. The source feature is preserved.

**Parameters:**
- `patternName` (required): Name of the pattern to delete

**Response format:**
```json
{
  "success": true,
  "patternName": "LinearPattern",
  "message": "Deleted pattern 'LinearPattern'"
}
```

**Example usage:**
```typescript
// Delete a pattern
{
  name: "delete_pattern",
  arguments: {
    patternName: "LinearPattern"
  }
}
```

**Natural language examples:**
- "Delete this pattern"
- "Remove the array"
- "Delete the polar pattern"

---

### Pattern Types Reference

| Pattern Type | Use Case | Parameters |
|--------------|----------|------------|
| **Linear** | Holes, slots, studs in a line | Direction, count, spacing |
| **Polar** | Bolts, holes around a circle | Center, axis, count, angle |
| **Rectangular** | Grid of features | DirectionX, countX, spacingX, DirectionY, countY, spacingY |
| **Path** | Features along a curve | Path, count, spacing, alignToPath |
| **Transform** | 3D grid distribution | Translation X/Y/Z, count X/Y/Z |

### Common Pattern Workflows

**Creating a row of holes:**
1. Create a sketch with hole circles
2. Create a pocket to cut the holes
3. Create a linear pattern of the pocket
4. Adjust count and spacing as needed

**Creating a flange with bolt holes:**
1. Create the base pad/revolution
2. Create a sketch on the flange face with bolt circles
3. Create through-all pockets for the holes
4. Create a polar pattern around the center

**Creating a heatsink grid:**
1. Create the heatsink base shape
2. Create a sketch with fin profiles
3. Create pads for the fins
4. Create a rectangular pattern in X and Y directions

**Creating holes along a curved edge:**
1. Create the curved surface or edge
2. Create sketch with hole circles
3. Create a path pattern using the curved edge
4. Enable alignToPath so holes follow the curve

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

##### `get_drawing_page_properties(pageName: string)`

Get detailed properties of a TechDraw page.

**Parameters:**
- `pageName` (required): Name of the page to query

**Response format:**
```json
{
  "success": true,
  "pageName": "Page",
  "pageLabel": "Page",
  "properties": {
    "name": "Page",
    "label": "Page",
    "type": "TechDraw::Page",
    "template": ":/TEAM/A4_LandscapeTD.svg",
    "pageWidth": 210,
    "pageHeight": 297,
    "scale": 1.0,
    "scaleType": "None",
    "views": [],
    "viewCount": 0
  },
  "message": "Retrieved properties for TechDraw page 'Page'"
}
```

**Example usage:**
```typescript
{
  name: "get_drawing_page_properties",
  arguments: {
    pageName: "Page"
  }
}
```

**Natural language examples:**
- "Show properties of this drawing page"
- "What template is this page using?"
- "List all views on this page"

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

##### `create_detail_view(sourceView: string, center: {x: number, y: number}, scale?: number, pageName?: string, viewName?: string)`

Create a detail (enlarged) view showing a zoomed portion of a source view.

**Parameters:**
- `sourceView` (required): Name of the source view to detail
- `center` (required): Center point of the detail as `{x, y}` coordinates
- `scale` (optional): Scale factor for magnification (default: 2.0)
- `pageName` (optional): Name of the page containing the source view. If omitted, finds automatically.
- `viewName` (optional): Name for the detail view. If omitted, auto-generated.

**Response format:**
```json
{
  "success": true,
  "viewName": "Detail",
  "sourceView": "Front",
  "scale": 2.0,
  "detailPoint": {"x": 50, "y": 50},
  "message": "Created detail view at {'x': 50.00, 'y': 50.00, 'z': 0.00}"
}
```

**Example usage:**
```typescript
{
  name: "create_detail_view",
  arguments: {
    sourceView: "Front",
    center: {"x": 50, "y": 50},
    scale: 2.0,
    pageName: "Page"
  }
}
```

**Natural language examples:**
- "Create a detail view of this area"
- "Add a 2x magnification detail"
- "Show an enlarged view of this feature"

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

##### `create_leader_line(pageName: string, points: Array<[number, number]>, text?: string, viewName?: string)`

Add a leader line with optional text annotation to a TechDraw page.

**Parameters:**
- `pageName` (required): Name of the page containing the view
- `points` (required): Array of [x, y] coordinates defining the leader line path
- `text` (optional): Text to display at the end of the leader line
- `viewName` (optional): Name of the view to add the leader to

**Response format:**
```json
{
  "success": true,
  "leaderName": "Leader",
  "points": [[10, 50], [10, 100], [50, 100]],
  "text": "MAX",
  "message": "Created leader line 'Leader'"
}
```

**Example usage:**
```typescript
{
  name: "create_leader_line",
  arguments: {
    pageName: "Page",
    points: [[10, 50], [10, 100], [50, 100]],
    text: "MAX"
  }
}

// Leader without text
{
  name: "create_leader_line",
  arguments: {
    pageName: "Page",
    viewName: "Front",
    points: [[0, 0], [0, 50]]
  }
}
```

**Natural language examples:**
- "Add a leader line pointing to this feature"
- "Create a callout with text 'MAX'"
- "Add an annotation line with label"

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

### Surface Modeling Tools

The surface modeling tools enable creation of complex 3D surfaces using loft, sweep, and other surface operations. Surface modeling is essential for organic shapes, smooth transitions, and geometries that cannot be achieved with simple extrusion or padding.

**Surface Modeling Overview:**

- **Loft** - Creates surfaces by connecting profile curves between two or more cross-sections
- **Sweep** - Creates surfaces by sweeping a profile along a path
- **Ruled Surface** - Creates surfaces between two curves or edges
- **Blend Surface** - Creates smooth transitions between two existing surfaces
- **Offset Surface** - Creates a parallel surface at a specified distance

---

#### Loft Tools

##### `create_loft(profiles: string[], solid?: boolean, closed?: boolean, name?: string)`

Create a surface loft between two or more profile curves.

**Parameters:**
- `profiles` (required): Array of object names (sketches or wires) to loft between, in order
- `solid` (optional): If `true`, creates a solid. Default: `true`
- `closed` (optional): If `true`, closes the loft back to the first profile. Default: `false`
- `name` (optional): Name for the loft. If omitted, auto-generated

**Response format:**
```json
{
  "success": true,
  "loftName": "Loft",
  "profileCount": 3,
  "solid": true,
  "isClosed": false,
  "message": "Created Loft 'Loft' with 3 profiles, solid mode"
}
```

**Example usage:**
```typescript
// Loft between two profiles
{
  name: "create_loft",
  arguments: {
    profiles: ["Sketch001", "Sketch002"]
  }
}

// Multi-section loft with 3 profiles
{
  name: "create_loft",
  arguments: {
    profiles: ["CircleSketch", "EllipseSketch", "RectangleSketch"],
    solid: true
  }
}

// Closed loft (e.g., for bottle shapes)
{
  name: "create_loft",
  arguments: {
    profiles: ["TopProfile", "MiddleProfile", "BottomProfile"],
    solid: true,
    closed: true
  }
}
```

**Natural language examples:**
- "Loft between these two sketches"
- "Create a loft through these three profiles"
- "Make a closed loft for a bottle shape"
- "Create a solid loft connecting the circles"

**Notes:**
- Profiles should be ordered from start to end
- All profiles must be compatible (same number of edges for solid mode)
- Open profiles create surfaces; closed profiles can create solids

---

##### `get_loft_info(loftName: string)`

Get detailed information about a loft.

**Parameters:**
- `loftName` (required): Name of the loft to query

**Response format:**
```json
{
  "success": true,
  "loftName": "Loft",
  "profileCount": 3,
  "solid": true,
  "isClosed": false,
  "profiles": ["Sketch001", "Sketch002", "Sketch003"],
  "message": "Loft info: 3 profiles, solid mode, not closed"
}
```

**Example usage:**
```typescript
{
  name: "get_loft_info",
  arguments: {
    loftName: "Loft001"
  }
}
```

**Natural language examples:**
- "Show loft details"
- "What profiles does this loft use?"

---

#### Sweep Tools

##### `create_sweep(profile: string, path: string, solid?: boolean, frenet?: boolean, name?: string)`

Sweep a profile along a path to create a surface or solid.

**Parameters:**
- `profile` (required): Name of the profile (sketch or wire) to sweep
- `path` (required): Name of the path (sketch, wire, or edge) to sweep along
- `solid` (optional): If `true`, creates a solid. Default: `true`
- `frenet` (optional): If `true`, uses Frenet frame calculation for orientation. Default: `true`
- `name` (optional): Name for the sweep. If omitted, auto-generated

**Response format:**
```json
{
  "success": true,
  "sweepName": "Sweep",
  "profile": "CircleSketch",
  "path": "PathSketch",
  "solid": true,
  "frenet": true,
  "message": "Created Sweep 'Sweep' along path, solid mode, Frenet frame"
}
```

**Example usage:**
```typescript
// Basic sweep along a path
{
  name: "create_sweep",
  arguments: {
    profile: "CircleSketch",
    path: "PathSketch"
  }
}

// Sweep without Frenet frame (constant orientation)
{
  name: "create_sweep",
  arguments: {
    profile: "RectangleSketch",
    path: "PathSketch",
    frenet: false
  }
}

// Create surface (not solid)
{
  name: "create_sweep",
  arguments: {
    profile: "CircleSketch",
    path: "PathSketch",
    solid: false
  }
}
```

**Natural language examples:**
- "Sweep this circle along the path"
- "Sweep the profile along the curve"
- "Create a pipe using this circle and path"
- "Sweep with constant orientation (no Frenet)"

**Notes:**
- Profile is the cross-section shape
- Path defines the trajectory the profile follows
- Frenet frame rotates the profile to follow the path curvature
- Non-Frenet keeps the profile orientation constant

---

##### `create_multi_section_sweep(profiles: string[], path: string, solid?: boolean, name?: string)`

Sweep through multiple profile sections along a single path.

**Parameters:**
- `profiles` (required): Array of profile names in order along the path
- `path` (required): Name of the path to sweep along
- `solid` (optional): If `true`, creates a solid. Default: `true`
- `name` (optional): Name for the sweep

**Response format:**
```json
{
  "success": true,
  "sweepName": "MultiSweep",
  "profileCount": 4,
  "path": "PathSketch",
  "solid": true,
  "message": "Created Multi-section Sweep with 4 profiles along path"
}
```

**Example usage:**
```typescript
// Sweep through multiple sections
{
  name: "create_multi_section_sweep",
  arguments: {
    profiles: ["SmallCircle", "MediumCircle", "LargeCircle", "MediumCircle"],
    path: "VerticalPath"
  }
}
```

**Natural language examples:**
- "Sweep through these sections along the path"
- "Multi-section sweep with different sized circles"
- "Create a tapered pipe through these profiles"

---

##### `get_sweep_info(sweepName: string)`

Get detailed information about a sweep.

**Parameters:**
- `sweepName` (required): Name of the sweep to query

**Response format:**
```json
{
  "success": true,
  "sweepName": "Sweep",
  "profile": "CircleSketch",
  "path": "PathSketch",
  "solid": true,
  "frenet": true,
  "message": "Sweep info: CircleSketch along PathSketch"
}
```

**Example usage:**
```typescript
{
  name: "get_sweep_info",
  arguments: {
    sweepName: "Sweep001"
  }
}
```

**Natural language examples:**
- "Show sweep details"
- "What path does this sweep follow?"

---

#### Surface Analysis Tools

##### `analyze_surface(surfaceName: string)`

Analyze surface curvature and geometric properties.

**Parameters:**
- `surfaceName` (required): Name of the surface to analyze

**Response format:**
```json
{
  "success": true,
  "surfaceName": "Loft",
  "curvatureMin": -0.05,
  "curvatureMax": 0.12,
  "gaussian": -0.002,
  "mean": 0.03,
  "message": "Surface analysis: Gaussian curvature -0.05 to 0.12, mean 0.03"
}
```

**Example usage:**
```typescript
{
  name: "analyze_surface",
  arguments: {
    surfaceName: "Loft001"
  }
}
```

**Natural language examples:**
- "Analyze surface curvature"
- "Show curvature data for this surface"
- "What are the curvature values?"

**Curvature types returned:**
- **Min/Max curvature**: Principal curvatures at each point
- **Gaussian curvature**: Product of principal curvatures (positive = elliptic, negative = hyperbolic, zero = developable)
- **Mean curvature**: Average of principal curvatures (zero = minimal surface)

---

##### `validate_surface(surfaceName: string)`

Validate surface integrity and detect defects.

**Parameters:**
- `surfaceName` (required): Name of the surface to validate

**Response format:**
```json
{
  "success": true,
  "surfaceName": "Loft",
  "isValid": true,
  "issues": [],
  "message": "Surface valid: no issues found"
}
```

**Example usage:**
```typescript
{
  name: "validate_surface",
  arguments: {
    surfaceName: "Sweep001"
  }
}
```

**Natural language examples:**
- "Validate this surface"
- "Check for defects in this surface"
- "Is this surface valid?"

**Detected issues:**
- `SelfIntersections` - Surface intersects itself
- `InvalidGeometry` - Contains invalid control points
- `DiscontinuousSurface` - Surface is not continuous
- `DegeneratePatches` - Contains zero-area patches

---

#### Surface Utilities

##### `create_ruled_surface(curve1: string, curve2: string, name?: string)`

Create a ruled surface between two curves or edges.

**Parameters:**
- `curve1` (required): Name of first curve or edge
- `curve2` (required): Name of second curve or edge
- `name` (optional): Name for the ruled surface

**Response format:**
```json
{
  "success": true,
  "ruledName": "RuledSurface",
  "curve1": "Edge1",
  "curve2": "Edge2",
  "message": "Created ruled surface between Edge1 and Edge2"
}
```

**Example usage:**
```typescript
{
  name: "create_ruled_surface",
  arguments: {
    curve1: "Sketch001.Edge1",
    curve2: "Sketch002.Edge1"
  }
}
```

**Natural language examples:**
- "Create a ruled surface between these edges"
- "Make a surface connecting these two curves"
- "Ruled surface between the two sketch edges"

---

##### `create_offset_surface(surfaceName: string, distance: number | string, name?: string)`

Create an offset (parallel) surface at a specified distance.

**Parameters:**
- `surfaceName` (required): Name of the source surface
- `distance` (required): Offset distance. Can be numeric (mm) or string with units ("2mm", "0.1in")
- `name` (optional): Name for the offset surface

**Response format:**
```json
{
  "success": true,
  "offsetName": "Offset",
  "source": "Loft",
  "distance": "2.00mm",
  "message": "Created offset surface 'Offset' at 2.00mm distance"
}
```

**Example usage:**
```typescript
// Offset by 2mm
{
  name: "create_offset_surface",
  arguments: {
    surfaceName: "Loft001",
    distance: 2
  }
}

// Offset with units
{
  name: "create_offset_surface",
  arguments: {
    surfaceName: "Sweep",
    distance: "0.5mm"
  }
}
```

**Natural language examples:**
- "Create a 2mm offset of this surface"
- "Offset surface outward by 3mm"
- "Make a parallel surface 1mm away"

**Notes:**
- Positive distance expands outward
- Negative distance contracts inward

---

##### `rebuild_surface(surfaceName: string, tolerance?: number | string)`

Rebuild a surface with a new tolerance for improved precision.

**Parameters:**
- `surfaceName` (required): Name of the surface to rebuild
- `tolerance` (optional): Rebuild tolerance. Can be numeric (mm) or string with units. Default: `0.1mm`

**Response format:**
```json
{
  "success": true,
  "surfaceName": "Loft",
  "newTolerance": "0.01mm",
  "message": "Rebuilt surface with tolerance 0.01mm"
}
```

**Example usage:**
```typescript
// Rebuild with tighter tolerance
{
  name: "rebuild_surface",
  arguments: {
    surfaceName: "Loft001",
    tolerance: "0.01mm"
  }
}
```

**Natural language examples:**
- "Rebuild with tighter tolerance"
- "Improve surface precision to 0.01mm"
- "Rebuild this surface with 0.05mm tolerance"

---

##### `get_surface_info(surfaceName: string)`

Get detailed information about a surface.

**Parameters:**
- `surfaceName` (required): Name of the surface to query

**Response format:**
```json
{
  "success": true,
  "surfaceName": "Loft",
  "surfaceType": "Loft",
  "area": 1250.00,
  "bounds": {
    "minX": 0, "minY": 0, "minZ": 0,
    "maxX": 100, "maxY": 50, "maxZ": 200
  },
  "message": "Surface info retrieved successfully"
}
```

**Example usage:**
```typescript
{
  name: "get_surface_info",
  arguments: {
    surfaceName: "Sweep001"
  }
}
```

**Natural language examples:**
- "Get surface information"
- "Show details about this surface"
- "What is the area of this loft?"

---

#### Loft vs Sweep vs Ruled Surfaces

| Surface Type | Use Case | Profile Required | Path Required |
|--------------|----------|-----------------|---------------|
| **Loft** | Smooth transitions between cross-sections | Multiple profiles | No |
| **Sweep** | Pipe-like shapes following a trajectory | One profile | Yes |
| **Ruled** | Simple surface between two edges | Two curves | No |

**When to use each:**

- **Loft**: When you have multiple cross-sections (e.g., circles of different sizes transitioning into each other)
- **Sweep**: When you have one profile that follows a path (e.g., a circle sweeping along a curved pipe)
- **Ruled**: When you want a simple linear interpolation between two edges

---

#### Common Surface Workflows

**Workflow 1: Basic Loft**

```
1. Create first profile sketch: create_sketch({ name: "Profile1" })
2. Add geometry to first profile: add_geometry({ sketchName: "Profile1", ... })
3. Create second profile sketch: create_sketch({ name: "Profile2" })
4. Add geometry to second profile
5. Create loft: create_loft({ profiles: ["Profile1", "Profile2"] })
```

**Workflow 2: Sweep with Path**

```
1. Create profile sketch (circle): create_sketch({ name: "CircleProfile" })
2. Add circle geometry: add_geometry({ sketchName: "CircleProfile", geometryType: "circle", ... })
3. Create path sketch: create_sketch({ name: "Path" })
4. Add path geometry (line or curve): add_geometry({ sketchName: "Path", ... })
5. Create sweep: create_sweep({ profile: "CircleProfile", path: "Path" })
```

**Workflow 3: Bottle Shape (Closed Loft)**

```
1. Create base profile sketch
2. Add closed circle/ellipse geometry
3. Create intermediate profile sketches at different heights
4. Create top profile sketch
5. Create closed loft: create_loft({ profiles: [...], closed: true })
```

**Workflow 4: Multi-Section Sweep (Airplane Wing)**

```
1. Create root airfoil profile
2. Create tip airfoil profile
3. Create sweep path (straight or curved line)
4. Create multi-section sweep: create_multi_section_sweep({ profiles: ["Root", "Tip"], path: "WingPath" })
```

**Workflow 5: Surface Analysis and Refinement**

```
1. Create surface: create_loft({ profiles: [...] })
2. Analyze curvature: analyze_surface({ surfaceName: "Loft" })
3. Validate surface: validate_surface({ surfaceName: "Loft" })
4. If issues found, rebuild with tighter tolerance: rebuild_surface({ surfaceName: "Loft", tolerance: "0.01mm" })
```

**Workflow 6: Offset Surface (Thicken Shell)**

```
1. Create base surface: create_sweep({ profile: "Profile", path: "Path" })
2. Validate surface: validate_surface({ surfaceName: "Sweep" })
3. Create offset: create_offset_surface({ surfaceName: "Sweep", distance: 2 })
```

---

### Kinematic Solver and Motion Animation Tools

The kinematic solver tools enable simulation and animation of mechanical assemblies by driving kinematic joints and solving constraint-based mechanisms. These tools are essential for mechanical design verification, range-of-motion analysis, and creating animated documentation.

**Kinematic Overview:**

- **Solver Initialization** - Setup the kinematic solver for an assembly
- **Joint Control** - Set and get joint values for direct control
- **DOF Analysis** - Understand degrees of freedom in the mechanism
- **Animation** - Create and play joint drive animations
- **Collision Detection** - Check for interference during motion

---

#### Solver Tools

##### `initialize_kinematic_solver(assemblyName: string)`

Initialize the kinematic solver for an assembly.

**Parameters:**
- `assemblyName` (required): Name of the assembly to initialize

**Response format:**
```json
{
  "success": true,
  "assemblyName": "MainAssembly",
  "dofCount": 3,
  "jointCount": 5,
  "message": "Solver initialized for MainAssembly"
}
```

**Example usage:**
```typescript
{
  name: "initialize_kinematic_solver",
  arguments: {
    assemblyName: "EngineAssembly"
  }
}
```

**Natural language examples:**
- "Initialize solver for this assembly"
- "Setup kinematic analysis"
- "Prepare the mechanism for solving"

---

##### `solve_assembly(assemblyName: string, maxIterations?: number)`

Solve the kinematic positions for an assembly.

**Parameters:**
- `assemblyName` (required): Name of the assembly to solve
- `maxIterations` (optional): Maximum solver iterations (default 100)

**Response format:**
```json
{
  "success": true,
  "assemblyName": "MainAssembly",
  "iterations": 12,
  "converged": true,
  "positions": [
    { "joint": "Hinge", "value": 45.0, "unit": "deg" },
    { "joint": "Slider", "value": 20.0, "unit": "mm" }
  ],
  "message": "Assembly solved successfully"
}
```

**Example usage:**
```typescript
// Basic solve
{
  name: "solve_assembly",
  arguments: {
    assemblyName: "MainAssembly"
  }
}

// Solve with more iterations
{
  name: "solve_assembly",
  arguments: {
    assemblyName: "MainAssembly",
    maxIterations: 200
  }
}
```

**Natural language examples:**
- "Solve this mechanism"
- "Calculate positions"
- "Solve the assembly with higher precision"

---

##### `check_degrees_of_freedom(assemblyName: string)`

Perform degrees of freedom (DOF) analysis on an assembly.

**Parameters:**
- `assemblyName` (required): Name of the assembly to analyze

**Response format:**
```json
{
  "success": true,
  "assemblyName": "CrankSlider",
  "totalDof": 6,
  "constrainedDof": 4,
  "freeDof": 2,
  "message": "DOF analysis complete"
}
```

**Example usage:**
```typescript
{
  name: "check_degrees_of_freedom",
  arguments: {
    assemblyName: "CrankSlider"
  }
}
```

**Natural language examples:**
- "Show DOF analysis"
- "How many degrees of freedom?"
- "What is the mobility of this mechanism?"

---

#### Joint Control Tools

##### `set_joint_value(jointName: string, value: number)`

Set the value of a joint or driver.

**Parameters:**
- `jointName` (required): Name of the joint or driver
- `value` (required): Target value (degrees for angular, mm for linear)

**Response format:**
```json
{
  "success": true,
  "jointName": "HingeJoint",
  "value": 45,
  "message": "Joint HingeJoint set to 45"
}
```

**Example usage:**
```typescript
// Rotate hinge to 45 degrees
{
  name: "set_joint_value",
  arguments: {
    jointName: "HingeJoint",
    value: 45
  }
}

// Move slider 20mm
{
  name: "set_joint_value",
  arguments: {
    jointName: "SliderJoint",
    value: 20
  }
}
```

**Natural language examples:**
- "Rotate hinge to 45 degrees"
- "Move slider 20mm"
- "Set the crank angle to 90 degrees"

---

##### `get_joint_value(jointName: string)`

Get the current value of a joint or driver.

**Parameters:**
- `jointName` (required): Name of the joint or driver

**Response format:**
```json
{
  "success": true,
  "jointName": "HingeJoint",
  "value": 45.0,
  "unit": "deg",
  "message": "Joint HingeJoint value retrieved"
}
```

**Example usage:**
```typescript
{
  name: "get_joint_value",
  arguments: {
    jointName: "HingeJoint"
  }
}
```

**Natural language examples:**
- "What's the current angle?"
- "Show joint position"
- "What is the slider position?"

---

##### `get_joint_limits(jointName: string)`

Get the limits (range of motion) of a joint.

**Parameters:**
- `jointName` (required): Name of the joint or driver

**Response format:**
```json
{
  "success": true,
  "jointName": "HingeJoint",
  "minValue": 0.0,
  "maxValue": 180.0,
  "unit": "deg",
  "hasLimits": true,
  "message": "Joint limits for HingeJoint"
}
```

**Example usage:**
```typescript
{
  name: "get_joint_limits",
  arguments: {
    jointName: "HingeJoint"
  }
}
```

**Natural language examples:**
- "Show joint limits"
- "Range of motion for this joint"
- "What are the minimum and maximum positions?"

---

#### Animation Tools

##### `drive_joint(jointName: string, startValue: number, endValue: number, duration: number, motionType?: "linear" | "ease_in_out" | "sine")`

Create a joint animation drive sequence.

**Parameters:**
- `jointName` (required): Name of the joint or driver
- `startValue` (required): Starting value
- `endValue` (required): Ending value
- `duration` (required): Duration in seconds
- `motionType` (optional): Motion curve type - "linear", "ease_in_out", or "sine" (default "linear")

**Response format:**
```json
{
  "success": true,
  "jointName": "HingeJoint",
  "startValue": 0,
  "endValue": 90,
  "duration": 2,
  "motionType": "linear",
  "frames": 60,
  "message": "Drive created for HingeJoint: 0 to 90 over 2s"
}
```

**Example usage:**
```typescript
// Open hinge from 0 to 90 degrees over 2 seconds
{
  name: "drive_joint",
  arguments: {
    jointName: "HingeJoint",
    startValue: 0,
    endValue: 90,
    duration: 2
  }
}

// Smooth slider motion with ease-in-out
{
  name: "drive_joint",
  arguments: {
    jointName: "SliderJoint",
    startValue: 0,
    endValue: 50,
    duration: 3,
    motionType: "ease_in_out"
  }
}
```

**Natural language examples:**
- "Open hinge from 0 to 90 degrees over 2 seconds"
- "Animate crank rotation"
- "Slowly move the slider using sine motion"

---

##### `animate_assembly(assemblyName: string, duration: number, frameRate?: number)`

Run a full assembly animation.

**Parameters:**
- `assemblyName` (required): Name of the assembly to animate
- `duration` (required): Animation duration in seconds
- `frameRate` (optional): Frames per second (default 30)

**Response format:**
```json
{
  "success": true,
  "assemblyName": "EngineAssembly",
  "duration": 5,
  "frameRate": 30,
  "totalFrames": 150,
  "message": "Animation started: 150 frames over 5s"
}
```

**Example usage:**
```typescript
// Animate for 5 seconds at default frame rate
{
  name: "animate_assembly",
  arguments: {
    assemblyName: "EngineAssembly",
    duration: 5
  }
}

// Higher frame rate for smoother animation
{
  name: "animate_assembly",
  arguments: {
    assemblyName: "CrankSlider",
    duration: 10,
    frameRate: 60
  }
}
```

**Natural language examples:**
- "Animate the mechanism for 5 seconds"
- "Play full motion cycle"
- "Run the animation at 60 fps"

---

##### `stop_animation()`

Stop the currently running animation.

**Parameters:** None

**Response format:**
```json
{
  "success": true,
  "message": "Animation stopped"
}
```

**Example usage:**
```typescript
{
  name: "stop_animation",
  arguments: {}
}
```

**Natural language examples:**
- "Stop animation"
- "Halt the motion"
- "Stop the playback"

---

##### `get_animation_state()`

Get the current animation state.

**Parameters:** None

**Response format:**
```json
{
  "success": true,
  "isPlaying": false,
  "currentFrame": 75,
  "totalFrames": 150,
  "duration": 5.0,
  "message": "Animation state retrieved"
}
```

**Example usage:**
```typescript
{
  name: "get_animation_state",
  arguments: {}
}
```

**Natural language examples:**
- "Is animation playing?"
- "Current animation status"
- "What frame is the animation on?"

---

#### Analysis Tools

##### `get_kinematic_positions(assemblyName: string)`

Get all joint positions after solving.

**Parameters:**
- `assemblyName` (required): Name of the assembly

**Response format:**
```json
{
  "success": true,
  "assemblyName": "CrankSlider",
  "positions": [
    { "joint": "Crank", "value": 45.0, "unit": "deg" },
    { "joint": "Slider", "value": 25.4, "unit": "mm" },
    { "joint": "RockArm", "value": 22.6, "unit": "deg" }
  ],
  "message": "Kinematic positions retrieved"
}
```

**Example usage:**
```typescript
{
  name: "get_kinematic_positions",
  arguments: {
    assemblyName: "CrankSlider"
  }
}
```

**Natural language examples:**
- "Show all joint positions"
- "Current configuration"
- "What are the positions of all joints?"

---

##### `check_collision(assemblyName: string, duringMotion?: boolean)`

Check for collisions during motion.

**Parameters:**
- `assemblyName` (required): Name of the assembly to check
- `duringMotion` (optional): Whether to check during animation (default false)

**Response format:**
```json
{
  "success": true,
  "hasCollision": false,
  "collisionPairs": [],
  "message": "No collisions detected"
}
```

**Example usage:**
```typescript
// Static collision check
{
  name: "check_collision",
  arguments: {
    assemblyName: "EngineAssembly"
  }
}

// Check during animation
{
  name: "check_collision",
  arguments: {
    assemblyName: "EngineAssembly",
    duringMotion: true
  }
}
```

**Natural language examples:**
- "Check for collisions"
- "Any interference?"
- "Will parts collide during motion?"

---

#### Common Kinematic Workflows

**Workflow 1: Hinge Rotation**

```
1. Initialize solver: initialize_kinematic_solver({ assemblyName: "DoorAssembly" })
2. Set hinge angle: set_joint_value({ jointName: "Hinge", value: 45 })
3. Solve: solve_assembly({ assemblyName: "DoorAssembly" })
4. View positions: get_kinematic_positions({ assemblyName: "DoorAssembly" })
```

**Workflow 2: Slider Animation**

```
1. Initialize solver: initialize_kinematic_solver({ assemblyName: "CrankSlider" })
2. Create drive: drive_joint({ jointName: "Crank", startValue: 0, endValue: 360, duration: 2 })
3. Animate: animate_assembly({ assemblyName: "CrankSlider", duration: 2 })
4. Check state: get_animation_state({})
```

**Workflow 3: Range of Motion Analysis**

```
1. Initialize solver: initialize_kinematic_solver({ assemblyName: "RobotArm" })
2. Check DOF: check_degrees_of_freedom({ assemblyName: "RobotArm" })
3. Get joint limits: get_joint_limits({ jointName: "Joint1" })
4. Drive through range: drive_joint({ jointName: "Joint1", startValue: 0, endValue: 90, duration: 1 })
5. Check collision: check_collision({ assemblyName: "RobotArm", duringMotion: true })
```

**Workflow 4: Crank-Slider Mechanism**

```
1. Initialize solver: initialize_kinematic_solver({ assemblyName: "CrankSlider" })
2. Drive crank rotation: drive_joint({ jointName: "Crank", startValue: 0, endValue: 360, duration: 4 })
3. Animate: animate_assembly({ assemblyName: "CrankSlider", duration: 4 })
4. Get positions at each step: get_kinematic_positions({ assemblyName: "CrankSlider" })
```

---

### Rendering and Animation Tools

#### View Tools

##### `set_view_angle(viewName: "top" | "bottom" | "front" | "back" | "left" | "right" | "iso" | "home")`

Set viewport camera to a preset viewing angle.

**Parameters:**
- `viewName` (required): Preset view name

**Response format:**
```json
{
  "success": true,
  "viewName": "iso",
  "message": "View set to isometric"
}
```

**Example usage:**
```typescript
{
  name: "set_view_angle",
  arguments: {
    viewName: "iso"
  }
}
```

**Natural language examples:**
- "Set view to isometric"
- "Look from top"
- "Show front view"

---

##### `zoom_to_fit()`

Zoom the viewport to fit all visible objects in view.

**Parameters:** None

**Response format:**
```json
{
  "success": true,
  "message": "View zoomed to fit"
}
```

**Example usage:**
```typescript
{
  name: "zoom_to_fit",
  arguments: {}
}
```

**Natural language examples:**
- "Zoom to fit all objects"
- "Fit everything in view"

---

##### `set_camera_position(position: {x, y, z}, target?: {x, y, z})`

Set exact camera position and look-at target.

**Parameters:**
- `position` (required): Camera position as {x, y, z}
- `target` (optional): Look-at target as {x, y, z}, defaults to origin

**Response format:**
```json
{
  "success": true,
  "position": {"x": 100, "y": 100, "z": 50},
  "target": {"x": 0, "y": 0, "z": 0},
  "message": "Camera position set"
}
```

**Example usage:**
```typescript
{
  name: "set_camera_position",
  arguments: {
    position: { x: 100, y: 100, z: 50 }
  }
}

{
  name: "set_camera_position",
  arguments: {
    position: { x: 50, y: 50, z: 50 },
    target: { x: 0, y: 0, z: 0 }
  }
}
```

**Natural language examples:**
- "Position camera at 100,100,50"
- "View from angle looking at origin"

---

#### Render Tools

##### `render_view(outputPath: string, width?: number, height?: number, renderer?: "opengl" | "raytracing" | "embree")`

Render the current viewport view to an image file.

**Parameters:**
- `outputPath` (required): Path to output image file (.png, .jpg)
- `width` (optional): Image width in pixels (default 1920)
- `height` (optional): Image height in pixels (default 1080)
- `renderer` (optional): Renderer to use (default "opengl")

**Response format:**
```json
{
  "success": true,
  "outputPath": "/home/user/render.png",
  "width": 1920,
  "height": 1080,
  "message": "Rendered successfully"
}
```

**Example usage:**
```typescript
{
  name: "render_view",
  arguments: {
    outputPath: "~/render.png"
  }
}

{
  name: "render_view",
  arguments: {
    outputPath: "~/4k_render.png",
    width: 3840,
    height: 2160,
    renderer: "raytracing"
  }
}
```

**Natural language examples:**
- "Render to ~/render.png"
- "Export 4K raytraced image"
- "Take a screenshot"

---

##### `set_renderer(rendererName: "opengl" | "raytracing" | "embree")`

Select the rendering engine for viewport and exports.

**Parameters:**
- `rendererName` (required): Renderer name

**Response format:**
```json
{
  "success": true,
  "rendererName": "raytracing",
  "message": "Renderer set to raytracing"
}
```

**Example usage:**
```typescript
{
  name: "set_renderer",
  arguments: {
    rendererName: "raytracing"
  }
}
```

**Natural language examples:**
- "Use raytracing renderer"
- "Switch to Embree"

---

##### `set_render_quality(quality: "draft" | "medium" | "high" | "ultra")`

Set the render quality level for the current renderer.

**Parameters:**
- `quality` (required): Quality level

**Response format:**
```json
{
  "success": true,
  "quality": "high",
  "message": "Render quality set to high"
}
```

**Example usage:**
```typescript
{
  name: "set_render_quality",
  arguments: {
    quality: "high"
  }
}
```

**Natural language examples:**
- "Set high quality render"
- "Use draft mode for quick preview"

---

#### Material Tools

##### `set_object_material(objectName: string, materialName: string)`

Apply a material from the FreeCAD material database to an object.

**Parameters:**
- `objectName` (required): Name of the object to modify
- `materialName` (required): Name of material from FreeCAD material database

**Response format:**
```json
{
  "success": true,
  "objectName": "Box",
  "materialName": "Steel",
  "message": "Material applied"
}
```

**Example usage:**
```typescript
{
  name: "set_object_material",
  arguments: {
    objectName: "Box",
    materialName: "Steel"
  }
}
```

**Natural language examples:**
- "Apply steel to Box"
- "Use plastic material for Housing"

---

##### `set_object_color(objectName: string, color: {r, g, b, a?})`

Set the display color of an object.

**Parameters:**
- `objectName` (required): Name of the object to modify
- `color` (required): Color as {r, g, b, a} with values 0-255

**Response format:**
```json
{
  "success": true,
  "objectName": "Box",
  "message": "Color set"
}
```

**Example usage:**
```typescript
{
  name: "set_object_color",
  arguments: {
    objectName: "Box",
    color: { r: 255, g: 0, b: 0 }
  }
}

{
  name: "set_object_color",
  arguments: {
    objectName: "Sphere",
    color: { r: 0, g: 0, b: 255, a: 128 }
  }
}
```

**Natural language examples:**
- "Make it red"
- "Set color to blue with 50% transparency"

---

#### Lighting Tools

##### `configure_lighting(lightingType: "default" | "studio" | "outdoor" | "museum")`

Configure the scene lighting with a preset.

**Parameters:**
- `lightingType` (required): Lighting preset

**Response format:**
```json
{
  "success": true,
  "lightingType": "studio",
  "message": "Lighting configured"
}
```

**Example usage:**
```typescript
{
  name: "configure_lighting",
  arguments: {
    lightingType: "studio"
  }
}
```

**Natural language examples:**
- "Use studio lighting"
- "Set outdoor lighting"

---

#### Animation Export Tools

##### `start_animation_capture(outputDir: string, fps?: number)`

Start capturing animation frames to a directory.

**Parameters:**
- `outputDir` (required): Directory to save frames
- `fps` (optional): Frames per second (default 30)

**Response format:**
```json
{
  "success": true,
  "outputDir": "/tmp/anim",
  "fps": 30,
  "message": "Animation capture started"
}
```

**Example usage:**
```typescript
{
  name: "start_animation_capture",
  arguments: {
    outputDir: "/tmp/anim"
  }
}
```

**Natural language examples:**
- "Start capturing at 30fps"
- "Begin animation capture"

---

##### `capture_animation_frame()`

Capture a single frame during animation capture.

**Parameters:** None

**Response format:**
```json
{
  "success": true,
  "frameNumber": 1,
  "message": "Frame captured"
}
```

**Example usage:**
```typescript
{
  name: "capture_animation_frame",
  arguments: {}
}
```

**Natural language examples:**
- "Capture this frame"

---

##### `stop_animation_capture(outputPath: string, format: "mp4" | "gif" | "webm", quality?: "low" | "medium" | "high")`

Stop animation capture and encode to video file.

**Parameters:**
- `outputPath` (required): Output video file path
- `format` (required): Video format
- `quality` (optional): Video quality (default "high")

**Response format:**
```json
{
  "success": true,
  "outputPath": "~/video.mp4",
  "format": "mp4",
  "totalFrames": 150,
  "message": "Video exported"
}
```

**Example usage:**
```typescript
{
  name: "stop_animation_capture",
  arguments: {
    outputPath: "~/video.mp4",
    format: "mp4"
  }
}
```

**Natural language examples:**
- "Stop and save as video.mp4"
- "Export as GIF"

---

##### `export_animation(assemblyName: string, outputPath: string, format: "mp4" | "gif", duration: number, fps?: number)`

Export a complete animation from assembly in a single call.

**Parameters:**
- `assemblyName` (required): Name of the assembly to animate
- `outputPath` (required): Output video file path
- `format` (required): Video format
- `duration` (required): Animation duration in seconds
- `fps` (optional): Frames per second (default 30)

**Response format:**
```json
{
  "success": true,
  "outputPath": "~/robot.mp4",
  "format": "mp4",
  "duration": 5,
  "totalFrames": 150,
  "message": "Animation exported"
}
```

**Example usage:**
```typescript
{
  name: "export_animation",
  arguments: {
    assemblyName: "Robot",
    outputPath: "~/robot.mp4",
    format: "mp4",
    duration: 5
  }
}
```

**Natural language examples:**
- "Export animation as video.mp4"
- "Create 5-second GIF of mechanism"

---

#### Common Rendering and Animation Workflows

**Workflow 1: Render an Image**

```
1. Set view angle: set_view_angle({ viewName: "iso" })
2. Configure lighting: configure_lighting({ lightingType: "studio" })
3. Set material: set_object_material({ objectName: "Box", materialName: "Steel" })
4. Render: render_view({ outputPath: "~/render.png", width: 1920, height: 1080 })
```

**Workflow 2: Export Animation as Video**

```
1. Initialize solver: initialize_kinematic_solver({ assemblyName: "CrankSlider" })
2. Export animation: export_animation({ assemblyName: "CrankSlider", outputPath: "~/anim.mp4", format: "mp4", duration: 5 })
```

**Workflow 3: Manual Frame Capture**

```
1. Start capture: start_animation_capture({ outputDir: "/tmp/anim", fps: 30 })
2. Drive joint: drive_joint({ jointName: "Crank", startValue: 0, endValue: 360, duration: 4 })
3. For each frame: capture_animation_frame({})
4. Stop and encode: stop_animation_capture({ outputPath: "~/video.mp4", format: "mp4" })
```

**Workflow 4: Create GIF**

```
1. Export as GIF: export_animation({ assemblyName: "Motor", outputPath: "~/motor.gif", format: "gif", duration: 3 })
```

---

### Mesh Operation Tools

Mesh operations are essential for 3D printing workflows. These tools allow you to convert between CAD and mesh formats, perform boolean operations on meshes, repair and validate meshes, and export/import various mesh formats.

#### Mesh Conversion Tools

##### `shape_to_mesh(shapeName: string, meshName?: string)`

Converts a Part shape to a mesh object.

**Parameters:**
- `shapeName` (required): Name of the shape to convert
- `meshName` (optional): Name for the resulting mesh object

**Returns:**
- `success`: Whether conversion succeeded
- `meshName`: Name of the created mesh
- `triangleCount`: Number of triangles in the mesh
- `vertexCount`: Number of vertices

**Example:**
- Convert Box to mesh: `shape_to_mesh({ shapeName: "Box" })`

##### `mesh_to_shape(meshName: string, shapeName?: string)`

Converts a mesh object to a Part shape.

**Parameters:**
- `meshName` (required): Name of the mesh to convert
- `shapeName` (optional): Name for the resulting shape

**Returns:**
- `success`: Whether conversion succeeded
- `shapeName`: Name of the created shape
- `volume`: Volume of the solid shape

**Example:**
- Convert mesh to shape: `mesh_to_shape({ meshName: "Mesh" })`

#### Mesh Boolean Operations

##### `mesh_boolean_union(meshNames: string[], resultName?: string)`

Unions multiple meshes into a single mesh.

**Parameters:**
- `meshNames` (required): Array of mesh names to union
- `resultName` (optional): Name for the resulting mesh

**Returns:**
- `success`: Whether operation succeeded
- `resultMesh`: Name of the resulting mesh
- `triangleCount`: Number of triangles in result

**Example:**
- Union meshes: `mesh_boolean_union({ meshNames: ["Mesh1", "Mesh2"] })`

##### `mesh_boolean_difference(baseMesh: string, toolMeshes: string[], resultName?: string)`

Subtracts meshes from a base mesh (cuts holes).

**Parameters:**
- `baseMesh` (required): Name of the base mesh
- `toolMeshes` (required): Array of mesh names to subtract
- `resultName` (optional): Name for the resulting mesh

**Returns:**
- `success`: Whether operation succeeded
- `resultMesh`: Name of the resulting mesh
- `triangleCount`: Number of triangles in result

**Example:**
- Cut holes: `mesh_boolean_difference({ baseMesh: "Cube", toolMeshes: ["Cylinder"] })`

##### `mesh_boolean_intersection(meshNames: string[], resultName?: string)`

Intersects multiple meshes to find common volume.

**Parameters:**
- `meshNames` (required): Array of mesh names to intersect
- `resultName` (optional): Name for the resulting mesh

**Returns:**
- `success`: Whether operation succeeded
- `resultMesh`: Name of the resulting mesh
- `triangleCount`: Number of triangles in result

**Example:**
- Find overlap: `mesh_boolean_intersection({ meshNames: ["Mesh1", "Mesh2"] })`

#### Mesh Decimation and Optimization

##### `decimate_mesh(meshName: string, targetRatio: number, resultName?: string)`

Reduces mesh complexity by removing triangles.

**Parameters:**
- `meshName` (required): Name of the mesh to decimate
- `targetRatio` (required): Target reduction ratio (0.0 to 1.0), e.g., 0.5 = 50% of original
- `resultName` (optional): Name for the resulting mesh

**Returns:**
- `success`: Whether operation succeeded
- `originalTriangles`: Original triangle count
- `newTriangles`: New triangle count after decimation
- `reduction`: Actual reduction ratio achieved

**Example:**
- Decimate to 50%: `decimate_mesh({ meshName: "Mesh", targetRatio: 0.5 })`

##### `optimize_mesh(meshName: string, tolerance?: number, resultName?: string)`

Optimizes mesh topology and reduces file size.

**Parameters:**
- `meshName` (required): Name of the mesh to optimize
- `tolerance` (optional): Optimization tolerance
- `resultName` (optional): Name for the resulting mesh

**Returns:**
- `success`: Whether operation succeeded
- `resultMesh`: Name of the resulting mesh

**Example:**
- Optimize mesh: `optimize_mesh({ meshName: "Mesh" })`

#### Mesh Repair Tools

##### `repair_mesh(meshName: string, options?: { fixHoles?: boolean, fixNormals?: boolean, removeDuplicates?: boolean })`

Performs comprehensive mesh repair.

**Parameters:**
- `meshName` (required): Name of the mesh to repair
- `options` (optional): Object with repair options
  - `fixHoles`: Fill holes in the mesh
  - `fixNormals`: Correct face normals
  - `removeDuplicates`: Remove duplicate triangles

**Returns:**
- `success`: Whether repair succeeded
- `repairedMesh`: Name of the repaired mesh
- `fixesApplied`: Number of fixes applied

**Example:**
- Full repair: `repair_mesh({ meshName: "Mesh", options: { fixHoles: true, fixNormals: true, removeDuplicates: true } })`

##### `fill_holes(meshName: string, maxHoleSize?: number)`

Fills holes in a mesh to make it watertight.

**Parameters:**
- `meshName` (required): Name of the mesh
- `maxHoleSize` (optional): Maximum hole size to fill

**Returns:**
- `success`: Whether operation succeeded
- `filledMesh`: Name of the resulting mesh
- `holesFilled`: Number of holes filled

**Example:**
- Fill holes: `fill_holes({ meshName: "Mesh" })`

##### `fix_mesh_normals(meshName: string)`

Fixes face normals of a mesh.

**Parameters:**
- `meshName` (required): Name of the mesh

**Returns:**
- `success`: Whether operation succeeded
- `fixedMesh`: Name of the resulting mesh
- `normalsFixed`: Number of normals corrected

**Example:**
- Fix normals: `fix_mesh_normals({ meshName: "Mesh" })`

#### Mesh Validation Tools

##### `validate_mesh(meshName: string)`

Validates mesh integrity and checks for issues.

**Parameters:**
- `meshName` (required): Name of the mesh to validate

**Returns:**
- `success`: Whether validation completed
- `isValid`: Whether mesh is valid
- `issues`: Array of detected issues
- `triangleCount`: Number of triangles

**Example:**
- Validate mesh: `validate_mesh({ meshName: "Mesh" })`

##### `check_watertight(meshName: string)`

Checks if a mesh is watertight (closed, printable).

**Parameters:**
- `meshName` (required): Name of the mesh to check

**Returns:**
- `success`: Whether check completed
- `isWatertight`: Whether mesh is watertight
- `holesCount`: Number of holes detected

**Example:**
- Check watertight: `check_watertight({ meshName: "Mesh" })`

##### `get_mesh_info(meshName: string)`

Gets detailed information about a mesh.

**Parameters:**
- `meshName` (required): Name of the mesh

**Returns:**
- `success`: Whether operation succeeded
- `triangleCount`: Number of triangles
- `vertexCount`: Number of vertices
- `area`: Surface area
- `volume`: Volume (if closed)
- `bounds`: Bounding box dimensions

**Example:**
- Get mesh info: `get_mesh_info({ meshName: "Mesh" })`

#### Mesh Scale and Offset

##### `scale_mesh(meshName: string, scaleFactor: number, resultName?: string)`

Scales a mesh uniformly.

**Parameters:**
- `meshName` (required): Name of the mesh to scale
- `scaleFactor` (required): Scale factor (e.g., 2.0 = double size, 0.5 = half)
- `resultName` (optional): Name for the resulting mesh

**Returns:**
- `success`: Whether operation succeeded
- `scaledMesh`: Name of the resulting mesh
- `scaleFactor`: Applied scale factor
- `originalSize`: Original bounding box size
- `newSize`: New bounding box size

**Example:**
- Double size: `scale_mesh({ meshName: "Mesh", scaleFactor: 2.0 })`

##### `offset_mesh(meshName: string, offsetDistance: number, resultName?: string)`

Creates an offset (shell) mesh.

**Parameters:**
- `meshName` (required): Name of the mesh
- `offsetDistance` (required): Offset distance (positive = outward, negative = inward)
- `resultName` (optional): Name for the resulting mesh

**Returns:**
- `success`: Whether operation succeeded
- `offsetMesh`: Name of the resulting mesh
- `offsetDistance`: Applied offset distance
- `triangleCount`: Number of triangles in result

**Example:**
- Shell outward: `offset_mesh({ meshName: "Mesh", offsetDistance: 1.0 })`

#### Mesh Export Tools

##### `export_stl(meshName: string, outputPath: string, binary?: boolean, precision?: number)`

Exports a mesh to STL format for 3D printing.

**Parameters:**
- `meshName` (required): Name of the mesh to export
- `outputPath` (required): Full path for the output STL file
- `binary` (optional): Export as binary STL (default true), false for ASCII
- `precision` (optional): Angular deflection precision

**Returns:**
- `success`: Whether export succeeded
- `outputPath`: Path where file was saved
- `fileSize`: Size of the exported file
- `triangleCount`: Number of triangles exported

**Example:**
- Export STL: `export_stl({ meshName: "Mesh", outputPath: "C:/print.stl" })`

##### `export_3mf(meshName: string, outputPath: string)`

Exports a mesh to 3MF format (preserves colors and materials).

**Parameters:**
- `meshName` (required): Name of the mesh to export
- `outputPath` (required): Full path for the output 3MF file

**Returns:**
- `success`: Whether export succeeded
- `outputPath`: Path where file was saved
- `fileSize`: Size of the exported file
- `triangleCount`: Number of triangles exported

**Example:**
- Export 3MF: `export_3mf({ meshName: "Mesh", outputPath: "C:/print.3mf" })`

##### `export_obj(meshName: string, outputPath: string, includeMaterials?: boolean)`

Exports a mesh to OBJ format (Wavefront).

**Parameters:**
- `meshName` (required): Name of the mesh to export
- `outputPath` (required): Full path for the output OBJ file
- `includeMaterials` (optional): Include MTL material file (default true)

**Returns:**
- `success`: Whether export succeeded
- `outputPath`: Path where file was saved
- `fileSize`: Size of the exported file
- `triangleCount`: Number of triangles exported

**Example:**
- Export OBJ: `export_obj({ meshName: "Mesh", outputPath: "C:/model.obj" })`

##### `export_ply(meshName: string, outputPath: string)`

Exports a mesh to PLY format.

**Parameters:**
- `meshName` (required): Name of the mesh to export
- `outputPath` (required): Full path for the output PLY file

**Returns:**
- `success`: Whether export succeeded
- `outputPath`: Path where file was saved
- `fileSize`: Size of the exported file
- `triangleCount`: Number of triangles exported

**Example:**
- Export PLY: `export_ply({ meshName: "Mesh", outputPath: "C:/model.ply" })`

#### Mesh Import Tools

##### `import_stl(inputPath: string, meshName?: string)`

Imports an STL file as a mesh object.

**Parameters:**
- `inputPath` (required): Full path to the STL file to import
- `meshName` (optional): Name for the imported mesh object

**Returns:**
- `success`: Whether import succeeded
- `meshName`: Name of the imported mesh
- `triangleCount`: Number of triangles
- `vertexCount`: Number of vertices

**Example:**
- Import STL: `import_stl({ inputPath: "C:/part.stl" })`

##### `import_3mf(inputPath: string, meshName?: string)`

Imports a 3MF file as a mesh object (preserves colors and materials).

**Parameters:**
- `inputPath` (required): Full path to the 3MF file to import
- `meshName` (optional): Name for the imported mesh object

**Returns:**
- `success`: Whether import succeeded
- `meshName`: Name of the imported mesh
- `triangleCount`: Number of triangles
- `vertexCount`: Number of vertices

**Example:**
- Import 3MF: `import_3mf({ inputPath: "C:/part.3mf" })`

##### `import_obj(inputPath: string, meshName?: string)`

Imports an OBJ file as a mesh object.

**Parameters:**
- `inputPath` (required): Full path to the OBJ file to import
- `meshName` (optional): Name for the imported mesh object

**Returns:**
- `success`: Whether import succeeded
- `meshName`: Name of the imported mesh
- `triangleCount`: Number of triangles
- `vertexCount`: Number of vertices

**Example:**
- Import OBJ: `import_obj({ inputPath: "C:/model.obj" })`

#### Mesh Workflow Guidance

**3D Printing Preparation Workflow:**

```
1. Convert CAD to mesh: shape_to_mesh({ shapeName: "Body" })
2. Validate mesh: validate_mesh({ meshName: "Body_Mesh" })
3. Check watertight: check_watertight({ meshName: "Body_Mesh" })
4. If not watertight, repair: repair_mesh({ meshName: "Body_Mesh", options: { fixHoles: true } })
5. Decimate if needed: decimate_mesh({ meshName: "Body_Mesh", targetRatio: 0.5 })
6. Export for printing: export_stl({ meshName: "Body_Mesh", outputPath: "C:/print.stl" })
```

**Mesh Format Comparison:**

| Format | Best Use Case | Pros | Cons |
|--------|---------------|------|------|
| STL | 3D printing | Universal support, small file size | No colors/materials |
| 3MF | Full 3D printing metadata | Preserves colors, materials, metadata | Less universal |
| OBJ | Exchange with other software | Wide support, includes materials | Larger files |
| PLY | Point clouds, color data | Good for scanning data | Less common in CAD | 

---

### FEA (Finite Element Analysis) Tools

Perform static stress analysis with mesh generation, material assignment, boundary conditions, and results interpretation.

#### Analysis Management

##### `create_fea_analysis(analysisName?: string)`

Create a new FEA analysis container.

**Parameters:**
- `analysisName` (optional): Name for the new analysis

**Returns:**
- `success`: Whether creation succeeded
- `analysisName`: Name of the created analysis
- `analysisLabel`: Label of the analysis

**Example:**
- Create analysis: `create_fea_analysis({ analysisName: "StaticAnalysis" })`

##### `delete_fea_analysis(analysisName: string)`

Delete an FEA analysis and all its members.

**Parameters:**
- `analysisName` (required): Name of the analysis to delete

**Example:**
- Delete: `delete_fea_analysis({ analysisName: "StaticAnalysis" })`

##### `list_fea_analyses()`

List all FEA analyses in the active document.

**Example:**
- List all: `list_fea_analyses({})`

##### `get_fea_analysis(analysisName: string)`

Get detailed information about an FEA analysis.

**Parameters:**
- `analysisName` (required): Name of the analysis to query

**Returns:**
- `meshInfo`: Information about the mesh
- `memberCount`: Number of members (constraints, solver, etc.)
- `status`: Analysis status (Ready, Empty)

**Example:**
- Get info: `get_fea_analysis({ analysisName: "StaticAnalysis" })`

#### Mesh Generation

##### `create_fea_mesh(objectName: string, meshType?: string, maxSize?: number, secondOrder?: boolean)`

Create a FEM mesh from a shape object.

**Parameters:**
- `objectName` (required): Name of the shape object to mesh
- `meshType` (optional): Mesh generator type ("netgen" or "gmsh", default "netgen")
- `maxSize` (optional): Maximum element size (default 1.0)
- `secondOrder` (optional): Use second order elements (default false)

**Returns:**
- `meshName`: Name of the created mesh
- `nodeCount`: Number of nodes
- `elementCount`: Number of elements

**Example:**
- Create mesh: `create_fea_mesh({ objectName: "Box" })`
- Fine mesh: `create_fea_mesh({ objectName: "Box", maxSize: 0.5 })`

##### `refine_fea_mesh(meshName: string, refineLevel: number)`

Refine an existing FEM mesh by increasing density.

**Parameters:**
- `meshName` (required): Name of the mesh to refine
- `refineLevel` (required): Refinement level (1 = double, 2 = quadruple, etc.)

**Example:**
- Refine: `refine_fea_mesh({ meshName: "Box_Mesh", refineLevel: 1 })`

##### `get_fea_mesh_info(meshName: string)`

Get detailed mesh statistics.

**Parameters:**
- `meshName` (required): Name of the mesh to query

**Returns:**
- `nodeCount`, `elementCount`: Mesh statistics
- `elementTypes`: Object with counts of each element type

**Example:**
- Get info: `get_fea_mesh_info({ meshName: "Box_Mesh" })`

#### Material Assignment

##### `set_fea_material(objectName: string, materialName: string)`

Assign a material preset to an object.

**Parameters:**
- `objectName` (required): Name of the object
- `materialName` (required): Material preset name

**Example:**
- Assign steel: `set_fea_material({ objectName: "Box", materialName: "Steel" })`

##### `get_fea_material(objectName: string)`

Get the current material assignment.

**Parameters:**
- `objectName` (required): Name of the object to query

**Example:**
- Get material: `get_fea_material({ objectName: "Box" })`

#### Boundary Conditions (Constraints)

##### `add_fea_fixed_constraint(analysisName: string, faceReferences: string[])`

Add fixed boundary condition (constrains all translations).

**Parameters:**
- `analysisName` (required): Name of the analysis
- `faceReferences` (required): List of face references to fix

**Example:**
- Fix face: `add_fea_fixed_constraint({ analysisName: "StaticAnalysis", faceReferences: ["Face1"] })`

##### `add_fea_force_constraint(analysisName: string, faceReference: string, forceValue: number, forceDirection?: object)`

Apply a concentrated force to a face.

**Parameters:**
- `analysisName` (required): Name of the analysis
- `faceReference` (required): Face reference
- `forceValue` (required): Force in Newtons
- `forceDirection` (optional): Direction vector {x, y, z}

**Example:**
- Apply 1000N: `add_fea_force_constraint({ analysisName: "StaticAnalysis", faceReference: "Face1", forceValue: 1000 })`

##### `add_fea_pressure_constraint(analysisName: string, faceReference: string, pressureValue: number)`

Apply uniform pressure to a face.

**Parameters:**
- `analysisName` (required): Name of the analysis
- `faceReference` (required): Face reference
- `pressureValue` (required): Pressure in MPa

**Example:**
- Apply 10 MPa: `add_fea_pressure_constraint({ analysisName: "StaticAnalysis", faceReference: "Face1", pressureValue: 10 })`

##### `add_fea_displacement_constraint(analysisName: string, faceReference: string, x?: number, y?: number, z?: number)`

Add prescribed displacement boundary condition.

**Parameters:**
- `analysisName` (required): Name of the analysis
- `faceReference` (required): Face reference
- `x`, `y`, `z` (optional): Displacement value (0 = fixed)

**Example:**
- Fix only Z: `add_fea_displacement_constraint({ analysisName: "StaticAnalysis", faceReference: "Face1", z: 0 })`

##### `add_fea_self_weight(analysisName: string, gravity?: number)`

Add gravitational loading.

**Parameters:**
- `analysisName` (required): Name of the analysis
- `gravity` (optional): Gravity in m/s^2 (default 9.81)

**Example:**
- Add gravity: `add_fea_self_weight({ analysisName: "StaticAnalysis" })`

##### `list_fea_constraints(analysisName: string)`

List all constraints in an analysis.

**Parameters:**
- `analysisName` (required): Name of the analysis

**Example:**
- List: `list_fea_constraints({ analysisName: "StaticAnalysis" })`

#### Solver Configuration

##### `set_fea_solver(analysisName: string, solverType?: string)`

Set the solver type for an analysis.

**Parameters:**
- `analysisName` (required): Name of the analysis
- `solverType` (optional): "calculix" (default), "elmer", or "z88"

**Example:**
- Set solver: `set_fea_solver({ analysisName: "StaticAnalysis" })`

##### `configure_fea_solver(analysisName: string, config: object)`

Configure solver parameters.

**Parameters:**
- `analysisName` (required): Name of the analysis
- `config` (required): Configuration dictionary

**Example:**
- Configure: `configure_fea_solver({ analysisName: "StaticAnalysis", config: { analysis_type: "static" } })`

##### `get_fea_solver_status(analysisName: string)`

Get current solver status.

**Parameters:**
- `analysisName` (required): Name of the analysis

**Example:**
- Get status: `get_fea_solver_status({ analysisName: "StaticAnalysis" })`

#### Execution

##### `run_fea_analysis(analysisName: string)`

Run the FEA analysis.

**Parameters:**
- `analysisName` (required): Name of the analysis to run

**Example:**
- Run: `run_fea_analysis({ analysisName: "StaticAnalysis" })`

##### `stop_fea_analysis(analysisName: string)`

Stop a running analysis.

**Parameters:**
- `analysisName` (required): Name of the analysis to stop

**Example:**
- Stop: `stop_fea_analysis({ analysisName: "StaticAnalysis" })`

#### Results

##### `get_fea_displacement(analysisName: string)`

Get displacement results.

**Parameters:**
- `analysisName` (required): Name of the analysis

**Returns:**
- `maxDisplacement`: Maximum displacement magnitude
- `displacements`: Array of displacement vectors

**Example:**
- Get results: `get_fea_displacement({ analysisName: "StaticAnalysis" })`

##### `get_fea_stress(analysisName: string)`

Get von Mises stress results.

**Parameters:**
- `analysisName` (required): Name of the analysis

**Returns:**
- `maxVonMises`: Maximum von Mises stress
- `stressCount`: Number of stress values

**Example:**
- Get results: `get_fea_stress({ analysisName: "StaticAnalysis" })`

##### `get_fea_reactions(analysisName: string)`

Get reaction forces at constraints.

**Parameters:**
- `analysisName` (required): Name of the analysis

**Returns:**
- `totalForce`: Sum of all reaction forces
- `reactions`: Array of reaction force vectors

**Example:**
- Get results: `get_fea_reactions({ analysisName: "StaticAnalysis" })`

#### FEA Workflow Guidance

**Static Stress Analysis Workflow:**

```
1. Create analysis:
   create_fea_analysis({ analysisName: "StressAnalysis" })

2. Create mesh from shape:
   create_fea_mesh({ objectName: "Bracket", maxSize: 2.0 })

3. Assign material:
   set_fea_material({ objectName: "Bracket", materialName: "Steel" })

4. Add constraints (fixed faces):
   add_fea_fixed_constraint({ analysisName: "StressAnalysis", faceReferences: ["Face1"] })

5. Add loads (force or pressure):
   add_fea_force_constraint({ analysisName: "StressAnalysis", faceReference: "Face2", forceValue: 1000 })

6. Configure solver:
   set_fea_solver({ analysisName: "StressAnalysis", solverType: "calculix" })

7. Run analysis:
   run_fea_analysis({ analysisName: "StressAnalysis" })

8. Check results:
   - Displacement: get_fea_displacement({ analysisName: "StressAnalysis" })
   - Stress: get_fea_stress({ analysisName: "StressAnalysis" })
   - Reactions: get_fea_reactions({ analysisName: "StressAnalysis" })
```

**Material Properties:**

| Material | Young's Modulus (MPa) | Poisson's Ratio | Density (kg/mm³) | Yield Strength (MPa) |
|----------|----------------------|-----------------|------------------|---------------------|
| Steel    | 210000               | 0.30            | 7.85e-6          | 250                 |
| Aluminum | 70000                | 0.33            | 2.70e-6          | 270                 |
| Copper   | 130000               | 0.34            | 8.96e-6          | 33                  |
| Brass    | 100000               | 0.34            | 8.53e-6          | 180                 |
| Titanium | 110000               | 0.34            | 4.51e-6          | 140                 |
| Plastic  | 2200                 | 0.35            | 1.20e-6          | 50                  |

**Constraint Types Explained:**

| Constraint | Description | When to Use |
|------------|-------------|-------------|
| Fixed | Constrains all DOF (x, y, z translations) | Anchoring a part to ground |
| Force | Concentrated load in N | Point loads or distributed loads on small areas |
| Pressure | Distributed load in MPa | Loads spread over a face (fluid pressure, wind) |
| Displacement | Prescribed displacement or partial constraint | Roller supports, thermal expansion |
| Self-Weight | Gravity load (g=9.81 m/s²) | When body weight matters |

**Result Interpretation Guide:**

| Result | What It Shows | How to Interpret |
|--------|---------------|-----------------|
| Displacement | How much the part deforms | Check against design deflection limits |
| Von Mises Stress | Combined stress magnitude | Compare to yield strength for pass/fail |
| Reaction Forces | Forces at constraint locations | Should balance applied loads (verify equilibrium) |

**Pass/Fail Criteria:**

- **Displacement**: Design-dependent. Common rule: max displacement < L/200 where L is span length
- **Von Mises Stress**: PASS if max stress < yield strength (with safety factor). Common safety factors: 1.5 to 3.0
- **Reactions**: PASS if sum of reactions equals applied forces (within numerical tolerance)

**Common Pitfalls:**

1. **No mesh**: Analysis requires a FEM mesh - use `create_fea_mesh` first
2. **Unconstrained model**: Parts need fixed constraints to prevent rigid body motion
3. **Stress concentration**: Sharp corners cause high local stress - use fillets
4. **Units mismatch**: Ensure force (N) and pressure (MPa) are consistent
5. **Singular matrix**: Usually caused by improper constraints or unstable model
6. **Mesh too coarse**: May miss stress concentrations - refine mesh locally where needed
7. **Load units**: Remember FreeCAD uses N for force, MPa for pressure (1 MPa = 1 N/mm²)

---

### Export Tool (Legacy)

#### `export_model(filePath: string, format: string)`

Exports the current model to a file. (Use `export_to_format` for more options)

**Supported formats:** STEP, STL, OBJ, DXF, FCStd

---

### Error Handling Tools

The error handling tools help diagnose problems, suggest fixes, and recover from errors gracefully. They transform cryptic Python/FreeCAD errors into actionable guidance with context-aware recovery suggestions.

**Error Categories:**
| Category | Description |
|----------|-------------|
| `ATTRIBUTE_ERROR` | Object does not have the requested attribute |
| `TYPE_ERROR` | Wrong type for operation (e.g., string instead of number) |
| `VALUE_ERROR` | Invalid value provided to function |
| `REFERENCE_ERROR` | Referenced object not found in document |
| `CONSTRAINT_ERROR` | Geometric constraint conflict |
| `SOLVER_ERROR` | Sketch solver failed to converge |
| `BOOLEAN_ERROR` | Boolean operation failed |
| `DOCUMENT_ERROR` | Document operation failed |
| `PLACEMENT_ERROR` | Invalid placement/position |
| `EXPRESSION_ERROR` | Invalid expression syntax |
| `PERMISSION_ERROR` | Object is locked or read-only |
| `MEMORY_ERROR` | Insufficient memory for operation |

---

#### `parse_error(errorText: string)`

Parse Python/FreeCAD error text into structured data.

**Parameters:**
- `errorText` (required): Raw error text or traceback to parse

**Response format:**
```json
{
  "success": true,
  "errorType": "AttributeError",
  "errorMessage": "'Part' object has no attribute 'makeCuboid'",
  "parsedData": {
    "errorType": "AttributeError",
    "message": "'Part' object has no attribute 'makeCuboid'",
    "pythonError": true
  },
  "message": "Parsed error successfully"
}
```

**Example usage:**
```typescript
{
  name: "parse_error",
  arguments: {
    errorText: "Traceback (most recent call last):\n  File \"<input>\", line 1, in <module>\nAttributeError: 'Part' object has no attribute 'makeCuboid'"
  }
}
```

---

#### `categorize_error(errorText: string)`

Categorize error type based on error text.

**Parameters:**
- `errorText` (required): Raw error text to categorize

**Response format:**
```json
{
  "success": true,
  "category": "ATTRIBUTE_ERROR",
  "categoryDescription": "Object does not have the requested attribute",
  "confidence": "high",
  "message": "Error categorized as ATTRIBUTE_ERROR"
}
```

**Example usage:**
```typescript
{
  name: "categorize_error",
  arguments: {
    errorText: "AttributeError: 'Part' object has no attribute 'makeCuboid'"
  }
}
```

---

#### `extract_traceback_info(tracebackText: string)`

Extract file path, line number, and function name from a traceback.

**Parameters:**
- `tracebackText` (required): Python traceback text to analyze

**Response format:**
```json
{
  "success": true,
  "tracebackInfo": {
    "file": "/path/to/script.py",
    "line": 42,
    "function": "create_part",
    "codeSnippet": "Part.makeBox(10, 10, 10)"
  },
  "stackDepth": 3,
  "message": "Extracted traceback info"
}
```

**Example usage:**
```typescript
{
  name: "extract_traceback_info",
  arguments: {
    tracebackText: "Traceback (most recent call last):\n  File \"script.py\", line 42, in create_part\n    Part.makeBox(10, 10, 10)\nAttributeError: 'Part' object has no attribute 'makeCuboid'"
  }
}
```

---

#### `analyze_error_context(errorText: string, operationType: string)`

Analyze error in context of the operation that was attempted.

**Parameters:**
- `errorText` (required): Raw error text
- `operationType` (required): Type of operation that failed (e.g., "create_pad", "boolean_cut", "add_constraint")

**Response format:**
```json
{
  "success": true,
  "analysis": {
    "errorType": "SOLVER_ERROR",
    "operationType": "add_constraint",
    "likelyCauses": [
      "Sketch is over-constrained",
      "Conflicting constraints applied",
      "Geometry elements do not exist"
    ],
    "contextualAdvice": "Check sketch geometry and remove conflicting constraints"
  },
  "message": "Error analyzed in operation context"
}
```

**Example usage:**
```typescript
{
  name: "analyze_error_context",
  arguments: {
    errorText: "SolverException: Failed to solve sketch",
    operationType: "add_constraint"
  }
}
```

---

#### `get_recovery_suggestions(errorText: string, operation: string)`

Get suggested fixes based on error and operation type.

**Parameters:**
- `errorText` (required): Raw error text
- `operation` (required): The operation that failed (e.g., "create_pad", "move_object")

**Response format:**
```json
{
  "success": true,
  "suggestions": [
    {
      "action": "Check object existence",
      "description": "Verify the object exists before performing operations",
      "codeExample": "obj = FreeCAD.ActiveDocument.getObject('Box')\nif obj is None:\n    raise ValueError('Box not found')"
    },
    {
      "action": "Validate geometry",
      "description": "Ensure sketch geometry is valid before constraint operations",
      "codeExample": "# Run sketch.validate() before solving"
    }
  ],
  "primarySuggestion": "Check object existence",
  "message": "Generated 2 recovery suggestions"
}
```

**Example usage:**
```typescript
{
  name: "get_recovery_suggestions",
  arguments: {
    errorText: "ReferenceError: Object 'Box' not found",
    operation: "move_object"
  }
}
```

---

#### `validate_operation(objectName: string, operation: string)`

Validate that an operation can succeed before attempting it.

**Parameters:**
- `objectName` (required): Name of the object to validate
- `operation` (required): Operation to validate (e.g., "move", "rotate", "delete")

**Response format:**
```json
{
  "success": true,
  "validation": {
    "objectExists": true,
    "objectType": "Part::Feature",
    "operation": "move",
    "canProceed": true,
    "warnings": []
  },
  "message": "Operation validation passed"
}
```

**Example usage:**
```typescript
{
  name: "validate_operation",
  arguments: {
    objectName: "Box",
    operation: "move"
  }
}
```

---

#### `get_common_errors(operationType: string)`

Get common errors for a given operation type.

**Parameters:**
- `operationType` (required): Type of operation (e.g., "boolean_cut", "create_pad", "add_constraint")

**Response format:**
```json
{
  "success": true,
  "operationType": "boolean_cut",
  "commonErrors": [
    {
      "error": "Shapes do not intersect",
      "frequency": "high",
      "solutions": [
        "Reposition shapes so they overlap",
        "Check if one shape is on a hidden layer"
      ]
    },
    {
      "error": "Invalid shape for boolean",
      "frequency": "medium",
      "solutions": [
        "Validate shapes with validate_shape tool",
        "Heal shapes with heal_shape tool"
      ]
    }
  ],
  "errorCount": 2,
  "message": "Found 2 common errors for boolean_cut"
}
```

**Example usage:**
```typescript
{
  name: "get_common_errors",
  arguments: {
    operationType: "create_pad"
  }
}
```

---

#### `get_operation_history(count?: number)`

Get recent operations with their status.

**Parameters:**
- `count` (optional): Number of recent operations to retrieve. Default: 10

**Response format:**
```json
{
  "success": true,
  "operations": [
    {
      "id": 1,
      "operation": "create_pad",
      "objectName": "Sketch",
      "status": "success",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "operation": "boolean_cut",
      "objectName": "Box",
      "status": "failed",
      "error": "Shapes do not intersect",
      "timestamp": "2024-01-15T10:31:00Z"
    }
  ],
  "operationCount": 2,
  "message": "Retrieved 2 operations"
}
```

**Example usage:**
```typescript
{
  name: "get_operation_history",
  arguments: {
    count: 5
  }
}
```

---

#### `get_last_error()`

Get the most recent error details.

**Response format:**
```json
{
  "success": true,
  "lastError": {
    "operation": "boolean_cut",
    "errorType": "BOOLEAN_ERROR",
    "errorMessage": "Shapes do not intersect",
    "timestamp": "2024-01-15T10:31:00Z",
    "context": {
      "objects": ["Box", "Cylinder"]
    }
  },
  "message": "Retrieved last error"
}
```

**Example usage:**
```typescript
{
  name: "get_last_error",
  arguments: {}
}
```

---

#### `clear_error_history()`

Clear the error tracking history.

**Response format:**
```json
{
  "success": true,
  "clearedCount": 15,
  "message": "Cleared 15 entries from error history"
}
```

**Example usage:**
```typescript
{
  name: "clear_error_history",
  arguments: {}
}
```

---

#### `suggest_undo_strategy(objectName: string, failedOperation: string)`

Suggest an undo approach after a failed operation.

**Parameters:**
- `objectName` (required): Name of the object involved in the failed operation
- `failedOperation` (required): The operation that failed

**Response format:**
```json
{
  "success": true,
  "strategy": {
    "recommendedAction": "undo_last",
    "steps": [
      "Undo the last operation using FreeCAD.ActiveDocument.undo()",
      "Verify object state with get_object_properties",
      "Reattempt operation with corrected parameters"
    ],
    "alternativeActions": [
      "Delete and recreate the object if state is corrupted",
      "Use revert() to restore to last saved state"
    ]
  },
  "message": "Undo strategy suggested"
}
```

**Example usage:**
```typescript
{
  name: "suggest_undo_strategy",
  arguments: {
    objectName: "Box",
    failedOperation: "boolean_cut"
  }
}
```

---

#### `recover_from_validation_error(validationResult: object)`

Generate recovery code for validation failures.

**Parameters:**
- `validationResult` (required): The validation result object from `validate_operation`

**Response format:**
```json
{
  "success": true,
  "recoveryCode": "# Recovery code for validation failure\nobj = FreeCAD.ActiveDocument.getObject('Box')\nif obj is None:\n    obj = FreeCAD.ActiveDocument.addObject('Part::Feature', 'Box')\n    obj.Shape = Part.makeBox(10, 10, 10)",
  "actions": [
    "Create object if it does not exist",
    "Set default properties"
  ],
  "message": "Generated recovery code"
}
```

**Example usage:**
```typescript
{
  name: "recover_from_validation_error",
  arguments: {
    validationResult: {
      "objectExists": false,
      "operation": "move",
      "canProceed": false
    }
  }
}
```

---

#### `safe_retry(operation: string, parameters: object, maxAttempts?: number)`

Execute an operation with additional safety checks and retry logic.

**Parameters:**
- `operation` (required): The operation to perform
- `parameters` (required): Operation parameters
- `maxAttempts` (optional): Maximum retry attempts. Default: 3

**Response format:**
```json
{
  "success": true,
  "attempts": 1,
  "operation": "move_object",
  "parameters": {
    "objectName": "Box",
    "position": {"x": 50, "y": 50, "z": 0}
  },
  "result": {
    "objectName": "Box",
    "beforePosition": {"x": 0, "y": 0, "z": 0},
    "afterPosition": {"x": 50, "y": 50, "z": 0}
  },
  "message": "Operation succeeded on attempt 1"
}
```

**Example usage:**
```typescript
{
  name: "safe_retry",
  arguments: {
    operation: "move_object",
    parameters: {
      objectName: "Box",
      position: {"x": 50, "y": 50, "z": 0}
    },
    maxAttempts: 3
  }
}
```

---

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
