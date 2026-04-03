"use strict";
/**
 * Result Formatters - Format query results for readability
 *
 * Provides utility functions to format query results from FreeCAD
 * into human-readable output for Claude.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatQueryResult = formatQueryResult;
exports.formatDocumentOverview = formatDocumentOverview;
exports.formatObjectList = formatObjectList;
exports.formatObjectProperties = formatObjectProperties;
exports.formatSelection = formatSelection;
exports.formatDependencies = formatDependencies;
exports.formatDocumentInfo = formatDocumentInfo;
exports.formatTableRow = formatTableRow;
exports.truncateOutput = truncateOutput;
exports.formatPropertyChange = formatPropertyChange;
exports.formatSpreadsheetCreate = formatSpreadsheetCreate;
exports.formatSpreadsheetDelete = formatSpreadsheetDelete;
exports.formatSpreadsheetRename = formatSpreadsheetRename;
exports.formatSpreadsheetList = formatSpreadsheetList;
exports.formatSpreadsheetInfo = formatSpreadsheetInfo;
exports.formatCellValue = formatCellValue;
exports.formatCellExpression = formatCellExpression;
exports.formatAliasList = formatAliasList;
exports.formatBomGeneration = formatBomGeneration;
exports.formatBomData = formatBomData;
exports.formatParametricTable = formatParametricTable;
exports.formatTableLookup = formatTableLookup;
exports.formatColumnWidth = formatColumnWidth;
exports.formatRowHeight = formatRowHeight;
exports.formatCellBackground = formatCellBackground;
exports.formatDimensionUpdate = formatDimensionUpdate;
exports.formatTransformResult = formatTransformResult;
exports.formatExpressionResult = formatExpressionResult;
exports.formatSketchResult = formatSketchResult;
exports.formatGeometryResult = formatGeometryResult;
exports.formatConstraintResult = formatConstraintResult;
exports.formatSketchGeometry = formatSketchGeometry;
exports.formatFeatureResult = formatFeatureResult;
exports.formatBodyResult = formatBodyResult;
exports.formatBodyList = formatBodyList;
exports.formatFeatureUpdate = formatFeatureUpdate;
exports.formatShapeResult = formatShapeResult;
exports.formatShapeInfo = formatShapeInfo;
exports.formatShapeValidation = formatShapeValidation;
exports.formatAssemblyCreationResult = formatAssemblyCreationResult;
exports.formatComponentList = formatComponentList;
exports.formatConstraintCreationResult = formatConstraintCreationResult;
exports.formatConstraintList = formatConstraintList;
exports.formatConstraintUpdate = formatConstraintUpdate;
exports.formatPointCreation = formatPointCreation;
exports.formatGeometryCreation = formatGeometryCreation;
exports.formatDimensionCreation = formatDimensionCreation;
exports.formatTextCreation = formatTextCreation;
exports.formatModificationResult = formatModificationResult;
exports.formatPatternCreation = formatPatternCreation;
exports.formatPatternUpdate = formatPatternUpdate;
exports.formatPatternInfo = formatPatternInfo;
exports.formatPageCreation = formatPageCreation;
exports.formatViewCreation = formatViewCreation;
exports.formatTechDrawDimension = formatTechDrawDimension;
exports.formatAnnotationCreation = formatAnnotationCreation;
exports.formatExportResult = formatExportResult;
exports.formatLoftCreation = formatLoftCreation;
exports.formatSweepCreation = formatSweepCreation;
exports.formatSurfaceOperation = formatSurfaceOperation;
exports.formatSurfaceInfo = formatSurfaceInfo;
exports.formatBlendSurface = formatBlendSurface;
exports.formatOffsetSurface = formatOffsetSurface;
exports.formatSurfaceAnalysis = formatSurfaceAnalysis;
exports.formatSurfaceRebuild = formatSurfaceRebuild;
exports.formatLoftInfo = formatLoftInfo;
exports.formatSweepInfo = formatSweepInfo;
exports.formatSolverInit = formatSolverInit;
exports.formatSolveResult = formatSolveResult;
exports.formatDOFResult = formatDOFResult;
exports.formatJointValue = formatJointValue;
exports.formatJointLimits = formatJointLimits;
exports.formatDriveResult = formatDriveResult;
exports.formatAnimationResult = formatAnimationResult;
exports.formatAnimationState = formatAnimationState;
exports.formatKinematicPositions = formatKinematicPositions;
exports.formatCollisionResult = formatCollisionResult;
exports.formatRenderResult = formatRenderResult;
exports.formatViewAngle = formatViewAngle;
exports.formatAnimationCapture = formatAnimationCapture;
exports.formatVideoExport = formatVideoExport;
exports.formatMaterialResult = formatMaterialResult;
exports.formatMeshConversion = formatMeshConversion;
exports.formatMeshBoolean = formatMeshBoolean;
exports.formatMeshDecimation = formatMeshDecimation;
exports.formatMeshRepair = formatMeshRepair;
exports.formatMeshValidation = formatMeshValidation;
exports.formatMeshInfo = formatMeshInfo;
exports.formatMeshScale = formatMeshScale;
exports.formatMeshOffset = formatMeshOffset;
exports.formatMeshExport = formatMeshExport;
exports.formatMeshImport = formatMeshImport;
exports.formatFEAAnalysis = formatFEAAnalysis;
exports.formatFEAMesh = formatFEAMesh;
exports.formatFEAMaterial = formatFEAMaterial;
exports.formatFEAConstraint = formatFEAConstraint;
exports.formatFEASolver = formatFEASolver;
exports.formatFEAResults = formatFEAResults;
exports.formatPathJobCreation = formatPathJobCreation;
exports.formatPathJobList = formatPathJobList;
exports.formatPathToolCreation = formatPathToolCreation;
exports.formatPathToolList = formatPathToolList;
exports.formatPathOperation = formatPathOperation;
exports.formatPathDressup = formatPathDressup;
exports.formatGCodeExport = formatGCodeExport;
exports.formatPathSimulation = formatPathSimulation;
exports.formatUndoResult = formatUndoResult;
exports.formatRedoResult = formatRedoResult;
exports.formatUndoStackSize = formatUndoStackSize;
exports.formatVisibilityChange = formatVisibilityChange;
exports.formatVisibleObjectsList = formatVisibleObjectsList;
exports.formatSelectionChange = formatSelectionChange;
exports.formatMeasurement = formatMeasurement;
exports.formatDistanceMeasurement = formatDistanceMeasurement;
exports.formatAngleMeasurement = formatAngleMeasurement;
exports.formatSiteCreation = formatSiteCreation;
exports.formatBuildingCreation = formatBuildingCreation;
exports.formatBuildingPartCreation = formatBuildingPartCreation;
exports.formatBuildingLevel = formatBuildingLevel;
exports.formatBuildingHierarchy = formatBuildingHierarchy;
exports.formatWallCreation = formatWallCreation;
exports.formatWindowCreation = formatWindowCreation;
exports.formatDoorCreation = formatDoorCreation;
exports.formatRoofCreation = formatRoofCreation;
exports.formatStairsCreation = formatStairsCreation;
exports.formatCurtainWallCreation = formatCurtainWallCreation;
exports.formatSpaceCreation = formatSpaceCreation;
exports.formatColumnCreation = formatColumnCreation;
exports.formatBeamCreation = formatBeamCreation;
exports.formatSlabCreation = formatSlabCreation;
exports.formatFrameCreation = formatFrameCreation;
exports.formatTrussCreation = formatTrussCreation;
exports.formatFenceCreation = formatFenceCreation;
exports.formatEquipmentCreation = formatEquipmentCreation;
exports.formatPipeCreation = formatPipeCreation;
exports.formatPipeConnectorCreation = formatPipeConnectorCreation;
exports.formatPanelCreation = formatPanelCreation;
exports.formatAxisCreation = formatAxisCreation;
exports.formatGridCreation = formatGridCreation;
exports.formatSectionPlaneCreation = formatSectionPlaneCreation;
exports.formatScheduleCreation = formatScheduleCreation;
exports.formatIfcProperties = formatIfcProperties;
exports.formatMaterialAssignment = formatMaterialAssignment;
exports.formatQuickWall = formatQuickWall;
exports.formatQuickWindow = formatQuickWindow;
exports.formatQuickDoor = formatQuickDoor;
exports.formatQuickFloor = formatQuickFloor;
exports.formatErrorParse = formatErrorParse;
exports.formatErrorCategory = formatErrorCategory;
exports.formatTracebackInfo = formatTracebackInfo;
exports.formatErrorContext = formatErrorContext;
exports.formatRecoverySuggestions = formatRecoverySuggestions;
exports.formatValidationResult = formatValidationResult;
exports.formatCommonErrors = formatCommonErrors;
exports.formatOperationHistory = formatOperationHistory;
exports.formatLastError = formatLastError;
exports.formatUndoStrategy = formatUndoStrategy;
exports.formatSafeRetryResult = formatSafeRetryResult;
/**
 * Format a query result, handling errors and data formatting
 */
function formatQueryResult(result) {
    if (!result.success) {
        return `Error: ${result.error || 'Unknown error'}`;
    }
    if (!result.data) {
        return 'No data available';
    }
    return JSON.stringify(result.data, null, 2);
}
/**
 * Format document overview as a readable table
 */
function formatDocumentOverview(data) {
    if (!data)
        return 'No document data';
    const lines = [];
    lines.push(`Document: ${data.label || data.name} (${data.name})`);
    lines.push(`Objects: ${data.objectCount}`);
    lines.push('');
    lines.push('Objects in document:');
    lines.push('─'.repeat(60));
    if (data.objects && data.objects.length > 0) {
        // Header
        lines.push(formatTableRow(['Name', 'Label', 'Type', 'Visibility']));
        lines.push('─'.repeat(60));
        // Rows
        for (const obj of data.objects) {
            lines.push(formatTableRow([
                obj.name || '-',
                obj.label || '-',
                formatType(obj.type),
                obj.visibility !== undefined ? (obj.visibility ? 'Yes' : 'No') : 'N/A'
            ]));
        }
    }
    else {
        lines.push('(No objects)');
    }
    return lines.join('\n');
}
/**
 * Format object list as a readable table
 */
function formatObjectList(data) {
    if (!data)
        return 'No objects';
    const lines = [];
    lines.push(`Total Objects: ${data.count || 0}`);
    lines.push('');
    if (data.objects && data.objects.length > 0) {
        lines.push(formatTableRow(['Name', 'Label', 'Type', 'Visibility']));
        lines.push('─'.repeat(60));
        for (const obj of data.objects) {
            lines.push(formatTableRow([
                obj.name || '-',
                obj.label || '-',
                formatType(obj.type),
                obj.visibility !== undefined ? (obj.visibility ? 'Yes' : 'No') : 'N/A'
            ]));
        }
    }
    else {
        lines.push('(No objects in document)');
    }
    return lines.join('\n');
}
/**
 * Format object properties as key-value pairs
 */
function formatObjectProperties(data) {
    if (!data)
        return 'No properties available';
    const lines = [];
    lines.push(`Object: ${data.label || data.name} (${data.name})`);
    lines.push(`Type: ${formatType(data.type)}`);
    lines.push('');
    if (data.properties) {
        const props = data.properties;
        // Placement
        if (props.placement) {
            lines.push('Placement:');
            if (props.placement.position) {
                const pos = props.placement.position;
                lines.push(`  Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
            }
            if (props.placement.rotation) {
                const rot = props.placement.rotation;
                lines.push(`  Rotation: Axis(${rot.axis.x.toFixed(2)}, ${rot.axis.y.toFixed(2)}, ${rot.axis.z.toFixed(2)}), Angle: ${(rot.angle * 180 / Math.PI).toFixed(1)}°`);
            }
            lines.push('');
        }
        // Dimensions
        if (props.dimensions) {
            lines.push('Dimensions:');
            if (props.dimensions.boundingBox) {
                const bb = props.dimensions.boundingBox;
                lines.push(`  Bounding Box: (${bb.minX.toFixed(2)}, ${bb.minY.toFixed(2)}, ${bb.minZ.toFixed(2)}) to (${bb.maxX.toFixed(2)}, ${bb.maxY.toFixed(2)}, ${bb.maxZ.toFixed(2)})`);
            }
            if (props.dimensions.volume !== undefined) {
                lines.push(`  Volume: ${props.dimensions.volume.toFixed(2)} mm³`);
            }
            if (props.dimensions.area !== undefined) {
                lines.push(`  Surface Area: ${props.dimensions.area.toFixed(2)} mm²`);
            }
            lines.push('');
        }
        // Color
        if (props.color) {
            lines.push(`Color: RGB(${(props.color.r * 255).toFixed(0)}, ${(props.color.g * 255).toFixed(0)}, ${(props.color.b * 255).toFixed(0)})`);
            lines.push('');
        }
        // Other properties
        const otherProps = ['width', 'height', 'length', 'radius', 'angle'];
        for (const prop of otherProps) {
            if (props[prop] !== undefined) {
                lines.push(`${capitalize(prop)}: ${typeof props[prop] === 'number' ? props[prop].toFixed(2) : props[prop]}`);
            }
        }
    }
    return lines.join('\n');
}
/**
 * Format selection result
 */
function formatSelection(data) {
    if (!data)
        return 'No selection data';
    const lines = [];
    lines.push(`Selected Objects: ${data.count || 0}`);
    lines.push('');
    if (data.selected && data.selected.length > 0) {
        lines.push(formatTableRow(['Name', 'Label', 'Type']));
        lines.push('─'.repeat(60));
        for (const sel of data.selected) {
            lines.push(formatTableRow([
                sel.name || '-',
                sel.label || '-',
                formatType(sel.type)
            ]));
        }
    }
    else {
        lines.push('(No objects selected)');
    }
    return lines.join('\n');
}
/**
 * Format dependencies result
 */
function formatDependencies(data) {
    if (!data)
        return 'No dependency data';
    const lines = [];
    lines.push(`Object: ${data.object}`);
    lines.push('');
    // Dependencies (what this object depends on)
    lines.push('Depends On (Parents):');
    if (data.dependencies?.dependsOn && data.dependencies.dependsOn.length > 0) {
        for (const dep of data.dependencies.dependsOn) {
            lines.push(`  - ${dep.label || dep.name} (${formatType(dep.type)})`);
        }
    }
    else {
        lines.push('  (None)');
    }
    lines.push('');
    // Used by (what depends on this object)
    lines.push('Used By (Children):');
    if (data.dependencies?.usedBy && data.dependencies.usedBy.length > 0) {
        for (const dep of data.dependencies.usedBy) {
            lines.push(`  - ${dep.label || dep.name} (${formatType(dep.type)})`);
        }
    }
    else {
        lines.push('  (None)');
    }
    return lines.join('\n');
}
/**
 * Format document info result
 */
function formatDocumentInfo(data) {
    if (!data)
        return 'No document info';
    const lines = [];
    lines.push(`Name: ${data.name}`);
    lines.push(`Label: ${data.label}`);
    lines.push(`Objects: ${data.objectCount}`);
    lines.push(`Modified: ${data.modified ? 'Yes' : 'No'}`);
    lines.push(`File Path: ${data.filePath || '(Not saved)'}`);
    return lines.join('\n');
}
/**
 * Helper: Format a table row
 */
function formatTableRow(cells) {
    const maxWidth = 15;
    const padded = cells.map(cell => {
        const truncated = cell.length > maxWidth ? cell.substring(0, maxWidth - 2) + '..' : cell;
        return truncated.padEnd(maxWidth);
    });
    return padded.join(' | ');
}
/**
 * Helper: Format type string (remove namespace)
 */
function formatType(typeId) {
    if (!typeId)
        return '-';
    // Extract just the type name after the namespace
    const parts = typeId.split('.');
    return parts.length > 1 ? parts[1] : typeId;
}
/**
 * Helper: Capitalize first letter
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
/**
 * Truncate long output with character count
 */
function truncateOutput(output, maxLength = 5000) {
    if (output.length <= maxLength) {
        return output;
    }
    const truncated = output.substring(0, maxLength);
    const remaining = output.length - maxLength;
    return `${truncated}\n\n[... truncated ${remaining} characters ...]`;
}
/**
 * Format property change result from set_object_property
 */
function formatPropertyChange(data) {
    if (!data)
        return 'No property change data';
    const lines = [];
    lines.push(`Object: ${data.objectLabel || data.objectName} (${data.objectName})`);
    lines.push('');
    lines.push(`Property: ${data.propertyName}`);
    if (data.beforeValue !== undefined && data.afterValue !== undefined) {
        lines.push(`Changed: ${data.beforeValue} → ${data.afterValue}`);
    }
    else if (data.afterValue !== undefined) {
        lines.push(`Set to: ${data.afterValue}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatSpreadsheetCreate(data) {
    if (!data)
        return 'No spreadsheet data';
    const lines = [];
    if (data.success) {
        lines.push(`Spreadsheet created: ${data.objectLabel || data.objectName}`);
        if (data.objectType) {
            lines.push(`Type: ${data.objectType}`);
        }
    }
    else {
        lines.push(`Create Spreadsheet Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatSpreadsheetDelete(data) {
    if (!data)
        return 'No spreadsheet data';
    const lines = [];
    if (data.success) {
        lines.push(`Deleted spreadsheet: ${data.deletedSpreadsheet}`);
    }
    else {
        lines.push(`Delete Spreadsheet Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatSpreadsheetRename(data) {
    if (!data)
        return 'No spreadsheet data';
    const lines = [];
    if (data.success) {
        lines.push(`Renamed: ${data.oldName} → ${data.newName}`);
    }
    else {
        lines.push(`Rename Spreadsheet Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatSpreadsheetList(data) {
    if (!data)
        return 'No spreadsheet data';
    const lines = [];
    if (data.success) {
        lines.push(`Found ${data.count} spreadsheet(s):`);
        if (data.spreadsheets && Array.isArray(data.spreadsheets)) {
            for (const ss of data.spreadsheets) {
                lines.push(`  • ${ss.label} (${ss.name})`);
            }
        }
    }
    else {
        lines.push(`List Spreadsheets Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatSpreadsheetInfo(data) {
    if (!data)
        return 'No spreadsheet data';
    const lines = [];
    if (data.success) {
        lines.push(`Spreadsheet: ${data.label || data.name}`);
        lines.push(`Type: ${data.type}`);
        if (data.usedRange) {
            lines.push(`Used Range: ${JSON.stringify(data.usedRange)}`);
        }
        lines.push(`Aliases: ${data.aliasCount || 0}`);
    }
    else {
        lines.push(`Get Spreadsheet Info Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatCellValue(data) {
    if (!data)
        return 'No cell data';
    const lines = [];
    if (data.success) {
        lines.push(`Cell ${data.address} in ${data.spreadsheet}`);
        lines.push(`Value: ${data.value}`);
        if (data.hasExpression && data.expression) {
            lines.push(`Formula: ${data.expression}`);
        }
    }
    else {
        lines.push(`Get Cell Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatCellExpression(data) {
    if (!data)
        return 'No cell data';
    const lines = [];
    if (data.success) {
        lines.push(`Cell ${data.address} in ${data.spreadsheet}`);
        lines.push(`Formula: ${data.expression || '(none)'}`);
        lines.push(`Computed Value: ${data.computedValue}`);
    }
    else {
        lines.push(`Get Cell Expression Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatAliasList(data) {
    if (!data)
        return 'No alias data';
    const lines = [];
    if (data.success) {
        lines.push(`Aliases in ${data.spreadsheet} (${data.count}):`);
        if (data.aliases && Array.isArray(data.aliases)) {
            for (const alias of data.aliases) {
                lines.push(`  • ${alias.alias} → ${alias.address} = ${alias.value}`);
            }
        }
    }
    else {
        lines.push(`List Aliases Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatBomGeneration(data) {
    if (!data)
        return 'No BOM data';
    const lines = [];
    if (data.success) {
        lines.push(`BOM Generated: ${data.itemCount} item(s)`);
        lines.push(`Format: ${data.format}`);
        if (data.groupedByType) {
            lines.push('Grouped by type');
        }
        if (data.bom && Array.isArray(data.bom) && data.bom.length > 0) {
            lines.push('');
            lines.push('Items:');
            for (let i = 0; i < Math.min(data.bom.length, 10); i++) {
                const item = data.bom[i];
                lines.push(`  ${i + 1}. ${item.label || item.name} (${item.type})`);
            }
            if (data.bom.length > 10) {
                lines.push(`  ... and ${data.bom.length - 10} more`);
            }
        }
    }
    else {
        lines.push(`Generate BOM Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatBomData(data) {
    if (!data)
        return 'No BOM data';
    const lines = [];
    if (data.success) {
        lines.push(`Extracted data from ${data.itemCount} object(s):`);
        if (data.items && Array.isArray(data.items)) {
            for (const item of data.items) {
                lines.push(`  • ${item.label || item.name || item.sourceObject}`);
            }
        }
        if (data.errors && data.errors.length > 0) {
            lines.push('');
            lines.push('Errors:');
            for (const err of data.errors) {
                lines.push(`  • ${err.object}: ${err.error}`);
            }
        }
    }
    else {
        lines.push(`Get BOM Data Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatParametricTable(data) {
    if (!data)
        return 'No table data';
    const lines = [];
    if (data.success) {
        lines.push(`Parametric table created in ${data.spreadsheet}`);
        lines.push(`Range: ${data.startAddress}:${data.endAddress}`);
        lines.push(`Size: ${data.rowCount} rows × ${data.columnCount} columns`);
        if (data.headers) {
            lines.push(`Headers: ${data.headers.join(', ')}`);
        }
    }
    else {
        lines.push(`Create Parametric Table Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatTableLookup(data) {
    if (!data)
        return 'No lookup data';
    const lines = [];
    if (data.success) {
        lines.push(`Lookup: ${data.lookupColumn} = ${data.lookupValue}`);
        lines.push(`Found at row ${data.foundRow}, address ${data.resultAddress}`);
        lines.push(`Result: ${data.resultValue}`);
        if (data.rowData) {
            lines.push('');
            lines.push('Row data:');
            for (const [key, val] of Object.entries(data.rowData)) {
                lines.push(`  ${key}: ${val}`);
            }
        }
    }
    else {
        lines.push(`Table Lookup Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatColumnWidth(data) {
    if (!data)
        return 'No width data';
    const lines = [];
    if (data.success) {
        lines.push(`Column ${data.column} in ${data.spreadsheet}`);
        lines.push(`Width: ${data.width} points`);
    }
    else {
        lines.push(`Set Column Width Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatRowHeight(data) {
    if (!data)
        return 'No row height data';
    const lines = [];
    if (data.success) {
        lines.push(`Row ${data.row} in ${data.spreadsheet}`);
        lines.push(`Height: ${data.height} points`);
    }
    else {
        lines.push(`Set Row Height Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatCellBackground(data) {
    if (!data)
        return 'No cell background data';
    const lines = [];
    if (data.success) {
        lines.push(`Cell ${data.address} in ${data.spreadsheet}`);
        if (data.color) {
            const color = data.color;
            if (typeof color === 'object' && 'r' in color) {
                const r = Math.round(color.r * 255);
                const g = Math.round(color.g * 255);
                const b = Math.round(color.b * 255);
                lines.push(`Color: rgb(${r}, ${g}, ${b})`);
            }
            else {
                lines.push(`Color: ${JSON.stringify(data.color)}`);
            }
        }
    }
    else {
        lines.push(`Set Cell Background Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format dimension update result from update_dimensions
 */
function formatDimensionUpdate(data) {
    if (!data)
        return 'No dimension update data';
    const lines = [];
    lines.push(`Object: ${data.objectLabel || data.objectName} (${data.objectName})`);
    lines.push('');
    lines.push(`Updated ${data.changeCount || 0} dimension(s):`);
    lines.push('─'.repeat(60));
    if (data.changes && data.changes.length > 0) {
        lines.push(formatTableRow(['Property', 'Before', 'After']));
        lines.push('─'.repeat(60));
        for (const change of data.changes) {
            lines.push(formatTableRow([
                change.property || '-',
                change.beforeValue || '-',
                change.afterValue || '-'
            ]));
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format transform result from move_object, rotate_object, or scale_object
 */
function formatTransformResult(data, transformType) {
    if (!data)
        return 'No transform data';
    const lines = [];
    lines.push(`Object: ${data.objectLabel || data.objectName} (${data.objectName})`);
    lines.push(`Transform: ${capitalize(transformType)}`);
    lines.push('');
    if (transformType === 'move') {
        if (data.beforePosition && data.afterPosition) {
            const before = data.beforePosition;
            const after = data.afterPosition;
            lines.push(`Position: (${before.x.toFixed(2)}, ${before.y.toFixed(2)}, ${before.z.toFixed(2)})`);
            lines.push(`       → (${after.x.toFixed(2)}, ${after.y.toFixed(2)}, ${after.z.toFixed(2)})`);
        }
        if (data.displacement) {
            lines.push(`Displacement: ${data.displacement}`);
        }
    }
    else if (transformType === 'rotate') {
        if (data.beforeRotation && data.afterRotation) {
            // Python handler returns angle as formatted string (e.g., "45.00deg")
            // Check if it's already a string, otherwise convert from radians
            let beforeAngle;
            let afterAngle;
            if (typeof data.beforeRotation.angle === 'string') {
                beforeAngle = data.beforeRotation.angle;
            }
            else {
                beforeAngle = `${(data.beforeRotation.angle * 180 / Math.PI).toFixed(1)}°`;
            }
            if (typeof data.afterRotation.angle === 'string') {
                afterAngle = data.afterRotation.angle;
            }
            else {
                afterAngle = `${(data.afterRotation.angle * 180 / Math.PI).toFixed(1)}°`;
            }
            lines.push(`Rotation: ${beforeAngle} → ${afterAngle}`);
            if (data.axis) {
                lines.push(`Axis: (${data.axis.x.toFixed(2)}, ${data.axis.y.toFixed(2)}, ${data.axis.z.toFixed(2)})`);
            }
        }
        if (data.rotationApplied) {
            lines.push(`Applied: ${data.rotationApplied}`);
        }
    }
    else if (transformType === 'scale') {
        if (data.scaleFactors) {
            const sf = data.scaleFactors;
            lines.push(`Scale Factors: X=${sf.x.toFixed(2)}, Y=${sf.y.toFixed(2)}, Z=${sf.z.toFixed(2)}`);
        }
        if (data.uniform !== undefined) {
            lines.push(`Uniform: ${data.uniform ? 'Yes' : 'No'}`);
        }
        if (data.beforeDimensions && data.afterDimensions) {
            const before = data.beforeDimensions;
            const after = data.afterDimensions;
            lines.push(`Dimensions: (${before.x.toFixed(2)}, ${before.y.toFixed(2)}, ${before.z.toFixed(2)})`);
            lines.push(`         → (${after.x.toFixed(2)}, ${after.y.toFixed(2)}, ${after.z.toFixed(2)})`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format expression result from set_expression, get_expression, or clear_expression
 */
function formatExpressionResult(data, action) {
    if (!data)
        return 'No expression data';
    const lines = [];
    lines.push(`Object: ${data.objectLabel || data.objectName} (${data.objectName})`);
    lines.push('');
    if (action === 'set') {
        lines.push(`Property: ${data.propertyName}`);
        lines.push(`Expression: ${data.expression}`);
        if (data.previousExpression) {
            lines.push(`Previous: ${data.previousExpression}`);
        }
        if (data.beforeValue !== undefined && data.afterValue !== undefined) {
            lines.push(`Value: ${data.beforeValue} → ${data.afterValue}`);
        }
    }
    else if (action === 'get') {
        if (data.expressionCount === 0) {
            lines.push('No expressions found on this object.');
        }
        else {
            lines.push(`Found ${data.expressionCount} expression(s):`);
            lines.push('─'.repeat(60));
            if (data.expressions) {
                for (const [propName, exprData] of Object.entries(data.expressions)) {
                    const expr = exprData;
                    lines.push(`${propName}:`);
                    lines.push(`  Expression: ${expr.expression || '(none)'}`);
                    if (expr.currentValue) {
                        lines.push(`  Current Value: ${expr.currentValue}`);
                    }
                }
            }
        }
    }
    else if (action === 'clear') {
        if (data.clearedCount === 0) {
            lines.push('No expressions to clear.');
        }
        else {
            lines.push(`Cleared ${data.clearedCount} expression(s):`);
            if (data.clearedProperties && data.clearedProperties.length > 0) {
                for (const prop of data.clearedProperties) {
                    lines.push(`  - ${prop}`);
                }
            }
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format sketch creation result from create_new_sketch
 */
function formatSketchResult(data) {
    if (!data)
        return 'No sketch data';
    const lines = [];
    lines.push(`Sketch: ${data.sketchLabel || data.sketchName} (${data.sketchName})`);
    lines.push(`Document: ${data.documentName || '(current)'}`);
    lines.push('');
    if (data.support) {
        lines.push(`Support: ${data.support}`);
    }
    else {
        lines.push('Support: (none - base sketch)');
    }
    if (data.mapMode) {
        lines.push(`Map Mode: ${data.mapMode}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format added geometry result from add_sketch_geometry
 */
function formatGeometryResult(data) {
    if (!data)
        return 'No geometry data';
    const lines = [];
    lines.push(`Sketch: ${data.sketchLabel || data.sketchName} (${data.sketchName})`);
    lines.push('');
    if (data.geometryAdded) {
        lines.push(`Geometry Added: ${data.geometryCount || 1} element(s)`);
        lines.push('─'.repeat(60));
        if (data.geometry && data.geometry.length > 0) {
            lines.push(formatTableRow(['Index', 'Type', 'Start', 'End']));
            lines.push('─'.repeat(60));
            for (const geom of data.geometry) {
                const start = geom.startPoint ? `(${geom.startPoint.x?.toFixed(2) || 0}, ${geom.startPoint.y?.toFixed(2) || 0})` : '-';
                const end = geom.endPoint ? `(${geom.endPoint.x?.toFixed(2) || 0}, ${geom.endPoint.y?.toFixed(2) || 0})` : '-';
                lines.push(formatTableRow([
                    String(geom.index || '-'),
                    formatGeometryType(geom.type),
                    start,
                    end
                ]));
            }
        }
        else {
            lines.push(`  - Index: ${data.geometryIndex}, Type: ${formatGeometryType(data.geometryType)}`);
        }
    }
    else {
        lines.push('Failed to add geometry');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format constraint addition result from add_sketch_constraint
 */
function formatConstraintResult(data) {
    if (!data)
        return 'No constraint data';
    const lines = [];
    lines.push(`Sketch: ${data.sketchLabel || data.sketchName} (${data.sketchName})`);
    lines.push('');
    if (data.constraintAdded) {
        lines.push(`Constraint Added: ${data.constraintCount || 1} constraint(s)`);
        lines.push('─'.repeat(60));
        if (data.constraints && data.constraints.length > 0) {
            lines.push(formatTableRow(['Index', 'Type', 'Value']));
            lines.push('─'.repeat(60));
            for (const constraint of data.constraints) {
                lines.push(formatTableRow([
                    String(constraint.index || '-'),
                    formatConstraintType(constraint.type),
                    constraint.value !== undefined ? formatConstraintValue(constraint.type, constraint.value) : '-'
                ]));
            }
        }
        else {
            lines.push(`  - Index: ${data.constraintIndex}, Type: ${formatConstraintType(data.constraintType)}`);
            if (data.constraintValue !== undefined) {
                lines.push(`    Value: ${formatConstraintValue(data.constraintType, data.constraintValue)}`);
            }
        }
    }
    else {
        lines.push('Failed to add constraint');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format sketch geometry listing from list_sketch_geometry
 */
function formatSketchGeometry(data) {
    if (!data)
        return 'No sketch geometry data';
    const lines = [];
    lines.push(`Sketch: ${data.sketchLabel || data.sketchName} (${data.sketchName})`);
    lines.push('');
    // Geometry section
    lines.push(`Geometry: ${data.geometryCount || 0} element(s)`);
    if (data.geometry && data.geometry.length > 0) {
        lines.push('─'.repeat(80));
        lines.push(formatTableRow(['Idx', 'Type', 'Start Point', 'End Point']));
        lines.push('─'.repeat(80));
        for (const geom of data.geometry) {
            const start = geom.startPoint
                ? `(${geom.startPoint.x?.toFixed(2) || 0}, ${geom.startPoint.y?.toFixed(2) || 0})`
                : '-';
            const end = geom.endPoint
                ? `(${geom.endPoint.x?.toFixed(2) || 0}, ${geom.endPoint.y?.toFixed(2) || 0})`
                : '-';
            lines.push(formatTableRow([
                String(geom.index ?? geom.idx ?? '-'),
                formatGeometryType(geom.type),
                start,
                end
            ]));
        }
    }
    else {
        lines.push('  (No geometry)');
    }
    lines.push('');
    // Constraints section
    lines.push(`Constraints: ${data.constraintCount || 0} constraint(s)`);
    if (data.constraints && data.constraints.length > 0) {
        lines.push('─'.repeat(80));
        lines.push(formatTableRow(['Idx', 'Type', 'Value', 'Elements']));
        lines.push('─'.repeat(80));
        for (const constraint of data.constraints) {
            const elements = formatConstraintElements(constraint);
            lines.push(formatTableRow([
                String(constraint.index ?? constraint.idx ?? '-'),
                formatConstraintType(constraint.type),
                constraint.value !== undefined ? formatConstraintValue(constraint.type, constraint.value) : '-',
                elements
            ]));
        }
    }
    else {
        lines.push('  (No constraints)');
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Helper: Format geometry type string
 */
function formatGeometryType(typeId) {
    if (!typeId)
        return '-';
    // Map common geometry types to readable names
    const typeMap = {
        'Line': 'Line',
        'LineSegment': 'Line',
        'Circle': 'Circle',
        'Arc': 'Arc',
        'ArcOfCircle': 'Arc',
        'Ellipse': 'Ellipse',
        'ArcOfEllipse': 'Ellipse Arc',
        'Hyperbola': 'Hyperbola',
        'Parabola': 'Parabola',
        'BSpline': 'B-Spline',
        'BezierCurve': 'Bezier',
        'Point': 'Point',
        'Rectangle': 'Rectangle',
        'TrimmedArc': 'Trimmed Arc'
    };
    return typeMap[typeId] || typeId;
}
/**
 * Helper: Format constraint type string
 */
function formatConstraintType(typeId) {
    if (!typeId)
        return '-';
    // Map common constraint types to readable names
    const typeMap = {
        'Coincident': 'Coincident',
        'Horizontal': 'Horizontal',
        'Vertical': 'Vertical',
        'Parallel': 'Parallel',
        'Perpendicular': 'Perpendicular',
        'Tangent': 'Tangent',
        'Equal': 'Equal',
        'Symmetric': 'Symmetric',
        'DistanceX': 'Distance X',
        'DistanceY': 'Distance Y',
        'Distance': 'Distance',
        'Radius': 'Radius',
        'Diameter': 'Diameter',
        'Angle': 'Angle',
        'InternalAngle': 'Internal Angle',
        'PointOnObject': 'Point On Object',
        'Midpoint': 'Midpoint',
        'Lock': 'Lock'
    };
    return typeMap[typeId] || typeId;
}
/**
 * Helper: Format constraint value with units
 */
function formatConstraintValue(type, value) {
    if (value === undefined || value === null)
        return '-';
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue))
        return String(value);
    // Angle constraints are in radians, convert to degrees
    if (type && (type.includes('Angle') || type === 'Lock')) {
        return `${(numValue * 180 / Math.PI).toFixed(1)}°`;
    }
    // Distance/length constraints are in mm
    return `${numValue.toFixed(2)} mm`;
}
/**
 * Helper: Format constraint element references
 */
function formatConstraintElements(constraint) {
    const parts = [];
    if (constraint.geoIndex1 !== undefined) {
        const pointLabel = formatPointPosition(constraint.pointPos1);
        parts.push(`Element ${constraint.geoIndex1}${pointLabel ? ` (${pointLabel})` : ''}`);
    }
    if (constraint.geoIndex2 !== undefined) {
        const pointLabel = formatPointPosition(constraint.pointPos2);
        parts.push(`Element ${constraint.geoIndex2}${pointLabel ? ` (${pointLabel})` : ''}`);
    }
    return parts.length > 0 ? parts.join(' ↔ ') : '-';
}
/**
 * Helper: Format point position to readable label
 * 1=start, 2=end, 3=center
 */
function formatPointPosition(pos) {
    if (pos === undefined || pos === null || pos === -1)
        return '';
    const labels = {
        1: 'start',
        2: 'end',
        3: 'center'
    };
    return labels[pos] || `point${pos}`;
}
/**
 * Format feature creation result from create_pad, create_pocket, create_revolution, etc.
 */
function formatFeatureResult(data) {
    if (!data)
        return 'No feature data';
    const lines = [];
    lines.push(`Feature: ${data.featureLabel || data.featureName} (${data.featureName})`);
    lines.push(`Type: ${data.featureType || 'Feature'}`);
    if (data.bodyName) {
        lines.push(`Body: ${data.bodyName}`);
    }
    if (data.sketchName) {
        lines.push(`Sketch: ${data.sketchName}`);
    }
    // Feature-specific properties
    if (data.length) {
        lines.push(`Length: ${formatDimensionValue(data.length, 'mm')}`);
    }
    if (data.depth) {
        lines.push(`Depth: ${formatDimensionValue(data.depth, 'mm')}`);
    }
    if (data.angle) {
        lines.push(`Angle: ${formatDimensionValue(data.angle, 'deg')}`);
    }
    if (data.radius) {
        lines.push(`Radius: ${formatDimensionValue(data.radius, 'mm')}`);
    }
    if (data.distance) {
        lines.push(`Distance: ${formatDimensionValue(data.distance, 'mm')}`);
    }
    if (data.direction) {
        lines.push(`Direction: ${data.direction}`);
    }
    if (data.axis) {
        lines.push(`Axis: ${data.axis}`);
    }
    if (data.throughAll !== undefined) {
        lines.push(`Through All: ${data.throughAll ? 'Yes' : 'No'}`);
    }
    if (data.edgesCount !== undefined) {
        lines.push(`Edges: ${data.edgesCount}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format body operation result from create_body or set_active_body
 */
function formatBodyResult(data) {
    if (!data)
        return 'No body data';
    const lines = [];
    lines.push(`Body: ${data.bodyLabel || data.bodyName} (${data.bodyName})`);
    lines.push(`Document: ${data.documentName || '(current)'}`);
    if (data.activeBody !== undefined) {
        lines.push(`Active Body: ${data.activeBody}`);
    }
    if (data.previousBody !== undefined) {
        lines.push(`Previous Body: ${data.previousBody}`);
    }
    if (data.featureCount !== undefined) {
        lines.push(`Features: ${data.featureCount}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format body list as a readable table
 */
function formatBodyList(data) {
    if (!data)
        return 'No body data';
    const lines = [];
    lines.push(`Total Bodies: ${data.bodyCount || 0}`);
    lines.push('');
    if (data.bodies && data.bodies.length > 0) {
        lines.push(formatTableRow(['Name', 'Label', 'Features', 'Active']));
        lines.push('─'.repeat(60));
        for (const body of data.bodies) {
            lines.push(formatTableRow([
                body.name || '-',
                body.label || '-',
                String(body.featureCount || 0),
                body.isActive ? 'Yes' : 'No'
            ]));
        }
    }
    else {
        lines.push('(No bodies in document)');
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format feature dimension update result from update_feature
 */
function formatFeatureUpdate(data) {
    if (!data)
        return 'No dimension update data';
    const lines = [];
    lines.push(`Feature: ${data.featureLabel || data.featureName} (${data.featureName})`);
    lines.push('');
    lines.push(`Dimension: ${capitalize(data.dimension || 'dimension')}`);
    if (data.beforeValue !== undefined && data.afterValue !== undefined) {
        const beforeVal = formatDimensionValue(data.beforeValue, data.dimension);
        const afterVal = formatDimensionValue(data.afterValue, data.dimension);
        lines.push(`Changed: ${beforeVal} → ${afterVal}`);
    }
    else if (data.afterValue !== undefined) {
        lines.push(`Set to: ${formatDimensionValue(data.afterValue, data.dimension)}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Helper: Format dimension value with appropriate units
 */
function formatDimensionValue(value, dimensionType) {
    if (value === undefined || value === null)
        return '-';
    // If already a string with units, return as-is
    if (typeof value === 'string' && (value.includes('mm') || value.includes('deg') || value.includes('cm') || value.includes('in'))) {
        return value;
    }
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue))
        return String(value);
    // Determine unit based on dimension type
    if (dimensionType === 'angle' || dimensionType === 'deg') {
        return `${numValue.toFixed(1)}°`;
    }
    // Volume and area use cubic/square mm
    if (dimensionType === 'volume') {
        return `${numValue.toFixed(2)} mm³`;
    }
    if (dimensionType === 'area') {
        return `${numValue.toFixed(2)} mm²`;
    }
    // Default to mm for length/distance/radius
    return `${numValue.toFixed(2)} mm`;
}
function formatFileSize(bytes) {
    if (bytes === undefined || bytes === null)
        return '-';
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
/**
 * Format shape operation result from boolean operations, heal_shape, etc.
 */
function formatShapeResult(data) {
    if (!data)
        return 'No shape data';
    const lines = [];
    // Handle different field naming conventions from Python handlers
    const resultName = data.resultName || data.featureName || data.healedObject || data.shapeName;
    const resultLabel = data.resultLabel || data.featureLabel || data.healedLabel || data.shapeLabel;
    lines.push(`Shape: ${resultLabel || resultName} (${resultName})`);
    lines.push(`Type: ${data.shapeType || data.featureType || 'Shape'}`);
    if (data.shapeCount !== undefined) {
        lines.push(`Shapes in Compound: ${data.shapeCount}`);
    }
    if (data.volume !== undefined) {
        lines.push(`Volume: ${formatDimensionValue(data.volume, 'volume')}`);
    }
    if (data.issuesFixed !== undefined) {
        lines.push(`Issues Fixed: ${data.issuesFixed}`);
    }
    if (data.remainingIssues !== undefined) {
        lines.push(`Remaining Issues: ${data.remainingIssues}`);
    }
    // Handle heal_shape specific fields
    if (data.originalValid !== undefined && data.healedValid !== undefined) {
        lines.push(`Original Valid: ${data.originalValid ? 'Yes' : 'No'}`);
        lines.push(`Healed Valid: ${data.healedValid ? 'Yes' : 'No'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format shape info result from get_shape_info
 */
function formatShapeInfo(data) {
    if (!data)
        return 'No shape info data';
    const lines = [];
    lines.push(`Shape: ${data.shapeLabel || data.shapeName} (${data.shapeName})`);
    lines.push(`Shape Type: ${data.shapeType || 'Unknown'}`);
    lines.push('');
    // Topology
    if (data.topology) {
        const topo = data.topology;
        lines.push('Topology:');
        lines.push(`  Vertices: ${topo.vertices ?? 0}`);
        lines.push(`  Edges: ${topo.edges ?? 0}`);
        lines.push(`  Faces: ${topo.faces ?? 0}`);
        lines.push(`  Wires: ${topo.wires ?? 0}`);
        lines.push(`  Shells: ${topo.shells ?? 0}`);
        lines.push(`  Solids: ${topo.solids ?? 0}`);
        lines.push(`  Compounds: ${topo.compounds ?? 0}`);
        lines.push('');
    }
    // Geometric properties
    if (data.properties) {
        const props = data.properties;
        lines.push('Geometric Properties:');
        if (props.volume !== undefined) {
            lines.push(`  Volume: ${formatDimensionValue(props.volume, 'volume')}`);
        }
        if (props.area !== undefined) {
            lines.push(`  Surface Area: ${formatDimensionValue(props.area, 'area')}`);
        }
        if (props.centerOfMass) {
            const com = props.centerOfMass;
            lines.push(`  Center of Mass: (${com.x?.toFixed(2) ?? 0}, ${com.y?.toFixed(2) ?? 0}, ${com.z?.toFixed(2) ?? 0})`);
        }
        if (props.boundingBox) {
            const bb = props.boundingBox;
            lines.push(`  Bounding Box: (${bb.minX?.toFixed(2) ?? 0}, ${bb.minY?.toFixed(2) ?? 0}, ${bb.minZ?.toFixed(2) ?? 0})`);
            lines.push(`              to (${bb.maxX?.toFixed(2) ?? 0}, ${bb.maxY?.toFixed(2) ?? 0}, ${bb.maxZ?.toFixed(2) ?? 0})`);
            if (bb.xSize !== undefined && bb.ySize !== undefined && bb.zSize !== undefined) {
                lines.push(`  Dimensions: ${bb.xSize.toFixed(2)} x ${bb.ySize.toFixed(2)} x ${bb.zSize.toFixed(2)} mm`);
            }
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format shape validation result from validate_shape
 */
function formatShapeValidation(data) {
    if (!data)
        return 'No validation data';
    const lines = [];
    lines.push(`Shape: ${data.shapeLabel || data.shapeName} (${data.shapeName})`);
    lines.push('');
    if (data.isValid !== undefined) {
        lines.push(`Valid: ${data.isValid ? 'Yes' : 'No'}`);
    }
    lines.push(`Issues Found: ${data.issueCount ?? 0}`);
    if (data.issues && data.issues.length > 0) {
        lines.push('');
        lines.push('Detected Issues:');
        for (const issue of data.issues) {
            lines.push(`  - ${issue.type || 'Unknown'}: ${issue.description || issue.message || 'No description'}`);
        }
    }
    if (!data.isValid && data.issues && data.issues.length > 0) {
        lines.push('');
        lines.push('Recommendation: Consider using heal_shape to fix detected issues.');
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
// ============================================================================
// Assembly Constraint Formatters
// ============================================================================
/**
 * Format assembly creation result
 */
function formatAssemblyCreationResult(data) {
    if (!data)
        return 'No assembly data';
    const lines = [];
    lines.push(`Assembly: ${data.assemblyLabel || data.assemblyName} (${data.assemblyName})`);
    lines.push(`Document: ${data.documentName || '(current)'}`);
    if (data.componentCount !== undefined) {
        lines.push(`Components: ${data.componentCount}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format component list from list_assembly_components
 */
function formatComponentList(data) {
    if (!data)
        return 'No component data';
    const lines = [];
    lines.push(`Assembly: ${data.assemblyLabel || data.assemblyName} (${data.assemblyName})`);
    lines.push(`Total Components: ${data.componentCount || 0}`);
    lines.push('');
    if (data.components && data.components.length > 0) {
        lines.push(formatTableRow(['Name', 'Label', 'Constraints']));
        lines.push('─'.repeat(60));
        for (const comp of data.components) {
            lines.push(formatTableRow([
                comp.name || '-',
                comp.label || '-',
                String(comp.constraintCount || 0)
            ]));
        }
    }
    else {
        lines.push('(No components in assembly)');
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format assembly constraint creation result
 */
function formatConstraintCreationResult(data) {
    if (!data)
        return 'No constraint data';
    const lines = [];
    if (data.constraintAdded) {
        lines.push(`Constraint Added: ${data.constraintLabel || data.constraintName} (${data.constraintName})`);
        lines.push(`Type: ${formatAssemblyConstraintType(data.constraintType)}`);
        lines.push('');
        if (data.object1 && data.object2) {
            lines.push(`Objects: ${data.object1} ↔ ${data.object2}`);
        }
        if (data.subobject1 && data.subobject2) {
            lines.push(`Subobjects: ${data.subobject1} ↔ ${data.subobject2}`);
        }
        if (data.value !== undefined) {
            if (data.constraintType && (data.constraintType.toLowerCase().includes('angle') || data.constraintType.toLowerCase().includes('parallel') || data.constraintType.toLowerCase().includes('perpendicular'))) {
                lines.push(`Value: ${formatAngleValue(data.value)}`);
            }
            else {
                lines.push(`Value: ${formatDistanceValue(data.value)}`);
            }
        }
        if (data.solverStatus) {
            lines.push(`Solver Status: ${data.solverStatus}`);
        }
    }
    else {
        lines.push('Failed to add constraint');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format assembly constraint list
 */
function formatConstraintList(data) {
    if (!data)
        return 'No constraint data';
    const lines = [];
    if (data.assemblyName) {
        lines.push(`Assembly: ${data.assemblyLabel || data.assemblyName} (${data.assemblyName})`);
    }
    lines.push(`Total Constraints: ${data.constraintCount || 0}`);
    lines.push('');
    if (data.constraints && data.constraints.length > 0) {
        lines.push(formatTableRow(['Name', 'Type', 'Objects', 'Value', 'Status']));
        lines.push('─'.repeat(80));
        for (const constraint of data.constraints) {
            const objects = constraint.object1 && constraint.object2
                ? `${constraint.object1} ↔ ${constraint.object2}`
                : '-';
            let value = '-';
            if (constraint.value !== undefined) {
                if (constraint.constraintType && (constraint.constraintType.toLowerCase().includes('angle'))) {
                    value = formatAngleValue(constraint.value);
                }
                else {
                    value = formatDistanceValue(constraint.value);
                }
            }
            const status = constraint.suppressed ? 'Suppressed' : (constraint.solverStatus || 'Active');
            lines.push(formatTableRow([
                constraint.name || '-',
                formatAssemblyConstraintType(constraint.type),
                objects.length > 25 ? objects.substring(0, 22) + '...' : objects,
                value,
                status
            ]));
        }
    }
    else {
        lines.push('(No constraints in assembly)');
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format constraint update result
 */
function formatConstraintUpdate(data) {
    if (!data)
        return 'No update data';
    const lines = [];
    lines.push(`Constraint: ${data.constraintLabel || data.constraintName} (${data.constraintName})`);
    lines.push(`Type: ${formatAssemblyConstraintType(data.constraintType)}`);
    lines.push('');
    if (data.oldValue !== undefined && data.newValue !== undefined) {
        const isAngle = data.constraintType && (data.constraintType.toLowerCase().includes('angle'));
        const formattedOld = isAngle ? formatAngleValue(data.oldValue) : formatDistanceValue(data.oldValue);
        const formattedNew = isAngle ? formatAngleValue(data.newValue) : formatDistanceValue(data.newValue);
        lines.push(`Updated: ${formattedOld} → ${formattedNew}`);
    }
    if (data.solverStatus) {
        lines.push(`Solver Status: ${data.solverStatus}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Helper: Format assembly constraint type string
 */
function formatAssemblyConstraintType(typeId) {
    if (!typeId)
        return '-';
    const typeMap = {
        'Coincident': 'Coincident',
        'Parallel': 'Parallel',
        'Perpendicular': 'Perpendicular',
        'Angle': 'Angle',
        'Distance': 'Distance',
        'Insert': 'Insert',
        'Tangent': 'Tangent',
        'Equal': 'Equal',
        'Symmetric': 'Symmetric',
        'Contact': 'Contact'
    };
    return typeMap[typeId] || typeId;
}
/**
 * Helper: Format angle value with degrees
 */
function formatAngleValue(value) {
    if (value === undefined || value === null)
        return '-';
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue))
        return String(value);
    return `${numValue.toFixed(1)}°`;
}
/**
 * Helper: Format distance value with mm
 */
function formatDistanceValue(value) {
    if (value === undefined || value === null)
        return '-';
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue))
        return String(value);
    return `${numValue.toFixed(2)} mm`;
}
// ============================================================================
// Draft Workbench Result Formatters
// ============================================================================
/**
 * Format point creation result
 */
function formatPointCreation(data) {
    if (!data)
        return 'No point data';
    const lines = [];
    lines.push(`Created Point: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.coordinates) {
        const coord = data.coordinates;
        lines.push(`Position: (${coord.x?.toFixed(2) || 0}, ${coord.y?.toFixed(2) || 0}, ${coord.z?.toFixed(2) || 0}) mm`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format geometry creation result for various Draft objects
 */
function formatGeometryCreation(data, objectType) {
    if (!data)
        return 'No geometry data';
    const lines = [];
    lines.push(`Created ${objectType}: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.center) {
        const center = data.center;
        lines.push(`Center: (${center.x?.toFixed(2) || 0}, ${center.y?.toFixed(2) || 0}, ${center.z?.toFixed(2) || 0}) mm`);
    }
    if (data.radius !== undefined) {
        lines.push(`Radius: ${data.radius.toFixed(2)} mm`);
    }
    if (data.majorRadius !== undefined && data.minorRadius !== undefined) {
        lines.push(`Major Radius: ${data.majorRadius.toFixed(2)} mm`);
        lines.push(`Minor Radius: ${data.minorRadius.toFixed(2)} mm`);
    }
    if (data.width !== undefined && data.height !== undefined) {
        lines.push(`Size: ${data.width.toFixed(2)} x ${data.height.toFixed(2)} mm`);
    }
    if (data.sides !== undefined) {
        lines.push(`Sides: ${data.sides}`);
        lines.push(`Radius: ${(data.radius || 0).toFixed(2)} mm`);
    }
    if (data.startPoint && data.endPoint) {
        const start = data.startPoint;
        const end = data.endPoint;
        lines.push(`From: (${start.x?.toFixed(2) || 0}, ${start.y?.toFixed(2) || 0}, ${start.z?.toFixed(2) || 0})`);
        lines.push(`To: (${end.x?.toFixed(2) || 0}, ${end.y?.toFixed(2) || 0}, ${end.z?.toFixed(2) || 0})`);
    }
    if (data.pointCount !== undefined) {
        lines.push(`Points: ${data.pointCount}`);
    }
    if (data.closed !== undefined) {
        lines.push(`Closed: ${data.closed ? 'Yes' : 'No'}`);
    }
    if (data.startAngle !== undefined && data.endAngle !== undefined) {
        lines.push(`Start Angle: ${data.startAngle.toFixed(1)}°`);
        lines.push(`End Angle: ${data.endAngle.toFixed(1)}°`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format dimension creation result
 */
function formatDimensionCreation(data) {
    if (!data)
        return 'No dimension data';
    const lines = [];
    lines.push(`Created Dimension: ${data.objectLabel || data.objectName} (${data.objectName})`);
    lines.push(`Type: ${data.objectType || 'Dimension'}`);
    if (data.measurement !== undefined) {
        if (data.measurementType === 'angular') {
            lines.push(`Angle: ${data.measurement.toFixed(1)}`);
        }
        else if (data.objectType !== 'AngularDimension') {
            lines.push(`Measurement: ${data.measurement.toFixed(2)} mm`);
        }
    }
    if (data.direction) {
        lines.push(`Direction: ${data.direction.toUpperCase()}`);
    }
    if (data.previousText !== undefined || data.newText !== undefined) {
        lines.push('');
        if (data.previousText) {
            lines.push(`Previous text: ${data.previousText}`);
        }
        if (data.newText) {
            lines.push(`New text: ${data.newText}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format text creation result
 */
function formatTextCreation(data) {
    if (!data)
        return 'No text data';
    const lines = [];
    lines.push(`Created Text: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.text) {
        lines.push('');
        lines.push(`"${data.text}"`);
    }
    if (data.position) {
        const pos = data.position;
        lines.push(`Position: (${pos.x?.toFixed(2) || 0}, ${pos.y?.toFixed(2) || 0}, ${pos.z?.toFixed(2) || 0}) mm`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format modification result (move, rotate, scale, offset, join, split)
 */
function formatModificationResult(data, operation) {
    if (!data)
        return 'No modification data';
    const lines = [];
    const opName = operation.charAt(0).toUpperCase() + operation.slice(1);
    if (operation === 'move') {
        lines.push(`Moved ${data.objectNames?.length || 1} object(s): ${(data.objectNames || []).join(', ')}`);
        if (data.originalPositions && data.newPositions) {
            const orig = data.originalPositions[0];
            const newPos = data.newPositions[0];
            if (orig && newPos) {
                lines.push(`From: (${orig.x?.toFixed(2) || 0}, ${orig.y?.toFixed(2) || 0}, ${orig.z?.toFixed(2) || 0})`);
                lines.push(`To: (${newPos.x?.toFixed(2) || 0}, ${newPos.y?.toFixed(2) || 0}, ${newPos.z?.toFixed(2) || 0}) mm`);
            }
        }
    }
    else if (operation === 'rotate') {
        lines.push(`Rotated ${data.objectNames?.length || 1} object(s): ${(data.objectNames || []).join(', ')}`);
        if (data.angle !== undefined) {
            if (typeof data.angle === 'string') {
                lines.push(`Angle: ${data.angle}`);
            }
            else {
                lines.push(`Angle: ${data.angle}°`);
            }
        }
        if (data.center) {
            lines.push(`Center: (${data.center.x?.toFixed(2) || 0}, ${data.center.y?.toFixed(2) || 0}, ${data.center.z?.toFixed(2) || 0})`);
        }
    }
    else if (operation === 'scale') {
        lines.push(`Scaled ${data.objectNames?.length || 1} object(s): ${(data.objectNames || []).join(', ')}`);
        if (data.scaleFactor !== undefined) {
            lines.push(`Scale Factor: ${data.scaleFactor.toFixed(2)}`);
        }
        if (data.center) {
            lines.push(`Center: (${data.center.x?.toFixed(2) || 0}, ${data.center.y?.toFixed(2) || 0}, ${data.center.z?.toFixed(2) || 0})`);
        }
    }
    else if (operation === 'offset') {
        lines.push(`Created offset: ${data.newObjectName || 'Offset'}`);
        lines.push(`Original: ${data.originalName}`);
        if (data.distance !== undefined) {
            lines.push(`Distance: ${data.distance.toFixed(2)} mm`);
        }
    }
    else if (operation === 'join') {
        lines.push(`Joined ${data.originalNames?.length || 0} objects into: ${data.newObjectName}`);
        lines.push(`Type: ${data.objectType || 'Wire'}`);
    }
    else if (operation === 'split') {
        lines.push(`Split ${data.originalName} into ${data.newObjectNames?.length || 0} object(s): ${(data.newObjectNames || []).join(', ')}`);
    }
    else {
        lines.push(`${opName} operation completed`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
// ============================================================================
// Pattern and Array Tools Result Formatters
// ============================================================================
/**
 * Format pattern creation result from create_linear_pattern, create_polar_pattern, etc.
 */
function formatPatternCreation(data) {
    if (!data)
        return 'No pattern data';
    const lines = [];
    lines.push(`Pattern: ${data.patternLabel || data.patternName} (${data.patternName})`);
    lines.push(`Type: ${data.patternType || 'Pattern'}`);
    if (data.sourceObject) {
        lines.push(`Source: ${data.sourceObject}`);
    }
    if (data.count !== undefined) {
        lines.push(`Count: ${data.count}`);
    }
    if (data.totalCount !== undefined) {
        lines.push(`Total Copies: ${data.totalCount}`);
    }
    if (data.spacing !== undefined) {
        lines.push(`Spacing: ${data.spacing.toFixed(2)} mm`);
    }
    if (data.angle !== undefined) {
        lines.push(`Angle: ${data.angle.toFixed(1)}°`);
    }
    if (data.axis) {
        lines.push(`Axis: (${data.axis.x?.toFixed(2)}, ${data.axis.y?.toFixed(2)}, ${data.axis.z?.toFixed(2)})`);
    }
    if (data.direction) {
        lines.push(`Direction: ${data.direction}`);
    }
    if (data.createLinks !== undefined) {
        lines.push(`Linked: ${data.createLinks ? 'Yes' : 'No'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format pattern update result from update_linear_pattern, update_polar_pattern
 */
function formatPatternUpdate(data) {
    if (!data)
        return 'No update data';
    const lines = [];
    lines.push(`Pattern: ${data.patternLabel || data.patternName} (${data.patternName})`);
    lines.push(`Type: ${data.patternType || 'Pattern'}`);
    lines.push('');
    if (data.oldCount !== undefined && data.newCount !== undefined) {
        lines.push(`Count: ${data.oldCount} → ${data.newCount}`);
    }
    if (data.oldSpacing !== undefined && data.newSpacing !== undefined) {
        lines.push(`Spacing: ${data.oldSpacing.toFixed(2)} mm → ${data.newSpacing.toFixed(2)} mm`);
    }
    if (data.oldAngle !== undefined && data.newAngle !== undefined) {
        lines.push(`Angle: ${data.oldAngle.toFixed(1)}° → ${data.newAngle.toFixed(1)}°`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format pattern info result from get_pattern_info
 */
function formatPatternInfo(data) {
    if (!data)
        return 'No pattern info';
    const lines = [];
    lines.push(`Pattern: ${data.patternLabel || data.patternName} (${data.patternName})`);
    lines.push(`Type: ${data.patternType || 'Unknown'}`);
    lines.push('');
    if (data.sourceObject) {
        lines.push(`Source Object: ${data.sourceObject}`);
    }
    if (data.bodyName) {
        lines.push(`Body: ${data.bodyName}`);
    }
    if (data.count !== undefined) {
        lines.push(`Instance Count: ${data.count}`);
    }
    if (data.alignmentMode) {
        lines.push(`Alignment: ${data.alignmentMode}`);
    }
    if (data.patternType === 'LinearPattern' || data.patternType === 'Linear') {
        if (data.direction) {
            lines.push(`Direction: ${data.direction}`);
        }
        if (data.spacing !== undefined) {
            lines.push(`Spacing: ${data.spacing.toFixed(2)} mm`);
        }
    }
    else if (data.patternType === 'PolarPattern' || data.patternType === 'Polar') {
        if (data.angle !== undefined) {
            lines.push(`Angle: ${data.angle.toFixed(1)}°`);
        }
        if (data.axis) {
            lines.push(`Axis: (${data.axis.x?.toFixed(2)}, ${data.axis.y?.toFixed(2)}, ${data.axis.z?.toFixed(2)})`);
        }
    }
    else if (data.patternType === 'RectangularPattern' || data.patternType === 'Rectangular') {
        if (data.countX !== undefined && data.countY !== undefined) {
            lines.push(`Grid: ${data.countX} × ${data.countY}`);
        }
        if (data.spacingX !== undefined) {
            lines.push(`Spacing X: ${data.spacingX.toFixed(2)} mm`);
        }
        if (data.spacingY !== undefined) {
            lines.push(`Spacing Y: ${data.spacingY.toFixed(2)} mm`);
        }
    }
    if (data.positions && data.positions.length > 0) {
        lines.push('');
        lines.push(`Instances (${data.positions.length}):`);
        lines.push('─'.repeat(60));
        lines.push(formatTableRow(['Index', 'Position (X, Y, Z)']));
        lines.push('─'.repeat(60));
        for (const pos of data.positions.slice(0, 10)) {
            const x = pos.x?.toFixed(2) || '0.00';
            const y = pos.y?.toFixed(2) || '0.00';
            const z = pos.z?.toFixed(2) || '0.00';
            lines.push(formatTableRow([String(pos.index), `(${x}, ${y}, ${z})`]));
        }
        if (data.positions.length > 10) {
            lines.push(`... and ${data.positions.length - 10} more`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
// ============================================================================
// TechDraw Workbench Result Formatters
// ============================================================================
/**
 * Format TechDraw page creation result
 */
function formatPageCreation(data) {
    if (!data)
        return 'No page data';
    const lines = [];
    lines.push(`Page: ${data.pageLabel || data.pageName} (${data.pageName})`);
    if (data.template) {
        lines.push(`Template: ${data.template}`);
    }
    if (data.paperSize) {
        lines.push(`Paper Size: ${data.paperSize}`);
    }
    if (data.viewCount !== undefined) {
        lines.push(`Views: ${data.viewCount}`);
    }
    if (data.views && data.views.length > 0) {
        lines.push('');
        lines.push('Views on page:');
        for (const view of data.views) {
            lines.push(`  - ${view.label || view.name} (${view.type || 'View'})`);
        }
    }
    if (data.pageCount !== undefined) {
        lines.push('');
        lines.push(`Total pages: ${data.pageCount}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format TechDraw view creation result
 */
function formatViewCreation(data) {
    if (!data)
        return 'No view data';
    const lines = [];
    if (data.groupName) {
        lines.push(`Projection Group: ${data.groupLabel || data.groupName} (${data.groupName})`);
        lines.push(`Source: ${data.sourceObject}`);
        lines.push('');
        lines.push('Views created:');
        if (data.views && data.views.length > 0) {
            for (const view of data.views) {
                lines.push(`  - ${view.viewLabel || view.viewName} (${view.viewType || 'View'})`);
            }
        }
    }
    else {
        lines.push(`View: ${data.viewLabel || data.viewName} (${data.viewName})`);
        lines.push(`Type: ${data.viewType || data.type || 'Standard'}`);
        lines.push(`Source: ${data.sourceObject}`);
        if (data.projectionType) {
            lines.push(`Projection: ${data.projectionType} Angle`);
        }
        if (data.scale !== undefined) {
            lines.push(`Scale: ${data.scale}`);
        }
        if (data.cutLine) {
            lines.push(`Cut Line: from (${data.cutLine.point1?.x}, ${data.cutLine.point1?.y}) to (${data.cutLine.point2?.x}, ${data.cutLine.point2?.y})`);
        }
    }
    if (data.pageName) {
        lines.push(`Page: ${data.pageName}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format TechDraw dimension creation result
 */
function formatTechDrawDimension(data) {
    if (!data)
        return 'No dimension data';
    const lines = [];
    lines.push(`Dimension: ${data.dimensionLabel || data.dimensionName} (${data.dimensionName})`);
    const dimType = data.dimensionType || data.type || 'Dimension';
    lines.push(`Type: ${dimType}`);
    if (data.measurement !== undefined) {
        if (dimType.toLowerCase().includes('angular')) {
            lines.push(`Angle: ${typeof data.measurement === 'number' ? data.measurement.toFixed(1) + '°' : data.measurement}`);
        }
        else if (dimType.toLowerCase().includes('diameter')) {
            lines.push(`Diameter: ${typeof data.measurement === 'number' ? data.measurement.toFixed(2) + ' mm' : data.measurement}`);
        }
        else if (dimType.toLowerCase().includes('radial') || dimType.toLowerCase().includes('radius')) {
            lines.push(`Radius: ${typeof data.measurement === 'number' ? data.measurement.toFixed(2) + ' mm' : data.measurement}`);
        }
        else {
            lines.push(`Measurement: ${typeof data.measurement === 'number' ? data.measurement.toFixed(2) + ' mm' : data.measurement}`);
        }
    }
    if (data.startPoint && data.endPoint) {
        lines.push(`From: (${data.startPoint.x}, ${data.startPoint.y})`);
        lines.push(`To: (${data.endPoint.x}, ${data.endPoint.y})`);
    }
    if (data.circleName) {
        lines.push(`Circle: ${data.circleName}`);
    }
    if (data.direction) {
        lines.push(`Direction: ${data.direction}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format TechDraw annotation creation result
 */
function formatAnnotationCreation(data) {
    if (!data)
        return 'No annotation data';
    const lines = [];
    if (data.textName) {
        lines.push(`Text: ${data.textLabel || data.textName} (${data.textName})`);
    }
    else if (data.balloonName) {
        lines.push(`Balloon: ${data.balloonLabel || data.balloonName} (${data.balloonName})`);
    }
    else if (data.leaderName) {
        lines.push(`Leader: ${data.leaderLabel || data.leaderName} (${data.leaderName})`);
    }
    if (data.text) {
        lines.push(`Content: "${data.text}"`);
    }
    if (data.position) {
        lines.push(`Position: (${data.position.x}, ${data.position.y})`);
    }
    if (data.targetPoint) {
        lines.push(`Target: (${data.targetPoint.x}, ${data.targetPoint.y})`);
    }
    if (data.points) {
        lines.push(`Path: ${data.points.length} points`);
    }
    if (data.pageName) {
        lines.push(`Page: ${data.pageName}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format TechDraw export result
 */
function formatExportResult(data) {
    if (!data)
        return 'No export data';
    const lines = [];
    if (data.success) {
        lines.push(`Exported: ${data.pageName}`);
        lines.push(`Format: ${data.format?.toUpperCase() || (data.outputPath?.endsWith('.svg') ? 'SVG' : 'PDF')}`);
        lines.push(`Path: ${data.outputPath}`);
    }
    else {
        lines.push(`Export failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
// ============================================================================
// Surface Modeling Result Formatters
// ============================================================================
/**
 * Format loft creation result
 */
function formatLoftCreation(data) {
    if (!data)
        return 'No loft data';
    const lines = [];
    lines.push(`Loft: ${data.loftLabel || data.loftName} (${data.loftName})`);
    if (data.profileCount !== undefined) {
        lines.push(`Profiles: ${data.profileCount}`);
    }
    if (data.solid !== undefined) {
        lines.push(`Solid: ${data.solid ? 'Yes' : 'No'}`);
    }
    if (data.closed !== undefined) {
        lines.push(`Closed: ${data.closed ? 'Yes' : 'No'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format sweep creation result
 */
function formatSweepCreation(data) {
    if (!data)
        return 'No sweep data';
    const lines = [];
    const resultName = data.sweepName || data.pipeName || data.surfaceName || data.loftName;
    const resultLabel = data.sweepLabel || data.pipeLabel || data.surfaceLabel || data.loftLabel;
    lines.push(`Surface: ${resultLabel || resultName} (${resultName})`);
    if (data.profileName) {
        lines.push(`Profile: ${data.profileName}`);
    }
    if (data.pathName) {
        lines.push(`Path: ${data.pathName}`);
    }
    if (data.profileCount !== undefined) {
        lines.push(`Profiles: ${data.profileCount}`);
    }
    if (data.solid !== undefined) {
        lines.push(`Solid: ${data.solid ? 'Yes' : 'No'}`);
    }
    if (data.frenet !== undefined) {
        lines.push(`Frenet Frame: ${data.frenet ? 'Yes' : 'No'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format surface operation result (ruled, extend, trim, etc.)
 */
function formatSurfaceOperation(data) {
    if (!data)
        return 'No surface operation data';
    const lines = [];
    const resultName = data.surfaceName || data.resultName || data.loftName;
    const resultLabel = data.surfaceLabel || data.resultLabel || data.loftLabel;
    lines.push(`Surface: ${resultLabel || resultName} (${resultName})`);
    lines.push(`Type: ${data.operationType || data.surfaceType || 'Surface'}`);
    if (data.curve1Name) {
        lines.push(`Curve 1: ${data.curve1Name}`);
    }
    if (data.curve2Name) {
        lines.push(`Curve 2: ${data.curve2Name}`);
    }
    if (data.edgeCount !== undefined) {
        lines.push(`Edges: ${data.edgeCount}`);
    }
    if (data.distance !== undefined) {
        lines.push(`Distance: ${typeof data.distance === 'number' ? data.distance.toFixed(2) + ' mm' : data.distance}`);
    }
    if (data.direction) {
        lines.push(`Direction: ${data.direction}`);
    }
    if (data.toolName) {
        lines.push(`Tool: ${data.toolName}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format surface info result
 */
function formatSurfaceInfo(data) {
    if (!data)
        return 'No surface info data';
    const lines = [];
    lines.push(`Surface: ${data.surfaceLabel || data.surfaceName} (${data.surfaceName})`);
    if (data.surfaceType) {
        lines.push(`Type: ${data.surfaceType}`);
    }
    if (data.area !== undefined) {
        lines.push(`Area: ${data.area.toFixed(2)} mm²`);
    }
    if (data.volume !== undefined) {
        lines.push(`Volume: ${data.volume.toFixed(2)} mm³`);
    }
    if (data.centerOfMass) {
        const com = data.centerOfMass;
        lines.push(`Center: (${com.x?.toFixed(2) || 0}, ${com.y?.toFixed(2) || 0}, ${com.z?.toFixed(2) || 0})`);
    }
    if (data.curvature) {
        lines.push('');
        lines.push('Curvature:');
        if (data.curvature.min !== undefined) {
            lines.push(`  Min: ${data.curvature.min.toFixed(4)}`);
        }
        if (data.curvature.max !== undefined) {
            lines.push(`  Max: ${data.curvature.max.toFixed(4)}`);
        }
        if (data.curvature.gaussian !== undefined) {
            lines.push(`  Gaussian: ${data.curvature.gaussian.toFixed(4)}`);
        }
        if (data.curvature.mean !== undefined) {
            lines.push(`  Mean: ${data.curvature.mean.toFixed(4)}`);
        }
    }
    if (data.isValid !== undefined) {
        lines.push('');
        lines.push(`Valid: ${data.isValid ? 'Yes' : 'No'}`);
    }
    if (data.issues && data.issues.length > 0) {
        lines.push('');
        lines.push(`Issues Found: ${data.issues.length}`);
        for (const issue of data.issues) {
            lines.push(`  - ${issue.type || 'Unknown'}: ${issue.description || 'No description'}`);
        }
    }
    if (data.issueCount !== undefined && data.issueCount > 0) {
        lines.push(`Issue Count: ${data.issueCount}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format blend surface creation result
 */
function formatBlendSurface(data) {
    if (!data)
        return 'No blend surface data';
    const lines = [];
    lines.push(`Blend Surface: ${data.featureLabel || data.featureName} (${data.featureName})`);
    lines.push(`Type: ${data.featureType || 'Blend'}`);
    lines.push('');
    lines.push(`Source Surface 1: ${data.sourceSurface1}`);
    lines.push(`Source Surface 2: ${data.sourceSurface2}`);
    lines.push(`Continuity: ${data.continuity || 'G1'}`);
    if (data.isValid !== undefined) {
        lines.push(`Valid: ${data.isValid ? 'Yes' : 'No'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format offset surface creation result
 */
function formatOffsetSurface(data) {
    if (!data)
        return 'No offset surface data';
    const lines = [];
    lines.push(`Offset Surface: ${data.featureLabel || data.featureName} (${data.featureName})`);
    lines.push(`Type: ${data.featureType || 'Offset'}`);
    lines.push('');
    lines.push(`Source Surface: ${data.sourceSurface}`);
    if (data.distance !== undefined) {
        lines.push(`Offset Distance: ${data.distance.toFixed(2)} mm`);
    }
    if (data.isValid !== undefined) {
        lines.push(`Valid: ${data.isValid ? 'Yes' : 'No'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format surface analysis result
 */
function formatSurfaceAnalysis(data) {
    if (!data)
        return 'No surface analysis data';
    const lines = [];
    lines.push(`Surface Analysis: ${data.surfaceLabel || data.surfaceName} (${data.surfaceName})`);
    lines.push(`Type: ${data.surfaceType || 'Surface'}`);
    lines.push('');
    if (data.area !== undefined) {
        lines.push(`Area: ${data.area.toFixed(2)} mm²`);
    }
    lines.push(`Faces: ${data.facesCount || 0}`);
    lines.push(`Edges: ${data.edgesCount || 0}`);
    if (data.isValid !== undefined) {
        lines.push(`Valid: ${data.isValid ? 'Yes' : 'No'}`);
    }
    if (data.boundingBox) {
        const bb = data.boundingBox;
        lines.push('');
        lines.push('Bounding Box:');
        lines.push(`  X: ${bb.minX?.toFixed(2) || 0} to ${bb.maxX?.toFixed(2) || 0}`);
        lines.push(`  Y: ${bb.minY?.toFixed(2) || 0} to ${bb.maxY?.toFixed(2) || 0}`);
        lines.push(`  Z: ${bb.minZ?.toFixed(2) || 0} to ${bb.maxZ?.toFixed(2) || 0}`);
    }
    if (data.curvatureStatistics) {
        lines.push('');
        lines.push('Curvature Statistics:');
        const stats = data.curvatureStatistics;
        if (stats.gaussianCurvature) {
            lines.push('  Gaussian Curvature:');
            lines.push(`    Min: ${stats.gaussianCurvature.min?.toFixed(4) || 'N/A'}`);
            lines.push(`    Max: ${stats.gaussianCurvature.max?.toFixed(4) || 'N/A'}`);
            lines.push(`    Avg: ${stats.gaussianCurvature.avg?.toFixed(4) || 'N/A'}`);
        }
        if (stats.meanCurvature) {
            lines.push('  Mean Curvature:');
            lines.push(`    Min: ${stats.meanCurvature.min?.toFixed(4) || 'N/A'}`);
            lines.push(`    Max: ${stats.meanCurvature.max?.toFixed(4) || 'N/A'}`);
            lines.push(`    Avg: ${stats.meanCurvature.avg?.toFixed(4) || 'N/A'}`);
        }
        if (stats.principalCurvature) {
            lines.push('  Principal Curvature:');
            lines.push(`    Min: ${stats.principalCurvature.min?.toFixed(4) || 'N/A'}`);
            lines.push(`    Max: ${stats.principalCurvature.max?.toFixed(4) || 'N/A'}`);
        }
    }
    if (data.curvatureSampleCount !== undefined) {
        lines.push(`Curvature Samples: ${data.curvatureSampleCount}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format surface rebuild result
 */
function formatSurfaceRebuild(data) {
    if (!data)
        return 'No surface rebuild data';
    const lines = [];
    lines.push(`Surface Rebuilt: ${data.rebuiltLabel || data.rebuiltSurface} (${data.rebuiltSurface})`);
    lines.push(`Type: ${data.surfaceType || 'Rebuilt Surface'}`);
    lines.push('');
    lines.push(`Original Surface: ${data.originalSurface}`);
    lines.push(`Rebuilt Surface: ${data.rebuiltSurface}`);
    if (data.tolerance !== undefined && data.tolerance !== null) {
        lines.push(`Tolerance: ${data.tolerance}`);
    }
    if (data.isValid !== undefined) {
        lines.push(`Valid: ${data.isValid ? 'Yes' : 'No'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format loft info result
 */
function formatLoftInfo(data) {
    if (!data)
        return 'No loft info data';
    const lines = [];
    lines.push(`Loft: ${data.loftLabel || data.loftName} (${data.loftName})`);
    lines.push(`Type: ${data.loftType || 'Loft'}`);
    lines.push('');
    lines.push(`Solid: ${data.solid ? 'Yes' : 'No'}`);
    lines.push(`Closed: ${data.closed ? 'Yes' : 'No'}`);
    lines.push(`Profiles: ${data.profileCount || 0}`);
    lines.push(`Faces: ${data.facesCount || 0}`);
    lines.push(`Edges: ${data.edgesCount || 0}`);
    if (data.transitionMode !== undefined) {
        lines.push(`Transition Mode: ${data.transitionMode}`);
    }
    if (data.area !== undefined) {
        lines.push(`Area: ${data.area.toFixed(2)} mm²`);
    }
    if (data.isValid !== undefined) {
        lines.push(`Valid: ${data.isValid ? 'Yes' : 'No'}`);
    }
    if (data.boundingBox) {
        const bb = data.boundingBox;
        lines.push('');
        lines.push('Bounding Box:');
        lines.push(`  X: ${bb.minX?.toFixed(2) || 0} to ${bb.maxX?.toFixed(2) || 0}`);
        lines.push(`  Y: ${bb.minY?.toFixed(2) || 0} to ${bb.maxY?.toFixed(2) || 0}`);
        lines.push(`  Z: ${bb.minZ?.toFixed(2) || 0} to ${bb.maxZ?.toFixed(2) || 0}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format sweep info result
 */
function formatSweepInfo(data) {
    if (!data)
        return 'No sweep info data';
    const lines = [];
    lines.push(`Sweep: ${data.sweepLabel || data.sweepName} (${data.sweepName})`);
    lines.push(`Type: ${data.sweepType || 'Sweep'}`);
    lines.push('');
    lines.push(`Solid: ${data.solid ? 'Yes' : 'No'}`);
    lines.push(`Frenet Frame: ${data.frenet ? 'Yes' : 'No'}`);
    lines.push(`Profiles: ${data.profileCount || 0}`);
    lines.push(`Faces: ${data.facesCount || 0}`);
    lines.push(`Edges: ${data.edgesCount || 0}`);
    if (data.area !== undefined) {
        lines.push(`Area: ${data.area.toFixed(2)} mm²`);
    }
    if (data.isValid !== undefined) {
        lines.push(`Valid: ${data.isValid ? 'Yes' : 'No'}`);
    }
    if (data.boundingBox) {
        const bb = data.boundingBox;
        lines.push('');
        lines.push('Bounding Box:');
        lines.push(`  X: ${bb.minX?.toFixed(2) || 0} to ${bb.maxX?.toFixed(2) || 0}`);
        lines.push(`  Y: ${bb.minY?.toFixed(2) || 0} to ${bb.maxY?.toFixed(2) || 0}`);
        lines.push(`  Z: ${bb.minZ?.toFixed(2) || 0} to ${bb.maxZ?.toFixed(2) || 0}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format solver initialization result
 */
function formatSolverInit(data) {
    if (!data)
        return 'No solver data';
    const lines = [];
    lines.push(`Solver initialized for: ${data.assemblyName || 'Unknown'}`);
    lines.push(`DOF: ${data.dofCount ?? 0}`);
    lines.push(`Joints: ${data.jointCount ?? 0}`);
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format solve assembly result
 */
function formatSolveResult(data) {
    if (!data)
        return 'No solve data';
    const lines = [];
    lines.push(`Assembly: ${data.assemblyName || 'Unknown'}`);
    lines.push(`Iterations: ${data.iterations ?? 0}`);
    lines.push(`Converged: ${data.converged ? 'Yes' : 'No'}`);
    if (data.positions && data.positions.length > 0) {
        lines.push('');
        lines.push('Positions:');
        for (const pos of data.positions) {
            lines.push(`  ${pos.joint || pos.name}: ${pos.value} ${pos.unit || ''}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format DOF analysis result
 */
function formatDOFResult(data) {
    if (!data)
        return 'No DOF data';
    const lines = [];
    lines.push(`Assembly: ${data.assemblyName || 'Unknown'}`);
    lines.push('');
    lines.push(`Total DOF: ${data.totalDof ?? 0}`);
    lines.push(`Constrained: ${data.constrainedDof ?? 0}`);
    lines.push(`Free: ${data.freeDof ?? 0}`);
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format joint value result
 */
function formatJointValue(data) {
    if (!data)
        return 'No joint data';
    const lines = [];
    const unit = data.unit || 'deg';
    lines.push(`Joint: ${data.jointName || 'Unknown'}`);
    lines.push(`Value: ${data.value} ${unit}`);
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format joint limits result
 */
function formatJointLimits(data) {
    if (!data)
        return 'No limits data';
    const lines = [];
    const unit = data.unit || 'deg';
    lines.push(`Joint: ${data.jointName || 'Unknown'}`);
    lines.push(`Range: ${data.minValue} to ${data.maxValue} ${unit}`);
    lines.push(`Has limits: ${data.hasLimits ? 'Yes' : 'No'}`);
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format drive joint result
 */
function formatDriveResult(data) {
    if (!data)
        return 'No drive data';
    const lines = [];
    lines.push(`Joint: ${data.jointName || 'Unknown'}`);
    lines.push(`Motion: ${data.startValue} → ${data.endValue}`);
    lines.push(`Duration: ${data.duration}s`);
    lines.push(`Frames: ${data.frames || 0}`);
    lines.push(`Motion type: ${data.motionType || 'linear'}`);
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format animation result
 */
function formatAnimationResult(data) {
    if (!data)
        return 'No animation data';
    const lines = [];
    lines.push(`Assembly: ${data.assemblyName || 'Unknown'}`);
    lines.push(`Duration: ${data.duration}s`);
    lines.push(`Frame rate: ${data.frameRate || 30} fps`);
    lines.push(`Total frames: ${data.totalFrames || 0}`);
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format animation state result
 */
function formatAnimationState(data) {
    if (!data)
        return 'No animation state';
    const lines = [];
    lines.push(`Status: ${data.isPlaying ? 'Playing' : 'Stopped'}`);
    lines.push(`Current frame: ${data.currentFrame || 0} / ${data.totalFrames || 0}`);
    lines.push(`Duration: ${data.duration || 0}s`);
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format kinematic positions result
 */
function formatKinematicPositions(data) {
    if (!data)
        return 'No positions data';
    const lines = [];
    lines.push(`Assembly: ${data.assemblyName || 'Unknown'}`);
    lines.push('');
    if (data.positions && data.positions.length > 0) {
        lines.push('Joint positions:');
        for (const pos of data.positions) {
            const unit = pos.unit || 'deg';
            lines.push(`  ${pos.joint || pos.name}: ${pos.value} ${unit}`);
        }
    }
    else {
        lines.push('No joint positions available');
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format collision check result
 */
function formatCollisionResult(data) {
    if (!data)
        return 'No collision data';
    const lines = [];
    lines.push(`Assembly: ${data.assemblyName || 'Unknown'}`);
    lines.push(`Collisions: ${data.hasCollision ? 'Detected' : 'None'}`);
    if (data.collisionPairs && data.collisionPairs.length > 0) {
        lines.push('');
        lines.push('Colliding pairs:');
        for (const pair of data.collisionPairs) {
            lines.push(`  ${pair.object1 || pair[0]} ↔ ${pair.object2 || pair[1]}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
/**
 * Format render result
 */
function formatRenderResult(data) {
    if (!data)
        return 'No render data';
    const lines = [];
    if (data.success) {
        if (data.outputPath) {
            lines.push(`Rendered to ${data.outputPath}`);
            if (data.width && data.height) {
                lines.push(`(${data.width}x${data.height})`);
            }
        }
        if (data.rendererName) {
            lines.push(`Renderer: ${data.rendererName}`);
        }
        if (data.quality) {
            lines.push(`Quality: ${data.quality}`);
        }
    }
    else {
        lines.push('Render failed');
    }
    if (data.message) {
        lines.push(data.message);
    }
    return lines.join(' ');
}
/**
 * Format view angle result
 */
function formatViewAngle(data) {
    if (!data)
        return 'No view data';
    const lines = [];
    if (data.success) {
        if (data.viewName) {
            lines.push(`View set to ${data.viewName}`);
        }
        else if (data.position) {
            lines.push(`Camera position: (${data.position.x}, ${data.position.y}, ${data.position.z})`);
            if (data.target) {
                lines.push(`Target: (${data.target.x}, ${data.target.y}, ${data.target.z})`);
            }
        }
        else {
            lines.push('View updated');
        }
    }
    else {
        lines.push('Failed to set view');
    }
    if (data.message) {
        lines.push(data.message);
    }
    return lines.join(' ');
}
/**
 * Format animation capture result
 */
function formatAnimationCapture(data) {
    if (!data)
        return 'No capture data';
    const lines = [];
    if (data.success) {
        if (data.outputDir) {
            lines.push(`Capturing to ${data.outputDir}`);
        }
        if (data.fps) {
            lines.push(`${data.fps} fps`);
        }
        if (data.frameNumber !== undefined) {
            lines.push(`Frame ${data.frameNumber}`);
        }
        if (data.totalFrames !== undefined) {
            lines.push(`${data.totalFrames} frames captured`);
        }
    }
    else {
        lines.push('Capture failed');
    }
    if (data.message) {
        lines.push(data.message);
    }
    return lines.join(' - ');
}
/**
 * Format video export result
 */
function formatVideoExport(data) {
    if (!data)
        return 'No export data';
    const lines = [];
    if (data.success) {
        if (data.outputPath) {
            lines.push(`Exported ${data.outputPath}`);
        }
        if (data.format) {
            lines.push(`Format: ${data.format.toUpperCase()}`);
        }
        if (data.duration) {
            lines.push(`${data.duration}s`);
        }
        if (data.totalFrames) {
            lines.push(`${data.totalFrames} frames`);
        }
        if (data.fps) {
            lines.push(`${data.fps} fps`);
        }
    }
    else {
        lines.push('Export failed');
    }
    if (data.message) {
        lines.push(data.message);
    }
    return lines.join(' | ');
}
/**
 * Format material result
 */
function formatMaterialResult(data) {
    if (!data)
        return 'No material data';
    const lines = [];
    if (data.success) {
        if (data.objectName) {
            lines.push(`Applied to ${data.objectName}`);
        }
        if (data.materialName) {
            lines.push(`Material: ${data.materialName}`);
        }
        else if (data.propertyName) {
            lines.push(`Set ${data.propertyName}`);
            if (data.value) {
                if (data.value.r !== undefined) {
                    lines.push(`Color: (${data.value.r}, ${data.value.g}, ${data.value.b}${data.value.a !== undefined ? `, ${data.value.a}` : ''})`);
                }
            }
        }
    }
    else {
        lines.push('Material application failed');
    }
    if (data.message) {
        lines.push(data.message);
    }
    return lines.join(' ');
}
// ============================================================================
// Mesh Operation Result Formatters
// ============================================================================
function formatMeshConversion(data) {
    if (!data)
        return 'No mesh conversion data';
    const lines = [];
    if (data.success) {
        if (data.meshName) {
            lines.push(`Converted to mesh: ${data.meshLabel || data.meshName} (${data.meshName})`);
        }
        if (data.shapeName) {
            lines.push(`From shape: ${data.shapeLabel || data.shapeName} (${data.shapeName})`);
        }
        if (data.triangleCount !== undefined) {
            lines.push(`Triangles: ${data.triangleCount.toLocaleString()}`);
        }
        if (data.vertexCount !== undefined) {
            lines.push(`Vertices: ${data.vertexCount.toLocaleString()}`);
        }
        if (data.volume !== undefined) {
            lines.push(`Volume: ${formatDimensionValue(data.volume, 'volume')}`);
        }
    }
    else {
        lines.push(`Conversion failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatMeshBoolean(data) {
    if (!data)
        return 'No mesh boolean data';
    const lines = [];
    if (data.success) {
        lines.push(`Boolean operation completed`);
        if (data.resultMesh) {
            lines.push(`Result: ${data.resultLabel || data.resultMesh} (${data.resultMesh})`);
        }
        if (data.triangleCount !== undefined) {
            lines.push(`Triangles: ${data.triangleCount.toLocaleString()}`);
        }
        if (data.operation) {
            lines.push(`Operation: ${data.operation}`);
        }
    }
    else {
        lines.push(`Boolean operation failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatMeshDecimation(data) {
    if (!data)
        return 'No mesh decimation data';
    const lines = [];
    if (data.success) {
        lines.push(`Decimation completed`);
        if (data.resultMesh) {
            lines.push(`Result: ${data.resultLabel || data.resultMesh} (${data.resultMesh})`);
        }
        if (data.originalTriangles !== undefined && data.newTriangles !== undefined) {
            lines.push(`Triangles: ${data.originalTriangles.toLocaleString()} → ${data.newTriangles.toLocaleString()}`);
        }
        if (data.reduction !== undefined) {
            lines.push(`Reduction: ${(data.reduction * 100).toFixed(1)}%`);
        }
    }
    else {
        lines.push(`Decimation failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatMeshRepair(data) {
    if (!data)
        return 'No mesh repair data';
    const lines = [];
    if (data.success) {
        lines.push(`Mesh repair completed`);
        if (data.repairedMesh) {
            lines.push(`Result: ${data.repairedLabel || data.repairedMesh} (${data.repairedMesh})`);
        }
        if (data.fixesApplied !== undefined) {
            lines.push(`Fixes applied: ${data.fixesApplied}`);
        }
        if (data.holesFilled !== undefined) {
            lines.push(`Holes filled: ${data.holesFilled}`);
        }
        if (data.duplicatesRemoved !== undefined) {
            lines.push(`Duplicates removed: ${data.duplicatesRemoved}`);
        }
        if (data.normalsFixed !== undefined) {
            lines.push(`Normals fixed: ${data.normalsFixed}`);
        }
    }
    else {
        lines.push(`Mesh repair failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatMeshValidation(data) {
    if (!data)
        return 'No mesh validation data';
    const lines = [];
    lines.push(`Mesh: ${data.meshLabel || data.meshName} (${data.meshName})`);
    lines.push('');
    if (data.isValid !== undefined) {
        lines.push(`Valid: ${data.isValid ? 'Yes' : 'No'}`);
    }
    if (data.isWatertight !== undefined) {
        lines.push(`Watertight: ${data.isWatertight ? 'Yes' : 'No'}`);
    }
    if (data.holesCount !== undefined) {
        lines.push(`Holes: ${data.holesCount}`);
    }
    if (data.triangleCount !== undefined) {
        lines.push(`Triangles: ${data.triangleCount.toLocaleString()}`);
    }
    if (data.issues && data.issues.length > 0) {
        lines.push('');
        lines.push('Detected Issues:');
        for (const issue of data.issues) {
            lines.push(`  - ${issue.type || 'Unknown'}: ${issue.description || issue.message || 'No description'}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatMeshInfo(data) {
    if (!data)
        return 'No mesh info data';
    const lines = [];
    lines.push(`Mesh: ${data.meshLabel || data.meshName} (${data.meshName})`);
    lines.push('');
    if (data.triangleCount !== undefined) {
        lines.push(`Triangles: ${data.triangleCount.toLocaleString()}`);
    }
    if (data.vertexCount !== undefined) {
        lines.push(`Vertices: ${data.vertexCount.toLocaleString()}`);
    }
    if (data.area !== undefined) {
        lines.push(`Surface Area: ${formatDimensionValue(data.area, 'area')}`);
    }
    if (data.volume !== undefined) {
        lines.push(`Volume: ${formatDimensionValue(data.volume, 'volume')}`);
    }
    if (data.bounds) {
        lines.push('');
        lines.push('Bounding Box:');
        if (data.bounds.xMin !== undefined) {
            lines.push(`  X: ${data.bounds.xMin.toFixed(3)} → ${data.bounds.xMax.toFixed(3)}`);
            lines.push(`  Y: ${data.bounds.yMin.toFixed(3)} → ${data.bounds.yMax.toFixed(3)}`);
            lines.push(`  Z: ${data.bounds.zMin.toFixed(3)} → ${data.bounds.zMax.toFixed(3)}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatMeshScale(data) {
    if (!data)
        return 'No mesh scale data';
    const lines = [];
    if (data.success) {
        lines.push(`Mesh scaled`);
        if (data.scaledMesh) {
            lines.push(`Result: ${data.scaledLabel || data.scaledMesh} (${data.scaledMesh})`);
        }
        if (data.scaleFactor !== undefined) {
            lines.push(`Scale factor: ${data.scaleFactor}`);
        }
        if (data.originalSize !== undefined && data.newSize !== undefined) {
            lines.push(`Size: ${data.originalSize.toFixed(3)} → ${data.newSize.toFixed(3)}`);
        }
    }
    else {
        lines.push(`Mesh scaling failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatMeshOffset(data) {
    if (!data)
        return 'No mesh offset data';
    const lines = [];
    if (data.success) {
        lines.push(`Mesh offset completed`);
        if (data.offsetMesh) {
            lines.push(`Result: ${data.offsetLabel || data.offsetMesh} (${data.offsetMesh})`);
        }
        if (data.offsetDistance !== undefined) {
            lines.push(`Offset distance: ${data.offsetDistance}`);
        }
        if (data.triangleCount !== undefined) {
            lines.push(`Triangles: ${data.triangleCount.toLocaleString()}`);
        }
    }
    else {
        lines.push(`Mesh offset failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatMeshExport(data) {
    if (!data)
        return 'No mesh export data';
    const lines = [];
    if (data.success) {
        lines.push(`Exported: ${data.meshLabel || data.meshName} (${data.meshName})`);
        lines.push(`Format: ${data.format?.toUpperCase() || data.outputPath?.split('.').pop()?.toUpperCase() || 'MESH'}`);
        lines.push(`Path: ${data.outputPath}`);
        if (data.fileSize !== undefined) {
            lines.push(`File size: ${formatFileSize(data.fileSize)}`);
        }
        if (data.triangleCount !== undefined) {
            lines.push(`Triangles: ${data.triangleCount.toLocaleString()}`);
        }
    }
    else {
        lines.push(`Export failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatMeshImport(data) {
    if (!data)
        return 'No mesh import data';
    const lines = [];
    if (data.success) {
        lines.push(`Imported: ${data.meshLabel || data.meshName} (${data.meshName})`);
        lines.push(`Format: ${data.format?.toUpperCase() || 'MESH'}`);
        lines.push(`Source: ${data.inputPath}`);
        if (data.triangleCount !== undefined) {
            lines.push(`Triangles: ${data.triangleCount.toLocaleString()}`);
        }
        if (data.vertexCount !== undefined) {
            lines.push(`Vertices: ${data.vertexCount.toLocaleString()}`);
        }
    }
    else {
        lines.push(`Import failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatFEAAnalysis(data) {
    if (!data)
        return 'No FEA analysis data';
    const lines = [];
    if (data.success) {
        lines.push(`Analysis: ${data.analysisName || data.name}`);
        lines.push(`Type: ${data.analysisType || 'Static'}`);
        if (data.objectName) {
            lines.push(`Object: ${data.objectName}`);
        }
        lines.push(`Status: ${data.status || 'Created'}`);
        if (data.meshName) {
            lines.push(`Mesh: ${data.meshName}`);
        }
        if (data.solverName) {
            lines.push(`Solver: ${data.solverName}`);
        }
        if (data.resultCount !== undefined) {
            lines.push(`Results: ${data.resultCount}`);
        }
    }
    else {
        lines.push(`Analysis failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatFEAMesh(data) {
    if (!data)
        return 'No FEA mesh data';
    const lines = [];
    if (data.success) {
        lines.push(`Mesh: ${data.meshName || data.name}`);
        if (data.elementType) {
            lines.push(`Element Type: ${data.elementType}`);
        }
        if (data.nodeCount !== undefined) {
            lines.push(`Nodes: ${data.nodeCount.toLocaleString()}`);
        }
        if (data.elementCount !== undefined) {
            lines.push(`Elements: ${data.elementCount.toLocaleString()}`);
        }
        if (data.avgElementSize !== undefined) {
            lines.push(`Avg Element Size: ${data.avgElementSize.toFixed(4)}`);
        }
        if (data.minElementSize !== undefined) {
            lines.push(`Min Element Size: ${data.minElementSize.toFixed(4)}`);
        }
        if (data.maxElementSize !== undefined) {
            lines.push(`Max Element Size: ${data.maxElementSize.toFixed(4)}`);
        }
    }
    else {
        lines.push(`Mesh failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatFEAMaterial(data) {
    if (!data)
        return 'No FEA material data';
    const lines = [];
    if (data.success) {
        lines.push(`Material: ${data.materialName || data.name}`);
        if (data.model) {
            lines.push(`Model: ${data.model}`);
        }
        if (data.youngsModulus !== undefined) {
            lines.push(`Young's Modulus: ${data.youngsModulus.toFixed(2e6)} MPa`);
        }
        if (data.poissonsRatio !== undefined) {
            lines.push(`Poisson's Ratio: ${data.poissonsRatio}`);
        }
        if (data.density !== undefined) {
            lines.push(`Density: ${data.density} kg/mm³`);
        }
        if (data.yieldStrength !== undefined) {
            lines.push(`Yield Strength: ${data.yieldStrength} MPa`);
        }
        if (data.assignedTo) {
            lines.push(`Assigned to: ${data.assignedTo}`);
        }
    }
    else {
        lines.push(`Material assignment failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatFEAConstraint(data) {
    if (!data)
        return 'No FEA constraint data';
    const lines = [];
    if (data.success) {
        lines.push(`Constraint: ${data.constraintType}`);
        if (data.name) {
            lines.push(`Name: ${data.name}`);
        }
        if (data.objectName) {
            lines.push(`Object: ${data.objectName}`);
        }
        if (data.geometry !== undefined) {
            lines.push(`Geometry: ${Array.isArray(data.geometry) ? data.geometry.join(', ') : data.geometry}`);
        }
        if (data.value !== undefined) {
            lines.push(`Value: ${data.value}`);
        }
        if (data.direction !== undefined) {
            lines.push(`Direction: ${data.direction}`);
        }
    }
    else {
        lines.push(`Constraint failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatFEASolver(data) {
    if (!data)
        return 'No FEA solver data';
    const lines = [];
    if (data.success) {
        lines.push(`Solver: ${data.solverType || data.solver || 'CalculiX'}`);
        if (data.status) {
            lines.push(`Status: ${data.status}`);
        }
        if (data.convergence !== undefined) {
            lines.push(`Convergence: ${data.convergence ? 'Achieved' : 'Not achieved'}`);
        }
        if (data.iterations !== undefined) {
            lines.push(`Iterations: ${data.iterations}`);
        }
        if (data.runtime !== undefined) {
            lines.push(`Runtime: ${data.runtime.toFixed(2)}s`);
        }
        if (data.error !== undefined && data.error !== 0) {
            lines.push(`Error: ${data.error}`);
        }
    }
    else {
        lines.push(`Solver error: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatFEAResults(data) {
    if (!data)
        return 'No FEA results data';
    const lines = [];
    if (data.success) {
        lines.push(`Results: ${data.resultType || 'Displacement'}`);
        if (data.resultObject) {
            lines.push(`Result Object: ${data.resultObject}`);
        }
        if (data.maxValue !== undefined) {
            lines.push(`Max: ${typeof data.maxValue === 'number' ? data.maxValue.toFixed(4) : data.maxValue}`);
        }
        if (data.minValue !== undefined) {
            lines.push(`Min: ${typeof data.minValue === 'number' ? data.minValue.toFixed(4) : data.minValue}`);
        }
        if (data.maxLocation) {
            lines.push(`Max Location: ${Array.isArray(data.maxLocation) ? data.maxLocation.map((v) => v.toFixed(2)).join(', ') : data.maxLocation}`);
        }
        if (data.minLocation) {
            lines.push(`Min Location: ${Array.isArray(data.minLocation) ? data.minLocation.map((v) => v.toFixed(2)).join(', ') : data.minLocation}`);
        }
        if (data.unit) {
            lines.push(`Unit: ${data.unit}`);
        }
        if (data.component) {
            lines.push(`Component: ${data.component}`);
        }
    }
    else {
        lines.push(`Results error: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatPathJobCreation(data) {
    if (!data)
        return 'No Path job data';
    const lines = [];
    lines.push(`Path Job: ${data.jobLabel || data.jobName} (${data.jobName})`);
    lines.push(`Document: ${data.documentName || '(current)'}`);
    lines.push('');
    if (data.success) {
        lines.push('Status: Created successfully');
        if (data.operations) {
            lines.push(`Operations: ${data.operations}`);
        }
        if (data.toolController) {
            lines.push(`Tool Controller: ${data.toolController}`);
        }
        if (data.stock) {
            lines.push(`Stock: ${data.stock}`);
        }
    }
    else {
        lines.push(`Error: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatPathJobList(data) {
    if (!data)
        return 'No Path job data';
    const lines = [];
    lines.push(`Total Path Jobs: ${data.jobsCount || 0}`);
    lines.push('');
    if (data.jobs && data.jobs.length > 0) {
        lines.push(formatTableRow(['Name', 'Label', 'Operations', 'Status']));
        lines.push('─'.repeat(60));
        for (const job of data.jobs) {
            lines.push(formatTableRow([
                job.name || '-',
                job.label || '-',
                String(job.operationsCount || 0),
                job.status || 'Unknown'
            ]));
        }
    }
    else {
        lines.push('(No Path jobs in document)');
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatPathToolCreation(data) {
    if (!data)
        return 'No Path tool data';
    const lines = [];
    lines.push(`Path Tool: ${data.toolLabel || data.toolName} (${data.toolName})`);
    lines.push(`Document: ${data.documentName || '(current)'}`);
    lines.push('');
    if (data.success) {
        lines.push('Status: Created successfully');
        if (data.toolType) {
            lines.push(`Tool Type: ${data.toolType}`);
        }
        if (data.diameter) {
            lines.push(`Diameter: ${data.diameter}`);
        }
        if (data.cuttingEdgeAngle) {
            lines.push(`Cutting Edge Angle: ${data.cuttingEdgeAngle}`);
        }
        if (data.toolController) {
            lines.push(`Tool Controller: ${data.toolController}`);
        }
    }
    else {
        lines.push(`Error: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatPathToolList(data) {
    if (!data)
        return 'No Path tool data';
    const lines = [];
    lines.push(`Total Path Tools: ${data.toolsCount || 0}`);
    lines.push('');
    if (data.tools && data.tools.length > 0) {
        lines.push(formatTableRow(['Name', 'Label', 'Type', 'Diameter']));
        lines.push('─'.repeat(60));
        for (const tool of data.tools) {
            lines.push(formatTableRow([
                tool.name || '-',
                tool.label || '-',
                tool.toolType || '-',
                tool.diameter ? `${tool.diameter}` : '-'
            ]));
        }
    }
    else {
        lines.push('(No Path tools in document)');
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatPathOperation(data) {
    if (!data)
        return 'No Path operation data';
    const lines = [];
    lines.push(`Path Operation: ${data.operationLabel || data.operationName} (${data.operationName})`);
    lines.push(`Document: ${data.documentName || '(current)'}`);
    lines.push('');
    if (data.success) {
        lines.push(`Operation Type: ${data.operationType || 'Path'}`);
        if (data.jobName) {
            lines.push(`Job: ${data.jobName}`);
        }
        if (data.baseObjects && Array.isArray(data.baseObjects)) {
            lines.push(`Base Objects: ${data.baseObjects.join(', ')}`);
        }
        else if (data.baseObject) {
            lines.push(`Base Object: ${data.baseObject}`);
        }
        if (data.pathLength !== undefined) {
            lines.push(`Path Length: ${data.pathLength.toFixed(2)}`);
        }
        if (data.tool) {
            lines.push(`Tool: ${data.tool}`);
        }
    }
    else {
        lines.push(`Error: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatPathDressup(data) {
    if (!data)
        return 'No Path dressup data';
    const lines = [];
    lines.push(`Path Dressup: ${data.dressupLabel || data.dressupName} (${data.dressupName})`);
    lines.push(`Document: ${data.documentName || '(current)'}`);
    lines.push('');
    if (data.success) {
        lines.push(`Dressup Type: ${data.dressupType || 'Dressup'}`);
        if (data.baseOperation) {
            lines.push(`Base Operation: ${data.baseOperation}`);
        }
        if (data.parameters) {
            for (const [key, value] of Object.entries(data.parameters)) {
                lines.push(`${key}: ${value}`);
            }
        }
    }
    else {
        lines.push(`Error: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatGCodeExport(data) {
    if (!data)
        return 'No G-code export data';
    const lines = [];
    if (data.success) {
        lines.push('G-code Export: Successful');
        if (data.filePath) {
            lines.push(`Output File: ${data.filePath}`);
        }
        if (data.lineCount !== undefined) {
            lines.push(`Lines: ${data.lineCount}`);
        }
        if (data.toolChanges) {
            lines.push(`Tool Changes: ${data.toolChanges}`);
        }
        if (data.rapidMoves !== undefined) {
            lines.push(`Rapid Moves: ${data.rapidMoves}`);
        }
        if (data.feedMoves !== undefined) {
            lines.push(`Feed Moves: ${data.feedMoves}`);
        }
    }
    else {
        lines.push(`G-code Export Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatPathSimulation(data) {
    if (!data)
        return 'No Path simulation data';
    const lines = [];
    if (data.success) {
        lines.push('Path Simulation: Complete');
        if (data.jobName) {
            lines.push(`Job: ${data.jobName}`);
        }
        if (data.duration !== undefined) {
            lines.push(`Duration: ${data.duration.toFixed(2)}s`);
        }
        if (data.toolpathLength !== undefined) {
            lines.push(`Toolpath Length: ${data.toolpathLength.toFixed(2)}`);
        }
        if (data.rapidLength !== undefined) {
            lines.push(`Rapid Length: ${data.rapidLength.toFixed(2)}`);
        }
        if (data.feedLength !== undefined) {
            lines.push(`Feed Length: ${data.feedLength.toFixed(2)}`);
        }
        if (data.toolChanges !== undefined) {
            lines.push(`Tool Changes: ${data.toolChanges}`);
        }
    }
    else {
        lines.push(`Simulation Error: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
// ============================================================================
// Workflow and Measurement Result Formatters
// ============================================================================
function formatUndoResult(data) {
    if (!data)
        return 'No undo data';
    const lines = [];
    if (data.success) {
        lines.push('Undo: Successful');
        if (data.undoneObject) {
            lines.push(`Undone: ${data.undoneObject}`);
        }
    }
    else {
        lines.push(`Undo Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatRedoResult(data) {
    if (!data)
        return 'No redo data';
    const lines = [];
    if (data.success) {
        lines.push('Redo: Successful');
        if (data.redoneObject) {
            lines.push(`Redone: ${data.redoneObject}`);
        }
    }
    else {
        lines.push(`Redo Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatUndoStackSize(data) {
    if (!data)
        return 'No undo stack data';
    const lines = [];
    lines.push(`Undo Stack: ${data.undoSize ?? 0} operations`);
    lines.push(`Redo Stack: ${data.redoSize ?? 0} operations`);
    if (data.canUndo !== undefined) {
        lines.push(`Can Undo: ${data.canUndo ? 'Yes' : 'No'}`);
    }
    if (data.canRedo !== undefined) {
        lines.push(`Can Redo: ${data.canRedo ? 'Yes' : 'No'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatVisibilityChange(data) {
    if (!data)
        return 'No visibility data';
    const lines = [];
    if (data.success) {
        lines.push(`Object: ${data.objectLabel || data.objectName} (${data.objectName})`);
        lines.push(`Visibility: ${data.visible ? 'Shown' : 'Hidden'}`);
    }
    else {
        lines.push(`Visibility Change Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatVisibleObjectsList(data) {
    if (!data)
        return 'No visible objects data';
    const lines = [];
    lines.push(`Visible Objects: ${data.count || 0}`);
    if (data.objects && data.objects.length > 0) {
        lines.push('');
        lines.push(formatTableRow(['Name', 'Label', 'Type']));
        lines.push('─'.repeat(60));
        for (const obj of data.objects) {
            lines.push(formatTableRow([
                obj.name || '-',
                obj.label || '-',
                formatType(obj.type)
            ]));
        }
    }
    else {
        lines.push('(No visible objects)');
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatSelectionChange(data) {
    if (!data)
        return 'No selection data';
    const lines = [];
    if (data.success) {
        lines.push(`Object: ${data.objectLabel || data.objectName} (${data.objectName})`);
        lines.push(`Selected: ${data.selected ? 'Yes' : 'No'}`);
    }
    else {
        lines.push(`Selection Change Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatMeasurement(data) {
    if (!data)
        return 'No measurement data';
    const lines = [];
    if (data.success) {
        if (data.measurementType) {
            lines.push(`Measurement Type: ${data.measurementType}`);
        }
        if (data.value !== undefined) {
            const unit = data.unit || 'mm';
            if (data.measurementType === 'angle') {
                lines.push(`Value: ${typeof data.value === 'number' ? data.value.toFixed(2) : data.value}°`);
            }
            else {
                lines.push(`Value: ${typeof data.value === 'number' ? data.value.toFixed(4) : data.value} ${unit}`);
            }
        }
        if (data.points && data.points.length > 0) {
            lines.push('');
            lines.push('Points:');
            for (let i = 0; i < data.points.length; i++) {
                const pt = data.points[i];
                lines.push(`  ${i + 1}: (${pt.x?.toFixed(2) || 0}, ${pt.y?.toFixed(2) || 0}, ${pt.z?.toFixed(2) || 0})`);
            }
        }
        if (data.object1 && data.object2) {
            lines.push(`Objects: ${data.object1} ↔ ${data.object2}`);
        }
    }
    else {
        lines.push(`Measurement Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatDistanceMeasurement(data) {
    if (!data)
        return 'No distance data';
    const lines = [];
    if (data.success) {
        if (data.distance !== undefined) {
            lines.push(`Distance: ${typeof data.distance === 'number' ? data.distance.toFixed(4) : data.distance} mm`);
        }
        if (data.point1 && data.point2) {
            lines.push('');
            lines.push('Point 1: (' + [
                data.point1.x?.toFixed(2) || 0,
                data.point1.y?.toFixed(2) || 0,
                data.point1.z?.toFixed(2) || 0
            ].join(', ') + ')');
            lines.push('Point 2: (' + [
                data.point2.x?.toFixed(2) || 0,
                data.point2.y?.toFixed(2) || 0,
                data.point2.z?.toFixed(2) || 0
            ].join(', ') + ')');
        }
        if (data.object1 && data.object2) {
            lines.push('');
            lines.push(`Between: ${data.object1} ↔ ${data.object2}`);
        }
    }
    else {
        lines.push(`Distance Measurement Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatAngleMeasurement(data) {
    if (!data)
        return 'No angle data';
    const lines = [];
    if (data.success) {
        if (data.angle !== undefined) {
            lines.push(`Angle: ${typeof data.angle === 'number' ? data.angle.toFixed(2) : data.angle}°`);
        }
        if (data.vertex) {
            lines.push(`Vertex: (${data.vertex.x?.toFixed(2) || 0}, ${data.vertex.y?.toFixed(2) || 0}, ${data.vertex.z?.toFixed(2) || 0})`);
        }
        if (data.point1 && data.point2 && data.point3) {
            lines.push('');
            lines.push('Points:');
            lines.push(`  1: (${data.point1.x?.toFixed(2) || 0}, ${data.point1.y?.toFixed(2) || 0}, ${data.point1.z?.toFixed(2) || 0})`);
            lines.push(`  2: (${data.point2.x?.toFixed(2) || 0}, ${data.point2.y?.toFixed(2) || 0}, ${data.point2.z?.toFixed(2) || 0})`);
            lines.push(`  3: (${data.point3.x?.toFixed(2) || 0}, ${data.point3.y?.toFixed(2) || 0}, ${data.point3.z?.toFixed(2) || 0})`);
        }
    }
    else {
        lines.push(`Angle Measurement Failed: ${data.error || 'Unknown error'}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
// ============================================================================
// BIM/Arch Workbench Formatters
// ============================================================================
function formatSiteCreation(data) {
    if (!data)
        return 'No site data';
    const lines = [];
    lines.push(`Created Site: ${data.objectLabel || data.objectName} (${data.objectName})`);
    lines.push(`Type: ${data.ifcType || 'Site'}`);
    if (data.latitude !== undefined && data.longitude !== undefined) {
        lines.push(`Location: ${data.latitude}, ${data.longitude}`);
    }
    if (data.terrainHeight !== undefined) {
        lines.push(`Terrain Height: ${data.terrainHeight.toFixed(2)} mm`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatBuildingCreation(data) {
    if (!data)
        return 'No building data';
    const lines = [];
    lines.push(`Created Building: ${data.objectLabel || data.objectName} (${data.objectName})`);
    lines.push(`Type: ${data.ifcType || 'Building'}`);
    if (data.childrenCount !== undefined) {
        lines.push(`Children: ${data.childrenCount} object(s)`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatBuildingPartCreation(data) {
    if (!data)
        return 'No building part data';
    const lines = [];
    lines.push(`Created Building Part: ${data.objectLabel || data.objectName} (${data.objectName})`);
    lines.push(`Type: ${data.ifcType || 'BuildingPart'}`);
    if (data.childrenCount !== undefined) {
        lines.push(`Children: ${data.childrenCount} object(s)`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatBuildingLevel(data) {
    if (!data)
        return 'No building level data';
    const lines = [];
    lines.push(`Created Building Level: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.elevation !== undefined) {
        lines.push(`Elevation: ${data.elevation.toFixed(2)} mm`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatBuildingHierarchy(data) {
    if (!data)
        return 'No hierarchy data';
    const lines = [];
    lines.push('Building Hierarchy:');
    function formatNode(node, indent = 0) {
        const prefix = '  '.repeat(indent);
        const nodeType = node.ifcType || node.type || 'Unknown';
        lines.push(`${prefix}${nodeType}: ${node.name || node.objectLabel || node.objectName || 'Unnamed'}`);
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                formatNode(child, indent + 1);
            }
        }
    }
    if (data.hierarchy && Array.isArray(data.hierarchy)) {
        for (const node of data.hierarchy) {
            formatNode(node, 0);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatWallCreation(data) {
    if (!data)
        return 'No wall data';
    const lines = [];
    lines.push(`Created Wall: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.dimensions) {
        const { length, width, height } = data.dimensions;
        lines.push(`Dimensions: ${(length || 0).toFixed(2)} x ${(width || 0).toFixed(2)} x ${(height || 0).toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatWindowCreation(data) {
    if (!data)
        return 'No window data';
    const lines = [];
    lines.push(`Created Window: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.dimensions) {
        const { width, height } = data.dimensions;
        lines.push(`Dimensions: ${(width || 0).toFixed(2)} x ${(height || 0).toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatDoorCreation(data) {
    if (!data)
        return 'No door data';
    const lines = [];
    lines.push(`Created Door: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.dimensions) {
        const { width, height } = data.dimensions;
        lines.push(`Dimensions: ${(width || 0).toFixed(2)} x ${(height || 0).toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatRoofCreation(data) {
    if (!data)
        return 'No roof data';
    const lines = [];
    lines.push(`Created Roof: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.angles) {
        lines.push(`Angles: ${data.angles.join(', ')}°`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatStairsCreation(data) {
    if (!data)
        return 'No stairs data';
    const lines = [];
    lines.push(`Created Stairs: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.dimensions) {
        const { length, width, height } = data.dimensions;
        lines.push(`Dimensions: ${(length || 0).toFixed(2)} x ${(width || 0).toFixed(2)} x ${(height || 0).toFixed(2)} mm`);
    }
    if (data.numberOfSteps !== undefined) {
        lines.push(`Number of Steps: ${data.numberOfSteps}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatCurtainWallCreation(data) {
    if (!data)
        return 'No curtain wall data';
    const lines = [];
    lines.push(`Created Curtain Wall: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatSpaceCreation(data) {
    if (!data)
        return 'No space data';
    const lines = [];
    lines.push(`Created Space: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatColumnCreation(data) {
    if (!data)
        return 'No column data';
    const lines = [];
    lines.push(`Created Column: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.dimensions) {
        const { width, height } = data.dimensions;
        lines.push(`Dimensions: ${(width || 0).toFixed(2)} x ${(height || 0).toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatBeamCreation(data) {
    if (!data)
        return 'No beam data';
    const lines = [];
    lines.push(`Created Beam: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.dimensions) {
        const { width, height, length } = data.dimensions;
        lines.push(`Dimensions: ${(width || 0).toFixed(2)} x ${(height || 0).toFixed(2)} x ${(length || 0).toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatSlabCreation(data) {
    if (!data)
        return 'No slab data';
    const lines = [];
    lines.push(`Created Slab: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.thickness !== undefined) {
        lines.push(`Thickness: ${data.thickness.toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatFrameCreation(data) {
    if (!data)
        return 'No frame data';
    const lines = [];
    lines.push(`Created Frame: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatTrussCreation(data) {
    if (!data)
        return 'No truss data';
    const lines = [];
    lines.push(`Created Truss: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.dimensions) {
        const { length, height } = data.dimensions;
        lines.push(`Dimensions: ${(length || 0).toFixed(2)} x ${(height || 0).toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatFenceCreation(data) {
    if (!data)
        return 'No fence data';
    const lines = [];
    lines.push(`Created Fence: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.dimensions) {
        const { length, height } = data.dimensions;
        lines.push(`Dimensions: ${(length || 0).toFixed(2)} x ${(height || 0).toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatEquipmentCreation(data) {
    if (!data)
        return 'No equipment data';
    const lines = [];
    lines.push(`Created Equipment: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatPipeCreation(data) {
    if (!data)
        return 'No pipe data';
    const lines = [];
    lines.push(`Created Pipe: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.radius !== undefined) {
        lines.push(`Radius: ${data.radius.toFixed(2)} mm`);
    }
    if (data.diameter !== undefined) {
        lines.push(`Diameter: ${data.diameter.toFixed(2)} mm`);
    }
    if (data.length !== undefined) {
        lines.push(`Length: ${data.length.toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatPipeConnectorCreation(data) {
    if (!data)
        return 'No pipe connector data';
    const lines = [];
    lines.push(`Created Pipe Connector: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.connectedObjects && Array.isArray(data.connectedObjects)) {
        lines.push(`Connected Objects: ${data.connectedObjects.length}`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatPanelCreation(data) {
    if (!data)
        return 'No panel data';
    const lines = [];
    lines.push(`Created Panel: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatAxisCreation(data) {
    if (!data)
        return 'No axis data';
    const lines = [];
    lines.push(`Created Axis: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.numberOfAxes !== undefined) {
        lines.push(`Number of Axes: ${data.numberOfAxes}`);
    }
    if (data.spacing !== undefined) {
        lines.push(`Spacing: ${data.spacing.toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatGridCreation(data) {
    if (!data)
        return 'No grid data';
    const lines = [];
    lines.push(`Created Grid: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatSectionPlaneCreation(data) {
    if (!data)
        return 'No section plane data';
    const lines = [];
    lines.push(`Created Section Plane: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.objectsCount !== undefined) {
        lines.push(`Objects in Section: ${data.objectsCount}`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatScheduleCreation(data) {
    if (!data)
        return 'No schedule data';
    const lines = [];
    lines.push(`Created Schedule: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatIfcProperties(data) {
    if (!data)
        return 'No IFC properties data';
    const lines = [];
    if (data.objectName && data.objectLabel) {
        lines.push(`Object: ${data.objectLabel} (${data.objectName})`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.oldIfcType && data.newIfcType) {
        lines.push(`IFC Type changed: ${data.oldIfcType} → ${data.newIfcType}`);
    }
    if (data.properties && typeof data.properties === 'object') {
        lines.push('');
        lines.push('Properties:');
        for (const [key, value] of Object.entries(data.properties)) {
            lines.push(`  ${key}: ${value}`);
        }
    }
    if (data.propertyName && data.propertyValue !== undefined) {
        lines.push('');
        lines.push(`Property: ${data.propertyName} = ${data.propertyValue}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatMaterialAssignment(data) {
    if (!data)
        return 'No material data';
    const lines = [];
    if (data.objectName && data.objectLabel) {
        lines.push(`Object: ${data.objectLabel} (${data.objectName})`);
    }
    if (data.material) {
        lines.push(`Material: ${data.material.name || 'Unknown'}`);
        if (data.material.type) {
            lines.push(`Type: ${data.material.type}`);
        }
        if (data.material.color) {
            lines.push(`Color: ${Array.isArray(data.material.color) ? data.material.color.join(', ') : data.material.color}`);
        }
    }
    else {
        lines.push('Material: None');
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatQuickWall(data) {
    if (!data)
        return 'No quick wall data';
    const lines = [];
    lines.push(`Created Quick Wall: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.dimensions) {
        const { length, width, height } = data.dimensions;
        lines.push(`Dimensions: ${(length || 0).toFixed(2)} x ${(width || 0).toFixed(2)} x ${(height || 0).toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatQuickWindow(data) {
    if (!data)
        return 'No quick window data';
    const lines = [];
    lines.push(`Created Quick Window: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.hostWall) {
        lines.push(`Host Wall: ${data.hostWall}`);
    }
    if (data.dimensions) {
        const { width, height } = data.dimensions;
        lines.push(`Dimensions: ${(width || 0).toFixed(2)} x ${(height || 0).toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatQuickDoor(data) {
    if (!data)
        return 'No quick door data';
    const lines = [];
    lines.push(`Created Quick Door: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.hostWall) {
        lines.push(`Host Wall: ${data.hostWall}`);
    }
    if (data.dimensions) {
        const { width, height } = data.dimensions;
        lines.push(`Dimensions: ${(width || 0).toFixed(2)} x ${(height || 0).toFixed(2)} mm`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatQuickFloor(data) {
    if (!data)
        return 'No quick floor data';
    const lines = [];
    lines.push(`Created Floor: ${data.objectLabel || data.objectName} (${data.objectName})`);
    if (data.parentBuilding) {
        lines.push(`Parent Building: ${data.parentBuilding}`);
    }
    if (data.objectsCount !== undefined) {
        lines.push(`Objects: ${data.objectsCount}`);
    }
    if (data.ifcType) {
        lines.push(`IFC Type: ${data.ifcType}`);
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
// ============================================================================
// Error Handling and Recovery Result Formatters
// ============================================================================
function formatErrorParse(data) {
    if (!data)
        return 'No error data';
    const lines = [];
    if (data.success) {
        lines.push('Error parsed successfully');
        if (data.error_type) {
            lines.push(`Error Type: ${data.error_type}`);
        }
        if (data.message) {
            lines.push(`Message: ${data.message}`);
        }
        if (data.stack_trace) {
            lines.push('');
            lines.push('Stack Trace:');
            lines.push(data.stack_trace);
        }
    }
    else {
        lines.push('Failed to parse error');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatErrorCategory(data) {
    if (!data)
        return 'No error category data';
    const lines = [];
    if (data.success) {
        lines.push(`Category: ${data.category || 'Unknown'}`);
        if (data.subcategory) {
            lines.push(`Subcategory: ${data.subcategory}`);
        }
        lines.push('');
        lines.push('Characteristics:');
        if (data.characteristics && Array.isArray(data.characteristics)) {
            for (const char of data.characteristics) {
                lines.push(`  - ${char}`);
            }
        }
        if (data.is_recoverable !== undefined) {
            lines.push(`Recoverable: ${data.is_recoverable ? 'Yes' : 'No'}`);
        }
    }
    else {
        lines.push('Failed to categorize error');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatTracebackInfo(data) {
    if (!data)
        return 'No traceback data';
    const lines = [];
    if (data.success) {
        lines.push('Traceback Information:');
        lines.push('─'.repeat(60));
        if (data.frames && Array.isArray(data.frames) && data.frames.length > 0) {
            lines.push('');
            lines.push('Call Stack:');
            for (let i = 0; i < data.frames.length; i++) {
                const frame = data.frames[i];
                lines.push(`  ${i + 1}. ${frame.file || 'Unknown'}:${frame.line || '?'}`);
                if (frame.function) {
                    lines.push(`     Function: ${frame.function}`);
                }
            }
        }
        if (data.exception_type) {
            lines.push('');
            lines.push(`Exception: ${data.exception_type}`);
        }
        if (data.exception_message) {
            lines.push(`Message: ${data.exception_message}`);
        }
        if (data.most_relevant_frame) {
            const frame = data.most_relevant_frame;
            lines.push('');
            lines.push('Most Relevant Frame:');
            lines.push(`  File: ${frame.file || 'Unknown'}`);
            lines.push(`  Line: ${frame.line || '?'}`);
            lines.push(`  Function: ${frame.function || 'Unknown'}`);
            if (frame.code) {
                lines.push(`  Code: ${frame.code}`);
            }
        }
    }
    else {
        lines.push('Failed to extract traceback info');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatErrorContext(data) {
    if (!data)
        return 'No error context data';
    const lines = [];
    if (data.success) {
        lines.push('Error Context Analysis:');
        lines.push('─'.repeat(60));
        if (data.operation_type) {
            lines.push(`Operation: ${data.operation_type}`);
        }
        if (data.category) {
            lines.push(`Category: ${data.category}`);
        }
        if (data.error_summary) {
            lines.push('');
            lines.push('Error Summary:');
            lines.push(`  ${data.error_summary}`);
        }
        if (data.likely_causes && Array.isArray(data.likely_causes)) {
            lines.push('');
            lines.push('Likely Causes:');
            for (const cause of data.likely_causes) {
                lines.push(`  - ${cause}`);
            }
        }
        if (data.recovery_suggestions && Array.isArray(data.recovery_suggestions)) {
            lines.push('');
            lines.push('Recovery Suggestions:');
            for (const suggestion of data.recovery_suggestions) {
                lines.push(`  - ${suggestion}`);
            }
        }
    }
    else {
        lines.push('Failed to analyze error context');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatRecoverySuggestions(data) {
    if (!data)
        return 'No recovery suggestions data';
    const lines = [];
    if (data.success) {
        lines.push('Recovery Suggestions:');
        lines.push('─'.repeat(60));
        if (data.operation) {
            lines.push(`Operation: ${data.operation}`);
        }
        if (data.category) {
            lines.push(`Category: ${data.category}`);
        }
        if (data.count !== undefined) {
            lines.push(`Suggestion Count: ${data.count}`);
        }
        if (data.suggestions && Array.isArray(data.suggestions)) {
            lines.push('');
            lines.push('Suggested Actions:');
            for (let i = 0; i < data.suggestions.length; i++) {
                lines.push(`  ${i + 1}. ${data.suggestions[i]}`);
            }
        }
    }
    else {
        lines.push('Failed to get recovery suggestions');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatValidationResult(data) {
    if (!data)
        return 'No validation data';
    const lines = [];
    if (data.success) {
        lines.push(`Validation: ${data.is_valid ? 'PASSED' : 'FAILED'}`);
        lines.push('─'.repeat(60));
        if (data.object_name) {
            lines.push(`Object: ${data.object_name}`);
        }
        if (data.operation) {
            lines.push(`Operation: ${data.operation}`);
        }
        if (data.issues && Array.isArray(data.issues) && data.issues.length > 0) {
            lines.push('');
            lines.push('Issues:');
            for (const issue of data.issues) {
                lines.push(`  - ${issue}`);
            }
        }
        if (data.warnings && Array.isArray(data.warnings) && data.warnings.length > 0) {
            lines.push('');
            lines.push('Warnings:');
            for (const warn of data.warnings) {
                lines.push(`  - ${warn}`);
            }
        }
    }
    else {
        lines.push('Validation check failed');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatCommonErrors(data) {
    if (!data)
        return 'No common errors data';
    const lines = [];
    if (data.success) {
        lines.push(`Common Errors for: ${data.operation_type || 'Unknown operation'}`);
        lines.push('─'.repeat(60));
        if (data.common_errors && Array.isArray(data.common_errors)) {
            lines.push('');
            for (const error of data.common_errors) {
                lines.push(`  - ${error}`);
            }
        }
        if (data.count !== undefined) {
            lines.push('');
            lines.push(`Total: ${data.count} error(s)`);
        }
        if (data.message) {
            lines.push('');
            lines.push(data.message);
        }
    }
    else {
        lines.push('Failed to get common errors');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatOperationHistory(data) {
    if (!data)
        return 'No operation history data';
    const lines = [];
    if (data.success) {
        lines.push(`Recent Operations (${data.operations?.length || 0} of ${data.total_recorded || 0} total):`);
        lines.push('─'.repeat(60));
        if (data.operations && Array.isArray(data.operations) && data.operations.length > 0) {
            lines.push(formatTableRow(['Time', 'Operation', 'Object', 'Status']));
            lines.push('─'.repeat(60));
            for (const op of data.operations) {
                const timestamp = op.timestamp ? new Date(op.timestamp * 1000).toLocaleTimeString() : '-';
                const status = op.status === 'success' ? 'OK' : (op.status === 'failed' ? 'FAIL' : op.status);
                lines.push(formatTableRow([
                    timestamp,
                    op.operation_type || '-',
                    op.object_name || '-',
                    status
                ]));
                if (op.error) {
                    lines.push(`  Error: ${op.error}`);
                }
            }
        }
        else {
            lines.push('(No operations recorded)');
        }
    }
    else {
        lines.push('Failed to get operation history');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatLastError(data) {
    if (!data)
        return 'No last error data';
    const lines = [];
    if (data.success) {
        if (data.error) {
            lines.push('Most Recent Error:');
            lines.push('─'.repeat(60));
            if (data.error_type) {
                lines.push(`Type: ${data.error_type}`);
            }
            if (data.error_message) {
                lines.push(`Message: ${data.error_message}`);
            }
            if (data.timestamp) {
                lines.push(`Time: ${new Date(data.timestamp * 1000).toLocaleString()}`);
            }
            if (data.operation) {
                lines.push(`Operation: ${data.operation}`);
            }
            if (data.context) {
                lines.push(`Context: ${data.context}`);
            }
            if (data.stack_trace) {
                lines.push('');
                lines.push('Stack Trace:');
                lines.push(data.stack_trace);
            }
        }
        else {
            lines.push('No errors recorded');
        }
    }
    else {
        lines.push('Failed to get last error');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatUndoStrategy(data) {
    if (!data)
        return 'No undo strategy data';
    const lines = [];
    if (data.success) {
        lines.push('Undo Strategy:');
        lines.push('─'.repeat(60));
        if (data.object_name) {
            lines.push(`Object: ${data.object_name}`);
        }
        if (data.failed_operation) {
            lines.push(`Failed Operation: ${data.failed_operation}`);
        }
        if (data.suggested_undo_steps && Array.isArray(data.suggested_undo_steps)) {
            lines.push('');
            lines.push('Suggested Steps:');
            for (let i = 0; i < data.suggested_undo_steps.length; i++) {
                lines.push(`  ${i + 1}. ${data.suggested_undo_steps[i]}`);
            }
        }
        if (data.can_undo !== undefined) {
            lines.push('');
            lines.push(`Can Undo: ${data.can_undo ? 'Yes' : 'No'}`);
        }
        if (data.undo_available !== undefined) {
            lines.push(`Undo Available: ${data.undo_available}`);
        }
    }
    else {
        lines.push('Failed to get undo strategy');
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
function formatSafeRetryResult(data) {
    if (!data)
        return 'No retry result data';
    const lines = [];
    if (data.success) {
        lines.push(`Operation: ${data.operation || 'Unknown'}`);
        lines.push(`Attempts: ${data.attempts || 1}`);
        lines.push(`Recovered: ${data.recovered ? 'Yes' : 'No'}`);
        if (data.final_result) {
            lines.push('');
            lines.push('Final Result:');
            lines.push(data.final_result);
        }
    }
    else {
        lines.push(`Operation failed after ${data.attempts || 1} attempt(s)`);
        if (data.error) {
            lines.push(`Error: ${data.error}`);
        }
    }
    if (data.message) {
        lines.push('');
        lines.push(data.message);
    }
    return lines.join('\n');
}
//# sourceMappingURL=result-formatters.js.map