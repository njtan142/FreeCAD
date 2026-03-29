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
export function formatQueryResult(result: QueryResult): string {
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
export function formatDocumentOverview(data: any): string {
  if (!data) return 'No document data';

  const lines: string[] = [];
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
  } else {
    lines.push('(No objects)');
  }

  return lines.join('\n');
}

/**
 * Format object list as a readable table
 */
export function formatObjectList(data: any): string {
  if (!data) return 'No objects';

  const lines: string[] = [];
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
  } else {
    lines.push('(No objects in document)');
  }

  return lines.join('\n');
}

/**
 * Format object properties as key-value pairs
 */
export function formatObjectProperties(data: any): string {
  if (!data) return 'No properties available';

  const lines: string[] = [];
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
export function formatSelection(data: any): string {
  if (!data) return 'No selection data';

  const lines: string[] = [];
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
  } else {
    lines.push('(No objects selected)');
  }

  return lines.join('\n');
}

/**
 * Format dependencies result
 */
export function formatDependencies(data: any): string {
  if (!data) return 'No dependency data';

  const lines: string[] = [];
  lines.push(`Object: ${data.object}`);
  lines.push('');

  // Dependencies (what this object depends on)
  lines.push('Depends On (Parents):');
  if (data.dependencies?.dependsOn && data.dependencies.dependsOn.length > 0) {
    for (const dep of data.dependencies.dependsOn) {
      lines.push(`  - ${dep.label || dep.name} (${formatType(dep.type)})`);
    }
  } else {
    lines.push('  (None)');
  }
  lines.push('');

  // Used by (what depends on this object)
  lines.push('Used By (Children):');
  if (data.dependencies?.usedBy && data.dependencies.usedBy.length > 0) {
    for (const dep of data.dependencies.usedBy) {
      lines.push(`  - ${dep.label || dep.name} (${formatType(dep.type)})`);
    }
  } else {
    lines.push('  (None)');
  }

  return lines.join('\n');
}

/**
 * Format document info result
 */
export function formatDocumentInfo(data: any): string {
  if (!data) return 'No document info';

  const lines: string[] = [];
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
export function formatTableRow(cells: string[]): string {
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
function formatType(typeId: string): string {
  if (!typeId) return '-';
  // Extract just the type name after the namespace
  const parts = typeId.split('.');
  return parts.length > 1 ? parts[1] : typeId;
}

/**
 * Helper: Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate long output with character count
 */
export function truncateOutput(output: string, maxLength: number = 5000): string {
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
export function formatPropertyChange(data: any): string {
  if (!data) return 'No property change data';

  const lines: string[] = [];
  lines.push(`Object: ${data.objectLabel || data.objectName} (${data.objectName})`);
  lines.push('');
  lines.push(`Property: ${data.propertyName}`);
  
  if (data.beforeValue !== undefined && data.afterValue !== undefined) {
    lines.push(`Changed: ${data.beforeValue} → ${data.afterValue}`);
  } else if (data.afterValue !== undefined) {
    lines.push(`Set to: ${data.afterValue}`);
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
export function formatDimensionUpdate(data: any): string {
  if (!data) return 'No dimension update data';

  const lines: string[] = [];
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
export function formatTransformResult(data: any, transformType: 'move' | 'rotate' | 'scale'): string {
  if (!data) return 'No transform data';

  const lines: string[] = [];
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
  } else if (transformType === 'rotate') {
    if (data.beforeRotation && data.afterRotation) {
      // Python handler returns angle as formatted string (e.g., "45.00deg")
      // Check if it's already a string, otherwise convert from radians
      let beforeAngle: string;
      let afterAngle: string;
      if (typeof data.beforeRotation.angle === 'string') {
        beforeAngle = data.beforeRotation.angle;
      } else {
        beforeAngle = `${(data.beforeRotation.angle * 180 / Math.PI).toFixed(1)}°`;
      }
      if (typeof data.afterRotation.angle === 'string') {
        afterAngle = data.afterRotation.angle;
      } else {
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
  } else if (transformType === 'scale') {
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
export function formatExpressionResult(data: any, action: 'set' | 'get' | 'clear'): string {
  if (!data) return 'No expression data';

  const lines: string[] = [];
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
  } else if (action === 'get') {
    if (data.expressionCount === 0) {
      lines.push('No expressions found on this object.');
    } else {
      lines.push(`Found ${data.expressionCount} expression(s):`);
      lines.push('─'.repeat(60));

      if (data.expressions) {
        for (const [propName, exprData] of Object.entries(data.expressions)) {
          const expr = exprData as any;
          lines.push(`${propName}:`);
          lines.push(`  Expression: ${expr.expression || '(none)'}`);
          if (expr.currentValue) {
            lines.push(`  Current Value: ${expr.currentValue}`);
          }
        }
      }
    }
  } else if (action === 'clear') {
    if (data.clearedCount === 0) {
      lines.push('No expressions to clear.');
    } else {
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
export function formatSketchResult(data: any): string {
  if (!data) return 'No sketch data';

  const lines: string[] = [];
  lines.push(`Sketch: ${data.sketchLabel || data.sketchName} (${data.sketchName})`);
  lines.push(`Document: ${data.documentName || '(current)'}`);
  lines.push('');

  if (data.support) {
    lines.push(`Support: ${data.support}`);
  } else {
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
export function formatGeometryResult(data: any): string {
  if (!data) return 'No geometry data';

  const lines: string[] = [];
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
    } else {
      lines.push(`  - Index: ${data.geometryIndex}, Type: ${formatGeometryType(data.geometryType)}`);
    }
  } else {
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
export function formatConstraintResult(data: any): string {
  if (!data) return 'No constraint data';

  const lines: string[] = [];
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
    } else {
      lines.push(`  - Index: ${data.constraintIndex}, Type: ${formatConstraintType(data.constraintType)}`);
      if (data.constraintValue !== undefined) {
        lines.push(`    Value: ${formatConstraintValue(data.constraintType, data.constraintValue)}`);
      }
    }
  } else {
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
export function formatSketchGeometry(data: any): string {
  if (!data) return 'No sketch geometry data';

  const lines: string[] = [];
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
  } else {
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
  } else {
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
function formatGeometryType(typeId: string): string {
  if (!typeId) return '-';
  // Map common geometry types to readable names
  const typeMap: Record<string, string> = {
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
function formatConstraintType(typeId: string): string {
  if (!typeId) return '-';
  // Map common constraint types to readable names
  const typeMap: Record<string, string> = {
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
function formatConstraintValue(type: string, value: number): string {
  if (value === undefined || value === null) return '-';
  
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return String(value);

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
function formatConstraintElements(constraint: any): string {
  const parts: string[] = [];

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
function formatPointPosition(pos: number | undefined): string {
  if (pos === undefined || pos === null || pos === -1) return '';
  const labels: Record<number, string> = {
    1: 'start',
    2: 'end',
    3: 'center'
  };
  return labels[pos] || `point${pos}`;
}

/**
 * Format feature creation result from create_pad, create_pocket, create_revolution, etc.
 */
export function formatFeatureResult(data: any): string {
  if (!data) return 'No feature data';

  const lines: string[] = [];
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
export function formatBodyResult(data: any): string {
  if (!data) return 'No body data';

  const lines: string[] = [];
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
export function formatBodyList(data: any): string {
  if (!data) return 'No body data';

  const lines: string[] = [];
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
  } else {
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
export function formatFeatureUpdate(data: any): string {
  if (!data) return 'No dimension update data';

  const lines: string[] = [];
  lines.push(`Feature: ${data.featureLabel || data.featureName} (${data.featureName})`);
  lines.push('');
  lines.push(`Dimension: ${capitalize(data.dimension || 'dimension')}`);

  if (data.beforeValue !== undefined && data.afterValue !== undefined) {
    const beforeVal = formatDimensionValue(data.beforeValue, data.dimension);
    const afterVal = formatDimensionValue(data.afterValue, data.dimension);
    lines.push(`Changed: ${beforeVal} → ${afterVal}`);
  } else if (data.afterValue !== undefined) {
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
function formatDimensionValue(value: string | number, dimensionType: string): string {
  if (value === undefined || value === null) return '-';

  // If already a string with units, return as-is
  if (typeof value === 'string' && (value.includes('mm') || value.includes('deg') || value.includes('cm') || value.includes('in'))) {
    return value;
  }

  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return String(value);

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

/**
 * Format shape operation result from boolean operations, heal_shape, etc.
 */
export function formatShapeResult(data: any): string {
  if (!data) return 'No shape data';

  const lines: string[] = [];
  
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
export function formatShapeInfo(data: any): string {
  if (!data) return 'No shape info data';

  const lines: string[] = [];
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
export function formatShapeValidation(data: any): string {
  if (!data) return 'No validation data';

  const lines: string[] = [];
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
export function formatAssemblyCreationResult(data: any): string {
  if (!data) return 'No assembly data';

  const lines: string[] = [];
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
export function formatComponentList(data: any): string {
  if (!data) return 'No component data';

  const lines: string[] = [];
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
  } else {
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
export function formatConstraintCreationResult(data: any): string {
  if (!data) return 'No constraint data';

  const lines: string[] = [];

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
      } else {
        lines.push(`Value: ${formatDistanceValue(data.value)}`);
      }
    }

    if (data.solverStatus) {
      lines.push(`Solver Status: ${data.solverStatus}`);
    }
  } else {
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
export function formatConstraintList(data: any): string {
  if (!data) return 'No constraint data';

  const lines: string[] = [];

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
        } else {
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
  } else {
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
export function formatConstraintUpdate(data: any): string {
  if (!data) return 'No update data';

  const lines: string[] = [];
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
function formatAssemblyConstraintType(typeId: string): string {
  if (!typeId) return '-';
  const typeMap: Record<string, string> = {
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
function formatAngleValue(value: number | string): string {
  if (value === undefined || value === null) return '-';

  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return String(value);

  return `${numValue.toFixed(1)}°`;
}

/**
 * Helper: Format distance value with mm
 */
function formatDistanceValue(value: number | string): string {
  if (value === undefined || value === null) return '-';

  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return String(value);

  return `${numValue.toFixed(2)} mm`;
}

// ============================================================================
// Draft Workbench Result Formatters
// ============================================================================

/**
 * Format point creation result
 */
export function formatPointCreation(data: any): string {
  if (!data) return 'No point data';

  const lines: string[] = [];
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
export function formatGeometryCreation(data: any, objectType: string): string {
  if (!data) return 'No geometry data';

  const lines: string[] = [];
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
export function formatDimensionCreation(data: any): string {
  if (!data) return 'No dimension data';

  const lines: string[] = [];
  lines.push(`Created Dimension: ${data.objectLabel || data.objectName} (${data.objectName})`);
  lines.push(`Type: ${data.objectType || 'Dimension'}`);

  if (data.measurement !== undefined) {
    if (data.measurementType === 'angular') {
      lines.push(`Angle: ${data.measurement.toFixed(1)}`);
    } else if (data.objectType !== 'AngularDimension') {
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
export function formatTextCreation(data: any): string {
  if (!data) return 'No text data';

  const lines: string[] = [];
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
export function formatModificationResult(data: any, operation: string): string {
  if (!data) return 'No modification data';

  const lines: string[] = [];
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
  } else if (operation === 'rotate') {
    lines.push(`Rotated ${data.objectNames?.length || 1} object(s): ${(data.objectNames || []).join(', ')}`);
    if (data.angle !== undefined) {
      if (typeof data.angle === 'string') {
        lines.push(`Angle: ${data.angle}`);
      } else {
        lines.push(`Angle: ${data.angle}°`);
      }
    }
    if (data.center) {
      lines.push(`Center: (${data.center.x?.toFixed(2) || 0}, ${data.center.y?.toFixed(2) || 0}, ${data.center.z?.toFixed(2) || 0})`);
    }
  } else if (operation === 'scale') {
    lines.push(`Scaled ${data.objectNames?.length || 1} object(s): ${(data.objectNames || []).join(', ')}`);
    if (data.scaleFactor !== undefined) {
      lines.push(`Scale Factor: ${data.scaleFactor.toFixed(2)}`);
    }
    if (data.center) {
      lines.push(`Center: (${data.center.x?.toFixed(2) || 0}, ${data.center.y?.toFixed(2) || 0}, ${data.center.z?.toFixed(2) || 0})`);
    }
  } else if (operation === 'offset') {
    lines.push(`Created offset: ${data.newObjectName || 'Offset'}`);
    lines.push(`Original: ${data.originalName}`);
    if (data.distance !== undefined) {
      lines.push(`Distance: ${data.distance.toFixed(2)} mm`);
    }
  } else if (operation === 'join') {
    lines.push(`Joined ${data.originalNames?.length || 0} objects into: ${data.newObjectName}`);
    lines.push(`Type: ${data.objectType || 'Wire'}`);
  } else if (operation === 'split') {
    lines.push(`Split ${data.originalName} into ${data.newObjectNames?.length || 0} object(s): ${(data.newObjectNames || []).join(', ')}`);
  } else {
    lines.push(`${opName} operation completed`);
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
export function formatPageCreation(data: any): string {
  if (!data) return 'No page data';

  const lines: string[] = [];
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
export function formatViewCreation(data: any): string {
  if (!data) return 'No view data';

  const lines: string[] = [];

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
  } else {
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
export function formatTechDrawDimension(data: any): string {
  if (!data) return 'No dimension data';

  const lines: string[] = [];
  lines.push(`Dimension: ${data.dimensionLabel || data.dimensionName} (${data.dimensionName})`);

  const dimType = data.dimensionType || data.type || 'Dimension';
  lines.push(`Type: ${dimType}`);

  if (data.measurement !== undefined) {
    if (dimType.toLowerCase().includes('angular')) {
      lines.push(`Angle: ${typeof data.measurement === 'number' ? data.measurement.toFixed(1) + '°' : data.measurement}`);
    } else if (dimType.toLowerCase().includes('diameter')) {
      lines.push(`Diameter: ${typeof data.measurement === 'number' ? data.measurement.toFixed(2) + ' mm' : data.measurement}`);
    } else if (dimType.toLowerCase().includes('radial') || dimType.toLowerCase().includes('radius')) {
      lines.push(`Radius: ${typeof data.measurement === 'number' ? data.measurement.toFixed(2) + ' mm' : data.measurement}`);
    } else {
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
export function formatAnnotationCreation(data: any): string {
  if (!data) return 'No annotation data';

  const lines: string[] = [];

  if (data.textName) {
    lines.push(`Text: ${data.textLabel || data.textName} (${data.textName})`);
  } else if (data.balloonName) {
    lines.push(`Balloon: ${data.balloonLabel || data.balloonName} (${data.balloonName})`);
  } else if (data.leaderName) {
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
export function formatExportResult(data: any): string {
  if (!data) return 'No export data';

  const lines: string[] = [];

  if (data.success) {
    lines.push(`Exported: ${data.pageName}`);
    lines.push(`Format: ${data.format?.toUpperCase() || (data.outputPath?.endsWith('.svg') ? 'SVG' : 'PDF')}`);
    lines.push(`Path: ${data.outputPath}`);
  } else {
    lines.push(`Export failed: ${data.error || 'Unknown error'}`);
  }

  if (data.message) {
    lines.push('');
    lines.push(data.message);
  }

  return lines.join('\n');
}
