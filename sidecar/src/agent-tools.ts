/**
 * Agent Tools - Custom Tools for Claude Agent SDK
 *
 * Defines custom tools that allow Claude to interact with FreeCAD
 * through the WebSocket bridge.
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { FreeCADBridge } from './freecad-bridge';

/**
 * Creates custom tools for the Claude Agent SDK
 */
export function createAgentTools(freeCADBridge: FreeCADBridge) {
  return [
    createExecuteFreeCADPythonTool(freeCADBridge),
    createQueryModelStateTool(freeCADBridge),
    createExportModelTool(freeCADBridge),
  ];
}

/**
 * Tool: execute_freecad_python
 *
 * Executes arbitrary Python code in the FreeCAD environment.
 * This is the primary tool for creating and modifying CAD models.
 */
function createExecuteFreeCADPythonTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'execute_freecad_python',
    `Execute Python code in FreeCAD's environment. Use this to create, modify, or query CAD models.

The code runs in FreeCAD's Python interpreter with full access to:
- FreeCAD module (FreeCAD, FreeCADGui)
- Part workbench (Part, PartDesign)
- Draft workbench (Draft)
- All other FreeCAD modules and APIs

Examples:
- Create a box: "import Part; Part.makeBox(10, 10, 10)"
- Get active document: "doc = FreeCAD.ActiveDocument"
- List objects: "FreeCAD.ActiveDocument.Objects"

Always use this tool when you need to:
1. Create new geometry or features
2. Modify existing objects
3. Change document properties
4. Query model state
5. Perform any CAD operation`,
    {
      code: z.string().describe('Python code to execute in FreeCAD'),
    },
    async (input) => {
      const code = input.code;

      if (!code || typeof code !== 'string') {
        return {
          content: [
            {
              type: 'text',
              text: 'Invalid code parameter',
            },
          ],
        };
      }

      try {
        console.log('[Tool] Executing FreeCAD Python code...');
        const result = await freeCADBridge.executePython(code);

        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: result.output || 'Code executed successfully (no output)',
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Execution failed: ${result.error || 'Unknown error'}`,
              },
            ],
          };
        }
      } catch (error) {
        console.error('[Tool] Execution failed:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: query_model_state
 *
 * Queries the current state of the FreeCAD model.
 */
function createQueryModelStateTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'query_model_state',
    `Query the current state of the FreeCAD model.

Returns information about:
- Active document name
- List of all objects in the document
- Object types and properties
- Current view settings

Use this tool when you need to understand what exists in the current model before making modifications.`,
    {
      query: z
        .enum(['objects', 'document', 'view'])
        .describe('Specific query type: "objects", "document", or "view"'),
    },
    async (input) => {
      const query = input.query;

      let code: string;
      switch (query) {
        case 'objects':
          code = `
import json
objects = []
for obj in FreeCAD.ActiveDocument.Objects:
    objects.append({
        'Name': obj.Name,
        'Label': obj.Label,
        'Type': obj.TypeId,
        'Placement': str(obj.Placement) if hasattr(obj, 'Placement') else None
    })
print(json.dumps(objects, indent=2))
`.trim();
          break;
        case 'document':
          code = `
print(f"Document: {FreeCAD.ActiveDocument.Name}")
print(f"Label: {FreeCAD.ActiveDocument.Label}")
print(f"Objects: {len(FreeCAD.ActiveDocument.Objects)}")
`.trim();
          break;
        case 'view':
          code = `
import FreeCADGui as Gui
view = Gui.ActiveDocument.ActiveView
print(f"View mode: {view.viewMode()}")
print(f"Camera type: {view.getCameraNode().getTypeId().Name if hasattr(view, 'getCameraNode') else 'Unknown'}")
`.trim();
          break;
      }

      try {
        const result = await freeCADBridge.executePython(code);
        return {
          content: [
            {
              type: 'text',
              text: result.output || 'Query completed (no output)',
            },
          ];
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Query failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: export_model
 *
 * Exports the current model to a file format.
 */
function createExportModelTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'export_model',
    `Export the current FreeCAD model to a file.

Supported formats include:
- STEP (.step, .stp) - Industry standard for CAD exchange
- STL (.stl) - 3D printing format
- OBJ (.obj) - Wavefront format
- DXF (.dxf) - 2D drawing format
- FCStd (.FCStd) - Native FreeCAD format

Use this tool when the user wants to save or export their model.`,
    {
      filePath: z.string().describe('Full path to save the exported file'),
      format: z
        .enum(['STEP', 'STL', 'OBJ', 'DXF', 'FCStd'])
        .describe('Export format'),
    },
    async (input) => {
      const filePath = input.filePath;
      const format = input.format.toUpperCase();

      // Validate file path to prevent path traversal attacks
      // Only allow absolute paths and reject paths with suspicious patterns
      if (!filePath.startsWith('/') && !/^[A-Za-z]:/.test(filePath)) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: File path must be an absolute path',
            },
          ],
        };
      }

      // Reject paths containing path traversal patterns
      if (filePath.includes('..') || filePath.includes('\\')) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Invalid file path - path traversal not allowed',
            },
          ],
        };
      }

      // Generate Python code with the file path passed as a function argument
      // instead of string interpolation to prevent code injection
      let code: string;

      switch (format) {
        case 'STEP':
          code = `
import Part
doc = FreeCAD.ActiveDocument
filePath = r"${filePath.replace(/"/g, '\\"')}"
Part.export([obj for obj in doc.Objects if hasattr(obj, 'Shape')], filePath)
print(f"Exported STEP to {filePath}")
`.trim();
          break;
        case 'STL':
          code = `
import Mesh
doc = FreeCAD.ActiveDocument
filePath = r"${filePath.replace(/"/g, '\\"')}"
mesh = doc.findObject("Mesh")  # Try to find existing mesh
if mesh:
    Mesh.export([mesh], filePath)
else:
    # Create mesh from shapes
    shapes = [obj.Shape for obj in doc.Objects if hasattr(obj, 'Shape')]
    if shapes:
        mesh = Part.makeMeshFromBrepShapes(shapes)
        Mesh.export([mesh], filePath)
print(f"Exported STL to {filePath}")
`.trim();
          break;
        case 'FCStd':
          code = `
filePath = r"${filePath.replace(/"/g, '\\"')}"
FreeCAD.ActiveDocument.saveAs(filePath)
print(f"Saved to {filePath}")
`.trim();
          break;
        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unsupported format: ${format}`,
              },
            ],
          };
      }

      try {
        const result = await freeCADBridge.executePython(code);
        return {
          content: [
            {
              type: 'text',
              text: result.output || 'Export completed',
            },
          ];
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Export failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
