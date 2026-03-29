/**
 * Result Formatters - Format query results for readability
 *
 * Provides utility functions to format query results from FreeCAD
 * into human-readable output for Claude.
 */
interface QueryResult {
    success: boolean;
    data?: any;
    error?: string;
}
/**
 * Format a query result, handling errors and data formatting
 */
export declare function formatQueryResult(result: QueryResult): string;
/**
 * Format document overview as a readable table
 */
export declare function formatDocumentOverview(data: any): string;
/**
 * Format object list as a readable table
 */
export declare function formatObjectList(data: any): string;
/**
 * Format object properties as key-value pairs
 */
export declare function formatObjectProperties(data: any): string;
/**
 * Format selection result
 */
export declare function formatSelection(data: any): string;
/**
 * Format dependencies result
 */
export declare function formatDependencies(data: any): string;
/**
 * Format document info result
 */
export declare function formatDocumentInfo(data: any): string;
/**
 * Helper: Format a table row
 */
export declare function formatTableRow(cells: string[]): string;
/**
 * Truncate long output with character count
 */
export declare function truncateOutput(output: string, maxLength?: number): string;
/**
 * Format property change result from set_object_property
 */
export declare function formatPropertyChange(data: any): string;
/**
 * Format dimension update result from update_dimensions
 */
export declare function formatDimensionUpdate(data: any): string;
/**
 * Format transform result from move_object, rotate_object, or scale_object
 */
export declare function formatTransformResult(data: any, transformType: 'move' | 'rotate' | 'scale'): string;
/**
 * Format expression result from set_expression, get_expression, or clear_expression
 */
export declare function formatExpressionResult(data: any, action: 'set' | 'get' | 'clear'): string;
/**
 * Format sketch creation result from create_new_sketch
 */
export declare function formatSketchResult(data: any): string;
/**
 * Format added geometry result from add_sketch_geometry
 */
export declare function formatGeometryResult(data: any): string;
/**
 * Format constraint addition result from add_sketch_constraint
 */
export declare function formatConstraintResult(data: any): string;
/**
 * Format sketch geometry listing from list_sketch_geometry
 */
export declare function formatSketchGeometry(data: any): string;
/**
 * Format feature creation result from create_pad, create_pocket, create_revolution, etc.
 */
export declare function formatFeatureResult(data: any): string;
/**
 * Format body operation result from create_body or set_active_body
 */
export declare function formatBodyResult(data: any): string;
/**
 * Format body list as a readable table
 */
export declare function formatBodyList(data: any): string;
/**
 * Format feature dimension update result from update_feature
 */
export declare function formatFeatureUpdate(data: any): string;
/**
 * Format shape operation result from boolean operations, heal_shape, etc.
 */
export declare function formatShapeResult(data: any): string;
/**
 * Format shape info result from get_shape_info
 */
export declare function formatShapeInfo(data: any): string;
/**
 * Format shape validation result from validate_shape
 */
export declare function formatShapeValidation(data: any): string;
/**
 * Format assembly creation result
 */
export declare function formatAssemblyCreationResult(data: any): string;
/**
 * Format component list from list_assembly_components
 */
export declare function formatComponentList(data: any): string;
/**
 * Format assembly constraint creation result
 */
export declare function formatConstraintCreationResult(data: any): string;
/**
 * Format assembly constraint list
 */
export declare function formatConstraintList(data: any): string;
/**
 * Format constraint update result
 */
export declare function formatConstraintUpdate(data: any): string;
/**
 * Format point creation result
 */
export declare function formatPointCreation(data: any): string;
/**
 * Format geometry creation result for various Draft objects
 */
export declare function formatGeometryCreation(data: any, objectType: string): string;
/**
 * Format dimension creation result
 */
export declare function formatDimensionCreation(data: any): string;
/**
 * Format text creation result
 */
export declare function formatTextCreation(data: any): string;
/**
 * Format modification result (move, rotate, scale, offset, join, split)
 */
export declare function formatModificationResult(data: any, operation: string): string;
/**
 * Format pattern creation result from create_linear_pattern, create_polar_pattern, etc.
 */
export declare function formatPatternCreation(data: any): string;
/**
 * Format pattern update result from update_linear_pattern, update_polar_pattern
 */
export declare function formatPatternUpdate(data: any): string;
/**
 * Format pattern info result from get_pattern_info
 */
export declare function formatPatternInfo(data: any): string;
/**
 * Format TechDraw page creation result
 */
export declare function formatPageCreation(data: any): string;
/**
 * Format TechDraw view creation result
 */
export declare function formatViewCreation(data: any): string;
/**
 * Format TechDraw dimension creation result
 */
export declare function formatTechDrawDimension(data: any): string;
/**
 * Format TechDraw annotation creation result
 */
export declare function formatAnnotationCreation(data: any): string;
/**
 * Format TechDraw export result
 */
export declare function formatExportResult(data: any): string;
/**
 * Format loft creation result
 */
export declare function formatLoftCreation(data: any): string;
/**
 * Format sweep creation result
 */
export declare function formatSweepCreation(data: any): string;
/**
 * Format surface operation result (ruled, extend, trim, etc.)
 */
export declare function formatSurfaceOperation(data: any): string;
/**
 * Format surface info result
 */
export declare function formatSurfaceInfo(data: any): string;
/**
 * Format blend surface creation result
 */
export declare function formatBlendSurface(data: any): string;
/**
 * Format offset surface creation result
 */
export declare function formatOffsetSurface(data: any): string;
/**
 * Format surface analysis result
 */
export declare function formatSurfaceAnalysis(data: any): string;
/**
 * Format surface rebuild result
 */
export declare function formatSurfaceRebuild(data: any): string;
/**
 * Format loft info result
 */
export declare function formatLoftInfo(data: any): string;
/**
 * Format sweep info result
 */
export declare function formatSweepInfo(data: any): string;
/**
 * Format solver initialization result
 */
export declare function formatSolverInit(data: any): string;
/**
 * Format solve assembly result
 */
export declare function formatSolveResult(data: any): string;
/**
 * Format DOF analysis result
 */
export declare function formatDOFResult(data: any): string;
/**
 * Format joint value result
 */
export declare function formatJointValue(data: any): string;
/**
 * Format joint limits result
 */
export declare function formatJointLimits(data: any): string;
/**
 * Format drive joint result
 */
export declare function formatDriveResult(data: any): string;
/**
 * Format animation result
 */
export declare function formatAnimationResult(data: any): string;
/**
 * Format animation state result
 */
export declare function formatAnimationState(data: any): string;
/**
 * Format kinematic positions result
 */
export declare function formatKinematicPositions(data: any): string;
/**
 * Format collision check result
 */
export declare function formatCollisionResult(data: any): string;
/**
 * Format render result
 */
export declare function formatRenderResult(data: any): string;
/**
 * Format view angle result
 */
export declare function formatViewAngle(data: any): string;
/**
 * Format animation capture result
 */
export declare function formatAnimationCapture(data: any): string;
/**
 * Format video export result
 */
export declare function formatVideoExport(data: any): string;
/**
 * Format material result
 */
export declare function formatMaterialResult(data: any): string;
export declare function formatMeshConversion(data: any): string;
export declare function formatMeshBoolean(data: any): string;
export declare function formatMeshDecimation(data: any): string;
export declare function formatMeshRepair(data: any): string;
export declare function formatMeshValidation(data: any): string;
export declare function formatMeshInfo(data: any): string;
export declare function formatMeshScale(data: any): string;
export declare function formatMeshOffset(data: any): string;
export declare function formatMeshExport(data: any): string;
export declare function formatMeshImport(data: any): string;
export declare function formatFEAAnalysis(data: any): string;
export declare function formatFEAMesh(data: any): string;
export declare function formatFEAMaterial(data: any): string;
export declare function formatFEAConstraint(data: any): string;
export declare function formatFEASolver(data: any): string;
export declare function formatFEAResults(data: any): string;
export declare function formatPathJobCreation(data: any): string;
export declare function formatPathJobList(data: any): string;
export declare function formatPathToolCreation(data: any): string;
export declare function formatPathToolList(data: any): string;
export declare function formatPathOperation(data: any): string;
export declare function formatPathDressup(data: any): string;
export declare function formatGCodeExport(data: any): string;
export declare function formatPathSimulation(data: any): string;
export {};
//# sourceMappingURL=result-formatters.d.ts.map