/**
 * Agent Tools - Custom Tools for Claude Agent SDK
 *
 * Defines custom tools that allow Claude to interact with FreeCAD
 * through the WebSocket bridge.
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { FreeCADBridge } from './freecad-bridge';
import {
  formatQueryResult,
  formatDocumentOverview,
  formatObjectList,
  formatObjectProperties,
  formatSelection,
  formatDependencies,
  formatDocumentInfo,
  formatPropertyChange,
  formatDimensionUpdate,
  formatTransformResult,
  formatExpressionResult,
  formatSketchResult,
  formatGeometryResult,
  formatConstraintResult,
  formatSketchGeometry,
} from './result-formatters';
import {
  validateFilePath,
  getSupportedFormats,
  sanitizeFileName,
} from './file-utils';
import {
  createSession,
  loadSession,
  saveSession,
  deleteSession,
  listSessions,
  addMessage,
  getMessages,
  autoNameSession,
  getSessionDir,
} from './session-manager';
import { ChatMessage } from './types';

// Global session state (managed externally, passed in when needed)
let currentSessionId: string | null = null;

/**
 * Set the current session ID
 */
export function setCurrentSessionId(sessionId: string | null): void {
  currentSessionId = sessionId;
}

/**
 * Get the current session ID
 */
export function getCurrentSessionId(): string | null {
  return currentSessionId;
}

/**
 * Creates custom tools for the Claude Agent SDK
 */
export function createAgentTools(freeCADBridge: FreeCADBridge) {
  return [
    createExecuteFreeCADPythonTool(freeCADBridge),
    createQueryModelStateTool(freeCADBridge),
    createExportModelTool(freeCADBridge),
    createListObjectsTool(freeCADBridge),
    createGetObjectPropertiesTool(freeCADBridge),
    createGetSelectionTool(freeCADBridge),
    createGetDocumentInfoTool(freeCADBridge),
    createSaveDocumentTool(freeCADBridge),
    createOpenDocumentTool(freeCADBridge),
    createExportToFormatTool(freeCADBridge),
    createListRecentDocumentsTool(freeCADBridge),
    createNewDocumentTool(freeCADBridge),
    // Parametric editing tools
    createSetObjectPropertyTool(freeCADBridge),
    createUpdateDimensionsTool(freeCADBridge),
    createMoveObjectTool(freeCADBridge),
    createRotateObjectTool(freeCADBridge),
    createScaleObjectTool(freeCADBridge),
    createSetExpressionTool(freeCADBridge),
    createGetExpressionTool(freeCADBridge),
    createClearExpressionTool(freeCADBridge),
    // Sketcher constraint tools
    createSketchTool(freeCADBridge),
    addGeometryTool(freeCADBridge),
    addGeometricConstraintTool(freeCADBridge),
    addDimensionalConstraintTool(freeCADBridge),
    setConstraintValueTool(freeCADBridge),
    listSketchConstraintsTool(freeCADBridge),
    deleteConstraintTool(freeCADBridge),
    getSketchGeometryTool(freeCADBridge),
    // Session management tools
    createSaveChatSessionTool(),
    createLoadChatSessionTool(),
    createListChatSessionsTool(),
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
 * Queries the current state of the FreeCAD model with specific intent.
 */
function createQueryModelStateTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'query_model_state',
    `Query the current state of the FreeCAD model with a specific intent.

Parameters:
- intent (required): Type of query - "document_overview", "object_details", "selection", or "dependencies"
- objectName (optional): Name of specific object for object_details or dependencies queries

Returns structured JSON with:
- Document overview: All objects with names, types, visibility
- Object details: Placement, dimensions, color, properties
- Selection: Currently selected objects in viewport
- Dependencies: Parent-child relationships between objects

Use this tool when you need structured information about the model state before making modifications.`,
    {
      intent: z
        .enum(['document_overview', 'object_details', 'selection', 'dependencies'])
        .describe('Type of query to perform'),
      objectName: z
        .string()
        .optional()
        .describe('Object name for object_details or dependencies queries'),
    },
    async (input) => {
      const intent = input.intent;
      const objectName = input.objectName;

      let code: string;
      switch (intent) {
        case 'document_overview':
          code = `
from llm_bridge.query_handlers import handle_document_overview
import json
result = handle_document_overview()
print(json.dumps(result))
`.trim();
          break;
        case 'object_details':
          if (!objectName) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Error: objectName is required for object_details query',
                },
              ],
            };
          }
          code = `
from llm_bridge.query_handlers import handle_object_details
import json
result = handle_object_details(r"${objectName.replace(/"/g, '\\"')}")
print(json.dumps(result))
`.trim();
          break;
        case 'selection':
          code = `
from llm_bridge.query_handlers import handle_selection
import json
result = handle_selection()
print(json.dumps(result))
`.trim();
          break;
        case 'dependencies':
          if (!objectName) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Error: objectName is required for dependencies query',
                },
              ],
            };
          }
          code = `
from llm_bridge.query_handlers import handle_dependencies
import json
result = handle_dependencies(r"${objectName.replace(/"/g, '\\"')}")
print(json.dumps(result))
`.trim();
          break;
      }

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        
        // Format based on intent
        let formatted: string;
        if (!parsed.success) {
          formatted = `Error: ${parsed.error}`;
        } else {
          switch (intent) {
            case 'document_overview':
              formatted = formatDocumentOverview(parsed.data);
              break;
            case 'object_details':
              formatted = formatObjectProperties(parsed.data);
              break;
            case 'selection':
              formatted = formatSelection(parsed.data);
              break;
            case 'dependencies':
              formatted = formatDependencies(parsed.data);
              break;
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: formatted,
            },
          ],
        };
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
          ],
        };
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

/**
 * Tool: list_objects
 *
 * Lists all objects in the active FreeCAD document.
 */
function createListObjectsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_objects',
    `List all objects in the active FreeCAD document.

Returns:
- Array of objects with name, label, type, and visibility
- Total object count

Use this tool when you need to see what objects exist in the current document before performing operations on them.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.query_handlers import handle_list_objects
import json
result = handle_list_objects()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatObjectList(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: get_object_properties
 *
 * Gets detailed properties of a specific object.
 */
function createGetObjectPropertiesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_object_properties',
    `Get detailed properties of a specific object in the FreeCAD document.

Parameters:
- objectName (required): Name of the object to query

Returns:
- Object type and label
- Placement (position and rotation)
- Dimensions (bounding box, volume, area)
- Color
- Other shape-specific properties (radius, length, etc.)

Use this tool when you need to know the exact properties of an object before modifying it or creating related geometry.`,
    {
      objectName: z.string().describe('Name of the object to query'),
    },
    async (input) => {
      const objectName = input.objectName;

      const code = `
from llm_bridge.query_handlers import handle_get_object_properties
import json
result = handle_get_object_properties(r"${objectName.replace(/"/g, '\\"')}")
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatObjectProperties(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: get_selection
 *
 * Gets currently selected objects in the viewport.
 */
function createGetSelectionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_selection',
    `Get the currently selected objects in the FreeCAD viewport.

Returns:
- Array of selected objects with name, label, and type
- Selection count

Use this tool when you need to know what the user has selected, or when performing operations on the current selection.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.query_handlers import handle_selection
import json
result = handle_selection()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSelection(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: get_document_info
 *
 * Gets document metadata.
 */
function createGetDocumentInfoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_document_info',
    `Get metadata about the active FreeCAD document.

Returns:
- Document name and label
- Object count
- Modified status
- File path (if saved)

Use this tool when you need to understand the current document context, check if changes have been saved, or get the document's file path.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.query_handlers import handle_get_document_info
import json
result = handle_get_document_info()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatDocumentInfo(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: save_document
 *
 * Save the current FreeCAD document.
 */
function createSaveDocumentTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'save_document',
    `Save the current FreeCAD document to a file in native FreeCAD format.

NOTE: This tool only supports native FreeCAD formats (FCStd, FCBak). For exporting to other CAD formats like STEP, STL, OBJ, etc., use the 'export_to_format' tool instead.

Parameters:
- filePath (optional): Full path to save the document. If omitted, saves to current document path.
- format (optional): Save format - "FCStd" (default, compressed) or "FCBak" (uncompressed backup)

Returns:
- success: Whether the save was successful
- filePath: Path where the document was saved
- message: Status message

Use this tool when the user wants to save their FreeCAD work in native format. Always confirm the file path with the user if not specified.

Example:
- Save to specific location: { filePath: "C:/Users/John/Desktop/part.FCStd" }
- Save with backup format: { filePath: "C:/backup.FCBAK", format: "FCBak" }`,
    {
      filePath: z.string().optional().describe('Full path to save the document'),
      format: z.enum(['FCStd', 'FCBak']).optional().describe('Save format (default: FCStd)'),
    },
    async (input) => {
      const filePath = input.filePath;
      const format = input.format || 'FCStd';

      // Validate file path if provided
      if (filePath) {
        const validation = validateFilePath(filePath);
        if (!validation.isValid) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${validation.error}`,
              },
            ],
          };
        }
      }

      // Generate Python code with parameters passed safely via JSON to prevent injection
      const code = `
from llm_bridge.file_handlers import handle_save_document
import json
params = json.loads('${JSON.stringify({ filePath: filePath || null, format })}')
result = handle_save_document(file_path=params['filePath'], format=params['format'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        
        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Saved: ${parsed.filePath}\n${parsed.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Save failed: ${parsed.error}`,
              },
            ],
          };
        }
      } catch (error) {
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
 * Tool: open_document
 *
 * Open an existing CAD file in FreeCAD.
 */
function createOpenDocumentTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'open_document',
    `Open an existing CAD file in FreeCAD.

Parameters:
- filePath (required): Full path to the file to open

Supported formats:
- FCStd, FCBak (FreeCAD native)
- STEP, STP (Industry standard)
- IGES, IGS (CAD exchange)
- STL (3D printing)
- OBJ (3D geometry)
- DXF, DWG (2D drawings)

Returns:
- success: Whether the open was successful
- documentName: Internal name of the opened document
- documentLabel: User-friendly label
- objectCount: Number of objects in the document
- message: Status message

Use this tool when the user wants to open an existing CAD file. Always verify the file exists and has a supported format.

Example:
- Open a Part file: { filePath: "C:/Projects/part.FCStd" }
- Open a STEP file: { filePath: "C:/Imports/assembly.step" }`,
    {
      filePath: z.string().describe('Full path to the CAD file to open'),
    },
    async (input) => {
      const filePath = input.filePath;

      // Validate file path
      const validation = validateFilePath(filePath);
      if (!validation.isValid) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${validation.error}`,
            },
          ],
        };
      }

      const code = `
from llm_bridge.file_handlers import handle_open_document
import json
params = json.loads('${JSON.stringify({ filePath })}')
result = handle_open_document(file_path=params['filePath'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        
        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Opened: ${parsed.documentLabel} (${parsed.documentName})\nObjects: ${parsed.objectCount}\n${parsed.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Open failed: ${parsed.error}`,
              },
            ],
          };
        }
      } catch (error) {
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
 * Tool: export_to_format
 *
 * Export the current model to a specific CAD format.
 */
function createExportToFormatTool(freeCADBridge: FreeCADBridge) {
  const formats = getSupportedFormats();
  const exportFormats = formats.filter(f => f.canExport);
  const formatList = exportFormats.map(f => f.format).join(', ');

  return tool(
    'export_to_format',
    `Export the current FreeCAD model to a specific CAD format.

NOTE: Use this tool for exporting to exchange formats (STEP, IGES, STL, OBJ, DXF) or when you need a different format than native FreeCAD. For saving in native FreeCAD format only, use 'save_document' instead.

Parameters:
- filePath (required): Full path to export the file to
- format (required): Export format - ${formatList}

Format descriptions:
- STEP: Industry standard for CAD data exchange (recommended for manufacturing)
- IGES: Older CAD exchange format
- STL: 3D printing format (mesh)
- OBJ: 3D geometry format (mesh)
- DXF: 2D drawing format
- FCStd: Native FreeCAD format
- FCBak: FreeCAD backup format (uncompressed)

Returns:
- success: Whether the export was successful
- filePath: Path where the file was exported
- format: The export format used
- message: Status message

Use this tool when the user wants to export their model for sharing, manufacturing, or 3D printing.

Example:
- Export for 3D printing: { filePath: "C:/Exports/part.stl", format: "STL" }
- Export for manufacturing: { filePath: "C:/Exports/part.step", format: "STEP" }`,
    {
      filePath: z.string().describe('Full path to export the file to'),
      format: z.enum(['STEP', 'IGES', 'STL', 'OBJ', 'DXF', 'FCStd', 'FCBak']).describe('Export format'),
    },
    async (input) => {
      const filePath = input.filePath;
      const format = input.format;

      // Validate file path
      const validation = validateFilePath(filePath);
      if (!validation.isValid) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${validation.error}`,
            },
          ],
        };
      }

      const code = `
from llm_bridge.file_handlers import handle_export_to_format
import json
params = json.loads('${JSON.stringify({ filePath, format })}')
result = handle_export_to_format(file_path=params['filePath'], format=params['format'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        
        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Exported as ${parsed.format}: ${parsed.filePath}\n${parsed.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Export failed: ${parsed.error}`,
              },
            ],
          };
        }
      } catch (error) {
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
 * Tool: list_recent_documents
 *
 * List recently opened CAD files.
 */
function createListRecentDocumentsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_recent_documents',
    `List recently opened CAD files from FreeCAD's history.

Parameters: None

Returns:
- count: Number of recent files found
- files: Array of file objects with path, name, and index
- message: Status message

Use this tool when the user wants to see their recently opened files or find a file they worked on previously.

Example:
- List recent files: {}`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.file_handlers import handle_list_recent_documents
import json
result = handle_list_recent_documents()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        
        if (parsed.success) {
          let output = `Recent Documents: ${parsed.count}\n\n`;
          if (parsed.files && parsed.files.length > 0) {
            for (const file of parsed.files) {
              output += `${file.index + 1}. ${file.name}\n   ${file.path}\n`;
            }
          } else {
            output += '(No recent documents found)';
          }
          return {
            content: [
              {
                type: 'text',
                text: output,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to list recent documents: ${parsed.error}`,
              },
            ],
          };
        }
      } catch (error) {
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
 * Tool: create_new_document
 *
 * Create a new empty FreeCAD document.
 */
function createNewDocumentTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_new_document',
    `Create a new empty FreeCAD document.

Parameters:
- name (optional): Name for the new document. If omitted, FreeCAD will auto-generate a name.
- type (optional): Document type - "Part" (default), "Assembly", or "Sketch"

Returns:
- success: Whether the document was created
- documentName: Internal name of the new document
- documentLabel: User-friendly label
- message: Status message

Use this tool when the user wants to start a new design or clear the current workspace.

Example:
- Create default Part document: {}
- Create named document: { name: "MyPart", type: "Part" }
- Create Assembly document: { name: "Assembly1", type: "Assembly" }`,
    {
      name: z.string().optional().describe('Name for the new document'),
      type: z.enum(['Part', 'Assembly', 'Sketch']).optional().describe('Document type (default: Part)'),
    },
    async (input) => {
      const name = input.name;
      const type = input.type || 'Part';

      // Sanitize document name if provided
      const sanitizedName = name ? sanitizeFileName(name) : undefined;

      const code = `
from llm_bridge.file_handlers import handle_create_new_document
import json
params = json.loads('${JSON.stringify({ name: sanitizedName || null, type })}')
result = handle_create_new_document(name=params['name'], doc_type=params['type'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Created: ${parsed.documentLabel} (${parsed.documentName})\n${parsed.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create document: ${parsed.error}`,
              },
            ],
          };
        }
      } catch (error) {
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
 * Tool: save_chat_session
 *
 * Save the current conversation session to disk.
 */
function createSaveChatSessionTool() {
  return tool(
    'save_chat_session',
    `Save the current conversation session to disk for later retrieval.

Parameters:
- name (optional): Custom name for the session. If omitted, auto-generates from first message.
- includeToolHistory (optional): Whether to include tool call history. Default: true.

Returns:
- success: Whether the save was successful
- sessionId: Unique identifier for the session
- filePath: Path where the session was saved
- message: Status message

Use this tool when the user wants to save their conversation for later resumption.`,
    {
      name: z.string().optional().describe('Custom name for the session'),
      includeToolHistory: z.boolean().optional().default(true).describe('Include tool call history'),
    },
    async (input) => {
      try {
        const sessionId = currentSessionId;
        if (!sessionId) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: No active session to save. Start a new conversation first.',
              },
            ],
          };
        }

        const session = loadSession(sessionId);
        if (!session) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: Session not found.',
              },
            ],
          };
        }

        // Update name if provided
        if (input.name) {
          session.name = input.name;
        } else if (session.name === 'Untitled Session') {
          autoNameSession(sessionId);
        }

        // Filter tool history if not included
        if (!input.includeToolHistory) {
          session.messages = session.messages.map(msg => ({
            ...msg,
            toolCalls: undefined,
            toolResults: undefined,
          }));
        }

        saveSession(session);

        return {
          content: [
            {
              type: 'text',
              text: `Session saved: ${session.name}\nSession ID: ${sessionId}\nMessages: ${session.messages.length}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Save failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: load_chat_session
 *
 * Load a saved conversation session.
 */
function createLoadChatSessionTool() {
  return tool(
    'load_chat_session',
    `Load a previously saved conversation session.

Parameters:
- sessionId (required): The unique identifier of the session to load.

Returns:
- success: Whether the load was successful
- sessionName: Name of the loaded session
- messageCount: Number of messages in the session
- documentPath: Associated CAD file path (if any)
- message: Status message

Use this tool when the user wants to resume a previous conversation.`,
    {
      sessionId: z.string().describe('The unique identifier of the session to load'),
    },
    async (input) => {
      try {
        const session = loadSession(input.sessionId);
        if (!session) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Session '${input.sessionId}' not found.`,
              },
            ],
          };
        }

        // Update current session
        setCurrentSessionId(session.id);

        return {
          content: [
            {
              type: 'text',
              text: `Loaded session: ${session.name}\nMessages: ${session.messages.length}\nCreated: ${new Date(session.createdAt).toLocaleString()}${session.documentPath ? `\nDocument: ${session.documentPath}` : ''}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Load failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: list_chat_sessions
 *
 * List available saved conversation sessions.
 */
function createListChatSessionsTool() {
  return tool(
    'list_chat_sessions',
    `List all available saved conversation sessions.

Parameters:
- limit (optional): Maximum number of sessions to return. Default: 10.

Returns:
- Array of session summaries with sessionId, name, createdAt, updatedAt, messageCount

Use this tool when the user wants to see their saved conversations or find a specific session to load.`,
    {
      limit: z.number().optional().default(10).describe('Maximum number of sessions to list'),
    },
    async (input) => {
      try {
        const sessions = listSessions(input.limit);

        if (sessions.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No saved sessions found.',
              },
            ],
          };
        }

        let output = `Saved Sessions (${sessions.length}):\n\n`;
        for (const session of sessions) {
          const date = new Date(session.updatedAt).toLocaleString();
          output += `- **${session.name}**\n`;
          output += `  ID: ${session.id}\n`;
          output += `  Messages: ${session.messageCount}\n`;
          output += `  Updated: ${date}\n`;
          if (session.documentPath) {
            output += `  Document: ${session.documentPath}\n`;
          }
          output += '\n';
        }

        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `List failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: set_object_property
 *
 * Set a single property on an object to a specific value.
 */
function createSetObjectPropertyTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_object_property',
    `Set a single property on an object to a specific value.

Parameters:
- objectName (required): Name of the object to modify (e.g., "Box", "Cylinder001")
- propertyName (required): Name of the property to set (e.g., "Length", "Radius", "Height")
- value (required): Value to set. Can be:
  - Numeric value (e.g., 50)
  - String with units (e.g., "50mm", "90deg", "2.5m")

Supported units:
- Length: mm, cm, m, in, ft (internal unit: mm)
- Angle: deg, rad, grad (internal unit: radians)

Common properties by object type:
- Part::Box: Length, Width, Height
- Part::Cylinder: Radius, Height, Angle
- Part::Sphere: Radius, Angle1, Angle2, Angle3
- Part::Cone: Radius1, Radius2, Height
- Part::Torus: Radius1, Radius2

Use this tool when you need to modify a single property of an existing object.`,
    {
      objectName: z.string().describe('Name of the object to modify'),
      propertyName: z.string().describe('Name of the property to set'),
      value: z.union([z.string(), z.number()]).describe('Value to set (number or string with units)'),
    },
    async (input) => {
      const { objectName, propertyName, value } = input;

      const code = `
from llm_bridge.property_handlers import handle_set_object_property
import json
params = json.loads('${JSON.stringify({ objectName, propertyName, value })}')
result = handle_set_object_property(
    object_name=params['objectName'],
    property_name=params['propertyName'],
    value=params['value']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatPropertyChange(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: update_dimensions
 *
 * Update multiple dimensional properties at once.
 */
function createUpdateDimensionsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'update_dimensions',
    `Update multiple dimensional properties at once. Useful for resizing objects with a single command.

Parameters:
- objectName (required): Name of the object to modify
- dimensions (required): Object mapping property names to values, e.g., {"Length": "100mm", "Width": "50mm"}

Use this tool when you need to update multiple dimensions of an object simultaneously.`,
    {
      objectName: z.string().describe('Name of the object to modify'),
      dimensions: z.record(z.union([z.string(), z.number()])).describe('Object mapping property names to values'),
    },
    async (input) => {
      const { objectName, dimensions } = input;

      const code = `
from llm_bridge.property_handlers import handle_update_dimensions
import json
params = json.loads('${JSON.stringify({ objectName, dimensions })}')
result = handle_update_dimensions(
    object_name=params['objectName'],
    dimensions=params['dimensions']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatDimensionUpdate(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: move_object
 *
 * Reposition an object to a new location.
 */
function createMoveObjectTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'move_object',
    `Reposition an object to a new location. Supports both absolute positioning and relative offsets.

Parameters:
- objectName (required): Name of the object to move
- position (optional): Absolute target position as {x, y, z} coordinates in mm
- offset (optional): Relative offset as {x, y, z} in mm
- relative (optional): If true, treats position as an offset. Default: false

Note: Either position or offset must be provided. The object's rotation is preserved.

Use this tool when you need to move an object to a different location.`,
    {
      objectName: z.string().describe('Name of the object to move'),
      position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Absolute target position'),
      offset: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Relative offset'),
      relative: z.boolean().optional().default(false).describe('If true, treats position as an offset'),
    },
    async (input) => {
      const { objectName, position, offset, relative } = input;

      const code = `
from llm_bridge.property_handlers import handle_move_object
import json
params = json.loads('${JSON.stringify({ objectName, position, offset, relative })}')
result = handle_move_object(
    object_name=params['objectName'],
    position=params.get('position'),
    offset=params.get('offset'),
    relative=params.get('relative', False)
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatTransformResult(parsed.data, 'move');
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: rotate_object
 *
 * Rotate an object around a specified axis.
 */
function createRotateObjectTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'rotate_object',
    `Rotate an object around a specified axis.

Parameters:
- objectName (required): Name of the object to rotate
- angle (required): Rotation angle. Can be:
  - Numeric value in radians
  - String with units: "90deg", "45deg", "1.5rad"
- axis (optional): Axis of rotation as {x, y, z}. Default: {x: 0, y: 0, z: 1} (Z-axis)
- center (optional): Center point of rotation as {x, y, z}. Default: object's current position

Use this tool when you need to rotate an object.`,
    {
      objectName: z.string().describe('Name of the object to rotate'),
      angle: z.union([z.string(), z.number()]).describe('Rotation angle (number in radians or string with units)'),
      axis: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Axis of rotation'),
      center: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Center point of rotation'),
    },
    async (input) => {
      const { objectName, angle, axis, center } = input;

      const code = `
from llm_bridge.property_handlers import handle_rotate_object
import json
params = json.loads('${JSON.stringify({ objectName, angle, axis, center })}')
result = handle_rotate_object(
    object_name=params['objectName'],
    angle=params['angle'],
    axis=params.get('axis'),
    center=params.get('center')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatTransformResult(parsed.data, 'rotate');
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: scale_object
 *
 * Scale an object uniformly or non-uniformly.
 */
function createScaleObjectTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'scale_object',
    `Scale an object uniformly or non-uniformly.

Parameters:
- objectName (required): Name of the object to scale
- scale (optional): Uniform scale factor (e.g., 2.0 for 2x size, 0.5 for half size)
- scale_x, scale_y, scale_z (optional): Non-uniform scale factors for each axis
- uniform (optional): If true, applies uniform scaling. Default: true

Note: Either scale or individual scale_x/scale_y/scale_z must be provided.

Use this tool when you need to resize an object.`,
    {
      objectName: z.string().describe('Name of the object to scale'),
      scale: z.union([z.string(), z.number()]).optional().describe('Uniform scale factor (e.g., 2.0 for 2x size, 0.5 for half size)'),
      scale_x: z.union([z.string(), z.number()]).optional().describe('Scale factor for X axis'),
      scale_y: z.union([z.string(), z.number()]).optional().describe('Scale factor for Y axis'),
      scale_z: z.union([z.string(), z.number()]).optional().describe('Scale factor for Z axis'),
      uniform: z.boolean().optional().default(true).describe('If true, applies uniform scaling'),
    },
    async (input) => {
      const { objectName, scale, scale_x, scale_y, scale_z, uniform } = input;

      const code = `
from llm_bridge.property_handlers import handle_scale_object
import json
params = json.loads('${JSON.stringify({ objectName, scale, scale_x, scale_y, scale_z, uniform })}')
result = handle_scale_object(
    object_name=params['objectName'],
    scale=params.get('scale'),
    scale_x=params.get('scale_x'),
    scale_y=params.get('scale_y'),
    scale_z=params.get('scale_z'),
    uniform=params.get('uniform', True)
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatTransformResult(parsed.data, 'scale');
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: set_expression
 *
 * Create a parametric relationship by setting an expression on a property.
 */
function createSetExpressionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_expression',
    `Create a parametric relationship by setting an expression on a property.

Parameters:
- objectName (required): Name of the object
- propertyName (required): Property to set expression on (e.g., "Length", "Radius")
- expression (required): Expression string. Can reference other properties using syntax like "Body.Box.Length * 2" or "50mm"

Expression syntax:
- Reference another object's property: "ObjectName.PropertyName"
- Mathematical operations: +, -, *, /, ^ (power)
- Functions: sin(), cos(), tan(), sqrt(), abs(), etc.
- Constants: PI, e
- Units: Append units like "50mm", "90deg"

Use this tool when you want to create parametric relationships between objects.`,
    {
      objectName: z.string().describe('Name of the object'),
      propertyName: z.string().describe('Property to set expression on'),
      expression: z.string().describe('Expression string'),
    },
    async (input) => {
      const { objectName, propertyName, expression } = input;

      const code = `
from llm_bridge.property_handlers import handle_set_expression
import json
params = json.loads('${JSON.stringify({ objectName, propertyName, expression })}')
result = handle_set_expression(
    object_name=params['objectName'],
    property_name=params['propertyName'],
    expression=params['expression']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatExpressionResult(parsed.data, 'set');
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: get_expression
 *
 * Query existing expressions on an object.
 */
function createGetExpressionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_expression',
    `Query existing expressions on an object. Returns expression information for a specific property or all properties with expressions.

Parameters:
- objectName (required): Name of the object
- propertyName (optional): Specific property to query. If omitted, returns all expressions on the object.

Use this tool when you want to check what expressions are set on an object.`,
    {
      objectName: z.string().describe('Name of the object'),
      propertyName: z.string().optional().describe('Specific property to query'),
    },
    async (input) => {
      const { objectName, propertyName } = input;

      const code = `
from llm_bridge.property_handlers import handle_get_expression
import json
params = json.loads('${JSON.stringify({ objectName, propertyName })}')
result = handle_get_expression(
    object_name=params['objectName'],
    property_name=params.get('propertyName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatExpressionResult(parsed.data, 'get');
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: clear_expression
 *
 * Remove expressions from an object's property.
 */
function createClearExpressionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'clear_expression',
    `Remove expressions from an object's property, converting it back to a fixed value.

Parameters:
- objectName (required): Name of the object
- propertyName (optional): Specific property to clear. If omitted, clears all expressions on the object.

Use this tool when you want to remove parametric relationships from an object.`,
    {
      objectName: z.string().describe('Name of the object'),
      propertyName: z.string().optional().describe('Specific property to clear'),
    },
    async (input) => {
      const { objectName, propertyName } = input;

      const code = `
from llm_bridge.property_handlers import handle_clear_expression
import json
params = json.loads('${JSON.stringify({ objectName, propertyName })}')
result = handle_clear_expression(
    object_name=params['objectName'],
    property_name=params.get('propertyName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatExpressionResult(parsed.data, 'clear');
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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

// ============================================================================
// Sketcher Constraint Tools
// ============================================================================

/**
 * Tool: create_sketch
 *
 * Create a new sketch on a plane or face.
 */
function createSketchTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_sketch',
    `Create a new sketch on a plane or face.

Parameters:
- support (optional): Support specification for sketch placement, e.g., "Body001.Face4" or "(Body001, ['Face4'])"
- mapMode (optional): Map mode - "Deactivated", "FlatFace", "Plane", "ThreePoints", "ThreePlanes", "Curved", "Axis", "Concentric", "RefPlane" (default: "FlatFace")
- name (optional): Name for the sketch. If omitted, auto-generated.

Returns:
- success: Whether the sketch was created
- sketchName: Internal name of the sketch
- sketchLabel: User-friendly label
- message: Status message

Use this tool when you want to create a 2D sketch for profile-based features like pads, revolutions, or sweeps.

Example:
- Create sketch on XY plane: {}
- Create sketch on a face: { support: "Body.Face4", mapMode: "FlatFace" }
- Create named sketch: { name: "ProfileSketch" }`,
    {
      support: z.string().optional().describe('Support specification for sketch placement, e.g., "Body001.Face4"'),
      mapMode: z.enum(['Deactivated', 'FlatFace', 'Plane', 'ThreePoints', 'ThreePlanes', 'Curved', 'Axis', 'Concentric', 'RefPlane']).optional().describe('Map mode for sketch placement'),
      name: z.string().optional().describe('Name for the sketch'),
    },
    async (input) => {
      const { support, mapMode, name } = input;

      const code = `
from llm_bridge.sketcher_handlers import handle_create_sketch
import json
params = json.loads('${JSON.stringify({ support: support || null, mapMode: mapMode || 'FlatFace', name: name || null })}')
result = handle_create_sketch(
    support=params['support'],
    map_mode=params['mapMode'],
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSketchResult(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: add_geometry
 *
 * Add geometry elements to a sketch.
 */
function addGeometryTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_geometry',
    `Add geometry elements to a sketch.

Parameters:
- sketchName (required): Name of the sketch to add geometry to
- geometryType (required): Type of geometry - "line", "circle", "arc", "rectangle", "point"
- params (required): Geometry parameters based on type:
  - line: { start: {x, y}, end: {x, y} }
  - circle: { center: {x, y}, radius: number }
  - arc: { center: {x, y}, radius: number, startAngle: number, endAngle: number } (angles in degrees)
  - rectangle: { corner1: {x, y}, corner2: {x, y} }
  - point: { x: number, y: number }

Returns:
- success: Whether geometry was added
- sketchName: Name of the sketch
- geometryIndex: Index of added geometry
- geometryType: Type of geometry added
- message: Status message

Use this tool to add 2D geometry to a sketch before applying constraints.

Example:
- Add a line: { sketchName: "Sketch", geometryType: "line", params: { start: {x: 0, y: 0}, end: {x: 50, y: 0} } }
- Add a circle: { sketchName: "Sketch", geometryType: "circle", params: { center: {x: 25, y: 25}, radius: 10 } }
- Add a rectangle: { sketchName: "Sketch", geometryType: "rectangle", params: { corner1: {x: 0, y: 0}, corner2: {x: 50, y: 30} } }`,
    {
      sketchName: z.string().describe('Name of the sketch to add geometry to'),
      geometryType: z.enum(['line', 'circle', 'arc', 'rectangle', 'point']).describe('Type of geometry to add'),
      params: z.record(z.any()).describe('Geometry parameters based on type'),
    },
    async (input) => {
      const { sketchName, geometryType, params } = input;

      const code = `
from llm_bridge.sketcher_handlers import handle_add_geometry
import json
params_data = json.loads('${JSON.stringify({ sketchName, geometryType, params })}')
result = handle_add_geometry(
    sketch_name=params_data['sketchName'],
    geometry_type=params_data['geometryType'],
    params=params_data['params']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatGeometryResult(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: add_geometric_constraint
 *
 * Add geometric constraints to sketch geometry.
 */
function addGeometricConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_geometric_constraint',
    `Add geometric constraints to sketch geometry.

Parameters:
- sketchName (required): Name of the sketch
- constraintType (required): Type of geometric constraint:
  - "coincident" - Make two points coincident
  - "horizontal" - Make a line horizontal
  - "vertical" - Make a line vertical
  - "parallel" - Make two lines parallel
  - "perpendicular" - Make two lines perpendicular
  - "tangent" - Make two curves tangent
  - "equal" - Make two elements equal (lengths, radii)
- geoIndex1 (required): Index of first geometry element (0-based)
- pointPos1 (optional): Point position on first element (1=start, 2=end, 3=center)
- geoIndex2 (optional): Index of second geometry element (for constraints involving two elements)
- pointPos2 (optional): Point position on second element

Returns:
- success: Whether constraint was added
- sketchName: Name of the sketch
- constraintIndex: Index of added constraint
- constraintType: Type of constraint
- message: Status message

Use this tool to add geometric relationships between sketch elements.

Example:
- Make line horizontal: { sketchName: "Sketch", constraintType: "horizontal", geoIndex1: 0 }
- Make two points coincident: { sketchName: "Sketch", constraintType: "coincident", geoIndex1: 0, pointPos1: 2, geoIndex2: 1, pointPos2: 1 }
- Make lines perpendicular: { sketchName: "Sketch", constraintType: "perpendicular", geoIndex1: 0, geoIndex2: 1 }`,
    {
      sketchName: z.string().describe('Name of the sketch'),
      constraintType: z.enum(['coincident', 'horizontal', 'vertical', 'parallel', 'perpendicular', 'tangent', 'equal']).describe('Type of geometric constraint'),
      geoIndex1: z.number().describe('Index of first geometry element (0-based)'),
      pointPos1: z.number().optional().describe('Point position on first element (1=start, 2=end, 3=center)'),
      geoIndex2: z.number().optional().describe('Index of second geometry element'),
      pointPos2: z.number().optional().describe('Point position on second element'),
    },
    async (input) => {
      const { sketchName, constraintType, geoIndex1, pointPos1, geoIndex2, pointPos2 } = input;

      const code = `
from llm_bridge.sketcher_handlers import handle_add_geometric_constraint
import json
params = json.loads('${JSON.stringify({ sketchName, constraintType, geoIndex1, pointPos1, geoIndex2, pointPos2 })}')
result = handle_add_geometric_constraint(
    sketch_name=params['sketchName'],
    constraint_type=params['constraintType'],
    geo_index1=params['geoIndex1'],
    point_pos1=params.get('pointPos1'),
    geo_index2=params.get('geoIndex2'),
    point_pos2=params.get('pointPos2')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatConstraintResult(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: add_dimensional_constraint
 *
 * Add dimensional constraints (distance, angle, radius, diameter) to sketch geometry.
 */
function addDimensionalConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_dimensional_constraint',
    `Add dimensional constraints to sketch geometry.

Parameters:
- sketchName (required): Name of the sketch
- constraintType (required): Type of dimensional constraint:
  - "distance_x" - Horizontal distance
  - "distance_y" - Vertical distance
  - "distance" - Distance between two points or length of a line
  - "angle" - Angle between two lines
  - "radius" - Radius of circle/arc
  - "diameter" - Diameter of circle/arc
- value (required): Constraint value (number or string with units like "50mm", "90deg")
- geoIndex1 (required): Index of first geometry element
- pointPos1 (optional): Point position on first element
- geoIndex2 (optional): Index of second geometry element (for distance/angle between elements)
- pointPos2 (optional): Point position on second element

Returns:
- success: Whether constraint was added
- sketchName: Name of the sketch
- constraintIndex: Index of added constraint
- constraintType: Type of constraint
- constraintValue: Value of constraint
- message: Status message

Use this tool to add dimensional constraints that control sizes and distances.

Example:
- Set line length: { sketchName: "Sketch", constraintType: "distance", value: "50mm", geoIndex1: 0 }
- Set circle radius: { sketchName: "Sketch", constraintType: "radius", value: "10mm", geoIndex1: 0 }
- Set angle: { sketchName: "Sketch", constraintType: "angle", value: "90deg", geoIndex1: 0, geoIndex2: 1 }`,
    {
      sketchName: z.string().describe('Name of the sketch'),
      constraintType: z.enum(['distance_x', 'distance_y', 'distance', 'angle', 'radius', 'diameter']).describe('Type of dimensional constraint'),
      value: z.union([z.string(), z.number()]).describe('Constraint value (number or string with units)'),
      geoIndex1: z.number().describe('Index of first geometry element'),
      pointPos1: z.number().optional().describe('Point position on first element'),
      geoIndex2: z.number().optional().describe('Index of second geometry element'),
      pointPos2: z.number().optional().describe('Point position on second element'),
    },
    async (input) => {
      const { sketchName, constraintType, value, geoIndex1, pointPos1, geoIndex2, pointPos2 } = input;

      const code = `
from llm_bridge.sketcher_handlers import handle_add_dimensional_constraint
import json
params = json.loads('${JSON.stringify({ sketchName, constraintType, value, geoIndex1, pointPos1, geoIndex2, pointPos2 })}')
result = handle_add_dimensional_constraint(
    sketch_name=params['sketchName'],
    constraint_type=params['constraintType'],
    value=params['value'],
    geo_index1=params['geoIndex1'],
    point_pos1=params.get('pointPos1'),
    geo_index2=params.get('geoIndex2'),
    point_pos2=params.get('pointPos2')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatConstraintResult(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: set_constraint_value
 *
 * Modify the value of an existing dimensional constraint.
 */
function setConstraintValueTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_constraint_value',
    `Modify the value of an existing dimensional constraint.

Parameters:
- sketchName (required): Name of the sketch
- constraintIndex (required): Index of the constraint to modify (0-based)
- value (required): New value (number or string with units like "50mm", "90deg")

Returns:
- success: Whether the value was updated
- sketchName: Name of the sketch
- constraintIndex: Index of modified constraint
- oldValue: Previous value
- newValue: New value
- message: Status message

Use this tool to change dimensional constraint values parametrically.

Example:
- Change length: { sketchName: "Sketch", constraintIndex: 0, value: "60mm" }
- Change angle: { sketchName: "Sketch", constraintIndex: 2, value: "45deg" }`,
    {
      sketchName: z.string().describe('Name of the sketch'),
      constraintIndex: z.number().describe('Index of the constraint to modify (0-based)'),
      value: z.union([z.string(), z.number()]).describe('New value (number or string with units)'),
    },
    async (input) => {
      const { sketchName, constraintIndex, value } = input;

      const code = `
from llm_bridge.sketcher_handlers import handle_set_constraint_value
import json
params = json.loads('${JSON.stringify({ sketchName, constraintIndex, value })}')
result = handle_set_constraint_value(
    sketch_name=params['sketchName'],
    constraint_index=params['constraintIndex'],
    value=params['value']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatConstraintResult(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: list_sketch_constraints
 *
 * List all constraints in a sketch.
 */
function listSketchConstraintsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_sketch_constraints',
    `List all constraints in a sketch.

Parameters:
- sketchName (required): Name of the sketch to query

Returns:
- success: Whether the query was successful
- sketchName: Name of the sketch
- constraintCount: Number of constraints
- constraints: Array of constraint objects with index, type, value, and element references
- message: Status message

Use this tool to see all constraints applied to a sketch before making modifications.

Example:
- List constraints: { sketchName: "Sketch" }`,
    {
      sketchName: z.string().describe('Name of the sketch to query'),
    },
    async (input) => {
      const { sketchName } = input;

      const code = `
from llm_bridge.sketcher_handlers import handle_list_sketch_constraints
import json
params = json.loads('${JSON.stringify({ sketchName })}')
result = handle_list_sketch_constraints(
    sketch_name=params['sketchName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSketchGeometry(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: delete_constraint
 *
 * Remove a constraint from a sketch.
 */
function deleteConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'delete_constraint',
    `Remove a constraint from a sketch.

Parameters:
- sketchName (required): Name of the sketch
- constraintIndex (required): Index of the constraint to remove (0-based)

Returns:
- success: Whether the constraint was deleted
- sketchName: Name of the sketch
- constraintIndex: Index of deleted constraint
- message: Status message

Use this tool to remove unwanted constraints from a sketch.

Example:
- Delete constraint: { sketchName: "Sketch", constraintIndex: 2 }`,
    {
      sketchName: z.string().describe('Name of the sketch'),
      constraintIndex: z.number().describe('Index of the constraint to remove (0-based)'),
    },
    async (input) => {
      const { sketchName, constraintIndex } = input;

      const code = `
from llm_bridge.sketcher_handlers import handle_delete_constraint
import json
params = json.loads('${JSON.stringify({ sketchName, constraintIndex })}')
result = handle_delete_constraint(
    sketch_name=params['sketchName'],
    constraint_index=params['constraintIndex']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatConstraintResult(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
 * Tool: get_sketch_geometry
 *
 * Query sketch geometry and constraints.
 */
function getSketchGeometryTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_sketch_geometry',
    `Query sketch geometry and constraints.

Parameters:
- sketchName (required): Name of the sketch to query

Returns:
- success: Whether the query was successful
- sketchName: Name of the sketch
- geometryCount: Number of geometry elements
- geometry: Array of geometry objects with index, type, and coordinates
- constraintCount: Number of constraints
- constraints: Array of constraint objects
- message: Status message

Use this tool to get detailed information about sketch geometry and constraints.

Example:
- Get geometry: { sketchName: "Sketch" }`,
    {
      sketchName: z.string().describe('Name of the sketch to query'),
    },
    async (input) => {
      const { sketchName } = input;

      const code = `
from llm_bridge.sketcher_handlers import handle_get_sketch_geometry
import json
params = json.loads('${JSON.stringify({ sketchName })}')
result = handle_get_sketch_geometry(
    sketch_name=params['sketchName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSketchGeometry(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : `Error: ${parsed.error}`,
            },
          ],
        };
      } catch (error) {
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
