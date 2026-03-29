"use strict";
/**
 * Agent Tools - Custom Tools for Claude Agent SDK
 *
 * Defines custom tools that allow Claude to interact with FreeCAD
 * through the WebSocket bridge.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCurrentSessionId = setCurrentSessionId;
exports.getCurrentSessionId = getCurrentSessionId;
exports.createAgentTools = createAgentTools;
const claude_agent_sdk_1 = require("@anthropic-ai/claude-agent-sdk");
const zod_1 = require("zod");
const result_formatters_1 = require("./result-formatters");
const file_utils_1 = require("./file-utils");
const session_manager_1 = require("./session-manager");
// Global session state (managed externally, passed in when needed)
let currentSessionId = null;
/**
 * Set the current session ID
 */
function setCurrentSessionId(sessionId) {
    currentSessionId = sessionId;
}
/**
 * Get the current session ID
 */
function getCurrentSessionId() {
    return currentSessionId;
}
/**
 * Creates custom tools for the Claude Agent SDK
 */
function createAgentTools(freeCADBridge) {
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
        // PartDesign feature tools
        createBodyTool(freeCADBridge),
        setActiveBodyTool(freeCADBridge),
        listBodiesTool(freeCADBridge),
        createPadTool(freeCADBridge),
        createPocketTool(freeCADBridge),
        createRevolutionTool(freeCADBridge),
        createGrooveTool(freeCADBridge),
        createFilletTool(freeCADBridge),
        createChamferTool(freeCADBridge),
        updateFeatureTool(freeCADBridge),
        replaceSketchTool(freeCADBridge),
        deleteFeatureTool(freeCADBridge),
        // Boolean operation tools
        booleanFuseTool(freeCADBridge),
        booleanCutTool(freeCADBridge),
        booleanCommonTool(freeCADBridge),
        makeCompoundTool(freeCADBridge),
        validateShapeTool(freeCADBridge),
        healShapeTool(freeCADBridge),
        getShapeInfoTool(freeCADBridge),
        // Assembly management tools
        createAssemblyTool(freeCADBridge),
        addComponentToAssemblyTool(freeCADBridge),
        removeComponentFromAssemblyTool(freeCADBridge),
        listAssembliesTool(freeCADBridge),
        listAssemblyComponentsTool(freeCADBridge),
        // Assembly constraint creation tools
        addCoincidentConstraintTool(freeCADBridge),
        addParallelConstraintTool(freeCADBridge),
        addPerpendicularConstraintTool(freeCADBridge),
        addAngleConstraintTool(freeCADBridge),
        addDistanceConstraintTool(freeCADBridge),
        addInsertConstraintTool(freeCADBridge),
        addTangentConstraintTool(freeCADBridge),
        addEqualConstraintTool(freeCADBridge),
        addSymmetricConstraintTool(freeCADBridge),
        // Assembly constraint modification tools
        updateConstraintValueTool(freeCADBridge),
        removeConstraintTool(freeCADBridge),
        listConstraintsTool(freeCADBridge),
        suppressConstraintTool(freeCADBridge),
        activateConstraintTool(freeCADBridge),
        // Draft workbench tools
        // Geometry creation tools
        createPointTool(freeCADBridge),
        createLineTool(freeCADBridge),
        createCircleTool(freeCADBridge),
        createArcTool(freeCADBridge),
        createEllipseTool(freeCADBridge),
        createRectangleTool(freeCADBridge),
        createPolygonTool(freeCADBridge),
        createBSplineTool(freeCADBridge),
        createBezierTool(freeCADBridge),
        createWireTool(freeCADBridge),
        // Dimension creation tools
        createLinearDimensionTool(freeCADBridge),
        createRadialDimensionTool(freeCADBridge),
        createAngularDimensionTool(freeCADBridge),
        createOrdinateDimensionTool(freeCADBridge),
        // Text annotation tools
        createTextTool(freeCADBridge),
        createDimensionTextTool(freeCADBridge),
        // Modification tools
        moveObjectsTool(freeCADBridge),
        rotateObjectsTool(freeCADBridge),
        scaleObjectsTool(freeCADBridge),
        offsetObjectTool(freeCADBridge),
        joinObjectsTool(freeCADBridge),
        splitObjectTool(freeCADBridge),
        // Session management tools
        createSaveChatSessionTool(),
        createLoadChatSessionTool(),
        createListChatSessionsTool(),
        // Pattern and Array tools
        createLinearPatternTool(freeCADBridge),
        createPolarPatternTool(freeCADBridge),
        createRectangularPatternTool(freeCADBridge),
        createPathPatternTool(freeCADBridge),
        createTransformLinkTool(freeCADBridge),
        updateLinearPatternTool(freeCADBridge),
        updatePolarPatternTool(freeCADBridge),
        getPatternInfoTool(freeCADBridge),
        deletePatternTool(freeCADBridge),
        listPatternsTool(freeCADBridge),
        // TechDraw workbench tools
        // Page management
        createDrawingPageTool(freeCADBridge),
        listDrawingPagesTool(freeCADBridge),
        deleteDrawingPageTool(freeCADBridge),
        getDrawingPagePropertiesTool(freeCADBridge),
        // View creation
        createStandardViewTool(freeCADBridge),
        createIsometricViewTool(freeCADBridge),
        createFrontViewTool(freeCADBridge),
        createTopViewTool(freeCADBridge),
        createSideViewTool(freeCADBridge),
        createSectionViewTool(freeCADBridge),
        createProjectionGroupTool(freeCADBridge),
        createDetailViewTool(freeCADBridge),
        // Dimension tools
        createTechDrawLinearDimensionTool(freeCADBridge),
        createTechDrawRadialDimensionTool(freeCADBridge),
        createTechDrawDiameterDimensionTool(freeCADBridge),
        createTechDrawAngularDimensionTool(freeCADBridge),
        // Annotation tools
        createTextAnnotationTool(freeCADBridge),
        createBalloonAnnotationTool(freeCADBridge),
        createLeaderLineTool(freeCADBridge),
        // Export tools
        exportToSvgTool(freeCADBridge),
        exportToPdfTool(freeCADBridge),
        // Surface modeling tools
        // Loft operations
        createLoftTool(freeCADBridge),
        createSectionLoftTool(freeCADBridge),
        // Sweep operations
        createSweepTool(freeCADBridge),
        createPipeTool(freeCADBridge),
        createMultiSweepTool(freeCADBridge),
        // Surface operations
        createRuledSurfaceTool(freeCADBridge),
        createSurfaceFromEdgesTool(freeCADBridge),
        extendSurfaceTool(freeCADBridge),
        trimSurfaceTool(freeCADBridge),
        // Utilities
        getSurfaceInfoTool(freeCADBridge),
        listSurfacesTool(freeCADBridge),
        validateSurfaceTool(freeCADBridge),
    ];
}
/**
 * Tool: execute_freecad_python
 *
 * Executes arbitrary Python code in the FreeCAD environment.
 * This is the primary tool for creating and modifying CAD models.
 */
function createExecuteFreeCADPythonTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('execute_freecad_python', `Execute Python code in FreeCAD's environment. Use this to create, modify, or query CAD models.

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
5. Perform any CAD operation`, {
        code: zod_1.z.string().describe('Python code to execute in FreeCAD'),
    }, async (input) => {
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
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Execution failed: ${result.error || 'Unknown error'}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
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
    });
}
/**
 * Tool: query_model_state
 *
 * Queries the current state of the FreeCAD model with specific intent.
 */
function createQueryModelStateTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('query_model_state', `Query the current state of the FreeCAD model with a specific intent.

Parameters:
- intent (required): Type of query - "document_overview", "object_details", "selection", or "dependencies"
- objectName (optional): Name of specific object for object_details or dependencies queries

Returns structured JSON with:
- Document overview: All objects with names, types, visibility
- Object details: Placement, dimensions, color, properties
- Selection: Currently selected objects in viewport
- Dependencies: Parent-child relationships between objects

Use this tool when you need structured information about the model state before making modifications.`, {
        intent: zod_1.z
            .enum(['document_overview', 'object_details', 'selection', 'dependencies'])
            .describe('Type of query to perform'),
        objectName: zod_1.z
            .string()
            .optional()
            .describe('Object name for object_details or dependencies queries'),
    }, async (input) => {
        const intent = input.intent;
        const objectName = input.objectName;
        let code;
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
            let formatted;
            if (!parsed.success) {
                formatted = `Error: ${parsed.error}`;
            }
            else {
                switch (intent) {
                    case 'document_overview':
                        formatted = (0, result_formatters_1.formatDocumentOverview)(parsed.data);
                        break;
                    case 'object_details':
                        formatted = (0, result_formatters_1.formatObjectProperties)(parsed.data);
                        break;
                    case 'selection':
                        formatted = (0, result_formatters_1.formatSelection)(parsed.data);
                        break;
                    case 'dependencies':
                        formatted = (0, result_formatters_1.formatDependencies)(parsed.data);
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
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Query failed: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: export_model
 *
 * Exports the current model to a file format.
 */
function createExportModelTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('export_model', `Export the current FreeCAD model to a file.

Supported formats include:
- STEP (.step, .stp) - Industry standard for CAD exchange
- STL (.stl) - 3D printing format
- OBJ (.obj) - Wavefront format
- DXF (.dxf) - 2D drawing format
- FCStd (.FCStd) - Native FreeCAD format

Use this tool when the user wants to save or export their model.`, {
        filePath: zod_1.z.string().describe('Full path to save the exported file'),
        format: zod_1.z
            .enum(['STEP', 'STL', 'OBJ', 'DXF', 'FCStd'])
            .describe('Export format'),
    }, async (input) => {
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
        let code;
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
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Export failed: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: list_objects
 *
 * Lists all objects in the active FreeCAD document.
 */
function createListObjectsTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('list_objects', `List all objects in the active FreeCAD document.

Returns:
- Array of objects with name, label, type, and visibility
- Total object count

Use this tool when you need to see what objects exist in the current document before performing operations on them.`, {
    // No parameters needed
    }, async () => {
        const code = `
from llm_bridge.query_handlers import handle_list_objects
import json
result = handle_list_objects()
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatObjectList)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: get_object_properties
 *
 * Gets detailed properties of a specific object.
 */
function createGetObjectPropertiesTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('get_object_properties', `Get detailed properties of a specific object in the FreeCAD document.

Parameters:
- objectName (required): Name of the object to query

Returns:
- Object type and label
- Placement (position and rotation)
- Dimensions (bounding box, volume, area)
- Color
- Other shape-specific properties (radius, length, etc.)

Use this tool when you need to know the exact properties of an object before modifying it or creating related geometry.`, {
        objectName: zod_1.z.string().describe('Name of the object to query'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatObjectProperties)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: get_selection
 *
 * Gets currently selected objects in the viewport.
 */
function createGetSelectionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('get_selection', `Get the currently selected objects in the FreeCAD viewport.

Returns:
- Array of selected objects with name, label, and type
- Selection count

Use this tool when you need to know what the user has selected, or when performing operations on the current selection.`, {
    // No parameters needed
    }, async () => {
        const code = `
from llm_bridge.query_handlers import handle_selection
import json
result = handle_selection()
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatSelection)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: get_document_info
 *
 * Gets document metadata.
 */
function createGetDocumentInfoTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('get_document_info', `Get metadata about the active FreeCAD document.

Returns:
- Document name and label
- Object count
- Modified status
- File path (if saved)

Use this tool when you need to understand the current document context, check if changes have been saved, or get the document's file path.`, {
    // No parameters needed
    }, async () => {
        const code = `
from llm_bridge.query_handlers import handle_get_document_info
import json
result = handle_get_document_info()
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatDocumentInfo)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: save_document
 *
 * Save the current FreeCAD document.
 */
function createSaveDocumentTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('save_document', `Save the current FreeCAD document to a file in native FreeCAD format.

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
- Save with backup format: { filePath: "C:/backup.FCBAK", format: "FCBak" }`, {
        filePath: zod_1.z.string().optional().describe('Full path to save the document'),
        format: zod_1.z.enum(['FCStd', 'FCBak']).optional().describe('Save format (default: FCStd)'),
    }, async (input) => {
        const filePath = input.filePath;
        const format = input.format || 'FCStd';
        // Validate file path if provided
        if (filePath) {
            const validation = (0, file_utils_1.validateFilePath)(filePath);
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
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Save failed: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: open_document
 *
 * Open an existing CAD file in FreeCAD.
 */
function createOpenDocumentTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('open_document', `Open an existing CAD file in FreeCAD.

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
- Open a STEP file: { filePath: "C:/Imports/assembly.step" }`, {
        filePath: zod_1.z.string().describe('Full path to the CAD file to open'),
    }, async (input) => {
        const filePath = input.filePath;
        // Validate file path
        const validation = (0, file_utils_1.validateFilePath)(filePath);
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
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Open failed: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: export_to_format
 *
 * Export the current model to a specific CAD format.
 */
function createExportToFormatTool(freeCADBridge) {
    const formats = (0, file_utils_1.getSupportedFormats)();
    const exportFormats = formats.filter(f => f.canExport);
    const formatList = exportFormats.map(f => f.format).join(', ');
    return (0, claude_agent_sdk_1.tool)('export_to_format', `Export the current FreeCAD model to a specific CAD format.

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
- Export for manufacturing: { filePath: "C:/Exports/part.step", format: "STEP" }`, {
        filePath: zod_1.z.string().describe('Full path to export the file to'),
        format: zod_1.z.enum(['STEP', 'IGES', 'STL', 'OBJ', 'DXF', 'FCStd', 'FCBak']).describe('Export format'),
    }, async (input) => {
        const filePath = input.filePath;
        const format = input.format;
        // Validate file path
        const validation = (0, file_utils_1.validateFilePath)(filePath);
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
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Export failed: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: list_recent_documents
 *
 * List recently opened CAD files.
 */
function createListRecentDocumentsTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('list_recent_documents', `List recently opened CAD files from FreeCAD's history.

Parameters: None

Returns:
- count: Number of recent files found
- files: Array of file objects with path, name, and index
- message: Status message

Use this tool when the user wants to see their recently opened files or find a file they worked on previously.

Example:
- List recent files: {}`, {
    // No parameters needed
    }, async () => {
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
                }
                else {
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
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Failed to list recent documents: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_new_document
 *
 * Create a new empty FreeCAD document.
 */
function createNewDocumentTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_new_document', `Create a new empty FreeCAD document.

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
- Create Assembly document: { name: "Assembly1", type: "Assembly" }`, {
        name: zod_1.z.string().optional().describe('Name for the new document'),
        type: zod_1.z.enum(['Part', 'Assembly', 'Sketch']).optional().describe('Document type (default: Part)'),
    }, async (input) => {
        const name = input.name;
        const type = input.type || 'Part';
        // Sanitize document name if provided
        const sanitizedName = name ? (0, file_utils_1.sanitizeFileName)(name) : undefined;
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
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Failed to create document: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
// ============================================================================
// Pattern and Array Tools
// ============================================================================
/**
 * Tool: create_linear_pattern
 *
 * Create a linear pattern (1D array) of a feature.
 */
function createLinearPatternTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_linear_pattern', `Create a linear pattern (1D array) of a feature in a specified direction.

Parameters:
- sourceObject (required): Name of the source feature to pattern (e.g., "Pad", "Pocket", "Circle")
- direction (required): Direction vector as {x, y, z} or "X", "Y", "Z" for standard axes
- count (required): Number of instances (including original)
- spacing (required): Distance between instances in mm
- name (optional): Name for the pattern. If omitted, auto-generated.

Returns:
- success: Whether the pattern was created
- patternName: Internal name of the pattern
- patternLabel: User-friendly label
- sourceObject: Name of the source feature
- count: Number of instances
- spacing: Distance between instances
- message: Status message

Use this tool to create arrays of features in a linear arrangement. Patterns are associative - updating the source updates all instances.

Example:
- Linear pattern of 5 holes: { sourceObject: "Pocket", direction: "X", count: 5, spacing: 10 }
- 3x10mm spacing in Y: { sourceObject: "Cylinder", direction: "Y", count: 3, spacing: 10 }`, {
        sourceObject: zod_1.z.string().describe('Name of the source feature to pattern'),
        direction: zod_1.z.union([
            zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number(), z: zod_1.z.number() }),
            zod_1.z.enum(['X', 'Y', 'Z'])
        ]).describe('Direction vector {x, y, z} or axis name "X", "Y", "Z"'),
        count: zod_1.z.number().describe('Number of instances including original'),
        spacing: zod_1.z.number().describe('Distance between instances in mm'),
        name: zod_1.z.string().optional().describe('Name for the pattern'),
    }, async (input) => {
        const { sourceObject, direction, count, spacing, name } = input;
        const code = `
from llm_bridge.pattern_handlers import handle_create_linear_pattern
import json
params = json.loads('${JSON.stringify({ sourceObject, direction, count, spacing, name: name || null })}')
result = handle_create_linear_pattern(
    source_object=params['sourceObject'],
    direction=params['direction'],
    count=params['count'],
    spacing=params['spacing'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatPatternCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_polar_pattern
 *
 * Create a polar (circular) pattern around an axis.
 */
function createPolarPatternTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_polar_pattern', `Create a polar pattern (circular array) of a feature around an axis.

Parameters:
- sourceObject (required): Name of the source feature to pattern
- centerPoint (optional): Center point as {x, y, z}. If omitted, uses origin.
- axis (optional): Axis of rotation as {x, y, z} (default: {x: 0, y: 0, z: 1} for Z-axis)
- count (required): Number of instances including original
- angle (optional): Total angle in degrees (default: 360 for full circle)
- name (optional): Name for the pattern. If omitted, auto-generated.

Returns:
- success: Whether the pattern was created
- patternName: Internal name of the pattern
- patternLabel: User-friendly label
- sourceObject: Name of the source feature
- count: Number of instances
- angle: Total angle in degrees
- message: Status message

Use this tool to create circular arrays of features. Common for bolt patterns, holes, spokes, etc.

Example:
- 6 bolts around Z-axis: { sourceObject: "Cylinder", count: 6, angle: 360 }
- 8 instances in 270 degrees: { sourceObject: "Pad", count: 8, angle: 270 }`, {
        sourceObject: zod_1.z.string().describe('Name of the source feature to pattern'),
        centerPoint: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number(), z: zod_1.z.number() }).optional().describe('Center point {x, y, z}'),
        axis: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number(), z: zod_1.z.number() }).optional().describe('Axis of rotation (default: Z-axis)'),
        count: zod_1.z.number().describe('Number of instances including original'),
        angle: zod_1.z.number().optional().describe('Total angle in degrees (default: 360)'),
        name: zod_1.z.string().optional().describe('Name for the pattern'),
    }, async (input) => {
        const { sourceObject, centerPoint, axis, count, angle, name } = input;
        const code = `
from llm_bridge.pattern_handlers import handle_create_polar_pattern
import json
params = json.loads('${JSON.stringify({ sourceObject, centerPoint, axis, count, angle: angle || 360, name: name || null })}')
result = handle_create_polar_pattern(
    source_object=params['sourceObject'],
    center_point=params.get('centerPoint'),
    axis=params.get('axis'),
    count=params['count'],
    angle=params.get('angle', 360),
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatPatternCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_rectangular_pattern
 *
 * Create a rectangular (2D grid) pattern of a feature.
 */
function createRectangularPatternTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_rectangular_pattern', `Create a rectangular pattern (2D grid) of a feature.

Parameters:
- sourceObject (required): Name of the source feature to pattern
- directionX (required): X direction as {x, y, z} or "X", "Y", "Z"
- countX (required): Number of instances in X direction
- spacingX (required): Spacing between instances in X direction (mm)
- directionY (required): Y direction as {x, y, z} or "X", "Y", "Z"
- countY (required): Number of instances in Y direction
- spacingY (required): Spacing between instances in Y direction (mm)
- name (optional): Name for the pattern. If omitted, auto-generated.

Returns:
- success: Whether the pattern was created
- patternName: Internal name of the pattern
- patternLabel: User-friendly label
- sourceObject: Name of the source feature
- countX, countY: Instances in each direction
- totalCount: Total number of instances
- message: Status message

Use this tool to create 2D grid arrays of features. Common for PCB holes, mounting holes, etc.

Example:
- 3x4 grid of holes: { sourceObject: "Pocket", directionX: "X", countX: 3, spacingX: 10, directionY: "Y", countY: 4, spacingY: 10 }`, {
        sourceObject: zod_1.z.string().describe('Name of the source feature to pattern'),
        directionX: zod_1.z.union([
            zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number(), z: zod_1.z.number() }),
            zod_1.z.enum(['X', 'Y', 'Z'])
        ]).describe('X direction vector or axis'),
        countX: zod_1.z.number().describe('Number of instances in X direction'),
        spacingX: zod_1.z.number().describe('Spacing in X direction (mm)'),
        directionY: zod_1.z.union([
            zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number(), z: zod_1.z.number() }),
            zod_1.z.enum(['X', 'Y', 'Z'])
        ]).describe('Y direction vector or axis'),
        countY: zod_1.z.number().describe('Number of instances in Y direction'),
        spacingY: zod_1.z.number().describe('Spacing in Y direction (mm)'),
        name: zod_1.z.string().optional().describe('Name for the pattern'),
    }, async (input) => {
        const { sourceObject, directionX, countX, spacingX, directionY, countY, spacingY, name } = input;
        const code = `
from llm_bridge.pattern_handlers import handle_create_rectangular_pattern
import json
params = json.loads('${JSON.stringify({ sourceObject, directionX, countX, spacingX, directionY, countY, spacingY, name: name || null })}')
result = handle_create_rectangular_pattern(
    source_object=params['sourceObject'],
    direction_x=params['directionX'],
    count_x=params['countX'],
    spacing_x=params['spacingX'],
    direction_y=params['directionY'],
    count_y=params['countY'],
    spacing_y=params['spacingY'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatPatternCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_path_pattern
 *
 * Create a pattern along a path (wire or edge).
 */
function createPathPatternTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_path_pattern', `Create a pattern of a feature along a path (wire or edge).

Parameters:
- sourceObject (required): Name of the source feature to pattern
- pathObject (required): Name of the path object (wire, edge, or sketch)
- count (required): Number of instances along the path
- spacing (optional): Distance between instances (mm). If omitted, evenly distributed.
- alignToPath (optional): Whether to align instances to path tangent (default: true)
- name (optional): Name for the pattern. If omitted, auto-generated.

Returns:
- success: Whether the pattern was created
- patternName: Internal name of the pattern
- patternLabel: User-friendly label
- sourceObject: Name of the source feature
- pathObject: Name of the path object
- count: Number of instances
- message: Status message

Use this tool to distribute features along a curved path. Common for rivets along a curve, stamps on a bent edge, etc.

Example:
- Pattern along curve: { sourceObject: "Cylinder", pathObject: "Wire", count: 5 }
- Evenly spaced along path: { sourceObject: "Pad", pathObject: "Sketch", count: 10, alignToPath: true }`, {
        sourceObject: zod_1.z.string().describe('Name of the source feature to pattern'),
        pathObject: zod_1.z.string().describe('Name of the path object (wire, edge, or sketch)'),
        count: zod_1.z.number().describe('Number of instances along the path'),
        spacing: zod_1.z.number().optional().describe('Distance between instances (mm)'),
        alignToPath: zod_1.z.boolean().optional().default(true).describe('Align instances to path tangent'),
        name: zod_1.z.string().optional().describe('Name for the pattern'),
    }, async (input) => {
        const { sourceObject, pathObject, count, spacing, alignToPath, name } = input;
        const code = `
from llm_bridge.pattern_handlers import handle_create_path_pattern
import json
params = json.loads('${JSON.stringify({ sourceObject, pathObject, count, spacing: spacing || null, alignToPath, name: name || null })}')
result = handle_create_path_pattern(
    source_object=params['sourceObject'],
    path_object=params['pathObject'],
    count=params['count'],
    spacing=params.get('spacing'),
    align_to_path=params.get('alignToPath', True),
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatPatternCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_transform_link
 *
 * Create a transform link (3D array/pattern) using MultiTransform.
 */
function createTransformLinkTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_transform_link', `Create a transform link (3D array/pattern) using MultiTransform.

Parameters:
- sourceObject (required): Name of the source feature to pattern
- direction (required): Direction vector as {x, y, z} or "X", "Y", "Z" for standard axes
- count (required): Number of instances (including original)
- spacing (required): Distance between instances in mm
- name (optional): Name for the pattern. If omitted, auto-generated.

Returns:
- success: Whether the pattern was created
- transformName: Internal name of the transform
- transformLabel: User-friendly label
- sourceObject: Name of the source feature
- count: Number of instances
- spacing: Distance between instances
- message: Status message

Use this tool to create 3D transform patterns of features using MultiTransform.

Example:
- Transform of 5 instances: { sourceObject: "Pad", direction: "X", count: 5, spacing: 10 }`, {
        sourceObject: zod_1.z.string().describe('Name of the source feature to pattern'),
        direction: zod_1.z.union([
            zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number(), z: zod_1.z.number() }),
            zod_1.z.enum(['X', 'Y', 'Z'])
        ]).describe('Direction vector {x, y, z} or axis name "X", "Y", "Z"'),
        count: zod_1.z.number().describe('Number of instances including original'),
        spacing: zod_1.z.number().describe('Distance between instances in mm'),
        name: zod_1.z.string().optional().describe('Name for the pattern'),
    }, async (input) => {
        const { sourceObject, direction, count, spacing, name } = input;
        const code = `
from llm_bridge.pattern_handlers import handle_create_transform_link
import json
params = json.loads('${JSON.stringify({ sourceObject, direction, count, spacing, name: name || null })}')
result = handle_create_transform_link(
    source_object=params['sourceObject'],
    direction=params['direction'],
    count=params['count'],
    spacing=params['spacing'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatPatternCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: update_linear_pattern
 *
 * Update parameters of an existing linear pattern.
 */
function updateLinearPatternTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('update_linear_pattern', `Update parameters of an existing linear pattern.

Parameters:
- patternName (required): Name of the linear pattern to update
- count (optional): New number of instances
- spacing (optional): New spacing distance in mm

Returns:
- success: Whether the pattern was updated
- patternName: Name of the updated pattern
- oldCount, newCount: Count before and after update
- oldSpacing, newSpacing: Spacing before and after update
- message: Status message

Use this tool to modify existing linear patterns without recreating them. Changes are parametric.

Example:
- Increase to 8 copies: { patternName: "LinearPattern", count: 8 }
- Double spacing: { patternName: "LinearPattern", spacing: 20 }`, {
        patternName: zod_1.z.string().describe('Name of the linear pattern to update'),
        count: zod_1.z.number().optional().describe('New number of instances'),
        spacing: zod_1.z.number().optional().describe('New spacing distance in mm'),
    }, async (input) => {
        const { patternName, count, spacing } = input;
        const code = `
from llm_bridge.pattern_handlers import handle_update_linear_pattern
import json
params = json.loads('${JSON.stringify({ patternName, count, spacing })}')
result = handle_update_linear_pattern(
    pattern_name=params['patternName'],
    count=params.get('count'),
    spacing=params.get('spacing')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatPatternUpdate)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: update_polar_pattern
 *
 * Update parameters of an existing polar pattern.
 */
function updatePolarPatternTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('update_polar_pattern', `Update parameters of an existing polar pattern.

Parameters:
- patternName (required): Name of the polar pattern to update
- count (optional): New number of instances
- angle (optional): New total angle in degrees

Returns:
- success: Whether the pattern was updated
- patternName: Name of the updated pattern
- oldCount, newCount: Count before and after update
- oldAngle, newAngle: Angle before and after update
- message: Status message

Use this tool to modify existing polar patterns without recreating them. Changes are parametric.

Example:
- Increase to 12 instances: { patternName: "PolarPattern", count: 12 }
- Change to 180 degrees: { patternName: "PolarPattern", angle: 180 }`, {
        patternName: zod_1.z.string().describe('Name of the polar pattern to update'),
        count: zod_1.z.number().optional().describe('New number of instances'),
        angle: zod_1.z.number().optional().describe('New total angle in degrees'),
    }, async (input) => {
        const { patternName, count, angle } = input;
        const code = `
from llm_bridge.pattern_handlers import handle_update_polar_pattern
import json
params = json.loads('${JSON.stringify({ patternName, count, angle })}')
result = handle_update_polar_pattern(
    pattern_name=params['patternName'],
    count=params.get('count'),
    angle=params.get('angle')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatPatternUpdate)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: get_pattern_info
 *
 * Get detailed information about a pattern.
 */
function getPatternInfoTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('get_pattern_info', `Get detailed information about a pattern including its parameters and instance positions.

Parameters:
- patternName (required): Name of the pattern to query

Returns:
- success: Whether the query was successful
- patternName: Name of the pattern
- patternType: Type of pattern (Linear, Polar, Rectangular, Path)
- sourceObject: Name of the source feature
- count: Number of instances
- positions: Array of instance positions
- message: Status message

Use this tool to inspect pattern parameters and instance locations.

Example:
- Get pattern details: { patternName: "LinearPattern001" }`, {
        patternName: zod_1.z.string().describe('Name of the pattern to query'),
    }, async (input) => {
        const { patternName } = input;
        const code = `
from llm_bridge.pattern_handlers import handle_get_pattern_info
import json
params = json.loads('${JSON.stringify({ patternName })}')
result = handle_get_pattern_info(pattern_name=params['patternName'])
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatPatternInfo)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: delete_pattern
 *
 * Delete a pattern from the document.
 */
function deletePatternTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('delete_pattern', `Delete a pattern from the document. The source feature is preserved.

Parameters:
- patternName (required): Name of the pattern to delete

Returns:
- success: Whether the pattern was deleted
- patternName: Name of the deleted pattern
- message: Status message

Use this tool to remove unwanted patterns while keeping the original source feature intact.

Example:
- Delete pattern: { patternName: "LinearPattern001" }`, {
        patternName: zod_1.z.string().describe('Name of the pattern to delete'),
    }, async (input) => {
        const { patternName } = input;
        const code = `
from llm_bridge.pattern_handlers import handle_delete_pattern
import json
params = json.loads('${JSON.stringify({ patternName })}')
result = handle_delete_pattern(pattern_name=params['patternName'])
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
                            text: `Deleted pattern: ${patternName}\n${parsed.message || ''}`,
                        },
                    ],
                };
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: list_patterns
 *
 * List all patterns in the active document.
 */
function listPatternsTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('list_patterns', `List all patterns (linear, polar, rectangular, path) in the active document.

Parameters: None

Returns:
- success: Whether the query was successful
- patternCount: Number of patterns found
- patterns: Array of pattern objects with name, type, source, and count
- message: Status message

Use this tool to see all available patterns in the document before modifying or deleting them.

Example:
- List all patterns: {}`, {
    // No parameters needed
    }, async () => {
        const code = `
from llm_bridge.pattern_handlers import handle_list_patterns
import json
result = handle_list_patterns()
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            if (parsed.success) {
                let output = `Patterns: ${parsed.patternCount || 0}\n\n`;
                if (parsed.patterns && parsed.patterns.length > 0) {
                    output += (0, result_formatters_1.formatTableRow)(['Name', 'Type', 'Source', 'Count']);
                    output += '\n' + '─'.repeat(70) + '\n';
                    for (const pattern of parsed.patterns) {
                        output += (0, result_formatters_1.formatTableRow)([
                            pattern.name || '-',
                            pattern.type || '-',
                            pattern.sourceObject || '-',
                            String(pattern.count || 0)
                        ]);
                        output += '\n';
                    }
                }
                else {
                    output += '(No patterns found)';
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: output,
                        },
                    ],
                };
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: save_chat_session
 *
 * Save the current conversation session to disk.
 */
function createSaveChatSessionTool() {
    return (0, claude_agent_sdk_1.tool)('save_chat_session', `Save the current conversation session to disk for later retrieval.

Parameters:
- name (optional): Custom name for the session. If omitted, auto-generates from first message.
- includeToolHistory (optional): Whether to include tool call history. Default: true.

Returns:
- success: Whether the save was successful
- sessionId: Unique identifier for the session
- filePath: Path where the session was saved
- message: Status message

Use this tool when the user wants to save their conversation for later resumption.`, {
        name: zod_1.z.string().optional().describe('Custom name for the session'),
        includeToolHistory: zod_1.z.boolean().optional().default(true).describe('Include tool call history'),
    }, async (input) => {
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
            const session = (0, session_manager_1.loadSession)(sessionId);
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
            }
            else if (session.name === 'Untitled Session') {
                (0, session_manager_1.autoNameSession)(sessionId);
            }
            // Filter tool history if not included
            if (!input.includeToolHistory) {
                session.messages = session.messages.map(msg => ({
                    ...msg,
                    toolCalls: undefined,
                    toolResults: undefined,
                }));
            }
            (0, session_manager_1.saveSession)(session);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Session saved: ${session.name}\nSession ID: ${sessionId}\nMessages: ${session.messages.length}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Save failed: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: load_chat_session
 *
 * Load a saved conversation session.
 */
function createLoadChatSessionTool() {
    return (0, claude_agent_sdk_1.tool)('load_chat_session', `Load a previously saved conversation session.

Parameters:
- sessionId (required): The unique identifier of the session to load.

Returns:
- success: Whether the load was successful
- sessionName: Name of the loaded session
- messageCount: Number of messages in the session
- documentPath: Associated CAD file path (if any)
- message: Status message

Use this tool when the user wants to resume a previous conversation.`, {
        sessionId: zod_1.z.string().describe('The unique identifier of the session to load'),
    }, async (input) => {
        try {
            const session = (0, session_manager_1.loadSession)(input.sessionId);
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
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Load failed: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: list_chat_sessions
 *
 * List available saved conversation sessions.
 */
function createListChatSessionsTool() {
    return (0, claude_agent_sdk_1.tool)('list_chat_sessions', `List all available saved conversation sessions.

Parameters:
- limit (optional): Maximum number of sessions to return. Default: 10.

Returns:
- Array of session summaries with sessionId, name, createdAt, updatedAt, messageCount

Use this tool when the user wants to see their saved conversations or find a specific session to load.`, {
        limit: zod_1.z.number().optional().default(10).describe('Maximum number of sessions to list'),
    }, async (input) => {
        try {
            const sessions = (0, session_manager_1.listSessions)(input.limit);
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
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `List failed: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: set_object_property
 *
 * Set a single property on an object to a specific value.
 */
function createSetObjectPropertyTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('set_object_property', `Set a single property on an object to a specific value.

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

Use this tool when you need to modify a single property of an existing object.`, {
        objectName: zod_1.z.string().describe('Name of the object to modify'),
        propertyName: zod_1.z.string().describe('Name of the property to set'),
        value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('Value to set (number or string with units)'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatPropertyChange)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: update_dimensions
 *
 * Update multiple dimensional properties at once.
 */
function createUpdateDimensionsTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('update_dimensions', `Update multiple dimensional properties at once. Useful for resizing objects with a single command.

Parameters:
- objectName (required): Name of the object to modify
- dimensions (required): Object mapping property names to values, e.g., {"Length": "100mm", "Width": "50mm"}

Use this tool when you need to update multiple dimensions of an object simultaneously.`, {
        objectName: zod_1.z.string().describe('Name of the object to modify'),
        dimensions: zod_1.z.record(zod_1.z.union([zod_1.z.string(), zod_1.z.number()])).describe('Object mapping property names to values'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatDimensionUpdate)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: move_object
 *
 * Reposition an object to a new location.
 */
function createMoveObjectTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('move_object', `Reposition an object to a new location. Supports both absolute positioning and relative offsets.

Parameters:
- objectName (required): Name of the object to move
- position (optional): Absolute target position as {x, y, z} coordinates in mm
- offset (optional): Relative offset as {x, y, z} in mm
- relative (optional): If true, treats position as an offset. Default: false

Note: Either position or offset must be provided. The object's rotation is preserved.

Use this tool when you need to move an object to a different location.`, {
        objectName: zod_1.z.string().describe('Name of the object to move'),
        position: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number(), z: zod_1.z.number() }).optional().describe('Absolute target position'),
        offset: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number(), z: zod_1.z.number() }).optional().describe('Relative offset'),
        relative: zod_1.z.boolean().optional().default(false).describe('If true, treats position as an offset'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatTransformResult)(parsed.data, 'move');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: rotate_object
 *
 * Rotate an object around a specified axis.
 */
function createRotateObjectTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('rotate_object', `Rotate an object around a specified axis.

Parameters:
- objectName (required): Name of the object to rotate
- angle (required): Rotation angle. Can be:
  - Numeric value in radians
  - String with units: "90deg", "45deg", "1.5rad"
- axis (optional): Axis of rotation as {x, y, z}. Default: {x: 0, y: 0, z: 1} (Z-axis)
- center (optional): Center point of rotation as {x, y, z}. Default: object's current position

Use this tool when you need to rotate an object.`, {
        objectName: zod_1.z.string().describe('Name of the object to rotate'),
        angle: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('Rotation angle (number in radians or string with units)'),
        axis: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number(), z: zod_1.z.number() }).optional().describe('Axis of rotation'),
        center: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number(), z: zod_1.z.number() }).optional().describe('Center point of rotation'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatTransformResult)(parsed.data, 'rotate');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: scale_object
 *
 * Scale an object uniformly or non-uniformly.
 */
function createScaleObjectTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('scale_object', `Scale an object uniformly or non-uniformly.

Parameters:
- objectName (required): Name of the object to scale
- scale (optional): Uniform scale factor (e.g., 2.0 for 2x size, 0.5 for half size)
- scale_x, scale_y, scale_z (optional): Non-uniform scale factors for each axis
- uniform (optional): If true, applies uniform scaling. Default: true

Note: Either scale or individual scale_x/scale_y/scale_z must be provided.

Use this tool when you need to resize an object.`, {
        objectName: zod_1.z.string().describe('Name of the object to scale'),
        scale: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional().describe('Uniform scale factor (e.g., 2.0 for 2x size, 0.5 for half size)'),
        scale_x: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional().describe('Scale factor for X axis'),
        scale_y: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional().describe('Scale factor for Y axis'),
        scale_z: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional().describe('Scale factor for Z axis'),
        uniform: zod_1.z.boolean().optional().default(true).describe('If true, applies uniform scaling'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatTransformResult)(parsed.data, 'scale');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: set_expression
 *
 * Create a parametric relationship by setting an expression on a property.
 */
function createSetExpressionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('set_expression', `Create a parametric relationship by setting an expression on a property.

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

Use this tool when you want to create parametric relationships between objects.`, {
        objectName: zod_1.z.string().describe('Name of the object'),
        propertyName: zod_1.z.string().describe('Property to set expression on'),
        expression: zod_1.z.string().describe('Expression string'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatExpressionResult)(parsed.data, 'set');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: get_expression
 *
 * Query existing expressions on an object.
 */
function createGetExpressionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('get_expression', `Query existing expressions on an object. Returns expression information for a specific property or all properties with expressions.

Parameters:
- objectName (required): Name of the object
- propertyName (optional): Specific property to query. If omitted, returns all expressions on the object.

Use this tool when you want to check what expressions are set on an object.`, {
        objectName: zod_1.z.string().describe('Name of the object'),
        propertyName: zod_1.z.string().optional().describe('Specific property to query'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatExpressionResult)(parsed.data, 'get');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: clear_expression
 *
 * Remove expressions from an object's property.
 */
function createClearExpressionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('clear_expression', `Remove expressions from an object's property, converting it back to a fixed value.

Parameters:
- objectName (required): Name of the object
- propertyName (optional): Specific property to clear. If omitted, clears all expressions on the object.

Use this tool when you want to remove parametric relationships from an object.`, {
        objectName: zod_1.z.string().describe('Name of the object'),
        propertyName: zod_1.z.string().optional().describe('Specific property to clear'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatExpressionResult)(parsed.data, 'clear');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
// ============================================================================
// Sketcher Constraint Tools
// ============================================================================
/**
 * Tool: create_sketch
 *
 * Create a new sketch on a plane or face.
 */
function createSketchTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_sketch', `Create a new sketch on a plane or face.

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
- Create named sketch: { name: "ProfileSketch" }`, {
        support: zod_1.z.string().optional().describe('Support specification for sketch placement, e.g., "Body001.Face4"'),
        mapMode: zod_1.z.enum(['Deactivated', 'FlatFace', 'Plane', 'ThreePoints', 'ThreePlanes', 'Curved', 'Axis', 'Concentric', 'RefPlane']).optional().describe('Map mode for sketch placement'),
        name: zod_1.z.string().optional().describe('Name for the sketch'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatSketchResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_geometry
 *
 * Add geometry elements to a sketch.
 */
function addGeometryTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_geometry', `Add geometry elements to a sketch.

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
- Add a rectangle: { sketchName: "Sketch", geometryType: "rectangle", params: { corner1: {x: 0, y: 0}, corner2: {x: 50, y: 30} } }`, {
        sketchName: zod_1.z.string().describe('Name of the sketch to add geometry to'),
        geometryType: zod_1.z.enum(['line', 'circle', 'arc', 'rectangle', 'point']).describe('Type of geometry to add'),
        params: zod_1.z.record(zod_1.z.any()).describe('Geometry parameters based on type'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatGeometryResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_geometric_constraint
 *
 * Add geometric constraints to sketch geometry.
 */
function addGeometricConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_geometric_constraint', `Add geometric constraints to sketch geometry.

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
  - "symmetric" - Make two points symmetric about a line or axis
  - "concentric" - Make two circles/arcs share the same center
  - "midpoint" - Make a point the midpoint of a line
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
- Make lines perpendicular: { sketchName: "Sketch", constraintType: "perpendicular", geoIndex1: 0, geoIndex2: 1 }
- Make two circles concentric: { sketchName: "Sketch", constraintType: "concentric", geoIndex1: 0, geoIndex2: 1 }
- Make points symmetric about a line: { sketchName: "Sketch", constraintType: "symmetric", geoIndex1: 0, geoIndex2: 1 }
- Make point midpoint of line: { sketchName: "Sketch", constraintType: "midpoint", geoIndex1: 0, geoIndex2: 1 }`, {
        sketchName: zod_1.z.string().describe('Name of the sketch'),
        constraintType: zod_1.z.enum(['coincident', 'horizontal', 'vertical', 'parallel', 'perpendicular', 'tangent', 'equal', 'symmetric', 'concentric', 'midpoint']).describe('Type of geometric constraint'),
        geoIndex1: zod_1.z.number().describe('Index of first geometry element (0-based)'),
        pointPos1: zod_1.z.number().optional().describe('Point position on first element (1=start, 2=end, 3=center)'),
        geoIndex2: zod_1.z.number().optional().describe('Index of second geometry element'),
        pointPos2: zod_1.z.number().optional().describe('Point position on second element'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatConstraintResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_dimensional_constraint
 *
 * Add dimensional constraints (distance, angle, radius, diameter) to sketch geometry.
 */
function addDimensionalConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_dimensional_constraint', `Add dimensional constraints to sketch geometry.

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
- Set angle: { sketchName: "Sketch", constraintType: "angle", value: "90deg", geoIndex1: 0, geoIndex2: 1 }`, {
        sketchName: zod_1.z.string().describe('Name of the sketch'),
        constraintType: zod_1.z.enum(['distance_x', 'distance_y', 'distance', 'angle', 'radius', 'diameter']).describe('Type of dimensional constraint'),
        value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('Constraint value (number or string with units)'),
        geoIndex1: zod_1.z.number().describe('Index of first geometry element'),
        pointPos1: zod_1.z.number().optional().describe('Point position on first element'),
        geoIndex2: zod_1.z.number().optional().describe('Index of second geometry element'),
        pointPos2: zod_1.z.number().optional().describe('Point position on second element'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatConstraintResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: set_constraint_value
 *
 * Modify the value of an existing dimensional constraint.
 */
function setConstraintValueTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('set_constraint_value', `Modify the value of an existing dimensional constraint.

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
- Change angle: { sketchName: "Sketch", constraintIndex: 2, value: "45deg" }`, {
        sketchName: zod_1.z.string().describe('Name of the sketch'),
        constraintIndex: zod_1.z.number().describe('Index of the constraint to modify (0-based)'),
        value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('New value (number or string with units)'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatConstraintResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: list_sketch_constraints
 *
 * List all constraints in a sketch.
 */
function listSketchConstraintsTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('list_sketch_constraints', `List all constraints in a sketch.

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
- List constraints: { sketchName: "Sketch" }`, {
        sketchName: zod_1.z.string().describe('Name of the sketch to query'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatSketchGeometry)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: delete_constraint
 *
 * Remove a constraint from a sketch.
 */
function deleteConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('delete_constraint', `Remove a constraint from a sketch.

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
- Delete constraint: { sketchName: "Sketch", constraintIndex: 2 }`, {
        sketchName: zod_1.z.string().describe('Name of the sketch'),
        constraintIndex: zod_1.z.number().describe('Index of the constraint to remove (0-based)'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatConstraintResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: get_sketch_geometry
 *
 * Query sketch geometry and constraints.
 */
function getSketchGeometryTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('get_sketch_geometry', `Query sketch geometry and constraints.

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
- Get geometry: { sketchName: "Sketch" }`, {
        sketchName: zod_1.z.string().describe('Name of the sketch to query'),
    }, async (input) => {
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
            const formatted = (0, result_formatters_1.formatSketchGeometry)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
// ============================================================================
// PartDesign Feature Tools
// ============================================================================
/**
 * Tool: create_body
 *
 * Create a new PartDesign Body.
 */
function createBodyTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_body', `Create a new PartDesign Body.

Parameters:
- name (optional): Name for the new body. If omitted, auto-generated.

Returns:
- success: Whether the body was created
- bodyName: Internal name of the body
- bodyLabel: User-friendly label
- message: Status message

Use this tool when you want to create a new PartDesign Body to contain parametric features.

Example:
- Create body: {}
- Create named body: { name: "MainBody" }`, {
        name: zod_1.z.string().optional().describe('Name for the new body'),
    }, async (input) => {
        const { name } = input;
        const code = `
from llm_bridge.feature_handlers import handle_create_body
import json
params = json.loads('${JSON.stringify({ name: name || null })}')
result = handle_create_body(name=params['name'])
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatBodyResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: set_active_body
 *
 * Set the active PartDesign Body for subsequent feature operations.
 */
function setActiveBodyTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('set_active_body', `Set the active PartDesign Body for subsequent feature operations.

Parameters:
- bodyName (required): Name of the body to set as active

Returns:
- success: Whether the body was set as active
- bodyName: Name of the active body
- previousBody: Name of the previously active body (if any)
- message: Status message

Use this tool before creating PartDesign features to specify which body they should be added to.

Example:
- Set active body: { bodyName: "Body" }`, {
        bodyName: zod_1.z.string().describe('Name of the body to set as active'),
    }, async (input) => {
        const { bodyName } = input;
        const code = `
from llm_bridge.feature_handlers import handle_set_active_body
import json
params = json.loads('${JSON.stringify({ bodyName })}')
result = handle_set_active_body(body_name=params['bodyName'])
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatBodyResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: list_bodies
 *
 * List all PartDesign Bodies in the active document.
 */
function listBodiesTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('list_bodies', `List all PartDesign Bodies in the active document.

Returns:
- success: Whether the query was successful
- bodyCount: Number of bodies found
- bodies: Array of body objects with name, label, feature count, and active status
- message: Status message

Use this tool to see all available bodies before creating or modifying features.

Example:
- List bodies: {}`, {
    // No parameters needed
    }, async () => {
        const code = `
from llm_bridge.feature_handlers import handle_list_bodies
import json
result = handle_list_bodies()
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatBodyList)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_pad
 *
 * Create a PartDesign Pad (extrusion) feature.
 */
function createPadTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_pad', `Create a PartDesign Pad (extrusion) feature from a sketch.

Parameters:
- sketchName (required): Name of the sketch to pad
- length (required): Length of the pad (number or string with units like "10mm")

Returns:
- success: Whether the pad was created
- featureName: Internal name of the pad feature
- featureLabel: User-friendly label
- bodyName: Name of the body containing the feature
- length: Length of the pad
- message: Status message

Use this tool to create additive extrusions from sketches in PartDesign.

Example:
- Create pad: { sketchName: "Sketch", length: "10mm" }`, {
        sketchName: zod_1.z.string().describe('Name of the sketch to pad'),
        length: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('Length of the pad (number or string with units)'),
    }, async (input) => {
        const { sketchName, length } = input;
        const code = `
from llm_bridge.feature_handlers import handle_create_pad
import json
params = json.loads('${JSON.stringify({ sketchName, length })}')
result = handle_create_pad(
    sketch_name=params['sketchName'],
    length=params['length']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatFeatureResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_pocket
 *
 * Create a PartDesign Pocket (cut/extrude remove) feature.
 */
function createPocketTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_pocket', `Create a PartDesign Pocket (cut/extrude remove) feature from a sketch.

Parameters:
- sketchName (required): Name of the sketch to pocket
- depth (required): Depth of the pocket (number or string with units like "5mm")

Returns:
- success: Whether the pocket was created
- featureName: Internal name of the pocket feature
- featureLabel: User-friendly label
- bodyName: Name of the body containing the feature
- depth: Depth of the pocket
- message: Status message

Use this tool to create subtractive extrusions (cuts) from sketches in PartDesign.

Example:
- Create pocket: { sketchName: "Sketch001", depth: "5mm" }`, {
        sketchName: zod_1.z.string().describe('Name of the sketch to pocket'),
        depth: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('Depth of the pocket (number or string with units)'),
    }, async (input) => {
        const { sketchName, depth } = input;
        const code = `
from llm_bridge.feature_handlers import handle_create_pocket
import json
params = json.loads('${JSON.stringify({ sketchName, depth })}')
result = handle_create_pocket(
    sketch_name=params['sketchName'],
    length=params['depth']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatFeatureResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_revolution
 *
 * Create a PartDesign Revolution (revolve) feature.
 */
function createRevolutionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_revolution', `Create a PartDesign Revolution (revolve) feature from a sketch.

Parameters:
- sketchName (required): Name of the sketch to revolve
- angle (required): Revolution angle (number in radians or string with units like "360deg")
- axis (optional): Axis of revolution - "Horizontal", "Vertical", "Custom" (default: "Vertical")

Returns:
- success: Whether the revolution was created
- featureName: Internal name of the revolution feature
- featureLabel: User-friendly label
- bodyName: Name of the body containing the feature
- angle: Revolution angle
- axis: Axis of revolution
- message: Status message

Use this tool to create revolved features from sketches in PartDesign.

Example:
- Full revolution: { sketchName: "Sketch", angle: "360deg" }`, {
        sketchName: zod_1.z.string().describe('Name of the sketch to revolve'),
        angle: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('Revolution angle (number in radians or string with units)'),
        axis: zod_1.z.enum(['Horizontal', 'Vertical', 'Custom']).optional().describe('Axis of revolution'),
    }, async (input) => {
        const { sketchName, angle, axis } = input;
        const code = `
from llm_bridge.feature_handlers import handle_create_revolution
import json
params = json.loads('${JSON.stringify({ sketchName, angle, axis: axis || 'Vertical' })}')
result = handle_create_revolution(
    sketch_name=params['sketchName'],
    angle=params['angle'],
    axis=params['axis']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatFeatureResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_groove
 *
 * Create a PartDesign Groove (revolved cut) feature.
 */
function createGrooveTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_groove', `Create a PartDesign Groove (revolved cut) feature from a sketch.

Parameters:
- sketchName (required): Name of the sketch to groove
- angle (required): Revolution angle (number in radians or string with units like "360deg")
- axis (optional): Axis of revolution - "Horizontal", "Vertical", "Custom" (default: "Vertical")

Returns:
- success: Whether the groove was created
- featureName: Internal name of the groove feature
- featureLabel: User-friendly label
- bodyName: Name of the body containing the feature
- angle: Revolution angle
- axis: Axis of revolution
- message: Status message

Use this tool to create revolved cuts (subtractive revolutions) from sketches in PartDesign.

Example:
- Full groove: { sketchName: "Sketch", angle: "360deg" }
- Partial groove: { sketchName: "Sketch", angle: "180deg" }`, {
        sketchName: zod_1.z.string().describe('Name of the sketch to groove'),
        angle: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('Revolution angle (number in radians or string with units)'),
        axis: zod_1.z.enum(['Horizontal', 'Vertical', 'Custom']).optional().describe('Axis of revolution'),
    }, async (input) => {
        const { sketchName, angle, axis } = input;
        const code = `
from llm_bridge.feature_handlers import handle_create_groove
import json
params = json.loads('${JSON.stringify({ sketchName, angle, axis: axis || 'Vertical' })}')
result = handle_create_groove(
    sketch_name=params['sketchName'],
    angle=params['angle'],
    axis=params['axis']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatFeatureResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_fillet
 *
 * Create a PartDesign Fillet (rounded edge) feature.
 */
function createFilletTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_fillet', `Create a PartDesign Fillet (rounded edge) feature.

Parameters:
- featureName (required): Name of the base feature to fillet
- edges (required): Array of edge indices to fillet (0-based)
- radius (required): Fillet radius (number or string with units like "2mm")

Returns:
- success: Whether the fillet was created
- featureName: Internal name of the fillet feature
- featureLabel: User-friendly label
- baseFeature: Name of the base feature
- radius: Fillet radius
- edgesCount: Number of edges filleted
- message: Status message

Use this tool to add rounded edges to PartDesign bodies.

Example:
- Fillet single edge: { featureName: "Pad", edges: [0], radius: "2mm" }
- Fillet multiple edges: { featureName: "Pad", edges: [0, 1, 2], radius: "3mm" }`, {
        featureName: zod_1.z.string().describe('Name of the base feature to fillet'),
        edges: zod_1.z.array(zod_1.z.number()).describe('Array of edge indices to fillet (0-based)'),
        radius: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('Fillet radius (number or string with units)'),
    }, async (input) => {
        const { featureName, edges, radius } = input;
        const code = `
from llm_bridge.feature_handlers import handle_create_fillet
import json
params = json.loads('${JSON.stringify({ featureName, edges, radius })}')
result = handle_create_fillet(
    feature_name=params['featureName'],
    edges=params['edges'],
    radius=params['radius']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatFeatureResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_chamfer
 *
 * Create a PartDesign Chamfer (beveled edge) feature.
 */
function createChamferTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_chamfer', `Create a PartDesign Chamfer (beveled edge) feature.

Parameters:
- featureName (required): Name of the base feature to chamfer
- edges (required): Array of edge indices to chamfer (0-based)
- size (required): Chamfer size (number or string with units like "2mm")

Returns:
- success: Whether the chamfer was created
- featureName: Internal name of the chamfer feature
- featureLabel: User-friendly label
- baseFeature: Name of the base feature
- size: Chamfer size
- edgesCount: Number of edges chamfered
- message: Status message

Use this tool to add beveled edges to PartDesign bodies.

Example:
- Chamfer single edge: { featureName: "Pad", edges: [0], size: "2mm" }
- Chamfer multiple edges: { featureName: "Pad", edges: [0, 1, 2], size: "3mm" }`, {
        featureName: zod_1.z.string().describe('Name of the base feature to chamfer'),
        edges: zod_1.z.array(zod_1.z.number()).describe('Array of edge indices to chamfer (0-based)'),
        size: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('Chamfer size (number or string with units)'),
    }, async (input) => {
        const { featureName, edges, size } = input;
        const code = `
from llm_bridge.feature_handlers import handle_create_chamfer
import json
params = json.loads('${JSON.stringify({ featureName, edges, size })}')
result = handle_create_chamfer(
    feature_name=params['featureName'],
    edges=params['edges'],
    size=params['size']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatFeatureResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: update_feature
 *
 * Update a dimension of a PartDesign feature.
 */
function updateFeatureTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('update_feature', `Update a dimension of a PartDesign feature.

Parameters:
- featureName (required): Name of the feature to update
- dimension (required): Dimension to update - "length", "depth", "angle", "radius"
- value (required): New value (number or string with units like "15mm", "90deg")

Returns:
- success: Whether the feature was updated
- featureName: Name of the updated feature
- dimension: Dimension that was changed
- beforeValue: Previous value
- afterValue: New value
- message: Status message

Use this tool to parametrically modify PartDesign feature dimensions.

Example:
- Update pad length: { featureName: "Pad", dimension: "length", value: "20mm" }
- Update pocket depth: { featureName: "Pocket", dimension: "depth", value: "10mm" }
- Update revolution angle: { featureName: "Revolution", dimension: "angle", value: "270deg" }`, {
        featureName: zod_1.z.string().describe('Name of the feature to update'),
        dimension: zod_1.z.enum(['length', 'depth', 'angle', 'radius']).describe('Dimension to update'),
        value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('New value (number or string with units)'),
    }, async (input) => {
        const { featureName, dimension, value } = input;
        const code = `
from llm_bridge.feature_handlers import handle_update_feature
import json
params = json.loads('${JSON.stringify({ featureName, dimension, value })}')
result = handle_update_feature(
    feature_name=params['featureName'],
    dimension=params['dimension'],
    value=params['value']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatFeatureUpdate)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: replace_sketch
 *
 * Replace the sketch of a PartDesign feature with a different sketch.
 */
function replaceSketchTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('replace_sketch', `Replace the sketch of a PartDesign feature with a different sketch.

Parameters:
- featureName (required): Name of the feature to update
- sketchName (required): Name of the new sketch to use

Returns:
- success: Whether the sketch was replaced
- featureName: Name of the updated feature
- featureLabel: User-friendly label
- oldSketchName: Name of the previous sketch
- newSketchName: Name of the new sketch
- message: Status message

Use this tool to change the profile sketch of an existing PartDesign feature.

Example:
- Replace sketch: { featureName: "Pad", sketchName: "Sketch001" }`, {
        featureName: zod_1.z.string().describe('Name of the feature to update'),
        sketchName: zod_1.z.string().describe('Name of the new sketch to use'),
    }, async (input) => {
        const { featureName, sketchName } = input;
        const code = `
from llm_bridge.feature_handlers import handle_replace_sketch
import json
params = json.loads('${JSON.stringify({ featureName, sketchName })}')
result = handle_replace_sketch(
    feature_name=params['featureName'],
    sketch_name=params['sketchName']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatFeatureResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: delete_feature
 *
 * Delete a PartDesign feature from a body.
 */
function deleteFeatureTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('delete_feature', `Delete a PartDesign feature from a body.

Parameters:
- featureName (required): Name of the feature to delete

Returns:
- success: Whether the feature was deleted
- featureName: Name of the deleted feature
- featureType: Type of the deleted feature
- message: Status message

Use this tool to remove unwanted PartDesign features. Note: Deleting a feature may affect dependent features.

Example:
- Delete feature: { featureName: "Fillet1" }`, {
        featureName: zod_1.z.string().describe('Name of the feature to delete'),
    }, async (input) => {
        const { featureName } = input;
        const code = `
from llm_bridge.feature_handlers import handle_delete_feature
import json
params = json.loads('${JSON.stringify({ featureName })}')
result = handle_delete_feature(
    feature_name=params['featureName']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatFeatureResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: boolean_fuse
 *
 * Perform a boolean union (fuse) operation on shapes.
 */
function booleanFuseTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('boolean_fuse', `Perform a boolean union (fuse) operation on two or more shapes.

Parameters:
- baseShape (required): Name of the base shape/object
- toolShapes (required): Array of shape/object names to fuse with the base
- resultName (optional): Name for the resulting fused shape. If omitted, auto-generated.

Returns:
- success: Whether the fuse operation was successful
- resultName: Name of the resulting fused shape
- resultLabel: User-friendly label
- shapeType: Type of the resulting shape
- volume: Volume of the result (if calculable)
- message: Status message

Use this tool to combine multiple shapes into a single unified shape.

Example:
- Fuse two shapes: { baseShape: "Box", toolShapes: ["Cylinder"] }
- Fuse multiple shapes: { baseShape: "Box", toolShapes: ["Cylinder", "Sphere"], resultName: "CombinedPart" }`, {
        baseShape: zod_1.z.string().describe('Name of the base shape/object'),
        toolShapes: zod_1.z.array(zod_1.z.string()).describe('Array of shape/object names to fuse with the base'),
        resultName: zod_1.z.string().optional().describe('Name for the resulting fused shape'),
    }, async (input) => {
        const { baseShape, toolShapes, resultName } = input;
        const code = `
from llm_bridge.boolean_handlers import handle_boolean_fuse
import json
params = json.loads('${JSON.stringify({ baseShape, toolShapes, resultName: resultName || null })}')
result = handle_boolean_fuse(
    base_shape=params['baseShape'],
    tool_shapes=params['toolShapes'],
    result_name=params['resultName']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatShapeResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: boolean_cut
 *
 * Perform a boolean cut (subtract) operation on shapes.
 */
function booleanCutTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('boolean_cut', `Perform a boolean cut (subtract) operation - subtract tool shapes from a base shape.

Parameters:
- baseShape (required): Name of the base shape/object to cut from
- toolShapes (required): Array of shape/object names to subtract from the base
- resultName (optional): Name for the resulting cut shape. If omitted, auto-generated.

Returns:
- success: Whether the cut operation was successful
- resultName: Name of the resulting cut shape
- resultLabel: User-friendly label
- shapeType: Type of the resulting shape
- volume: Volume of the result (if calculable)
- message: Status message

Use this tool to subtract material from a base shape, creating cuts, holes, or cavities.

Example:
- Cut one shape from another: { baseShape: "Box", toolShapes: ["Cylinder"] }
- Cut multiple shapes: { baseShape: "Box", toolShapes: ["Cylinder", "Sphere"], resultName: "CutPart" }`, {
        baseShape: zod_1.z.string().describe('Name of the base shape/object to cut from'),
        toolShapes: zod_1.z.array(zod_1.z.string()).describe('Array of shape/object names to subtract from the base'),
        resultName: zod_1.z.string().optional().describe('Name for the resulting cut shape'),
    }, async (input) => {
        const { baseShape, toolShapes, resultName } = input;
        const code = `
from llm_bridge.boolean_handlers import handle_boolean_cut
import json
params = json.loads('${JSON.stringify({ baseShape, toolShapes, resultName: resultName || null })}')
result = handle_boolean_cut(
    base_shape=params['baseShape'],
    tool_shapes=params['toolShapes'],
    result_name=params['resultName']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatShapeResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: boolean_common
 *
 * Perform a boolean intersection (common) operation on shapes.
 */
function booleanCommonTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('boolean_common', `Perform a boolean intersection (common) operation - find the shared volume between shapes.

Parameters:
- baseShape (required): Name of the base shape/object
- toolShapes (required): Array of shape/object names to intersect with the base
- resultName (optional): Name for the resulting intersection shape. If omitted, auto-generated.

Returns:
- success: Whether the intersection operation was successful
- resultName: Name of the resulting intersection shape
- resultLabel: User-friendly label
- shapeType: Type of the resulting shape
- volume: Volume of the result (if calculable)
- message: Status message

Use this tool to find the common/shared volume between multiple shapes.

Example:
- Intersect two shapes: { baseShape: "Box", toolShapes: ["Cylinder"] }
- Intersect multiple shapes: { baseShape: "Box", toolShapes: ["Cylinder", "Sphere"], resultName: "CommonPart" }`, {
        baseShape: zod_1.z.string().describe('Name of the base shape/object'),
        toolShapes: zod_1.z.array(zod_1.z.string()).describe('Array of shape/object names to intersect with the base'),
        resultName: zod_1.z.string().optional().describe('Name for the resulting intersection shape'),
    }, async (input) => {
        const { baseShape, toolShapes, resultName } = input;
        const code = `
from llm_bridge.boolean_handlers import handle_boolean_common
import json
params = json.loads('${JSON.stringify({ baseShape, toolShapes, resultName: resultName || null })}')
result = handle_boolean_common(
    base_shape=params['baseShape'],
    tool_shapes=params['toolShapes'],
    result_name=params['resultName']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatShapeResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: make_compound
 *
 * Create a compound of multiple shapes without boolean fusion.
 */
function makeCompoundTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('make_compound', `Create a compound of multiple shapes - groups shapes together without boolean fusion.

Parameters:
- shapes (required): Array of shape/object names to compound
- resultName (optional): Name for the resulting compound. If omitted, auto-generated.

Returns:
- success: Whether the compound was created
- resultName: Name of the resulting compound
- resultLabel: User-friendly label
- shapeCount: Number of shapes in the compound
- message: Status message

Use this tool to group multiple shapes together while keeping them as separate solids within a compound.
Unlike boolean_fuse, this does not merge the shapes - they remain distinct but are treated as a single object.

Example:
- Compound two shapes: { shapes: ["Box", "Cylinder"] }
- Compound multiple shapes: { shapes: ["Box", "Cylinder", "Sphere"], resultName: "Assembly" }`, {
        shapes: zod_1.z.array(zod_1.z.string()).describe('Array of shape/object names to compound'),
        resultName: zod_1.z.string().optional().describe('Name for the resulting compound'),
    }, async (input) => {
        const { shapes, resultName } = input;
        const code = `
from llm_bridge.boolean_handlers import handle_make_compound
import json
params = json.loads('${JSON.stringify({ shapes, resultName: resultName || null })}')
result = handle_make_compound(
    shapes=params['shapes'],
    result_name=params['resultName']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatShapeResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: validate_shape
 *
 * Validate a shape for integrity and defects.
 */
function validateShapeTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('validate_shape', `Validate a shape for integrity and detect defects.

Parameters:
- shapeName (required): Name of the shape/object to validate

Returns:
- success: Whether the validation was successful
- shapeName: Name of the validated shape
- isValid: Whether the shape is valid
- issues: Array of detected issues (if any)
- issueCount: Number of issues found
- message: Status message

Use this tool to check if a shape has any geometric defects such as:
- Free edges
- Non-manifold edges
- Invalid orientation
- Self-intersections
- Degenerate faces

Example:
- Validate a shape: { shapeName: "Pad" }`, {
        shapeName: zod_1.z.string().describe('Name of the shape/object to validate'),
    }, async (input) => {
        const { shapeName } = input;
        const code = `
from llm_bridge.boolean_handlers import handle_validate_shape
import json
params = json.loads('${JSON.stringify({ shapeName })}')
result = handle_validate_shape(shape_name=params['shapeName'])
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatShapeValidation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: heal_shape
 *
 * Attempt to fix shape defects and improve shape quality.
 */
function healShapeTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('heal_shape', `Attempt to fix shape defects and improve shape quality.

Parameters:
- shapeName (required): Name of the shape/object to heal
- tolerance (optional): Healing tolerance value (default: 0.1mm)

Returns:
- success: Whether the healing was successful
- shapeName: Name of the healed shape
- issuesFixed: Number of issues that were fixed
- remainingIssues: Number of remaining issues (if any)
- message: Status message

Use this tool to automatically fix common shape defects such as:
- Small gaps between faces
- Tolerance issues
- Invalid edge connections
- Degenerate geometry

Example:
- Heal a shape with default tolerance: { shapeName: "ImportedPart" }
- Heal with custom tolerance: { shapeName: "ImportedPart", tolerance: "0.01mm" }`, {
        shapeName: zod_1.z.string().describe('Name of the shape/object to heal'),
        tolerance: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional().describe('Healing tolerance value (default: 0.1mm)'),
    }, async (input) => {
        const { shapeName, tolerance } = input;
        const code = `
from llm_bridge.boolean_handlers import handle_heal_shape
import json
params = json.loads('${JSON.stringify({ shapeName, tolerance: tolerance || null })}')
result = handle_heal_shape(
    shape_name=params['shapeName'],
    tolerance=params['tolerance']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatShapeResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: get_shape_info
 *
 * Get detailed information about a shape's properties and topology.
 */
function getShapeInfoTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('get_shape_info', `Get detailed information about a shape's properties and topology.

Parameters:
- shapeName (required): Name of the shape/object to query

Returns:
- success: Whether the query was successful
- shapeName: Name of the shape
- shapeType: Type of shape (Solid, Shell, Compound, etc.)
- topology: Topology counts (vertices, edges, faces, shells, solids)
- properties: Geometric properties (volume, area, center of mass, bounding box)
- message: Status message

Use this tool to get comprehensive information about a shape including:
- Topology counts (vertices, edges, faces)
- Geometric properties (volume, surface area)
- Center of mass
- Bounding box dimensions

Example:
- Get shape info: { shapeName: "Pad" }`, {
        shapeName: zod_1.z.string().describe('Name of the shape/object to query'),
    }, async (input) => {
        const { shapeName } = input;
        const code = `
from llm_bridge.boolean_handlers import handle_get_shape_info
import json
params = json.loads('${JSON.stringify({ shapeName })}')
result = handle_get_shape_info(shape_name=params['shapeName'])
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatShapeInfo)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
// ============================================================================
// Assembly Management Tools
// ============================================================================
/**
 * Tool: create_assembly
 *
 * Create a new assembly container.
 */
function createAssemblyTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_assembly', `Create a new assembly container to hold multiple parts.

Parameters:
- name (optional): Name for the new assembly. If omitted, auto-generated.

Returns:
- success: Whether the assembly was created
- assemblyName: Internal name of the assembly
- assemblyLabel: User-friendly label
- componentCount: Number of components (initially 0)
- message: Status message

Use this tool to create a new assembly container for organizing multiple parts.

Example:
- Create assembly: {}
- Create named assembly: { name: "EngineAssembly" }`, {
        name: zod_1.z.string().optional().describe('Name for the new assembly'),
    }, async (input) => {
        const { name } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_create_assembly
import json
params = json.loads('${JSON.stringify({ name: name || null })}')
result = handle_create_assembly(name=params['name'])
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatAssemblyCreationResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_coincident_constraint
 *
 * Add a coincident constraint between two subobjects.
 */
function addCoincidentConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_coincident_constraint', `Add a coincident constraint between two subobjects - makes them meet at a point or edge.

Parameters:
- object1 (required): Name of the first object
- subobject1 (required): Subobject reference for first object (e.g., "Face1", "Edge1", "Vertex1")
- object2 (required): Name of the second object
- subobject2 (required): Subobject reference for second object
- name (optional): Name for the constraint. If omitted, auto-generated.

Returns:
- success: Whether the constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Coincident")
- message: Status message

Use this tool to make two subobjects coincident (meet at the same location).

Example:
- Coincident vertices: { object1: "Box", subobject1: "Vertex1", object2: "Cylinder", subobject2: "Vertex1" }
- Coincident faces: { object1: "Part", subobject1: "Face1", object2: "Base", subobject2: "Face1" }`, {
        object1: zod_1.z.string().describe('Name of the first object'),
        subobject1: zod_1.z.string().describe('Subobject reference (e.g., "Face1", "Edge1", "Vertex1")'),
        object2: zod_1.z.string().describe('Name of the second object'),
        subobject2: zod_1.z.string().describe('Subobject reference for second object'),
        name: zod_1.z.string().optional().describe('Name for the constraint'),
    }, async (input) => {
        const { object1, subobject1, object2, subobject2, name } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_add_coincident_constraint
import json
params = json.loads('${JSON.stringify({ object1, subobject1, object2, subobject2, name: name || null })}')
result = handle_add_coincident_constraint(
    object1=params['object1'],
    subobject1=params['subobject1'],
    object2=params['object2'],
    subobject2=params['subobject2'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatConstraintCreationResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_parallel_constraint
 *
 * Add a parallel constraint between two subobjects.
 */
function addParallelConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_parallel_constraint', `Add a parallel constraint between two subobjects - makes them parallel to each other.

Parameters:
- object1 (required): Name of the first object
- subobject1 (required): Subobject reference for first object (e.g., "Face1", "Edge1")
- object2 (required): Name of the second object
- subobject2 (required): Subobject reference for second object
- name (optional): Name for the constraint. If omitted, auto-generated.

Returns:
- success: Whether the constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Parallel")
- message: Status message

Use this tool to make two subobjects parallel (aligned in the same direction).

Example:
- Parallel faces: { object1: "Box", subobject1: "Face1", object2: "Plate", subobject2: "Face1" }
- Parallel edges: { object1: "Rod", subobject1: "Edge1", object2: "Guide", subobject2: "Edge1" }`, {
        object1: zod_1.z.string().describe('Name of the first object'),
        subobject1: zod_1.z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
        object2: zod_1.z.string().describe('Name of the second object'),
        subobject2: zod_1.z.string().describe('Subobject reference for second object'),
        name: zod_1.z.string().optional().describe('Name for the constraint'),
    }, async (input) => {
        const { object1, subobject1, object2, subobject2, name } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_add_parallel_constraint
import json
params = json.loads('${JSON.stringify({ object1, subobject1, object2, subobject2, name: name || null })}')
result = handle_add_parallel_constraint(
    object1=params['object1'],
    subobject1=params['subobject1'],
    object2=params['object2'],
    subobject2=params['subobject2'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatConstraintCreationResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_perpendicular_constraint
 *
 * Add a perpendicular constraint between two subobjects.
 */
function addPerpendicularConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_perpendicular_constraint', `Add a perpendicular constraint between two subobjects - makes them orthogonal.

Parameters:
- object1 (required): Name of the first object
- subobject1 (required): Subobject reference for first object (e.g., "Face1", "Edge1")
- object2 (required): Name of the second object
- subobject2 (required): Subobject reference for second object
- name (optional): Name for the constraint. If omitted, auto-generated.

Returns:
- success: Whether the constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Perpendicular")
- message: Status message

Use this tool to make two subobjects perpendicular (at 90 degrees to each other).

Example:
- Perpendicular faces: { object1: "Box", subobject1: "Face1", object2: "Wall", subobject2: "Face1" }
- Perpendicular edges: { object1: "Beam", subobject1: "Edge1", object2: "Support", subobject2: "Edge1" }`, {
        object1: zod_1.z.string().describe('Name of the first object'),
        subobject1: zod_1.z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
        object2: zod_1.z.string().describe('Name of the second object'),
        subobject2: zod_1.z.string().describe('Subobject reference for second object'),
        name: zod_1.z.string().optional().describe('Name for the constraint'),
    }, async (input) => {
        const { object1, subobject1, object2, subobject2, name } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_add_perpendicular_constraint
import json
params = json.loads('${JSON.stringify({ object1, subobject1, object2, subobject2, name: name || null })}')
result = handle_add_perpendicular_constraint(
    object1=params['object1'],
    subobject1=params['subobject1'],
    object2=params['object2'],
    subobject2=params['subobject2'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatConstraintCreationResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_angle_constraint
 *
 * Add an angle constraint between two subobjects.
 */
function addAngleConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_angle_constraint', `Add an angle constraint between two subobjects - constrains them to a specific angle.

Parameters:
- object1 (required): Name of the first object
- subobject1 (required): Subobject reference for first object (e.g., "Face1", "Edge1")
- object2 (required): Name of the second object
- subobject2 (required): Subobject reference for second object
- angle (required): Angle value in degrees
- name (optional): Name for the constraint. If omitted, auto-generated.

Returns:
- success: Whether the constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Angle")
- angle: The constrained angle in degrees
- message: Status message

Use this tool to set a specific angle between two subobjects.

Example:
- 45 degree angle: { object1: "Arm", subobject1: "Edge1", object2: "Base", subobject2: "Edge1", angle: 45 }
- 90 degree angle: { object1: "Bracket", subobject1: "Face1", object2: "Plate", subobject2: "Face1", angle: 90 }`, {
        object1: zod_1.z.string().describe('Name of the first object'),
        subobject1: zod_1.z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
        object2: zod_1.z.string().describe('Name of the second object'),
        subobject2: zod_1.z.string().describe('Subobject reference for second object'),
        angle: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('Angle value in degrees'),
        name: zod_1.z.string().optional().describe('Name for the constraint'),
    }, async (input) => {
        const { object1, subobject1, object2, subobject2, angle, name } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_add_angle_constraint
import json
params = json.loads('${JSON.stringify({ object1, subobject1, object2, subobject2, angle, name: name || null })}')
result = handle_add_angle_constraint(
    object1=params['object1'],
    subobject1=params['subobject1'],
    object2=params['object2'],
    subobject2=params['subobject2'],
    angle=params['angle'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatConstraintCreationResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_distance_constraint
 *
 * Add a distance constraint between two subobjects.
 */
function addDistanceConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_distance_constraint', `Add a distance constraint between two subobjects.

Parameters:
- object1 (required): Name of the first object
- subobject1 (required): Subobject reference for first object (e.g., "Face1", "Edge1")
- object2 (required): Name of the second object
- subobject2 (required): Subobject reference for second object
- distance (required): Distance value in millimeters
- name (optional): Name for the constraint. If omitted, auto-generated.

Returns:
- success: Whether the constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Distance")
- distance: The constrained distance in mm
- message: Status message

Use this tool to set a specific distance between two subobjects.

Example:
- Set 10mm gap: { object1: "Box", subobject1: "Face1", object2: "Cylinder", subobject2: "Face2", distance: 10 }`, {
        object1: zod_1.z.string().describe('Name of the first object'),
        subobject1: zod_1.z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
        object2: zod_1.z.string().describe('Name of the second object'),
        subobject2: zod_1.z.string().describe('Subobject reference for second object'),
        distance: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).describe('Distance value in mm or string like "10mm"'),
        name: zod_1.z.string().optional().describe('Name for the constraint'),
    }, async (input) => {
        const { object1, subobject1, object2, subobject2, distance, name } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_add_distance_constraint
import json
params = json.loads('${JSON.stringify({ object1, subobject1, object2, subobject2, distance, name: name || null })}')
result = handle_add_distance_constraint(
    object1=params['object1'],
    subobject1=params['subobject1'],
    object2=params['object2'],
    subobject2=params['subobject2'],
    distance=params['distance'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatConstraintCreationResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_insert_constraint
 *
 * Add an insert (cylindrical fit) constraint.
 */
function addInsertConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_insert_constraint', `Add an insert constraint - mates a cylindrical subobject into another (shaft into hole).

Parameters:
- object1 (required): Name of the first object (the inserted part)
- subobject1 (required): Subobject reference (e.g., "Cylinder", "Face1")
- object2 (required): Name of the second object (the receiving part)
- subobject2 (required): Subobject reference for the receiving part (e.g., "Face2")
- name (optional): Name for the constraint. If omitted, auto-generated.

Returns:
- success: Whether the constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Insert")
- message: Status message

Use this tool to insert one cylindrical subobject into another (e.g., pin into hole).

Example:
- Insert pin into hole: { object1: "Pin", subobject1: "Cylinder", object2: "Plate", subobject2: "Cylinder" }`, {
        object1: zod_1.z.string().describe('Name of the first object (inserted part)'),
        subobject1: zod_1.z.string().describe('Subobject reference (e.g., "Cylinder", "Face1")'),
        object2: zod_1.z.string().describe('Name of the second object (receiving part)'),
        subobject2: zod_1.z.string().describe('Subobject reference for receiving part'),
        name: zod_1.z.string().optional().describe('Name for the constraint'),
    }, async (input) => {
        const { object1, subobject1, object2, subobject2, name } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_add_insert_constraint
import json
params = json.loads('${JSON.stringify({ object1, subobject1, object2, subobject2, name: name || null })}')
result = handle_add_insert_constraint(
    object1=params['object1'],
    subobject1=params['subobject1'],
    object2=params['object2'],
    subobject2=params['subobject2'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatConstraintCreationResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_tangent_constraint
 *
 * Add a tangent constraint between two subobjects.
 */
function addTangentConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_tangent_constraint', `Add a tangent constraint between two subobjects.

Parameters:
- object1 (required): Name of the first object
- subobject1 (required): Subobject reference for first object (e.g., "Face1", "Edge1")
- object2 (required): Name of the second object
- subobject2 (required): Subobject reference for second object
- name (optional): Name for the constraint. If omitted, auto-generated.

Returns:
- success: Whether the constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Tangent")
- message: Status message

Use this tool to make two subobjects tangent (touching at a single point without intersecting).

Example:
- Make tangent: { object1: "Sphere", subobject1: "Face1", object2: "Plane", subobject2: "Face1" }`, {
        object1: zod_1.z.string().describe('Name of the first object'),
        subobject1: zod_1.z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
        object2: zod_1.z.string().describe('Name of the second object'),
        subobject2: zod_1.z.string().describe('Subobject reference for second object'),
        name: zod_1.z.string().optional().describe('Name for the constraint'),
    }, async (input) => {
        const { object1, subobject1, object2, subobject2, name } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_add_tangent_constraint
import json
params = json.loads('${JSON.stringify({ object1, subobject1, object2, subobject2, name: name || null })}')
result = handle_add_tangent_constraint(
    object1=params['object1'],
    subobject1=params['subobject1'],
    object2=params['object2'],
    subobject2=params['subobject2'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatConstraintCreationResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_equal_constraint
 *
 * Add an equal constraint (equal length, radius, etc.) between two subobjects.
 */
function addEqualConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_equal_constraint', `Add an equal constraint between two subobjects - makes them equal in size.

Parameters:
- object1 (required): Name of the first object
- subobject1 (required): Subobject reference for first object (e.g., "Edge1", "Cylinder")
- object2 (required): Name of the second object
- subobject2 (required): Subobject reference for second object
- name (optional): Name for the constraint. If omitted, auto-generated.

Returns:
- success: Whether the constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Equal")
- message: Status message

Use this tool to make two subobjects equal (same length, radius, etc.).

Example:
- Equal radius: { object1: "Cylinder1", subobject1: "Cylinder", object2: "Cylinder2", subobject2: "Cylinder" }`, {
        object1: zod_1.z.string().describe('Name of the first object'),
        subobject1: zod_1.z.string().describe('Subobject reference (e.g., "Edge1", "Cylinder")'),
        object2: zod_1.z.string().describe('Name of the second object'),
        subobject2: zod_1.z.string().describe('Subobject reference for second object'),
        name: zod_1.z.string().optional().describe('Name for the constraint'),
    }, async (input) => {
        const { object1, subobject1, object2, subobject2, name } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_add_equal_constraint
import json
params = json.loads('${JSON.stringify({ object1, subobject1, object2, subobject2, name: name || null })}')
result = handle_add_equal_constraint(
    object1=params['object1'],
    subobject1=params['subobject1'],
    object2=params['object2'],
    subobject2=params['subobject2'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatConstraintCreationResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: add_symmetric_constraint
 *
 * Add a symmetric constraint between two subobjects about a plane.
 */
function addSymmetricConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('add_symmetric_constraint', `Add a symmetric constraint between two subobjects about a plane.

Parameters:
- object1 (required): Name of the first object
- subobject1 (required): Subobject reference for first object (e.g., "Face1", "Edge1")
- object2 (required): Name of the second object
- subobject2 (required): Subobject reference for second object
- symmetryPlane (required): Reference to the symmetry plane (e.g., "XY_Plane", "Face3")
- name (optional): Name for the constraint. If omitted, auto-generated.

Returns:
- success: Whether the constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Symmetric")
- message: Status message

Use this tool to make two subobjects symmetric about a plane (e.g., mirror each other).

Example:
- Symmetric about XY plane: { object1: "LeftPart", subobject1: "Face1", object2: "RightPart", subobject2: "Face1", symmetryPlane: "XY_Plane" }`, {
        object1: zod_1.z.string().describe('Name of the first object'),
        subobject1: zod_1.z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
        object2: zod_1.z.string().describe('Name of the second object'),
        subobject2: zod_1.z.string().describe('Subobject reference for second object'),
        symmetryPlane: zod_1.z.string().optional().describe('Reference to the symmetry plane (optional)'),
        name: zod_1.z.string().optional().describe('Name for the constraint'),
    }, async (input) => {
        const { object1, subobject1, object2, subobject2, symmetryPlane, name } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_add_symmetric_constraint
import json
params = json.loads('${JSON.stringify({ object1, subobject1, object2, subobject2, symmetryPlane, name: name || null })}')
result = handle_add_symmetric_constraint(
    object1=params['object1'],
    subobject1=params['subobject1'],
    object2=params['object2'],
    subobject2=params['subobject2'],
    symmetry_plane=params['symmetryPlane'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatConstraintCreationResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
// ============================================================================
// Assembly Constraint Modification Tools
// ============================================================================
/**
 * Tool: update_constraint_value
 *
 * Update the value of an existing constraint.
 */
function updateConstraintValueTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('update_constraint_value', `Update the value of an existing constraint (angle or distance).

Parameters:
- constraintName (required): Name of the constraint to update
- newValue (required): New value for the constraint (number in degrees for angle, mm for distance)

Returns:
- success: Whether the constraint was updated
- constraintName: Name of the updated constraint
- oldValue: Previous value
- newValue: New value
- solverStatus: Status of the assembly solver
- message: Status message

Use this tool to modify constraint values parametrically.

Example:
- Change angle: { constraintName: "Angle1", newValue: 60 }
- Change distance: { constraintName: "Distance1", newValue: 15 }`, {
        constraintName: zod_1.z.string().describe('Name of the constraint to update'),
        newValue: zod_1.z.number().describe('New value for the constraint (degrees for angle, mm for distance)'),
    }, async (input) => {
        const { constraintName, newValue } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_update_constraint_value
import json
params = json.loads('${JSON.stringify({ constraintName, newValue })}')
result = handle_update_constraint_value(
    constraint_name=params['constraintName'],
    new_value=params['newValue']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatConstraintUpdate)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: remove_constraint
 *
 * Remove a constraint from an assembly.
 */
function removeConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('remove_constraint', `Remove a constraint from an assembly.

Parameters:
- constraintName (required): Name of the constraint to remove

Returns:
- success: Whether the constraint was removed
- removedConstraint: Name of the removed constraint
- message: Status message

Use this tool to delete unwanted constraints from an assembly.

Example:
- Remove constraint: { constraintName: "Coincident1" }`, {
        constraintName: zod_1.z.string().describe('Name of the constraint to remove'),
    }, async (input) => {
        const { constraintName } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_remove_constraint
import json
params = json.loads('${JSON.stringify({ constraintName })}')
result = handle_remove_constraint(constraint_name=params['constraintName'])
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
                            text: `Removed constraint: ${constraintName}\n${parsed.message || ''}`,
                        },
                    ],
                };
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: list_constraints
 *
 * List all constraints in an assembly.
 */
function listConstraintsTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('list_constraints', `List all constraints in an assembly.

Parameters:
- assemblyName (optional): Name of the assembly to query. If omitted, uses the active assembly.

Returns:
- success: Whether the query was successful
- assemblyName: Name of the assembly
- constraints: Array of constraint objects with name, type, objects, value, status
- constraintCount: Number of constraints
- message: Status message

Use this tool to see all constraints in an assembly.

Example:
- List all constraints: {}
- List in specific assembly: { assemblyName: "EngineAssembly" }`, {
        assemblyName: zod_1.z.string().optional().describe('Name of the assembly to query'),
    }, async (input) => {
        const { assemblyName } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_list_constraints
import json
params = json.loads('${JSON.stringify({ assemblyName: assemblyName || null })}')
result = handle_list_constraints(assembly_name=params['assemblyName'])
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatConstraintList)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: suppress_constraint
 *
 * Temporarily disable a constraint.
 */
function suppressConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('suppress_constraint', `Temporarily disable (suppress) a constraint in an assembly.

Parameters:
- constraintName (required): Name of the constraint to suppress

Returns:
- success: Whether the constraint was suppressed
- constraintName: Name of the suppressed constraint
- message: Status message

Use this tool to temporarily disable a constraint without deleting it. The assembly will ignore this constraint until it is activated again.

Example:
- Suppress constraint: { constraintName: "Distance1" }`, {
        constraintName: zod_1.z.string().describe('Name of the constraint to suppress'),
    }, async (input) => {
        const { constraintName } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_suppress_constraint
import json
params = json.loads('${JSON.stringify({ constraintName })}')
result = handle_suppress_constraint(constraint_name=params['constraintName'])
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
                            text: `Suppressed constraint: ${constraintName}\n${parsed.message || ''}`,
                        },
                    ],
                };
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: activate_constraint
 *
 * Re-enable a suppressed constraint.
 */
function activateConstraintTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('activate_constraint', `Re-enable (activate) a previously suppressed constraint.

Parameters:
- constraintName (required): Name of the constraint to activate

Returns:
- success: Whether the constraint was activated
- constraintName: Name of the activated constraint
- message: Status message

Use this tool to re-enable a constraint that was previously suppressed.

Example:
- Activate constraint: { constraintName: "Distance1" }`, {
        constraintName: zod_1.z.string().describe('Name of the constraint to activate'),
    }, async (input) => {
        const { constraintName } = input;
        const code = `
from llm_bridge.assembly_handlers import handle_activate_constraint
import json
params = json.loads('${JSON.stringify({ constraintName })}')
result = handle_activate_constraint(constraint_name=params['constraintName'])
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
                            text: `Activated constraint: ${constraintName}\n${parsed.message || ''}`,
                        },
                    ],
                };
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
// ============================================================================
// Draft Workbench Tools
// ============================================================================
/**
 * Tool: create_point
 *
 * Create a point in 3D space.
 */
function createPointTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_point', `Create a point in 3D space using the Draft workbench.

Parameters:
- x (required): X coordinate in mm
- y (required): Y coordinate in mm
- z (optional): Z coordinate in mm (default: 0)
- name (optional): Name for the point. If omitted, auto-generated.

Returns:
- success: Whether the point was created
- objectName: Internal name of the point
- objectType: Type of object ("Point")
- coordinates: {x, y, z} position of the point
- message: Status message

Use this tool when you need to create a single point in 3D space.

Example:
- Create point at origin: { x: 0, y: 0, z: 0 }
- Create point at (10, 20, 5): { x: 10, y: 20, z: 5 }
- Named point: { x: 50, y: 50, name: "PointA" }`, {
        x: zod_1.z.number().describe('X coordinate in mm'),
        y: zod_1.z.number().describe('Y coordinate in mm'),
        z: zod_1.z.number().optional().default(0).describe('Z coordinate in mm (default: 0)'),
        name: zod_1.z.string().optional().describe('Name for the point'),
    }, async (input) => {
        const { x, y, z, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_point
import json
params = json.loads('${JSON.stringify({ x, y, z: z || 0, name: name || null })}')
result = handle_create_point(
    x=params['x'],
    y=params['y'],
    z=params.get('z', 0),
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatPointCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_line
 *
 * Create a line between two points.
 */
function createLineTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_line', `Create a line segment between two points using the Draft workbench.

Parameters:
- startX, startY, startZ (required): Start point coordinates in mm
- endX, endY, endZ (required): End point coordinates in mm
- name (optional): Name for the line. If omitted, auto-generated.

Returns:
- success: Whether the line was created
- objectName: Internal name of the line
- objectType: Type of object ("Line")
- startPoint: {x, y, z} of start
- endPoint: {x, y, z} of end
- message: Status message

Use this tool when you need to create a straight line segment.

Example:
- Create line from (0,0,0) to (100,50,0): { startX: 0, startY: 0, startZ: 0, endX: 100, endY: 50, endZ: 0 }
- Horizontal line: { startX: 0, startY: 0, startZ: 0, endX: 100, endY: 0, endZ: 0 }`, {
        startX: zod_1.z.number().describe('Start X coordinate in mm'),
        startY: zod_1.z.number().describe('Start Y coordinate in mm'),
        startZ: zod_1.z.number().optional().default(0).describe('Start Z coordinate in mm (default: 0)'),
        endX: zod_1.z.number().describe('End X coordinate in mm'),
        endY: zod_1.z.number().describe('End Y coordinate in mm'),
        endZ: zod_1.z.number().optional().default(0).describe('End Z coordinate in mm (default: 0)'),
        name: zod_1.z.string().optional().describe('Name for the line'),
    }, async (input) => {
        const { startX, startY, startZ, endX, endY, endZ, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_line
import json
params = json.loads('${JSON.stringify({ startX, startY, startZ: startZ || 0, endX, endY, endZ: endZ || 0, name: name || null })}')
result = handle_create_line(
    start_point=[params['startX'], params['startY'], params.get('startZ', 0)],
    end_point=[params['endX'], params['endY'], params.get('endZ', 0)],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatGeometryCreation)(parsed.data, 'Line');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_circle
 *
 * Create a circle.
 */
function createCircleTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_circle', `Create a circle using the Draft workbench.

Parameters:
- centerX, centerY, centerZ (required): Center point coordinates in mm
- radius (required): Radius of the circle in mm
- name (optional): Name for the circle. If omitted, auto-generated.

Returns:
- success: Whether the circle was created
- objectName: Internal name of the circle
- objectType: Type of object ("Circle")
- center: {x, y, z} of center
- radius: Radius of the circle
- message: Status message

Use this tool when you need to create a circle.

Example:
- Create circle at (50, 50, 0) with 20mm radius: { centerX: 50, centerY: 50, centerZ: 0, radius: 20 }
- Circle at origin with 10mm radius: { centerX: 0, centerY: 0, centerZ: 0, radius: 10 }`, {
        centerX: zod_1.z.number().describe('Center X coordinate in mm'),
        centerY: zod_1.z.number().describe('Center Y coordinate in mm'),
        centerZ: zod_1.z.number().optional().default(0).describe('Center Z coordinate in mm (default: 0)'),
        radius: zod_1.z.number().describe('Radius of the circle in mm'),
        name: zod_1.z.string().optional().describe('Name for the circle'),
    }, async (input) => {
        const { centerX, centerY, centerZ, radius, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_circle
import json
params = json.loads('${JSON.stringify({ centerX, centerY, centerZ: centerZ || 0, radius, name: name || null })}')
result = handle_create_circle(
    center=[params['centerX'], params['centerY'], params.get('centerZ', 0)],
    radius=params['radius'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatGeometryCreation)(parsed.data, 'Circle');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_arc
 *
 * Create a circular arc.
 */
function createArcTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_arc', `Create a circular arc using the Draft workbench.

Parameters:
- centerX, centerY, centerZ (required): Center point coordinates in mm
- radius (required): Radius of the arc in mm
- startAngle (required): Start angle in degrees (0-360)
- endAngle (required): End angle in degrees (0-360)
- name (optional): Name for the arc. If omitted, auto-generated.

Returns:
- success: Whether the arc was created
- objectName: Internal name of the arc
- objectType: Type of object ("Arc")
- center: {x, y, z} of center
- radius: Radius of the arc
- startAngle: Start angle in degrees
- endAngle: End angle in degrees
- message: Status message

Use this tool when you need to create a circular arc (partial circle).

Example:
- Quarter arc: { centerX: 0, centerY: 0, centerZ: 0, radius: 50, startAngle: 0, endAngle: 90 }
- Half arc: { centerX: 0, centerY: 0, centerZ: 0, radius: 50, startAngle: 0, endAngle: 180 }`, {
        centerX: zod_1.z.number().describe('Center X coordinate in mm'),
        centerY: zod_1.z.number().describe('Center Y coordinate in mm'),
        centerZ: zod_1.z.number().optional().default(0).describe('Center Z coordinate in mm (default: 0)'),
        radius: zod_1.z.number().describe('Radius of the arc in mm'),
        startAngle: zod_1.z.number().describe('Start angle in degrees (0-360)'),
        endAngle: zod_1.z.number().describe('End angle in degrees (0-360)'),
        name: zod_1.z.string().optional().describe('Name for the arc'),
    }, async (input) => {
        const { centerX, centerY, centerZ, radius, startAngle, endAngle, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_arc
import json
params = json.loads('${JSON.stringify({ centerX, centerY, centerZ: centerZ || 0, radius, startAngle, endAngle, name: name || null })}')
result = handle_create_arc(
    center=[params['centerX'], params['centerY'], params.get('centerZ', 0)],
    radius=params['radius'],
    start_angle=params['startAngle'],
    end_angle=params['endAngle'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatGeometryCreation)(parsed.data, 'Arc');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_ellipse
 *
 * Create an ellipse.
 */
function createEllipseTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_ellipse', `Create an ellipse using the Draft workbench.

Parameters:
- centerX, centerY, centerZ (required): Center point coordinates in mm
- majorRadius (required): Major axis radius in mm
- minorRadius (required): Minor axis radius in mm
- name (optional): Name for the ellipse. If omitted, auto-generated.

Returns:
- success: Whether the ellipse was created
- objectName: Internal name of the ellipse
- objectType: Type of object ("Ellipse")
- center: {x, y, z} of center
- majorRadius: Major axis radius
- minorRadius: Minor axis radius
- message: Status message

Use this tool when you need to create an ellipse.

Example:
- Ellipse at origin: { centerX: 0, centerY: 0, centerZ: 0, majorRadius: 50, minorRadius: 30 }
- Ellipse at (100, 50): { centerX: 100, centerY: 50, centerZ: 0, majorRadius: 40, minorRadius: 25 }`, {
        centerX: zod_1.z.number().describe('Center X coordinate in mm'),
        centerY: zod_1.z.number().describe('Center Y coordinate in mm'),
        centerZ: zod_1.z.number().optional().default(0).describe('Center Z coordinate in mm (default: 0)'),
        majorRadius: zod_1.z.number().describe('Major axis radius in mm'),
        minorRadius: zod_1.z.number().describe('Minor axis radius in mm'),
        name: zod_1.z.string().optional().describe('Name for the ellipse'),
    }, async (input) => {
        const { centerX, centerY, centerZ, majorRadius, minorRadius, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_ellipse
import json
params = json.loads('${JSON.stringify({ centerX, centerY, centerZ: centerZ || 0, majorRadius, minorRadius, name: name || null })}')
result = handle_create_ellipse(
    center=[params['centerX'], params['centerY'], params.get('centerZ', 0)],
    major_radius=params['majorRadius'],
    minor_radius=params['minorRadius'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatGeometryCreation)(parsed.data, 'Ellipse');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_rectangle
 *
 * Create a rectangle.
 */
function createRectangleTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_rectangle', `Create a rectangle using the Draft workbench.

Parameters:
- width (required): Width of the rectangle in mm
- height (required): Height of the rectangle in mm
- x (optional): X coordinate of the lower-left corner (default: 0)
- y (optional): Y coordinate of the lower-left corner (default: 0)
- z (optional): Z coordinate (default: 0)
- name (optional): Name for the rectangle. If omitted, auto-generated.

Returns:
- success: Whether the rectangle was created
- objectName: Internal name of the rectangle
- objectType: Type of object ("Rectangle")
- width: Width of the rectangle
- height: Height of the rectangle
- message: Status message

Use this tool when you need to create a rectangle.

Example:
- 100mm by 50mm rectangle at origin: { width: 100, height: 50 }
- Rectangle at (20, 30): { width: 80, height: 40, x: 20, y: 30 }`, {
        width: zod_1.z.number().describe('Width of the rectangle in mm'),
        height: zod_1.z.number().describe('Height of the rectangle in mm'),
        x: zod_1.z.number().optional().default(0).describe('X coordinate of lower-left corner (default: 0)'),
        y: zod_1.z.number().optional().default(0).describe('Y coordinate of lower-left corner (default: 0)'),
        z: zod_1.z.number().optional().default(0).describe('Z coordinate (default: 0)'),
        name: zod_1.z.string().optional().describe('Name for the rectangle'),
    }, async (input) => {
        const { width, height, x, y, z, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_rectangle
import json
params = json.loads('${JSON.stringify({ width, height, x: x || 0, y: y || 0, z: z || 0, name: name || null })}')
result = handle_create_rectangle(
    width=params['width'],
    height=params['height'],
    position=[params.get('x', 0), params.get('y', 0), params.get('z', 0)],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatGeometryCreation)(parsed.data, 'Rectangle');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_polygon
 *
 * Create a regular polygon.
 */
function createPolygonTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_polygon', `Create a regular polygon using the Draft workbench.

Parameters:
- sides (required): Number of sides (3-12)
- radius (required): Circumradius (distance from center to vertices) in mm
- x (optional): X coordinate of center (default: 0)
- y (optional): Y coordinate of center (default: 0)
- z (optional): Z coordinate (default: 0)
- name (optional): Name for the polygon. If omitted, auto-generated.

Returns:
- success: Whether the polygon was created
- objectName: Internal name of the polygon
- objectType: Type of object ("Polygon")
- sides: Number of sides
- radius: Circumradius in mm
- message: Status message

Use this tool when you need to create a regular polygon (triangle, square, pentagon, hexagon, etc.).

Example:
- Hexagon with 20mm radius: { sides: 6, radius: 20 }
- Octagon at (50, 50): { sides: 8, radius: 15, x: 50, y: 50 }
- Triangle: { sides: 3, radius: 30 }`, {
        sides: zod_1.z.number().min(3).max(12).describe('Number of sides (3-12)'),
        radius: zod_1.z.number().describe('Circumradius in mm'),
        x: zod_1.z.number().optional().default(0).describe('X coordinate of center (default: 0)'),
        y: zod_1.z.number().optional().default(0).describe('Y coordinate of center (default: 0)'),
        z: zod_1.z.number().optional().default(0).describe('Z coordinate (default: 0)'),
        name: zod_1.z.string().optional().describe('Name for the polygon'),
    }, async (input) => {
        const { sides, radius, x, y, z, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_polygon
import json
params = json.loads('${JSON.stringify({ sides, radius, x: x || 0, y: y || 0, z: z || 0, name: name || null })}')
result = handle_create_polygon(
    sides=params['sides'],
    radius=params['radius'],
    center=[params.get('x', 0), params.get('y', 0), params.get('z', 0)],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatGeometryCreation)(parsed.data, 'Polygon');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_bspline
 *
 * Create a B-spline curve through specified points.
 */
function createBSplineTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_bspline', `Create a B-spline curve passing through specified points using the Draft workbench.

Parameters:
- points (required): Array of [x, y, z] coordinates for each point
- name (optional): Name for the B-spline. If omitted, auto-generated.

Returns:
- success: Whether the B-spline was created
- objectName: Internal name of the B-spline
- objectType: Type of object ("BSpline")
- pointCount: Number of control points
- message: Status message

Use this tool when you need to create a smooth curve through multiple points.

Example:
- B-spline through 3 points: { points: [[0, 0, 0], [50, 80, 0], [100, 0, 0]] }
- Complex curve: { points: [[0, 0, 0], [25, 50, 0], [50, 50, 0], [75, 25, 0], [100, 0, 0]] }`, {
        points: zod_1.z.array(zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()])).describe('Array of [x, y, z] coordinates for each point'),
        name: zod_1.z.string().optional().describe('Name for the B-spline'),
    }, async (input) => {
        const { points, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_bspline
import json
params = json.loads('${JSON.stringify({ points, name: name || null })}')
result = handle_create_bspline(
    points=params['points'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatGeometryCreation)(parsed.data, 'BSpline');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_bezier
 *
 * Create a Bezier curve through specified control points.
 */
function createBezierTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_bezier', `Create a Bezier curve using specified control points via the Draft workbench.

Parameters:
- points (required): Array of [x, y, z] coordinates for control points
- name (optional): Name for the Bezier curve. If omitted, auto-generated.

Returns:
- success: Whether the Bezier curve was created
- objectName: Internal name of the Bezier curve
- objectType: Type of object ("Bezier")
- pointCount: Number of control points
- message: Status message

Use this tool when you need to create a smooth curve defined by control points.

Example:
- Simple Bezier: { points: [[0, 0, 0], [50, 100, 0], [100, 0, 0]] }
- Complex curve: { points: [[0, 0, 0], [30, 80, 0], [70, 80, 0], [100, 0, 0]] }`, {
        points: zod_1.z.array(zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()])).describe('Array of [x, y, z] coordinates for control points'),
        name: zod_1.z.string().optional().describe('Name for the Bezier curve'),
    }, async (input) => {
        const { points, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_bezier
import json
params = json.loads('${JSON.stringify({ points, name: name || null })}')
result = handle_create_bezier(
    points=params['points'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatGeometryCreation)(parsed.data, 'Bezier');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_wire
 *
 * Create a polyline/wire from a series of points.
 */
function createWireTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_wire', `Create a polyline/wire (connected line segments) from a series of points using the Draft workbench.

Parameters:
- points (required): Array of [x, y, z] coordinates for each vertex
- closed (optional): Whether to close the wire (connect last to first). Default: false
- name (optional): Name for the wire. If omitted, auto-generated.

Returns:
- success: Whether the wire was created
- objectName: Internal name of the wire
- objectType: Type of object ("Wire" or "Polyline")
- pointCount: Number of vertices
- closed: Whether the wire is closed
- message: Status message

Use this tool when you need to create a connected series of line segments.

Example:
- Open polyline: { points: [[0, 0, 0], [50, 0, 0], [50, 50, 0], [100, 50, 0]] }
- Closed shape: { points: [[0, 0, 0], [100, 0, 0], [100, 100, 0], [0, 100, 0]], closed: true }`, {
        points: zod_1.z.array(zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()])).describe('Array of [x, y, z] coordinates for each vertex'),
        closed: zod_1.z.boolean().optional().default(false).describe('Whether to close the wire (connect last to first)'),
        name: zod_1.z.string().optional().describe('Name for the wire'),
    }, async (input) => {
        const { points, closed, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_wire
import json
params = json.loads('${JSON.stringify({ points, closed: closed || false, name: name || null })}')
result = handle_create_wire(
    points=params['points'],
    closed=params.get('closed', False),
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatGeometryCreation)(parsed.data, 'Wire');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_linear_dimension
 *
 * Create a linear dimension between two points.
 */
function createLinearDimensionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_linear_dimension', `Create a linear dimension between two points using the Draft workbench.

Parameters:
- startX, startY, startZ (required): Start point coordinates in mm
- endX, endY, endZ (required): End point coordinates in mm
- offset (optional): Perpendicular offset from the measured line in mm (default: 0)
- name (optional): Name for the dimension. If omitted, auto-generated.

Returns:
- success: Whether the dimension was created
- objectName: Internal name of the dimension
- objectType: Type of object ("LinearDimension")
- measurement: The measured distance in mm
- startPoint: {x, y, z} of start
- endPoint: {x, y, z} of end
- message: Status message

Use this tool when you need to add a linear (aligned or horizontal/vertical) dimension to your drawing.

Example:
- Dimension a line: { startX: 0, startY: 0, startZ: 0, endX: 100, endY: 0, endZ: 0 }
- Offset dimension: { startX: 0, startY: 0, startZ: 0, endX: 50, endY: 50, endZ: 0, offset: 10 }`, {
        startX: zod_1.z.number().describe('Start X coordinate in mm'),
        startY: zod_1.z.number().describe('Start Y coordinate in mm'),
        startZ: zod_1.z.number().optional().default(0).describe('Start Z coordinate in mm (default: 0)'),
        endX: zod_1.z.number().describe('End X coordinate in mm'),
        endY: zod_1.z.number().describe('End Y coordinate in mm'),
        endZ: zod_1.z.number().optional().default(0).describe('End Z coordinate in mm (default: 0)'),
        offset: zod_1.z.number().optional().default(0).describe('Perpendicular offset from measured line in mm (default: 0)'),
        name: zod_1.z.string().optional().describe('Name for the dimension'),
    }, async (input) => {
        const { startX, startY, startZ, endX, endY, endZ, offset, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_linear_dimension
import json
params = json.loads('${JSON.stringify({ startX, startY, startZ: startZ || 0, endX, endY, endZ: endZ || 0, offset: offset || 0, name: name || null })}')
result = handle_create_linear_dimension(
    point1=[params['startX'], params['startY'], params.get('startZ', 0)],
    point2=[params['endX'], params['endY'], params.get('endZ', 0)],
    offset=params.get('offset', 0),
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatDimensionCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_radial_dimension
 *
 * Create a radial dimension (radius or diameter) for a circle or arc.
 */
function createRadialDimensionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_radial_dimension', `Create a radial dimension (radius or diameter) for a circle or arc using the Draft workbench.

Parameters:
- objectName (required): Name of the circle or arc object to dimension
- name (optional): Name for the dimension. If omitted, auto-generated.

Returns:
- success: Whether the dimension was created
- objectName: Internal name of the dimension
- objectType: Type of object ("RadialDimension" or "Dimension")
- measurement: The radius or diameter value in mm
- message: Status message

Use this tool when you need to add a radius or diameter dimension to a circle or arc.

Example:
- Radius dimension: { objectName: "Circle" }
- Diameter dimension: { objectName: "Circle001" }`, {
        objectName: zod_1.z.string().describe('Name of the circle or arc object to dimension'),
        name: zod_1.z.string().optional().describe('Name for the dimension'),
    }, async (input) => {
        const { objectName, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_radial_dimension
import json
params = json.loads('${JSON.stringify({ objectName, name: name || null })}')
result = handle_create_radial_dimension(
    circle=params['objectName'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatDimensionCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_angular_dimension
 *
 * Create an angular dimension between two lines.
 */
function createAngularDimensionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_angular_dimension', `Create an angular dimension between two lines using the Draft workbench.

Parameters:
- objectName1 (required): Name of the first line object
- objectName2 (required): Name of the second line object
- name (optional): Name for the dimension. If omitted, auto-generated.

Returns:
- success: Whether the dimension was created
- objectName: Internal name of the dimension
- objectType: Type of object ("AngularDimension")
- measurement: The angle in degrees
- message: Status message

Use this tool when you need to show the angle between two lines.

Example:
- Angle between lines: { objectName1: "Line", objectName2: "Line001" }`, {
        objectName1: zod_1.z.string().describe('Name of the first line object'),
        objectName2: zod_1.z.string().describe('Name of the second line object'),
        name: zod_1.z.string().optional().describe('Name for the dimension'),
    }, async (input) => {
        const { objectName1, objectName2, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_angular_dimension
import json
params = json.loads('${JSON.stringify({ objectName1, objectName2, name: name || null })}')
result = handle_create_angular_dimension(
    line1=params['objectName1'],
    line2=params['objectName2'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatDimensionCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_ordinate_dimension
 *
 * Create an ordinate dimension (X or Y distance from origin).
 */
function createOrdinateDimensionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_ordinate_dimension', `Create an ordinate dimension (X or Y distance from origin) using the Draft workbench.

Parameters:
- objectName (required): Name of the point or vertex object to dimension
- direction (required): Direction - "x" for horizontal, "y" for vertical
- originX, originY, originZ (optional): Origin point coordinates (default: 0, 0, 0)
- name (optional): Name for the dimension. If omitted, auto-generated.

Returns:
- success: Whether the dimension was created
- objectName: Internal name of the dimension
- objectType: Type of object ("OrdinateDimension")
- measurement: The distance in mm
- direction: "x" or "y"
- message: Status message

Use this tool when you need to show the X or Y coordinate distance from a specific origin point.

Example:
- X distance from origin: { objectName: "Point", direction: "x" }
- Y distance from origin: { objectName: "Vertex", direction: "y" }
- Custom origin: { objectName: "Point", direction: "x", originX: 50, originY: 50 }`, {
        objectName: zod_1.z.string().describe('Name of the point or vertex object to dimension'),
        direction: zod_1.z.enum(['x', 'y']).describe('Direction - "x" for horizontal, "y" for vertical'),
        originX: zod_1.z.number().optional().default(0).describe('Origin X coordinate (default: 0)'),
        originY: zod_1.z.number().optional().default(0).describe('Origin Y coordinate (default: 0)'),
        originZ: zod_1.z.number().optional().default(0).describe('Origin Z coordinate (default: 0)'),
        name: zod_1.z.string().optional().describe('Name for the dimension'),
    }, async (input) => {
        const { objectName, direction, originX, originY, originZ, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_ordinate_dimension
import json
params = json.loads('${JSON.stringify({ objectName, direction, originX: originX || 0, originY: originY || 0, originZ: originZ || 0, name: name || null })}')
dir_value = 0 if params['direction'] == 'x' else 1
result = handle_create_ordinate_dimension(
    point=params['objectName'],
    direction=dir_value,
    origin=[params.get('originX', 0), params.get('originY', 0), params.get('originZ', 0)],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatDimensionCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_text
 *
 * Create a text annotation.
 */
function createTextTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_text', `Create a text annotation using the Draft workbench.

Parameters:
- text (required): The text string to display
- x, y, z (optional): Position coordinates in mm (default: 0, 0, 0)
- name (optional): Name for the text. If omitted, auto-generated.

Returns:
- success: Whether the text was created
- objectName: Internal name of the text
- objectType: Type of object ("Text")
- text: The text content
- position: {x, y, z} position
- message: Status message

Use this tool when you need to add text labels or annotations to your drawing.

Example:
- Simple text: { text: "DANGER" }
- Positioned text: { text: "MAX 50mm", x: 100, y: 50, z: 0 }
- Label: { text: "Part A - Front View", x: 0, y: 100 }`, {
        text: zod_1.z.string().describe('The text string to display'),
        x: zod_1.z.number().optional().default(0).describe('X coordinate (default: 0)'),
        y: zod_1.z.number().optional().default(0).describe('Y coordinate (default: 0)'),
        z: zod_1.z.number().optional().default(0).describe('Z coordinate (default: 0)'),
        name: zod_1.z.string().optional().describe('Name for the text'),
    }, async (input) => {
        const { text, x, y, z, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_text
import json
params = json.loads('${JSON.stringify({ text, x: x || 0, y: y || 0, z: z || 0, name: name || null })}')
result = handle_create_text(
    text=params['text'],
    position=[params.get('x', 0), params.get('y', 0), params.get('z', 0)],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatTextCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_dimension_text
 *
 * Add custom text to an existing dimension.
 */
function createDimensionTextTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_dimension_text', `Add custom text to an existing dimension using the Draft workbench.

Parameters:
- objectName (required): Name of the dimension object to modify
- customText (required): Custom text to add (e.g., "TYP", "MAX", "MIN")
- position (optional): Where to place the text - "before", "after", "replacement" (default: "after")

Returns:
- success: Whether the text was modified
- objectName: Name of the modified dimension
- previousText: Previous text value
- newText: New text value
- message: Status message

Use this tool when you need to add custom text annotations to dimensions (e.g., "TYP" for typical, "MAX" for maximum).

Example:
- Add "TYP" after measurement: { objectName: "Dimension", customText: "TYP", position: "after" }
- Replace with custom text: { objectName: "Dimension001", customText: "±0.5", position: "replacement" }`, {
        objectName: zod_1.z.string().describe('Name of the dimension object to modify'),
        customText: zod_1.z.string().describe('Custom text to add'),
        position: zod_1.z.enum(['before', 'after', 'replacement']).optional().default('after').describe('Where to place text'),
    }, async (input) => {
        const { objectName, customText, position } = input;
        const code = `
from llm_bridge.draft_handlers import handle_create_dimension_text
import json
params = json.loads('${JSON.stringify({ objectName, customText, position: position || 'after' })}')
result = handle_create_dimension_text(
    dimension=params['objectName'],
    custom_text=params['customText'],
    position=params['position']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatDimensionCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: move_objects
 *
 * Move one or more objects by a vector.
 */
function moveObjectsTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('move_objects', `Move one or more objects by a displacement vector using the Draft workbench.

Parameters:
- objectNames (required): Array of object names to move
- deltaX, deltaY, deltaZ (required): Displacement vector components in mm
- name (optional): Name for the moved object (for single object). If omitted, original name kept.

Returns:
- success: Whether the move was successful
- objectNames: Names of the moved objects
- originalPositions: {x, y, z} positions before move
- newPositions: {x, y, z} positions after move
- message: Status message

Use this tool when you need to reposition objects.

Example:
- Move single object: { objectNames: ["Circle"], deltaX: 50, deltaY: 0, deltaZ: 0 }
- Move multiple objects: { objectNames: ["Line", "Rectangle"], deltaX: 10, deltaY: 20, deltaZ: 0 }`, {
        objectNames: zod_1.z.array(zod_1.z.string()).describe('Array of object names to move'),
        deltaX: zod_1.z.number().describe('X displacement in mm'),
        deltaY: zod_1.z.number().describe('Y displacement in mm'),
        deltaZ: zod_1.z.number().optional().default(0).describe('Z displacement in mm (default: 0)'),
    }, async (input) => {
        const { objectNames, deltaX, deltaY, deltaZ } = input;
        const code = `
from llm_bridge.draft_handlers import handle_move
import json
params = json.loads('${JSON.stringify({ objectNames, deltaX, deltaY, deltaZ: deltaZ || 0 })}')
result = handle_move(
    object_names=params['objectNames'],
    vector=[params['deltaX'], params['deltaY'], params.get('deltaZ', 0)]
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatModificationResult)(parsed.data, 'move');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: rotate_objects
 *
 * Rotate one or more objects by an angle around a center point.
 */
function rotateObjectsTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('rotate_objects', `Rotate one or more objects by an angle around a center point using the Draft workbench.

Parameters:
- objectNames (required): Array of object names to rotate
- angle (required): Rotation angle in degrees
- centerX, centerY, centerZ (optional): Center point of rotation (default: 0, 0, 0)
- name (optional): Name for the rotated object (for single object).

Returns:
- success: Whether the rotation was successful
- objectNames: Names of the rotated objects
- angle: Rotation angle applied in degrees
- center: Center point of rotation
- message: Status message

Use this tool when you need to rotate objects.

Example:
- Rotate 45 degrees around origin: { objectNames: ["Rectangle"], angle: 45 }
- Rotate around custom center: { objectNames: ["Circle"], angle: 90, centerX: 50, centerY: 50, centerZ: 0 }`, {
        objectNames: zod_1.z.array(zod_1.z.string()).describe('Array of object names to rotate'),
        angle: zod_1.z.number().describe('Rotation angle in degrees'),
        centerX: zod_1.z.number().optional().default(0).describe('Center X coordinate (default: 0)'),
        centerY: zod_1.z.number().optional().default(0).describe('Center Y coordinate (default: 0)'),
        centerZ: zod_1.z.number().optional().default(0).describe('Center Z coordinate (default: 0)'),
    }, async (input) => {
        const { objectNames, angle, centerX, centerY, centerZ } = input;
        const code = `
from llm_bridge.draft_handlers import handle_rotate
import json
params = json.loads('${JSON.stringify({ objectNames, angle, centerX: centerX || 0, centerY: centerY || 0, centerZ: centerZ || 0 })}')
result = handle_rotate(
    object_names=params['objectNames'],
    angle=params['angle'],
    center=[params.get('centerX', 0), params.get('centerY', 0), params.get('centerZ', 0)]
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatModificationResult)(parsed.data, 'rotate');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: scale_objects
 *
 * Scale one or more objects by a factor.
 */
function scaleObjectsTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('scale_objects', `Scale one or more objects by a factor using the Draft workbench.

Parameters:
- objectNames (required): Array of object names to scale
- scaleFactor (required): Uniform scale factor (e.g., 2.0 for 2x size, 0.5 for half size)
- centerX, centerY, centerZ (optional): Center point of scaling (default: 0, 0, 0)
- name (optional): Name for the scaled object (for single object).

Returns:
- success: Whether the scaling was successful
- objectNames: Names of the scaled objects
- scaleFactor: Scale factor applied
- center: Center point of scaling
- message: Status message

Use this tool when you need to resize objects.

Example:
- Double size: { objectNames: ["Rectangle"], scaleFactor: 2.0 }
- Half size: { objectNames: ["Circle"], scaleFactor: 0.5 }
- Scale around custom center: { objectNames: ["Polygon"], scaleFactor: 1.5, centerX: 50, centerY: 50 }`, {
        objectNames: zod_1.z.array(zod_1.z.string()).describe('Array of object names to scale'),
        scaleFactor: zod_1.z.number().describe('Scale factor (e.g., 2.0 for 2x size, 0.5 for half)'),
        centerX: zod_1.z.number().optional().default(0).describe('Center X coordinate (default: 0)'),
        centerY: zod_1.z.number().optional().default(0).describe('Center Y coordinate (default: 0)'),
        centerZ: zod_1.z.number().optional().default(0).describe('Center Z coordinate (default: 0)'),
    }, async (input) => {
        const { objectNames, scaleFactor, centerX, centerY, centerZ } = input;
        const code = `
from llm_bridge.draft_handlers import handle_scale
import json
params = json.loads('${JSON.stringify({ objectNames, scaleFactor, centerX: centerX || 0, centerY: centerY || 0, centerZ: centerZ || 0 })}')
result = handle_scale(
    object_names=params['objectNames'],
    scale_factor=params['scaleFactor'],
    center=[params.get('centerX', 0), params.get('centerY', 0), params.get('centerZ', 0)]
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatModificationResult)(parsed.data, 'scale');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: offset_object
 *
 * Create an offset copy of an object.
 */
function offsetObjectTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('offset_object', `Create an offset (parallel) copy of an object using the Draft workbench.

Parameters:
- objectName (required): Name of the object to offset
- distance (required): Offset distance in mm (positive for outward, negative for inward)
- name (optional): Name for the offset object. If omitted, auto-generated.

Returns:
- success: Whether the offset was successful
- originalName: Name of the original object
- newObjectName: Name of the created offset object
- distance: Offset distance applied
- message: Status message

Use this tool when you need to create a parallel copy of an object at a specific distance.

Example:
- Parallel line 10mm away: { objectName: "Line", distance: 10 }
- Offset circle inward: { objectName: "Circle", distance: -5 }
- Offset rectangle: { objectName: "Rectangle", distance: 20 }`, {
        objectName: zod_1.z.string().describe('Name of the object to offset'),
        distance: zod_1.z.number().describe('Offset distance in mm (positive for outward, negative for inward)'),
        name: zod_1.z.string().optional().describe('Name for the offset object'),
    }, async (input) => {
        const { objectName, distance, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_offset
import json
params = json.loads('${JSON.stringify({ objectName, distance, name: name || null })}')
result = handle_offset(
    object_name=params['objectName'],
    distance=params['distance'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatModificationResult)(parsed.data, 'offset');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: join_objects
 *
 * Join multiple draft objects into a single wire/polyline.
 */
function joinObjectsTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('join_objects', `Join multiple draft objects (wires/edges) into a single wire/polyline using the Draft workbench.

Parameters:
- objectNames (required): Array of object names to join
- name (optional): Name for the joined object. If omitted, auto-generated.

Returns:
- success: Whether the join was successful
- originalNames: Names of the original objects
- newObjectName: Name of the created joined object
- objectType: Type of the joined object ("Wire" or "Polyline")
- message: Status message

Use this tool when you need to combine multiple connected lines into a single polyline.

Example:
- Join lines: { objectNames: ["Line", "Line001", "Line002"] }
- Join arcs: { objectNames: ["Arc", "Arc001"] }`, {
        objectNames: zod_1.z.array(zod_1.z.string()).describe('Array of object names to join'),
        name: zod_1.z.string().optional().describe('Name for the joined object'),
    }, async (input) => {
        const { objectNames, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_join
import json
params = json.loads('${JSON.stringify({ objectNames, name: name || null })}')
result = handle_join(
    object_names=params['objectNames'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatModificationResult)(parsed.data, 'join');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: split_object
 *
 * Split a draft object at specified points.
 */
function splitObjectTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('split_object', `Split a draft object at specified points using the Draft workbench.

Parameters:
- objectName (required): Name of the object to split
- points (required): Array of [x, y, z] coordinates where to split
- name (optional): Base name for the split objects. If omitted, auto-generated.

Returns:
- success: Whether the split was successful
- originalName: Name of the original object
- newObjectNames: Names of the created split objects
- message: Status message

Use this tool when you need to divide an object into multiple parts at specific points.

Example:
- Split line at midpoint: { objectName: "Line", points: [[50, 0, 0]] }
- Split at multiple points: { objectName: "Wire", points: [[25, 0, 0], [75, 0, 0]] }`, {
        objectName: zod_1.z.string().describe('Name of the object to split'),
        points: zod_1.z.array(zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()])).describe('Array of [x, y, z] coordinates where to split'),
        name: zod_1.z.string().optional().describe('Base name for the split objects'),
    }, async (input) => {
        const { objectName, points, name } = input;
        const code = `
from llm_bridge.draft_handlers import handle_split
import json
params = json.loads('${JSON.stringify({ objectName, points, name: name || null })}')
result = handle_split(
    object_name=params['objectName'],
    points=params['points'],
    name=params['name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatModificationResult)(parsed.data, 'split');
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
// ============================================================================
// TechDraw Workbench Tools
// ============================================================================
/**
 * Tool: create_drawing_page
 *
 * Create a new TechDraw page.
 */
function createDrawingPageTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_drawing_page', `Create a new TechDraw page for creating 2D drawings from 3D models.

Parameters:
- template (optional): Template name to use. Common templates:
  - "A4_Landscape" (default)
  - "A4_Portrait"
  - "A3_Landscape"
  - "A3_Portrait"
  - "Letter_Landscape"
  - "Letter_Portrait"
- paperSize (optional): Paper size override (e.g., "A4", "Letter"). If template is specified, this is optional.

Returns:
- success: Whether the page was created
- pageName: Internal name of the page
- pageLabel: User-friendly label
- template: Template used
- paperSize: Paper size used
- message: Status message

Use this tool when you need to create a new drawing sheet for technical documentation.

Example:
- Create A4 landscape page: {}
- Create with specific template: { template: "A3_Landscape" }`, {
        template: zod_1.z.string().optional().describe('Template name (e.g., "A4_Landscape", "A3_Portrait")'),
        paperSize: zod_1.z.string().optional().describe('Paper size override (e.g., "A4", "Letter")'),
    }, async (input) => {
        const { template, paperSize } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_create_drawing_page
import json
params = json.loads('${JSON.stringify({ template: template || null, paperSize: paperSize || null })}')
result = handle_create_drawing_page(
    template=params.get('template'),
    paper_size=params.get('paperSize')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatPageCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: list_drawing_pages
 *
 * List all TechDraw pages in the document.
 */
function listDrawingPagesTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('list_drawing_pages', `List all TechDraw pages in the current document.

Parameters: None

Returns:
- success: Whether the query was successful
- pages: Array of page objects with name, label, template, viewCount
- pageCount: Number of pages found
- message: Status message

Use this tool when you need to see what drawing pages exist in the current document.

Example:
- List all pages: {}`, {
    // No parameters needed
    }, async () => {
        const code = `
from llm_bridge.techdraw_handlers import get_page_list
import json
result = get_page_list()
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            if (parsed.success) {
                let output = `TechDraw Pages: ${parsed.pageCount || 0}\n\n`;
                if (parsed.pages && parsed.pages.length > 0) {
                    output += (0, result_formatters_1.formatTableRow)(['Name', 'Label', 'Template', 'Views']);
                    output += '\n' + '─'.repeat(60) + '\n';
                    for (const page of parsed.pages) {
                        output += (0, result_formatters_1.formatTableRow)([
                            page.name || '-',
                            page.label || '-',
                            page.template || '-',
                            String(page.viewCount || 0)
                        ]);
                        output += '\n';
                    }
                }
                else {
                    output += '(No TechDraw pages found)';
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: output,
                        },
                    ],
                };
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: delete_drawing_page
 *
 * Delete a TechDraw page.
 */
function deleteDrawingPageTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('delete_drawing_page', `Delete a TechDraw page from the document.

Parameters:
- pageName (required): Name of the page to delete

Returns:
- success: Whether the page was deleted
- pageName: Name of the deleted page
- message: Status message

Use this tool when you want to remove an unwanted drawing page.

Example:
- Delete a page: { pageName: "Page1" }`, {
        pageName: zod_1.z.string().describe('Name of the page to delete'),
    }, async (input) => {
        const { pageName } = input;
        const code = `
from llm_bridge.techdraw_handlers import delete_page
import json
params = json.loads('${JSON.stringify({ pageName })}')
result = delete_page(page_name=params['pageName'])
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
                            text: `Deleted TechDraw page: ${pageName}\n${parsed.message || ''}`,
                        },
                    ],
                };
            }
            else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${parsed.error}`,
                        },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: get_drawing_page_properties
 *
 * Get properties of a TechDraw page.
 */
function getDrawingPagePropertiesTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('get_drawing_page_properties', `Get detailed properties of a TechDraw page.

Parameters:
- pageName (required): Name of the page to query

Returns:
- success: Whether the query was successful
- pageName: Name of the page
- pageLabel: User-friendly label
- template: Template used
- paperSize: Paper size
- viewCount: Number of views on the page
- views: Array of view objects with name, type, source object
- message: Status message

Use this tool when you need detailed information about a specific drawing page.

Example:
- Get page properties: { pageName: "Page1" }`, {
        pageName: zod_1.z.string().describe('Name of the page to query'),
    }, async (input) => {
        const { pageName } = input;
        const code = `
from llm_bridge.techdraw_handlers import get_page_properties
import json
params = json.loads('${JSON.stringify({ pageName })}')
result = get_page_properties(page_name=params['pageName'])
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatPageCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_standard_view
 *
 * Create a standard projection view.
 */
function createStandardViewTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_standard_view', `Create a standard projection view of a source object on a TechDraw page.

Parameters:
- sourceObject (required): Name of the 3D object to project
- pageName (optional): Name of the page to add the view to. If omitted, uses the active page.
- viewName (optional): Name for the view. If omitted, auto-generated.
- projectionType (optional): Projection type - "Third" (Third angle, default) or "First" (First angle)

Returns:
- success: Whether the view was created
- viewName: Internal name of the view
- sourceObject: Name of the source 3D object
- projectionType: Projection type used
- pageName: Page containing the view
- message: Status message

Use this tool to add a basic projection view of a 3D model to a drawing page.

Example:
- Create third-angle view: { sourceObject: "Body", pageName: "Page1" }
- First-angle projection: { sourceObject: "Part", projectionType: "First" }`, {
        sourceObject: zod_1.z.string().describe('Name of the 3D object to project'),
        pageName: zod_1.z.string().optional().describe('Name of the page to add the view to'),
        viewName: zod_1.z.string().optional().describe('Name for the view'),
        projectionType: zod_1.z.enum(['Third', 'First']).optional().describe('Projection type (Third or First angle)'),
    }, async (input) => {
        const { sourceObject, pageName, viewName, projectionType } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_create_view
import json
params = json.loads('${JSON.stringify({ sourceObject, pageName: pageName || null, viewName: viewName || null, projectionType: projectionType || 'Third' })}')
result = handle_create_view(
    source_object=params['sourceObject'],
    page_name=params.get('pageName'),
    view_name=params.get('viewName'),
    projection_type=params.get('projectionType', 'Third')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatViewCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_isometric_view
 *
 * Create an isometric (trimetric) view.
 */
function createIsometricViewTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_isometric_view', `Create an isometric (trimetric) view of a source object on a TechDraw page.

Parameters:
- sourceObject (required): Name of the 3D object to project
- pageName (optional): Name of the page to add the view to. If omitted, uses the active page.
- viewName (optional): Name for the view. If omitted, auto-generated.

Returns:
- success: Whether the view was created
- viewName: Internal name of the view
- sourceObject: Name of the source 3D object
- viewType: Type of view ("Isometric")
- pageName: Page containing the view
- message: Status message

Use this tool to add an isometric view showing the 3D model from a 45-degree angle.

Example:
- Create isometric view: { sourceObject: "Body", pageName: "Page1" }
- Named isometric view: { sourceObject: "Part", viewName: "IsoView" }`, {
        sourceObject: zod_1.z.string().describe('Name of the 3D object to project'),
        pageName: zod_1.z.string().optional().describe('Name of the page to add the view to'),
        viewName: zod_1.z.string().optional().describe('Name for the view'),
    }, async (input) => {
        const { sourceObject, pageName, viewName } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_create_isometric_view
import json
params = json.loads('${JSON.stringify({ sourceObject, pageName: pageName || null, viewName: viewName || null })}')
result = handle_create_isometric_view(
    source_object=params['sourceObject'],
    page_name=params.get('pageName'),
    view_name=params.get('viewName')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatViewCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_front_view
 *
 * Create a front view.
 */
function createFrontViewTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_front_view', `Create a front view of a source object on a TechDraw page.

Parameters:
- sourceObject (required): Name of the 3D object to project
- pageName (optional): Name of the page to add the view to. If omitted, uses the active page.
- viewName (optional): Name for the view. If omitted, auto-generated.

Returns:
- success: Whether the view was created
- viewName: Internal name of the view
- sourceObject: Name of the source 3D object
- viewType: Type of view ("Front")
- pageName: Page containing the view
- message: Status message

Use this tool to add a front elevation view to a drawing page.

Example:
- Create front view: { sourceObject: "Body", pageName: "Page1" }
- Named front view: { sourceObject: "Part", viewName: "Front" }`, {
        sourceObject: zod_1.z.string().describe('Name of the 3D object to project'),
        pageName: zod_1.z.string().optional().describe('Name of the page to add the view to'),
        viewName: zod_1.z.string().optional().describe('Name for the view'),
    }, async (input) => {
        const { sourceObject, pageName, viewName } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_create_front_view
import json
params = json.loads('${JSON.stringify({ sourceObject, pageName: pageName || null, viewName: viewName || null })}')
result = handle_create_front_view(
    source_object=params['sourceObject'],
    page_name=params.get('pageName'),
    view_name=params.get('viewName')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatViewCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_top_view
 *
 * Create a top (plan) view.
 */
function createTopViewTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_top_view', `Create a top (plan) view of a source object on a TechDraw page.

Parameters:
- sourceObject (required): Name of the 3D object to project
- pageName (optional): Name of the page to add the view to. If omitted, uses the active page.
- viewName (optional): Name for the view. If omitted, auto-generated.

Returns:
- success: Whether the view was created
- viewName: Internal name of the view
- sourceObject: Name of the source 3D object
- viewType: Type of view ("Top")
- pageName: Page containing the view
- message: Status message

Use this tool to add a top plan view to a drawing page.

Example:
- Create top view: { sourceObject: "Body", pageName: "Page1" }
- Named top view: { sourceObject: "Part", viewName: "Top" }`, {
        sourceObject: zod_1.z.string().describe('Name of the 3D object to project'),
        pageName: zod_1.z.string().optional().describe('Name of the page to add the view to'),
        viewName: zod_1.z.string().optional().describe('Name for the view'),
    }, async (input) => {
        const { sourceObject, pageName, viewName } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_create_top_view
import json
params = json.loads('${JSON.stringify({ sourceObject, pageName: pageName || null, viewName: viewName || null })}')
result = handle_create_top_view(
    source_object=params['sourceObject'],
    page_name=params.get('pageName'),
    view_name=params.get('viewName')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatViewCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_side_view
 *
 * Create a side view (left or right).
 */
function createSideViewTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_side_view', `Create a side view (left or right elevation) of a source object on a TechDraw page.

Parameters:
- sourceObject (required): Name of the 3D object to project
- side (required): Side for the view - "Left" or "Right"
- pageName (optional): Name of the page to add the view to. If omitted, uses the active page.
- viewName (optional): Name for the view. If omitted, auto-generated.

Returns:
- success: Whether the view was created
- viewName: Internal name of the view
- sourceObject: Name of the source 3D object
- viewType: Type of view ("LeftSide" or "RightSide")
- pageName: Page containing the view
- message: Status message

Use this tool to add a side elevation view to a drawing page.

Example:
- Create right side view: { sourceObject: "Body", side: "Right", pageName: "Page1" }
- Left side view: { sourceObject: "Part", side: "Left" }`, {
        sourceObject: zod_1.z.string().describe('Name of the 3D object to project'),
        side: zod_1.z.enum(['Left', 'Right']).describe('Side for the view (Left or Right)'),
        pageName: zod_1.z.string().optional().describe('Name of the page to add the view to'),
        viewName: zod_1.z.string().optional().describe('Name for the view'),
    }, async (input) => {
        const { sourceObject, side, pageName, viewName } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_create_side_view
import json
params = json.loads('${JSON.stringify({ sourceObject, side, pageName: pageName || null, viewName: viewName || null })}')
result = handle_create_side_view(
    source_object=params['sourceObject'],
    side=params['side'],
    page_name=params.get('pageName'),
    view_name=params.get('viewName')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatViewCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_section_view
 *
 * Create a section cut view.
 */
function createSectionViewTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_section_view', `Create a section cut view of a source object on a TechDraw page.

Parameters:
- sourceObject (required): Name of the 3D object to project
- cutLine (required): JSON object with two points defining the cut line: {"point1": {"x": 0, "y": 0}, "point2": {"x": 100, "y": 0}}
- pageName (optional): Name of the page to add the view to. If omitted, uses the active page.
- viewName (optional): Name for the view. If omitted, auto-generated.

Returns:
- success: Whether the view was created
- viewName: Internal name of the view
- sourceObject: Name of the source 3D object
- viewType: Type of view ("Section")
- cutLine: The cut line coordinates
- pageName: Page containing the view
- message: Status message

Use this tool to create a cross-section view showing the interior of the model along a cut plane.

Example:
- Section through middle: { sourceObject: "Body", cutLine: {"point1": {"x": 0, "y": 50}, "point2": {"x": 100, "y": 50}}, pageName: "Page1" }`, {
        sourceObject: zod_1.z.string().describe('Name of the 3D object to project'),
        cutLine: zod_1.z.object({
            point1: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number() }),
            point2: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number() })
        }).describe('JSON object with point1 and point2 defining the cut line'),
        pageName: zod_1.z.string().optional().describe('Name of the page to add the view to'),
        viewName: zod_1.z.string().optional().describe('Name for the view'),
    }, async (input) => {
        const { sourceObject, cutLine, pageName, viewName } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_create_section_view
import json
params = json.loads('${JSON.stringify({ sourceObject, cutLine, pageName: pageName || null, viewName: viewName || null })}')
result = handle_create_section_view(
    source_object=params['sourceObject'],
    cut_line=params['cutLine'],
    page_name=params.get('pageName'),
    view_name=params.get('viewName')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatViewCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_projection_group
 *
 * Create a projection group with multiple views.
 */
function createProjectionGroupTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_projection_group', `Create a projection group containing multiple related views of a source object.

Parameters:
- sourceObject (required): Name of the 3D object to project
- views (optional): Array of view types to create. Defaults to ["Front", "Top", "RightSide"].
    Valid types: "Front", "Top", "RightSide", "LeftSide", "Rear", "Bottom", "Isometric"
- pageName (optional): Name of the page to add the views to. If omitted, uses the active page.
- groupName (optional): Name for the projection group. If omitted, auto-generated.

Returns:
- success: Whether the group was created
- groupName: Internal name of the projection group
- sourceObject: Name of the source 3D object
- views: Array of created views with name and type
- pageName: Page containing the views
- message: Status message

Use this tool to create a standard three-view projection (front, top, right side) or other view combinations.

Example:
- Standard three-view: { sourceObject: "Body", pageName: "Page1" }
- Custom views: { sourceObject: "Part", views: ["Front", "Top", "LeftSide", "Isometric"] }`, {
        sourceObject: zod_1.z.string().describe('Name of the 3D object to project'),
        views: zod_1.z.array(zod_1.z.string()).optional().describe('Array of view types to create'),
        pageName: zod_1.z.string().optional().describe('Name of the page to add the views to'),
        groupName: zod_1.z.string().optional().describe('Name for the projection group'),
    }, async (input) => {
        const { sourceObject, views, pageName, groupName } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_create_projection_group
import json
params = json.loads('${JSON.stringify({ sourceObject, views: views || null, pageName: pageName || null, groupName: groupName || null })}')
result = handle_create_projection_group(
    source_object=params['sourceObject'],
    views=params.get('views'),
    page_name=params.get('pageName'),
    group_name=params.get('groupName')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatViewCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_detail_view
 *
 * Create a detail (enlarged) view of a portion of a view.
 */
function createDetailViewTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_detail_view', `Create a detail (enlarged) view showing a zoomed portion of a source view.

Parameters:
- sourceView (required): Name of the source view to detail
- center (required): JSON object with x, y coordinates for the detail center: {"x": 50, "y": 50}
- scale (optional): Scale factor for the detail view (e.g., 2.0 for 2x magnification). Default: 2.0
- pageName (optional): Name of the page containing the source view. If omitted, finds automatically.
- viewName (optional): Name for the detail view. If omitted, auto-generated.

Returns:
- success: Whether the view was created
- viewName: Internal name of the detail view
- sourceView: Name of the source view
- scale: Scale factor used
- pageName: Page containing the view
- message: Status message

Use this tool to create a magnified detail of a specific area of a drawing view.

Example:
- Detail of front view: { sourceView: "Front", center: {"x": 50, "y": 50}, scale: 2.0, pageName: "Page1" }`, {
        sourceView: zod_1.z.string().describe('Name of the source view to detail'),
        center: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number() }).describe('JSON object with x, y coordinates for detail center'),
        scale: zod_1.z.number().optional().describe('Scale factor for magnification (default: 2.0)'),
        pageName: zod_1.z.string().optional().describe('Name of the page containing the source view'),
        viewName: zod_1.z.string().optional().describe('Name for the detail view'),
    }, async (input) => {
        const { sourceView, center, scale, pageName, viewName } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_create_detail_view
import json
params = json.loads('${JSON.stringify({ sourceView, center, scale: scale || 2.0, pageName: pageName || null, viewName: viewName || null })}')
result = handle_create_detail_view(
    page_name=params.get('pageName'),
    source_object=params['sourceView'],
    detail_point=params['center'],
    view_name=params.get('viewName')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatViewCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_linear_dimension
 *
 * Add a linear dimension to a TechDraw view.
 */
function createTechDrawLinearDimensionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_linear_dimension', `Add a linear dimension to a TechDraw view.

Parameters:
- pageName (required): Name of the page containing the view
- viewName (required): Name of the view to dimension
- startPoint (required): JSON object with x, y coordinates for start point: {"x": 10, "y": 20}
- endPoint (required): JSON object with x, y coordinates for end point: {"x": 60, "y": 20}
- direction (optional): Dimension direction - "Horizontal", "Vertical", or "Aligned" (default: "Aligned")

Returns:
- success: Whether the dimension was created
- dimensionName: Internal name of the dimension
- measurement: The measured distance in mm
- startPoint: Start point coordinates
- endPoint: End point coordinates
- message: Status message

Use this tool to add linear dimensions to drawing views.

Example:
- Horizontal dimension: { pageName: "Page1", viewName: "Front", startPoint: {"x": 0, "y": 0}, endPoint: {"x": 50, "y": 0}, direction: "Horizontal" }`, {
        pageName: zod_1.z.string().describe('Name of the page containing the view'),
        viewName: zod_1.z.string().describe('Name of the view to dimension'),
        startPoint: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number() }).describe('JSON object with x, y coordinates for start point'),
        endPoint: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number() }).describe('JSON object with x, y coordinates for end point'),
        direction: zod_1.z.enum(['Horizontal', 'Vertical', 'Aligned']).optional().describe('Dimension direction'),
    }, async (input) => {
        const { pageName, viewName, startPoint, endPoint, direction } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_add_linear_dimension
import json
params = json.loads('${JSON.stringify({ pageName, viewName, startPoint, endPoint, direction: direction || 'Aligned' })}')
result = handle_add_linear_dimension(
    page_name=params['pageName'],
    view_name=params['viewName'],
    start_point=params['startPoint'],
    end_point=params['endPoint'],
    direction=params.get('direction', 'Aligned')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatTechDrawDimension)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_radial_dimension
 *
 * Add a radial (radius) dimension to a circle in a TechDraw view.
 */
function createTechDrawRadialDimensionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_radial_dimension', `Add a radial (radius) dimension to a circle or arc in a TechDraw view.

Parameters:
- pageName (required): Name of the page containing the view
- viewName (required): Name of the view containing the circle
- circleName (required): Name of the circle object in the view to dimension

Returns:
- success: Whether the dimension was created
- dimensionName: Internal name of the dimension
- measurement: The radius value in mm
- circleName: Name of the dimensioned circle
- message: Status message

Use this tool to add radius dimensions to circular features in drawings.

Example:
- Radius dimension: { pageName: "Page1", viewName: "Top", circleName: "Circle1" }`, {
        pageName: zod_1.z.string().describe('Name of the page containing the view'),
        viewName: zod_1.z.string().describe('Name of the view containing the circle'),
        circleName: zod_1.z.string().describe('Name of the circle object to dimension'),
    }, async (input) => {
        const { pageName, viewName, circleName } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_add_radial_dimension
import json
params = json.loads('${JSON.stringify({ pageName, viewName, circleName })}')
result = handle_add_radial_dimension(
    page_name=params['pageName'],
    view_name=params['viewName'],
    circle_name=params['circleName']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatTechDrawDimension)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_diameter_dimension
 *
 * Add a diameter dimension to a circle in a TechDraw view.
 */
function createTechDrawDiameterDimensionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_diameter_dimension', `Add a diameter dimension to a circle or arc in a TechDraw view.

Parameters:
- pageName (required): Name of the page containing the view
- viewName (required): Name of the view containing the circle
- circleName (required): Name of the circle object in the view to dimension

Returns:
- success: Whether the dimension was created
- dimensionName: Internal name of the dimension
- measurement: The diameter value in mm
- circleName: Name of the dimensioned circle
- message: Status message

Use this tool to add diameter dimensions to circular features when radius is not appropriate.

Example:
- Diameter dimension: { pageName: "Page1", viewName: "Top", circleName: "Circle1" }`, {
        pageName: zod_1.z.string().describe('Name of the page containing the view'),
        viewName: zod_1.z.string().describe('Name of the view containing the circle'),
        circleName: zod_1.z.string().describe('Name of the circle object to dimension'),
    }, async (input) => {
        const { pageName, viewName, circleName } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_add_diameter_dimension
import json
params = json.loads('${JSON.stringify({ pageName, viewName, circleName })}')
result = handle_add_diameter_dimension(
    page_name=params['pageName'],
    view_name=params['viewName'],
    circle_name=params['circleName']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatTechDrawDimension)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_angular_dimension
 *
 * Add an angular dimension between two lines in a TechDraw view.
 */
function createTechDrawAngularDimensionTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_angular_dimension', `Add an angular dimension between two lines in a TechDraw view.

Parameters:
- pageName (required): Name of the page containing the view
- viewName (required): Name of the view containing the lines
- line1Name (required): Name of the first line object
- line2Name (required): Name of the second line object

Returns:
- success: Whether the dimension was created
- dimensionName: Internal name of the dimension
- measurement: The angle in degrees
- line1Name: First line
- line2Name: Second line
- message: Status message

Use this tool to add angular dimensions between intersecting lines.

Example:
- 90 degree angle: { pageName: "Page1", viewName: "Front", line1Name: "Line1", line2Name: "Line2" }`, {
        pageName: zod_1.z.string().describe('Name of the page containing the view'),
        viewName: zod_1.z.string().describe('Name of the view containing the lines'),
        line1Name: zod_1.z.string().describe('Name of the first line object'),
        line2Name: zod_1.z.string().describe('Name of the second line object'),
    }, async (input) => {
        const { pageName, viewName, line1Name, line2Name } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_add_angular_dimension
import json
params = json.loads('${JSON.stringify({ pageName, viewName, line1Name, line2Name })}')
result = handle_add_angular_dimension(
    page_name=params['pageName'],
    view_name=params['viewName'],
    line1_name=params['line1Name'],
    line2_name=params['line2Name']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatTechDrawDimension)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_text_annotation
 *
 * Add a text annotation to a TechDraw page.
 */
function createTextAnnotationTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_text_annotation', `Add a text annotation to a TechDraw page.

Parameters:
- pageName (required): Name of the page to add the text to
- text (required): The text string to display
- x (optional): X coordinate for text position (default: 0)
- y (optional): Y coordinate for text position (default: 0)

Returns:
- success: Whether the text was created
- textName: Internal name of the text annotation
- text: The text content
- position: {x, y} position coordinates
- pageName: Page containing the text
- message: Status message

Use this tool to add text labels, titles, or notes to drawing pages.

Example:
- Add title: { pageName: "Page1", text: "PART A - ISOMETRIC VIEW", x: 100, y: 200 }
- Simple annotation: { pageName: "Page1", text: "SCALE 1:1" }`, {
        pageName: zod_1.z.string().describe('Name of the page to add the text to'),
        text: zod_1.z.string().describe('The text string to display'),
        x: zod_1.z.number().optional().describe('X coordinate for text position (default: 0)'),
        y: zod_1.z.number().optional().describe('Y coordinate for text position (default: 0)'),
    }, async (input) => {
        const { pageName, text, x, y } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_add_text
import json
params = json.loads('${JSON.stringify({ pageName, text, x: x || 0, y: y || 0 })}')
result = handle_add_text(
    page_name=params['pageName'],
    text=params['text'],
    x=params.get('x', 0),
    y=params.get('y', 0)
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatAnnotationCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_balloon_annotation
 *
 * Add a balloon annotation to a TechDraw view.
 */
function createBalloonAnnotationTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_balloon_annotation', `Add a balloon annotation (numbered callout) to a TechDraw view.

Parameters:
- pageName (required): Name of the page containing the view
- viewName (optional): Name of the view to add the balloon to
- targetPoint (required): JSON object with x, y coordinates for balloon anchor: {"x": 50, "y": 50}
- text (optional): Text to display in the balloon (default: "1", auto-incrementing)

Returns:
- success: Whether the balloon was created
- balloonName: Internal name of the balloon
- text: Text displayed in the balloon
- targetPoint: Anchor point coordinates
- pageName: Page containing the balloon
- message: Status message

Use this tool to create numbered balloons for part identification in assembly drawings.

Example:
- Numbered balloon: { pageName: "Page1", viewName: "Isometric", targetPoint: {"x": 100, "y": 150} }
- Custom text: { pageName: "Page1", targetPoint: {"x": 50, "y": 50}, text: "A" }`, {
        pageName: zod_1.z.string().describe('Name of the page containing the view'),
        viewName: zod_1.z.string().optional().describe('Name of the view to add the balloon to'),
        targetPoint: zod_1.z.object({ x: zod_1.z.number(), y: zod_1.z.number() }).describe('JSON object with x, y coordinates for balloon anchor'),
        text: zod_1.z.string().optional().describe('Text to display in the balloon'),
    }, async (input) => {
        const { pageName, viewName, targetPoint, text } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_add_balloon
import json
params = json.loads('${JSON.stringify({ pageName, viewName: viewName || null, targetPoint, text: text || null })}')
result = handle_add_balloon(
    page_name=params['pageName'],
    view_name=params.get('viewName'),
    target_point=params['targetPoint'],
    text=params.get('text')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatAnnotationCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: create_leader_line
 *
 * Add a leader line with optional text to a TechDraw view.
 */
function createLeaderLineTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_leader_line', `Add a leader line with optional text annotation to a TechDraw view.

Parameters:
- pageName (required): Name of the page containing the view
- viewName (optional): Name of the view to add the leader to
- points (required): Array of [x, y] coordinates defining the leader line path
- text (optional): Text to display at the end of the leader line

Returns:
- success: Whether the leader was created
- leaderName: Internal name of the leader line
- points: Array of [x, y] coordinates
- text: Text displayed (if provided)
- pageName: Page containing the leader
- message: Status message

Use this tool to create leader lines with annotations for pointing to specific features.

Example:
- Simple leader: { pageName: "Page1", viewName: "Front", points: [[10, 50], [10, 100], [50, 100]] }
- With text: { pageName: "Page1", points: [[0, 0], [0, 50]], text: "MAX" }`, {
        pageName: zod_1.z.string().describe('Name of the page containing the view'),
        viewName: zod_1.z.string().optional().describe('Name of the view to add the leader to'),
        points: zod_1.z.array(zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()])).describe('Array of [x, y] coordinates for leader path'),
        text: zod_1.z.string().optional().describe('Text to display at the end of the leader'),
    }, async (input) => {
        const { pageName, viewName, points, text } = input;
        const code = `
from llm_bridge.techdraw_handlers import handle_add_leader
import json
params = json.loads('${JSON.stringify({ pageName, viewName: viewName || null, points, text: text || null })}')
result = handle_add_leader(
    page_name=params['pageName'],
    view_name=params.get('viewName'),
    points=params['points'],
    text=params.get('text')
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatAnnotationCreation)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: export_to_svg
 *
 * Export a TechDraw page to SVG format.
 */
function exportToSvgTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('export_to_svg', `Export a TechDraw page to SVG (Scalable Vector Graphics) format.

Parameters:
- pageName (required): Name of the page to export
- outputPath (required): Full path for the output SVG file

Returns:
- success: Whether the export was successful
- pageName: Name of the exported page
- outputPath: Path where the file was saved
- message: Status message

Use this tool when you need to export a drawing as a vector graphics file for sharing or further editing.

Example:
- Export to SVG: { pageName: "Page1", outputPath: "C:/Drawings/part.svg" }`, {
        pageName: zod_1.z.string().describe('Name of the page to export'),
        outputPath: zod_1.z.string().describe('Full path for the output SVG file'),
    }, async (input) => {
        const { pageName, outputPath } = input;
        // Validate file path
        const validation = (0, file_utils_1.validateFilePath)(outputPath);
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
from llm_bridge.techdraw_handlers import handle_export_page_to_svg
import json
params = json.loads('${JSON.stringify({ pageName, outputPath })}')
result = handle_export_page_to_svg(
    page_name=params['pageName'],
    output_path=params['outputPath']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatExportResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
/**
 * Tool: export_to_pdf
 *
 * Export a TechDraw page to PDF format.
 */
function exportToPdfTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('export_to_pdf', `Export a TechDraw page to PDF (Portable Document Format) format.

Parameters:
- pageName (required): Name of the page to export
- outputPath (required): Full path for the output PDF file

Returns:
- success: Whether the export was successful
- pageName: Name of the exported page
- outputPath: Path where the file was saved
- message: Status message

Use this tool when you need to export a drawing as a PDF for printing or sharing documentation.

Example:
- Export to PDF: { pageName: "Page1", outputPath: "C:/Drawings/part.pdf" }`, {
        pageName: zod_1.z.string().describe('Name of the page to export'),
        outputPath: zod_1.z.string().describe('Full path for the output PDF file'),
    }, async (input) => {
        const { pageName, outputPath } = input;
        // Validate file path
        const validation = (0, file_utils_1.validateFilePath)(outputPath);
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
from llm_bridge.techdraw_handlers import handle_export_page_to_pdf
import json
params = json.loads('${JSON.stringify({ pageName, outputPath })}')
result = handle_export_page_to_pdf(
    page_name=params['pageName'],
    output_path=params['outputPath']
)
print(json.dumps(result))
`.trim();
        try {
            const result = await freeCADBridge.executePython(code);
            const parsed = JSON.parse(result.output || '{}');
            const formatted = (0, result_formatters_1.formatExportResult)(parsed.data);
            return {
                content: [
                    {
                        type: 'text',
                        text: parsed.success ? formatted : `Error: ${parsed.error}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });
}
// ============================================================================
// Surface Modeling Tools
// ============================================================================
/**
 * Tool: create_loft
 *
 * Create a loft surface between two or more profile sketches.
 */
function createLoftTool(freeCADBridge) {
    return (0, claude_agent_sdk_1.tool)('create_loft', `Create a loft surface between two or more profile sketches.

Parameters:
- profiles (required): Array of object names (sketches or wires) to loft between
- solid (optional): Whether to create a solid (true) or surface (false). Default: true
- closed (optional): Whether to close the loft back to the first profile. Default: false
- name (optional): Name for the loft. If omitted, auto-generated.

Returns:
- success: Whether the loft was created
- loftName: Internal name of the loft
- loftLabel: User-friendly label
- profileCount: Number of profiles used
- solid: Whether solid mode was used
- message: Status message

Use this tool to create smooth surfaces that transition between multiple profile shapes. Common for creating bottles, aircraft fuselages, ship hulls, and organic shapes.

Example:
- Loft between two circles: { profiles: ["Sketch001", "Sketch002"], solid: true }
- Multi-profile loft: { profiles: ["Circle1", "Circle2", "Circle3"], solid: true }
- Closed loft: { profiles: ["Profile1", "Profile2", "Profile3"], closed: true }`, {
        profiles: zod_1.z.array(zod_1.z.string()).describe('Array of object names to loft between'),
        solid: zod_1.z.boolean().optional().default(true).describe('Create solid (true) or surface (false)'),
        closed: zod_1.z.boolean().optional().default(false).describe('Close the loft back to first profile'),
        name: zod_1.z.string().optional().describe('Name for the loft'),
    }, async (input) => {
        const { profiles, solid, closed, name } = input;
        const code = ;
        `
from llm_bridge.surface_handlers import handle_create_loft
import json
params = json.loads('\${JSON.stringify({ profiles, solid, closed, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_loft(
    profiles=params['profiles'],
    solid=params.get('solid', True),
    closed=params.get('closed', False),
    name=params['name']
)
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatLoftCreation(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : \`Error: \${parsed.error}\`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Tool execution error: \${error instanceof Error ? error.message : String(error)}\`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: create_section_loft
 *
 * Create a section loft (sweep along a path with multiple section profiles).
 */
function createSectionLoftTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_section_loft',
    \`Create a section loft - sweep multiple profiles along a path.

Parameters:
- profiles (required): Array of object names (sketches or wires) for sections
- path (required): Name of the path object (wire or edge) to sweep along
- solid (optional): Whether to create a solid (true) or surface (false). Default: true
- name (optional): Name for the section loft. If omitted, auto-generated.

Returns:
- success: Whether the section loft was created
- loftName: Internal name of the section loft
- profileCount: Number of section profiles
- pathName: Name of the sweep path
- solid: Whether solid mode was used
- message: Status message

Use this tool to create surfaces that follow a path while transitioning between multiple profile shapes. The profiles are automatically positioned along the path.

Example:
- Section loft along path: { profiles: ["Circle1", "Square", "Circle2"], path: "PathWire", solid: true }\`,
    {
      profiles: z.array(z.string()).describe('Array of section profile objects'),
      path: z.string().describe('Path object to sweep along'),
      solid: z.boolean().optional().default(true).describe('Create solid (true) or surface (false)'),
      name: z.string().optional().describe('Name for the section loft'),
    },
    async (input) => {
      const { profiles, path, solid, name } = input;

      const code = \`
from llm_bridge.surface_handlers import handle_create_section_loft
import json
params = json.loads('\${JSON.stringify({ profiles, path, solid, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_section_loft(
    profiles=params['profiles'],
    path=params['path'],
    solid=params.get('solid', True),
    name=params['name']
)
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatLoftCreation(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : \`Error: \${parsed.error}\`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Tool execution error: \${error instanceof Error ? error.message : String(error)}\`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: create_sweep
 *
 * Sweep a profile along a path to create a surface or solid.
 */
function createSweepTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_sweep',
    \`Sweep a profile (sketch or wire) along a path to create a surface or solid.

Parameters:
- profile (required): Name of the profile object to sweep (sketch or closed wire)
- path (required): Name of the path object (wire or edge) to sweep along
- solid (optional): Whether to create a solid (true) or surface (false). Default: true
- frenet (optional): Use Frenet frame calculation for orientation. Default: true
- name (optional): Name for the sweep. If omitted, auto-generated.

Returns:
- success: Whether the sweep was created
- sweepName: Internal name of the sweep
- sweepLabel: User-friendly label
- profileName: Name of the swept profile
- pathName: Name of the sweep path
- solid: Whether solid mode was used
- frenet: Whether Frenet frame was used
- message: Status message

Use this tool to create tubes, pipes, and extruded shapes that follow curved paths. Common for creating cable routes, pipes, and extruded profiles along curves.

Example:
- Sweep circle along path: { profile: "CircleSketch", path: "PathWire", solid: true }
- Surface sweep: { profile: "LineSketch", path: "Curve", solid: false }\`,
    {
      profile: z.string().describe('Profile object to sweep'),
      path: z.string().describe('Path object to sweep along'),
      solid: z.boolean().optional().default(true).describe('Create solid (true) or surface (false)'),
      frenet: z.boolean().optional().default(true).describe('Use Frenet frame calculation'),
      name: z.string().optional().describe('Name for the sweep'),
    },
    async (input) => {
      const { profile, path, solid, frenet, name } = input;

      const code = \`
from llm_bridge.surface_handlers import handle_create_sweep
import json
params = json.loads('\${JSON.stringify({ profile, path, solid, frenet, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_sweep(
    profile=params['profile'],
    path=params['path'],
    solid=params.get('solid', True),
    frenet=params.get('frenet', True),
    name=params['name']
)
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSweepCreation(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : \`Error: \${parsed.error}\`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Tool execution error: \${error instanceof Error ? error.message : String(error)}\`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: create_pipe
 *
 * Create a pipe surface using the Part::Pipe feature.
 */
function createPipeTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_pipe',
    \`Create a pipe surface - similar to sweep but with different fillet handling.

Parameters:
- profile (required): Name of the profile object to sweep
- path (required): Name of the path object to sweep along
- solid (optional): Whether to create a solid. Default: true
- name (optional): Name for the pipe. If omitted, auto-generated.

Returns:
- success: Whether the pipe was created
- pipeName: Internal name of the pipe
- profileName: Name of the swept profile
- pathName: Name of the sweep path
- message: Status message

Use this tool to create pipes with smooth transitions. The pipe feature handles corner fillets differently than sweep.

Example:
- Create pipe: { profile: "CircleSketch", path: "PathWire" }
- Solid pipe: { profile: "Circle", path: "SpiralPath", solid: true }\`,
    {
      profile: z.string().describe('Profile object to sweep'),
      path: z.string().describe('Path object to sweep along'),
      solid: z.boolean().optional().default(true).describe('Create solid (true) or surface (false)'),
      name: z.string().optional().describe('Name for the pipe'),
    },
    async (input) => {
      const { profile, path, solid, name } = input;

      const code = \`
from llm_bridge.surface_handlers import handle_create_pipe
import json
params = json.loads('\${JSON.stringify({ profile, path, solid, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_pipe(
    profile=params['profile'],
    path=params['path'],
    solid=params.get('solid', True),
    name=params['name']
)
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSweepCreation(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : \`Error: \${parsed.error}\`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Tool execution error: \${error instanceof Error ? error.message : String(error)}\`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: create_multisweep
 *
 * Create a multi-section sweep with multiple profiles at different positions.
 */
function createMultiSweepTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_multisweep',
    \`Create a multi-section sweep - sweep multiple profile sections along a path.

Parameters:
- profiles (required): Array of profile objects at different positions along the path
- path (required): Name of the path object to sweep along
- solid (optional): Whether to create a solid. Default: true
- name (optional): Name for the multi-sweep. If omitted, auto-generated.

Returns:
- success: Whether the multi-sweep was created
- sweepName: Internal name of the multi-sweep
- profileCount: Number of profile sections
- pathName: Name of the sweep path
- solid: Whether solid mode was used
- message: Status message

Use this tool to create complex surfaces that transition between multiple different profile shapes along a path. The profiles should be ordered from start to end of the path.

Example:
- Multi-section sweep: { profiles: ["Circle", "Square", "Hexagon"], path: "PathWire" }\`,
    {
      profiles: z.array(z.string()).describe('Array of profile objects along the path'),
      path: z.string().describe('Path object to sweep along'),
      solid: z.boolean().optional().default(true).describe('Create solid (true) or surface (false)'),
      name: z.string().optional().describe('Name for the multi-sweep'),
    },
    async (input) => {
      const { profiles, path, solid, name } = input;

      const code = \`
from llm_bridge.surface_handlers import handle_create_multisweep
import json
params = json.loads('\${JSON.stringify({ profiles, path, solid, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_multisweep(
    profiles=params['profiles'],
    path=params['path'],
    solid=params.get('solid', True),
    name=params['name']
)
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSweepCreation(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : \`Error: \${parsed.error}\`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Tool execution error: \${error instanceof Error ? error.message : String(error)}\`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: create_ruled_surface
 *
 * Create a ruled surface between two curves or edges.
 */
function createRuledSurfaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_ruled_surface',
    \`Create a ruled surface between two curves, edges, or wires.

Parameters:
- curve1 (required): First curve, edge, or wire
- curve2 (required): Second curve, edge, or wire
- name (optional): Name for the ruled surface. If omitted, auto-generated.

Returns:
- success: Whether the ruled surface was created
- surfaceName: Internal name of the ruled surface
- curve1Name: Name of first curve
- curve2Name: Name of second curve
- message: Status message

Use this tool to create a surface by interpolating straight lines between two boundary curves. Common for creating developable surfaces like cones and cylinders.

Example:
- Ruled surface between two edges: { curve1: "Edge1", curve2: "Edge2" }
- Between two sketches: { curve1: "Sketch001", curve2: "Sketch002" }\`,
    {
      curve1: z.string().describe('First curve, edge, or wire'),
      curve2: z.string().describe('Second curve, edge, or wire'),
      name: z.string().optional().describe('Name for the ruled surface'),
    },
    async (input) => {
      const { curve1, curve2, name } = input;

      const code = \`
from llm_bridge.surface_handlers import handle_create_ruled_surface
import json
params = json.loads('\${JSON.stringify({ curve1, curve2, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_ruled_surface(
    curve1=params['curve1'],
    curve2=params['curve2'],
    name=params['name']
)
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSurfaceOperation(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : \`Error: \${parsed.error}\`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Tool execution error: \${error instanceof Error ? error.message : String(error)}\`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: create_surface_from_edges
 *
 * Create a surface by filling a set of edges or wires.
 */
function createSurfaceFromEdgesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_surface_from_edges',
    \`Create a surface by filling a set of connected edges or wires.

Parameters:
- edges (required): Array of edge or wire object names that form a closed boundary
- name (optional): Name for the surface. If omitted, auto-generated.

Returns:
- success: Whether the surface was created
- surfaceName: Internal name of the surface
- edgeCount: Number of edges used
- message: Status message

Use this tool to create a surface that fills a boundary defined by edges. Common for closing gaps in models or creating planar surfaces from boundary edges.

Example:
- Fill with edges: { edges: ["Edge1", "Edge2", "Edge3", "Edge4"] }
- Fill with wire: { edges: ["Wire1"] }\`,
    {
      edges: z.array(z.string()).describe('Array of edge or wire objects forming closed boundary'),
      name: z.string().optional().describe('Name for the surface'),
    },
    async (input) => {
      const { edges, name } = input;

      const code = \`
from llm_bridge.surface_handlers import handle_create_surface_from_edges
import json
params = json.loads('\${JSON.stringify({ edges, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_surface_from_edges(
    edges=params['edges'],
    name=params['name']
)
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSurfaceOperation(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : \`Error: \${parsed.error}\`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Tool execution error: \${error instanceof Error ? error.message : String(error)}\`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: extend_surface
 *
 * Extend an existing surface by adding material along its edges.
 */
function extendSurfaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'extend_surface',
    \`Extend an existing surface by adding material along its boundary edges.

Parameters:
- surfaceName (required): Name of the surface to extend
- distance (required): Distance to extend in mm (number or string with units)
- direction (optional): "edge" to extend along specific edge, or "normal" to extend perpendicularly. Default: "normal"
- name (optional): Name for the extended surface. If omitted, modifies existing surface.

Returns:
- success: Whether the surface was extended
- surfaceName: Name of the (modified) surface
- distance: Extension distance
- direction: Extension direction
- message: Status message

Use this tool to extend surfaces for creating blanks, flanges, or to prepare surfaces for joining.

Example:
- Extend by 10mm: { surfaceName: "Surface001", distance: "10mm" }
- Extend along edge: { surfaceName: "Surface001", distance: "5mm", direction: "edge" }\`,
    {
      surfaceName: z.string().describe('Name of the surface to extend'),
      distance: z.union([z.string(), z.number()]).describe('Distance to extend (number or string with units)'),
      direction: z.enum(['edge', 'normal']).optional().default('normal').describe('Extension direction'),
      name: z.string().optional().describe('Name for the extended surface'),
    },
    async (input) => {
      const { surfaceName, distance, direction, name } = input;

      const code = \`
from llm_bridge.surface_handlers import handle_extend_surface
import json
params = json.loads('\${JSON.stringify({ surfaceName, distance, direction, name: name || null }).replace(/'/g, "\\'")}')
result = handle_extend_surface(
    surface_name=params['surfaceName'],
    distance=params['distance'],
    direction=params.get('direction', 'normal'),
    name=params['name']
)
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSurfaceOperation(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : \`Error: \${parsed.error}\`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Tool execution error: \${error instanceof Error ? error.message : String(error)}\`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: trim_surface
 *
 * Trim a surface using trimming tools.
 */
function trimSurfaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'trim_surface',
    \`Trim a surface using a tool surface or a set of trimming curves.

Parameters:
- surfaceName (required): Name of the surface to trim
- tool (required): Tool surface or array of curves to trim with
- name (optional): Name for the trimmed surface. If omitted, modifies existing surface.

Returns:
- success: Whether the surface was trimmed
- surfaceName: Name of the (modified) surface
- toolName: Name of the trimming tool
- message: Status message

Use this tool to cut away portions of a surface using other surfaces or curves as trimming boundaries.

Example:
- Trim with surface: { surfaceName: "Surface001", tool: "TrimSurface" }
- Trim with curves: { surfaceName: "Surface001", tool: ["Curve1", "Curve2"] }\`,
    {
      surfaceName: z.string().describe('Name of the surface to trim'),
      tool: z.union([z.string(), z.array(z.string())]).describe('Tool surface or array of trimming curves'),
      name: z.string().optional().describe('Name for the trimmed surface'),
    },
    async (input) => {
      const { surfaceName, tool, name } = input;

      const code = \`
from llm_bridge.surface_handlers import handle_trim_surface
import json
params = json.loads('\${JSON.stringify({ surfaceName, tool, name: name || null }).replace(/'/g, "\\'")}')
result = handle_trim_surface(
    surface_name=params['surfaceName'],
    tool=params['tool'],
    name=params['name']
)
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSurfaceOperation(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : \`Error: \${parsed.error}\`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Tool execution error: \${error instanceof Error ? error.message : String(error)}\`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: get_surface_info
 *
 * Get detailed information about a surface.
 */
function getSurfaceInfoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_surface_info',
    \`Get detailed information about a surface including its properties and geometry.

Parameters:
- surfaceName (required): Name of the surface to query

Returns:
- success: Whether the query was successful
- surfaceName: Name of the surface
- surfaceType: Type of surface
- area: Surface area in mm²
- volume: Volume if solid (mm³)
- centerOfMass: Center point coordinates
- curvature: Curvature information (min, max, gaussian, mean)
- message: Status message

Use this tool to inspect surface properties before performing further operations.

Example:
- Get surface info: { surfaceName: "Loft001" }\`,
    {
      surfaceName: z.string().describe('Name of the surface to query'),
    },
    async (input) => {
      const { surfaceName } = input;

      const code = \`
from llm_bridge.surface_handlers import handle_get_surface_info
import json
params = json.loads('\${JSON.stringify({ surfaceName }).replace(/'/g, "\\'")}')
result = handle_get_surface_info(surface_name=params['surfaceName'])
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSurfaceInfo(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : \`Error: \${parsed.error}\`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Tool execution error: \${error instanceof Error ? error.message : String(error)}\`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: list_surfaces
 *
 * List all surface objects in the active document.
 */
function listSurfacesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_surfaces',
    \`List all surface objects in the active FreeCAD document.

Returns:
- success: Whether the query was successful
- surfaceCount: Number of surfaces found
- surfaces: Array of surface objects with name, type, and properties
- message: Status message

Use this tool to see all available surfaces before querying or modifying them.

Example:
- List all surfaces: {}\`,
    {
      // No parameters needed
    },
    async () => {
      const code = \`
from llm_bridge.surface_handlers import handle_list_surfaces
import json
result = handle_list_surfaces()
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');

        if (parsed.success) {
          let output = "Surfaces: " + (parsed.surfaceCount || 0) + "\\n\\n";
          if (parsed.surfaces && parsed.surfaces.length > 0) {
            output += formatTableRow(['Name', 'Type', 'Area (mm²)']);
            output += "\\n" + "─".repeat(60) + "\\n";
            for (const surf of parsed.surfaces) {
              output += formatTableRow([
                surf.name || '-',
                surf.surfaceType || '-',
                surf.area !== undefined ? surf.area.toFixed(2) : '-'
              ]);
              output += "\\n";
            }
          } else {
            output += "(No surfaces found)";
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
                text: "Error: " + parsed.error,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: "Tool execution error: " + (error instanceof Error ? error.message : String(error)),
            },
          ],
        };
      }
    },
  );
}

/**
 * Tool: validate_surface
 *
 * Validate surface geometry for defects.
 */
function validateSurfaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'validate_surface',
    \`Validate surface geometry for defects, gaps, or irregularities.

Parameters:
- surfaceName (required): Name of the surface to validate

Returns:
- success: Whether the validation was performed
- surfaceName: Name of the validated surface
- isValid: Whether the surface is valid
- issues: Array of detected issues (type, description, location)
- issueCount: Number of issues found
- message: Status message

Use this tool to check surface quality before exporting or manufacturing. Common issues include gaps, overlaps, and geometric irregularities.

Example:
- Validate surface: { surfaceName: "Loft001" }\`,
    {
      surfaceName: z.string().describe('Name of the surface to validate'),
    },
    async (input) => {
      const { surfaceName } = input;

      const code = \`
from llm_bridge.surface_handlers import handle_validate_surface
import json
params = json.loads('\${JSON.stringify({ surfaceName }).replace(/'/g, "\\'")}')
result = handle_validate_surface(surface_name=params['surfaceName'])
print(json.dumps(result))
\`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = JSON.parse(result.output || '{}');
        const formatted = formatSurfaceInfo(parsed.data);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? formatted : \`Error: \${parsed.error}\`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: \`Tool execution error: \${error instanceof Error ? error.message : String(error)}\`,
            },
          ],
        };
      }
    },
  );
};
    });
}
//# sourceMappingURL=agent-tools-corrupted.js.map