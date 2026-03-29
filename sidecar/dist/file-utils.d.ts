/**
 * File Utilities - Path validation and manipulation utilities
 *
 * Provides utility functions for file path validation, resolution,
 * and format handling for file operation tools.
 */
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
export declare function getSupportedFormats(): FormatInfo[];
/**
 * Validate a file path for safety and correctness
 *
 * @param filePath - The path to validate
 * @returns Object with isValid flag and optional error message
 */
export declare function validateFilePath(filePath: string): {
    isValid: boolean;
    error?: string;
};
/**
 * Resolve a path to absolute form
 *
 * @param filePath - The path to resolve
 * @returns Absolute path
 */
export declare function resolveAbsolutePath(filePath: string): string;
/**
 * Extract and normalize file extension
 *
 * @param filePath - The file path
 * @returns Normalized extension (e.g., '.STEP' -> 'STEP')
 */
export declare function getFileExtension(filePath: string): string;
/**
 * Sanitize a file name by removing invalid characters
 *
 * @param name - The name to sanitize
 * @returns Sanitized name safe for file systems
 */
export declare function sanitizeFileName(name: string): string;
/**
 * Check if a file path has a supported extension
 *
 * @param filePath - The file path to check
 * @returns True if extension is supported
 */
export declare function hasSupportedExtension(filePath: string): boolean;
/**
 * Get format info by extension
 *
 * @param extension - File extension (with or without leading dot)
 * @returns Format info or null if not found
 */
export declare function getFormatByExtension(extension: string): FormatInfo | null;
/**
 * Ensure file has correct extension for format
 *
 * @param filePath - The file path
 * @param format - The expected format
 * @returns Path with correct extension
 */
export declare function ensureExtension(filePath: string, format: string): string;
/**
 * Validate export format
 *
 * @param format - The format to validate
 * @returns True if format is supported for export
 */
export declare function isValidExportFormat(format: string): boolean;
/**
 * Validate import format
 *
 * @param format - The format to validate
 * @returns True if format is supported for import
 */
export declare function isValidImportFormat(format: string): boolean;
//# sourceMappingURL=file-utils.d.ts.map