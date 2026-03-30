/**
 * Agent Tools - Custom Tools for Claude Agent SDK
 *
 * Defines custom tools that allow Claude to interact with FreeCAD
 * through the WebSocket bridge.
 */
import { z } from 'zod';
import { FreeCADBridge } from './freecad-bridge';
/**
 * Set the current session ID
 */
export declare function setCurrentSessionId(sessionId: string | null): void;
/**
 * Get the current session ID
 */
export declare function getCurrentSessionId(): string | null;
/**
 * Creates custom tools for the Claude Agent SDK
 */
export declare function createAgentTools(freeCADBridge: FreeCADBridge): (import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    code: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    intent: z.ZodEnum<["document_overview", "object_details", "selection", "dependencies"]>;
    objectName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    filePath: z.ZodString;
    format: z.ZodEnum<["STEP", "STL", "OBJ", "DXF", "FCStd"]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    filePath: z.ZodOptional<z.ZodString>;
    format: z.ZodOptional<z.ZodEnum<["FCStd", "FCBak"]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    filePath: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    filePath: z.ZodString;
    format: z.ZodEnum<["STEP", "IGES", "STL", "OBJ", "DXF", "FCStd", "FCBak"]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["Part", "Assembly", "Sketch"]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    propertyName: z.ZodString;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    dimensions: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>>;
    offset: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>>;
    relative: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    angle: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    axis: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>>;
    center: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    scale: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    scale_x: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    scale_y: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    scale_z: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    uniform: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    propertyName: z.ZodString;
    expression: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    propertyName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    support: z.ZodOptional<z.ZodString>;
    mapMode: z.ZodOptional<z.ZodEnum<["Deactivated", "FlatFace", "Plane", "ThreePoints", "ThreePlanes", "Curved", "Axis", "Concentric", "RefPlane"]>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sketchName: z.ZodString;
    geometryType: z.ZodEnum<["line", "circle", "arc", "rectangle", "point"]>;
    params: z.ZodRecord<z.ZodString, z.ZodAny>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sketchName: z.ZodString;
    constraintType: z.ZodEnum<["coincident", "horizontal", "vertical", "parallel", "perpendicular", "tangent", "equal", "symmetric", "concentric", "midpoint"]>;
    geoIndex1: z.ZodNumber;
    pointPos1: z.ZodOptional<z.ZodNumber>;
    geoIndex2: z.ZodOptional<z.ZodNumber>;
    pointPos2: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sketchName: z.ZodString;
    constraintType: z.ZodEnum<["distance_x", "distance_y", "distance", "angle", "radius", "diameter"]>;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    geoIndex1: z.ZodNumber;
    pointPos1: z.ZodOptional<z.ZodNumber>;
    geoIndex2: z.ZodOptional<z.ZodNumber>;
    pointPos2: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sketchName: z.ZodString;
    constraintIndex: z.ZodNumber;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sketchName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sketchName: z.ZodString;
    constraintIndex: z.ZodNumber;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    bodyName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sketchName: z.ZodString;
    length: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sketchName: z.ZodString;
    depth: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sketchName: z.ZodString;
    angle: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    axis: z.ZodOptional<z.ZodEnum<["Horizontal", "Vertical", "Custom"]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    featureName: z.ZodString;
    edges: z.ZodArray<z.ZodNumber, "many">;
    radius: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    featureName: z.ZodString;
    edges: z.ZodArray<z.ZodNumber, "many">;
    size: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    featureName: z.ZodString;
    dimension: z.ZodEnum<["length", "depth", "angle", "radius"]>;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    featureName: z.ZodString;
    sketchName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    featureName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    baseShape: z.ZodString;
    toolShapes: z.ZodArray<z.ZodString, "many">;
    resultName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    shapes: z.ZodArray<z.ZodString, "many">;
    resultName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    shapeName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    shapeName: z.ZodString;
    tolerance: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    assemblyName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    assemblyName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object1: z.ZodString;
    subobject1: z.ZodString;
    object2: z.ZodString;
    subobject2: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object1: z.ZodString;
    subobject1: z.ZodString;
    object2: z.ZodString;
    subobject2: z.ZodString;
    angle: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object1: z.ZodString;
    subobject1: z.ZodString;
    object2: z.ZodString;
    subobject2: z.ZodString;
    distance: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object1: z.ZodString;
    subobject1: z.ZodString;
    object2: z.ZodString;
    subobject2: z.ZodString;
    symmetryPlane: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    constraintName: z.ZodString;
    newValue: z.ZodNumber;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    constraintName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    assemblyName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    z: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    startX: z.ZodNumber;
    startY: z.ZodNumber;
    startZ: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    endX: z.ZodNumber;
    endY: z.ZodNumber;
    endZ: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    centerX: z.ZodNumber;
    centerY: z.ZodNumber;
    centerZ: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    radius: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    centerX: z.ZodNumber;
    centerY: z.ZodNumber;
    centerZ: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    radius: z.ZodNumber;
    startAngle: z.ZodNumber;
    endAngle: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    centerX: z.ZodNumber;
    centerY: z.ZodNumber;
    centerZ: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    majorRadius: z.ZodNumber;
    minorRadius: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    width: z.ZodNumber;
    height: z.ZodNumber;
    x: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    y: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    z: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sides: z.ZodNumber;
    radius: z.ZodNumber;
    x: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    y: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    z: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    points: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>, "many">;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    points: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>, "many">;
    closed: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    startX: z.ZodNumber;
    startY: z.ZodNumber;
    startZ: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    endX: z.ZodNumber;
    endY: z.ZodNumber;
    endZ: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName1: z.ZodString;
    objectName2: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    direction: z.ZodEnum<["x", "y"]>;
    originX: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    originY: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    originZ: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    text: z.ZodString;
    x: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    y: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    z: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    customText: z.ZodString;
    position: z.ZodDefault<z.ZodOptional<z.ZodEnum<["before", "after", "replacement"]>>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectNames: z.ZodArray<z.ZodString, "many">;
    deltaX: z.ZodNumber;
    deltaY: z.ZodNumber;
    deltaZ: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectNames: z.ZodArray<z.ZodString, "many">;
    angle: z.ZodNumber;
    centerX: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    centerY: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    centerZ: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectNames: z.ZodArray<z.ZodString, "many">;
    scaleFactor: z.ZodNumber;
    centerX: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    centerY: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    centerZ: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    distance: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectNames: z.ZodArray<z.ZodString, "many">;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    points: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>, "many">;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    name: z.ZodOptional<z.ZodString>;
    includeToolHistory: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sessionId: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sourceObject: z.ZodString;
    direction: z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodEnum<["X", "Y", "Z"]>]>;
    count: z.ZodNumber;
    spacing: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sourceObject: z.ZodString;
    centerPoint: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>>;
    axis: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>>;
    count: z.ZodNumber;
    angle: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sourceObject: z.ZodString;
    directionX: z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodEnum<["X", "Y", "Z"]>]>;
    countX: z.ZodNumber;
    spacingX: z.ZodNumber;
    directionY: z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodEnum<["X", "Y", "Z"]>]>;
    countY: z.ZodNumber;
    spacingY: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sourceObject: z.ZodString;
    pathObject: z.ZodString;
    count: z.ZodNumber;
    spacing: z.ZodOptional<z.ZodNumber>;
    alignToPath: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    patternName: z.ZodString;
    count: z.ZodOptional<z.ZodNumber>;
    spacing: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    patternName: z.ZodString;
    count: z.ZodOptional<z.ZodNumber>;
    angle: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    patternName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    template: z.ZodOptional<z.ZodString>;
    paperSize: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    pageName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sourceObject: z.ZodString;
    pageName: z.ZodOptional<z.ZodString>;
    viewName: z.ZodOptional<z.ZodString>;
    projectionType: z.ZodOptional<z.ZodEnum<["Third", "First"]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sourceObject: z.ZodString;
    pageName: z.ZodOptional<z.ZodString>;
    viewName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sourceObject: z.ZodString;
    side: z.ZodEnum<["Left", "Right"]>;
    pageName: z.ZodOptional<z.ZodString>;
    viewName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sourceObject: z.ZodString;
    cutLine: z.ZodObject<{
        point1: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>;
        point2: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        point1: {
            x: number;
            y: number;
        };
        point2: {
            x: number;
            y: number;
        };
    }, {
        point1: {
            x: number;
            y: number;
        };
        point2: {
            x: number;
            y: number;
        };
    }>;
    pageName: z.ZodOptional<z.ZodString>;
    viewName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sourceObject: z.ZodString;
    views: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    pageName: z.ZodOptional<z.ZodString>;
    groupName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sourceView: z.ZodString;
    center: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>;
    scale: z.ZodOptional<z.ZodNumber>;
    pageName: z.ZodOptional<z.ZodString>;
    viewName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    pageName: z.ZodString;
    viewName: z.ZodString;
    startPoint: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>;
    endPoint: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>;
    direction: z.ZodOptional<z.ZodEnum<["Horizontal", "Vertical", "Aligned"]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    pageName: z.ZodString;
    viewName: z.ZodString;
    circleName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    pageName: z.ZodString;
    viewName: z.ZodString;
    line1Name: z.ZodString;
    line2Name: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    pageName: z.ZodString;
    text: z.ZodString;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    pageName: z.ZodString;
    viewName: z.ZodOptional<z.ZodString>;
    targetPoint: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>;
    text: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    pageName: z.ZodString;
    viewName: z.ZodOptional<z.ZodString>;
    points: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>, "many">;
    text: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    pageName: z.ZodString;
    outputPath: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    profiles: z.ZodArray<z.ZodString, "many">;
    solid: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    closed: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    profiles: z.ZodArray<z.ZodString, "many">;
    path: z.ZodString;
    solid: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    profile: z.ZodString;
    path: z.ZodString;
    solid: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    frenet: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    profile: z.ZodString;
    path: z.ZodString;
    solid: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    curve1: z.ZodString;
    curve2: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    edges: z.ZodArray<z.ZodString, "many">;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    surfaceName: z.ZodString;
    distance: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    direction: z.ZodDefault<z.ZodOptional<z.ZodEnum<["edge", "normal"]>>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    surfaceName: z.ZodString;
    tool: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    surfaceName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    surface1: z.ZodString;
    surface2: z.ZodString;
    continuity: z.ZodDefault<z.ZodOptional<z.ZodEnum<["G0", "G1", "G2"]>>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    surfaceName: z.ZodString;
    distance: z.ZodNumber;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    surfaceName: z.ZodString;
    tolerance: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    loftName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    sweepName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    assemblyName: z.ZodString;
    maxIterations: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    jointName: z.ZodString;
    value: z.ZodNumber;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    jointName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    jointName: z.ZodString;
    startValue: z.ZodNumber;
    endValue: z.ZodNumber;
    duration: z.ZodNumber;
    motionType: z.ZodOptional<z.ZodEnum<["linear", "ease_in_out", "sine"]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    assemblyName: z.ZodString;
    duration: z.ZodNumber;
    frameRate: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    assemblyName: z.ZodString;
    duringMotion: z.ZodOptional<z.ZodBoolean>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    viewName: z.ZodEnum<["top", "bottom", "front", "back", "left", "right", "iso", "home"]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    position: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
    target: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    outputPath: z.ZodString;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    renderer: z.ZodOptional<z.ZodEnum<["opengl", "raytracing", "embree"]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    rendererName: z.ZodEnum<["opengl", "raytracing", "embree"]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    quality: z.ZodEnum<["draft", "medium", "high", "ultra"]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    materialName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    color: z.ZodObject<{
        r: z.ZodNumber;
        g: z.ZodNumber;
        b: z.ZodNumber;
        a: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        r: number;
        g: number;
        b: number;
        a?: number | undefined;
    }, {
        r: number;
        g: number;
        b: number;
        a?: number | undefined;
    }>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    lightingType: z.ZodEnum<["default", "studio", "outdoor", "museum"]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    outputDir: z.ZodString;
    fps: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    outputPath: z.ZodString;
    format: z.ZodEnum<["mp4", "gif", "webm"]>;
    quality: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    assemblyName: z.ZodString;
    outputPath: z.ZodString;
    format: z.ZodEnum<["mp4", "gif"]>;
    duration: z.ZodNumber;
    fps: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    shapeName: z.ZodString;
    meshName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
    shapeName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshNames: z.ZodArray<z.ZodString, "many">;
    resultName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    baseMesh: z.ZodString;
    toolMeshes: z.ZodArray<z.ZodString, "many">;
    resultName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
    targetRatio: z.ZodNumber;
    resultName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
    tolerance: z.ZodOptional<z.ZodNumber>;
    resultName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        fixHoles: z.ZodOptional<z.ZodBoolean>;
        fixNormals: z.ZodOptional<z.ZodBoolean>;
        removeDuplicates: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        fixHoles?: boolean | undefined;
        fixNormals?: boolean | undefined;
        removeDuplicates?: boolean | undefined;
    }, {
        fixHoles?: boolean | undefined;
        fixNormals?: boolean | undefined;
        removeDuplicates?: boolean | undefined;
    }>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
    maxHoleSize: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
    scaleFactor: z.ZodNumber;
    resultName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
    offsetDistance: z.ZodNumber;
    resultName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
    outputPath: z.ZodString;
    binary: z.ZodOptional<z.ZodBoolean>;
    precision: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
    outputPath: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
    outputPath: z.ZodString;
    includeMaterials: z.ZodOptional<z.ZodBoolean>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    inputPath: z.ZodString;
    meshName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    analysisName: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    analysisName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    meshType: z.ZodOptional<z.ZodEnum<["netgen", "gmsh"]>>;
    maxSize: z.ZodOptional<z.ZodNumber>;
    secondOrder: z.ZodOptional<z.ZodBoolean>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    meshName: z.ZodString;
    refineLevel: z.ZodNumber;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    materialName: z.ZodEnum<["Steel", "Aluminum", "Copper", "Brass", "Titanium", "Plastic"]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    analysisName: z.ZodString;
    faceReferences: z.ZodArray<z.ZodString, "many">;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    analysisName: z.ZodString;
    faceReference: z.ZodString;
    forceValue: z.ZodNumber;
    forceDirection: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    analysisName: z.ZodString;
    faceReference: z.ZodString;
    pressureValue: z.ZodNumber;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    analysisName: z.ZodString;
    faceReference: z.ZodString;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
    z: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    analysisName: z.ZodString;
    gravity: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    analysisName: z.ZodString;
    constraintName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    analysisName: z.ZodString;
    solverType: z.ZodOptional<z.ZodEnum<["calculix", "elmer", "z88"]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    analysisName: z.ZodString;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    modelObject: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    jobName: z.ZodString;
    toolController: z.ZodOptional<z.ZodString>;
    stock: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    jobName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    name: z.ZodString;
    toolType: z.ZodEnum<["endmill", "ball_endmill", "chamfer", "v-bit", "drill", "tap"]>;
    diameter: z.ZodNumber;
    cuttingEdgeAngle: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    geometry: z.ZodObject<{
        type: z.ZodEnum<["cylinder", "cone"]>;
        diameter: z.ZodOptional<z.ZodNumber>;
        tipDiameter: z.ZodOptional<z.ZodNumber>;
        length: z.ZodNumber;
        cuttingEdgeLength: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        length: number;
        type: "cylinder" | "cone";
        cuttingEdgeLength: number;
        diameter?: number | undefined;
        tipDiameter?: number | undefined;
    }, {
        length: number;
        type: "cylinder" | "cone";
        cuttingEdgeLength: number;
        diameter?: number | undefined;
        tipDiameter?: number | undefined;
    }>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    jobName: z.ZodString;
    tool: z.ZodString;
    speed: z.ZodOptional<z.ZodNumber>;
    feedRate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    baseObject: z.ZodString;
    jobName: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    offsetSide: z.ZodOptional<z.ZodEnum<["outside", "inside", "on"]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    baseObject: z.ZodString;
    jobName: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    centers: z.ZodArray<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, "many">;
    jobName: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    cycle: z.ZodOptional<z.ZodEnum<["drilling", "peck", "deep", "break", "tap"]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    baseObject: z.ZodString;
    jobName: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    cutClamp: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    jobName: z.ZodString;
    radiusCompensation: z.ZodOptional<z.ZodBoolean>;
    radius: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    jobName: z.ZodString;
    tagWidth: z.ZodOptional<z.ZodNumber>;
    tagHeight: z.ZodOptional<z.ZodNumber>;
    tagSpacing: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    jobName: z.ZodString;
    leadIn: z.ZodOptional<z.ZodObject<{
        length: z.ZodNumber;
        radius: z.ZodNumber;
        angle: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        length: number;
        radius: number;
        angle: number;
    }, {
        length: number;
        radius: number;
        angle: number;
    }>>;
    leadOut: z.ZodOptional<z.ZodObject<{
        length: z.ZodNumber;
        radius: z.ZodNumber;
        angle: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        length: number;
        radius: number;
        angle: number;
    }, {
        length: number;
        radius: number;
        angle: number;
    }>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    jobName: z.ZodString;
    filePath: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectName: z.ZodString;
    visible: z.ZodBoolean;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    point1: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
    point2: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object1Name: z.ZodString;
    object2Name: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    point1: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
    point2: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
    point3: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    name: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    oldName: z.ZodString;
    newName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    address: z.ZodString;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    address: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    address: z.ZodString;
    expression: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    startAddress: z.ZodString;
    endAddress: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    address: z.ZodString;
    aliasName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    aliasName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    options: z.ZodOptional<z.ZodObject<{
        includeHidden: z.ZodOptional<z.ZodBoolean>;
        groupByType: z.ZodOptional<z.ZodBoolean>;
        includeProperties: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        outputFormat: z.ZodOptional<z.ZodEnum<["list", "dict"]>>;
    }, "strip", z.ZodTypeAny, {
        includeHidden?: boolean | undefined;
        groupByType?: boolean | undefined;
        includeProperties?: string[] | undefined;
        outputFormat?: "list" | "dict" | undefined;
    }, {
        includeHidden?: boolean | undefined;
        groupByType?: boolean | undefined;
        includeProperties?: string[] | undefined;
        outputFormat?: "list" | "dict" | undefined;
    }>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objectNames: z.ZodArray<z.ZodString, "many">;
    properties: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    bomData: z.ZodUnion<[z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">, z.ZodRecord<z.ZodString, z.ZodUnknown>]>;
    spreadsheetName: z.ZodString;
    startAddress: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    headers: z.ZodArray<z.ZodString, "many">;
    data: z.ZodArray<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, "many">, "many">;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    rowKey: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    updates: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    columnKey: z.ZodString;
    lookupValue: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    column: z.ZodString;
    width: z.ZodNumber;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    row: z.ZodNumber;
    height: z.ZodNumber;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    spreadsheetName: z.ZodString;
    address: z.ZodString;
    color: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object_names: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    name: z.ZodOptional<z.ZodString>;
    elevation: z.ZodOptional<z.ZodNumber>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    placement: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodArray<z.ZodNumber, "many">, z.ZodString]>>;
    length: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    placement: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodArray<z.ZodNumber, "many">, z.ZodString]>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    base_object: z.ZodOptional<z.ZodString>;
    angle: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    length: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    num_steps: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    base_object: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    placement: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodArray<z.ZodNumber, "many">, z.ZodString]>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    start: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodArray<z.ZodNumber, "many">]>>;
    end: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodArray<z.ZodNumber, "many">]>>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    base_object: z.ZodOptional<z.ZodString>;
    thickness: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    base_object: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    placement: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodArray<z.ZodNumber, "many">, z.ZodString]>>;
    length: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    base_object: z.ZodOptional<z.ZodString>;
    placement: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodArray<z.ZodNumber, "many">, z.ZodString]>>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    start: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodArray<z.ZodNumber, "many">]>>;
    end: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodArray<z.ZodNumber, "many">]>>;
    radius: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    objects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    num: z.ZodOptional<z.ZodNumber>;
    spacing: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object_name: z.ZodString;
    ifc_type: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object_name: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object_name: z.ZodString;
    prop_name: z.ZodString;
    value: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object_name: z.ZodString;
    material_name: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    start: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodArray<z.ZodNumber, "many">]>>;
    end: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>, z.ZodArray<z.ZodNumber, "many">]>>;
    height: z.ZodOptional<z.ZodNumber>;
    thickness: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    wall_name: z.ZodString;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    position: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        z: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        z: number;
    }, {
        x: number;
        y: number;
        z: number;
    }>]>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    building_name: z.ZodString;
    level: z.ZodOptional<z.ZodString>;
    objects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    error_text: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    traceback_text: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    error_text: z.ZodString;
    operation_type: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    error_text: z.ZodString;
    operation: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object_name: z.ZodString;
    operation: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    operation_type: z.ZodString;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    count: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    object_name: z.ZodOptional<z.ZodString>;
    failed_operation: z.ZodOptional<z.ZodString>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    validation_result: z.ZodRecord<z.ZodString, z.ZodAny>;
}> | import("@anthropic-ai/claude-agent-sdk").SdkMcpToolDefinition<{
    operation: z.ZodString;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    max_retries: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}>)[];
//# sourceMappingURL=agent-tools.d.ts.map