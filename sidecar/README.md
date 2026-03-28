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
