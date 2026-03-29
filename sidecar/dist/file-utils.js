"use strict";
/**
 * File Utilities - Path validation and manipulation utilities
 *
 * Provides utility functions for file path validation, resolution,
 * and format handling for file operation tools.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportedFormats = getSupportedFormats;
exports.validateFilePath = validateFilePath;
exports.resolveAbsolutePath = resolveAbsolutePath;
exports.getFileExtension = getFileExtension;
exports.sanitizeFileName = sanitizeFileName;
exports.hasSupportedExtension = hasSupportedExtension;
exports.getFormatByExtension = getFormatByExtension;
exports.ensureExtension = ensureExtension;
exports.isValidExportFormat = isValidExportFormat;
exports.isValidImportFormat = isValidImportFormat;
const path = __importStar(require("path"));
/**
 * List of supported CAD formats
 */
function getSupportedFormats() {
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
function validateFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        return { isValid: false, error: 'File path is required' };
    }
    // Check for empty path
    if (filePath.trim() === '') {
        return { isValid: false, error: 'File path cannot be empty' };
    }
    // Check for path traversal attempts using normalized path
    // This handles cases like 'C:/../folder/file.FCStd' properly
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
        return { isValid: false, error: 'Path resolves outside allowed directory' };
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
function resolveAbsolutePath(filePath) {
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
function getFileExtension(filePath) {
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
function sanitizeFileName(name) {
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
function hasSupportedExtension(filePath) {
    const ext = getFileExtension(filePath);
    const formats = getSupportedFormats();
    return formats.some(format => format.extensions.some(e => e.toUpperCase() === '.' + ext));
}
/**
 * Get format info by extension
 *
 * @param extension - File extension (with or without leading dot)
 * @returns Format info or null if not found
 */
function getFormatByExtension(extension) {
    const ext = extension.replace('.', '').toUpperCase();
    const formats = getSupportedFormats();
    return formats.find(format => format.extensions.some(e => e.toUpperCase() === '.' + ext)) || null;
}
/**
 * Ensure file has correct extension for format
 *
 * @param filePath - The file path
 * @param format - The expected format
 * @returns Path with correct extension
 */
function ensureExtension(filePath, format) {
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
function isValidExportFormat(format) {
    const formats = getSupportedFormats();
    return formats.some(f => f.format === format.toUpperCase() && f.canExport);
}
/**
 * Validate import format
 *
 * @param format - The format to validate
 * @returns True if format is supported for import
 */
function isValidImportFormat(format) {
    const formats = getSupportedFormats();
    return formats.some(f => f.format === format.toUpperCase() && f.canImport);
}
//# sourceMappingURL=file-utils.js.map