# SPDX-License-Identifier: LGPL-2.1-or-later
# Mesh Operation Handlers
#
# Provides handlers for mesh operations essential for 3D printing:
# - Convert shape to mesh and vice versa
# - Mesh boolean operations (union, difference, intersection)
# - Mesh decimation/reduction
# - Mesh repair (fill holes, fix normals, remove duplicates)
# - Mesh validation and watermtight checks
# - Mesh info (vertex/face count, volume, area)
# - Scale and offset operations
# - Smoothing
# Each handler returns JSON-serializable structures.

import FreeCAD as App
import Mesh
import MeshPart
import Part


def handle_shape_to_mesh(shape_name, mesh_name=None):
    """
    Convert a shape to a mesh object.

    Args:
        shape_name: Name of the shape object to convert
        mesh_name: Optional name for the resulting mesh object

    Returns:
        dict with success status, mesh info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(shape_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Shape '{shape_name}' not found",
                "data": None,
            }

        if not hasattr(obj, "Shape") or obj.Shape is None:
            return {
                "success": False,
                "error": f"Object '{shape_name}' has no valid shape",
                "data": None,
            }

        shape = obj.Shape

        mesh_obj = Mesh.Mesh()
        mesh_obj = MeshPart.meshFromShape(
            shape, LinearDeflection=0.1, AngularDeflection=0.1
        )

        if mesh_name:
            mesh_feature = doc.addObject("Mesh::Feature", mesh_name)
        else:
            mesh_feature = doc.addObject("Mesh::Feature", f"{obj.Name}_Mesh")

        mesh_feature.Mesh = mesh_obj

        doc.recompute()

        triangle_count = mesh_obj.countFacets()
        vertex_count = mesh_obj.countVertices()

        return {
            "success": True,
            "data": {
                "meshName": mesh_feature.Name,
                "meshLabel": mesh_feature.Label,
                "triangleCount": triangle_count,
                "vertexCount": vertex_count,
                "sourceShape": shape_name,
                "message": f"Converted '{shape_name}' to mesh '{mesh_feature.Label}' ({triangle_count} triangles)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_to_shape(mesh_name, shape_name=None):
    """
    Convert a mesh to a shape (facade/solid).

    Args:
        mesh_name: Name of the mesh object to convert
        shape_name: Optional name for the resulting shape object

    Returns:
        dict with success status, shape info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }

        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh

        try:
            shape = Part.Shape()
            shape.makeShapeFromMesh(mesh.Topology, 0.01)

            if shape_name:
                shape_feature = doc.addObject("Part::Feature", shape_name)
            else:
                shape_feature = doc.addObject("Part::Feature", f"{obj.Name}_Shape")

            shape_feature.Shape = shape

            doc.recompute()

            volume = (
                shape.Volume if hasattr(shape, "Volume") and shape.Volume > 0 else 0
            )

            return {
                "success": True,
                "data": {
                    "shapeName": shape_feature.Name,
                    "shapeLabel": shape_feature.Label,
                    "volume": volume,
                    "sourceMesh": mesh_name,
                    "message": f"Converted mesh '{mesh_name}' to shape '{shape_feature.Label}'",
                },
            }
        except Exception as mesh_error:
            return {
                "success": False,
                "error": f"Failed to convert mesh to shape: {str(mesh_error)}",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_boolean_union(mesh1_name, mesh2_name, result_name=None):
    """
    Perform Boolean union on two meshes.

    Args:
        mesh1_name: Name of the first mesh object
        mesh2_name: Name of the second mesh object
        result_name: Optional name for the resulting mesh object

    Returns:
        dict with success status, result info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        mesh1_obj = doc.getObject(mesh1_name)
        if mesh1_obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh1_name}' not found",
                "data": None,
            }
        if not hasattr(mesh1_obj, "Mesh") or mesh1_obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh1_name}' is not a mesh",
                "data": None,
            }

        mesh2_obj = doc.getObject(mesh2_name)
        if mesh2_obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh2_name}' not found",
                "data": None,
            }
        if not hasattr(mesh2_obj, "Mesh") or mesh2_obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh2_name}' is not a mesh",
                "data": None,
            }

        mesh1 = mesh1_obj.Mesh
        mesh2 = mesh2_obj.Mesh

        result_mesh = mesh1.unite(mesh2)

        if result_name:
            result_feature = doc.addObject("Mesh::Feature", result_name)
        else:
            result_feature = doc.addObject("Mesh::Feature", "Mesh_Union")

        result_feature.Mesh = result_mesh

        doc.recompute()

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "triangleCount": result_mesh.countFacets(),
                "vertexCount": result_mesh.countVertices(),
                "inputMeshes": [mesh1_name, mesh2_name],
                "message": f"Union of '{mesh1_name}' and '{mesh2_name}' -> '{result_feature.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_boolean_difference(mesh1_name, mesh2_name, result_name=None):
    """
    Perform Boolean difference: subtract mesh2 from mesh1.

    Args:
        mesh1_name: Name of the base mesh object
        mesh2_name: Name of the mesh to subtract
        result_name: Optional name for the resulting mesh object

    Returns:
        dict with success status, result info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        mesh1_obj = doc.getObject(mesh1_name)
        if mesh1_obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh1_name}' not found",
                "data": None,
            }
        if not hasattr(mesh1_obj, "Mesh") or mesh1_obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh1_name}' is not a mesh",
                "data": None,
            }

        mesh2_obj = doc.getObject(mesh2_name)
        if mesh2_obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh2_name}' not found",
                "data": None,
            }
        if not hasattr(mesh2_obj, "Mesh") or mesh2_obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh2_name}' is not a mesh",
                "data": None,
            }

        mesh1 = mesh1_obj.Mesh
        mesh2 = mesh2_obj.Mesh

        result_mesh = mesh1.subtract(mesh2)

        if result_name:
            result_feature = doc.addObject("Mesh::Feature", result_name)
        else:
            result_feature = doc.addObject("Mesh::Feature", "Mesh_Difference")

        result_feature.Mesh = result_mesh

        doc.recompute()

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "triangleCount": result_mesh.countFacets(),
                "vertexCount": result_mesh.countVertices(),
                "baseMesh": mesh1_name,
                "toolMesh": mesh2_name,
                "message": f"Difference of '{mesh1_name}' - '{mesh2_name}' -> '{result_feature.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_boolean_intersection(mesh1_name, mesh2_name, result_name=None):
    """
    Perform Boolean intersection of two meshes.

    Args:
        mesh1_name: Name of the first mesh object
        mesh2_name: Name of the second mesh object
        result_name: Optional name for the resulting mesh object

    Returns:
        dict with success status, result info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        mesh1_obj = doc.getObject(mesh1_name)
        if mesh1_obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh1_name}' not found",
                "data": None,
            }
        if not hasattr(mesh1_obj, "Mesh") or mesh1_obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh1_name}' is not a mesh",
                "data": None,
            }

        mesh2_obj = doc.getObject(mesh2_name)
        if mesh2_obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh2_name}' not found",
                "data": None,
            }
        if not hasattr(mesh2_obj, "Mesh") or mesh2_obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh2_name}' is not a mesh",
                "data": None,
            }

        mesh1 = mesh1_obj.Mesh
        mesh2 = mesh2_obj.Mesh

        result_mesh = mesh1.intersect(mesh2)

        if result_name:
            result_feature = doc.addObject("Mesh::Feature", result_name)
        else:
            result_feature = doc.addObject("Mesh::Feature", "Mesh_Intersection")

        result_feature.Mesh = result_mesh

        doc.recompute()

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "triangleCount": result_mesh.countFacets(),
                "vertexCount": result_mesh.countVertices(),
                "inputMeshes": [mesh1_name, mesh2_name],
                "message": f"Intersection of '{mesh1_name}' and '{mesh2_name}' -> '{result_feature.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_decimate(mesh_name, target_ratio, result_name=None):
    """
    Reduce mesh complexity using decimation.

    Args:
        mesh_name: Name of the mesh object to decimate
        target_ratio: Target ratio (0.0 to 1.0) for reduction (e.g., 0.5 = reduce to 50%)

    Returns:
        dict with success status, decimation results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh
        original_triangles = mesh.countFacets()

        if target_ratio <= 0 or target_ratio > 1:
            return {
                "success": False,
                "error": "Target ratio must be between 0 and 1 (exclusive of 0)",
                "data": None,
            }

        target_triangles = max(3, int(original_triangles * target_ratio))

        decimated_mesh = Mesh.Mesh()
        decimated_mesh = mesh.copy()

        try:
            decimated_mesh.decreaseDensity(target_triangles)
        except Exception:
            pass

        try:
            from FreeCAD import Base
            import TechDraw

            pass
        except Exception:
            pass

        if result_name:
            result_feature = doc.addObject("Mesh::Feature", result_name)
        else:
            result_feature = doc.addObject("Mesh::Feature", f"{obj.Name}_Decimated")

        result_feature.Mesh = decimated_mesh

        doc.recompute()

        new_triangles = decimated_mesh.countFacets()
        reduction = (
            1.0 - (new_triangles / original_triangles) if original_triangles > 0 else 0
        )

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "originalTriangles": original_triangles,
                "newTriangles": new_triangles,
                "targetRatio": target_ratio,
                "actualReduction": reduction,
                "sourceMesh": mesh_name,
                "message": f"Decimated '{mesh_name}': {original_triangles} -> {new_triangles} triangles ({reduction * 100:.1f}% reduction)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_fill_holes(mesh_name):
    """
    Fill holes in a mesh.

    Args:
        mesh_name: Name of the mesh object to repair

    Returns:
        dict with success status, repair results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh
        original_triangles = mesh.countFacets()
        original_vertices = mesh.countVertices()

        filled_mesh = mesh.copy()
        holes_filled = filled_mesh.fillHoles()

        result_feature = doc.addObject("Mesh::Feature", f"{obj.Name}_Filled")
        result_feature.Mesh = filled_mesh

        doc.recompute()

        new_triangles = filled_mesh.countFacets()
        new_vertices = filled_mesh.countVertices()

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "holesFilled": holes_filled,
                "originalTriangles": original_triangles,
                "newTriangles": new_triangles,
                "originalVertices": original_vertices,
                "newVertices": new_vertices,
                "sourceMesh": mesh_name,
                "message": f"Filled {holes_filled} hole(s) in '{mesh_name}' -> '{result_feature.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_fix_normals(mesh_name):
    """
    Fix inverted normals in a mesh.

    Args:
        mesh_name: Name of the mesh object to repair

    Returns:
        dict with success status, repair results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh

        fixed_mesh = mesh.copy()
        fixed_mesh.fixNormals()

        result_feature = doc.addObject("Mesh::Feature", f"{obj.Name}_Fixed")
        result_feature.Mesh = fixed_mesh

        doc.recompute()

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "triangleCount": fixed_mesh.countFacets(),
                "vertexCount": fixed_mesh.countVertices(),
                "sourceMesh": mesh_name,
                "message": f"Fixed normals on '{mesh_name}' -> '{result_feature.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_remove_duplicates(mesh_name):
    """
    Remove duplicate vertices from a mesh.

    Args:
        mesh_name: Name of the mesh object to optimize

    Returns:
        dict with success status, optimization results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh
        original_vertices = mesh.countVertices()
        original_triangles = mesh.countFacets()

        cleaned_mesh = mesh.copy()
        cleaned_mesh.mergeVertices()

        result_feature = doc.addObject("Mesh::Feature", f"{obj.Name}_Cleaned")
        result_feature.Mesh = cleaned_mesh

        doc.recompute()

        new_vertices = cleaned_mesh.countVertices()
        vertices_removed = original_vertices - new_vertices

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "originalVertices": original_vertices,
                "newVertices": new_vertices,
                "verticesRemoved": vertices_removed,
                "triangleCount": cleaned_mesh.countFacets(),
                "sourceMesh": mesh_name,
                "message": f"Removed {vertices_removed} duplicate vertex(s) from '{mesh_name}' -> '{result_feature.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_validate(mesh_name):
    """
    Validate mesh integrity and check for issues.

    Args:
        mesh_name: Name of the mesh object to validate

    Returns:
        dict with success status, validation results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh

        is_valid = mesh.isValid()
        is_degenerate = mesh.hasNonUniformOrientatedFacets()

        triangle_count = mesh.countFacets()
        vertex_count = mesh.countVertices()

        issues = []
        if not is_valid:
            issues.append("Mesh has invalid topology")
        if is_degenerate:
            issues.append("Mesh has degenerate facets")
        if triangle_count == 0:
            issues.append("Mesh has no facets")

        return {
            "success": True,
            "data": {
                "meshName": mesh_name,
                "meshLabel": obj.Label,
                "isValid": is_valid,
                "isDegenerate": is_degenerate,
                "triangleCount": triangle_count,
                "vertexCount": vertex_count,
                "issueCount": len(issues),
                "issues": issues,
                "message": f"Mesh '{mesh_name}' is {'valid' if is_valid else 'INVALID'}"
                + (f" - {len(issues)} issue(s)" if issues else ""),
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_check_watertight(mesh_name):
    """
    Check if a mesh is watertight (closed manifold).

    Args:
        mesh_name: Name of the mesh object to check

    Returns:
        dict with success status, watertight status, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh

        is_closed = mesh.isClosed()
        boundary_count = mesh.countBoundaryFacets()
        triangle_count = mesh.countFacets()

        is_watertight = is_closed and boundary_count == 0

        return {
            "success": True,
            "data": {
                "meshName": mesh_name,
                "meshLabel": obj.Label,
                "isWatertight": is_watertight,
                "isClosed": is_closed,
                "boundaryFacets": boundary_count,
                "totalTriangles": triangle_count,
                "message": f"Mesh '{mesh_name}' is {'watertight' if is_watertight else 'NOT watertight'}"
                + (
                    f" ({boundary_count} boundary facets)" if boundary_count > 0 else ""
                ),
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_get_info(mesh_name):
    """
    Get detailed mesh information.

    Args:
        mesh_name: Name of the mesh object to query

    Returns:
        dict with success status, mesh info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh

        triangle_count = mesh.countFacets()
        vertex_count = mesh.countVertices()
        boundary_count = mesh.countBoundaryFacets()

        center = mesh.getCenterOfGravity()
        volume = 0.0
        try:
            if mesh.isClosed():
                volume = mesh.getVolume()
        except Exception:
            pass

        area = 0.0
        try:
            area = mesh.getArea()
        except Exception:
            pass

        bound_box = mesh.BoundBox
        bounding_box = None
        if bound_box:
            bounding_box = {
                "minX": bound_box.XMin,
                "minY": bound_box.YMin,
                "minZ": bound_box.ZMin,
                "maxX": bound_box.XMax,
                "maxY": bound_box.YMax,
                "maxZ": bound_box.ZMax,
                "xSize": bound_box.XLength,
                "ySize": bound_box.YLength,
                "zSize": bound_box.ZLength,
            }

        return {
            "success": True,
            "data": {
                "meshName": mesh_name,
                "meshLabel": obj.Label,
                "meshType": obj.TypeId,
                "triangleCount": triangle_count,
                "vertexCount": vertex_count,
                "boundaryFacets": boundary_count,
                "volume": volume,
                "area": area,
                "centerOfGravity": {"x": center.x, "y": center.y, "z": center.z}
                if center
                else None,
                "boundingBox": bounding_box,
                "isClosed": mesh.isClosed(),
                "isValid": mesh.isValid(),
                "message": f"Mesh info for '{mesh_name}': {triangle_count} triangles, {vertex_count} vertices",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_scale(mesh_name, factor, result_name=None):
    """
    Scale a mesh uniformly by a factor.

    Args:
        mesh_name: Name of the mesh object to scale
        factor: Scale factor (e.g., 2.0 = double size, 0.5 = half size)

    Returns:
        dict with success status, scaling results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh

        original_center = mesh.getCenterOfGravity()
        original_bound_box = mesh.BoundBox
        original_size = None
        if original_bound_box:
            original_size = (
                original_bound_box.XLength,
                original_bound_box.YLength,
                original_bound_box.ZLength,
            )

        scaled_mesh = mesh.copy()
        scaled_mesh.scale(factor, factor, factor)

        if result_name:
            result_feature = doc.addObject("Mesh::Feature", result_name)
        else:
            result_feature = doc.addObject("Mesh::Feature", f"{obj.Name}_Scaled")

        result_feature.Mesh = scaled_mesh

        doc.recompute()

        new_center = scaled_mesh.getCenterOfGravity()
        new_bound_box = scaled_mesh.BoundBox
        new_size = None
        if new_bound_box:
            new_size = (
                new_bound_box.XLength,
                new_bound_box.YLength,
                new_bound_box.ZLength,
            )

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "triangleCount": scaled_mesh.countFacets(),
                "vertexCount": scaled_mesh.countVertices(),
                "scaleFactor": factor,
                "originalSize": original_size,
                "newSize": new_size,
                "sourceMesh": mesh_name,
                "message": f"Scaled '{mesh_name}' by {factor}x -> '{result_feature.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_offset(mesh_name, distance, result_name=None):
    """
    Create an offset (inflated/deflated) version of a mesh.

    Args:
        mesh_name: Name of the mesh object to offset
        distance: Offset distance (positive = outward, negative = inward)

    Returns:
        dict with success status, offset results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh

        offset_mesh = mesh.copy()

        try:
            offset_mesh.offset(distance, distance, distance)
        except Exception:
            try:
                offset_mesh.offset(distance)
            except Exception as offset_error:
                return {
                    "success": False,
                    "error": f"Offset operation failed: {str(offset_error)}",
                    "data": None,
                }

        if result_name:
            result_feature = doc.addObject("Mesh::Feature", result_name)
        else:
            result_feature = doc.addObject("Mesh::Feature", f"{obj.Name}_Offset")

        result_feature.Mesh = offset_mesh

        doc.recompute()

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "triangleCount": offset_mesh.countFacets(),
                "vertexCount": offset_mesh.countVertices(),
                "offsetDistance": distance,
                "originalTriangleCount": mesh.countFacets(),
                "sourceMesh": mesh_name,
                "message": f"Offset '{mesh_name}' by {distance} -> '{result_feature.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_mesh_smooth(mesh_name, iterations=1, result_name=None):
    """
    Smooth a mesh using Laplacian smoothing.

    Args:
        mesh_name: Name of the mesh object to smooth
        iterations: Number of smoothing iterations (default=1)

    Returns:
        dict with success status, smoothing results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh

        smoothed_mesh = mesh.copy()

        try:
            smoothed_mesh.smooth(iterations)
        except Exception:
            try:
                smoothed_mesh = LaplacianSmoothing(smoothed_mesh, iterations)
            except Exception as smooth_error:
                return {
                    "success": False,
                    "error": f"Smoothing operation failed: {str(smooth_error)}",
                    "data": None,
                }

        if result_name:
            result_feature = doc.addObject("Mesh::Feature", result_name)
        else:
            result_feature = doc.addObject("Mesh::Feature", f"{obj.Name}_Smooth")

        result_feature.Mesh = smoothed_mesh

        doc.recompute()

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "triangleCount": smoothed_mesh.countFacets(),
                "vertexCount": smoothed_mesh.countVertices(),
                "iterations": iterations,
                "originalMesh": mesh_name,
                "message": f"Smoothed '{mesh_name}' ({iterations} iteration(s)) -> '{result_feature.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_repair_mesh(mesh_name: str) -> dict:
    """
    Repair mesh by fixing common issues like holes, normals, duplicates.

    Args:
        mesh_name: Name of the mesh object to repair

    Returns:
        dict with success status, repair statistics, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh
        original_triangles = mesh.countFacets()
        original_vertices = mesh.countVertices()

        repaired_mesh = mesh.copy()
        holes_filled = repaired_mesh.fillHoles()
        repaired_mesh.fixNormals()
        repaired_mesh.mergeVertices()

        result_feature = doc.addObject("Mesh::Feature", f"{obj.Name}_Repaired")
        result_feature.Mesh = repaired_mesh

        doc.recompute()

        new_triangles = repaired_mesh.countFacets()
        new_vertices = repaired_mesh.countVertices()
        vertices_removed = original_vertices - new_vertices

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "holesFilled": holes_filled,
                "verticesRemoved": vertices_removed,
                "originalTriangles": original_triangles,
                "newTriangles": new_triangles,
                "originalVertices": original_vertices,
                "newVertices": new_vertices,
                "sourceMesh": mesh_name,
                "message": f"Repaired '{mesh_name}': {holes_filled} hole(s) filled, {vertices_removed} duplicate(s) removed -> '{result_feature.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_optimize_mesh(mesh_name: str, target_ratio: float = 0.8) -> dict:
    """
    Optimize mesh for better performance/quality ratio.

    Args:
        mesh_name: Name of the mesh object to optimize
        target_ratio: Target ratio (0.0 to 1.0) for optimization (e.g., 0.8 = reduce to 80%)

    Returns:
        dict with success status, optimization statistics, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }
        if not hasattr(obj, "Mesh") or obj.Mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        mesh = obj.Mesh
        original_triangles = mesh.countFacets()
        original_vertices = mesh.countVertices()

        if target_ratio <= 0 or target_ratio > 1:
            return {
                "success": False,
                "error": "Target ratio must be between 0 and 1 (exclusive of 0)",
                "data": None,
            }

        optimized_mesh = mesh.copy()
        target_triangles = max(3, int(original_triangles * target_ratio))
        optimized_mesh.decreaseDensity(target_triangles)

        result_feature = doc.addObject("Mesh::Feature", f"{obj.Name}_Optimized")
        result_feature.Mesh = optimized_mesh

        doc.recompute()

        new_triangles = optimized_mesh.countFacets()
        new_vertices = optimized_mesh.countVertices()
        reduction = (
            1.0 - (new_triangles / original_triangles) if original_triangles > 0 else 0
        )

        return {
            "success": True,
            "data": {
                "resultMesh": result_feature.Name,
                "resultLabel": result_feature.Label,
                "originalTriangles": original_triangles,
                "newTriangles": new_triangles,
                "originalVertices": original_vertices,
                "newVertices": new_vertices,
                "targetRatio": target_ratio,
                "actualReduction": reduction,
                "sourceMesh": mesh_name,
                "message": f"Optimized '{mesh_name}': {original_triangles} -> {new_triangles} triangles ({reduction * 100:.1f}% reduction) -> '{result_feature.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_shape_to_mesh",
    "handle_mesh_to_shape",
    "handle_mesh_boolean_union",
    "handle_mesh_boolean_difference",
    "handle_mesh_boolean_intersection",
    "handle_mesh_decimate",
    "handle_mesh_fill_holes",
    "handle_mesh_fix_normals",
    "handle_mesh_remove_duplicates",
    "handle_mesh_validate",
    "handle_check_watertight",
    "handle_mesh_get_info",
    "handle_mesh_scale",
    "handle_mesh_offset",
    "handle_mesh_smooth",
    "handle_repair_mesh",
    "handle_optimize_mesh",
]
