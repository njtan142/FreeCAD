# SPDX-License-Identifier: LGPL-2.1-or-later
# Mesh Export/Import Handlers
#
# Provides handlers for mesh file export and import operations:
# - STL export/import (binary and ASCII)
# - 3MF export/import (with colors and materials)
# - OBJ export/import (with materials)
# - PLY export (for point clouds)
# Each handler returns JSON-serializable structures.

import FreeCAD as App
import Mesh
import os


def handle_export_stl(object_name, file_path, binary=True, precision=0.01):
    """
    Export an object to STL format.

    Args:
        object_name: Name of the object to export (mesh or shape)
        file_path: Output path for the STL file
        binary: If True, export as binary STL (default True); if False, ASCII
        precision: Precision for mesh generation from shapes (default 0.01)

    Returns:
        dict with success status, output info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None,
            }

        file_path = os.path.expanduser(file_path)
        file_dir = os.path.dirname(file_path)
        if file_dir and not os.path.exists(file_dir):
            os.makedirs(file_dir)

        if hasattr(obj, "Mesh") and obj.Mesh is not None:
            mesh = obj.Mesh
            mesh.exportStl(file_path)
        elif hasattr(obj, "Shape") and obj.Shape is not None:
            import MeshPart

            mesh_feature = doc.addObject("Mesh::Feature", "TempExportMesh")
            mesh_feature.Mesh = MeshPart.meshFromShape(
                obj.Shape, LinearDeflection=precision
            )
            mesh_feature.Mesh.exportStl(file_path)
            doc.removeObject(mesh_feature.Name)
        else:
            return {
                "success": False,
                "error": f"Object '{object_name}' is neither a mesh nor a shape",
                "data": None,
            }

        if not os.path.exists(file_path):
            return {"success": False, "error": "STL file was not created", "data": None}

        file_size = os.path.getsize(file_path)

        return {
            "success": True,
            "data": {
                "outputPath": file_path,
                "format": "STL",
                "binary": binary,
                "fileSize": file_size,
                "objectName": object_name,
                "message": f"Exported '{object_name}' to STL: {file_path} ({file_size} bytes)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_export_3mf(object_name, file_path):
    """
    Export an object to 3MF format (preserves colors and materials).

    Args:
        object_name: Name of the object to export
        file_path: Output path for the 3MF file

    Returns:
        dict with success status, output info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None,
            }

        file_path = os.path.expanduser(file_path)
        file_dir = os.path.dirname(file_path)
        if file_dir and not os.path.exists(file_dir):
            os.makedirs(file_dir)

        mesh = None
        if hasattr(obj, "Mesh") and obj.Mesh is not None:
            mesh = obj.Mesh
        elif hasattr(obj, "Shape") and obj.Shape is not None:
            import MeshPart

            mesh_feature = doc.addObject("Mesh::Feature", "TempExport3MF")
            mesh_feature.Mesh = MeshPart.meshFromShape(obj.Shape)
            mesh = mesh_feature.Mesh
            temp_feature = mesh_feature
        else:
            return {
                "success": False,
                "error": f"Object '{object_name}' is neither a mesh nor a shape",
                "data": None,
            }

        try:
            Mesh.export([mesh], file_path)
        except Exception as export_error:
            return {
                "success": False,
                "error": f"3MF export failed: {str(export_error)}",
                "data": None,
            }
        finally:
            if temp_feature:
                doc.removeObject(temp_feature.Name)

        if not os.path.exists(file_path):
            return {"success": False, "error": "3MF file was not created", "data": None}

        file_size = os.path.getsize(file_path)

        return {
            "success": True,
            "data": {
                "outputPath": file_path,
                "format": "3MF",
                "fileSize": file_size,
                "objectName": object_name,
                "message": f"Exported '{object_name}' to 3MF: {file_path} ({file_size} bytes)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_export_obj(object_name, file_path, include_materials=True):
    """
    Export an object to OBJ format.

    Args:
        object_name: Name of the object to export
        file_path: Output path for the OBJ file
        include_materials: If True, export materials file (MTL) alongside OBJ

    Returns:
        dict with success status, output info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None,
            }

        file_path = os.path.expanduser(file_path)
        file_dir = os.path.dirname(file_path)
        if file_dir and not os.path.exists(file_dir):
            os.makedirs(file_dir)

        mesh = None
        temp_feature = None
        if hasattr(obj, "Mesh") and obj.Mesh is not None:
            mesh = obj.Mesh
        elif hasattr(obj, "Shape") and obj.Shape is not None:
            import MeshPart

            mesh_feature = doc.addObject("Mesh::Feature", "TempExportOBJ")
            mesh_feature.Mesh = MeshPart.meshFromShape(obj.Shape)
            mesh = mesh_feature.Mesh
            temp_feature = mesh_feature
        else:
            return {
                "success": False,
                "error": f"Object '{object_name}' is neither a mesh nor a shape",
                "data": None,
            }

        try:
            Mesh.export([mesh], file_path)
        except Exception as export_error:
            return {
                "success": False,
                "error": f"OBJ export failed: {str(export_error)}",
                "data": None,
            }
        finally:
            if temp_feature:
                doc.removeObject(temp_feature.Name)

        if not os.path.exists(file_path):
            return {"success": False, "error": "OBJ file was not created", "data": None}

        file_size = os.path.getsize(file_path)
        mtl_path = file_path.rsplit(".", 1)[0] + ".mtl"
        mtl_exported = os.path.exists(mtl_path) if include_materials else False

        return {
            "success": True,
            "data": {
                "outputPath": file_path,
                "format": "OBJ",
                "fileSize": file_size,
                "objectName": object_name,
                "materialsExported": mtl_exported if include_materials else None,
                "message": f"Exported '{object_name}' to OBJ: {file_path} ({file_size} bytes)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_export_ply(object_name, file_path):
    """
    Export an object to PLY format (Stanford Triangle Format).

    Args:
        object_name: Name of the object to export
        file_path: Output path for the PLY file

    Returns:
        dict with success status, output info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None,
            }

        file_path = os.path.expanduser(file_path)
        file_dir = os.path.dirname(file_path)
        if file_dir and not os.path.exists(file_dir):
            os.makedirs(file_dir)

        mesh = None
        temp_feature = None
        if hasattr(obj, "Mesh") and obj.Mesh is not None:
            mesh = obj.Mesh
        elif hasattr(obj, "Shape") and obj.Shape is not None:
            import MeshPart

            mesh_feature = doc.addObject("Mesh::Feature", "TempExportPLY")
            mesh_feature.Mesh = MeshPart.meshFromShape(obj.Shape)
            mesh = mesh_feature.Mesh
            temp_feature = mesh_feature
        else:
            return {
                "success": False,
                "error": f"Object '{object_name}' is neither a mesh nor a shape",
                "data": None,
            }

        try:
            Mesh.export([mesh], file_path)
        except Exception as export_error:
            return {
                "success": False,
                "error": f"PLY export failed: {str(export_error)}",
                "data": None,
            }
        finally:
            if temp_feature:
                doc.removeObject(temp_feature.Name)

        if not os.path.exists(file_path):
            return {"success": False, "error": "PLY file was not created", "data": None}

        file_size = os.path.getsize(file_path)

        return {
            "success": True,
            "data": {
                "outputPath": file_path,
                "format": "PLY",
                "fileSize": file_size,
                "objectName": object_name,
                "message": f"Exported '{object_name}' to PLY: {file_path} ({file_size} bytes)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_import_stl(file_path, mesh_name=None):
    """
    Import an STL file as a mesh.

    Args:
        file_path: Path to the STL file to import
        mesh_name: Optional name for the resulting mesh object

    Returns:
        dict with success status, mesh info, and message
    """
    try:
        file_path = os.path.expanduser(file_path)
        if not os.path.exists(file_path):
            return {
                "success": False,
                "error": f"STL file not found: {file_path}",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        mesh = Mesh.Mesh()
        mesh.read(file_path)

        triangle_count = mesh.countFacets()
        vertex_count = mesh.countVertices()

        if mesh_name:
            mesh_feature = doc.addObject("Mesh::Feature", mesh_name)
        else:
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            mesh_feature = doc.addObject("Mesh::Feature", base_name)

        mesh_feature.Mesh = mesh

        doc.recompute()

        return {
            "success": True,
            "data": {
                "meshName": mesh_feature.Name,
                "meshLabel": mesh_feature.Label,
                "triangleCount": triangle_count,
                "vertexCount": vertex_count,
                "sourceFile": file_path,
                "message": f"Imported STL from '{file_path}' as '{mesh_feature.Label}' ({triangle_count} triangles)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_import_3mf(file_path, mesh_name=None):
    """
    Import a 3MF file as a mesh.

    Args:
        file_path: Path to the 3MF file to import
        mesh_name: Optional name for the resulting mesh object

    Returns:
        dict with success status, mesh info, and message
    """
    try:
        file_path = os.path.expanduser(file_path)
        if not os.path.exists(file_path):
            return {
                "success": False,
                "error": f"3MF file not found: {file_path}",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        mesh = Mesh.Mesh()
        mesh.read(file_path)

        triangle_count = mesh.countFacets()
        vertex_count = mesh.countVertices()

        if mesh_name:
            mesh_feature = doc.addObject("Mesh::Feature", mesh_name)
        else:
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            mesh_feature = doc.addObject("Mesh::Feature", base_name)

        mesh_feature.Mesh = mesh

        doc.recompute()

        return {
            "success": True,
            "data": {
                "meshName": mesh_feature.Name,
                "meshLabel": mesh_feature.Label,
                "triangleCount": triangle_count,
                "vertexCount": vertex_count,
                "sourceFile": file_path,
                "message": f"Imported 3MF from '{file_path}' as '{mesh_feature.Label}' ({triangle_count} triangles)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_import_obj(file_path, mesh_name=None):
    """
    Import an OBJ file as a mesh.

    Args:
        file_path: Path to the OBJ file to import
        mesh_name: Optional name for the resulting mesh object

    Returns:
        dict with success status, mesh info, and message
    """
    try:
        file_path = os.path.expanduser(file_path)
        if not os.path.exists(file_path):
            return {
                "success": False,
                "error": f"OBJ file not found: {file_path}",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        mesh = Mesh.Mesh()
        mesh.read(file_path)

        triangle_count = mesh.countFacets()
        vertex_count = mesh.countVertices()

        if mesh_name:
            mesh_feature = doc.addObject("Mesh::Feature", mesh_name)
        else:
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            mesh_feature = doc.addObject("Mesh::Feature", base_name)

        mesh_feature.Mesh = mesh

        doc.recompute()

        mtl_path = file_path.rsplit(".", 1)[0] + ".mtl"
        has_materials = os.path.exists(mtl_path)

        return {
            "success": True,
            "data": {
                "meshName": mesh_feature.Name,
                "meshLabel": mesh_feature.Label,
                "triangleCount": triangle_count,
                "vertexCount": vertex_count,
                "sourceFile": file_path,
                "hasMaterials": has_materials,
                "message": f"Imported OBJ from '{file_path}' as '{mesh_feature.Label}' ({triangle_count} triangles)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_export_stl",
    "handle_export_3mf",
    "handle_export_obj",
    "handle_export_ply",
    "handle_import_stl",
    "handle_import_3mf",
    "handle_import_obj",
]
