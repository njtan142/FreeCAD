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
function formatTableRow(cells: string[]): string {
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
