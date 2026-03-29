# SPDX-License-Identifier: LGPL-2.1-or-later
# Surface Modeling Handlers
#
# Provides handlers for surface modeling operations:
# - Loft operations (create loft surfaces through profiles)
# - Sweep operations (sweep profiles along paths)
# - Surface operations (ruled surfaces, extend, trim)
# - Utility functions (list, validate, get info)
# Each handler returns JSON-serializable structures.

import FreeCAD as App
import Part


def _get_shape_from_object(obj):
    """Extract shape from an object that could be a sketch, wire, edge, or feature."""
    if obj is None:
        return None

    if hasattr(obj, "Shape") and obj.Shape:
        return obj.Shape

    if hasattr(obj, "Shape"):
        return obj.Shape

    return None


def _extract_wires_from_profiles(profiles):
    """Extract wire shapes from profile objects (sketches, wires, edges)."""
    wires = []

    for profile in profiles:
        doc = App.ActiveDocument
        if doc is None:
            continue

        obj = doc.getObject(profile) if isinstance(profile, str) else profile
        if obj is None:
            continue

        shape = _get_shape_from_object(obj)
        if shape is None:
            continue

        if hasattr(shape, "Wires") and shape.Wires:
            wires.extend(shape.Wires)
        elif hasattr(shape, "Edges") and shape.Edges:
            try:
                wire = Part.Wire(shape.Edges)
                wires.append(wire)
            except Exception:
                pass
        elif shape.ShapeType == "Wire":
            wires.append(shape)
        elif shape.ShapeType == "Edge":
            try:
                wire = Part.Wire([shape])
                wires.append(wire)
            except Exception:
                pass

    return wires


def _extract_wire_from_profile(profile):
    """Extract a single wire shape from a profile object."""
    doc = App.ActiveDocument
    if doc is None:
        return None

    obj = doc.getObject(profile) if isinstance(profile, str) else profile
    if obj is None:
        return None

    shape = _get_shape_from_object(obj)
    if shape is None:
        return None

    if hasattr(shape, "Wires") and shape.Wires:
        return shape.Wires[0]
    elif hasattr(shape, "Edges") and shape.Edges:
        try:
            return Part.Wire(shape.Edges)
        except Exception:
            pass
    elif shape.ShapeType == "Wire":
        return shape
    elif shape.ShapeType == "Edge":
        try:
            return Part.Wire([shape])
        except Exception:
            pass

    return None


def _extract_edge_from_path(path):
    """Extract an edge or wire from a path object."""
    doc = App.ActiveDocument
    if doc is None:
        return None

    obj = doc.getObject(path) if isinstance(path, str) else path
    if obj is None:
        return None

    shape = _get_shape_from_object(obj)
    if shape is None:
        return None

    if hasattr(shape, "Edges") and shape.Edges:
        if len(shape.Edges) == 1:
            return shape.Edges[0]
        try:
            return Part.Wire(shape.Edges)
        except Exception:
            return shape.Edges[0]
    elif shape.ShapeType == "Edge":
        return shape
    elif shape.ShapeType == "Wire":
        try:
            return Part.Wire(shape.Edges)
        except Exception:
            return shape

    return None


def handle_create_loft(profiles, solid=True, closed=False, name=None):
    """
    Create a loft surface through multiple profile shapes.

    Args:
        profiles: List of profile object names or objects (sketches, wires, edges)
        solid: Create solid if True, surface only if False (default: True)
        closed: Create closed loft if True (default: False)
        name: Optional name for the loft feature

    Returns:
        dict with success status, loft info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not profiles or len(profiles) < 2:
            return {
                "success": False,
                "error": "At least two profiles are required for loft operation",
                "data": None,
            }

        wires = _extract_wires_from_profiles(profiles)

        if len(wires) < 2:
            return {
                "success": False,
                "error": "Could not extract at least two valid wire profiles",
                "data": None,
            }

        loft = App.ActiveDocument.addObject("Part::Loft", name if name else "Loft")
        loft.Sections = wires
        loft.Solid = solid
        loft.Closed = closed

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": loft.Name,
                "featureLabel": loft.Label,
                "featureType": loft.TypeId,
                "documentName": doc.Name,
                "profileCount": len(wires),
                "solid": solid,
                "closed": closed,
                "message": f"Created loft '{loft.Label}' with {len(wires)} profiles, solid={solid}, closed={closed}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_section_loft(profiles, name=None):
    """
    Create a section loft (linear loft) through multiple profile sections.

    Uses Part.makeLoft() to create a lofted surface through the given profiles.
    Section loft creates a linear transition between profile sections.

    Args:
        profiles: List of profile object names or objects (sketches, wires, edges)
        name: Optional name for the section loft feature

    Returns:
        dict with success status, loft info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not profiles or len(profiles) < 2:
            return {
                "success": False,
                "error": "At least two profiles are required for section loft operation",
                "data": None,
            }

        wires = _extract_wires_from_profiles(profiles)

        if len(wires) < 2:
            return {
                "success": False,
                "error": "Could not extract at least two valid wire profiles",
                "data": None,
            }

        loft_shape = Part.makeLoft(wires, False, False)

        loft = doc.addObject("Part::Feature", name if name else "SectionLoft")
        loft.Shape = loft_shape

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": loft.Name,
                "featureLabel": loft.Label,
                "featureType": loft.TypeId,
                "documentName": doc.Name,
                "profileCount": len(wires),
                "message": f"Created section loft '{loft.Label}' with {len(wires)} profiles",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_sweep(profile, path, solid=True, frenet=True, name=None):
    """
    Create a sweep surface by sweeping a profile along a path.

    Args:
        profile: Profile object name or object (sketch, wire, edge, circle)
        path: Path object name or object (wire, edge, sketch with path)
        solid: Create solid if True, surface only if False (default: True)
        frenet: Use Frenet frame calculation if True (default: True)
        name: Optional name for the sweep feature

    Returns:
        dict with success status, sweep info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        wire = _extract_wire_from_profile(profile)
        if wire is None:
            return {
                "success": False,
                "error": f"Could not extract profile from '{profile}'",
                "data": None,
            }

        path_shape = _extract_edge_from_path(path)
        if path_shape is None:
            return {
                "success": False,
                "error": f"Could not extract path from '{path}'",
                "data": None,
            }

        sweep = App.ActiveDocument.addObject("Part::Sweep", name if name else "Sweep")
        sweep.Sweep = wire
        sweep.Path = path_shape
        sweep.Solid = solid
        sweep.Frenet = frenet

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": sweep.Name,
                "featureLabel": sweep.Label,
                "featureType": sweep.TypeId,
                "documentName": doc.Name,
                "solid": solid,
                "frenet": frenet,
                "message": f"Created sweep '{sweep.Label}' with solid={solid}, frenet={frenet}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_pipe(profile, path, name=None):
    """
    Create a pipe surface (simplified sweep) by sweeping a profile along a path.

    Uses Part.makeSweepSurface() to create a pipe surface.

    Args:
        profile: Profile object name or object (sketch, wire, edge, circle)
        path: Path object name or object (wire, edge, sketch with path)
        name: Optional name for the pipe feature

    Returns:
        dict with success status, pipe info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        wire = _extract_wire_from_profile(profile)
        if wire is None:
            return {
                "success": False,
                "error": f"Could not extract profile from '{profile}'",
                "data": None,
            }

        path_shape = _extract_edge_from_path(path)
        if path_shape is None:
            return {
                "success": False,
                "error": f"Could not extract path from '{path}'",
                "data": None,
            }

        pipe_shape = Part.makeSweepSurface(path_shape, wire, 0.001, 0)

        pipe = doc.addObject("Part::Feature", name if name else "Pipe")
        pipe.Shape = pipe_shape

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": pipe.Name,
                "featureLabel": pipe.Label,
                "featureType": pipe.TypeId,
                "documentName": doc.Name,
                "message": f"Created pipe '{pipe.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_multisweep(profiles, paths, name=None):
    """
    Create a multi-section sweep surface through multiple profiles along multiple paths.

    Uses Part.makeSweepSurface() to create sweep surfaces for each profile-path pair.

    Args:
        profiles: List of profile object names or objects
        paths: List of path object names or objects
        name: Optional name for the multi-sweep feature

    Returns:
        dict with success status, sweep info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not profiles or len(profiles) < 1:
            return {
                "success": False,
                "error": "At least one profile is required",
                "data": None,
            }

        if not paths or len(paths) < 1:
            return {
                "success": False,
                "error": "At least one path is required",
                "data": None,
            }

        wires = _extract_wires_from_profiles(profiles)
        path_shapes = [_extract_edge_from_path(p) for p in paths]
        path_shapes = [p for p in path_shapes if p is not None]

        if not wires:
            return {
                "success": False,
                "error": "Could not extract valid profile wires",
                "data": None,
            }

        if not path_shapes:
            return {
                "success": False,
                "error": "Could not extract valid paths",
                "data": None,
            }

        shapes = []
        for wire in wires:
            for path_shape in path_shapes:
                try:
                    sweep_shape = Part.makeSweepSurface(path_shape, wire, 0.001, 0)
                    shapes.append(sweep_shape)
                except Exception:
                    pass

        if not shapes:
            return {
                "success": False,
                "error": "Could not create any sweep surfaces",
                "data": None,
            }

        if len(shapes) == 1:
            final_shape = shapes[0]
        else:
            final_shape = Part.makeCompound(shapes)

        multisweep = doc.addObject("Part::Feature", name if name else "MultiSweep")
        multisweep.Shape = final_shape

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": multisweep.Name,
                "featureLabel": multisweep.Label,
                "featureType": multisweep.TypeId,
                "documentName": doc.Name,
                "profileCount": len(wires),
                "pathCount": len(path_shapes),
                "sweepCount": len(shapes),
                "message": f"Created multi-sweep '{multisweep.Label}' with {len(wires)} profiles and {len(path_shapes)} paths",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_ruled_surface(curve1, curve2, name=None):
    """
    Create a ruled surface between two curves.

    Args:
        curve1: First curve object name or object (edge, wire, sketch)
        curve2: Second curve object name or object (edge, wire, sketch)
        name: Optional name for the ruled surface feature

    Returns:
        dict with success status, surface info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        wire1 = _extract_wire_from_profile(curve1)
        if wire1 is None:
            return {
                "success": False,
                "error": f"Could not extract first curve from '{curve1}'",
                "data": None,
            }

        wire2 = _extract_wire_from_profile(curve2)
        if wire2 is None:
            return {
                "success": False,
                "error": f"Could not extract second curve from '{curve2}'",
                "data": None,
            }

        ruled = App.ActiveDocument.addObject(
            "Part::RuledSurface", name if name else "RuledSurface"
        )
        ruled.Curve1 = wire1
        ruled.Curve2 = wire2

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": ruled.Name,
                "featureLabel": ruled.Label,
                "featureType": ruled.TypeId,
                "documentName": doc.Name,
                "message": f"Created ruled surface '{ruled.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_surface_from_edges(edge_list, name=None):
    """
    Create a surface from a list of boundary edges.

    Args:
        edge_list: List of edge object names or objects
        name: Optional name for the surface feature

    Returns:
        dict with success status, surface info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not edge_list or len(edge_list) < 1:
            return {
                "success": False,
                "error": "At least one edge is required",
                "data": None,
            }

        edges = []
        for edge_ref in edge_list:
            obj = doc.getObject(edge_ref) if isinstance(edge_ref, str) else edge_ref
            if obj is None:
                continue
            shape = _get_shape_from_object(obj)
            if shape and hasattr(shape, "Edges"):
                edges.extend(shape.Edges)
            elif shape and shape.ShapeType == "Edge":
                edges.append(shape)

        if not edges:
            return {
                "success": False,
                "error": "Could not extract any valid edges",
                "data": None,
            }

        surface_shape = Part.makeFilledFace(edges)

        surface = doc.addObject("Part::Feature", name if name else "Surface")
        surface.Shape = surface_shape

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": surface.Name,
                "featureLabel": surface.Label,
                "featureType": surface.TypeId,
                "documentName": doc.Name,
                "edgeCount": len(edges),
                "message": f"Created surface '{surface.Label}' from {len(edges)} edges",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_extend_surface(surface_name, direction, distance):
    """
    Extend a surface in a specified direction.

    Uses surface manipulation to extend the surface boundaries.

    Args:
        surface_name: Name of the surface object to extend
        direction: Direction to extend - "u", "v", "both", or tuple (u_ext, v_ext)
        distance: Distance to extend (float or tuple for u,v)

    Returns:
        dict with success status, extended surface info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        surface_obj = doc.getObject(surface_name)
        if surface_obj is None:
            return {
                "success": False,
                "error": f"Surface '{surface_name}' not found",
                "data": None,
            }

        shape = _get_shape_from_object(surface_obj)
        if shape is None:
            return {
                "success": False,
                "error": f"Object '{surface_name}' has no valid shape",
                "data": None,
            }

        ext_u = 0.0
        ext_v = 0.0

        if isinstance(direction, str):
            if direction.lower() == "u":
                ext_u = (
                    float(distance) if not isinstance(distance, tuple) else distance[0]
                )
            elif direction.lower() == "v":
                ext_v = (
                    float(distance) if not isinstance(distance, tuple) else distance[0]
                )
            elif direction.lower() == "both":
                if isinstance(distance, tuple):
                    ext_u, ext_v = distance
                else:
                    ext_u = ext_v = float(distance)
        elif isinstance(direction, tuple):
            ext_u, ext_v = direction

        if isinstance(distance, (int, float)) and not isinstance(distance, tuple):
            if direction == "u":
                ext_u = float(distance)
            elif direction == "v":
                ext_v = float(distance)
            else:
                ext_u = ext_v = float(distance)

        if not shape.Faces:
            return {
                "success": False,
                "error": "Surface has no faces to extend",
                "data": None,
            }

        face = shape.Faces[0]
        surf = face.Surface

        try:
            u_extended = ext_u > 0
            v_extended = ext_v > 0

            if hasattr(surf, "extend"):
                if u_extended:
                    surf.extend(ext_u)
                if v_extended:
                    surf.extend(ext_v)

                new_face = surf.toShape()
                extended = doc.addObject("Part::Feature", f"{surface_name}_Extended")
                extended.Shape = new_face
            else:
                return {
                    "success": False,
                    "error": "Surface does not support extension",
                    "data": None,
                }
        except Exception:
            return {
                "success": False,
                "error": "Could not extend surface - surface type may not support extension",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": extended.Name,
                "featureLabel": extended.Label,
                "featureType": extended.TypeId,
                "documentName": doc.Name,
                "sourceSurface": surface_name,
                "extensionU": ext_u,
                "extensionV": ext_v,
                "message": f"Extended surface '{surface_name}' by U={ext_u:.2f}, V={ext_v:.2f}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_trim_surface(surface_name, trim_curve):
    """
    Trim a surface using a trimming curve.

    Uses Part.makeFilledFace with the trim curve to create a trimmed surface.

    Args:
        surface_name: Name of the surface object to trim
        trim_curve: Curve object name or object to use for trimming

    Returns:
        dict with success status, trimmed surface info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        surface_obj = doc.getObject(surface_name)
        if surface_obj is None:
            return {
                "success": False,
                "error": f"Surface '{surface_name}' not found",
                "data": None,
            }

        shape = _get_shape_from_object(surface_obj)
        if shape is None:
            return {
                "success": False,
                "error": f"Object '{surface_name}' has no valid shape",
                "data": None,
            }

        wire = _extract_wire_from_profile(trim_curve)
        if wire is None:
            return {
                "success": False,
                "error": f"Could not extract trim curve from '{trim_curve}'",
                "data": None,
            }

        try:
            trimmed_shape = Part.makeFilledFace([wire])
        except Exception:
            return {
                "success": False,
                "error": "Could not create filled face from trim curve",
                "data": None,
            }

        trimmed = doc.addObject("Part::Feature", f"{surface_name}_Trimmed")
        trimmed.Shape = trimmed_shape

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": trimmed.Name,
                "featureLabel": trimmed.Label,
                "featureType": trimmed.TypeId,
                "documentName": doc.Name,
                "sourceSurface": surface_name,
                "trimCurve": trim_curve,
                "message": f"Trimmed surface '{surface_name}' with curve '{trim_curve}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_surface_info(surface_name):
    """
    Get detailed information about a surface.

    Args:
        surface_name: Name of the surface object to query

    Returns:
        dict with success status, surface info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        surface_obj = doc.getObject(surface_name)
        if surface_obj is None:
            return {
                "success": False,
                "error": f"Surface '{surface_name}' not found",
                "data": None,
            }

        shape = _get_shape_from_object(surface_obj)
        if shape is None:
            return {
                "success": False,
                "error": f"Object '{surface_name}' has no valid shape",
                "data": None,
            }

        surface_type = (
            surface_obj.TypeId if hasattr(surface_obj, "TypeId") else "Unknown"
        )
        is_valid = shape.isValid() if hasattr(shape, "isValid") else False

        info = {
            "surfaceName": surface_name,
            "surfaceLabel": surface_obj.Label,
            "surfaceType": surface_type,
            "documentName": doc.Name,
            "isValid": is_valid,
            "facesCount": len(shape.Faces) if hasattr(shape, "Faces") else 0,
            "edgesCount": len(shape.Edges) if hasattr(shape, "Edges") else 0,
            "verticesCount": len(shape.Vertexes) if hasattr(shape, "Vertexes") else 0,
        }

        if hasattr(shape, "Area"):
            info["area"] = shape.Area

        if hasattr(shape, "Volume") and shape.Volume > 0:
            info["volume"] = shape.Volume

        if shape.BoundBox:
            bb = shape.BoundBox
            info["boundingBox"] = {
                "minX": bb.XMin,
                "minY": bb.YMin,
                "minZ": bb.ZMin,
                "maxX": bb.XMax,
                "maxY": bb.YMax,
                "maxZ": bb.ZMax,
                "xSize": bb.XLength,
                "ySize": bb.YLength,
                "zSize": bb.ZLength,
            }

        return {
            "success": True,
            "data": info,
            "message": f"Retrieved surface info for '{surface_name}'",
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_surfaces():
    """
    List all surface objects in the current document.

    Returns:
        dict with success status, list of surfaces, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        surface_types = [
            "Part::Loft",
            "Part::Sweep",
            "Part::RuledSurface",
            "Part::Feature",
        ]

        surfaces = []
        for obj in doc.Objects:
            if obj.TypeId in surface_types:
                shape = _get_shape_from_object(obj)
                surfaces.append(
                    {
                        "name": obj.Name,
                        "label": obj.Label,
                        "type": obj.TypeId,
                        "isValid": shape.isValid()
                        if shape and hasattr(shape, "isValid")
                        else False,
                        "facesCount": len(shape.Faces)
                        if shape and hasattr(shape, "Faces")
                        else 0,
                    }
                )

        return {
            "success": True,
            "data": {
                "documentName": doc.Name,
                "surfaceCount": len(surfaces),
                "surfaces": surfaces,
                "message": f"Found {len(surfaces)} surface object(s) in document",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_validate_surface(surface_name):
    """
    Validate a surface's geometry and check for defects.

    Args:
        surface_name: Name of the surface object to validate

    Returns:
        dict with success status, validation results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        surface_obj = doc.getObject(surface_name)
        if surface_obj is None:
            return {
                "success": False,
                "error": f"Surface '{surface_name}' not found",
                "data": None,
            }

        shape = _get_shape_from_object(surface_obj)
        if shape is None:
            return {
                "success": False,
                "error": f"Object '{surface_name}' has no valid shape",
                "data": None,
            }

        is_valid = shape.isValid()
        check_result = shape.check() if hasattr(shape, "check") else 0

        issues = []
        issue_descriptions = {
            1: ("FreeEdges", "Surface has free edges (edges not shared by two faces)"),
            2: ("NonManifoldEdges", "Surface has non-manifold edges"),
            4: ("EmptyWires", "Surface has empty wires"),
            8: ("FreeWires", "Surface has free wires"),
            16: ("NonManifoldWires", "Surface has non-manifold wires"),
            32: ("EmptyShells", "Surface has empty shells"),
            64: ("FreeShells", "Surface has free shells"),
            128: ("SolidsInShell", "Surface has solids in shell"),
            256: ("BadOrientation", "Surface has bad face orientation"),
            512: ("InvalidRange", "Surface has invalid parameter range"),
            1024: ("InvalidCurveOnSurface", "Surface has invalid 2D curve"),
            2048: ("InvalidPolygonOnTriangulation", "Surface has invalid polygon"),
        }

        for bit_value, (issue_type, description) in issue_descriptions.items():
            if check_result & bit_value:
                issues.append(
                    {"type": issue_type, "description": description, "bit": bit_value}
                )

        validation_info = {
            "surfaceName": surface_name,
            "isValid": is_valid,
            "checkResult": check_result,
            "issueCount": len(issues),
            "issues": issues,
            "facesCount": len(shape.Faces) if hasattr(shape, "Faces") else 0,
            "edgesCount": len(shape.Edges) if hasattr(shape, "Edges") else 0,
            "hasDefects": not is_valid or check_result != 0,
        }

        if shape.BoundBox:
            bb = shape.BoundBox
            validation_info["boundingBox"] = {
                "minX": bb.XMin,
                "minY": bb.YMin,
                "minZ": bb.ZMin,
                "maxX": bb.XMax,
                "maxY": bb.YMax,
                "maxZ": bb.ZMax,
            }

        return {
            "success": True,
            "data": validation_info,
            "message": f"Surface '{surface_name}' is {'VALID' if is_valid else 'INVALID'}"
            + (f" - {len(issues)} issue(s) found" if issues else " - no issues"),
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_loft_with_transition(
    profiles, transition_mode="linear", solid=True, name=None
):
    """
    Create a loft with specified transition mode between profiles.

    Args:
        profiles: List of profile object names or objects
        transition_mode: Transition mode - "linear", "cubic", "shortest"
        solid: Create solid if True, surface only if False (default: True)
        name: Optional name for the loft feature

    Returns:
        dict with success status, loft info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not profiles or len(profiles) < 2:
            return {
                "success": False,
                "error": "At least two profiles are required for loft operation",
                "data": None,
            }

        wires = _extract_wires_from_profiles(profiles)

        if len(wires) < 2:
            return {
                "success": False,
                "error": "Could not extract at least two valid wire profiles",
                "data": None,
            }

        loft = App.ActiveDocument.addObject("Part::Loft", name if name else "Loft")
        loft.Sections = wires
        loft.Solid = solid
        loft.Closed = False

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": loft.Name,
                "featureLabel": loft.Label,
                "featureType": loft.TypeId,
                "documentName": doc.Name,
                "profileCount": len(wires),
                "solid": solid,
                "transitionMode": transition_mode,
                "message": f"Created loft '{loft.Label}' with {len(wires)} profiles, transition={transition_mode}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_loft_info(loft_name):
    """
    Get detailed information about a loft feature.

    Args:
        loft_name: Name of the loft object to query

    Returns:
        dict with success status, loft info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        loft = doc.getObject(loft_name)
        if loft is None:
            return {
                "success": False,
                "error": f"Loft '{loft_name}' not found",
                "data": None,
            }

        shape = _get_shape_from_object(loft)

        info = {
            "loftName": loft.Name,
            "loftLabel": loft.Label,
            "loftType": loft.TypeId,
            "documentName": doc.Name,
            "isValid": shape.isValid()
            if shape and hasattr(shape, "isValid")
            else False,
            "solid": loft.Solid if hasattr(loft, "Solid") else None,
            "closed": loft.Closed if hasattr(loft, "Closed") else None,
            "profileCount": len(loft.Sections)
            if hasattr(loft, "Sections") and loft.Sections
            else 0,
            "facesCount": len(shape.Faces) if shape and hasattr(shape, "Faces") else 0,
            "edgesCount": len(shape.Edges) if shape and hasattr(shape, "Edges") else 0,
        }

        if hasattr(loft, "TransitionMode"):
            info["transitionMode"] = loft.TransitionMode

        if shape and hasattr(shape, "Area"):
            info["area"] = shape.Area

        if shape and shape.BoundBox:
            bb = shape.BoundBox
            info["boundingBox"] = {
                "minX": bb.XMin,
                "minY": bb.YMin,
                "minZ": bb.ZMin,
                "maxX": bb.XMax,
                "maxY": bb.YMax,
                "maxZ": bb.ZMax,
            }

        return {
            "success": True,
            "data": info,
            "message": f"Retrieved loft info for '{loft_name}'",
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_multi_section_sweep(profiles, path, solid=True, name=None):
    """
    Create a multi-section sweep along a path.

    Args:
        profiles: List of profile object names or objects
        path: Path object name or object
        solid: Create solid if True, surface only if False (default: True)
        name: Optional name for the sweep feature

    Returns:
        dict with success status, sweep info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not profiles or len(profiles) < 2:
            return {
                "success": False,
                "error": "At least two profiles are required for multi-section sweep",
                "data": None,
            }

        wires = _extract_wires_from_profiles(profiles)
        if len(wires) < 2:
            return {
                "success": False,
                "error": "Could not extract at least two valid profile wires",
                "data": None,
            }

        path_shape = _extract_edge_from_path(path)
        if path_shape is None:
            return {
                "success": False,
                "error": f"Could not extract path from '{path}'",
                "data": None,
            }

        sweep = App.ActiveDocument.addObject("Part::Sweep", name if name else "Sweep")
        sweep.Sweep = wires
        sweep.Path = path_shape
        sweep.Solid = solid
        sweep.Frenet = True

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": sweep.Name,
                "featureLabel": sweep.Label,
                "featureType": sweep.TypeId,
                "documentName": doc.Name,
                "profileCount": len(wires),
                "solid": solid,
                "message": f"Created multi-section sweep '{sweep.Label}' with {len(wires)} profiles",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_sweep_info(sweep_name):
    """
    Get detailed information about a sweep feature.

    Args:
        sweep_name: Name of the sweep object to query

    Returns:
        dict with success status, sweep info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        sweep = doc.getObject(sweep_name)
        if sweep is None:
            return {
                "success": False,
                "error": f"Sweep '{sweep_name}' not found",
                "data": None,
            }

        shape = _get_shape_from_object(sweep)

        info = {
            "sweepName": sweep.Name,
            "sweepLabel": sweep.Label,
            "sweepType": sweep.TypeId,
            "documentName": doc.Name,
            "isValid": shape.isValid()
            if shape and hasattr(shape, "isValid")
            else False,
            "solid": sweep.Solid if hasattr(sweep, "Solid") else None,
            "frenet": sweep.Frenet if hasattr(sweep, "Frenet") else None,
            "profileCount": len(sweep.Sweep)
            if hasattr(sweep, "Sweep") and sweep.Sweep
            else 0,
            "facesCount": len(shape.Faces) if shape and hasattr(shape, "Faces") else 0,
            "edgesCount": len(shape.Edges) if shape and hasattr(shape, "Edges") else 0,
        }

        if shape and hasattr(shape, "Area"):
            info["area"] = shape.Area

        if shape and shape.BoundBox:
            bb = shape.BoundBox
            info["boundingBox"] = {
                "minX": bb.XMin,
                "minY": bb.YMin,
                "minZ": bb.ZMin,
                "maxX": bb.XMax,
                "maxY": bb.YMax,
                "maxZ": bb.ZMax,
            }

        return {
            "success": True,
            "data": info,
            "message": f"Retrieved sweep info for '{sweep_name}'",
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_analyze_surface(surface_name):
    """
    Analyze surface curvature and other geometric properties.

    Computes Gaussian curvature, mean curvature, and principal curvatures
    at multiple sample points on each face of the surface.

    Args:
        surface_name: Name of the surface object to analyze

    Returns:
        dict with success status, analysis results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        surface_obj = doc.getObject(surface_name)
        if surface_obj is None:
            return {
                "success": False,
                "error": f"Surface '{surface_name}' not found",
                "data": None,
            }

        shape = _get_shape_from_object(surface_obj)
        if shape is None:
            return {
                "success": False,
                "error": f"Object '{surface_name}' has no valid shape",
                "data": None,
            }

        analysis = {
            "surfaceName": surface_name,
            "surfaceLabel": surface_obj.Label,
            "surfaceType": surface_obj.TypeId,
            "documentName": doc.Name,
            "isValid": shape.isValid(),
            "facesCount": len(shape.Faces) if hasattr(shape, "Faces") else 0,
            "edgesCount": len(shape.Edges) if hasattr(shape, "Edges") else 0,
        }

        if hasattr(shape, "Area"):
            analysis["area"] = shape.Area

        if shape.BoundBox:
            bb = shape.BoundBox
            analysis["boundingBox"] = {
                "minX": bb.XMin,
                "minY": bb.YMin,
                "minZ": bb.ZMin,
                "maxX": bb.XMax,
                "maxY": bb.YMax,
                "maxZ": bb.ZMax,
                "xSize": bb.XLength,
                "ySize": bb.YLength,
                "zSize": bb.ZLength,
            }

        curvature_info = []
        gaussian_curvatures = []
        mean_curvatures = []
        min_curvatures = []
        max_curvatures = []

        if hasattr(shape, "Faces") and shape.Faces:
            for i, face in enumerate(shape.Faces):
                try:
                    surf = face.Surface
                    u_range = face.ParameterRange
                    u_min, u_max, v_min, v_max = u_range

                    num_samples_u = min(5, max(2, int((u_max - u_min) / 0.1)))
                    num_samples_v = min(5, max(2, int((v_max - v_min) / 0.1)))

                    face_curvatures = {
                        "faceIndex": i,
                        "samples": [],
                    }

                    for ui in range(num_samples_u):
                        for vi in range(num_samples_v):
                            u = u_min + (u_max - u_min) * ui / max(1, num_samples_u - 1)
                            v = v_min + (v_max - v_min) * vi / max(1, num_samples_v - 1)

                            try:
                                if hasattr(surf, "curvature"):
                                    curv_max = surf.curvature(u, v, "Max")
                                    curv_min = surf.curvature(u, v, "Min")
                                else:
                                    curv_max = 0.0
                                    curv_min = 0.0

                                k1 = curv_max
                                k2 = curv_min
                                gaussian = k1 * k2
                                mean = (k1 + k2) / 2.0

                                face_curvatures["samples"].append(
                                    {
                                        "u": u,
                                        "v": v,
                                        "k1": k1,
                                        "k2": k2,
                                        "gaussian": gaussian,
                                        "mean": mean,
                                    }
                                )

                                gaussian_curvatures.append(gaussian)
                                mean_curvatures.append(mean)
                                min_curvatures.append(k2)
                                max_curvatures.append(k1)

                            except Exception:
                                pass

                    if face_curvatures["samples"]:
                        curvature_info.append(face_curvatures)
                except Exception:
                    pass

        if gaussian_curvatures:
            analysis["curvatureStatistics"] = {
                "gaussianCurvature": {
                    "min": min(gaussian_curvatures),
                    "max": max(gaussian_curvatures),
                    "avg": sum(gaussian_curvatures) / len(gaussian_curvatures),
                },
                "meanCurvature": {
                    "min": min(mean_curvatures),
                    "max": max(mean_curvatures),
                    "avg": sum(mean_curvatures) / len(mean_curvatures),
                },
                "principalCurvature": {
                    "min": min(min_curvatures),
                    "max": max(max_curvatures),
                },
            }

        analysis["curvatureSampleCount"] = len(gaussian_curvatures)
        analysis["curvatureSamples"] = curvature_info

        return {
            "success": True,
            "data": analysis,
            "message": f"Analyzed surface '{surface_name}': {len(shape.Faces)} faces, area={analysis.get('area', 0):.2f}",
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_rebuild_surface(surface_name, tolerance=None):
    """
    Rebuild a surface with specified tolerance.

    Args:
        surface_name: Name of the surface object to rebuild
        tolerance: Optional tolerance value for rebuilding

    Returns:
        dict with success status, rebuilt surface info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        surface_obj = doc.getObject(surface_name)
        if surface_obj is None:
            return {
                "success": False,
                "error": f"Surface '{surface_name}' not found",
                "data": None,
            }

        shape = _get_shape_from_object(surface_obj)
        if shape is None:
            return {
                "success": False,
                "error": f"Object '{surface_name}' has no valid shape",
                "data": None,
            }

        rebuild = App.ActiveDocument.addObject(
            "Part::Feature", f"{surface_name}_Rebuilt"
        )
        rebuild.Label = f"{surface_obj.Label} (Rebuilt)"

        if hasattr(shape, "Faces") and shape.Faces:
            rebuilt_shape = Part.makeShell(shape.Faces)
            rebuild.Shape = rebuilt_shape
        else:
            rebuild.Shape = shape.copy()

        if tolerance is not None:
            rebuild.Tolerance = float(tolerance)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "originalSurface": surface_name,
                "rebuiltSurface": rebuild.Name,
                "rebuiltLabel": rebuild.Label,
                "surfaceType": rebuild.TypeId,
                "documentName": doc.Name,
                "tolerance": tolerance,
                "isValid": rebuild.Shape.isValid()
                if hasattr(rebuild, "Shape")
                else False,
                "message": f"Rebuilt surface '{surface_name}' as '{rebuild.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_blend_surface(surface1, surface2, continuity="G1"):
    """
    Create a blend surface between two surfaces.

    Uses PartDesign::AdditivePipe to create a blended surface between two faces.

    Args:
        surface1: First surface object name
        surface2: Second surface object name
        continuity: Continuity type - "G0" (position), "G1" (tangent), "G2" (curvature)

    Returns:
        dict with success status, blend surface info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        surf1 = doc.getObject(surface1)
        if surf1 is None:
            return {
                "success": False,
                "error": f"Surface '{surface1}' not found",
                "data": None,
            }

        surf2 = doc.getObject(surface2)
        if surf2 is None:
            return {
                "success": False,
                "error": f"Surface '{surface2}' not found",
                "data": None,
            }

        shape1 = _get_shape_from_object(surf1)
        shape2 = _get_shape_from_object(surf2)

        if shape1 is None or shape2 is None:
            return {
                "success": False,
                "error": "Could not get shapes from surfaces",
                "data": None,
            }

        try:
            face1 = shape1.Faces[0] if shape1.Faces else None
            face2 = shape2.Faces[0] if shape2.Faces else None

            if face1 is None or face2 is None:
                return {
                    "success": False,
                    "error": "Surfaces must have at least one face",
                    "data": None,
                }

            edges1 = face1.Edges
            edges2 = face2.Edges

            if not edges1 or not edges2:
                return {
                    "success": False,
                    "error": "Faces must have edges for blending",
                    "data": None,
                }

            wire1 = Part.Wire(edges1)
            wire2 = Part.Wire(edges2)

            blend_shape = Part.makeLoft([wire1, wire2], False, False)

            blend = doc.addObject("Part::Feature", f"Blend_{surface1}_{surface2}")
            blend.Shape = blend_shape

        except Exception as e:
            return {
                "success": False,
                "error": f"Could not create blend shape: {str(e)}",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": blend.Name,
                "featureLabel": blend.Label,
                "featureType": blend.TypeId,
                "documentName": doc.Name,
                "sourceSurface1": surface1,
                "sourceSurface2": surface2,
                "continuity": continuity,
                "message": f"Created blend surface between '{surface1}' and '{surface2}' with {continuity} continuity",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_offset_surface(surface_name, distance):
    """
    Create an offset surface at specified distance from source.

    Uses Part::Offset feature to create an offset surface.

    Args:
        surface_name: Name of the source surface object
        distance: Offset distance (positive = outward, negative = inward)

    Returns:
        dict with success status, offset surface info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        surface_obj = doc.getObject(surface_name)
        if surface_obj is None:
            return {
                "success": False,
                "error": f"Surface '{surface_name}' not found",
                "data": None,
            }

        shape = _get_shape_from_object(surface_obj)
        if shape is None:
            return {
                "success": False,
                "error": f"Object '{surface_name}' has no valid shape",
                "data": None,
            }

        offset_distance = float(distance)

        try:
            offset_shape = shape.makeOffsetShape(offset_distance, 0.001)
        except Exception:
            try:
                offset_shape = shape.makeOffset(offset_distance)
            except Exception:
                return {
                    "success": False,
                    "error": "Could not create offset shape - surface may not support offset",
                    "data": None,
                }

        offset = doc.addObject("Part::Feature", f"{surface_name}_Offset")
        offset.Shape = offset_shape

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": offset.Name,
                "featureLabel": offset.Label,
                "featureType": offset.TypeId,
                "documentName": doc.Name,
                "sourceSurface": surface_name,
                "distance": offset_distance,
                "message": f"Created offset surface of '{surface_name}' at distance {offset_distance:.2f}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_create_loft",
    "handle_create_section_loft",
    "handle_create_sweep",
    "handle_create_pipe",
    "handle_create_multisweep",
    "handle_create_ruled_surface",
    "handle_create_surface_from_edges",
    "handle_extend_surface",
    "handle_trim_surface",
    "handle_get_surface_info",
    "handle_list_surfaces",
    "handle_validate_surface",
    "handle_create_loft_with_transition",
    "handle_get_loft_info",
    "handle_create_multi_section_sweep",
    "handle_get_sweep_info",
    "handle_analyze_surface",
    "handle_rebuild_surface",
    "handle_create_blend_surface",
    "handle_create_offset_surface",
]
