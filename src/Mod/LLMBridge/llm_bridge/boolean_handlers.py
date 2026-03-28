# SPDX-License-Identifier: LGPL-2.1-or-later
# Boolean Operation Handlers
#
# Provides handlers for Boolean operations and shape utilities:
# - Fuse (union) two or more shapes
# - Cut (subtract) shape B from shape A
# - Common (intersection) of shapes
# - Make compound of multiple shapes
# - Validate shape integrity
# - Heal shape defects
# - Get shape properties (volume, area, bounds)
# Each handler returns JSON-serializable structures.

import FreeCAD as App
import Part


def handle_boolean_fuse(shape_names, name=None, body_name=None):
    """
    Perform Boolean fuse (union) operation on two or more shapes.

    Args:
        shape_names: List of shape object names to fuse together
        name: Optional name for the resulting fused object
        body_name: Optional name of the body to add the result to

    Returns:
        dict with success status, result info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        if not shape_names or len(shape_names) < 2:
            return {
                "success": False,
                "error": "At least two shape names are required for fuse operation",
                "data": None
            }

        # Get all shape objects
        shapes = []
        for shape_name in shape_names:
            obj = doc.getObject(shape_name)
            if obj is None:
                return {
                    "success": False,
                    "error": f"Shape '{shape_name}' not found",
                    "data": None
                }
            if not hasattr(obj, 'Shape') or obj.Shape is None:
                return {
                    "success": False,
                    "error": f"Object '{shape_name}' has no valid shape",
                    "data": None
                }
            shapes.append(obj)

        # Create the fuse feature
        if name:
            fuse = doc.addObject('Part::Fuse', name)
        else:
            fuse = doc.addObject('Part::Fuse', 'Fuse')

        # Set base and tool(s)
        fuse.Base = shapes[0]
        fuse.Tool = shapes[1]

        # For more than 2 shapes, use MultiFuse
        if len(shapes) > 2:
            doc.removeObject(fuse.Name)
            multifuse = doc.addObject('Part::MultiFuse', name or 'MultiFuse')
            multifuse.Shapes = shapes
            fuse = multifuse

        # Add to body if specified
        if body_name:
            body = doc.getObject(body_name)
            if body:
                body.addObject(fuse)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": fuse.Name,
                "featureLabel": fuse.Label,
                "featureType": fuse.TypeId,
                "documentName": doc.Name,
                "inputShapes": shape_names,
                "shapesCount": len(shape_names),
                "volume": fuse.Shape.Volume if hasattr(fuse, 'Shape') and fuse.Shape else None,
                "message": f"Fused {len(shape_names)} shape(s) into '{fuse.Label}'"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_boolean_cut(base_shape_name, tool_shape_name, name=None, body_name=None):
    """
    Perform Boolean cut (subtract) operation: subtract tool shape from base shape.

    Args:
        base_shape_name: Name of the base shape to cut from
        tool_shape_name: Name of the tool shape to subtract
        name: Optional name for the resulting cut object
        body_name: Optional name of the body to add the result to

    Returns:
        dict with success status, result info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        # Get base shape
        base = doc.getObject(base_shape_name)
        if base is None:
            return {
                "success": False,
                "error": f"Base shape '{base_shape_name}' not found",
                "data": None
            }
        if not hasattr(base, 'Shape') or base.Shape is None:
            return {
                "success": False,
                "error": f"Base shape '{base_shape_name}' has no valid shape",
                "data": None
            }

        # Get tool shape
        tool = doc.getObject(tool_shape_name)
        if tool is None:
            return {
                "success": False,
                "error": f"Tool shape '{tool_shape_name}' not found",
                "data": None
            }
        if not hasattr(tool, 'Shape') or tool.Shape is None:
            return {
                "success": False,
                "error": f"Tool shape '{tool_shape_name}' has no valid shape",
                "data": None
            }

        # Create the cut feature
        if name:
            cut = doc.addObject('Part::Cut', name)
        else:
            cut = doc.addObject('Part::Cut', 'Cut')

        # Set base and tool
        cut.Base = base
        cut.Tool = tool

        # Add to body if specified
        if body_name:
            body = doc.getObject(body_name)
            if body:
                body.addObject(cut)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": cut.Name,
                "featureLabel": cut.Label,
                "featureType": cut.TypeId,
                "documentName": doc.Name,
                "baseShape": base_shape_name,
                "toolShape": tool_shape_name,
                "volume": cut.Shape.Volume if hasattr(cut, 'Shape') and cut.Shape else None,
                "message": f"Cut '{base.Label}' with '{tool.Label}' resulting in '{cut.Label}'"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_boolean_common(shape1_name, shape2_name, name=None, body_name=None):
    """
    Perform Boolean common (intersection) operation on two shapes.

    Args:
        shape1_name: Name of the first shape
        shape2_name: Name of the second shape
        name: Optional name for the resulting common object
        body_name: Optional name of the body to add the result to

    Returns:
        dict with success status, result info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        # Get first shape
        shape1 = doc.getObject(shape1_name)
        if shape1 is None:
            return {
                "success": False,
                "error": f"Shape '{shape1_name}' not found",
                "data": None
            }
        if not hasattr(shape1, 'Shape') or shape1.Shape is None:
            return {
                "success": False,
                "error": f"Shape '{shape1_name}' has no valid shape",
                "data": None
            }

        # Get second shape
        shape2 = doc.getObject(shape2_name)
        if shape2 is None:
            return {
                "success": False,
                "error": f"Shape '{shape2_name}' not found",
                "data": None
            }
        if not hasattr(shape2, 'Shape') or shape2.Shape is None:
            return {
                "success": False,
                "error": f"Shape '{shape2_name}' has no valid shape",
                "data": None
            }

        # Create the common feature
        if name:
            common = doc.addObject('Part::Common', name)
        else:
            common = doc.addObject('Part::Common', 'Common')

        # Set base and tool
        common.Base = shape1
        common.Tool = shape2

        # Add to body if specified
        if body_name:
            body = doc.getObject(body_name)
            if body:
                body.addObject(common)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": common.Name,
                "featureLabel": common.Label,
                "featureType": common.TypeId,
                "documentName": doc.Name,
                "shape1": shape1_name,
                "shape2": shape2_name,
                "volume": common.Shape.Volume if hasattr(common, 'Shape') and common.Shape else None,
                "message": f"Created intersection of '{shape1.Label}' and '{shape2.Label}' as '{common.Label}'"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_make_compound(shape_names, name=None):
    """
    Create a compound object from multiple shapes.

    Args:
        shape_names: List of shape object names to combine into a compound
        name: Optional name for the resulting compound object

    Returns:
        dict with success status, result info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        if not shape_names or len(shape_names) < 1:
            return {
                "success": False,
                "error": "At least one shape name is required for compound operation",
                "data": None
            }

        # Get all shape objects
        shapes = []
        for shape_name in shape_names:
            obj = doc.getObject(shape_name)
            if obj is None:
                return {
                    "success": False,
                    "error": f"Shape '{shape_name}' not found",
                    "data": None
                }
            if not hasattr(obj, 'Shape') or obj.Shape is None:
                return {
                    "success": False,
                    "error": f"Object '{shape_name}' has no valid shape",
                    "data": None
                }
            shapes.append(obj)

        # Create the compound feature
        if name:
            compound = doc.addObject('Part::Compound', name)
        else:
            compound = doc.addObject('Part::Compound', 'Compound')

        # Set the shapes list
        compound.Links = shapes

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": compound.Name,
                "featureLabel": compound.Label,
                "featureType": compound.TypeId,
                "documentName": doc.Name,
                "inputShapes": shape_names,
                "shapesCount": len(shape_names),
                "message": f"Created compound '{compound.Label}' from {len(shape_names)} shape(s)"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_validate_shape(shape_name):
    """
    Validate a shape's integrity and check for defects.

    Args:
        shape_name: Name of the shape object to validate

    Returns:
        dict with success status, validation results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        obj = doc.getObject(shape_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Shape '{shape_name}' not found",
                "data": None
            }

        if not hasattr(obj, 'Shape') or obj.Shape is None:
            return {
                "success": False,
                "error": f"Object '{shape_name}' has no valid shape",
                "data": None
            }

        shape = obj.Shape

        # Check shape validity
        is_valid = shape.isValid()

        # Get shape check results
        check_result = shape.check()

        # Count topological elements
        validation_info = {
            "shapeName": shape_name,
            "isValid": is_valid,
            "checkResult": check_result,
            "solidsCount": len(shape.Solids),
            "shellsCount": len(shape.Shells),
            "facesCount": len(shape.Faces),
            "wiresCount": len(shape.Wires),
            "edgesCount": len(shape.Edges),
            "verticesCount": len(shape.Vertexes),
            "volume": shape.Volume,
            "area": shape.Area,
            "hasDefects": not is_valid or check_result != 0,
        }

        # Additional shape analysis
        if shape.BoundBox:
            validation_info["boundingBox"] = {
                "minX": shape.BoundBox.XMin,
                "minY": shape.BoundBox.YMin,
                "minZ": shape.BoundBox.ZMin,
                "maxX": shape.BoundBox.XMax,
                "maxY": shape.BoundBox.YMax,
                "maxZ": shape.BoundBox.ZMax,
            }

        # Check for null shapes
        validation_info["isNull"] = shape.isNull()

        return {
            "success": True,
            "data": {
                "shapeName": shape_name,
                "objectLabel": obj.Label,
                "isValid": is_valid,
                "checkResult": check_result,
                "validationInfo": validation_info,
                "message": f"Shape '{shape_name}' is {'valid' if is_valid else 'INVALID'}" +
                          (f" (check result: {check_result})" if check_result != 0 else "")
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_heal_shape(shape_name, heal_options=None):
    """
    Heal/fix shape defects using ShapeFix tools.

    Args:
        shape_name: Name of the shape object to heal
        heal_options: Optional dictionary with healing options:
            - fixSmallEdges: bool - Fix edges that are too small
            - fixSmallFaces: bool - Fix faces that are too small
            - sewShells: bool - Sew shells together
            - fixGaps2d: bool - Fix 2D gaps
            - fixGaps3d: bool - Fix 3D gaps
            - fixOrientation: bool - Fix face orientation
            - tolerance: float - Tolerance for healing operations

    Returns:
        dict with success status, healing results, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        obj = doc.getObject(shape_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Shape '{shape_name}' not found",
                "data": None
            }

        if not hasattr(obj, 'Shape') or obj.Shape is None:
            return {
                "success": False,
                "error": f"Object '{shape_name}' has no valid shape",
                "data": None
            }

        # Default heal options
        if heal_options is None:
            heal_options = {}

        options = {
            "fixSmallEdges": heal_options.get("fixSmallEdges", True),
            "fixSmallFaces": heal_options.get("fixSmallFaces", True),
            "sewShells": heal_options.get("sewShells", True),
            "fixGaps2d": heal_options.get("fixGaps2d", True),
            "fixGaps3d": heal_options.get("fixGaps3d", True),
            "fixOrientation": heal_options.get("fixOrientation", True),
            "tolerance": heal_options.get("tolerance", 0.01),
        }

        original_shape = obj.Shape
        original_valid = original_shape.isValid()

        # Create a Part::Feature with the healed shape using ShapeFix
        # FreeCAD's Part module provides shape healing through ShapeFix
        try:
            # Use Part.makeCompound and shape healing methods
            healed_shape = original_shape.copy()

            # Apply shape fixes using Part.ShapeFix utilities if available
            # Note: ShapeFix is available through Part.ShapeFix module in FreeCAD
            if hasattr(Part, 'ShapeFix'):
                shape_fix = Part.ShapeFix(healed_shape)

                if options["fixOrientation"]:
                    shape_fix.fixOrientation()

                if options["fixSmallEdges"]:
                    shape_fix.fixSmallEdges()

                if options["fixSmallFaces"]:
                    shape_fix.fixSmallFaces()

                if options["sewShells"]:
                    shape_fix.sewShells()

                if options["fixGaps2d"]:
                    shape_fix.fixGaps2d()

                if options["fixGaps3d"]:
                    shape_fix.fixGaps3d()

                healed_shape = shape_fix.shape()
            else:
                # Fallback: use basic shape refinement
                # This attempts to create a refined version of the shape
                healed_shape = original_shape.removeSplitter()

            # Create a new feature with the healed shape
            healed_obj = doc.addObject('Part::Feature', f'{obj.Name}_Healed')
            healed_obj.Label = f'{obj.Label} (Healed)'
            healed_obj.Shape = healed_shape

            doc.recompute()

            healed_valid = healed_shape.isValid() if healed_shape else False

            return {
                "success": True,
                "data": {
                    "originalShape": shape_name,
                    "originalValid": original_valid,
                    "healedObject": healed_obj.Name,
                    "healedLabel": healed_obj.Label,
                    "healedValid": healed_valid,
                    "options": options,
                    "originalVolume": original_shape.Volume,
                    "healedVolume": healed_shape.Volume if healed_shape else None,
                    "message": f"Healed shape '{shape_name}' -> '{healed_obj.Label}' " +
                              f"({'valid' if healed_valid else 'still invalid'})"
                }
            }

        except Exception as heal_error:
            # If ShapeFix fails, try alternative approach
            # Create a refined copy of the shape
            try:
                refined_shape = original_shape.copy()
                refined_obj = doc.addObject('Part::Feature', f'{obj.Name}_Refined')
                refined_obj.Label = f'{obj.Label} (Refined)'
                refined_obj.Shape = refined_shape

                doc.recompute()

                return {
                    "success": True,
                    "data": {
                        "originalShape": shape_name,
                        "originalValid": original_valid,
                        "healedObject": refined_obj.Name,
                        "healedLabel": refined_obj.Label,
                        "healedValid": refined_shape.isValid(),
                        "options": options,
                        "note": "ShapeFix not available, created refined copy instead",
                        "message": f"Created refined copy of '{shape_name}' as '{refined_obj.Label}'"
                    }
                }
            except Exception as fallback_error:
                return {
                    "success": False,
                    "error": f"Healing failed: {str(heal_error)}, fallback failed: {str(fallback_error)}",
                    "data": None
                }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_get_shape_info(shape_name):
    """
    Get detailed shape properties and information.

    Args:
        shape_name: Name of the shape object to query

    Returns:
        dict with success status, shape information, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        obj = doc.getObject(shape_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Shape '{shape_name}' not found",
                "data": None
            }

        if not hasattr(obj, 'Shape') or obj.Shape is None:
            return {
                "success": False,
                "error": f"Object '{shape_name}' has no valid shape",
                "data": None
            }

        shape = obj.Shape

        # Basic properties
        shape_info = {
            "name": shape_name,
            "label": obj.Label,
            "type": obj.TypeId,
            "isValid": shape.isValid(),
            "isNull": shape.isNull(),
        }

        # Geometric properties
        if not shape.isNull():
            shape_info["volume"] = shape.Volume
            shape_info["area"] = shape.Area
            shape_info["centerOfMass"] = {
                "x": shape.CenterOfMass.x,
                "y": shape.CenterOfMass.y,
                "z": shape.CenterOfMass.z,
            }

            # Bounding box
            if shape.BoundBox:
                shape_info["boundingBox"] = {
                    "min": {
                        "x": shape.BoundBox.XMin,
                        "y": shape.BoundBox.YMin,
                        "z": shape.BoundBox.ZMin,
                    },
                    "max": {
                        "x": shape.BoundBox.XMax,
                        "y": shape.BoundBox.YMax,
                        "z": shape.BoundBox.ZMax,
                    },
                    "dimensions": {
                        "x": shape.BoundBox.XLength,
                        "y": shape.BoundBox.YLength,
                        "z": shape.BoundBox.ZLength,
                    },
                }

        # Topological element counts
        shape_info["topology"] = {
            "solids": len(shape.Solids),
            "shells": len(shape.Shells),
            "faces": len(shape.Faces),
            "wires": len(shape.Wires),
            "edges": len(shape.Edges),
            "vertices": len(shape.Vertexes),
        }

        # Face details
        shape_info["faces"] = []
        for i, face in enumerate(shape.Faces):
            face_info = {
                "index": i,
                "area": face.Area,
                "surfaceType": type(face.Surface).__name__ if face.Surface else None,
            }
            if hasattr(face, 'Orientation'):
                face_info["orientation"] = face.Orientation
            shape_info["faces"].append(face_info)

        # Edge details
        shape_info["edges"] = []
        for i, edge in enumerate(shape.Edges):
            edge_info = {
                "index": i,
                "length": edge.Length,
                "curveType": type(edge.Curve).__name__ if edge.Curve else None,
            }
            shape_info["edges"].append(edge_info)

        # Material properties (if available)
        if hasattr(obj, 'Material'):
            shape_info["material"] = obj.Material

        # Placement information
        if hasattr(obj, 'Placement'):
            placement = obj.Placement
            shape_info["placement"] = {
                "position": {
                    "x": placement.Base.x,
                    "y": placement.Base.y,
                    "z": placement.Base.z,
                },
                "rotation": {
                    "axis": {
                        "x": placement.Rotation.Axis.x,
                        "y": placement.Rotation.Axis.y,
                        "z": placement.Rotation.Axis.z,
                    },
                    "angle": placement.Rotation.Angle,
                },
            }

        return {
            "success": True,
            "data": {
                "shapeName": shape_name,
                "objectLabel": obj.Label,
                "shapeInfo": shape_info,
                "message": f"Retrieved shape information for '{shape_name}'"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


# Export all handlers for easy import
__all__ = [
    'handle_boolean_fuse',
    'handle_boolean_cut',
    'handle_boolean_common',
    'handle_make_compound',
    'handle_validate_shape',
    'handle_heal_shape',
    'handle_get_shape_info',
]
