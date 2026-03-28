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
