# SPDX-License-Identifier: LGPL-2.1-or-later
# File Handlers for File Operations Tools
#
# Provides handler functions for file operations:
# save, open, export, list recent documents, and create new documents.
# Each handler returns JSON-serializable structures.

import os
import json

import FreeCAD as App

# Supported export formats
SUPPORTED_FORMATS = ["STEP", "IGES", "STL", "OBJ", "DXF", "FCStd", "FCBak"]


def handle_save_document(file_path: str = None, format: str = "FCStd") -> dict:
    """
    Save the current FreeCAD document.

    Args:
        file_path: Path to save the document. If None, saves to current path.
        format: Save format - "FCStd" (default) or "FCBak"

    Returns:
        dict with success status, file path, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document to save",
                "filePath": None
            }

        # Validate format
        format_upper = format.upper()
        if format_upper not in ["FCSTD", "FCBAK"]:
            return {
                "success": False,
                "error": f"Unsupported save format: {format}. Use FCStd or FCBak.",
                "filePath": None
            }

        # Determine file path
        if file_path is None:
            # Save to current document path
            if not doc.FileName:
                return {
                    "success": False,
                    "error": "Document has no file path. Please provide a file_path parameter.",
                    "filePath": None
                }
            save_path = doc.FileName
        else:
            save_path = file_path

        # Ensure proper extension
        ext = os.path.splitext(save_path)[1].upper()
        expected_ext = "." + format_upper
        if ext != expected_ext:
            save_path = save_path + expected_ext

        # Save the document
        doc.saveAs(save_path)

        return {
            "success": True,
            "filePath": save_path,
            "message": f"Document saved to {save_path}"
        }
    except PermissionError as e:
        return {
            "success": False,
            "error": f"Permission denied: {str(e)}",
            "filePath": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Save failed: {str(e)}",
            "filePath": None
        }


def handle_open_document(file_path: str) -> dict:
    """
    Open a CAD file in FreeCAD.

    Args:
        file_path: Path to the file to open

    Returns:
        dict with success status, document name, and object count
    """
    try:
        # Validate file path
        if not file_path:
            return {
                "success": False,
                "error": "File path is required",
                "documentName": None
            }

        # Check if file exists
        if not os.path.exists(file_path):
            return {
                "success": False,
                "error": f"File not found: {file_path}",
                "documentName": None
            }

        # Check file extension
        ext = os.path.splitext(file_path)[1].upper()
        supported_exts = [".FCSTD", ".FCBAK", ".STEP", ".STP", ".IGES", ".IGS", 
                          ".STL", ".OBJ", ".DXF", ".DWG"]
        if ext not in supported_exts:
            return {
                "success": False,
                "error": f"Unsupported file format: {ext}. Supported: {', '.join(supported_exts)}",
                "documentName": None
            }

        # Open the document
        doc = App.open(file_path)

        return {
            "success": True,
            "documentName": doc.Name,
            "documentLabel": doc.Label,
            "objectCount": len(doc.Objects),
            "filePath": file_path,
            "message": f"Opened document: {doc.Label} ({doc.Name})"
        }
    except PermissionError as e:
        return {
            "success": False,
            "error": f"Permission denied: {str(e)}",
            "documentName": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Open failed: {str(e)}",
            "documentName": None
        }


def handle_export_to_format(file_path: str, format: str) -> dict:
    """
    Export the current document to a specific CAD format.

    Args:
        file_path: Path to export the file to
        format: Export format - "STEP", "IGES", "STL", "OBJ", "DXF"

    Returns:
        dict with success status, file path, and format
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document to export",
                "filePath": None
            }

        format_upper = format.upper()
        if format_upper not in SUPPORTED_FORMATS:
            return {
                "success": False,
                "error": f"Unsupported export format: {format}. Supported: {', '.join(SUPPORTED_FORMATS)}",
                "filePath": None
            }

        # Ensure proper extension
        ext_map = {
            "STEP": ".step",
            "IGES": ".iges",
            "STL": ".stl",
            "OBJ": ".obj",
            "DXF": ".dxf",
            "FCSTD": ".FCStd",
            "FCBAK": ".FCBak"
        }
        expected_ext = ext_map.get(format_upper, "")

        current_ext = os.path.splitext(file_path)[1].lower()
        if current_ext.lower() != expected_ext.lower():
            export_path = file_path + expected_ext
        else:
            export_path = file_path

        # Get shape objects for export
        shape_objects = [obj for obj in doc.Objects if hasattr(obj, 'Shape') and obj.Shape]

        if not shape_objects:
            return {
                "success": False,
                "error": "No shape objects found in document to export",
                "filePath": None
            }

        # Export based on format
        if format_upper in ["STEP", "IGES"]:
            import Part
            Part.export(shape_objects, export_path)
        elif format_upper == "STL":
            import Mesh
            # Convert shapes to mesh if needed
            shapes = [obj.Shape for obj in shape_objects]
            if shapes:
                mesh = None
                try:
                    mesh = App.activeDocument().addObject("Mesh::Feature", "ExportMesh")
                    mesh.Mesh = Part.makeMeshFromBrepShapes(shapes)
                    Mesh.export([mesh], export_path)
                finally:
                    if mesh:
                        doc.removeObject(mesh.Name)
            else:
                return {
                    "success": False,
                    "error": "No shapes to mesh",
                    "filePath": None
                }
        elif format_upper == "OBJ":
            import Mesh
            shapes = [obj.Shape for obj in shape_objects]
            if shapes:
                mesh = None
                try:
                    mesh = App.activeDocument().addObject("Mesh::Feature", "ExportMesh")
                    mesh.Mesh = Part.makeMeshFromBrepShapes(shapes)
                    Mesh.export([mesh], export_path)
                finally:
                    if mesh:
                        doc.removeObject(mesh.Name)
            else:
                return {
                    "success": False,
                    "error": "No shapes to mesh",
                    "filePath": None
                }
        elif format_upper == "DXF":
            import Drawing
            # Export 2D projection
            for obj in shape_objects:
                Drawing.export(obj, export_path)
                break  # Export first object for DXF
        elif format_upper in ["FCSTD", "FCBAK"]:
            doc.saveAs(export_path)

        return {
            "success": True,
            "filePath": export_path,
            "format": format_upper,
            "message": f"Exported {len(shape_objects)} objects to {export_path} as {format_upper}"
        }
    except PermissionError as e:
        return {
            "success": False,
            "error": f"Permission denied: {str(e)}",
            "filePath": None
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Export failed: {str(e)}",
            "filePath": None
        }


def handle_list_recent_documents() -> dict:
    """
    List recently opened documents from FreeCAD preferences.

    Returns:
        dict with array of recent file paths
    """
    try:
        # FreeCAD stores recent files in preferences
        recent_files = []
        
        try:
            # Access recent files from preferences
            # FreeCAD typically stores up to 10 recent files
            for i in range(10):
                try:
                    param_path = f"User parameter:BaseApp/Preferences/General/RecentFiles/File{i}"
                    param = App.ParamGet(param_path)
                    file_path = param.GetString("Path", "")
                    if file_path and os.path.exists(file_path):
                        recent_files.append({
                            "path": file_path,
                            "name": os.path.basename(file_path),
                            "index": i
                        })
                except Exception:
                    continue
        except Exception:
            pass

        # If no recent files found via preferences, try alternative method
        if not recent_files:
            try:
                # Try to get from MRU (Most Recently Used) list
                mru_param = App.ParamGet("User parameter:BaseApp/Preferences/General")
                for i in range(10):
                    file_path = mru_param.GetString(f"RecentFile{i}", "")
                    if file_path and os.path.exists(file_path):
                        recent_files.append({
                            "path": file_path,
                            "name": os.path.basename(file_path),
                            "index": i
                        })
            except Exception:
                pass

        return {
            "success": True,
            "count": len(recent_files),
            "files": recent_files,
            "message": f"Found {len(recent_files)} recent document(s)"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to list recent documents: {str(e)}",
            "files": []
        }


def handle_create_new_document(name: str = None, doc_type: str = "Part") -> dict:
    """
    Create a new empty FreeCAD document.

    Args:
        name: Optional name for the document
        doc_type: Document type - "Part", "Assembly", or "Sketch"

    Returns:
        dict with success status and document name
    """
    try:
        # Validate document type
        valid_types = ["Part", "Assembly", "Sketch"]
        doc_type_upper = doc_type.capitalize()
        if doc_type_upper not in valid_types:
            doc_type_upper = "Part"  # Default to Part

        # Create the document
        if name:
            doc = App.newDocument(name)
        else:
            doc = App.newDocument()

        # Set document type/label
        if doc_type_upper == "Assembly":
            doc.Label = "Assembly"
        elif doc_type_upper == "Sketch":
            doc.Label = "Sketch"
        else:
            doc.Label = "Part"

        App.setActiveDocument(doc.Name)

        return {
            "success": True,
            "documentName": doc.Name,
            "documentLabel": doc.Label,
            "message": f"Created new {doc_type_upper} document: {doc.Label} ({doc.Name})"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to create document: {str(e)}",
            "documentName": None
        }


# Export all handlers for easy import
__all__ = [
    'handle_save_document',
    'handle_open_document',
    'handle_export_to_format',
    'handle_list_recent_documents',
    'handle_create_new_document',
    'SUPPORTED_FORMATS',
]
