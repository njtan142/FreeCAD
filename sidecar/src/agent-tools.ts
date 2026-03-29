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
  formatFeatureResult,
  formatBodyResult,
  formatBodyList,
  formatFeatureUpdate,
  formatShapeResult,
  formatShapeInfo,
  formatShapeValidation,
  formatAssemblyCreationResult,
  formatComponentList,
  formatConstraintCreationResult,
  formatConstraintList,
  formatConstraintUpdate,
  formatPointCreation,
  formatGeometryCreation,
  formatDimensionCreation,
  formatTextCreation,
  formatModificationResult,
  formatPageCreation,
  formatViewCreation,
  formatTechDrawDimension,
  formatAnnotationCreation,
  formatExportResult,
  formatTableRow,
  formatPatternCreation,
  formatPatternUpdate,
  formatPatternInfo,
  formatLoftCreation,
  formatSweepCreation,
  formatSurfaceOperation,
  formatSurfaceInfo,
  formatBlendSurface,
  formatOffsetSurface,
  formatSurfaceAnalysis,
  formatSurfaceRebuild,
  formatLoftInfo,
  formatSweepInfo,
  formatSolverInit,
  formatSolveResult,
  formatDOFResult,
  formatJointValue,
  formatJointLimits,
  formatDriveResult,
  formatAnimationResult,
  formatAnimationState,
  formatKinematicPositions,
  formatCollisionResult,
  formatRenderResult,
  formatViewAngle,
  formatAnimationCapture,
  formatVideoExport,
  formatMaterialResult,
  formatMeshConversion,
  formatMeshBoolean,
  formatMeshDecimation,
  formatMeshRepair,
  formatMeshValidation,
  formatMeshInfo,
  formatMeshScale,
  formatMeshOffset,
  formatMeshExport,
  formatMeshImport,
  formatFEAAnalysis,
  formatFEAMesh,
  formatFEAMaterial,
  formatFEAConstraint,
  formatFEASolver,
  formatFEAResults,
  formatPathJobCreation,
  formatPathJobList,
  formatPathToolCreation,
  formatPathToolList,
  formatPathOperation,
  formatPathDressup,
  formatGCodeExport,
  formatPathSimulation,
  formatUndoResult,
  formatRedoResult,
  formatUndoStackSize,
  formatVisibilityChange,
  formatVisibleObjectsList,
  formatSelectionChange,
  formatMeasurement,
  formatDistanceMeasurement,
  formatAngleMeasurement,
  formatSpreadsheetCreate,
  formatSpreadsheetDelete,
  formatSpreadsheetInfo,
  formatCellValue,
  formatCellExpression,
  formatAliasList,
  formatBomGeneration,
  formatBomData,
  formatParametricTable,
  formatTableLookup,
  formatColumnWidth,
  formatRowHeight,
  formatCellBackground,
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

/**
 * Parse the last valid JSON line from output that may contain duplicate lines.
 * FreeCAD's Python bridge sometimes prints multiple JSON lines via stdout.
 */
function parseLastJsonLine(output: string | undefined): any {
  if (!output) return {};
  const lines = output.trim().split('\n').filter(l => l.trim());
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      continue;
    }
  }
  return {};
}

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
    // Advanced surface modeling tools
    createBlendSurfaceTool(freeCADBridge),
    createOffsetSurfaceTool(freeCADBridge),
    analyzeSurfaceTool(freeCADBridge),
    rebuildSurfaceTool(freeCADBridge),
    getLoftInfoTool(freeCADBridge),
    getSweepInfoTool(freeCADBridge),
    // Kinematic solver and animation tools
    initializeKinematicSolverTool(freeCADBridge),
    solveAssemblyTool(freeCADBridge),
    checkDegreesOfFreedomTool(freeCADBridge),
    setJointValueTool(freeCADBridge),
    getJointValueTool(freeCADBridge),
    getJointLimitsTool(freeCADBridge),
    driveJointTool(freeCADBridge),
    animateAssemblyTool(freeCADBridge),
    stopAnimationTool(freeCADBridge),
    getAnimationStateTool(freeCADBridge),
    getKinematicPositionsTool(freeCADBridge),
    checkCollisionTool(freeCADBridge),
    // View tools
    setViewAngleTool(freeCADBridge),
    zoomToFitTool(freeCADBridge),
    setCameraPositionTool(freeCADBridge),
    // Render tools
    renderViewTool(freeCADBridge),
    setRendererTool(freeCADBridge),
    setRenderQualityTool(freeCADBridge),
    // Material tools
    setObjectMaterialTool(freeCADBridge),
    setObjectColorTool(freeCADBridge),
    // Lighting tools
    configureLightingTool(freeCADBridge),
    // Animation export tools
    startAnimationCaptureTool(freeCADBridge),
    captureAnimationFrameTool(freeCADBridge),
    stopAnimationCaptureTool(freeCADBridge),
    exportAnimationTool(freeCADBridge),
    // Mesh operation tools
    // Conversion tools
    shapeToMeshTool(freeCADBridge),
    meshToShapeTool(freeCADBridge),
    // Boolean operations
    meshBooleanUnionTool(freeCADBridge),
    meshBooleanDifferenceTool(freeCADBridge),
    meshBooleanIntersectionTool(freeCADBridge),
    // Decimation and optimization
    decimateMeshTool(freeCADBridge),
    optimizeMeshTool(freeCADBridge),
    // Repair tools
    repairMeshTool(freeCADBridge),
    fillHolesTool(freeCADBridge),
    fixMeshNormalsTool(freeCADBridge),
    // Validation tools
    validateMeshTool(freeCADBridge),
    checkWatertightTool(freeCADBridge),
    // Info tools
    getMeshInfoTool(freeCADBridge),
    // Scale and offset
    scaleMeshTool(freeCADBridge),
    offsetMeshTool(freeCADBridge),
    // Export tools
    exportStlTool(freeCADBridge),
    export3mfTool(freeCADBridge),
    exportObjTool(freeCADBridge),
    exportPlyTool(freeCADBridge),
    // Import tools
    importStlTool(freeCADBridge),
    import3mfTool(freeCADBridge),
    importObjTool(freeCADBridge),
    // FEA (Finite Element Analysis) tools
    // Analysis management
    createFeaAnalysisTool(freeCADBridge),
    deleteFeaAnalysisTool(freeCADBridge),
    listFeaAnalysesTool(freeCADBridge),
    getFeaAnalysisTool(freeCADBridge),
    // Mesh generation
    createFeaMeshTool(freeCADBridge),
    refineFeaMeshTool(freeCADBridge),
    getFeaMeshInfoTool(freeCADBridge),
    // Material assignment
    setFeaMaterialTool(freeCADBridge),
    getFeaMaterialTool(freeCADBridge),
    // Boundary conditions
    addFeaFixedConstraintTool(freeCADBridge),
    addFeaForceConstraintTool(freeCADBridge),
    addFeaPressureConstraintTool(freeCADBridge),
    addFeaDisplacementConstraintTool(freeCADBridge),
    addFeaSelfWeightTool(freeCADBridge),
    listFeaConstraintsTool(freeCADBridge),
    removeFeaConstraintTool(freeCADBridge),
    // Solver
    setFeaSolverTool(freeCADBridge),
    configureFeaSolverTool(freeCADBridge),
    getFeaSolverStatusTool(freeCADBridge),
    checkFeaAnalysisStatusTool(freeCADBridge),
    // Execution
    runFeaAnalysisTool(freeCADBridge),
    stopFeaAnalysisTool(freeCADBridge),
    // Results
    getFeaDisplacementTool(freeCADBridge),
    getFeaStressTool(freeCADBridge),
    getFeaReactionsTool(freeCADBridge),
    getFeaStrainTool(freeCADBridge),
    getFeaResultSummaryTool(freeCADBridge),
    // Path/CAM workbench tools
    // Job management
    createPathJobTool(freeCADBridge),
    configurePathJobTool(freeCADBridge),
    deletePathJobTool(freeCADBridge),
    listPathJobsTool(freeCADBridge),
    // Tool management
    createPathToolTool(freeCADBridge),
    createPathToolbitTool(freeCADBridge),
    createToolControllerTool(freeCADBridge),
    listPathToolsTool(freeCADBridge),
    // Path operations
    createPathProfileTool(freeCADBridge),
    createPathPocketTool(freeCADBridge),
    createPathDrillTool(freeCADBridge),
    createPathFaceTool(freeCADBridge),
    // Dressup operations
    createPathDressupRadiusTool(freeCADBridge),
    createPathDressupTagTool(freeCADBridge),
    createPathDressupLeadOffTool(freeCADBridge),
    // G-code and simulation
    exportGCodeTool(freeCADBridge),
    simulatePathTool(freeCADBridge),
    // Undo/Redo tools
    createUndoTool(freeCADBridge),
    createRedoTool(freeCADBridge),
    getUndoStackSizeTool(freeCADBridge),
    // Visibility management tools
    showObjectTool(freeCADBridge),
    hideObjectTool(freeCADBridge),
    toggleVisibilityTool(freeCADBridge),
    showAllObjectsTool(freeCADBridge),
    hideAllObjectsTool(freeCADBridge),
    getVisibleObjectsTool(freeCADBridge),
    setObjectVisibilityTool(freeCADBridge),
    // Selection tools
    selectObjectTool(freeCADBridge),
    deselectObjectTool(freeCADBridge),
    selectAllObjectsTool(freeCADBridge),
    clearSelectionTool(freeCADBridge),
    isObjectSelectedTool(freeCADBridge),
    // Measurement tools
    measureDistanceTool(freeCADBridge),
    measureObjectDistanceTool(freeCADBridge),
    measureAngleTool(freeCADBridge),
    measureLengthTool(freeCADBridge),
    measureAreaTool(freeCADBridge),
    getMeasureInfoTool(freeCADBridge),
    // Spreadsheet lifecycle tools
    createSpreadsheetTool(freeCADBridge),
    deleteSpreadsheetTool(freeCADBridge),
    renameSpreadsheetTool(freeCADBridge),
    listSpreadsheetsTool(freeCADBridge),
    getSpreadsheetInfoTool(freeCADBridge),
    // Cell operation tools
    setCellTool(freeCADBridge),
    getCellTool(freeCADBridge),
    setCellExpressionTool(freeCADBridge),
    getCellExpressionTool(freeCADBridge),
    clearCellTool(freeCADBridge),
    clearRangeTool(freeCADBridge),
    // Alias tools
    setAliasTool(freeCADBridge),
    getAliasTool(freeCADBridge),
    removeAliasTool(freeCADBridge),
    listAliasesTool(freeCADBridge),
    // BOM tools
    generateBomTool(freeCADBridge),
    getObjectBomDataTool(freeCADBridge),
    exportBomToSpreadsheetTool(freeCADBridge),
    // Parametric table tools
    createParametricTableTool(freeCADBridge),
    updateParametricTableTool(freeCADBridge),
    lookupValueTool(freeCADBridge),
    // Formatting tools
    setColumnWidthTool(freeCADBridge),
    setRowHeightTool(freeCADBridge),
    setCellBackgroundTool(freeCADBridge),
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
        const parsed = parseLastJsonLine(result.output);
        
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
        
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
        const parsed = parseLastJsonLine(result.output);
        
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
        const parsed = parseLastJsonLine(result.output);
        
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
        const parsed = parseLastJsonLine(result.output);
        
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
        const parsed = parseLastJsonLine(result.output);

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

// ============================================================================
// Pattern and Array Tools
// ============================================================================

/**
 * Tool: create_linear_pattern
 *
 * Create a linear pattern (1D array) of a feature.
 */
function createLinearPatternTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_linear_pattern',
    `Create a linear pattern (1D array) of a feature in a specified direction.

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
- 3x10mm spacing in Y: { sourceObject: "Cylinder", direction: "Y", count: 3, spacing: 10 }`,
    {
      sourceObject: z.string().describe('Name of the source feature to pattern'),
      direction: z.union([
        z.object({ x: z.number(), y: z.number(), z: z.number() }),
        z.enum(['X', 'Y', 'Z'])
      ]).describe('Direction vector {x, y, z} or axis name "X", "Y", "Z"'),
      count: z.number().describe('Number of instances including original'),
      spacing: z.number().describe('Distance between instances in mm'),
      name: z.string().optional().describe('Name for the pattern'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPatternCreation(parsed.data);
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
 * Tool: create_polar_pattern
 *
 * Create a polar (circular) pattern around an axis.
 */
function createPolarPatternTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_polar_pattern',
    `Create a polar pattern (circular array) of a feature around an axis.

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
- 8 instances in 270 degrees: { sourceObject: "Pad", count: 8, angle: 270 }`,
    {
      sourceObject: z.string().describe('Name of the source feature to pattern'),
      centerPoint: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Center point {x, y, z}'),
      axis: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Axis of rotation (default: Z-axis)'),
      count: z.number().describe('Number of instances including original'),
      angle: z.number().optional().describe('Total angle in degrees (default: 360)'),
      name: z.string().optional().describe('Name for the pattern'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPatternCreation(parsed.data);
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
 * Tool: create_rectangular_pattern
 *
 * Create a rectangular (2D grid) pattern of a feature.
 */
function createRectangularPatternTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_rectangular_pattern',
    `Create a rectangular pattern (2D grid) of a feature.

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
- 3x4 grid of holes: { sourceObject: "Pocket", directionX: "X", countX: 3, spacingX: 10, directionY: "Y", countY: 4, spacingY: 10 }`,
    {
      sourceObject: z.string().describe('Name of the source feature to pattern'),
      directionX: z.union([
        z.object({ x: z.number(), y: z.number(), z: z.number() }),
        z.enum(['X', 'Y', 'Z'])
      ]).describe('X direction vector or axis'),
      countX: z.number().describe('Number of instances in X direction'),
      spacingX: z.number().describe('Spacing in X direction (mm)'),
      directionY: z.union([
        z.object({ x: z.number(), y: z.number(), z: z.number() }),
        z.enum(['X', 'Y', 'Z'])
      ]).describe('Y direction vector or axis'),
      countY: z.number().describe('Number of instances in Y direction'),
      spacingY: z.number().describe('Spacing in Y direction (mm)'),
      name: z.string().optional().describe('Name for the pattern'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPatternCreation(parsed.data);
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
 * Tool: create_path_pattern
 *
 * Create a pattern along a path (wire or edge).
 */
function createPathPatternTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_path_pattern',
    `Create a pattern of a feature along a path (wire or edge).

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
- Evenly spaced along path: { sourceObject: "Pad", pathObject: "Sketch", count: 10, alignToPath: true }`,
    {
      sourceObject: z.string().describe('Name of the source feature to pattern'),
      pathObject: z.string().describe('Name of the path object (wire, edge, or sketch)'),
      count: z.number().describe('Number of instances along the path'),
      spacing: z.number().optional().describe('Distance between instances (mm)'),
      alignToPath: z.boolean().optional().default(true).describe('Align instances to path tangent'),
      name: z.string().optional().describe('Name for the pattern'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPatternCreation(parsed.data);
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
 * Tool: create_transform_link
 *
 * Create a transform link (3D array/pattern) using MultiTransform.
 */
function createTransformLinkTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_transform_link',
    `Create a transform link (3D array/pattern) using MultiTransform.

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
- Transform of 5 instances: { sourceObject: "Pad", direction: "X", count: 5, spacing: 10 }`,
    {
      sourceObject: z.string().describe('Name of the source feature to pattern'),
      direction: z.union([
        z.object({ x: z.number(), y: z.number(), z: z.number() }),
        z.enum(['X', 'Y', 'Z'])
      ]).describe('Direction vector {x, y, z} or axis name "X", "Y", "Z"'),
      count: z.number().describe('Number of instances including original'),
      spacing: z.number().describe('Distance between instances in mm'),
      name: z.string().optional().describe('Name for the pattern'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPatternCreation(parsed.data);
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
 * Tool: update_linear_pattern
 *
 * Update parameters of an existing linear pattern.
 */
function updateLinearPatternTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'update_linear_pattern',
    `Update parameters of an existing linear pattern.

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
- Double spacing: { patternName: "LinearPattern", spacing: 20 }`,
    {
      patternName: z.string().describe('Name of the linear pattern to update'),
      count: z.number().optional().describe('New number of instances'),
      spacing: z.number().optional().describe('New spacing distance in mm'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPatternUpdate(parsed.data);
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
 * Tool: update_polar_pattern
 *
 * Update parameters of an existing polar pattern.
 */
function updatePolarPatternTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'update_polar_pattern',
    `Update parameters of an existing polar pattern.

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
- Change to 180 degrees: { patternName: "PolarPattern", angle: 180 }`,
    {
      patternName: z.string().describe('Name of the polar pattern to update'),
      count: z.number().optional().describe('New number of instances'),
      angle: z.number().optional().describe('New total angle in degrees'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPatternUpdate(parsed.data);
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
 * Tool: get_pattern_info
 *
 * Get detailed information about a pattern.
 */
function getPatternInfoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_pattern_info',
    `Get detailed information about a pattern including its parameters and instance positions.

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
- Get pattern details: { patternName: "LinearPattern001" }`,
    {
      patternName: z.string().describe('Name of the pattern to query'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPatternInfo(parsed.data);
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
 * Tool: delete_pattern
 *
 * Delete a pattern from the document.
 */
function deletePatternTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'delete_pattern',
    `Delete a pattern from the document. The source feature is preserved.

Parameters:
- patternName (required): Name of the pattern to delete

Returns:
- success: Whether the pattern was deleted
- patternName: Name of the deleted pattern
- message: Status message

Use this tool to remove unwanted patterns while keeping the original source feature intact.

Example:
- Delete pattern: { patternName: "LinearPattern001" }`,
    {
      patternName: z.string().describe('Name of the pattern to delete'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Deleted pattern: ${patternName}\n${parsed.message || ''}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${parsed.error}`,
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
 * Tool: list_patterns
 *
 * List all patterns in the active document.
 */
function listPatternsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_patterns',
    `List all patterns (linear, polar, rectangular, path) in the active document.

Parameters: None

Returns:
- success: Whether the query was successful
- patternCount: Number of patterns found
- patterns: Array of pattern objects with name, type, source, and count
- message: Status message

Use this tool to see all available patterns in the document before modifying or deleting them.

Example:
- List all patterns: {}`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.pattern_handlers import handle_list_patterns
import json
result = handle_list_patterns()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          let output = `Patterns: ${parsed.patternCount || 0}\n\n`;
          if (parsed.patterns && parsed.patterns.length > 0) {
            output += formatTableRow(['Name', 'Type', 'Source', 'Count']);
            output += '\n' + '─'.repeat(70) + '\n';
            for (const pattern of parsed.patterns) {
              output += formatTableRow([
                pattern.name || '-',
                pattern.type || '-',
                pattern.sourceObject || '-',
                String(pattern.count || 0)
              ]);
              output += '\n';
            }
          } else {
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
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${parsed.error}`,
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
- Make point midpoint of line: { sketchName: "Sketch", constraintType: "midpoint", geoIndex1: 0, geoIndex2: 1 }`,
    {
      sketchName: z.string().describe('Name of the sketch'),
      constraintType: z.enum(['coincident', 'horizontal', 'vertical', 'parallel', 'perpendicular', 'tangent', 'equal', 'symmetric', 'concentric', 'midpoint']).describe('Type of geometric constraint'),
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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
        const parsed = parseLastJsonLine(result.output);
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

// ============================================================================
// PartDesign Feature Tools
// ============================================================================

/**
 * Tool: create_body
 *
 * Create a new PartDesign Body.
 */
function createBodyTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_body',
    `Create a new PartDesign Body.

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
- Create named body: { name: "MainBody" }`,
    {
      name: z.string().optional().describe('Name for the new body'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatBodyResult(parsed.data);
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
 * Tool: set_active_body
 *
 * Set the active PartDesign Body for subsequent feature operations.
 */
function setActiveBodyTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_active_body',
    `Set the active PartDesign Body for subsequent feature operations.

Parameters:
- bodyName (required): Name of the body to set as active

Returns:
- success: Whether the body was set as active
- bodyName: Name of the active body
- previousBody: Name of the previously active body (if any)
- message: Status message

Use this tool before creating PartDesign features to specify which body they should be added to.

Example:
- Set active body: { bodyName: "Body" }`,
    {
      bodyName: z.string().describe('Name of the body to set as active'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatBodyResult(parsed.data);
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
 * Tool: list_bodies
 *
 * List all PartDesign Bodies in the active document.
 */
function listBodiesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_bodies',
    `List all PartDesign Bodies in the active document.

Returns:
- success: Whether the query was successful
- bodyCount: Number of bodies found
- bodies: Array of body objects with name, label, feature count, and active status
- message: Status message

Use this tool to see all available bodies before creating or modifying features.

Example:
- List bodies: {}`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.feature_handlers import handle_list_bodies
import json
result = handle_list_bodies()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatBodyList(parsed.data);
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
 * Tool: create_pad
 *
 * Create a PartDesign Pad (extrusion) feature.
 */
function createPadTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_pad',
    `Create a PartDesign Pad (extrusion) feature from a sketch.

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
- Create pad: { sketchName: "Sketch", length: "10mm" }`,
    {
      sketchName: z.string().describe('Name of the sketch to pad'),
      length: z.union([z.string(), z.number()]).describe('Length of the pad (number or string with units)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFeatureResult(parsed.data);
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
 * Tool: create_pocket
 *
 * Create a PartDesign Pocket (cut/extrude remove) feature.
 */
function createPocketTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_pocket',
    `Create a PartDesign Pocket (cut/extrude remove) feature from a sketch.

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
- Create pocket: { sketchName: "Sketch001", depth: "5mm" }`,
    {
      sketchName: z.string().describe('Name of the sketch to pocket'),
      depth: z.union([z.string(), z.number()]).describe('Depth of the pocket (number or string with units)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFeatureResult(parsed.data);
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
 * Tool: create_revolution
 *
 * Create a PartDesign Revolution (revolve) feature.
 */
function createRevolutionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_revolution',
    `Create a PartDesign Revolution (revolve) feature from a sketch.

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
- Full revolution: { sketchName: "Sketch", angle: "360deg" }`,
    {
      sketchName: z.string().describe('Name of the sketch to revolve'),
      angle: z.union([z.string(), z.number()]).describe('Revolution angle (number in radians or string with units)'),
      axis: z.enum(['Horizontal', 'Vertical', 'Custom']).optional().describe('Axis of revolution'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFeatureResult(parsed.data);
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
 * Tool: create_groove
 *
 * Create a PartDesign Groove (revolved cut) feature.
 */
function createGrooveTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_groove',
    `Create a PartDesign Groove (revolved cut) feature from a sketch.

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
- Partial groove: { sketchName: "Sketch", angle: "180deg" }`,
    {
      sketchName: z.string().describe('Name of the sketch to groove'),
      angle: z.union([z.string(), z.number()]).describe('Revolution angle (number in radians or string with units)'),
      axis: z.enum(['Horizontal', 'Vertical', 'Custom']).optional().describe('Axis of revolution'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFeatureResult(parsed.data);
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
 * Tool: create_fillet
 *
 * Create a PartDesign Fillet (rounded edge) feature.
 */
function createFilletTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_fillet',
    `Create a PartDesign Fillet (rounded edge) feature.

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
- Fillet multiple edges: { featureName: "Pad", edges: [0, 1, 2], radius: "3mm" }`,
    {
      featureName: z.string().describe('Name of the base feature to fillet'),
      edges: z.array(z.number()).describe('Array of edge indices to fillet (0-based)'),
      radius: z.union([z.string(), z.number()]).describe('Fillet radius (number or string with units)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFeatureResult(parsed.data);
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
 * Tool: create_chamfer
 *
 * Create a PartDesign Chamfer (beveled edge) feature.
 */
function createChamferTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_chamfer',
    `Create a PartDesign Chamfer (beveled edge) feature.

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
- Chamfer multiple edges: { featureName: "Pad", edges: [0, 1, 2], size: "3mm" }`,
    {
      featureName: z.string().describe('Name of the base feature to chamfer'),
      edges: z.array(z.number()).describe('Array of edge indices to chamfer (0-based)'),
      size: z.union([z.string(), z.number()]).describe('Chamfer size (number or string with units)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFeatureResult(parsed.data);
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
 * Tool: update_feature
 *
 * Update a dimension of a PartDesign feature.
 */
function updateFeatureTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'update_feature',
    `Update a dimension of a PartDesign feature.

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
- Update revolution angle: { featureName: "Revolution", dimension: "angle", value: "270deg" }`,
    {
      featureName: z.string().describe('Name of the feature to update'),
      dimension: z.enum(['length', 'depth', 'angle', 'radius']).describe('Dimension to update'),
      value: z.union([z.string(), z.number()]).describe('New value (number or string with units)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFeatureUpdate(parsed.data);
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
 * Tool: replace_sketch
 *
 * Replace the sketch of a PartDesign feature with a different sketch.
 */
function replaceSketchTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'replace_sketch',
    `Replace the sketch of a PartDesign feature with a different sketch.

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
- Replace sketch: { featureName: "Pad", sketchName: "Sketch001" }`,
    {
      featureName: z.string().describe('Name of the feature to update'),
      sketchName: z.string().describe('Name of the new sketch to use'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFeatureResult(parsed.data);
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
 * Tool: delete_feature
 *
 * Delete a PartDesign feature from a body.
 */
function deleteFeatureTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'delete_feature',
    `Delete a PartDesign feature from a body.

Parameters:
- featureName (required): Name of the feature to delete

Returns:
- success: Whether the feature was deleted
- featureName: Name of the deleted feature
- featureType: Type of the deleted feature
- message: Status message

Use this tool to remove unwanted PartDesign features. Note: Deleting a feature may affect dependent features.

Example:
- Delete feature: { featureName: "Fillet1" }`,
    {
      featureName: z.string().describe('Name of the feature to delete'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFeatureResult(parsed.data);
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
 * Tool: boolean_fuse
 *
 * Perform a boolean union (fuse) operation on shapes.
 */
function booleanFuseTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'boolean_fuse',
    `Perform a boolean union (fuse) operation on two or more shapes.

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
- Fuse multiple shapes: { baseShape: "Box", toolShapes: ["Cylinder", "Sphere"], resultName: "CombinedPart" }`,
    {
      baseShape: z.string().describe('Name of the base shape/object'),
      toolShapes: z.array(z.string()).describe('Array of shape/object names to fuse with the base'),
      resultName: z.string().optional().describe('Name for the resulting fused shape'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatShapeResult(parsed.data);
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
 * Tool: boolean_cut
 *
 * Perform a boolean cut (subtract) operation on shapes.
 */
function booleanCutTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'boolean_cut',
    `Perform a boolean cut (subtract) operation - subtract tool shapes from a base shape.

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
- Cut multiple shapes: { baseShape: "Box", toolShapes: ["Cylinder", "Sphere"], resultName: "CutPart" }`,
    {
      baseShape: z.string().describe('Name of the base shape/object to cut from'),
      toolShapes: z.array(z.string()).describe('Array of shape/object names to subtract from the base'),
      resultName: z.string().optional().describe('Name for the resulting cut shape'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatShapeResult(parsed.data);
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
 * Tool: boolean_common
 *
 * Perform a boolean intersection (common) operation on shapes.
 */
function booleanCommonTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'boolean_common',
    `Perform a boolean intersection (common) operation - find the shared volume between shapes.

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
- Intersect multiple shapes: { baseShape: "Box", toolShapes: ["Cylinder", "Sphere"], resultName: "CommonPart" }`,
    {
      baseShape: z.string().describe('Name of the base shape/object'),
      toolShapes: z.array(z.string()).describe('Array of shape/object names to intersect with the base'),
      resultName: z.string().optional().describe('Name for the resulting intersection shape'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatShapeResult(parsed.data);
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
 * Tool: make_compound
 *
 * Create a compound of multiple shapes without boolean fusion.
 */
function makeCompoundTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'make_compound',
    `Create a compound of multiple shapes - groups shapes together without boolean fusion.

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
- Compound multiple shapes: { shapes: ["Box", "Cylinder", "Sphere"], resultName: "Assembly" }`,
    {
      shapes: z.array(z.string()).describe('Array of shape/object names to compound'),
      resultName: z.string().optional().describe('Name for the resulting compound'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatShapeResult(parsed.data);
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
 * Tool: validate_shape
 *
 * Validate a shape for integrity and defects.
 */
function validateShapeTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'validate_shape',
    `Validate a shape for integrity and detect defects.

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
- Validate a shape: { shapeName: "Pad" }`,
    {
      shapeName: z.string().describe('Name of the shape/object to validate'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatShapeValidation(parsed.data);
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
 * Tool: heal_shape
 *
 * Attempt to fix shape defects and improve shape quality.
 */
function healShapeTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'heal_shape',
    `Attempt to fix shape defects and improve shape quality.

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
- Heal with custom tolerance: { shapeName: "ImportedPart", tolerance: "0.01mm" }`,
    {
      shapeName: z.string().describe('Name of the shape/object to heal'),
      tolerance: z.union([z.string(), z.number()]).optional().describe('Healing tolerance value (default: 0.1mm)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatShapeResult(parsed.data);
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
 * Tool: get_shape_info
 *
 * Get detailed information about a shape's properties and topology.
 */
function getShapeInfoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_shape_info',
    `Get detailed information about a shape's properties and topology.

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
- Get shape info: { shapeName: "Pad" }`,
    {
      shapeName: z.string().describe('Name of the shape/object to query'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatShapeInfo(parsed.data);
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
// Assembly Management Tools
// ============================================================================

/**
 * Tool: create_assembly
 *
 * Create a new assembly container.
 */
function createAssemblyTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_assembly',
    `Create a new assembly container to hold multiple parts.

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
- Create named assembly: { name: "EngineAssembly" }`,
    {
      name: z.string().optional().describe('Name for the new assembly'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatAssemblyCreationResult(parsed.data);
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
 * Tool: list_assemblies
 *
 * List all assemblies in the current FreeCAD document.
 */
function listAssembliesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_assemblies',
    `List all assemblies in the current FreeCAD document.

Returns:
- Array of assemblies with name, label, type, and component count
- Total assembly count

Use this tool when you need to see what assemblies exist in the current document.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.assembly_handlers import handle_list_assemblies
import json
result = handle_list_assemblies()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (!parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${parsed.error}`,
              },
            ],
          };
        }

        const { data } = parsed;
        const lines: string[] = [];
        lines.push(`Assemblies: ${data.count}`);
        lines.push('');

        if (data.assemblies && data.assemblies.length > 0) {
          lines.push(formatTableRow(['Name', 'Label', 'Type', 'Components']));
          lines.push('─'.repeat(60));

          for (const assembly of data.assemblies) {
            lines.push(formatTableRow([
              assembly.name || '-',
              assembly.label || '-',
              assembly.type || '-',
              String(assembly.componentCount || 0)
            ]));
          }
        } else {
          lines.push('(No assemblies found)');
        }

        return {
          content: [
            {
              type: 'text',
              text: lines.join('\n'),
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
 * Tool: add_component_to_assembly
 *
 * Add a component/part to an assembly.
 */
function addComponentToAssemblyTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_component_to_assembly',
    `Add a component/part to an assembly.

Parameters:
- objectName (required): Name of the object to add to the assembly
- assemblyName (required): Name of the assembly to add the object to

Returns:
- success: Whether the operation succeeded
- componentName: Internal name of the added component
- componentLabel: User-friendly label of the component
- assemblyName: Internal name of the assembly
- assemblyLabel: User-friendly label of the assembly
- message: Status message

Use this tool to add an existing part or component to an assembly container.

Example:
- Add a box to an assembly: { objectName: "Box", assemblyName: "Assembly" }
- Add a cylinder to assembly: { objectName: "Cylinder", assemblyName: "EngineAssembly" }`,
    {
      objectName: z.string().describe('Name of the object to add to the assembly'),
      assemblyName: z.string().describe('Name of the assembly to add the object to'),
    },
    async (input) => {
      const { objectName, assemblyName } = input;

      const code = `
from llm_bridge.assembly_handlers import handle_add_component_to_assembly
import json
params = json.loads('${JSON.stringify({ objectName, assemblyName })}')
result = handle_add_component_to_assembly(object_name=params['objectName'], assembly_name=params['assemblyName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Added '${parsed.data.componentLabel}' to assembly '${parsed.data.assemblyLabel}'`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${parsed.error}`,
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
 * Tool: remove_component_from_assembly
 *
 * Remove a component/part from an assembly.
 */
function removeComponentFromAssemblyTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'remove_component_from_assembly',
    `Remove a component/part from an assembly.

Parameters:
- objectName (required): Name of the object to remove from the assembly
- assemblyName (required): Name of the assembly to remove the object from

Returns:
- success: Whether the operation succeeded
- removedComponent: Name of the removed component
- assemblyName: Internal name of the assembly
- message: Status message

Use this tool to remove an existing part or component from an assembly container.

Example:
- Remove a box from an assembly: { objectName: "Box", assemblyName: "Assembly" }
- Remove a cylinder from assembly: { objectName: "Cylinder", assemblyName: "EngineAssembly" }`,
    {
      objectName: z.string().describe('Name of the object to remove from the assembly'),
      assemblyName: z.string().describe('Name of the assembly to remove the object from'),
    },
    async (input) => {
      const { objectName, assemblyName } = input;

      const code = `
from llm_bridge.assembly_handlers import handle_remove_component_from_assembly
import json
params = json.loads('${JSON.stringify({ objectName, assemblyName })}')
result = handle_remove_component_from_assembly(object_name=params['objectName'], assembly_name=params['assemblyName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Removed '${parsed.data.removedComponent}' from assembly '${parsed.data.assemblyName}'`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${parsed.error}`,
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
 * Tool: list_assembly_components
 *
 * List all components in an assembly.
 */
function listAssemblyComponentsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_assembly_components',
    `List all components in an assembly.

Parameters:
- assemblyName (required): Name of the assembly to list components from

Returns:
- success: Whether the operation succeeded
- assemblyName: Internal name of the assembly
- assemblyLabel: User-friendly label of the assembly
- components: Array of component objects with name, label, and type
- count: Number of components
- message: Status message

Use this tool to see what parts/components are in an assembly.

Example:
- List components: { assemblyName: "Assembly" }
- List specific assembly: { assemblyName: "EngineAssembly" }`,
    {
      assemblyName: z.string().describe('Name of the assembly to list components from'),
    },
    async (input) => {
      const { assemblyName } = input;

      const code = `
from llm_bridge.assembly_handlers import handle_list_assembly_components
import json
params = json.loads('${JSON.stringify({ assemblyName })}')
result = handle_list_assembly_components(assembly_name=params['assemblyName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatComponentList(parsed.data);
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
 * Tool: add_coincident_constraint
 *
 * Add a coincident constraint between two subobjects.
 */
function addCoincidentConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_coincident_constraint',
    `Add a coincident constraint between two subobjects - makes them meet at a point or edge.

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
- Coincident faces: { object1: "Part", subobject1: "Face1", object2: "Base", subobject2: "Face1" }`,
    {
      object1: z.string().describe('Name of the first object'),
      subobject1: z.string().describe('Subobject reference (e.g., "Face1", "Edge1", "Vertex1")'),
      object2: z.string().describe('Name of the second object'),
      subobject2: z.string().describe('Subobject reference for second object'),
      name: z.string().optional().describe('Name for the constraint'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatConstraintCreationResult(parsed.data);
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
 * Tool: add_parallel_constraint
 *
 * Add a parallel constraint between two subobjects.
 */
function addParallelConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_parallel_constraint',
    `Add a parallel constraint between two subobjects - makes them parallel to each other.

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
- Parallel edges: { object1: "Rod", subobject1: "Edge1", object2: "Guide", subobject2: "Edge1" }`,
    {
      object1: z.string().describe('Name of the first object'),
      subobject1: z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
      object2: z.string().describe('Name of the second object'),
      subobject2: z.string().describe('Subobject reference for second object'),
      name: z.string().optional().describe('Name for the constraint'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatConstraintCreationResult(parsed.data);
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
 * Tool: add_perpendicular_constraint
 *
 * Add a perpendicular constraint between two subobjects.
 */
function addPerpendicularConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_perpendicular_constraint',
    `Add a perpendicular constraint between two subobjects - makes them orthogonal.

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
- Perpendicular edges: { object1: "Beam", subobject1: "Edge1", object2: "Support", subobject2: "Edge1" }`,
    {
      object1: z.string().describe('Name of the first object'),
      subobject1: z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
      object2: z.string().describe('Name of the second object'),
      subobject2: z.string().describe('Subobject reference for second object'),
      name: z.string().optional().describe('Name for the constraint'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatConstraintCreationResult(parsed.data);
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
 * Tool: add_angle_constraint
 *
 * Add an angle constraint between two subobjects.
 */
function addAngleConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_angle_constraint',
    `Add an angle constraint between two subobjects - constrains them to a specific angle.

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
- 90 degree angle: { object1: "Bracket", subobject1: "Face1", object2: "Plate", subobject2: "Face1", angle: 90 }`,
    {
      object1: z.string().describe('Name of the first object'),
      subobject1: z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
      object2: z.string().describe('Name of the second object'),
      subobject2: z.string().describe('Subobject reference for second object'),
      angle: z.union([z.string(), z.number()]).describe('Angle value in degrees'),
      name: z.string().optional().describe('Name for the constraint'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatConstraintCreationResult(parsed.data);
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
 * Tool: add_distance_constraint
 *
 * Add a distance constraint between two subobjects.
 */
function addDistanceConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_distance_constraint',
    `Add a distance constraint between two subobjects.

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
- Set 10mm gap: { object1: "Box", subobject1: "Face1", object2: "Cylinder", subobject2: "Face2", distance: 10 }`,
    {
      object1: z.string().describe('Name of the first object'),
      subobject1: z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
      object2: z.string().describe('Name of the second object'),
      subobject2: z.string().describe('Subobject reference for second object'),
      distance: z.union([z.string(), z.number()]).describe('Distance value in mm or string like "10mm"'),
      name: z.string().optional().describe('Name for the constraint'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatConstraintCreationResult(parsed.data);
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
 * Tool: add_insert_constraint
 *
 * Add an insert (cylindrical fit) constraint.
 */
function addInsertConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_insert_constraint',
    `Add an insert constraint - mates a cylindrical subobject into another (shaft into hole).

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
- Insert pin into hole: { object1: "Pin", subobject1: "Cylinder", object2: "Plate", subobject2: "Cylinder" }`,
    {
      object1: z.string().describe('Name of the first object (inserted part)'),
      subobject1: z.string().describe('Subobject reference (e.g., "Cylinder", "Face1")'),
      object2: z.string().describe('Name of the second object (receiving part)'),
      subobject2: z.string().describe('Subobject reference for receiving part'),
      name: z.string().optional().describe('Name for the constraint'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatConstraintCreationResult(parsed.data);
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
 * Tool: add_tangent_constraint
 *
 * Add a tangent constraint between two subobjects.
 */
function addTangentConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_tangent_constraint',
    `Add a tangent constraint between two subobjects.

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
- Make tangent: { object1: "Sphere", subobject1: "Face1", object2: "Plane", subobject2: "Face1" }`,
    {
      object1: z.string().describe('Name of the first object'),
      subobject1: z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
      object2: z.string().describe('Name of the second object'),
      subobject2: z.string().describe('Subobject reference for second object'),
      name: z.string().optional().describe('Name for the constraint'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatConstraintCreationResult(parsed.data);
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
 * Tool: add_equal_constraint
 *
 * Add an equal constraint (equal length, radius, etc.) between two subobjects.
 */
function addEqualConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_equal_constraint',
    `Add an equal constraint between two subobjects - makes them equal in size.

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
- Equal radius: { object1: "Cylinder1", subobject1: "Cylinder", object2: "Cylinder2", subobject2: "Cylinder" }`,
    {
      object1: z.string().describe('Name of the first object'),
      subobject1: z.string().describe('Subobject reference (e.g., "Edge1", "Cylinder")'),
      object2: z.string().describe('Name of the second object'),
      subobject2: z.string().describe('Subobject reference for second object'),
      name: z.string().optional().describe('Name for the constraint'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatConstraintCreationResult(parsed.data);
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
 * Tool: add_symmetric_constraint
 *
 * Add a symmetric constraint between two subobjects about a plane.
 */
function addSymmetricConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_symmetric_constraint',
    `Add a symmetric constraint between two subobjects about a plane.

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
- Symmetric about XY plane: { object1: "LeftPart", subobject1: "Face1", object2: "RightPart", subobject2: "Face1", symmetryPlane: "XY_Plane" }`,
    {
      object1: z.string().describe('Name of the first object'),
      subobject1: z.string().describe('Subobject reference (e.g., "Face1", "Edge1")'),
      object2: z.string().describe('Name of the second object'),
      subobject2: z.string().describe('Subobject reference for second object'),
      symmetryPlane: z.string().optional().describe('Reference to the symmetry plane (optional)'),
      name: z.string().optional().describe('Name for the constraint'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatConstraintCreationResult(parsed.data);
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
// Assembly Constraint Modification Tools
// ============================================================================

/**
 * Tool: update_constraint_value
 *
 * Update the value of an existing constraint.
 */
function updateConstraintValueTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'update_constraint_value',
    `Update the value of an existing constraint (angle or distance).

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
- Change distance: { constraintName: "Distance1", newValue: 15 }`,
    {
      constraintName: z.string().describe('Name of the constraint to update'),
      newValue: z.number().describe('New value for the constraint (degrees for angle, mm for distance)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatConstraintUpdate(parsed.data);
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
 * Tool: remove_constraint
 *
 * Remove a constraint from an assembly.
 */
function removeConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'remove_constraint',
    `Remove a constraint from an assembly.

Parameters:
- constraintName (required): Name of the constraint to remove

Returns:
- success: Whether the constraint was removed
- removedConstraint: Name of the removed constraint
- message: Status message

Use this tool to delete unwanted constraints from an assembly.

Example:
- Remove constraint: { constraintName: "Coincident1" }`,
    {
      constraintName: z.string().describe('Name of the constraint to remove'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Removed constraint: ${constraintName}\n${parsed.message || ''}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${parsed.error}`,
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
 * Tool: list_constraints
 *
 * List all constraints in an assembly.
 */
function listConstraintsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_constraints',
    `List all constraints in an assembly.

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
- List in specific assembly: { assemblyName: "EngineAssembly" }`,
    {
      assemblyName: z.string().optional().describe('Name of the assembly to query'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatConstraintList(parsed.data);
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
 * Tool: suppress_constraint
 *
 * Temporarily disable a constraint.
 */
function suppressConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'suppress_constraint',
    `Temporarily disable (suppress) a constraint in an assembly.

Parameters:
- constraintName (required): Name of the constraint to suppress

Returns:
- success: Whether the constraint was suppressed
- constraintName: Name of the suppressed constraint
- message: Status message

Use this tool to temporarily disable a constraint without deleting it. The assembly will ignore this constraint until it is activated again.

Example:
- Suppress constraint: { constraintName: "Distance1" }`,
    {
      constraintName: z.string().describe('Name of the constraint to suppress'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Suppressed constraint: ${constraintName}\n${parsed.message || ''}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${parsed.error}`,
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
 * Tool: activate_constraint
 *
 * Re-enable a suppressed constraint.
 */
function activateConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'activate_constraint',
    `Re-enable (activate) a previously suppressed constraint.

Parameters:
- constraintName (required): Name of the constraint to activate

Returns:
- success: Whether the constraint was activated
- constraintName: Name of the activated constraint
- message: Status message

Use this tool to re-enable a constraint that was previously suppressed.

Example:
- Activate constraint: { constraintName: "Distance1" }`,
    {
      constraintName: z.string().describe('Name of the constraint to activate'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Activated constraint: ${constraintName}\n${parsed.message || ''}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${parsed.error}`,
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

// ============================================================================
// Draft Workbench Tools
// ============================================================================

/**
 * Tool: create_point
 *
 * Create a point in 3D space.
 */
function createPointTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_point',
    `Create a point in 3D space using the Draft workbench.

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
- Named point: { x: 50, y: 50, name: "PointA" }`,
    {
      x: z.number().describe('X coordinate in mm'),
      y: z.number().describe('Y coordinate in mm'),
      z: z.number().optional().default(0).describe('Z coordinate in mm (default: 0)'),
      name: z.string().optional().describe('Name for the point'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPointCreation(parsed.data);
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
 * Tool: create_line
 *
 * Create a line between two points.
 */
function createLineTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_line',
    `Create a line segment between two points using the Draft workbench.

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
- Horizontal line: { startX: 0, startY: 0, startZ: 0, endX: 100, endY: 0, endZ: 0 }`,
    {
      startX: z.number().describe('Start X coordinate in mm'),
      startY: z.number().describe('Start Y coordinate in mm'),
      startZ: z.number().optional().default(0).describe('Start Z coordinate in mm (default: 0)'),
      endX: z.number().describe('End X coordinate in mm'),
      endY: z.number().describe('End Y coordinate in mm'),
      endZ: z.number().optional().default(0).describe('End Z coordinate in mm (default: 0)'),
      name: z.string().optional().describe('Name for the line'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatGeometryCreation(parsed.data, 'Line');
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
 * Tool: create_circle
 *
 * Create a circle.
 */
function createCircleTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_circle',
    `Create a circle using the Draft workbench.

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
- Circle at origin with 10mm radius: { centerX: 0, centerY: 0, centerZ: 0, radius: 10 }`,
    {
      centerX: z.number().describe('Center X coordinate in mm'),
      centerY: z.number().describe('Center Y coordinate in mm'),
      centerZ: z.number().optional().default(0).describe('Center Z coordinate in mm (default: 0)'),
      radius: z.number().describe('Radius of the circle in mm'),
      name: z.string().optional().describe('Name for the circle'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatGeometryCreation(parsed.data, 'Circle');
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
 * Tool: create_arc
 *
 * Create a circular arc.
 */
function createArcTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_arc',
    `Create a circular arc using the Draft workbench.

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
- Half arc: { centerX: 0, centerY: 0, centerZ: 0, radius: 50, startAngle: 0, endAngle: 180 }`,
    {
      centerX: z.number().describe('Center X coordinate in mm'),
      centerY: z.number().describe('Center Y coordinate in mm'),
      centerZ: z.number().optional().default(0).describe('Center Z coordinate in mm (default: 0)'),
      radius: z.number().describe('Radius of the arc in mm'),
      startAngle: z.number().describe('Start angle in degrees (0-360)'),
      endAngle: z.number().describe('End angle in degrees (0-360)'),
      name: z.string().optional().describe('Name for the arc'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatGeometryCreation(parsed.data, 'Arc');
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
 * Tool: create_ellipse
 *
 * Create an ellipse.
 */
function createEllipseTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_ellipse',
    `Create an ellipse using the Draft workbench.

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
- Ellipse at (100, 50): { centerX: 100, centerY: 50, centerZ: 0, majorRadius: 40, minorRadius: 25 }`,
    {
      centerX: z.number().describe('Center X coordinate in mm'),
      centerY: z.number().describe('Center Y coordinate in mm'),
      centerZ: z.number().optional().default(0).describe('Center Z coordinate in mm (default: 0)'),
      majorRadius: z.number().describe('Major axis radius in mm'),
      minorRadius: z.number().describe('Minor axis radius in mm'),
      name: z.string().optional().describe('Name for the ellipse'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatGeometryCreation(parsed.data, 'Ellipse');
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
 * Tool: create_rectangle
 *
 * Create a rectangle.
 */
function createRectangleTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_rectangle',
    `Create a rectangle using the Draft workbench.

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
- Rectangle at (20, 30): { width: 80, height: 40, x: 20, y: 30 }`,
    {
      width: z.number().describe('Width of the rectangle in mm'),
      height: z.number().describe('Height of the rectangle in mm'),
      x: z.number().optional().default(0).describe('X coordinate of lower-left corner (default: 0)'),
      y: z.number().optional().default(0).describe('Y coordinate of lower-left corner (default: 0)'),
      z: z.number().optional().default(0).describe('Z coordinate (default: 0)'),
      name: z.string().optional().describe('Name for the rectangle'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatGeometryCreation(parsed.data, 'Rectangle');
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
 * Tool: create_polygon
 *
 * Create a regular polygon.
 */
function createPolygonTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_polygon',
    `Create a regular polygon using the Draft workbench.

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
- Triangle: { sides: 3, radius: 30 }`,
    {
      sides: z.number().min(3).max(12).describe('Number of sides (3-12)'),
      radius: z.number().describe('Circumradius in mm'),
      x: z.number().optional().default(0).describe('X coordinate of center (default: 0)'),
      y: z.number().optional().default(0).describe('Y coordinate of center (default: 0)'),
      z: z.number().optional().default(0).describe('Z coordinate (default: 0)'),
      name: z.string().optional().describe('Name for the polygon'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatGeometryCreation(parsed.data, 'Polygon');
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
 * Tool: create_bspline
 *
 * Create a B-spline curve through specified points.
 */
function createBSplineTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_bspline',
    `Create a B-spline curve passing through specified points using the Draft workbench.

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
- Complex curve: { points: [[0, 0, 0], [25, 50, 0], [50, 50, 0], [75, 25, 0], [100, 0, 0]] }`,
    {
      points: z.array(z.tuple([z.number(), z.number(), z.number()])).describe('Array of [x, y, z] coordinates for each point'),
      name: z.string().optional().describe('Name for the B-spline'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatGeometryCreation(parsed.data, 'BSpline');
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
 * Tool: create_bezier
 *
 * Create a Bezier curve through specified control points.
 */
function createBezierTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_bezier',
    `Create a Bezier curve using specified control points via the Draft workbench.

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
- Complex curve: { points: [[0, 0, 0], [30, 80, 0], [70, 80, 0], [100, 0, 0]] }`,
    {
      points: z.array(z.tuple([z.number(), z.number(), z.number()])).describe('Array of [x, y, z] coordinates for control points'),
      name: z.string().optional().describe('Name for the Bezier curve'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatGeometryCreation(parsed.data, 'Bezier');
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
 * Tool: create_wire
 *
 * Create a polyline/wire from a series of points.
 */
function createWireTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_wire',
    `Create a polyline/wire (connected line segments) from a series of points using the Draft workbench.

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
- Closed shape: { points: [[0, 0, 0], [100, 0, 0], [100, 100, 0], [0, 100, 0]], closed: true }`,
    {
      points: z.array(z.tuple([z.number(), z.number(), z.number()])).describe('Array of [x, y, z] coordinates for each vertex'),
      closed: z.boolean().optional().default(false).describe('Whether to close the wire (connect last to first)'),
      name: z.string().optional().describe('Name for the wire'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatGeometryCreation(parsed.data, 'Wire');
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
 * Tool: create_linear_dimension
 *
 * Create a linear dimension between two points.
 */
function createLinearDimensionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_linear_dimension',
    `Create a linear dimension between two points using the Draft workbench.

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
- Offset dimension: { startX: 0, startY: 0, startZ: 0, endX: 50, endY: 50, endZ: 0, offset: 10 }`,
    {
      startX: z.number().describe('Start X coordinate in mm'),
      startY: z.number().describe('Start Y coordinate in mm'),
      startZ: z.number().optional().default(0).describe('Start Z coordinate in mm (default: 0)'),
      endX: z.number().describe('End X coordinate in mm'),
      endY: z.number().describe('End Y coordinate in mm'),
      endZ: z.number().optional().default(0).describe('End Z coordinate in mm (default: 0)'),
      offset: z.number().optional().default(0).describe('Perpendicular offset from measured line in mm (default: 0)'),
      name: z.string().optional().describe('Name for the dimension'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatDimensionCreation(parsed.data);
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
 * Tool: create_radial_dimension
 *
 * Create a radial dimension (radius or diameter) for a circle or arc.
 */
function createRadialDimensionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_radial_dimension',
    `Create a radial dimension (radius or diameter) for a circle or arc using the Draft workbench.

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
- Diameter dimension: { objectName: "Circle001" }`,
    {
      objectName: z.string().describe('Name of the circle or arc object to dimension'),
      name: z.string().optional().describe('Name for the dimension'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatDimensionCreation(parsed.data);
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
 * Tool: create_angular_dimension
 *
 * Create an angular dimension between two lines.
 */
function createAngularDimensionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_angular_dimension',
    `Create an angular dimension between two lines using the Draft workbench.

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
- Angle between lines: { objectName1: "Line", objectName2: "Line001" }`,
    {
      objectName1: z.string().describe('Name of the first line object'),
      objectName2: z.string().describe('Name of the second line object'),
      name: z.string().optional().describe('Name for the dimension'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatDimensionCreation(parsed.data);
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
 * Tool: create_ordinate_dimension
 *
 * Create an ordinate dimension (X or Y distance from origin).
 */
function createOrdinateDimensionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_ordinate_dimension',
    `Create an ordinate dimension (X or Y distance from origin) using the Draft workbench.

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
- Custom origin: { objectName: "Point", direction: "x", originX: 50, originY: 50 }`,
    {
      objectName: z.string().describe('Name of the point or vertex object to dimension'),
      direction: z.enum(['x', 'y']).describe('Direction - "x" for horizontal, "y" for vertical'),
      originX: z.number().optional().default(0).describe('Origin X coordinate (default: 0)'),
      originY: z.number().optional().default(0).describe('Origin Y coordinate (default: 0)'),
      originZ: z.number().optional().default(0).describe('Origin Z coordinate (default: 0)'),
      name: z.string().optional().describe('Name for the dimension'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatDimensionCreation(parsed.data);
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
 * Tool: create_text
 *
 * Create a text annotation.
 */
function createTextTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_text',
    `Create a text annotation using the Draft workbench.

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
- Label: { text: "Part A - Front View", x: 0, y: 100 }`,
    {
      text: z.string().describe('The text string to display'),
      x: z.number().optional().default(0).describe('X coordinate (default: 0)'),
      y: z.number().optional().default(0).describe('Y coordinate (default: 0)'),
      z: z.number().optional().default(0).describe('Z coordinate (default: 0)'),
      name: z.string().optional().describe('Name for the text'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatTextCreation(parsed.data);
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
 * Tool: create_dimension_text
 *
 * Add custom text to an existing dimension.
 */
function createDimensionTextTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_dimension_text',
    `Add custom text to an existing dimension using the Draft workbench.

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
- Replace with custom text: { objectName: "Dimension001", customText: "±0.5", position: "replacement" }`,
    {
      objectName: z.string().describe('Name of the dimension object to modify'),
      customText: z.string().describe('Custom text to add'),
      position: z.enum(['before', 'after', 'replacement']).optional().default('after').describe('Where to place text'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatDimensionCreation(parsed.data);
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
 * Tool: move_objects
 *
 * Move one or more objects by a vector.
 */
function moveObjectsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'move_objects',
    `Move one or more objects by a displacement vector using the Draft workbench.

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
- Move multiple objects: { objectNames: ["Line", "Rectangle"], deltaX: 10, deltaY: 20, deltaZ: 0 }`,
    {
      objectNames: z.array(z.string()).describe('Array of object names to move'),
      deltaX: z.number().describe('X displacement in mm'),
      deltaY: z.number().describe('Y displacement in mm'),
      deltaZ: z.number().optional().default(0).describe('Z displacement in mm (default: 0)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatModificationResult(parsed.data, 'move');
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
 * Tool: rotate_objects
 *
 * Rotate one or more objects by an angle around a center point.
 */
function rotateObjectsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'rotate_objects',
    `Rotate one or more objects by an angle around a center point using the Draft workbench.

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
- Rotate around custom center: { objectNames: ["Circle"], angle: 90, centerX: 50, centerY: 50, centerZ: 0 }`,
    {
      objectNames: z.array(z.string()).describe('Array of object names to rotate'),
      angle: z.number().describe('Rotation angle in degrees'),
      centerX: z.number().optional().default(0).describe('Center X coordinate (default: 0)'),
      centerY: z.number().optional().default(0).describe('Center Y coordinate (default: 0)'),
      centerZ: z.number().optional().default(0).describe('Center Z coordinate (default: 0)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatModificationResult(parsed.data, 'rotate');
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
 * Tool: scale_objects
 *
 * Scale one or more objects by a factor.
 */
function scaleObjectsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'scale_objects',
    `Scale one or more objects by a factor using the Draft workbench.

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
- Scale around custom center: { objectNames: ["Polygon"], scaleFactor: 1.5, centerX: 50, centerY: 50 }`,
    {
      objectNames: z.array(z.string()).describe('Array of object names to scale'),
      scaleFactor: z.number().describe('Scale factor (e.g., 2.0 for 2x size, 0.5 for half)'),
      centerX: z.number().optional().default(0).describe('Center X coordinate (default: 0)'),
      centerY: z.number().optional().default(0).describe('Center Y coordinate (default: 0)'),
      centerZ: z.number().optional().default(0).describe('Center Z coordinate (default: 0)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatModificationResult(parsed.data, 'scale');
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
 * Tool: offset_object
 *
 * Create an offset copy of an object.
 */
function offsetObjectTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'offset_object',
    `Create an offset (parallel) copy of an object using the Draft workbench.

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
- Offset rectangle: { objectName: "Rectangle", distance: 20 }`,
    {
      objectName: z.string().describe('Name of the object to offset'),
      distance: z.number().describe('Offset distance in mm (positive for outward, negative for inward)'),
      name: z.string().optional().describe('Name for the offset object'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatModificationResult(parsed.data, 'offset');
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
 * Tool: join_objects
 *
 * Join multiple draft objects into a single wire/polyline.
 */
function joinObjectsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'join_objects',
    `Join multiple draft objects (wires/edges) into a single wire/polyline using the Draft workbench.

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
- Join arcs: { objectNames: ["Arc", "Arc001"] }`,
    {
      objectNames: z.array(z.string()).describe('Array of object names to join'),
      name: z.string().optional().describe('Name for the joined object'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatModificationResult(parsed.data, 'join');
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
 * Tool: split_object
 *
 * Split a draft object at specified points.
 */
function splitObjectTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'split_object',
    `Split a draft object at specified points using the Draft workbench.

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
- Split at multiple points: { objectName: "Wire", points: [[25, 0, 0], [75, 0, 0]] }`,
    {
      objectName: z.string().describe('Name of the object to split'),
      points: z.array(z.tuple([z.number(), z.number(), z.number()])).describe('Array of [x, y, z] coordinates where to split'),
      name: z.string().optional().describe('Base name for the split objects'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatModificationResult(parsed.data, 'split');
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
// TechDraw Workbench Tools
// ============================================================================

/**
 * Tool: create_drawing_page
 *
 * Create a new TechDraw page.
 */
function createDrawingPageTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_drawing_page',
    `Create a new TechDraw page for creating 2D drawings from 3D models.

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
- Create with specific template: { template: "A3_Landscape" }`,
    {
      template: z.string().optional().describe('Template name (e.g., "A4_Landscape", "A3_Portrait")'),
      paperSize: z.string().optional().describe('Paper size override (e.g., "A4", "Letter")'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPageCreation(parsed.data);
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
 * Tool: list_drawing_pages
 *
 * List all TechDraw pages in the document.
 */
function listDrawingPagesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_drawing_pages',
    `List all TechDraw pages in the current document.

Parameters: None

Returns:
- success: Whether the query was successful
- pages: Array of page objects with name, label, template, viewCount
- pageCount: Number of pages found
- message: Status message

Use this tool when you need to see what drawing pages exist in the current document.

Example:
- List all pages: {}`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.techdraw_handlers import get_page_list
import json
result = get_page_list()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          let output = `TechDraw Pages: ${parsed.pageCount || 0}\n\n`;
          if (parsed.pages && parsed.pages.length > 0) {
            output += formatTableRow(['Name', 'Label', 'Template', 'Views']);
            output += '\n' + '─'.repeat(60) + '\n';
            for (const page of parsed.pages) {
              output += formatTableRow([
                page.name || '-',
                page.label || '-',
                page.template || '-',
                String(page.viewCount || 0)
              ]);
              output += '\n';
            }
          } else {
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
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${parsed.error}`,
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
 * Tool: delete_drawing_page
 *
 * Delete a TechDraw page.
 */
function deleteDrawingPageTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'delete_drawing_page',
    `Delete a TechDraw page from the document.

Parameters:
- pageName (required): Name of the page to delete

Returns:
- success: Whether the page was deleted
- pageName: Name of the deleted page
- message: Status message

Use this tool when you want to remove an unwanted drawing page.

Example:
- Delete a page: { pageName: "Page1" }`,
    {
      pageName: z.string().describe('Name of the page to delete'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Deleted TechDraw page: ${pageName}\n${parsed.message || ''}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${parsed.error}`,
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
 * Tool: get_drawing_page_properties
 *
 * Get properties of a TechDraw page.
 */
function getDrawingPagePropertiesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_drawing_page_properties',
    `Get detailed properties of a TechDraw page.

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
- Get page properties: { pageName: "Page1" }`,
    {
      pageName: z.string().describe('Name of the page to query'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPageCreation(parsed.data);
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
 * Tool: create_standard_view
 *
 * Create a standard projection view.
 */
function createStandardViewTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_standard_view',
    `Create a standard projection view of a source object on a TechDraw page.

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
- First-angle projection: { sourceObject: "Part", projectionType: "First" }`,
    {
      sourceObject: z.string().describe('Name of the 3D object to project'),
      pageName: z.string().optional().describe('Name of the page to add the view to'),
      viewName: z.string().optional().describe('Name for the view'),
      projectionType: z.enum(['Third', 'First']).optional().describe('Projection type (Third or First angle)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatViewCreation(parsed.data);
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
 * Tool: create_isometric_view
 *
 * Create an isometric (trimetric) view.
 */
function createIsometricViewTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_isometric_view',
    `Create an isometric (trimetric) view of a source object on a TechDraw page.

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
- Named isometric view: { sourceObject: "Part", viewName: "IsoView" }`,
    {
      sourceObject: z.string().describe('Name of the 3D object to project'),
      pageName: z.string().optional().describe('Name of the page to add the view to'),
      viewName: z.string().optional().describe('Name for the view'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatViewCreation(parsed.data);
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
 * Tool: create_front_view
 *
 * Create a front view.
 */
function createFrontViewTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_front_view',
    `Create a front view of a source object on a TechDraw page.

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
- Named front view: { sourceObject: "Part", viewName: "Front" }`,
    {
      sourceObject: z.string().describe('Name of the 3D object to project'),
      pageName: z.string().optional().describe('Name of the page to add the view to'),
      viewName: z.string().optional().describe('Name for the view'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatViewCreation(parsed.data);
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
 * Tool: create_top_view
 *
 * Create a top (plan) view.
 */
function createTopViewTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_top_view',
    `Create a top (plan) view of a source object on a TechDraw page.

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
- Named top view: { sourceObject: "Part", viewName: "Top" }`,
    {
      sourceObject: z.string().describe('Name of the 3D object to project'),
      pageName: z.string().optional().describe('Name of the page to add the view to'),
      viewName: z.string().optional().describe('Name for the view'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatViewCreation(parsed.data);
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
 * Tool: create_side_view
 *
 * Create a side view (left or right).
 */
function createSideViewTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_side_view',
    `Create a side view (left or right elevation) of a source object on a TechDraw page.

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
- Left side view: { sourceObject: "Part", side: "Left" }`,
    {
      sourceObject: z.string().describe('Name of the 3D object to project'),
      side: z.enum(['Left', 'Right']).describe('Side for the view (Left or Right)'),
      pageName: z.string().optional().describe('Name of the page to add the view to'),
      viewName: z.string().optional().describe('Name for the view'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatViewCreation(parsed.data);
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
 * Tool: create_section_view
 *
 * Create a section cut view.
 */
function createSectionViewTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_section_view',
    `Create a section cut view of a source object on a TechDraw page.

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
- Section through middle: { sourceObject: "Body", cutLine: {"point1": {"x": 0, "y": 50}, "point2": {"x": 100, "y": 50}}, pageName: "Page1" }`,
    {
      sourceObject: z.string().describe('Name of the 3D object to project'),
      cutLine: z.object({
        point1: z.object({ x: z.number(), y: z.number() }),
        point2: z.object({ x: z.number(), y: z.number() })
      }).describe('JSON object with point1 and point2 defining the cut line'),
      pageName: z.string().optional().describe('Name of the page to add the view to'),
      viewName: z.string().optional().describe('Name for the view'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatViewCreation(parsed.data);
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
 * Tool: create_projection_group
 *
 * Create a projection group with multiple views.
 */
function createProjectionGroupTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_projection_group',
    `Create a projection group containing multiple related views of a source object.

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
- Custom views: { sourceObject: "Part", views: ["Front", "Top", "LeftSide", "Isometric"] }`,
    {
      sourceObject: z.string().describe('Name of the 3D object to project'),
      views: z.array(z.string()).optional().describe('Array of view types to create'),
      pageName: z.string().optional().describe('Name of the page to add the views to'),
      groupName: z.string().optional().describe('Name for the projection group'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatViewCreation(parsed.data);
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
 * Tool: create_detail_view
 *
 * Create a detail (enlarged) view of a portion of a view.
 */
function createDetailViewTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_detail_view',
    `Create a detail (enlarged) view showing a zoomed portion of a source view.

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
- Detail of front view: { sourceView: "Front", center: {"x": 50, "y": 50}, scale: 2.0, pageName: "Page1" }`,
    {
      sourceView: z.string().describe('Name of the source view to detail'),
      center: z.object({ x: z.number(), y: z.number() }).describe('JSON object with x, y coordinates for detail center'),
      scale: z.number().optional().describe('Scale factor for magnification (default: 2.0)'),
      pageName: z.string().optional().describe('Name of the page containing the source view'),
      viewName: z.string().optional().describe('Name for the detail view'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatViewCreation(parsed.data);
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
 * Tool: create_linear_dimension
 *
 * Add a linear dimension to a TechDraw view.
 */
function createTechDrawLinearDimensionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_techdraw_linear_dimension',
    `Add a linear dimension to a TechDraw view.

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
- Horizontal dimension: { pageName: "Page1", viewName: "Front", startPoint: {"x": 0, "y": 0}, endPoint: {"x": 50, "y": 0}, direction: "Horizontal" }`,
    {
      pageName: z.string().describe('Name of the page containing the view'),
      viewName: z.string().describe('Name of the view to dimension'),
      startPoint: z.object({ x: z.number(), y: z.number() }).describe('JSON object with x, y coordinates for start point'),
      endPoint: z.object({ x: z.number(), y: z.number() }).describe('JSON object with x, y coordinates for end point'),
      direction: z.enum(['Horizontal', 'Vertical', 'Aligned']).optional().describe('Dimension direction'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatTechDrawDimension(parsed.data);
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
 * Tool: create_radial_dimension
 *
 * Add a radial (radius) dimension to a circle in a TechDraw view.
 */
function createTechDrawRadialDimensionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_techdraw_radial_dimension',
    `Add a radial (radius) dimension to a circle or arc in a TechDraw view.

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
- Radius dimension: { pageName: "Page1", viewName: "Top", circleName: "Circle1" }`,
    {
      pageName: z.string().describe('Name of the page containing the view'),
      viewName: z.string().describe('Name of the view containing the circle'),
      circleName: z.string().describe('Name of the circle object to dimension'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatTechDrawDimension(parsed.data);
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
 * Tool: create_diameter_dimension
 *
 * Add a diameter dimension to a circle in a TechDraw view.
 */
function createTechDrawDiameterDimensionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_diameter_dimension',
    `Add a diameter dimension to a circle or arc in a TechDraw view.

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
- Diameter dimension: { pageName: "Page1", viewName: "Top", circleName: "Circle1" }`,
    {
      pageName: z.string().describe('Name of the page containing the view'),
      viewName: z.string().describe('Name of the view containing the circle'),
      circleName: z.string().describe('Name of the circle object to dimension'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatTechDrawDimension(parsed.data);
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
 * Tool: create_angular_dimension
 *
 * Add an angular dimension between two lines in a TechDraw view.
 */
function createTechDrawAngularDimensionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_techdraw_angular_dimension',
    `Add an angular dimension between two lines in a TechDraw view.

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
- 90 degree angle: { pageName: "Page1", viewName: "Front", line1Name: "Line1", line2Name: "Line2" }`,
    {
      pageName: z.string().describe('Name of the page containing the view'),
      viewName: z.string().describe('Name of the view containing the lines'),
      line1Name: z.string().describe('Name of the first line object'),
      line2Name: z.string().describe('Name of the second line object'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatTechDrawDimension(parsed.data);
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
 * Tool: create_text_annotation
 *
 * Add a text annotation to a TechDraw page.
 */
function createTextAnnotationTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_text_annotation',
    `Add a text annotation to a TechDraw page.

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
- Simple annotation: { pageName: "Page1", text: "SCALE 1:1" }`,
    {
      pageName: z.string().describe('Name of the page to add the text to'),
      text: z.string().describe('The text string to display'),
      x: z.number().optional().describe('X coordinate for text position (default: 0)'),
      y: z.number().optional().describe('Y coordinate for text position (default: 0)'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatAnnotationCreation(parsed.data);
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
 * Tool: create_balloon_annotation
 *
 * Add a balloon annotation to a TechDraw view.
 */
function createBalloonAnnotationTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_balloon_annotation',
    `Add a balloon annotation (numbered callout) to a TechDraw view.

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
- Custom text: { pageName: "Page1", targetPoint: {"x": 50, "y": 50}, text: "A" }`,
    {
      pageName: z.string().describe('Name of the page containing the view'),
      viewName: z.string().optional().describe('Name of the view to add the balloon to'),
      targetPoint: z.object({ x: z.number(), y: z.number() }).describe('JSON object with x, y coordinates for balloon anchor'),
      text: z.string().optional().describe('Text to display in the balloon'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatAnnotationCreation(parsed.data);
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
 * Tool: create_leader_line
 *
 * Add a leader line with optional text to a TechDraw view.
 */
function createLeaderLineTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_leader_line',
    `Add a leader line with optional text annotation to a TechDraw view.

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
- With text: { pageName: "Page1", points: [[0, 0], [0, 50]], text: "MAX" }`,
    {
      pageName: z.string().describe('Name of the page containing the view'),
      viewName: z.string().optional().describe('Name of the view to add the leader to'),
      points: z.array(z.tuple([z.number(), z.number()])).describe('Array of [x, y] coordinates for leader path'),
      text: z.string().optional().describe('Text to display at the end of the leader'),
    },
    async (input) => {
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatAnnotationCreation(parsed.data);
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
 * Tool: export_to_svg
 *
 * Export a TechDraw page to SVG format.
 */
function exportToSvgTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'export_to_svg',
    `Export a TechDraw page to SVG (Scalable Vector Graphics) format.

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
- Export to SVG: { pageName: "Page1", outputPath: "C:/Drawings/part.svg" }`,
    {
      pageName: z.string().describe('Name of the page to export'),
      outputPath: z.string().describe('Full path for the output SVG file'),
    },
    async (input) => {
      const { pageName, outputPath } = input;

      // Validate file path
      const validation = validateFilePath(outputPath);
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatExportResult(parsed.data);
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
 * Tool: export_to_pdf
 *
 * Export a TechDraw page to PDF format.
 */
function exportToPdfTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'export_to_pdf',
    `Export a TechDraw page to PDF (Portable Document Format) format.

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
- Export to PDF: { pageName: "Page1", outputPath: "C:/Drawings/part.pdf" }`,
    {
      pageName: z.string().describe('Name of the page to export'),
      outputPath: z.string().describe('Full path for the output PDF file'),
    },
    async (input) => {
      const { pageName, outputPath } = input;

      // Validate file path
      const validation = validateFilePath(outputPath);
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
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatExportResult(parsed.data);
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
// Surface Modeling Tools
// ============================================================================

/**
 * Tool: create_loft
 *
 * Create a loft surface between two or more profile sketches.
 */
function createLoftTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_loft',
    `Create a loft surface between two or more profile sketches.

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
- Closed loft: { profiles: ["Profile1", "Profile2", "Profile3"], closed: true }`,
    {
      profiles: z.array(z.string()).describe('Array of object names to loft between'),
      solid: z.boolean().optional().default(true).describe('Create solid (true) or surface (false)'),
      closed: z.boolean().optional().default(false).describe('Close the loft back to first profile'),
      name: z.string().optional().describe('Name for the loft'),
    },
    async (input) => {
      const { profiles, solid, closed, name } = input;

      const code = `
from llm_bridge.surface_handlers import handle_create_loft
import json
params = json.loads('${JSON.stringify({ profiles, solid, closed, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_loft(
    profiles=params['profiles'],
    solid=params.get('solid', True),
    closed=params.get('closed', False),
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatLoftCreation(parsed.data);
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
 * Tool: create_section_loft
 *
 * Create a section loft (sweep along a path with multiple section profiles).
 */
function createSectionLoftTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_section_loft',
    `Create a section loft - sweep multiple profiles along a path.

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
- Section loft along path: { profiles: ["Circle1", "Square", "Circle2"], path: "PathWire", solid: true }`,
    {
      profiles: z.array(z.string()).describe('Array of section profile objects'),
      path: z.string().describe('Path object to sweep along'),
      solid: z.boolean().optional().default(true).describe('Create solid (true) or surface (false)'),
      name: z.string().optional().describe('Name for the section loft'),
    },
    async (input) => {
      const { profiles, path, solid, name } = input;

      const code = `
from llm_bridge.surface_handlers import handle_create_section_loft
import json
params = json.loads('${JSON.stringify({ profiles, path, solid, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_section_loft(
    profiles=params['profiles'],
    path=params['path'],
    solid=params.get('solid', True),
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatLoftCreation(parsed.data);
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
 * Tool: create_sweep
 *
 * Sweep a profile along a path to create a surface or solid.
 */
function createSweepTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_sweep',
    `Sweep a profile (sketch or wire) along a path to create a surface or solid.

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
- Surface sweep: { profile: "LineSketch", path: "Curve", solid: false }`,
    {
      profile: z.string().describe('Profile object to sweep'),
      path: z.string().describe('Path object to sweep along'),
      solid: z.boolean().optional().default(true).describe('Create solid (true) or surface (false)'),
      frenet: z.boolean().optional().default(true).describe('Use Frenet frame calculation'),
      name: z.string().optional().describe('Name for the sweep'),
    },
    async (input) => {
      const { profile, path, solid, frenet, name } = input;

      const code = `
from llm_bridge.surface_handlers import handle_create_sweep
import json
params = json.loads('${JSON.stringify({ profile, path, solid, frenet, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_sweep(
    profile=params['profile'],
    path=params['path'],
    solid=params.get('solid', True),
    frenet=params.get('frenet', True),
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSweepCreation(parsed.data);
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
 * Tool: create_pipe
 *
 * Create a pipe surface using the Part::Pipe feature.
 */
function createPipeTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_pipe',
    `Create a pipe surface - similar to sweep but with different fillet handling.

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
- Solid pipe: { profile: "Circle", path: "SpiralPath", solid: true }`,
    {
      profile: z.string().describe('Profile object to sweep'),
      path: z.string().describe('Path object to sweep along'),
      solid: z.boolean().optional().default(true).describe('Create solid (true) or surface (false)'),
      name: z.string().optional().describe('Name for the pipe'),
    },
    async (input) => {
      const { profile, path, solid, name } = input;

      const code = `
from llm_bridge.surface_handlers import handle_create_pipe
import json
params = json.loads('${JSON.stringify({ profile, path, solid, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_pipe(
    profile=params['profile'],
    path=params['path'],
    solid=params.get('solid', True),
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSweepCreation(parsed.data);
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
 * Tool: create_multisweep
 *
 * Create a multi-section sweep with multiple profiles at different positions.
 */
function createMultiSweepTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_multisweep',
    `Create a multi-section sweep - sweep multiple profile sections along a path.

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
- Multi-section sweep: { profiles: ["Circle", "Square", "Hexagon"], path: "PathWire" }`,
    {
      profiles: z.array(z.string()).describe('Array of profile objects along the path'),
      path: z.string().describe('Path object to sweep along'),
      solid: z.boolean().optional().default(true).describe('Create solid (true) or surface (false)'),
      name: z.string().optional().describe('Name for the multi-sweep'),
    },
    async (input) => {
      const { profiles, path, solid, name } = input;

      const code = `
from llm_bridge.surface_handlers import handle_create_multisweep
import json
params = json.loads('${JSON.stringify({ profiles, path, solid, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_multisweep(
    profiles=params['profiles'],
    path=params['path'],
    solid=params.get('solid', True),
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSweepCreation(parsed.data);
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
 * Tool: create_ruled_surface
 *
 * Create a ruled surface between two curves or edges.
 */
function createRuledSurfaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_ruled_surface',
    `Create a ruled surface between two curves, edges, or wires.

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
- Between two sketches: { curve1: "Sketch001", curve2: "Sketch002" }`,
    {
      curve1: z.string().describe('First curve, edge, or wire'),
      curve2: z.string().describe('Second curve, edge, or wire'),
      name: z.string().optional().describe('Name for the ruled surface'),
    },
    async (input) => {
      const { curve1, curve2, name } = input;

      const code = `
from llm_bridge.surface_handlers import handle_create_ruled_surface
import json
params = json.loads('${JSON.stringify({ curve1, curve2, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_ruled_surface(
    curve1=params['curve1'],
    curve2=params['curve2'],
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSurfaceOperation(parsed.data);
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
 * Tool: create_surface_from_edges
 *
 * Create a surface by filling a set of edges or wires.
 */
function createSurfaceFromEdgesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_surface_from_edges',
    `Create a surface by filling a set of connected edges or wires.

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
- Fill with wire: { edges: ["Wire1"] }`,
    {
      edges: z.array(z.string()).describe('Array of edge or wire objects forming closed boundary'),
      name: z.string().optional().describe('Name for the surface'),
    },
    async (input) => {
      const { edges, name } = input;

      const code = `
from llm_bridge.surface_handlers import handle_create_surface_from_edges
import json
params = json.loads('${JSON.stringify({ edges, name: name || null }).replace(/'/g, "\\'")}')
result = handle_create_surface_from_edges(
    edges=params['edges'],
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSurfaceOperation(parsed.data);
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
 * Tool: extend_surface
 *
 * Extend an existing surface by adding material along its edges.
 */
function extendSurfaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'extend_surface',
    `Extend an existing surface by adding material along its boundary edges.

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
- Extend along edge: { surfaceName: "Surface001", distance: "5mm", direction: "edge" }`,
    {
      surfaceName: z.string().describe('Name of the surface to extend'),
      distance: z.union([z.string(), z.number()]).describe('Distance to extend (number or string with units)'),
      direction: z.enum(['edge', 'normal']).optional().default('normal').describe('Extension direction'),
      name: z.string().optional().describe('Name for the extended surface'),
    },
    async (input) => {
      const { surfaceName, distance, direction, name } = input;

      const code = `
from llm_bridge.surface_handlers import handle_extend_surface
import json
params = json.loads('${JSON.stringify({ surfaceName, distance, direction, name: name || null }).replace(/'/g, "\\'")}')
result = handle_extend_surface(
    surface_name=params['surfaceName'],
    distance=params['distance'],
    direction=params.get('direction', 'normal'),
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSurfaceOperation(parsed.data);
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
 * Tool: trim_surface
 *
 * Trim a surface using trimming tools.
 */
function trimSurfaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'trim_surface',
    `Trim a surface using a tool surface or a set of trimming curves.

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
- Trim with curves: { surfaceName: "Surface001", tool: ["Curve1", "Curve2"] }`,
    {
      surfaceName: z.string().describe('Name of the surface to trim'),
      tool: z.union([z.string(), z.array(z.string())]).describe('Tool surface or array of trimming curves'),
      name: z.string().optional().describe('Name for the trimmed surface'),
    },
    async (input) => {
      const { surfaceName, tool, name } = input;

      const code = `
from llm_bridge.surface_handlers import handle_trim_surface
import json
params = json.loads('${JSON.stringify({ surfaceName, tool, name: name || null }).replace(/'/g, "\\'")}')
result = handle_trim_surface(
    surface_name=params['surfaceName'],
    tool=params['tool'],
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSurfaceOperation(parsed.data);
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
 * Tool: get_surface_info
 *
 * Get detailed information about a surface.
 */
function getSurfaceInfoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_surface_info',
    `Get detailed information about a surface including its properties and geometry.

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
- Get surface info: { surfaceName: "Loft001" }`,
    {
      surfaceName: z.string().describe('Name of the surface to query'),
    },
    async (input) => {
      const { surfaceName } = input;

      const code = `
from llm_bridge.surface_handlers import handle_get_surface_info
import json
params = json.loads('${JSON.stringify({ surfaceName }).replace(/'/g, "\\'")}')
result = handle_get_surface_info(surface_name=params['surfaceName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSurfaceInfo(parsed.data);
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
 * Tool: create_blend_surface
 *
 * Create a blend surface between two surfaces with continuity.
 */
function createBlendSurfaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_blend_surface',
    `Create a blend surface between two surfaces with continuity.

Parameters:
- surface1 (required): First surface object name
- surface2 (required): Second surface object name
- continuity (optional): Continuity type - "G0" (position), "G1" (tangent), "G2" (curvature). Default: "G1"

Returns:
- success: Whether the blend surface was created
- featureName: Internal name of the blend surface
- featureLabel: User-friendly label
- sourceSurface1: First source surface
- sourceSurface2: Second source surface
- continuity: Continuity type used
- message: Status message

Use this tool to create smooth transition surfaces between two adjacent surfaces with specified continuity.

Example:
- Blend with tangent continuity: { surface1: "Surface001", surface2: "Surface002", continuity: "G1" }
- Blend with curvature continuity: { surface1: "Surface001", surface2: "Surface002", continuity: "G2" }`,
    {
      surface1: z.string().describe('First surface object name'),
      surface2: z.string().describe('Second surface object name'),
      continuity: z.enum(['G0', 'G1', 'G2']).optional().default('G1').describe('Continuity type'),
    },
    async (input) => {
      const { surface1, surface2, continuity } = input;

      const code = `
from llm_bridge.surface_handlers import handle_create_blend_surface
import json
params = json.loads('${JSON.stringify({ surface1, surface2, continuity }).replace(/'/g, "\\'")}')
result = handle_create_blend_surface(
    surface1=params['surface1'],
    surface2=params['surface2'],
    continuity=params.get('continuity', 'G1')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatBlendSurface(parsed.data);
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
 * Tool: create_offset_surface
 *
 * Create a parallel surface at specified offset distance.
 */
function createOffsetSurfaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_offset_surface',
    `Create a parallel surface at a specified offset distance.

Parameters:
- surfaceName (required): Name of the source surface object
- distance (required): Offset distance (positive = outward, negative = inward)

Returns:
- success: Whether the offset surface was created
- featureName: Internal name of the offset surface
- featureLabel: User-friendly label
- sourceSurface: Name of the source surface
- distance: Offset distance applied
- message: Status message

Use this tool to create a parallel copy of a surface at a specified distance. Common for creating offset surfaces for mold design, wall thickness analysis, or clearance checking.

Example:
- Offset outward by 5mm: { surfaceName: "Surface001", distance: 5 }
- Offset inward by 2mm: { surfaceName: "Surface001", distance: -2 }`,
    {
      surfaceName: z.string().describe('Name of the source surface'),
      distance: z.number().describe('Offset distance (positive = outward, negative = inward)'),
    },
    async (input) => {
      const { surfaceName, distance } = input;

      const code = `
from llm_bridge.surface_handlers import handle_create_offset_surface
import json
params = json.loads('${JSON.stringify({ surfaceName, distance }).replace(/'/g, "\\'")}')
result = handle_create_offset_surface(
    surface_name=params['surfaceName'],
    distance=params['distance']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatOffsetSurface(parsed.data);
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
 * Tool: analyze_surface
 *
 * Analyze surface curvature and geometric properties.
 */
function analyzeSurfaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'analyze_surface',
    `Analyze surface curvature and geometric properties.

Parameters:
- surfaceName (required): Name of the surface object to analyze

Returns:
- success: Whether the analysis completed
- surfaceName: Name of the analyzed surface
- surfaceType: Type of surface
- area: Surface area in mm²
- facesCount: Number of faces
- edgesCount: Number of edges
- boundingBox: Bounding box coordinates
- curvatureStatistics: Curvature analysis (Gaussian, mean, principal)
- curvatureSampleCount: Number of curvature samples taken
- message: Status message

Use this tool to analyze surface quality including curvature statistics. Returns Gaussian curvature, mean curvature, and principal curvatures at sample points.

Example:
- Analyze surface curvature: { surfaceName: "Surface001" }`,
    {
      surfaceName: z.string().describe('Name of the surface to analyze'),
    },
    async (input) => {
      const { surfaceName } = input;

      const code = `
from llm_bridge.surface_handlers import handle_analyze_surface
import json
params = json.loads('${JSON.stringify({ surfaceName }).replace(/'/g, "\\'")}')
result = handle_analyze_surface(surface_name=params['surfaceName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSurfaceAnalysis(parsed.data);
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
 * Tool: rebuild_surface
 *
 * Rebuild a surface with specified tolerance.
 */
function rebuildSurfaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'rebuild_surface',
    `Rebuild a surface with optional tolerance.

Parameters:
- surfaceName (required): Name of the surface object to rebuild
- tolerance (optional): Tolerance value for rebuilding

Returns:
- success: Whether the rebuild completed
- originalSurface: Name of the original surface
- rebuiltSurface: Name of the rebuilt surface
- rebuiltLabel: User-friendly label
- tolerance: Tolerance value used
- isValid: Whether the rebuilt surface is valid
- message: Status message

Use this tool to rebuild a surface with improved geometry. The tolerance parameter controls the precision of the reconstruction.

Example:
- Rebuild with default tolerance: { surfaceName: "Surface001" }
- Rebuild with specific tolerance: { surfaceName: "Surface001", tolerance: 0.01 }`,
    {
      surfaceName: z.string().describe('Name of the surface to rebuild'),
      tolerance: z.number().optional().describe('Optional tolerance value'),
    },
    async (input) => {
      const { surfaceName, tolerance } = input;

      const code = `
from llm_bridge.surface_handlers import handle_rebuild_surface
import json
params = json.loads('${JSON.stringify({ surfaceName, tolerance: tolerance || null }).replace(/'/g, "\\'")}')
result = handle_rebuild_surface(
    surface_name=params['surfaceName'],
    tolerance=params.get('tolerance')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSurfaceRebuild(parsed.data);
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
 * Tool: get_loft_info
 *
 * Get detailed information about a loft feature.
 */
function getLoftInfoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_loft_info',
    `Get detailed information about a loft feature.

Parameters:
- loftName (required): Name of the loft object to query

Returns:
- success: Whether the query was successful
- loftName: Internal name of the loft
- loftLabel: User-friendly label
- loftType: Type of loft feature
- isValid: Whether the loft is valid
- solid: Whether the loft is a solid
- closed: Whether the loft is closed
- profileCount: Number of profile sections
- facesCount: Number of faces in the loft
- edgesCount: Number of edges
- area: Surface area if available
- boundingBox: Bounding box coordinates
- transitionMode: Transition mode if available
- message: Status message

Use this tool to inspect loft parameters and statistics before modifying or duplicating.

Example:
- Get loft info: { loftName: "Loft001" }`,
    {
      loftName: z.string().describe('Name of the loft to query'),
    },
    async (input) => {
      const { loftName } = input;

      const code = `
from llm_bridge.surface_handlers import handle_get_loft_info
import json
params = json.loads('${JSON.stringify({ loftName }).replace(/'/g, "\\'")}')
result = handle_get_loft_info(loft_name=params['loftName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatLoftInfo(parsed.data);
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
 * Tool: get_sweep_info
 *
 * Get detailed information about a sweep feature.
 */
function getSweepInfoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_sweep_info',
    `Get detailed information about a sweep feature.

Parameters:
- sweepName (required): Name of the sweep object to query

Returns:
- success: Whether the query was successful
- sweepName: Internal name of the sweep
- sweepLabel: User-friendly label
- sweepType: Type of sweep feature
- isValid: Whether the sweep is valid
- solid: Whether the sweep is a solid
- frenet: Whether Frenet frame was used
- profileCount: Number of profile sections
- facesCount: Number of faces in the sweep
- edgesCount: Number of edges
- area: Surface area if available
- boundingBox: Bounding box coordinates
- message: Status message

Use this tool to inspect sweep parameters and statistics before modifying or duplicating.

Example:
- Get sweep info: { sweepName: "Sweep001" }`,
    {
      sweepName: z.string().describe('Name of the sweep to query'),
    },
    async (input) => {
      const { sweepName } = input;

      const code = `
from llm_bridge.surface_handlers import handle_get_sweep_info
import json
params = json.loads('${JSON.stringify({ sweepName }).replace(/'/g, "\\'")}')
result = handle_get_sweep_info(sweep_name=params['sweepName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSweepInfo(parsed.data);
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
 * Tool: initialize_kinematic_solver
 *
 * Initialize the kinematic solver for an assembly.
 */
function initializeKinematicSolverTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'initialize_kinematic_solver',
    `Initialize the kinematic solver for an assembly.

Parameters:
- assemblyName (required): Name of the assembly object

Returns:
- success: Whether the solver was initialized
- assemblyName: Name of the assembly
- dofCount: Number of degrees of freedom
- jointCount: Number of joints in the assembly
- message: Status message

Use this tool to setup the kinematic solver before performing analysis or animation.

Example:
- Initialize solver: { assemblyName: "MainAssembly" }`,
    {
      assemblyName: z.string().describe('Name of the assembly to initialize solver for'),
    },
    async (input) => {
      const { assemblyName } = input;

      const code = `
from llm_bridge.kinematic_handlers import handle_initialize_solver
import json
params = json.loads('${JSON.stringify({ assemblyName })}')
result = handle_initialize_solver(assembly_name=params['assemblyName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSolverInit(parsed.data);
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
 * Tool: solve_assembly
 *
 * Solve the kinematic positions for an assembly.
 */
function solveAssemblyTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'solve_assembly',
    `Solve the kinematic positions for an assembly.

Parameters:
- assemblyName (required): Name of the assembly object
- maxIterations (optional): Maximum solver iterations (default 100)

Returns:
- success: Whether solving succeeded
- assemblyName: Name of the assembly
- iterations: Number of iterations used
- converged: Whether the solver converged
- positions: Array of joint positions
- message: Status message

Use this tool to calculate the positions of all joints based on constraints.

Example:
- Solve assembly: { assemblyName: "MainAssembly" }
- Solve with more iterations: { assemblyName: "MainAssembly", maxIterations: 200 }`,
    {
      assemblyName: z.string().describe('Name of the assembly to solve'),
      maxIterations: z.number().optional().describe('Maximum solver iterations (default 100)'),
    },
    async (input) => {
      const { assemblyName, maxIterations } = input;

      const code = `
from llm_bridge.kinematic_handlers import handle_solve_assembly
import json
params = json.loads('${JSON.stringify({ assemblyName, maxIterations })}')
result = handle_solve_assembly(assembly_name=params['assemblyName'], max_iterations=params.get('maxIterations', 100))
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSolveResult(parsed.data);
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
 * Tool: check_degrees_of_freedom
 *
 * Perform degrees of freedom analysis on an assembly.
 */
function checkDegreesOfFreedomTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'check_degrees_of_freedom',
    `Perform degrees of freedom (DOF) analysis on an assembly.

Parameters:
- assemblyName (required): Name of the assembly object

Returns:
- success: Whether the analysis succeeded
- assemblyName: Name of the assembly
- totalDof: Total degrees of freedom
- constrainedDof: Constrained degrees of freedom
- freeDof: Free degrees of freedom
- message: Status message

Use this tool to understand how many independent motions are possible in the assembly.

Example:
- Check DOF: { assemblyName: "MainAssembly" }`,
    {
      assemblyName: z.string().describe('Name of the assembly to analyze'),
    },
    async (input) => {
      const { assemblyName } = input;

      const code = `
from llm_bridge.kinematic_handlers import handle_check_dof
import json
params = json.loads('${JSON.stringify({ assemblyName })}')
result = handle_check_dof(assembly_name=params['assemblyName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatDOFResult(parsed.data);
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
 * Tool: set_joint_value
 *
 * Set the value of a joint/driver.
 */
function setJointValueTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_joint_value',
    `Set the value of a joint or driver.

Parameters:
- jointName (required): Name of the joint or driver
- value (required): Target value (degrees for angular, mm for linear)

Returns:
- success: Whether setting the value succeeded
- jointName: Name of the joint
- value: The new value
- message: Status message

Use this tool to directly set a joint to a specific position.

Example:
- Rotate hinge: { jointName: "HingeJoint", value: 45 }
- Move slider: { jointName: "SliderJoint", value: 20 }`,
    {
      jointName: z.string().describe('Name of the joint or driver'),
      value: z.number().describe('Target value (degrees for angular, mm for linear)'),
    },
    async (input) => {
      const { jointName, value } = input;

      const code = `
from llm_bridge.kinematic_handlers import handle_set_joint_value
import json
params = json.loads('${JSON.stringify({ jointName, value })}')
result = handle_set_joint_value(joint_name=params['jointName'], value=params['value'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatJointValue(parsed.data);
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
 * Tool: get_joint_value
 *
 * Get the current value of a joint/driver.
 */
function getJointValueTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_joint_value',
    `Get the current value of a joint or driver.

Parameters:
- jointName (required): Name of the joint or driver

Returns:
- success: Whether getting the value succeeded
- jointName: Name of the joint
- value: Current value
- unit: Unit of the value (deg or mm)
- message: Status message

Use this tool to query the current position of a joint.

Example:
- Get hinge position: { jointName: "HingeJoint" }`,
    {
      jointName: z.string().describe('Name of the joint or driver'),
    },
    async (input) => {
      const { jointName } = input;

      const code = `
from llm_bridge.kinematic_handlers import handle_get_joint_value
import json
params = json.loads('${JSON.stringify({ jointName })}')
result = handle_get_joint_value(joint_name=params['jointName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatJointValue(parsed.data);
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
 * Tool: get_joint_limits
 *
 * Get the limits of a joint.
 */
function getJointLimitsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_joint_limits',
    `Get the limits (range of motion) of a joint.

Parameters:
- jointName (required): Name of the joint or driver

Returns:
- success: Whether getting limits succeeded
- jointName: Name of the joint
- minValue: Minimum value
- maxValue: Maximum value
- unit: Unit of the values (deg or mm)
- hasLimits: Whether the joint has limits
- message: Status message

Use this tool to determine the range of motion for a joint.

Example:
- Get joint limits: { jointName: "HingeJoint" }`,
    {
      jointName: z.string().describe('Name of the joint or driver'),
    },
    async (input) => {
      const { jointName } = input;

      const code = `
from llm_bridge.kinematic_handlers import handle_get_joint_limits
import json
params = json.loads('${JSON.stringify({ jointName })}')
result = handle_get_joint_limits(joint_name=params['jointName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatJointLimits(parsed.data);
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
 * Tool: drive_joint
 *
 * Create a joint animation drive sequence.
 */
function driveJointTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'drive_joint',
    `Create a joint animation drive sequence.

Parameters:
- jointName (required): Name of the joint or driver
- startValue (required): Starting value
- endValue (required): Ending value
- duration (required): Duration in seconds
- motionType (optional): Motion curve type - "linear", "ease_in_out", or "sine" (default "linear")

Returns:
- success: Whether creating the drive succeeded
- jointName: Name of the joint
- startValue: Starting value
- endValue: Ending value
- duration: Duration in seconds
- motionType: Type of motion curve
- frames: Number of frames in the animation
- message: Status message

Use this tool to create an animation sequence for a single joint.

Example:
- Open hinge over 2 seconds: { jointName: "HingeJoint", startValue: 0, endValue: 90, duration: 2 }
- Smooth slider motion: { jointName: "SliderJoint", startValue: 0, endValue: 50, duration: 3, motionType: "ease_in_out" }`,
    {
      jointName: z.string().describe('Name of the joint or driver'),
      startValue: z.number().describe('Starting value'),
      endValue: z.number().describe('Ending value'),
      duration: z.number().describe('Duration in seconds'),
      motionType: z.enum(['linear', 'ease_in_out', 'sine']).optional().describe('Motion curve type'),
    },
    async (input) => {
      const { jointName, startValue, endValue, duration, motionType } = input;

      const code = `
from llm_bridge.kinematic_handlers import handle_add_drive
import json
params = json.loads('${JSON.stringify({ jointName, startValue, endValue, duration, motionType: motionType || 'linear' })}')
result = handle_add_drive(joint_name=params['jointName'], start_value=params['startValue'], end_value=params['endValue'], duration=params['duration'], motion_type=params['motionType'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatDriveResult(parsed.data);
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
 * Tool: animate_assembly
 *
 * Run a full assembly animation.
 */
function animateAssemblyTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'animate_assembly',
    `Run a full assembly animation.

Parameters:
- assemblyName (required): Name of the assembly object
- duration (required): Animation duration in seconds
- frameRate (optional): Frames per second (default 30)

Returns:
- success: Whether starting the animation succeeded
- assemblyName: Name of the assembly
- duration: Animation duration in seconds
- frameRate: Frames per second
- totalFrames: Total number of frames
- message: Status message

Use this tool to run the full animation with all joint drives.

Example:
- Animate for 5 seconds: { assemblyName: "MainAssembly", duration: 5 }
- Higher frame rate: { assemblyName: "MainAssembly", duration: 10, frameRate: 60 }`,
    {
      assemblyName: z.string().describe('Name of the assembly to animate'),
      duration: z.number().describe('Animation duration in seconds'),
      frameRate: z.number().optional().describe('Frames per second (default 30)'),
    },
    async (input) => {
      const { assemblyName, duration, frameRate } = input;

      const code = `
from llm_bridge.kinematic_handlers import handle_animate_assembly
import json
params = json.loads('${JSON.stringify({ assemblyName, duration, frameRate: frameRate || 30 })}')
result = handle_animate_assembly(assembly_name=params['assemblyName'], duration=params['duration'], frame_rate=params['frameRate'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatAnimationResult(parsed.data);
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
 * Tool: stop_animation
 *
 * Stop the currently running animation.
 */
function stopAnimationTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'stop_animation',
    `Stop the currently running animation.

Parameters: None

Returns:
- success: Whether stopping succeeded
- message: Status message

Use this tool to stop a running animation.

Example:
- Stop animation: {}`,
    {},
    async () => {
      const code = `
from llm_bridge.kinematic_handlers import handle_stop_animation
import json
result = handle_stop_animation()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? parsed.message : `Error: ${parsed.error}`,
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
 * Tool: get_animation_state
 *
 * Get the current animation state.
 */
function getAnimationStateTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_animation_state',
    `Get the current animation state.

Parameters: None

Returns:
- success: Whether getting state succeeded
- isPlaying: Whether animation is playing
- currentFrame: Current frame number
- totalFrames: Total number of frames
- duration: Total duration in seconds
- message: Status message

Use this tool to check the status of a running or completed animation.

Example:
- Get state: {}`,
    {},
    async () => {
      const code = `
from llm_bridge.kinematic_handlers import handle_get_animation_state
import json
result = handle_get_animation_state()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatAnimationState(parsed.data);
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
 * Tool: get_kinematic_positions
 *
 * Get all joint positions after solving.
 */
function getKinematicPositionsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_kinematic_positions',
    `Get all joint positions after solving.

Parameters:
- assemblyName (required): Name of the assembly object

Returns:
- success: Whether getting positions succeeded
- assemblyName: Name of the assembly
- positions: Array of {joint, value, unit}
- message: Status message

Use this tool to retrieve the current configuration of all joints in the assembly.

Example:
- Get positions: { assemblyName: "MainAssembly" }`,
    {
      assemblyName: z.string().describe('Name of the assembly'),
    },
    async (input) => {
      const { assemblyName } = input;

      const code = `
from llm_bridge.kinematic_handlers import handle_get_kinematic_positions
import json
params = json.loads('${JSON.stringify({ assemblyName })}')
result = handle_get_kinematic_positions(assembly_name=params['assemblyName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatKinematicPositions(parsed.data);
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
 * Tool: check_collision
 *
 * Check for collisions during motion.
 */
function checkCollisionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'check_collision',
    `Check for collisions during motion.

Parameters:
- assemblyName (required): Name of the assembly object
- duringMotion (optional): Whether to check during animation (default false)

Returns:
- success: Whether the check succeeded
- assemblyName: Name of the assembly
- hasCollision: Whether collisions were detected
- collisionPairs: Array of colliding object pairs
- message: Status message

Use this tool to detect interference between parts during motion.

Example:
- Check for collisions: { assemblyName: "MainAssembly" }
- Check during motion: { assemblyName: "MainAssembly", duringMotion: true }`,
    {
      assemblyName: z.string().describe('Name of the assembly to check'),
      duringMotion: z.boolean().optional().describe('Whether to check during animation'),
    },
    async (input) => {
      const { assemblyName, duringMotion } = input;

      const code = `
from llm_bridge.kinematic_handlers import handle_check_collision
import json
params = json.loads('${JSON.stringify({ assemblyName, duringMotion: duringMotion || false })}')
result = handle_check_collision(assembly_name=params['assemblyName'], during_motion=params['duringMotion'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatCollisionResult(parsed.data);
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
 * Tool: list_surfaces
 *
 * List all surface objects in the active document.
 */
function listSurfacesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_surfaces',
    `List all surface objects in the active FreeCAD document.

Returns:
- success: Whether the query was successful
- surfaceCount: Number of surfaces found
- surfaces: Array of surface objects with name, type, and properties
- message: Status message

Use this tool to see all available surfaces before querying or modifying them.

Example:
- List all surfaces: {}`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.surface_handlers import handle_list_surfaces
import json
result = handle_list_surfaces()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

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
    `Validate surface geometry for defects, gaps, or irregularities.

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
- Validate surface: { surfaceName: "Loft001" }`,
    {
      surfaceName: z.string().describe('Name of the surface to validate'),
    },
    async (input) => {
      const { surfaceName } = input;

      const code = `
from llm_bridge.surface_handlers import handle_validate_surface
import json
params = json.loads('${JSON.stringify({ surfaceName }).replace(/'/g, "\\'")}')
result = handle_validate_surface(surface_name=params['surfaceName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSurfaceInfo(parsed.data);
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
 * Tool: set_view_angle
 *
 * Set viewport camera to a preset angle.
 */
function setViewAngleTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_view_angle',
    `Set viewport camera to a preset viewing angle.

Parameters:
- viewName (required): Preset view name - "top", "bottom", "front", "back", "left", "right", "iso", "home"

Returns:
- success: Whether setting view succeeded
- viewName: The view that was set
- message: Status message

Use this tool to quickly orient the camera to standard CAD views.

Example:
- Set view to isometric: { viewName: "iso" }
- Look from top: { viewName: "top" }`,
    {
      viewName: z.enum(['top', 'bottom', 'front', 'back', 'left', 'right', 'iso', 'home']).describe('Preset view angle'),
    },
    async (input) => {
      const { viewName } = input;

      const code = `
from llm_bridge.render_handlers import handle_set_view_angle
import json
params = json.loads('${JSON.stringify({ viewName })}')
result = handle_set_view_angle(view_name=params['viewName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatViewAngle(parsed.data);
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
 * Tool: zoom_to_fit
 *
 * Zoom to fit all visible objects in the viewport.
 */
function zoomToFitTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'zoom_to_fit',
    `Zoom the viewport to fit all visible objects in view.

Parameters: None

Returns:
- success: Whether zoom succeeded
- message: Status message

Use this tool to automatically adjust the camera to show all objects in the current view.

Example:
- "Zoom to fit all objects"`,
    {},
    async () => {
      const code = `
from llm_bridge.render_handlers import handle_zoom_to_fit
import json
result = handle_zoom_to_fit()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatViewAngle(parsed.data);
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
 * Tool: set_camera_position
 *
 * Set exact camera position and target.
 */
function setCameraPositionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_camera_position',
    `Set exact camera position and look-at target.

Parameters:
- position (required): Camera position as {x, y, z}
- target (optional): Look-at target as {x, y, z}, defaults to origin

Returns:
- success: Whether setting position succeeded
- position: Camera position that was set
- target: Look-at target that was set
- message: Status message

Use this tool for precise camera positioning.

Example:
- Position at specific point: { position: {x: 100, y: 100, z: 50} }
- View from angle: { position: {x: 50, y: 50, z: 50}, target: {x: 0, y: 0, z: 0} }`,
    {
      position: z.object({
        x: z.number().describe('X coordinate'),
        y: z.number().describe('Y coordinate'),
        z: z.number().describe('Z coordinate'),
      }).describe('Camera position'),
      target: z.object({
        x: z.number().describe('X coordinate'),
        y: z.number().describe('Y coordinate'),
        z: z.number().describe('Z coordinate'),
      }).optional().describe('Look-at target position'),
    },
    async (input) => {
      const { position, target } = input;

      const code = `
from llm_bridge.render_handlers import handle_set_camera_position
import json
params = json.loads('${JSON.stringify({ position, target: target || { x: 0, y: 0, z: 0 } })}')
result = handle_set_camera_position(position=params['position'], target=params['target'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatViewAngle(parsed.data);
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
 * Tool: render_view
 *
 * Render current view to an image file.
 */
function renderViewTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'render_view',
    `Render the current viewport view to an image file.

Parameters:
- outputPath (required): Path to output image file (.png, .jpg)
- width (optional): Image width in pixels, default 1920
- height (optional): Image height in pixels, default 1080
- renderer (optional): Renderer to use - "opengl" (default), "raytracing", "embree"

Returns:
- success: Whether render succeeded
- outputPath: Path to the rendered image
- width: Image width
- height: Image height
- message: Status message

Example:
- Basic render: { outputPath: "~/render.png" }
- High resolution: { outputPath: "~/4k_render.png", width: 3840, height: 2160 }
- Raytraced: { outputPath: "~/rt_render.png", renderer: "raytracing" }`,
    {
      outputPath: z.string().describe('Path to output image file'),
      width: z.number().optional().describe('Image width in pixels (default 1920)'),
      height: z.number().optional().describe('Image height in pixels (default 1080)'),
      renderer: z.enum(['opengl', 'raytracing', 'embree']).optional().describe('Renderer to use'),
    },
    async (input) => {
      const { outputPath, width, height, renderer } = input;

      const code = `
from llm_bridge.render_handlers import handle_render_view
import json
params = json.loads('${JSON.stringify({ outputPath, width: width || 1920, height: height || 1080, renderer: renderer || 'opengl' })}')
result = handle_render_view(image_path=params['outputPath'], width=params['width'], height=params['height'], renderer=params['renderer'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatRenderResult(parsed.data);
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
 * Tool: set_renderer
 *
 * Select the rendering engine.
 */
function setRendererTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_renderer',
    `Select the rendering engine for viewport and exports.

Parameters:
- rendererName (required): Renderer name - "opengl", "raytracing", "embree"

Returns:
- success: Whether renderer change succeeded
- rendererName: The renderer that was set
- message: Status message

Use this tool to switch between different renderers. OpenGL is fastest for viewport, Raytracing provides photorealistic results.

Example:
- Use raytracing: { rendererName: "raytracing" }
- Fast viewport render: { rendererName: "opengl" }`,
    {
      rendererName: z.enum(['opengl', 'raytracing', 'embree']).describe('Renderer name'),
    },
    async (input) => {
      const { rendererName } = input;

      const code = `
from llm_bridge.render_handlers import handle_set_renderer
import json
params = json.loads('${JSON.stringify({ rendererName })}')
result = handle_set_renderer(renderer_name=params['rendererName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatRenderResult(parsed.data);
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
 * Tool: set_render_quality
 *
 * Set render quality level.
 */
function setRenderQualityTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_render_quality',
    `Set the render quality level for the current renderer.

Parameters:
- quality (required): Quality level - "draft", "medium", "high", "ultra"

Returns:
- success: Whether quality change succeeded
- quality: The quality that was set
- message: Status message

Higher quality takes longer to render but looks better.

Example:
- Fast draft render: { quality: "draft" }
- High quality: { quality: "high" }`,
    {
      quality: z.enum(['draft', 'medium', 'high', 'ultra']).describe('Render quality level'),
    },
    async (input) => {
      const { quality } = input;

      const code = `
from llm_bridge.render_handlers import handle_set_render_quality
import json
params = json.loads('${JSON.stringify({ quality })}')
result = handle_set_render_quality(quality=params['quality'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatRenderResult(parsed.data);
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
 * Tool: set_object_material
 *
 * Apply a material to an object.
 */
function setObjectMaterialTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_object_material',
    `Apply a material from the FreeCAD material database to an object.

Parameters:
- objectName (required): Name of the object to modify
- materialName (required): Name of material from FreeCAD material database (e.g., "Steel", "Aluminum", "Plastic")

Returns:
- success: Whether material application succeeded
- objectName: Name of the object
- materialName: Material that was applied
- message: Status message

Use this tool to change how an object looks and its physical properties.

Example:
- Apply steel: { objectName: "Box", materialName: "Steel" }
- Use plastic: { objectName: "Housing", materialName: "Plastic" }`,
    {
      objectName: z.string().describe('Name of the object'),
      materialName: z.string().describe('Material name from FreeCAD database'),
    },
    async (input) => {
      const { objectName, materialName } = input;

      const code = `
from llm_bridge.render_handlers import handle_set_material
import json
params = json.loads('${JSON.stringify({ objectName, materialName })}')
result = handle_set_material(object_name=params['objectName'], material_name=params['materialName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMaterialResult(parsed.data);
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
 * Tool: set_object_color
 *
 * Set the color of an object.
 */
function setObjectColorTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_object_color',
    `Set the display color of an object.

Parameters:
- objectName (required): Name of the object to modify
- color (required): Color as {r, g, b, a} with values 0-255
- r: Red component (0-255)
- g: Green component (0-255)
- b: Blue component (0-255)
- a: Alpha/transparency (0-255), optional default 255

Returns:
- success: Whether color change succeeded
- objectName: Name of the object
- color: Color that was set
- message: Status message

Example:
- Red object: { objectName: "Box", color: {r: 255, g: 0, b: 0} }
- Blue with transparency: { objectName: "Sphere", color: {r: 0, g: 0, b: 255, a: 128} }`,
    {
      objectName: z.string().describe('Name of the object'),
      color: z.object({
        r: z.number().min(0).max(255).describe('Red component'),
        g: z.number().min(0).max(255).describe('Green component'),
        b: z.number().min(0).max(255).describe('Blue component'),
        a: z.number().min(0).max(255).optional().describe('Alpha component'),
      }).describe('Color RGBA values (0-255)'),
    },
    async (input) => {
      const { objectName, color } = input;

      const code = `
from llm_bridge.render_handlers import handle_set_material
import json
params = json.loads('${JSON.stringify({ objectName, color: { ...color, a: color.a || 255 } })}')
result = handle_set_material(object_name=params['objectName'], property_name='ShapeColor', value=params['color'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMaterialResult(parsed.data);
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
 * Tool: configure_lighting
 *
 * Configure scene lighting preset.
 */
function configureLightingTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'configure_lighting',
    `Configure the scene lighting with a preset.

Parameters:
- lightingType (required): Lighting preset - "default", "studio", "outdoor", "museum"

Returns:
- success: Whether lighting change succeeded
- lightingType: The lighting preset that was set
- message: Status message

Use this tool to change how the scene is illuminated.

Example:
- Studio lighting: { lightingType: "studio" }
- Outdoor sun: { lightingType: "outdoor" }`,
    {
      lightingType: z.enum(['default', 'studio', 'outdoor', 'museum']).describe('Lighting preset type'),
    },
    async (input) => {
      const { lightingType } = input;

      const code = `
from llm_bridge.render_handlers import handle_configure_lighting
import json
params = json.loads('${JSON.stringify({ lightingType })}')
result = handle_configure_lighting(lights_config=params['lightingType'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatRenderResult(parsed.data);
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
 * Tool: start_animation_capture
 *
 * Start capturing animation frames.
 */
function startAnimationCaptureTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'start_animation_capture',
    `Start capturing animation frames to a directory.

Parameters:
- outputDir (required): Directory to save frames
- fps (optional): Frames per second, default 30

Returns:
- success: Whether capture start succeeded
- outputDir: Directory for frames
- fps: Frames per second
- message: Status message

Use this to begin recording frames for animation. Follow with capture_animation_frame and stop_animation_capture.

Example:
- Start capture: { outputDir: "/tmp/anim" }
- 60fps capture: { outputDir: "/tmp/anim", fps: 60 }`,
    {
      outputDir: z.string().describe('Directory to save animation frames'),
      fps: z.number().optional().describe('Frames per second (default 30)'),
    },
    async (input) => {
      const { outputDir, fps } = input;

      const code = `
from llm_bridge.animation_export_handlers import handle_start_animation_capture
import json
params = json.loads('${JSON.stringify({ outputDir, fps: fps || 30 })}')
result = handle_start_animation_capture(output_path=params['outputDir'], fps=params['fps'], format='png')
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatAnimationCapture(parsed.data);
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
 * Tool: capture_animation_frame
 *
 * Capture a single animation frame.
 */
function captureAnimationFrameTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'capture_animation_frame',
    `Capture a single frame during animation capture.

Parameters: None

Returns:
- success: Whether capture succeeded
- frameNumber: Current frame number
- message: Status message

Use this after start_animation_capture to record each frame.

Example:
- "Capture this frame"`,
    {},
    async () => {
      const code = `
from llm_bridge.animation_export_handlers import handle_capture_frame
import json
result = handle_capture_frame()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatAnimationCapture(parsed.data);
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
 * Tool: stop_animation_capture
 *
 * Stop capture and encode video.
 */
function stopAnimationCaptureTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'stop_animation_capture',
    `Stop animation capture and encode to video file.

Parameters:
- outputPath (required): Output video file path (.mp4, .gif, .webm)
- format (required): Video format - "mp4", "gif", "webm"
- quality (optional): Quality setting - "low", "medium", "high"

Returns:
- success: Whether encoding succeeded
- outputPath: Path to encoded video
- format: Video format used
- totalFrames: Number of frames captured
- message: Status message

Example:
- Create MP4: { outputPath: "~/video.mp4", format: "mp4" }
- Create GIF: { outputPath: "~/anim.gif", format: "gif" }`,
    {
      outputPath: z.string().describe('Output video file path'),
      format: z.enum(['mp4', 'gif', 'webm']).describe('Video format'),
      quality: z.enum(['low', 'medium', 'high']).optional().describe('Video quality'),
    },
    async (input) => {
      const { outputPath, format, quality } = input;

      const code = `
from llm_bridge.animation_export_handlers import handle_stop_animation_capture
import json
params = json.loads('${JSON.stringify({ outputPath, format, quality: quality || 'high' })}')
result = handle_stop_animation_capture(output_path=params['outputPath'], fps=30, codec=params['format'], quality=params['quality'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatVideoExport(parsed.data);
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
 * Tool: export_animation
 *
 * Export a full animation in one call.
 */
function exportAnimationTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'export_animation',
    `Export a complete animation from assembly in a single call.

Parameters:
- assemblyName (required): Name of the assembly to animate
- outputPath (required): Output video file path
- format (required): Video format - "mp4", "gif"
- duration (required): Animation duration in seconds
- fps (optional): Frames per second, default 30

Returns:
- success: Whether export succeeded
- outputPath: Path to exported video
- format: Video format used
- duration: Animation duration in seconds
- totalFrames: Number of frames rendered
- message: Status message

Example:
- Export mechanism: { assemblyName: "Robot", outputPath: "~/robot.mp4", format: "mp4", duration: 5 }
- Create GIF: { assemblyName: "Motor", outputPath: "~/motor.gif", format: "gif", duration: 3 }`,
    {
      assemblyName: z.string().describe('Name of the assembly to animate'),
      outputPath: z.string().describe('Output video file path'),
      format: z.enum(['mp4', 'gif']).describe('Video format'),
      duration: z.number().describe('Animation duration in seconds'),
      fps: z.number().optional().describe('Frames per second (default 30)'),
    },
    async (input) => {
      const { assemblyName, outputPath, format, duration, fps } = input;

      const code = `
from llm_bridge.animation_export_handlers import handle_export_animation
import json
params = json.loads('${JSON.stringify({ assemblyName, outputPath, format, duration, fps: fps || 30 })}')
result = handle_export_animation(assembly_name=params['assemblyName'], output_path=params['outputPath'], format=params['format'], duration=params['duration'], fps=params['fps'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatVideoExport(parsed.data);
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
}// ============================================================================
// Mesh Operation Tools
// ============================================================================

function shapeToMeshTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'shape_to_mesh',
    `Convert a Part shape to a mesh object.

Parameters:
- shapeName (required): Name of the shape to convert
- meshName (optional): Name for the resulting mesh object

Returns:
- success: Whether conversion succeeded
- meshName: Name of the created mesh
- triangleCount: Number of triangles in the mesh
- vertexCount: Number of vertices
- message: Status message

Use this tool when you need to convert CAD geometry to mesh format for 3D printing or export.

Example:
- Convert Box to mesh: { shapeName: "Box" }
- Convert to mesh with name: { shapeName: "Body", meshName: "BodyMesh" }`,
    {
      shapeName: z.string().describe('Name of the shape to convert to mesh'),
      meshName: z.string().optional().describe('Optional name for the resulting mesh'),
    },
    async (input) => {
      const { shapeName, meshName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_shape_to_mesh
import json
params = json.loads('${JSON.stringify({ shapeName, meshName })}')
result = handle_shape_to_mesh(
    shape_name=params['shapeName'],
    mesh_name=params.get('meshName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshConversion(parsed.data);
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

function meshToShapeTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'mesh_to_shape',
    `Convert a mesh object to a Part shape.

Parameters:
- meshName (required): Name of the mesh to convert
- shapeName (optional): Name for the resulting shape

Returns:
- success: Whether conversion succeeded
- shapeName: Name of the created shape
- volume: Volume of the solid shape
- message: Status message

Use this tool when you need to convert mesh geometry to CAD geometry for further modeling.

Example:
- Convert Mesh to shape: { meshName: "Mesh" }
- Convert with name: { meshName: "MyMesh", shapeName: "Solid" }`,
    {
      meshName: z.string().describe('Name of the mesh to convert to shape'),
      shapeName: z.string().optional().describe('Optional name for the resulting shape'),
    },
    async (input) => {
      const { meshName, shapeName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_mesh_to_shape
import json
params = json.loads('${JSON.stringify({ meshName, shapeName })}')
result = handle_mesh_to_shape(
    mesh_name=params['meshName'],
    shape_name=params.get('shapeName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshConversion(parsed.data);
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

function meshBooleanUnionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'mesh_boolean_union',
    `Union multiple meshes into a single mesh.

Parameters:
- meshNames (required): Array of mesh names to union
- resultName (optional): Name for the resulting mesh

Returns:
- success: Whether operation succeeded
- resultMesh: Name of the resulting mesh
- triangleCount: Number of triangles in result
- message: Status message

Use this tool when you need to combine multiple mesh objects into one.

Example:
- Union meshes: { meshNames: ["Mesh1", "Mesh2"] }
- Union with name: { meshNames: ["Part1", "Part2"], resultName: "Combined" }`,
    {
      meshNames: z.array(z.string()).describe('Array of mesh names to union'),
      resultName: z.string().optional().describe('Optional name for the result'),
    },
    async (input) => {
      const { meshNames, resultName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_mesh_boolean_union
import json
params = json.loads('${JSON.stringify({ meshNames, resultName })}')
result = handle_mesh_boolean_union(
    mesh_names=params['meshNames'],
    result_name=params.get('resultName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshBoolean(parsed.data);
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

function meshBooleanDifferenceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'mesh_boolean_difference',
    `Subtract meshes from a base mesh (cut holes).

Parameters:
- baseMesh (required): Name of the base mesh
- toolMeshes (required): Array of mesh names to subtract
- resultName (optional): Name for the resulting mesh

Returns:
- success: Whether operation succeeded
- resultMesh: Name of the resulting mesh
- triangleCount: Number of triangles in result
- message: Status message

Use this tool when you need to cut one mesh from another.

Example:
- Cut holes: { baseMesh: "Cube", toolMeshes: ["Cylinder"] }
- Cut with name: { baseMesh: "Box", toolMeshes: ["Hole1", "Hole2"], resultName: "CutBox" }`,
    {
      baseMesh: z.string().describe('Name of the base mesh to subtract from'),
      toolMeshes: z.array(z.string()).describe('Array of mesh names to subtract'),
      resultName: z.string().optional().describe('Optional name for the result'),
    },
    async (input) => {
      const { baseMesh, toolMeshes, resultName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_mesh_boolean_difference
import json
params = json.loads('${JSON.stringify({ baseMesh, toolMeshes, resultName })}')
result = handle_mesh_boolean_difference(
    base_mesh=params['baseMesh'],
    tool_meshes=params['toolMeshes'],
    result_name=params.get('resultName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshBoolean(parsed.data);
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

function meshBooleanIntersectionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'mesh_boolean_intersection',
    `Intersect multiple meshes to find common volume.

Parameters:
- meshNames (required): Array of mesh names to intersect
- resultName (optional): Name for the resulting mesh

Returns:
- success: Whether operation succeeded
- resultMesh: Name of the resulting mesh
- triangleCount: Number of triangles in result
- message: Status message

Use this tool when you need to find the overlap between meshes.

Example:
- Find overlap: { meshNames: ["Mesh1", "Mesh2"] }
- Intersection with name: { meshNames: ["Part1", "Part2"], resultName: "Overlap" }`,
    {
      meshNames: z.array(z.string()).describe('Array of mesh names to intersect'),
      resultName: z.string().optional().describe('Optional name for the result'),
    },
    async (input) => {
      const { meshNames, resultName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_mesh_boolean_intersection
import json
params = json.loads('${JSON.stringify({ meshNames, resultName })}')
result = handle_mesh_boolean_intersection(
    mesh_names=params['meshNames'],
    result_name=params.get('resultName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshBoolean(parsed.data);
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

function decimateMeshTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'decimate_mesh',
    `Reduce mesh complexity by removing triangles.

Parameters:
- meshName (required): Name of the mesh to decimate
- targetRatio (required): Target reduction ratio (0.0 to 1.0), e.g., 0.5 = 50% of original
- resultName (optional): Name for the resulting mesh

Returns:
- success: Whether operation succeeded
- originalTriangles: Original triangle count
- newTriangles: New triangle count after decimation
- reduction: Actual reduction ratio achieved
- message: Status message

Use this tool to simplify meshes for faster rendering or export.

Example:
- Decimate to 50%: { meshName: "Mesh", targetRatio: 0.5 }
- Decimate with name: { meshName: "HighRes", targetRatio: 0.25, resultName: "LowRes" }`,
    {
      meshName: z.string().describe('Name of the mesh to decimate'),
      targetRatio: z.number().min(0).max(1).describe('Target reduction ratio (0.0-1.0)'),
      resultName: z.string().optional().describe('Optional name for the result'),
    },
    async (input) => {
      const { meshName, targetRatio, resultName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_decimate_mesh
import json
params = json.loads('${JSON.stringify({ meshName, targetRatio, resultName })}')
result = handle_decimate_mesh(
    mesh_name=params['meshName'],
    target_ratio=params['targetRatio'],
    result_name=params.get('resultName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshDecimation(parsed.data);
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

function optimizeMeshTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'optimize_mesh',
    `Optimize mesh topology and reduce file size.

Parameters:
- meshName (required): Name of the mesh to optimize
- tolerance (optional): Optimization tolerance
- resultName (optional): Name for the resulting mesh

Returns:
- success: Whether operation succeeded
- resultMesh: Name of the resulting mesh
- message: Status message

Use this tool to clean up mesh topology without significant geometry loss.

Example:
- Optimize mesh: { meshName: "Mesh" }
- Optimize with tolerance: { meshName: "Mesh", tolerance: 0.001 }`,
    {
      meshName: z.string().describe('Name of the mesh to optimize'),
      tolerance: z.number().optional().describe('Optimization tolerance'),
      resultName: z.string().optional().describe('Optional name for the result'),
    },
    async (input) => {
      const { meshName, tolerance, resultName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_optimize_mesh
import json
params = json.loads('${JSON.stringify({ meshName, tolerance, resultName })}')
result = handle_optimize_mesh(
    mesh_name=params['meshName'],
    tolerance=params.get('tolerance'),
    result_name=params.get('resultName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshDecimation(parsed.data);
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

function repairMeshTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'repair_mesh',
    `Perform comprehensive mesh repair.

Parameters:
- meshName (required): Name of the mesh to repair
- options (optional): Object with repair options
  - fixHoles: Fill holes in the mesh
  - fixNormals: Correct face normals
  - removeDuplicates: Remove duplicate triangles

Returns:
- success: Whether repair succeeded
- repairedMesh: Name of the repaired mesh
- fixesApplied: Number of fixes applied
- message: Status message

Use this tool to fix common mesh issues before 3D printing.

Example:
- Repair mesh: { meshName: "Mesh" }
- Full repair: { meshName: "Mesh", options: { fixHoles: true, fixNormals: true, removeDuplicates: true } }`,
    {
      meshName: z.string().describe('Name of the mesh to repair'),
      options: z.object({
        fixHoles: z.boolean().optional(),
        fixNormals: z.boolean().optional(),
        removeDuplicates: z.boolean().optional(),
      }).optional().describe('Repair options'),
    },
    async (input) => {
      const { meshName, options } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_repair_mesh
import json
params = json.loads('${JSON.stringify({ meshName, options })}')
result = handle_repair_mesh(
    mesh_name=params['meshName'],
    repair_options=params.get('options')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshRepair(parsed.data);
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

function fillHolesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'fill_holes',
    `Fill holes in a mesh.

Parameters:
- meshName (required): Name of the mesh
- maxHoleSize (optional): Maximum hole size to fill

Returns:
- success: Whether operation succeeded
- filledMesh: Name of the resulting mesh
- holesFilled: Number of holes filled
- message: Status message

Use this tool to make a mesh watertight by filling holes.

Example:
- Fill holes: { meshName: "Mesh" }
- Fill small holes: { meshName: "Mesh", maxHoleSize: 10 }`,
    {
      meshName: z.string().describe('Name of the mesh to fill holes in'),
      maxHoleSize: z.number().optional().describe('Maximum hole size to fill'),
    },
    async (input) => {
      const { meshName, maxHoleSize } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_fill_holes
import json
params = json.loads('${JSON.stringify({ meshName, maxHoleSize })}')
result = handle_fill_holes(
    mesh_name=params['meshName'],
    max_hole_size=params.get('maxHoleSize')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshRepair(parsed.data);
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

function fixMeshNormalsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'fix_mesh_normals',
    `Fix face normals of a mesh.

Parameters:
- meshName (required): Name of the mesh

Returns:
- success: Whether operation succeeded
- fixedMesh: Name of the resulting mesh
- normalsFixed: Number of normals corrected
- message: Status message

Use this tool to correct inverted or inconsistent face normals.

Example:
- Fix normals: { meshName: "Mesh" }`,
    {
      meshName: z.string().describe('Name of the mesh to fix normals'),
    },
    async (input) => {
      const { meshName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_fix_normals
import json
params = json.loads('${JSON.stringify({ meshName })}')
result = handle_fix_normals(mesh_name=params['meshName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshRepair(parsed.data);
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

function validateMeshTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'validate_mesh',
    `Validate mesh integrity and check for issues.

Parameters:
- meshName (required): Name of the mesh to validate

Returns:
- success: Whether validation completed
- isValid: Whether mesh is valid
- issues: Array of detected issues
- triangleCount: Number of triangles
- message: Status message

Use this tool to check mesh quality before 3D printing.

Example:
- Validate mesh: { meshName: "Mesh" }`,
    {
      meshName: z.string().describe('Name of the mesh to validate'),
    },
    async (input) => {
      const { meshName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_validate_mesh
import json
params = json.loads('${JSON.stringify({ meshName })}')
result = handle_validate_mesh(mesh_name=params['meshName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshValidation(parsed.data);
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

function checkWatertightTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'check_watertight',
    `Check if a mesh is watertight (closed, printable).

Parameters:
- meshName (required): Name of the mesh to check

Returns:
- success: Whether check completed
- isWatertight: Whether mesh is watertight
- holesCount: Number of holes detected
- message: Status message

Use this tool to verify a mesh is ready for 3D printing.

Example:
- Check watertight: { meshName: "Mesh" }`,
    {
      meshName: z.string().describe('Name of the mesh to check'),
    },
    async (input) => {
      const { meshName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_check_watertight
import json
params = json.loads('${JSON.stringify({ meshName })}')
result = handle_check_watertight(mesh_name=params['meshName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshValidation(parsed.data);
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

function getMeshInfoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_mesh_info',
    `Get detailed information about a mesh.

Parameters:
- meshName (required): Name of the mesh

Returns:
- success: Whether operation succeeded
- triangleCount: Number of triangles
- vertexCount: Number of vertices
- area: Surface area
- volume: Volume (if closed)
- bounds: Bounding box dimensions
- message: Status message

Use this tool to get mesh statistics and properties.

Example:
- Get mesh info: { meshName: "Mesh" }`,
    {
      meshName: z.string().describe('Name of the mesh to get info'),
    },
    async (input) => {
      const { meshName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_get_mesh_info
import json
params = json.loads('${JSON.stringify({ meshName })}')
result = handle_get_mesh_info(mesh_name=params['meshName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshInfo(parsed.data);
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

function scaleMeshTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'scale_mesh',
    `Scale a mesh uniformly.

Parameters:
- meshName (required): Name of the mesh to scale
- scaleFactor (required): Scale factor (e.g., 2.0 = double size, 0.5 = half)
- resultName (optional): Name for the resulting mesh

Returns:
- success: Whether operation succeeded
- scaledMesh: Name of the resulting mesh
- scaleFactor: Applied scale factor
- originalSize: Original bounding box size
- newSize: New bounding box size
- message: Status message

Use this tool to resize a mesh.

Example:
- Double size: { meshName: "Mesh", scaleFactor: 2.0 }
- Half size: { meshName: "Mesh", scaleFactor: 0.5 }`,
    {
      meshName: z.string().describe('Name of the mesh to scale'),
      scaleFactor: z.number().describe('Scale factor (e.g., 2.0 = double, 0.5 = half)'),
      resultName: z.string().optional().describe('Optional name for the result'),
    },
    async (input) => {
      const { meshName, scaleFactor, resultName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_scale_mesh
import json
params = json.loads('${JSON.stringify({ meshName, scaleFactor, resultName })}')
result = handle_scale_mesh(
    mesh_name=params['meshName'],
    scale_factor=params['scaleFactor'],
    result_name=params.get('resultName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshScale(parsed.data);
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

function offsetMeshTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'offset_mesh',
    `Create an offset (shell) mesh.

Parameters:
- meshName (required): Name of the mesh
- offsetDistance (required): Offset distance (positive = outward, negative = inward)
- resultName (optional): Name for the resulting mesh

Returns:
- success: Whether operation succeeded
- offsetMesh: Name of the resulting mesh
- offsetDistance: Applied offset distance
- triangleCount: Number of triangles in result
- message: Status message

Use this tool to create a shelled or inflated/deflated version of a mesh.

Example:
- Shell outward: { meshName: "Mesh", offsetDistance: 1.0 }
- Shell inward: { meshName: "Mesh", offsetDistance: -0.5 }`,
    {
      meshName: z.string().describe('Name of the mesh to offset'),
      offsetDistance: z.number().describe('Offset distance (positive = outward)'),
      resultName: z.string().optional().describe('Optional name for the result'),
    },
    async (input) => {
      const { meshName, offsetDistance, resultName } = input;

      const code = `
from llm_bridge.mesh_handlers import handle_offset_mesh
import json
params = json.loads('${JSON.stringify({ meshName, offsetDistance, resultName })}')
result = handle_offset_mesh(
    mesh_name=params['meshName'],
    offset_distance=params['offsetDistance'],
    result_name=params.get('resultName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshOffset(parsed.data);
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

function exportStlTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'export_stl',
    `Export a mesh to STL format for 3D printing.

Parameters:
- meshName (required): Name of the mesh to export
- outputPath (required): Full path for the output STL file
- binary (optional): Export as binary STL (default true), false for ASCII
- precision (optional): Angular deflection precision

Returns:
- success: Whether export succeeded
- outputPath: Path where file was saved
- fileSize: Size of the exported file
- triangleCount: Number of triangles exported
- message: Status message

Use this tool when you need to export a mesh for 3D printing.

Example:
- Export STL: { meshName: "Mesh", outputPath: "C:/print.stl" }
- ASCII export: { meshName: "Mesh", outputPath: "C:/print.stl", binary: false }`,
    {
      meshName: z.string().describe('Name of the mesh to export'),
      outputPath: z.string().describe('Full path for the output STL file'),
      binary: z.boolean().optional().describe('Export as binary STL (default true)'),
      precision: z.number().optional().describe('Angular deflection precision'),
    },
    async (input) => {
      const { meshName, outputPath, binary, precision } = input;

      const validation = validateFilePath(outputPath);
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
from llm_bridge.mesh_export_handlers import handle_export_stl
import json
params = json.loads('${JSON.stringify({ meshName, outputPath, binary, precision })}')
result = handle_export_stl(
    mesh_name=params['meshName'],
    output_path=params['outputPath'],
    binary=params.get('binary', True),
    precision=params.get('precision')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshExport(parsed.data);
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

function export3mfTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'export_3mf',
    `Export a mesh to 3MF format (preserves colors and materials).

Parameters:
- meshName (required): Name of the mesh to export
- outputPath (required): Full path for the output 3MF file

Returns:
- success: Whether export succeeded
- outputPath: Path where file was saved
- fileSize: Size of the exported file
- triangleCount: Number of triangles exported
- message: Status message

Use this tool for full 3D printing metadata preservation.

Example:
- Export 3MF: { meshName: "Mesh", outputPath: "C:/print.3mf" }`,
    {
      meshName: z.string().describe('Name of the mesh to export'),
      outputPath: z.string().describe('Full path for the output 3MF file'),
    },
    async (input) => {
      const { meshName, outputPath } = input;

      const validation = validateFilePath(outputPath);
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
from llm_bridge.mesh_export_handlers import handle_export_3mf
import json
params = json.loads('${JSON.stringify({ meshName, outputPath })}')
result = handle_export_3mf(
    mesh_name=params['meshName'],
    output_path=params['outputPath']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshExport(parsed.data);
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

function exportObjTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'export_obj',
    `Export a mesh to OBJ format (Wavefront).

Parameters:
- meshName (required): Name of the mesh to export
- outputPath (required): Full path for the output OBJ file
- includeMaterials (optional): Include MTL material file (default true)

Returns:
- success: Whether export succeeded
- outputPath: Path where file was saved
- fileSize: Size of the exported file
- triangleCount: Number of triangles exported
- message: Status message

Use this tool for exchange with other 3D software.

Example:
- Export OBJ: { meshName: "Mesh", outputPath: "C:/model.obj" }`,
    {
      meshName: z.string().describe('Name of the mesh to export'),
      outputPath: z.string().describe('Full path for the output OBJ file'),
      includeMaterials: z.boolean().optional().describe('Include MTL material file'),
    },
    async (input) => {
      const { meshName, outputPath, includeMaterials } = input;

      const validation = validateFilePath(outputPath);
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
from llm_bridge.mesh_export_handlers import handle_export_obj
import json
params = json.loads('${JSON.stringify({ meshName, outputPath, includeMaterials })}')
result = handle_export_obj(
    mesh_name=params['meshName'],
    output_path=params['outputPath'],
    include_materials=params.get('includeMaterials', True)
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshExport(parsed.data);
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

function exportPlyTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'export_ply',
    `Export a mesh to PLY format.

Parameters:
- meshName (required): Name of the mesh to export
- outputPath (required): Full path for the output PLY file

Returns:
- success: Whether export succeeded
- outputPath: Path where file was saved
- fileSize: Size of the exported file
- triangleCount: Number of triangles exported
- message: Status message

Use this tool for polygon mesh export with color support.

Example:
- Export PLY: { meshName: "Mesh", outputPath: "C:/model.ply" }`,
    {
      meshName: z.string().describe('Name of the mesh to export'),
      outputPath: z.string().describe('Full path for the output PLY file'),
    },
    async (input) => {
      const { meshName, outputPath } = input;

      const validation = validateFilePath(outputPath);
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
from llm_bridge.mesh_export_handlers import handle_export_ply
import json
params = json.loads('${JSON.stringify({ meshName, outputPath })}')
result = handle_export_ply(
    mesh_name=params['meshName'],
    output_path=params['outputPath']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshExport(parsed.data);
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

function importStlTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'import_stl',
    `Import an STL file as a mesh object.

Parameters:
- inputPath (required): Full path to the STL file to import
- meshName (optional): Name for the imported mesh object

Returns:
- success: Whether import succeeded
- meshName: Name of the imported mesh
- triangleCount: Number of triangles
- vertexCount: Number of vertices
- message: Status message

Use this tool to load mesh files into FreeCAD.

Example:
- Import STL: { inputPath: "C:/part.stl" }
- Import with name: { inputPath: "C:/part.stl", meshName: "ImportedMesh" }`,
    {
      inputPath: z.string().describe('Full path to the STL file to import'),
      meshName: z.string().optional().describe('Optional name for the mesh'),
    },
    async (input) => {
      const { inputPath, meshName } = input;

      const code = `
from llm_bridge.mesh_export_handlers import handle_import_stl
import json
params = json.loads('${JSON.stringify({ inputPath, meshName })}')
result = handle_import_stl(
    input_path=params['inputPath'],
    mesh_name=params.get('meshName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshImport(parsed.data);
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

function import3mfTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'import_3mf',
    `Import a 3MF file as a mesh object (preserves colors and materials).

Parameters:
- inputPath (required): Full path to the 3MF file to import
- meshName (optional): Name for the imported mesh object

Returns:
- success: Whether import succeeded
- meshName: Name of the imported mesh
- triangleCount: Number of triangles
- vertexCount: Number of vertices
- message: Status message

Use this tool to load 3MF files with full metadata.

Example:
- Import 3MF: { inputPath: "C:/part.3mf" }
- Import with name: { inputPath: "C:/part.3mf", meshName: "ColorMesh" }`,
    {
      inputPath: z.string().describe('Full path to the 3MF file to import'),
      meshName: z.string().optional().describe('Optional name for the mesh'),
    },
    async (input) => {
      const { inputPath, meshName } = input;

      const code = `
from llm_bridge.mesh_export_handlers import handle_import_3mf
import json
params = json.loads('${JSON.stringify({ inputPath, meshName })}')
result = handle_import_3mf(
    input_path=params['inputPath'],
    mesh_name=params.get('meshName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshImport(parsed.data);
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

function importObjTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'import_obj',
    `Import an OBJ file as a mesh object.

Parameters:
- inputPath (required): Full path to the OBJ file to import
- meshName (optional): Name for the imported mesh object

Returns:
- success: Whether import succeeded
- meshName: Name of the imported mesh
- triangleCount: Number of triangles
- vertexCount: Number of vertices
- message: Status message

Use this tool to load OBJ files into FreeCAD.

Example:
- Import OBJ: { inputPath: "C:/model.obj" }
- Import with name: { inputPath: "C:/model.obj", meshName: "ImportedObj" }`,
    {
      inputPath: z.string().describe('Full path to the OBJ file to import'),
      meshName: z.string().optional().describe('Optional name for the mesh'),
    },
    async (input) => {
      const { inputPath, meshName } = input;

      const code = `
from llm_bridge.mesh_export_handlers import handle_import_obj
import json
params = json.loads('${JSON.stringify({ inputPath, meshName })}')
result = handle_import_obj(
    input_path=params['inputPath'],
    mesh_name=params.get('meshName')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeshImport(parsed.data);
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

function createFeaAnalysisTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_fea_analysis',
    `Create a new FEA (Finite Element Analysis) analysis.

Parameters:
- analysisName (optional): Name for the new analysis (auto-generated if not provided)

Returns:
- success: Whether creation succeeded
- analysisName: Name of the created analysis
- analysisLabel: Label of the analysis
- message: Status message

Use this tool to set up a new FEA analysis for stress analysis. After creation, you need to:
1. Create a mesh from a shape object
2. Assign a material
3. Add boundary conditions (fixed constraints, forces, etc.)
4. Configure and run the solver

Example:
- Create analysis: { analysisName: "StaticAnalysis" }
- Create with default name: {}`,
    {
      analysisName: z.string().optional().describe('Optional name for the analysis'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_create_fea_analysis
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_create_fea_analysis(
    analysis_name=params.get('analysisName') or "FEAAnalysis"
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAAnalysis(parsed.data);
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

function deleteFeaAnalysisTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'delete_fea_analysis',
    `Delete an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis to delete

Returns:
- success: Whether deletion succeeded
- deletedAnalysis: Name of the deleted analysis
- message: Status message

Use this tool to remove an FEA analysis and all its associated constraints and results.

Example:
- Delete analysis: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis to delete'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_delete_fea_analysis
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_delete_fea_analysis(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAAnalysis(parsed.data);
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

function listFeaAnalysesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_fea_analyses',
    `List all FEA analyses in the active document.

Parameters: None

Returns:
- success: Whether listing succeeded
- analyses: Array of analysis objects with name and label
- count: Number of analyses found
- message: Status message

Use this tool to see all available FEA analyses in the current document.

Example:
- List all: {}`,
    {},
    async () => {
      const code = `
from llm_bridge.fea_handlers import handle_list_fea_analyses
import json
result = handle_list_fea_analyses()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAAnalysis(parsed.data);
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

function getFeaAnalysisTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_fea_analysis',
    `Get detailed information about an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis to query

Returns:
- success: Whether query succeeded
- analysisName: Name of the analysis
- analysisLabel: Label of the analysis
- meshInfo: Information about the mesh (if any)
- memberCount: Number of members (constraints, solver, etc.)
- members: List of member names
- status: Analysis status (Ready, Empty, etc.)
- message: Status message

Use this tool to check the current state of an analysis including its mesh, constraints, and solver.

Example:
- Get info: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis to get info'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_get_fea_analysis
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_get_fea_analysis(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAAnalysis(parsed.data);
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

function createFeaMeshTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_fea_mesh',
    `Create a FEM mesh from a shape object for FEA analysis.

Parameters:
- objectName (required): Name of the shape object to mesh
- meshType (optional): Mesh generator type ("netgen" or "gmsh", default "netgen")
- maxSize (optional): Maximum element size (default 1.0)
- secondOrder (optional): Use second order elements (default false)

Returns:
- success: Whether mesh creation succeeded
- meshName: Name of the created mesh
- meshLabel: Label of the mesh
- sourceObject: Name of the source shape
- meshType: Type of mesh generator used
- nodeCount: Number of nodes in the mesh
- elementCount: Number of elements in the mesh
- message: Status message

Use this tool to generate a finite element mesh from a CAD shape. The mesh is required for FEA analysis.

Example:
- Create mesh: { objectName: "Box" }
- Fine mesh: { objectName: "Box", maxSize: 0.5 }
- Gmsh mesh: { objectName: "Box", meshType: "gmsh" }`,
    {
      objectName: z.string().describe('Name of the shape object to mesh'),
      meshType: z.enum(['netgen', 'gmsh']).optional().describe('Mesh generator type'),
      maxSize: z.number().optional().describe('Maximum element size'),
      secondOrder: z.boolean().optional().describe('Use second order elements'),
    },
    async (input) => {
      const { objectName, meshType, maxSize, secondOrder } = input;

      const code = `
from llm_bridge.fea_handlers import handle_create_fea_mesh
import json
params = json.loads('${JSON.stringify({ objectName, meshType, maxSize, secondOrder })}')
result = handle_create_fea_mesh(
    object_name=params['objectName'],
    mesh_type=params.get('meshType', 'netgen'),
    max_size=params.get('maxSize', 1.0),
    second_order=params.get('secondOrder', False)
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAMesh(parsed.data);
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

function refineFeaMeshTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'refine_fea_mesh',
    `Refine an existing FEM mesh by increasing element density.

Parameters:
- meshName (required): Name of the mesh to refine
- refineLevel (required): Refinement level (1 = double resolution, 2 = quadruple, etc.)

Returns:
- success: Whether refinement succeeded
- meshName: Name of the refined mesh
- meshLabel: Label of the refined mesh
- sourceMesh: Name of the source mesh
- refineLevel: Applied refinement level
- originalNodeCount: Node count before refinement
- newNodeCount: Node count after refinement
- originalElementCount: Element count before refinement
- newElementCount: Element count after refinement
- message: Status message

Use this tool to create a denser mesh from an existing one. Higher refinement levels produce more elements.

Example:
- Refine level 1: { meshName: "Box_Mesh", refineLevel: 1 }
- Aggressive refinement: { meshName: "Box_Mesh", refineLevel: 2 }`,
    {
      meshName: z.string().describe('Name of the mesh to refine'),
      refineLevel: z.number().int().min(1).describe('Refinement level (1, 2, 3, etc.)'),
    },
    async (input) => {
      const { meshName, refineLevel } = input;

      const code = `
from llm_bridge.fea_handlers import handle_refine_fea_mesh
import json
params = json.loads('${JSON.stringify({ meshName, refineLevel })}')
result = handle_refine_fea_mesh(
    mesh_name=params['meshName'],
    refine_level=params['refineLevel']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAMesh(parsed.data);
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

function getFeaMeshInfoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_fea_mesh_info',
    `Get detailed information about a FEM mesh.

Parameters:
- meshName (required): Name of the mesh object to query

Returns:
- success: Whether query succeeded
- meshName: Name of the mesh
- meshLabel: Label of the mesh
- meshType: Type of mesh (Fem::FemMesh, etc.)
- nodeCount: Number of nodes
- elementCount: Number of elements
- elementTypes: Object with counts of each element type
- message: Status message

Use this tool to get mesh statistics and verify mesh quality.

Example:
- Get info: { meshName: "Box_Mesh" }`,
    {
      meshName: z.string().describe('Name of the mesh to get info'),
    },
    async (input) => {
      const { meshName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_get_fea_mesh_info
import json
params = json.loads('${JSON.stringify({ meshName })}')
result = handle_get_fea_mesh_info(
    mesh_name=params['meshName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAMesh(parsed.data);
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

function setFeaMaterialTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_fea_material',
    `Assign a material to an object for FEA analysis.

Parameters:
- objectName (required): Name of the object to assign material to
- materialName (required): Material preset (Steel, Aluminum, Copper, Brass, Titanium, Plastic)

Returns:
- success: Whether material assignment succeeded
- objectName: Name of the object
- materialName: Name of the assigned material
- youngsModulus: Young's modulus in MPa
- poissonsRatio: Poisson's ratio
- density: Density in kg/mm^3
- yieldStrength: Yield strength in MPa
- message: Status message

Use this tool to assign a material preset to a shape. The material properties affect stress and deformation results.

Material Properties:
- Steel: E=210000 MPa, nu=0.3, yield=250 MPa
- Aluminum: E=70000 MPa, nu=0.33, yield=270 MPa
- Copper: E=130000 MPa, nu=0.34, yield=33 MPa
- Brass: E=100000 MPa, nu=0.34, yield=180 MPa
- Titanium: E=110000 MPa, nu=0.34, yield=140 MPa
- Plastic: E=2200 MPa, nu=0.35, yield=50 MPa

Example:
- Assign steel: { objectName: "Box", materialName: "Steel" }
- Assign aluminum: { objectName: "Box", materialName: "Aluminum" }`,
    {
      objectName: z.string().describe('Name of the object to assign material to'),
      materialName: z.enum(['Steel', 'Aluminum', 'Copper', 'Brass', 'Titanium', 'Plastic']).describe('Material preset name'),
    },
    async (input) => {
      const { objectName, materialName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_set_fea_material
import json
params = json.loads('${JSON.stringify({ objectName, materialName })}')
result = handle_set_fea_material(
    object_name=params['objectName'],
    material_name=params['materialName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAMaterial(parsed.data);
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

function getFeaMaterialTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_fea_material',
    `Get the current material assignment for an object.

Parameters:
- objectName (required): Name of the object to query

Returns:
- success: Whether query succeeded
- objectName: Name of the object
- materialName: Name of the material (or "Custom" if not a preset)
- youngsModulus: Young's modulus in MPa
- poissonsRatio: Poisson's ratio
- materialData: Full material data dictionary
- message: Status message

Use this tool to check what material is currently assigned to an object.

Example:
- Get material: { objectName: "Box" }`,
    {
      objectName: z.string().describe('Name of the object to get material from'),
    },
    async (input) => {
      const { objectName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_get_fea_material
import json
params = json.loads('${JSON.stringify({ objectName })}')
result = handle_get_fea_material(
    object_name=params['objectName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAMaterial(parsed.data);
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

function addFeaFixedConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_fea_fixed_constraint',
    `Add a fixed boundary condition (constrains all translations).

Parameters:
- analysisName (required): Name of the analysis
- faceReferences (required): List of face references (e.g., ["Face1", "Face2"])

Returns:
- success: Whether constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Fixed")
- facesConstrained: List of constrained faces
- analysisName: Name of the analysis
- message: Status message

Use this tool to fix faces or edges so they cannot move. Typically used to constrain the part at mounting points.

Example:
- Fix bottom face: { analysisName: "StaticAnalysis", faceReferences: ["Face1"] }
- Fix multiple: { analysisName: "StaticAnalysis", faceReferences: ["Face1", "Face2"] }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
      faceReferences: z.array(z.string()).describe('List of face references to fix'),
    },
    async (input) => {
      const { analysisName, faceReferences } = input;

      const code = `
from llm_bridge.fea_handlers import handle_add_fea_fixed_constraint
import json
params = json.loads('${JSON.stringify({ analysisName, faceReferences })}')
result = handle_add_fea_fixed_constraint(
    analysis_name=params['analysisName'],
    face_names=params['faceReferences']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAConstraint(parsed.data);
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

function addFeaForceConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_fea_force_constraint',
    `Add a force constraint (applied load).

Parameters:
- analysisName (required): Name of the analysis
- faceReference (required): Face reference to apply force to (e.g., "Face1")
- forceValue (required): Force value in Newtons
- forceDirection (optional): Direction vector with x, y, z components (defaults to +Z)

Returns:
- success: Whether constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Force")
- faceName: Face the force is applied to
- forceValue: Force value in N
- forceDirection: Direction vector
- analysisName: Name of the analysis
- message: Status message

Use this tool to apply a concentrated force to a face. The force is distributed over the face area.

Example:
- Apply 1000N in Z: { analysisName: "StaticAnalysis", faceReference: "Face1", forceValue: 1000 }
- With direction: { analysisName: "StaticAnalysis", faceReference: "Face1", forceValue: 500, forceDirection: {"x": 1, "y": 0, "z": 0} }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
      faceReference: z.string().describe('Face reference to apply force to'),
      forceValue: z.number().describe('Force value in Newtons'),
      forceDirection: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }).optional().describe('Direction vector'),
    },
    async (input) => {
      const { analysisName, faceReference, forceValue, forceDirection } = input;

      const code = `
from llm_bridge.fea_handlers import handle_add_fea_force_constraint
import json
params = json.loads('${JSON.stringify({ analysisName, faceReference, forceValue, forceDirection })}')
result = handle_add_fea_force_constraint(
    analysis_name=params['analysisName'],
    face_name=params['faceReference'],
    force_value=params['forceValue'],
    force_direction=params.get('forceDirection')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAConstraint(parsed.data);
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

function addFeaPressureConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_fea_pressure_constraint',
    `Add a pressure constraint (uniform pressure load).

Parameters:
- analysisName (required): Name of the analysis
- faceReference (required): Face reference to apply pressure to (e.g., "Face1")
- pressureValue (required): Pressure value in MPa

Returns:
- success: Whether constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Pressure")
- faceName: Face the pressure is applied to
- pressureValue: Pressure value in MPa
- analysisName: Name of the analysis
- message: Status message

Use this tool to apply uniform pressure to a face. Pressure is force per unit area.

Example:
- Apply 10 MPa: { analysisName: "StaticAnalysis", faceReference: "Face1", pressureValue: 10 }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
      faceReference: z.string().describe('Face reference to apply pressure to'),
      pressureValue: z.number().describe('Pressure value in MPa'),
    },
    async (input) => {
      const { analysisName, faceReference, pressureValue } = input;

      const code = `
from llm_bridge.fea_handlers import handle_add_fea_pressure_constraint
import json
params = json.loads('${JSON.stringify({ analysisName, faceReference, pressureValue })}')
result = handle_add_fea_pressure_constraint(
    analysis_name=params['analysisName'],
    face_name=params['faceReference'],
    pressure_value=params['pressureValue']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAConstraint(parsed.data);
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

function addFeaDisplacementConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_fea_displacement_constraint',
    `Add a displacement constraint (prescribed displacement boundary condition).

Parameters:
- analysisName (required): Name of the analysis
- faceReference (required): Face reference to apply displacement to
- x (optional): X displacement value (0 = fixed, non-zero = prescribed)
- y (optional): Y displacement value (0 = fixed, non-zero = prescribed)
- z (optional): Z displacement value (0 = fixed, non-zero = prescribed)

Returns:
- success: Whether constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("Displacement")
- faceName: Face the constraint is applied to
- displacements: Object with x, y, z values
- analysisName: Name of the analysis
- message: Status message

Use this tool to constrain specific displacement components. Set a value to 0 to fix that direction, or use a non-zero value to prescribe a specific displacement.

Example:
- Fix only Z: { analysisName: "StaticAnalysis", faceReference: "Face1", z: 0 }
- Allow thermal expansion in Z: { analysisName: "StaticAnalysis", faceReference: "Face1", x: 0, y: 0, z: 0.01 }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
      faceReference: z.string().describe('Face reference to apply displacement to'),
      x: z.number().optional().describe('X displacement (0 = fixed)'),
      y: z.number().optional().describe('Y displacement (0 = fixed)'),
      z: z.number().optional().describe('Z displacement (0 = fixed)'),
    },
    async (input) => {
      const { analysisName, faceReference, x, y, z } = input;

      const code = `
from llm_bridge.fea_handlers import handle_add_fea_displacement_constraint
import json
params = json.loads('${JSON.stringify({ analysisName, faceReference, x, y, z })}')
result = handle_add_fea_displacement_constraint(
    analysis_name=params['analysisName'],
    face_name=params['faceReference'],
    x=params.get('x'),
    y=params.get('y'),
    z=params.get('z')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAConstraint(parsed.data);
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

function addFeaSelfWeightTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'add_fea_self_weight',
    `Add self-weight (gravity) constraint to the analysis.

Parameters:
- analysisName (required): Name of the analysis
- gravity (optional): Gravity acceleration in m/s^2 (default 9.81)

Returns:
- success: Whether constraint was added
- constraintName: Name of the created constraint
- constraintType: Type of constraint ("SelfWeight")
- gravity: Gravity value in m/s^2
- analysisName: Name of the analysis
- message: Status message

Use this tool to add gravitational loading to the entire model. The weight of the part itself creates the load.

Example:
- Add with default gravity: { analysisName: "StaticAnalysis" }
- Moon gravity: { analysisName: "StaticAnalysis", gravity: 1.62 }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
      gravity: z.number().optional().describe('Gravity in m/s^2 (default 9.81)'),
    },
    async (input) => {
      const { analysisName, gravity } = input;

      const code = `
from llm_bridge.fea_handlers import handle_add_fea_self_weight
import json
params = json.loads('${JSON.stringify({ analysisName, gravity })}')
result = handle_add_fea_self_weight(
    analysis_name=params['analysisName'],
    gravity=params.get('gravity', 9.81)
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAConstraint(parsed.data);
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

function listFeaConstraintsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_fea_constraints',
    `List all constraints in an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis

Returns:
- success: Whether listing succeeded
- analysisName: Name of the analysis
- constraintCount: Number of constraints
- constraints: Array of constraint objects with name, type, and properties
- message: Status message

Use this tool to see all boundary conditions and loads applied to an analysis.

Example:
- List constraints: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_list_fea_constraints
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_list_fea_constraints(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAConstraint(parsed.data);
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

function removeFeaConstraintTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'remove_fea_constraint',
    `Remove a constraint from an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis
- constraintName (required): Name of the constraint to remove

Returns:
- success: Whether removal succeeded
- removedConstraint: Name of removed constraint
- analysisName: Name of the analysis
- message: Status message

Use this tool to delete a boundary condition or load from an analysis.

Example:
- Remove constraint: { analysisName: "StaticAnalysis", constraintName: "ConstraintFixed" }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
      constraintName: z.string().describe('Name of the constraint to remove'),
    },
    async (input) => {
      const { analysisName, constraintName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_remove_fea_constraint
import json
params = json.loads('${JSON.stringify({ analysisName, constraintName })}')
result = handle_remove_fea_constraint(
    analysis_name=params['analysisName'],
    constraint_name=params['constraintName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? parsed.data?.message || 'Constraint removed' : `Error: ${parsed.error}`,
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

function checkFeaAnalysisStatusTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'check_fea_analysis_status',
    `Check the status of an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis

Returns:
- success: Whether status check succeeded
- analysisName: Name of the analysis
- status: Overall status ("Not configured", "Missing solver", "Ready to run", "Running", "Completed")
- solverStatus: Current solver status
- progress: Solver progress (0-100)
- hasMesh: Whether mesh exists
- hasSolver: Whether solver exists
- hasResults: Whether results exist
- isRunning: Whether analysis is currently running
- message: Status message

Use this tool to check if an analysis is ready to run or is currently running.

Example:
- Check status: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_check_fea_analysis_status
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_check_fea_analysis_status(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        return {
          content: [
            {
              type: 'text',
              text: parsed.success ? parsed.data?.message || 'Status checked' : `Error: ${parsed.error}`,
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

function setFeaSolverTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_fea_solver',
    `Set the solver type for an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis
- solverType (optional): Solver type ("calculix", "elmer", "z88", default "calculix")

Returns:
- success: Whether solver was set
- solverName: Name of the solver object
- solverType: Type of solver
- analysisName: Name of the analysis
- message: Status message

Use this tool to configure which solver to use for the analysis. CalculiX is the default and most commonly used.

Available solvers:
- calculix: Default solver, good for most static analysis
- elmer: Multi-physics solver
- z88: Fast solver for simple problems

Example:
- Set CalculiX: { analysisName: "StaticAnalysis" }
- Use Elmer: { analysisName: "StaticAnalysis", solverType: "elmer" }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
      solverType: z.enum(['calculix', 'elmer', 'z88']).optional().describe('Solver type'),
    },
    async (input) => {
      const { analysisName, solverType } = input;

      const code = `
from llm_bridge.fea_handlers import handle_set_fea_solver
import json
params = json.loads('${JSON.stringify({ analysisName, solverType })}')
result = handle_set_fea_solver(
    analysis_name=params['analysisName'],
    solver_type=params.get('solverType', 'calculix')
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEASolver(parsed.data);
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

function configureFeaSolverTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'configure_fea_solver',
    `Configure solver parameters for an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis
- config (required): Configuration dictionary with solver parameters

Returns:
- success: Whether configuration succeeded
- solverName: Name of the solver
- solverType: Type of solver
- appliedConfig: Dictionary of applied configuration parameters
- analysisName: Name of the analysis
- message: Status message

Use this tool to set advanced solver options. Common parameters include:
- analysis_type: "static", "frequency", "thermomechanical"
- working_dir: Directory for solver files

Example:
- Set static analysis: { analysisName: "StaticAnalysis", config: {"analysis_type": "static"} }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
      config: z.record(z.string(), z.any()).describe('Configuration dictionary'),
    },
    async (input) => {
      const { analysisName, config } = input;

      const code = `
from llm_bridge.fea_handlers import handle_configure_fea_solver
import json
params = json.loads('${JSON.stringify({ analysisName, config })}')
result = handle_configure_fea_solver(
    analysis_name=params['analysisName'],
    config=params['config']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEASolver(parsed.data);
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

function getFeaSolverStatusTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_fea_solver_status',
    `Get the current solver status for an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis

Returns:
- success: Whether query succeeded
- solverName: Name of the solver
- solverType: Type of solver
- status: Current solver status
- analysisName: Name of the analysis
- message: Status message

Use this tool to check if a solver is configured and ready, or if an analysis is currently running.

Example:
- Get status: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_get_fea_solver_status
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_get_fea_solver_status(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEASolver(parsed.data);
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

function runFeaAnalysisTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'run_fea_analysis',
    `Run the FEA analysis.

Parameters:
- analysisName (required): Name of the analysis to run

Returns:
- success: Whether analysis started successfully
- analysisName: Name of the analysis
- solverName: Name of the solver used
- resultCount: Number of result objects created
- resultNames: Names of result objects
- message: Status message

Use this tool to execute the finite element analysis. The solver will compute displacement, stress, and strain results based on the mesh, material, and boundary conditions.

Example:
- Run analysis: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis to run'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_run_fea_analysis
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_run_fea_analysis(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAResults(parsed.data);
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

function stopFeaAnalysisTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'stop_fea_analysis',
    `Stop a running FEA analysis.

Parameters:
- analysisName (required): Name of the analysis to stop

Returns:
- success: Whether stop was requested
- analysisName: Name of the analysis
- solverName: Name of the solver
- message: Status message

Use this tool to cancel a running analysis. Results computed so far may be available.

Example:
- Stop analysis: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis to stop'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_stop_fea_analysis
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_stop_fea_analysis(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAResults(parsed.data);
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

function getFeaDisplacementTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_fea_displacement',
    `Get displacement results from an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis

Returns:
- success: Whether results were retrieved
- analysisName: Name of the analysis
- resultName: Name of the result object
- displacementCount: Number of displacement values
- displacements: Array of displacement vectors (x, y, z)
- maxDisplacement: Maximum displacement magnitude
- message: Status message

Use this tool to retrieve nodal displacement results. Displacement shows how much the structure deforms under load.

Example:
- Get displacements: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_get_fea_displacement
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_get_fea_displacement(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAResults(parsed.data);
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

function getFeaStressTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_fea_stress',
    `Get stress results (von Mises) from an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis

Returns:
- success: Whether results were retrieved
- analysisName: Name of the analysis
- resultName: Name of the result object
- stressCount: Number of stress values
- stresses: Array of stress vectors (x, y, z)
- maxVonMises: Maximum von Mises stress
- message: Status message

Use this tool to retrieve stress results. Von Mises stress is compared to yield strength to check for plastic failure.

Example:
- Get stresses: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_get_fea_stress
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_get_fea_stress(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAResults(parsed.data);
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

function getFeaReactionsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_fea_reactions',
    `Get reaction forces from an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis

Returns:
- success: Whether results were retrieved
- analysisName: Name of the analysis
- resultName: Name of the result object
- reactionCount: Number of reaction forces
- reactions: Array of reaction force vectors (x, y, z)
- totalForce: Sum of all reaction forces
- message: Status message

Use this tool to retrieve reaction forces at constraint locations. Reactions should balance applied loads for a valid analysis.

Example:
- Get reactions: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_get_fea_reactions
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_get_fea_reactions(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAResults(parsed.data);
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

function getFeaStrainTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_fea_strain',
    `Get strain results from an FEA analysis.

Parameters:
- analysisName (required): Name of the analysis

Returns:
- success: Whether retrieval succeeded
- strainCount: Number of strain values
- strains: Array of strain vectors (x, y, z components)
- maxStrain: Maximum equivalent strain (Peeq)
- minStrain: Minimum strain value
- message: Status message

Use this tool to retrieve strain results after running an FEA analysis. Strain results show how much the material deforms under load.

Example:
- Get strain: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_get_fea_strain
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_get_fea_strain(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAResults(parsed.data);
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

function getFeaResultSummaryTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_fea_result_summary',
    `Get a comprehensive summary of all FEA results.

Parameters:
- analysisName (required): Name of the analysis

Returns:
- success: Whether retrieval succeeded
- maxDisplacement: Maximum displacement (mm)
- maxVonMisesStress: Maximum von Mises stress (MPa)
- maxEquivalentStrain: Maximum equivalent strain
- totalReactionForce: Sum of reaction forces (x, y, z in N)
- meshNodeCount: Number of mesh nodes
- meshElementCount: Number of mesh elements
- material: Material properties used
- conclusion: Engineering conclusion with safety factor estimate
- message: Status message

Use this tool to get a complete overview of analysis results including displacement, stress, strain, and reaction forces with engineering interpretation.

Example:
- Get summary: { analysisName: "StaticAnalysis" }`,
    {
      analysisName: z.string().describe('Name of the analysis'),
    },
    async (input) => {
      const { analysisName } = input;

      const code = `
from llm_bridge.fea_handlers import handle_get_fea_result_summary
import json
params = json.loads('${JSON.stringify({ analysisName })}')
result = handle_get_fea_result_summary(
    analysis_name=params['analysisName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatFEAResults(parsed.data);
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

function createPathJobTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_path_job',
    `Create a new Path Job from a base model object.

Parameters:
- modelObject (required): Name of the base model object (e.g., "Body001")
- name (optional): Name for the new Path Job. If omitted, auto-generated.

Returns:
- success: Whether the job was created
- jobName: Internal name of the job
- jobLabel: User-friendly label
- toolController: Name of default tool controller
- message: Status message

Use this tool to create a new CNC machining job from a solid model. The job will include default tool controller and stock settings.

Example:
- Create job from body: { modelObject: "Body001" }
- Create named job: { modelObject: "Body001", name: "CNCJob1" }`,
    {
      modelObject: z.string().describe('Name of the base model object'),
      name: z.string().optional().describe('Name for the new Path Job'),
    },
    async (input) => {
      const { modelObject, name } = input;

      const code = `
from llm_bridge.path_handlers import handle_create_path_job
import json
params = json.loads('${JSON.stringify({ modelObject, name: name || null })}')
result = handle_create_path_job(
    model_object=params['modelObject'],
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathJobCreation(parsed.data);
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

function configurePathJobTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'configure_path_job',
    `Configure an existing Path Job with tool controller and stock settings.

Parameters:
- jobName (required): Name of the Path Job to configure
- toolController (optional): Name of the tool controller to use
- stock (optional): Stock specification (e.g., "0,0,0,100,100,50" for bounding box)

Returns:
- success: Whether the job was configured
- jobName: Name of the configured job
- toolController: Tool controller in use
- stock: Stock settings
- message: Status message

Use this tool to set up tool controller and stock for a Path Job.

Example:
- Configure job: { jobName: "Job", toolController: "TC1", stock: "0,0,0,100,100,50" }`,
    {
      jobName: z.string().describe('Name of the Path Job to configure'),
      toolController: z.string().optional().describe('Name of the tool controller'),
      stock: z.string().optional().describe('Stock specification'),
    },
    async (input) => {
      const { jobName, toolController, stock } = input;

      const code = `
from llm_bridge.path_handlers import handle_configure_path_job
import json
params = json.loads('${JSON.stringify({ jobName, toolController: toolController || null, stock: stock || null })}')
result = handle_configure_path_job(
    job_name=params['jobName'],
    tool_controller=params['toolController'],
    stock=params['stock']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathJobCreation(parsed.data);
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

function deletePathJobTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'delete_path_job',
    `Delete a Path Job from the document.

Parameters:
- jobName (required): Name of the Path Job to delete

Returns:
- success: Whether the job was deleted
- jobName: Name of the deleted job
- message: Status message

Use this tool to remove an unwanted Path Job.

Example:
- Delete job: { jobName: "Job" }`,
    {
      jobName: z.string().describe('Name of the Path Job to delete'),
    },
    async (input) => {
      const { jobName } = input;

      const code = `
from llm_bridge.path_handlers import handle_delete_path_job
import json
params = json.loads('${JSON.stringify({ jobName })}')
result = handle_delete_path_job(
    job_name=params['jobName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathJobCreation(parsed.data);
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

function listPathJobsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_path_jobs',
    `List all Path Jobs in the active document.

Returns:
- success: Whether the query was successful
- jobCount: Number of jobs found
- jobs: Array of job objects with name, label, operation count, and status
- message: Status message

Use this tool to see all available Path Jobs before creating or modifying operations.

Example:
- List jobs: {}`,
    {
    },
    async () => {
      const code = `
from llm_bridge.path_handlers import handle_list_path_jobs
import json
result = handle_list_path_jobs()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathJobList(parsed.data);
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

function createPathToolTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_path_tool',
    `Create a new Path Tool definition.

Parameters:
- name (required): Name for the tool
- toolType (required): Tool type - "endmill", "ball_endmill", "chamfer", "v-bit", "drill", "tap"
- diameter (required): Tool diameter (e.g., 10 for 10mm)
- cuttingEdgeAngle (optional): Cutting edge angle in degrees (for chamfer/v-bit)

Returns:
- success: Whether the tool was created
- toolName: Internal name of the tool
- toolLabel: User-friendly label
- diameter: Tool diameter
- message: Status message

Use this tool to define cutting tools for CNC operations.

Example:
- Create endmill: { name: "10mm Endmill", toolType: "endmill", diameter: 10 }
- Create ball endmill: { name: "6mm Ball", toolType: "ball_endmill", diameter: 6 }
- Create chamfer: { name: "Chamfer 90", toolType: "chamfer", diameter: 10, cuttingEdgeAngle: 90 }`,
    {
      name: z.string().describe('Name for the tool'),
      toolType: z.enum(['endmill', 'ball_endmill', 'chamfer', 'v-bit', 'drill', 'tap']).describe('Tool type'),
      diameter: z.number().describe('Tool diameter'),
      cuttingEdgeAngle: z.number().optional().describe('Cutting edge angle in degrees'),
    },
    async (input) => {
      const { name, toolType, diameter, cuttingEdgeAngle } = input;

      const code = `
from llm_bridge.path_handlers import handle_create_path_tool
import json
params = json.loads('${JSON.stringify({ name, toolType, diameter, cuttingEdgeAngle: cuttingEdgeAngle || null })}')
result = handle_create_path_tool(
    name=params['name'],
    tool_type=params['toolType'],
    diameter=params['diameter'],
    cutting_edge_angle=params['cuttingEdgeAngle']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathToolCreation(parsed.data);
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

function createPathToolbitTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_path_toolbit',
    `Create a Path ToolBit from geometry.

Parameters:
- geometry (required): Tool bit geometry specification
  - type: "cylinder" or "cone"
  - diameter: Diameter for cylinder (required for cylinder)
  - tipDiameter: Tip diameter (required for cone)
  - length: Tool length
  - cuttingEdgeLength: Length of cutting edge
- name (optional): Name for the tool bit. If omitted, auto-generated.

Returns:
- success: Whether the tool bit was created
- toolbitName: Internal name of the tool bit
- toolbitLabel: User-friendly label
- geometry: Geometry parameters used
- message: Status message

Use this tool to create custom tool definitions from geometric shapes.

Example:
- Cylinder tool: { geometry: { type: "cylinder", diameter: 10, length: 50, cuttingEdgeLength: 20 } }
- Cone tool: { geometry: { type: "cone", tipDiameter: 5, diameter: 10, length: 50, cuttingEdgeLength: 20 } }`,
    {
      geometry: z.object({
        type: z.enum(['cylinder', 'cone']).describe('Tool bit geometry type'),
        diameter: z.number().optional().describe('Diameter for cylinder type'),
        tipDiameter: z.number().optional().describe('Tip diameter for cone type'),
        length: z.number().describe('Tool length'),
        cuttingEdgeLength: z.number().describe('Length of cutting edge'),
      }).describe('Tool bit geometry specification'),
      name: z.string().optional().describe('Name for the tool bit'),
    },
    async (input) => {
      const { geometry, name } = input;

      const code = `
from llm_bridge.path_handlers import handle_create_path_toolbit
import json
params = json.loads('${JSON.stringify({ geometry, name: name || null })}')
result = handle_create_path_toolbit(
    geometry=params['geometry'],
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathToolCreation(parsed.data);
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

function createToolControllerTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_tool_controller',
    `Create a Tool Controller for a Path Job.

Parameters:
- jobName (required): Name of the Path Job
- tool (required): Name of the tool or tool bit to use
- speed (optional): Spindle speed in RPM (e.g., 3000)
- feedRate (optional): Feed rate (e.g., "500" or "500mm/min")

Returns:
- success: Whether the tool controller was created
- toolControllerName: Internal name of the tool controller
- jobName: Name of the parent job
- tool: Tool being used
- speed: Spindle speed
- feedRate: Feed rate
- message: Status message

Use this tool to add a tool with cutting parameters to a Path Job.

Example:
- Create controller: { jobName: "Job", tool: "10mm Endmill", speed: 3000, feedRate: "500mm/min" }`,
    {
      jobName: z.string().describe('Name of the Path Job'),
      tool: z.string().describe('Name of the tool or tool bit'),
      speed: z.number().optional().describe('Spindle speed in RPM'),
      feedRate: z.union([z.string(), z.number()]).optional().describe('Feed rate'),
    },
    async (input) => {
      const { jobName, tool, speed, feedRate } = input;

      const code = `
from llm_bridge.path_handlers import handle_create_tool_controller
import json
params = json.loads('${JSON.stringify({ jobName, tool, speed: speed || null, feedRate: feedRate || null })}')
result = handle_create_tool_controller(
    job_name=params['jobName'],
    tool=params['tool'],
    speed=params['speed'],
    feed_rate=params['feedRate']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathToolCreation(parsed.data);
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

function listPathToolsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_path_tools',
    `List all Path Tools in the active document.

Returns:
- success: Whether the query was successful
- toolCount: Number of tools found
- tools: Array of tool objects with name, label, type, and diameter
- message: Status message

Use this tool to see all available tools before creating operations.

Example:
- List tools: {}`,
    {
    },
    async () => {
      const code = `
from llm_bridge.path_handlers import handle_list_path_tools
import json
result = handle_list_path_tools()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathToolList(parsed.data);
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

function createPathProfileTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_path_profile',
    `Create a Profile operation on edges of a model.

Parameters:
- baseObject (required): Name of the base model object
- jobName (optional): Name of the Path Job to add operation to
- name (optional): Name for the profile operation. If omitted, auto-generated.
- offsetSide (optional): Side to profile - "outside", "inside", "on" (default: "outside")

Returns:
- success: Whether the operation was created
- operationName: Internal name of the operation
- operationLabel: User-friendly label
- jobName: Name of the parent job
- baseObject: Base model object
- message: Status message

Use this tool to create a contour profile along edges of a model.

Example:
- Profile outside: { baseObject: "Body001", jobName: "Job", offsetSide: "outside" }
- Profile inside: { baseObject: "Body001", jobName: "Job", offsetSide: "inside" }`,
    {
      baseObject: z.string().describe('Name of the base model object'),
      jobName: z.string().optional().describe('Name of the Path Job'),
      name: z.string().optional().describe('Name for the profile operation'),
      offsetSide: z.enum(['outside', 'inside', 'on']).optional().describe('Side to profile'),
    },
    async (input) => {
      const { baseObject, jobName, name, offsetSide } = input;

      const code = `
from llm_bridge.path_handlers import handle_create_path_profile
import json
params = json.loads('${JSON.stringify({ baseObject, jobName: jobName || null, name: name || null, offsetSide: offsetSide || 'outside' })}')
result = handle_create_path_profile(
    base_object=params['baseObject'],
    job_name=params['jobName'],
    name=params['name'],
    offset_side=params['offsetSide']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathOperation(parsed.data);
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

function createPathPocketTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_path_pocket',
    `Create a Pocket operation inside a boundary.

Parameters:
- baseObject (required): Name of the base model object or face
- jobName (optional): Name of the Path Job to add operation to
- name (optional): Name for the pocket operation. If omitted, auto-generated.

Returns:
- success: Whether the operation was created
- operationName: Internal name of the operation
- operationLabel: User-friendly label
- jobName: Name of the parent job
- baseObject: Base model object or face
- message: Status message

Use this tool to create a pocketing operation to clear material inside a boundary.

Example:
- Pocket operation: { baseObject: "Body001.Face5", jobName: "Job" }`,
    {
      baseObject: z.string().describe('Name of the base model object or face'),
      jobName: z.string().optional().describe('Name of the Path Job'),
      name: z.string().optional().describe('Name for the pocket operation'),
    },
    async (input) => {
      const { baseObject, jobName, name } = input;

      const code = `
from llm_bridge.path_handlers import handle_create_path_pocket
import json
params = json.loads('${JSON.stringify({ baseObject, jobName: jobName || null, name: name || null })}')
result = handle_create_path_pocket(
    base_object=params['baseObject'],
    job_name=params['jobName'],
    name=params['name']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathOperation(parsed.data);
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

function createPathDrillTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_path_drill',
    `Create a Drill operation at point locations.

Parameters:
- centers (required): Array of center points for drill operations [{x, y, z}, ...]
- jobName (optional): Name of the Path Job to add operation to
- name (optional): Name for the drill operation. If omitted, auto-generated.
- cycle (optional): Drill cycle - " drilling", " peck", " deep", " break", " tap" (default: "drilling")

Returns:
- success: Whether the operation was created
- operationName: Internal name of the operation
- operationLabel: User-friendly label
- jobName: Name of the parent job
- centerCount: Number of drill points
- message: Status message

Use this tool to create drilling operations at specified locations.

Example:
- Drill holes: { centers: [{x: 10, y: 10, z: 0}, {x: 50, y: 50, z: 0}], jobName: "Job" }`,
    {
      centers: z.array(z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      })).describe('Array of center points for drill operations'),
      jobName: z.string().optional().describe('Name of the Path Job'),
      name: z.string().optional().describe('Name for the drill operation'),
      cycle: z.enum(['drilling', 'peck', 'deep', 'break', 'tap']).optional().describe('Drill cycle type'),
    },
    async (input) => {
      const { centers, jobName, name, cycle } = input;

      const code = `
from llm_bridge.path_handlers import handle_create_path_drill
import json
params = json.loads('${JSON.stringify({ centers, jobName: jobName || null, name: name || null, cycle: cycle || 'drilling' })}')
result = handle_create_path_drill(
    centers=params['centers'],
    job_name=params['jobName'],
    name=params['name'],
    cycle=params['cycle']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathOperation(parsed.data);
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

function createPathFaceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_path_face',
    `Create a Face operation on a surface.

Parameters:
- baseObject (required): Name of the base model object or face
- jobName (optional): Name of the Path Job to add operation to
- name (optional): Name for the face operation. If omitted, auto-generated.
- cutClamp (optional): Maximum distance from face to cut (default: 1.0)

Returns:
- success: Whether the operation was created
- operationName: Internal name of the operation
- operationLabel: User-friendly label
- jobName: Name of the parent job
- baseObject: Base model object or face
- message: Status message

Use this tool to create a face milling operation on a planar surface.

Example:
- Face top: { baseObject: "Body001.Face6", jobName: "Job" }`,
    {
      baseObject: z.string().describe('Name of the base model object or face'),
      jobName: z.string().optional().describe('Name of the Path Job'),
      name: z.string().optional().describe('Name for the face operation'),
      cutClamp: z.number().optional().describe('Maximum distance from face to cut'),
    },
    async (input) => {
      const { baseObject, jobName, name, cutClamp } = input;

      const code = `
from llm_bridge.path_handlers import handle_create_path_face
import json
params = json.loads('${JSON.stringify({ baseObject, jobName: jobName || null, name: name || null, cutClamp: cutClamp || null })}')
result = handle_create_path_face(
    base_object=params['baseObject'],
    job_name=params['jobName'],
    name=params['name'],
    cut_clamp=params['cutClamp']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathOperation(parsed.data);
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

function createPathDressupRadiusTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_path_dressup_radius',
    `Add radius compensation (corner radius) dressup to a path operation.

Parameters:
- jobName (required): Name of the Path Job or operation to dress up
- radiusCompensation (optional): Enable radius compensation (default: true)
- radius (optional): Corner radius value

Returns:
- success: Whether the dressup was created
- dressupName: Internal name of the dressup
- dressupLabel: User-friendly label
- baseOperation: Name of the base operation
- parameters: Dressup parameters
- message: Status message

Use this tool to add corner radius compensation to compensate for tool diameter.

Example:
- Add radius dressup: { jobName: "Profile" }`,
    {
      jobName: z.string().describe('Name of the Path Job or operation'),
      radiusCompensation: z.boolean().optional().describe('Enable radius compensation'),
      radius: z.number().optional().describe('Corner radius value'),
    },
    async (input) => {
      const { jobName, radiusCompensation, radius } = input;

      const code = `
from llm_bridge.path_handlers import handle_create_path_dressup_radius
import json
params = json.loads('${JSON.stringify({ jobName, radiusCompensation: radiusCompensation !== false, radius: radius || null })}')
result = handle_create_path_dressup_radius(
    job_name=params['jobName'],
    radius_compensation=params['radiusCompensation'],
    radius=params['radius']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathDressup(parsed.data);
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

function createPathDressupTagTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_path_dressup_tag',
    `Add holding tag dressup to a path operation.

Parameters:
- jobName (required): Name of the Path Job or operation to dress up
- tagWidth (optional): Width of holding tags (default: 5)
- tagHeight (optional): Height of holding tags (default: 2)
- tagSpacing (optional): Spacing between tags

Returns:
- success: Whether the dressup was created
- dressupName: Internal name of the dressup
- dressupLabel: User-friendly label
- baseOperation: Name of the base operation
- parameters: Dressup parameters
- message: Status message

Use this tool to add holding tags to keep parts attached during machining.

Example:
- Add tags: { jobName: "Profile", tagWidth: 5, tagHeight: 2 }`,
    {
      jobName: z.string().describe('Name of the Path Job or operation'),
      tagWidth: z.number().optional().describe('Width of holding tags'),
      tagHeight: z.number().optional().describe('Height of holding tags'),
      tagSpacing: z.number().optional().describe('Spacing between tags'),
    },
    async (input) => {
      const { jobName, tagWidth, tagHeight, tagSpacing } = input;

      const code = `
from llm_bridge.path_handlers import handle_create_path_dressup_tag
import json
params = json.loads('${JSON.stringify({ jobName, tagWidth: tagWidth || null, tagHeight: tagHeight || null, tagSpacing: tagSpacing || null })}')
result = handle_create_path_dressup_tag(
    job_name=params['jobName'],
    tag_width=params['tagWidth'],
    tag_height=params['tagHeight'],
    tag_spacing=params['tagSpacing']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathDressup(parsed.data);
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

function createPathDressupLeadOffTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_path_dressup_leadoff',
    `Add lead-in/lead-out dressup to a path operation.

Parameters:
- jobName (required): Name of the Path Job or operation to dress up
- leadIn (optional): Lead-in specification { length, radius, angle }
- leadOut (optional): Lead-out specification { length, radius, angle }

Returns:
- success: Whether the dressup was created
- dressupName: Internal name of the dressup
- dressupLabel: User-friendly label
- baseOperation: Name of the base operation
- parameters: Dressup parameters
- message: Status message

Use this tool to add lead-in and lead-out moves for smoother tool entry/exit.

Example:
- Add lead off: { jobName: "Profile", leadIn: { length: 10, radius: 5, angle: 90 } }`,
    {
      jobName: z.string().describe('Name of the Path Job or operation'),
      leadIn: z.object({
        length: z.number(),
        radius: z.number(),
        angle: z.number(),
      }).optional().describe('Lead-in specification'),
      leadOut: z.object({
        length: z.number(),
        radius: z.number(),
        angle: z.number(),
      }).optional().describe('Lead-out specification'),
    },
    async (input) => {
      const { jobName, leadIn, leadOut } = input;

      const code = `
from llm_bridge.path_handlers import handle_create_path_dressup_leadoff
import json
params = json.loads('${JSON.stringify({ jobName, leadIn: leadIn || null, leadOut: leadOut || null })}')
result = handle_create_path_dressup_leadoff(
    job_name=params['jobName'],
    lead_in=params['leadIn'],
    lead_out=params['leadOut']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathDressup(parsed.data);
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

function exportGCodeTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'export_gcode',
    `Export G-code from a Path Job.

Parameters:
- jobName (required): Name of the Path Job to export
- filePath (required): Output file path (e.g., "/path/to/output.nc")

Returns:
- success: Whether the export was successful
- filePath: Output file path
- lineCount: Number of G-code lines
- toolChanges: Number of tool changes
- rapidMoves: Number of rapid moves
- feedMoves: Number of feed moves
- message: Status message

Use this tool to generate G-code output from a Path Job for CNC machining.

Example:
- Export G-code: { jobName: "Job", filePath: "/tmp/cnc_program.nc" }`,
    {
      jobName: z.string().describe('Name of the Path Job to export'),
      filePath: z.string().describe('Output file path'),
    },
    async (input) => {
      const { jobName, filePath } = input;

      const code = `
from llm_bridge.path_handlers import handle_export_gcode
import json
params = json.loads('${JSON.stringify({ jobName, filePath })}')
result = handle_export_gcode(
    job_name=params['jobName'],
    file_path=params['filePath']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatGCodeExport(parsed.data);
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

function simulatePathTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'simulate_path',
    `Get path simulation data for a Path Job.

Parameters:
- jobName (required): Name of the Path Job to simulate

Returns:
- success: Whether the simulation was successful
- jobName: Name of the job
- duration: Estimated machining duration in seconds
- toolpathLength: Total toolpath length
- rapidLength: Total rapid move length
- feedLength: Total feed move length
- toolChanges: Number of tool changes
- message: Status message

Use this tool to get simulation statistics for a Path Job.

Example:
- Simulate path: { jobName: "Job" }`,
    {
      jobName: z.string().describe('Name of the Path Job to simulate'),
    },
    async (input) => {
      const { jobName } = input;

      const code = `
from llm_bridge.path_handlers import handle_simulate_path
import json
params = json.loads('${JSON.stringify({ jobName })}')
result = handle_simulate_path(
    job_name=params['jobName']
)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatPathSimulation(parsed.data);
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
// Undo/Redo Tools
// ============================================================================

function createUndoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'undo',
    `Undo the last operation in the FreeCAD document.

Returns:
- success: Whether the undo was successful
- undoneObject: Name of the object that was undone (if any)
- message: Status message

Use this tool when you make a mistake and need to revert the last change.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.workflow_handlers import handle_undo
import json
result = handle_undo()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatUndoResult(parsed.data);
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

function createRedoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'redo',
    `Redo the last undone operation in the FreeCAD document.

Returns:
- success: Whether the redo was successful
- redoneObject: Name of the object that was redone (if any)
- message: Status message

Use this tool when you want to reapply a change that was previously undone.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.workflow_handlers import handle_redo
import json
result = handle_redo()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatRedoResult(parsed.data);
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

function getUndoStackSizeTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_undo_stack_size',
    `Get the current size of the undo and redo stacks.

Returns:
- success: Whether the query was successful
- undoSize: Number of operations in the undo stack
- redoSize: Number of operations in the redo stack
- canUndo: Whether undo is available
- canRedo: Whether redo is available
- message: Status message

Use this tool to check if undo/redo is available before attempting operations.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.workflow_handlers import handle_get_undo_stack_size
import json
result = handle_get_undo_stack_size()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatUndoStackSize(parsed.data);
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
// Visibility Tools
// ============================================================================

function showObjectTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'show_object',
    `Show a hidden object in the FreeCAD viewport.

Parameters:
- objectName (required): Name of the object to show

Returns:
- success: Whether the operation was successful
- objectName: Name of the object
- visible: Always true for this operation
- message: Status message

Use this tool to make a hidden object visible again.`,
    {
      objectName: z.string().describe('Name of the object to show'),
    },
    async (input) => {
      const { objectName } = input;

      const code = `
from llm_bridge.workflow_handlers import handle_show_object
import json
params = json.loads('${JSON.stringify({ objectName })}')
result = handle_show_object(object_name=params['objectName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatVisibilityChange(parsed.data);
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

function hideObjectTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'hide_object',
    `Hide an object in the FreeCAD viewport.

Parameters:
- objectName (required): Name of the object to hide

Returns:
- success: Whether the operation was successful
- objectName: Name of the object
- visible: Always false for this operation
- message: Status message

Use this tool to hide an object without deleting it.`,
    {
      objectName: z.string().describe('Name of the object to hide'),
    },
    async (input) => {
      const { objectName } = input;

      const code = `
from llm_bridge.workflow_handlers import handle_hide_object
import json
params = json.loads('${JSON.stringify({ objectName })}')
result = handle_hide_object(object_name=params['objectName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatVisibilityChange(parsed.data);
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

function toggleVisibilityTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'toggle_object_visibility',
    `Toggle the visibility of an object in the FreeCAD viewport.

Parameters:
- objectName (required): Name of the object to toggle

Returns:
- success: Whether the operation was successful
- objectName: Name of the object
- visible: New visibility state after toggle
- message: Status message

Use this tool to quickly toggle an object's visibility.`,
    {
      objectName: z.string().describe('Name of the object to toggle visibility'),
    },
    async (input) => {
      const { objectName } = input;

      const code = `
from llm_bridge.workflow_handlers import handle_toggle_visibility
import json
params = json.loads('${JSON.stringify({ objectName })}')
result = handle_toggle_visibility(object_name=params['objectName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatVisibilityChange(parsed.data);
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

function showAllObjectsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'show_all_objects',
    `Show all hidden objects in the FreeCAD viewport.

Returns:
- success: Whether the operation was successful
- count: Number of objects shown
- message: Status message

Use this tool to make all hidden objects visible at once.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.workflow_handlers import handle_show_all
import json
result = handle_show_all()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatVisibilityChange(parsed.data);
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

function hideAllObjectsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'hide_all_objects',
    `Hide all visible objects in the FreeCAD viewport.

Returns:
- success: Whether the operation was successful
- count: Number of objects hidden
- message: Status message

Use this tool to hide all visible objects at once.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.workflow_handlers import handle_hide_all
import json
result = handle_hide_all()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatVisibilityChange(parsed.data);
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

function getVisibleObjectsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_visible_objects',
    `Get a list of all currently visible objects in the FreeCAD viewport.

Returns:
- success: Whether the query was successful
- count: Number of visible objects
- objects: Array of visible object info (name, label, type)
- message: Status message

Use this tool to see which objects are currently visible.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.workflow_handlers import handle_get_visible_objects
import json
result = handle_get_visible_objects()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatVisibleObjectsList(parsed.data);
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

function setObjectVisibilityTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_object_visibility',
    `Set the visibility of an object to a specific state.

Parameters:
- objectName (required): Name of the object
- visible (required): Whether the object should be visible (true) or hidden (false)

Returns:
- success: Whether the operation was successful
- objectName: Name of the object
- visible: The new visibility state
- message: Status message

Use this tool to explicitly show or hide an object.`,
    {
      objectName: z.string().describe('Name of the object'),
      visible: z.boolean().describe('Whether the object should be visible'),
    },
    async (input) => {
      const { objectName, visible } = input;

      const code = `
from llm_bridge.workflow_handlers import handle_set_object_visibility
import json
params = json.loads('${JSON.stringify({ objectName, visible })}')
result = handle_set_object_visibility(object_name=params['objectName'], visible=params['visible'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatVisibilityChange(parsed.data);
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
// Selection Tools
// ============================================================================

function selectObjectTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'select_object',
    `Select an object in the FreeCAD viewport.

Parameters:
- objectName (required): Name of the object to select

Returns:
- success: Whether the selection was successful
- objectName: Name of the selected object
- selected: Always true for this operation
- message: Status message

Use this tool to select an object for subsequent operations.`,
    {
      objectName: z.string().describe('Name of the object to select'),
    },
    async (input) => {
      const { objectName } = input;

      const code = `
from llm_bridge.workflow_handlers import handle_select_object
import json
params = json.loads('${JSON.stringify({ objectName })}')
result = handle_select_object(object_name=params['objectName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSelectionChange(parsed.data);
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

function deselectObjectTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'deselect_object',
    `Deselect an object in the FreeCAD viewport.

Parameters:
- objectName (required): Name of the object to deselect

Returns:
- success: Whether the deselection was successful
- objectName: Name of the deselected object
- selected: Always false for this operation
- message: Status message

Use this tool to remove an object from the current selection.`,
    {
      objectName: z.string().describe('Name of the object to deselect'),
    },
    async (input) => {
      const { objectName } = input;

      const code = `
from llm_bridge.workflow_handlers import handle_deselect_object
import json
params = json.loads('${JSON.stringify({ objectName })}')
result = handle_deselect_object(object_name=params['objectName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSelectionChange(parsed.data);
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

function selectAllObjectsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'select_all_objects',
    `Select all objects in the FreeCAD viewport.

Returns:
- success: Whether the selection was successful
- count: Number of objects selected
- message: Status message

Use this tool to select all objects at once.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.workflow_handlers import handle_select_all
import json
result = handle_select_all()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSelectionChange(parsed.data);
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

function clearSelectionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'clear_selection',
    `Clear the current selection in the FreeCAD viewport.

Returns:
- success: Whether the operation was successful
- count: Number of objects that were deselected
- message: Status message

Use this tool to deselect all currently selected objects.`,
    {
      // No parameters needed
    },
    async () => {
      const code = `
from llm_bridge.workflow_handlers import handle_clear_selection
import json
result = handle_clear_selection()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSelectionChange(parsed.data);
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

function isObjectSelectedTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'is_object_selected',
    `Check if a specific object is currently selected.

Parameters:
- objectName (required): Name of the object to check

Returns:
- success: Whether the query was successful
- objectName: Name of the checked object
- selected: Whether the object is currently selected
- message: Status message

Use this tool to check the selection state of an object.`,
    {
      objectName: z.string().describe('Name of the object to check'),
    },
    async (input) => {
      const { objectName } = input;

      const code = `
from llm_bridge.workflow_handlers import handle_is_selected
import json
params = json.loads('${JSON.stringify({ objectName })}')
result = handle_is_selected(object_name=params['objectName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatSelectionChange(parsed.data);
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
// Measurement Tools
// ============================================================================

function measureDistanceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'measure_distance',
    `Measure the distance between two points in 3D space.

Parameters:
- point1 (required): First point as {x, y, z}
- point2 (required): Second point as {x, y, z}

Returns:
- success: Whether the measurement was successful
- measurementType: "distance"
- value: The distance value
- point1: First point coordinates
- point2: Second point coordinates
- message: Status message

Use this tool to get the distance between two 3D coordinates.`,
    {
      point1: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }).describe('First point coordinates'),
      point2: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }).describe('Second point coordinates'),
    },
    async (input) => {
      const { point1, point2 } = input;

      const code = `
from llm_bridge.measurement_handlers import handle_measure_distance
import json
params = json.loads('${JSON.stringify({ point1, point2 })}')
result = handle_measure_distance(point1=params['point1'], point2=params['point2'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatDistanceMeasurement(parsed.data);
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

function measureObjectDistanceTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'measure_object_distance',
    `Measure the minimum distance between two objects.

Parameters:
- object1Name (required): Name of the first object
- object2Name (required): Name of the second object

Returns:
- success: Whether the measurement was successful
- measurementType: "object_distance"
- value: The minimum distance between objects
- object1: Name of first object
- object2: Name of second object
- message: Status message

Use this tool to find the closest points between two 3D objects.`,
    {
      object1Name: z.string().describe('Name of the first object'),
      object2Name: z.string().describe('Name of the second object'),
    },
    async (input) => {
      const { object1Name, object2Name } = input;

      const code = `
from llm_bridge.measurement_handlers import handle_measure_object_distance
import json
params = json.loads('${JSON.stringify({ object1Name, object2Name })}')
result = handle_measure_object_distance(obj1_name=params['object1Name'], obj2_name=params['object2Name'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatDistanceMeasurement(parsed.data);
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

function measureAngleTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'measure_angle',
    `Measure the angle at a vertex formed by three points.

Parameters:
- point1 (required): First point as {x, y, z}
- point2 (required): Vertex point as {x, y, z} (the angle is measured here)
- point3 (required): Third point as {x, y, z}

Returns:
- success: Whether the measurement was successful
- measurementType: "angle"
- value: The angle in degrees
- point1, point2, point3: The three points
- vertex: The vertex point (point2)
- message: Status message

Use this tool to measure the angle between two lines meeting at a point.`,
    {
      point1: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }).describe('First point'),
      point2: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }).describe('Vertex point (angle is measured here)'),
      point3: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }).describe('Third point'),
    },
    async (input) => {
      const { point1, point2, point3 } = input;

      const code = `
from llm_bridge.measurement_handlers import handle_measure_angle
import json
params = json.loads('${JSON.stringify({ point1, point2, point3 })}')
result = handle_measure_angle(point1=params['point1'], point2=params['point2'], point3=params['point3'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatAngleMeasurement(parsed.data);
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

function measureLengthTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'measure_length',
    `Get the length of a line, wire, or edge object.

Parameters:
- objectName (required): Name of the line, wire, or edge object

Returns:
- success: Whether the measurement was successful
- measurementType: "length"
- value: The length value in mm
- objectName: Name of the measured object
- message: Status message

Use this tool to get the length of linear geometry.`,
    {
      objectName: z.string().describe('Name of the line, wire, or edge object'),
    },
    async (input) => {
      const { objectName } = input;

      const code = `
from llm_bridge.measurement_handlers import handle_measure_length
import json
params = json.loads('${JSON.stringify({ objectName })}')
result = handle_measure_length(object_name=params['objectName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeasurement(parsed.data);
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

function measureAreaTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'measure_area',
    `Get the surface area of a face or object.

Parameters:
- objectName (required): Name of the face or object

Returns:
- success: Whether the measurement was successful
- measurementType: "area"
- value: The area value in mm²
- objectName: Name of the measured object
- message: Status message

Use this tool to get the surface area of planar geometry.`,
    {
      objectName: z.string().describe('Name of the face or object'),
    },
    async (input) => {
      const { objectName } = input;

      const code = `
from llm_bridge.measurement_handlers import handle_measure_area
import json
params = json.loads('${JSON.stringify({ objectName })}')
result = handle_measure_area(object_name=params['objectName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeasurement(parsed.data);
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

function getMeasureInfoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_measure_info',
    `Get all measurement information for an object.

Parameters:
- objectName (required): Name of the object to measure

Returns:
- success: Whether the measurement was successful
- objectName: Name of the measured object
- measurements: Object containing available measurements (length, area, volume, etc.)
- message: Status message

Use this tool to get all available measurements for an object at once.`,
    {
      objectName: z.string().describe('Name of the object to get measurements for'),
    },
    async (input) => {
      const { objectName } = input;

      const code = `
from llm_bridge.measurement_handlers import handle_get_measure_info
import json
params = json.loads('${JSON.stringify({ objectName })}')
result = handle_get_measure_info(object_name=params['objectName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);
        const formatted = formatMeasurement(parsed.data);
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

// =============================================================================
// Spreadsheet Workbench Tools
// =============================================================================

function createSpreadsheetTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_spreadsheet',
    `Create a new spreadsheet in the FreeCAD document.

Parameters:
- name (required): Name for the new spreadsheet

Returns:
- success: Whether the spreadsheet was created
- spreadsheetName: Internal name of the spreadsheet
- spreadsheetLabel: User-friendly label
- message: Status message

Use this tool when the user wants to create a new spreadsheet for BOM generation, parametric tables, or data organization.`,
    {
      name: z.string().describe('Name for the new spreadsheet'),
    },
    async (input) => {
      const { name } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_create_spreadsheet
import json
params = json.loads('${JSON.stringify({ name })}')
result = handle_create_spreadsheet(name=params['name'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create spreadsheet: ${parsed.error}`,
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

function deleteSpreadsheetTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'delete_spreadsheet',
    `Delete a spreadsheet from the FreeCAD document.

Parameters:
- name (required): Name or label of the spreadsheet to delete

Returns:
- success: Whether the spreadsheet was deleted
- message: Status message

Use this tool when the user wants to remove a spreadsheet.`,
    {
      name: z.string().describe('Name or label of the spreadsheet to delete'),
    },
    async (input) => {
      const { name } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_delete_spreadsheet
import json
params = json.loads('${JSON.stringify({ name })}')
result = handle_delete_spreadsheet(name=params['name'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to delete spreadsheet: ${parsed.error}`,
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

function renameSpreadsheetTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'rename_spreadsheet',
    `Rename a spreadsheet.

Parameters:
- oldName (required): Current name or label of the spreadsheet
- newName (required): New name for the spreadsheet

Returns:
- success: Whether the spreadsheet was renamed
- message: Status message

Use this tool when the user wants to change a spreadsheet's name.`,
    {
      oldName: z.string().describe('Current name or label of the spreadsheet'),
      newName: z.string().describe('New name for the spreadsheet'),
    },
    async (input) => {
      const { oldName, newName } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_rename_spreadsheet
import json
params = json.loads('${JSON.stringify({ oldName, newName })}')
result = handle_rename_spreadsheet(old_name=params['oldName'], new_name=params['newName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to rename spreadsheet: ${parsed.error}`,
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

function listSpreadsheetsTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_spreadsheets',
    `List all spreadsheets in the current FreeCAD document.

Returns:
- success: Whether the operation succeeded
- spreadsheets: Array of spreadsheet objects with name, label
- count: Number of spreadsheets found
- message: Status message

Use this tool to find available spreadsheets in the document.`,
    {},
    async () => {
      const code = `
from llm_bridge.spreadsheet_handlers import handle_list_spreadsheets
import json
result = handle_list_spreadsheets()
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          const spreadsheets = parsed.data.spreadsheets || [];
          const lines = spreadsheets.map((ss: { name: string; label: string }) => `- ${ss.label} (${ss.name})`);
          return {
            content: [
              {
                type: 'text',
                text: spreadsheets.length > 0 
                  ? `Spreadsheets:\n${lines.join('\n')}` 
                  : 'No spreadsheets found in document',
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to list spreadsheets: ${parsed.error}`,
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

function getSpreadsheetInfoTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_spreadsheet_info',
    `Get metadata about a spreadsheet.

Parameters:
- name (required): Name or label of the spreadsheet

Returns:
- success: Whether the operation succeeded
- name: Spreadsheet internal name
- label: Spreadsheet label
- type: Object type
- aliasCount: Number of aliases defined
- message: Status message

Use this tool to get details about a specific spreadsheet.`,
    {
      name: z.string().describe('Name or label of the spreadsheet'),
    },
    async (input) => {
      const { name } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_get_spreadsheet_info
import json
params = json.loads('${JSON.stringify({ name })}')
result = handle_get_spreadsheet_info(name=params['name'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          const data = parsed.data;
          return {
            content: [
              {
                type: 'text',
                text: `Spreadsheet: ${data.label}\nName: ${data.name}\nType: ${data.type}\nAliases: ${data.aliasCount || 0}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to get spreadsheet info: ${parsed.error}`,
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

function setCellTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_cell',
    `Set a cell value in a spreadsheet.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- address (required): Cell address (e.g., 'A1', '$B$2')
- value (required): Value to set (string, number, or boolean)

Returns:
- success: Whether the cell was set
- message: Status message

Use this tool to write data to spreadsheet cells. Cell addresses support both A1 and \$A\$1 notation.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      address: z.string().describe('Cell address (e.g., A1, $B$2)'),
      value: z.union([z.string(), z.number(), z.boolean()]).describe('Value to set'),
    },
    async (input) => {
      const { spreadsheetName, address, value } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_set_cell
import json
params = json.loads('${JSON.stringify({ spreadsheetName, address, value })}')
result = handle_set_cell(spreadsheet_name=params['spreadsheetName'], address=params['address'], value=params['value'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to set cell: ${parsed.error}`,
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

function getCellTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_cell',
    `Get a cell value from a spreadsheet.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- address (required): Cell address (e.g., 'A1', '$B$2')

Returns:
- success: Whether the cell was read
- address: Cell address
- value: Cell value
- expression: Cell expression (if any)
- hasExpression: Whether cell has an expression
- message: Status message

Use this tool to read data from spreadsheet cells.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      address: z.string().describe('Cell address (e.g., A1, $B$2)'),
    },
    async (input) => {
      const { spreadsheetName, address } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_get_cell
import json
params = json.loads('${JSON.stringify({ spreadsheetName, address })}')
result = handle_get_cell(spreadsheet_name=params['spreadsheetName'], address=params['address'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          const data = parsed.data;
          const hasExpr = data.hasExpression ? ` (formula: ${data.expression})` : '';
          return {
            content: [
              {
                type: 'text',
                text: `Cell ${address}: ${data.value}${hasExpr}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to get cell: ${parsed.error}`,
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

function setCellExpressionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_cell_expression',
    `Set a cell formula/expression in a spreadsheet.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- address (required): Cell address (e.g., 'A1', '$B$2')
- expression (required): Formula/expression to set (e.g., '=A1+B1' or '=Sum(A1:A10)')

Returns:
- success: Whether the expression was set
- message: Status message

Use this tool to set formulas in cells. Expressions should start with = for formulas.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      address: z.string().describe('Cell address (e.g., A1, $B$2)'),
      expression: z.string().describe('Formula/expression (e.g., =A1+B1)'),
    },
    async (input) => {
      const { spreadsheetName, address, expression } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_set_cell_expression
import json
params = json.loads('${JSON.stringify({ spreadsheetName, address, expression })}')
result = handle_set_cell_expression(spreadsheet_name=params['spreadsheetName'], address=params['address'], expression=params['expression'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to set expression: ${parsed.error}`,
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

function getCellExpressionTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_cell_expression',
    `Get a cell's formula/expression from a spreadsheet.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- address (required): Cell address (e.g., 'A1', '$B$2')

Returns:
- success: Whether the expression was retrieved
- address: Cell address
- expression: Cell expression/formula
- computedValue: Computed value after formula evaluation
- hasExpression: Whether cell has an expression
- message: Status message

Use this tool to check what formula is in a cell.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      address: z.string().describe('Cell address (e.g., A1, $B$2)'),
    },
    async (input) => {
      const { spreadsheetName, address } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_get_cell_expression
import json
params = json.loads('${JSON.stringify({ spreadsheetName, address })}')
result = handle_get_cell_expression(spreadsheet_name=params['spreadsheetName'], address=params['address'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          const data = parsed.data;
          if (data.expression) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Cell ${address}: ${data.expression}\nComputed value: ${data.computedValue}`,
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: `Cell ${address}: No expression, value is ${data.computedValue}`,
                },
              ],
            };
          }
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to get expression: ${parsed.error}`,
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

function clearCellTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'clear_cell',
    `Clear a cell's content in a spreadsheet.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- address (required): Cell address (e.g., 'A1', '$B$2')

Returns:
- success: Whether the cell was cleared
- message: Status message

Use this tool to clear a single cell. Use clear_range for multiple cells.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      address: z.string().describe('Cell address (e.g., A1, $B$2)'),
    },
    async (input) => {
      const { spreadsheetName, address } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_clear_cell
import json
params = json.loads('${JSON.stringify({ spreadsheetName, address })}')
result = handle_clear_cell(spreadsheet_name=params['spreadsheetName'], address=params['address'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to clear cell: ${parsed.error}`,
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

function clearRangeTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'clear_range',
    `Clear a range of cells in a spreadsheet.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- startAddress (required): Start cell address (e.g., 'A1')
- endAddress (required): End cell address (e.g., 'D10')

Returns:
- success: Whether the cells were cleared
- clearedCount: Number of cells cleared
- message: Status message

Use this tool to clear multiple cells at once.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      startAddress: z.string().describe('Start cell address (e.g., A1)'),
      endAddress: z.string().describe('End cell address (e.g., D10)'),
    },
    async (input) => {
      const { spreadsheetName, startAddress, endAddress } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_clear_range
import json
params = json.loads('${JSON.stringify({ spreadsheetName, startAddress, endAddress })}')
result = handle_clear_range(spreadsheet_name=params['spreadsheetName'], start_address=params['startAddress'], end_address=params['endAddress'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to clear range: ${parsed.error}`,
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

function setAliasTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_alias',
    `Set an alias on a cell for parametric access.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- address (required): Cell address (e.g., 'A1', '$B$2')
- aliasName (required): Name for the alias

Returns:
- success: Whether the alias was set
- message: Status message

Use this tool to create a named reference to a cell that can be used in expressions elsewhere in the document.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      address: z.string().describe('Cell address (e.g., A1, $B$2)'),
      aliasName: z.string().describe('Name for the alias'),
    },
    async (input) => {
      const { spreadsheetName, address, aliasName } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_set_alias
import json
params = json.loads('${JSON.stringify({ spreadsheetName, address, aliasName })}')
result = handle_set_alias(spreadsheet_name=params['spreadsheetName'], address=params['address'], alias_name=params['aliasName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to set alias: ${parsed.error}`,
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

function getAliasTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_alias',
    `Get a cell value by alias name.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- aliasName (required): Name of the alias to look up

Returns:
- success: Whether the alias was found
- aliasName: Alias name
- address: Cell address
- value: Cell value
- message: Status message

Use this tool to retrieve a cell value using its alias name.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      aliasName: z.string().describe('Name of the alias'),
    },
    async (input) => {
      const { spreadsheetName, aliasName } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_get_alias
import json
params = json.loads('${JSON.stringify({ spreadsheetName, aliasName })}')
result = handle_get_alias(spreadsheet_name=params['spreadsheetName'], alias_name=params['aliasName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          const data = parsed.data;
          return {
            content: [
              {
                type: 'text',
                text: `Alias '${aliasName}' -> ${data.address} = ${data.value}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to get alias: ${parsed.error}`,
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

function removeAliasTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'remove_alias',
    `Remove an alias from a cell.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- aliasName (required): Name of the alias to remove

Returns:
- success: Whether the alias was removed
- message: Status message

Use this tool to delete a cell alias.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      aliasName: z.string().describe('Name of the alias to remove'),
    },
    async (input) => {
      const { spreadsheetName, aliasName } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_remove_alias
import json
params = json.loads('${JSON.stringify({ spreadsheetName, aliasName })}')
result = handle_remove_alias(spreadsheet_name=params['spreadsheetName'], alias_name=params['aliasName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to remove alias: ${parsed.error}`,
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

function listAliasesTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'list_aliases',
    `List all aliases in a spreadsheet.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet

Returns:
- success: Whether aliases were listed
- aliases: Array of alias objects with name, address, value
- count: Number of aliases
- message: Status message

Use this tool to see all named cell references in a spreadsheet.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
    },
    async (input) => {
      const { spreadsheetName } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_list_aliases
import json
params = json.loads('${JSON.stringify({ spreadsheetName })}')
result = handle_list_aliases(spreadsheet_name=params['spreadsheetName'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          const aliases = parsed.data.aliases || [];
          if (aliases.length === 0) {
            return {
              content: [{ type: 'text', text: 'No aliases defined in this spreadsheet' }],
            };
          }
          const lines = aliases.map((a: { alias: string; address: string; value: unknown }) => `- ${a.alias} -> ${a.address} = ${a.value}`);
          return {
            content: [
              {
                type: 'text',
                text: `Aliases (${aliases.length}):\n${lines.join('\n')}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to list aliases: ${parsed.error}`,
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

function generateBomTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'generate_bom',
    `Generate a Bill of Materials from document objects.

Parameters:
- options (optional): Object with:
  - includeHidden: boolean - Include hidden objects (default: false)
  - groupByType: boolean - Group objects by type (default: false)
  - includeProperties: string[] - Properties to include
  - outputFormat: 'list' or 'dict' (default: 'list')

Returns:
- success: Whether BOM was generated
- bom: Array or grouped object with BOM entries
- itemCount: Number of items
- message: Status message

Each BOM entry includes: name, type, label, and common properties like volume, surface area, dimensions.`,
    {
      options: z
        .object({
          includeHidden: z.boolean().optional(),
          groupByType: z.boolean().optional(),
          includeProperties: z.array(z.string()).optional(),
          outputFormat: z.enum(['list', 'dict']).optional(),
        })
        .optional()
        .describe('BOM generation options'),
    },
    async (input) => {
      const options = input.options || {};

      const code = `
from llm_bridge.spreadsheet_handlers import handle_generate_bom
import json
params = json.loads('${JSON.stringify({ options })}')
result = handle_generate_bom(options=params['options'] if params.get('options') else None)
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          const count = parsed.data.itemCount || 0;
          const grouped = parsed.data.groupedByType ? ' (grouped by type)' : '';
          return {
            content: [
              {
                type: 'text',
                text: `Generated BOM with ${count} item(s)${grouped}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to generate BOM: ${parsed.error}`,
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

function getObjectBomDataTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'get_object_bom_data',
    `Extract structured data from specific objects for BOM.

Parameters:
- objectNames (required): Array of object names or labels
- properties (optional): Array of property names to extract

Returns:
- success: Whether data was extracted
- items: Array of extracted data objects
- itemCount: Number of items
- message: Status message

Use this to get detailed property data from specific objects for BOM reporting.`,
    {
      objectNames: z.array(z.string()).describe('Array of object names or labels'),
      properties: z.array(z.string()).optional().describe('Property names to extract'),
    },
    async (input) => {
      const { objectNames, properties } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_get_object_bom_data
import json
params = json.loads('${JSON.stringify({ objectNames, properties })}')
result = handle_get_object_bom_data(object_names=params['objectNames'], properties=params.get('properties'))
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          const count = parsed.data.itemCount || 0;
          return {
            content: [
              {
                type: 'text',
                text: `Extracted BOM data from ${count} object(s)`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to get BOM data: ${parsed.error}`,
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

function exportBomToSpreadsheetTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'export_bom_to_spreadsheet',
    `Write BOM data to a spreadsheet.

Parameters:
- bomData (required): BOM data from generate_bom or get_object_bom_data
- spreadsheetName (required): Name or label of target spreadsheet
- startAddress (optional): Starting cell address (default: 'A1')

Returns:
- success: Whether export succeeded
- rowsWritten: Number of data rows written
- message: Status message

Use this to export generated BOM data to a spreadsheet for documentation or further editing.`,
    {
      bomData: z.union([z.array(z.record(z.string(), z.unknown())), z.record(z.string(), z.unknown())]).describe('BOM data to export'),
      spreadsheetName: z.string().describe('Name or label of target spreadsheet'),
      startAddress: z.string().optional().describe('Starting cell address (default: A1)'),
    },
    async (input) => {
      const { bomData, spreadsheetName, startAddress } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_export_bom_to_spreadsheet
import json
params = json.loads('${JSON.stringify({ bomData, spreadsheetName, startAddress: startAddress || 'A1' })}')
result = handle_export_bom_to_spreadsheet(bom_data=params['bomData'], spreadsheet_name=params['spreadsheetName'], start_address=params.get('startAddress', 'A1'))
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to export BOM: ${parsed.error}`,
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

function createParametricTableTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'create_parametric_table',
    `Create a parametric lookup table in a spreadsheet.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- headers (required): Array of column header names
- data (required): Array of rows, each row is an array of values

Returns:
- success: Whether table was created
- rowCount: Number of data rows
- columnCount: Number of columns
- message: Status message

Use this to create lookup tables that can be used with the lookup_value tool.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      headers: z.array(z.string()).describe('Column header names'),
      data: z.array(z.array(z.union([z.string(), z.number()]))).describe('Array of row data arrays'),
    },
    async (input) => {
      const { spreadsheetName, headers, data } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_create_parametric_table
import json
params = json.loads('${JSON.stringify({ spreadsheetName, headers, data })}')
result = handle_create_parametric_table(spreadsheet_name=params['spreadsheetName'], headers=params['headers'], data=params['data'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to create table: ${parsed.error}`,
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

function updateParametricTableTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'update_parametric_table',
    `Update a row in a parametric table.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- rowKey (required): Value in the first column to identify the row
- updates (required): Object mapping column headers to new values

Returns:
- success: Whether update succeeded
- updatedCells: Array of updated cell info
- message: Status message

Use this to modify existing rows in a lookup table.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      rowKey: z.union([z.string(), z.number()]).describe('Value in first column to identify row'),
      updates: z.record(z.union([z.string(), z.number()])).describe('Object mapping column headers to new values'),
    },
    async (input) => {
      const { spreadsheetName, rowKey, updates } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_update_parametric_table
import json
params = json.loads('${JSON.stringify({ spreadsheetName, rowKey, updates })}')
result = handle_update_parametric_table(spreadsheet_name=params['spreadsheetName'], row_key=params['rowKey'], updates=params['updates'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to update table: ${parsed.error}`,
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

function lookupValueTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'lookup_value',
    `Lookup a value in a parametric table.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- columnKey (required): Column header to return (the "return column")
- lookupValue (required): Value to search for in the first column

Returns:
- success: Whether lookup succeeded
- resultValue: The found value
- rowData: Full row data
- message: Status message

Use this to search a lookup table created with create_parametric_table. The search is case-insensitive.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      columnKey: z.string().describe('Column header to return'),
      lookupValue: z.union([z.string(), z.number()]).describe('Value to search for in first column'),
    },
    async (input) => {
      const { spreadsheetName, columnKey, lookupValue } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_lookup_value
import json
params = json.loads('${JSON.stringify({ spreadsheetName, columnKey, lookupValue })}')
result = handle_lookup_value(spreadsheet_name=params['spreadsheetName'], column_key=params['columnKey'], lookup_value=params['lookupValue'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          const data = parsed.data;
          return {
            content: [
              {
                type: 'text',
                text: `Found: ${data.resultValue} (${columnKey} for ${lookupValue})`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Lookup failed: ${parsed.error}`,
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

function setColumnWidthTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_column_width',
    `Set column width in a spreadsheet.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- column (required): Column letter (e.g., 'A', 'B', 'AB')
- width (required): Width in points

Returns:
- success: Whether width was set
- column: Column letter
- width: New width value
- message: Status message

Use this to adjust column widths for better display.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      column: z.string().describe('Column letter (e.g., A, B, AB)'),
      width: z.number().describe('Width in points'),
    },
    async (input) => {
      const { spreadsheetName, column, width } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_set_column_width
import json
params = json.loads('${JSON.stringify({ spreadsheetName, column, width })}')
result = handle_set_column_width(spreadsheet_name=params['spreadsheetName'], column=params['column'], width=params['width'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to set column width: ${parsed.error}`,
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

function setRowHeightTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_row_height',
    `Set row height in a spreadsheet.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- row (required): Row number (1-based)
- height (required): Height in points

Returns:
- success: Whether height was set
- row: Row number
- height: New height value
- message: Status message

Use this to adjust row heights for better display.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      row: z.number().int().positive().describe('Row number (1-based)'),
      height: z.number().describe('Height in points'),
    },
    async (input) => {
      const { spreadsheetName, row, height } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_set_row_height
import json
params = json.loads('${JSON.stringify({ spreadsheetName, row, height })}')
result = handle_set_row_height(spreadsheet_name=params['spreadsheetName'], row=params['row'], height=params['height'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to set row height: ${parsed.error}`,
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

function setCellBackgroundTool(freeCADBridge: FreeCADBridge) {
  return tool(
    'set_cell_background',
    `Set cell background color.

Parameters:
- spreadsheetName (required): Name or label of the spreadsheet
- address (required): Cell address (e.g., 'A1', '$B$2')
- color (required): Color as hex string (e.g., '#FF0000' for red) or 'default'

Returns:
- success: Whether color was set
- address: Cell address
- color: Applied color
- message: Status message

Use this to highlight cells with background colors.`,
    {
      spreadsheetName: z.string().describe('Name or label of the spreadsheet'),
      address: z.string().describe('Cell address (e.g., A1, $B$2)'),
      color: z.string().describe("Color as hex (e.g., '#FF0000') or 'default'"),
    },
    async (input) => {
      const { spreadsheetName, address, color } = input;

      const code = `
from llm_bridge.spreadsheet_handlers import handle_set_cell_background
import json
params = json.loads('${JSON.stringify({ spreadsheetName, address, color })}')
result = handle_set_cell_background(spreadsheet_name=params['spreadsheetName'], address=params['address'], color=params['color'])
print(json.dumps(result))
`.trim();

      try {
        const result = await freeCADBridge.executePython(code);
        const parsed = parseLastJsonLine(result.output);

        if (parsed.success) {
          return {
            content: [
              {
                type: 'text',
                text: `${parsed.data.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Failed to set cell background: ${parsed.error}`,
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