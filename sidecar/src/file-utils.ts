/**
 * File Utilities - Path validation and manipulation utilities
 *
 * Provides utility functions for file path validation, resolution,
 * and format handling for file operation tools.
 */

import * as path from 'path';

/**
 * Supported CAD formats with descriptions and extensions
 */
export interface FormatInfo {
  format: string;
  description: string;
  extensions: string[];
  canImport: boolean;
  canExport: boolean;
}

/**
 * List of supported CAD formats
 */
export function getSupportedFormats(): FormatInfo[] {
  return [
    {
      format: 'FCStd',
      description: 'Native FreeCAD document format (compressed)',
      extensions: ['.FCStd'],
      canImport: true,
      canExport: true,
    },
    {
      format: 'FCBak',
      description: 'FreeCAD backup format (uncompressed)',
      extensions: ['.FCBak'],
      canImport: true,
      canExport: true,
    },
    {
      format: 'STEP',
      description: 'Industry standard for CAD data exchange (ISO 10303)',
      extensions: ['.step', '.stp'],
      canImport: true,
      canExport: true,
    },
    {
      format: 'IGES',
      description: 'Initial Graphics Exchange Specification',
      extensions: ['.iges', '.igs'],
      canImport: true,
      canExport: true,
    },
    {
      format: 'STL',
      description: 'Stereolithography format for 3D printing',
      extensions: ['.stl'],
      canImport: true,
      canExport: true,
    },
    {
      format: 'OBJ',
      description: 'Wavefront OBJ 3D geometry format',
      extensions: ['.obj'],
      canImport: true,
      canExport: true,
    },
    {
      format: 'DXF',
      description: 'Drawing Exchange Format for 2D CAD data',
      extensions: ['.dxf'],
      canImport: true,
      canExport: true,
    },
  ];
}

/**
 * Validate a file path for safety and correctness
 * 
 * @param filePath - The path to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateFilePath(filePath: string): { isValid: boolean; error?: string } {
  if (!filePath || typeof filePath !== 'string') {
    return { isValid: false, error: 'File path is required' };
  }

  // Check for empty path
  if (filePath.trim() === '') {
    return { isValid: false, error: 'File path cannot be empty' };
  }

  // Check for path traversal attempts
  if (filePath.includes('..')) {
    return { isValid: false, error: 'Path traversal (..) is not allowed' };
  }

  // Check for null bytes
  if (filePath.includes('\0')) {
    return { isValid: false, error: 'Invalid characters in path' };
  }

  // Check for invalid characters on Windows
  const invalidChars = ['<', '>', '|', '?', '*'];
  for (const char of invalidChars) {
    if (filePath.includes(char)) {
      return { isValid: false, error: `Invalid character in path: ${char}` };
    }
  }

  // Check for valid absolute path format
  const isAbsolute = path.isAbsolute(filePath);
  if (!isAbsolute) {
    return { isValid: false, error: 'File path must be an absolute path' };
  }

  return { isValid: true };
}

/**
 * Resolve a path to absolute form
 * 
 * @param filePath - The path to resolve
 * @returns Absolute path
 */
export function resolveAbsolutePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(filePath);
}

/**
 * Extract and normalize file extension
 * 
 * @param filePath - The file path
 * @returns Normalized extension (e.g., '.STEP' -> 'STEP')
 */
export function getFileExtension(filePath: string): string {
  const ext = path.extname(filePath);
  // Remove leading dot and convert to uppercase
  return ext.replace('.', '').toUpperCase();
}

/**
 * Sanitize a file name by removing invalid characters
 * 
 * @param name - The name to sanitize
 * @returns Sanitized name safe for file systems
 */
export function sanitizeFileName(name: string): string {
  if (!name) {
    return '';
  }

  // Remove or replace invalid characters
  let sanitized = name
    // Replace path separators with underscores
    .replace(/[\\/]/g, '_')
    // Remove null bytes
    .replace(/\0/g, '')
    // Replace other problematic characters
    .replace(/[<>:"|?*]/g, '_')
    // Trim whitespace
    .trim();

  // Limit length (most file systems support 255 chars)
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }

  return sanitized;
}

/**
 * Check if a file path has a supported extension
 * 
 * @param filePath - The file path to check
 * @returns True if extension is supported
 */
export function hasSupportedExtension(filePath: string): boolean {
  const ext = getFileExtension(filePath);
  const formats = getSupportedFormats();
  return formats.some(format => 
    format.extensions.some(e => e.toUpperCase() === '.' + ext)
  );
}

/**
 * Get format info by extension
 * 
 * @param extension - File extension (with or without leading dot)
 * @returns Format info or null if not found
 */
export function getFormatByExtension(extension: string): FormatInfo | null {
  const ext = extension.replace('.', '').toUpperCase();
  const formats = getSupportedFormats();
  return formats.find(format => 
    format.extensions.some(e => e.toUpperCase() === '.' + ext)
  ) || null;
}

/**
 * Ensure file has correct extension for format
 * 
 * @param filePath - The file path
 * @param format - The expected format
 * @returns Path with correct extension
 */
export function ensureExtension(filePath: string, format: string): string {
  const formatInfo = getFormatByExtension(format);
  if (!formatInfo) {
    return filePath;
  }

  const currentExt = getFileExtension(filePath);
  const expectedExt = formatInfo.extensions[0].replace('.', '');

  if (currentExt !== expectedExt) {
    // Add the expected extension
    return filePath + formatInfo.extensions[0];
  }

  return filePath;
}

/**
 * Validate export format
 * 
 * @param format - The format to validate
 * @returns True if format is supported for export
 */
export function isValidExportFormat(format: string): boolean {
  const formats = getSupportedFormats();
  return formats.some(f => f.format === format.toUpperCase() && f.canExport);
}

/**
 * Validate import format
 * 
 * @param format - The format to validate
 * @returns True if format is supported for import
 */
export function isValidImportFormat(format: string): boolean {
  const formats = getSupportedFormats();
  return formats.some(f => f.format === format.toUpperCase() && f.canImport);
}
