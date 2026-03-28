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


def handle_boolean_fuse(base_shape, tool_shapes, result_name=None, body_name=None):
    """
    Perform Boolean fuse (union) operation on two or more shapes.

    Args:
        base_shape: Name of the base shape object
        tool_shapes: List of tool shape object names to fuse with the base
        result_name: Optional name for the resulting fused object
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

        # Build list of all shapes to fuse (base + tools)
        all_shape_names = [base_shape] + list(tool_shapes)
        
        if len(all_shape_names) < 2:
            return {
                "success": False,
                "error": "At least two shape names are required for fuse operation",
                "data": None
            }

        # Get all shape objects
        shapes = []
        for shape_name in all_shape_names:
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

        # Create the MultiFuse feature (works for 2 or more shapes)
        if result_name:
            fuse = doc.addObject('Part::MultiFuse', result_name)
        else:
            fuse = doc.addObject('Part::MultiFuse', 'Fuse')

        # Set all shapes to fuse
        fuse.Shapes = shapes

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
                "shapeType": fuse.TypeId,
                "documentName": doc.Name,
                "inputShapes": all_shape_names,
                "shapesCount": len(all_shape_names),
                "volume": fuse.Shape.Volume if hasattr(fuse, 'Shape') and fuse.Shape else None,
                "message": f"Fused {len(all_shape_names)} shape(s) into '{fuse.Label}'"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_boolean_cut(base_shape, tool_shapes, result_name=None, body_name=None):
    """
    Perform Boolean cut (subtract) operation: subtract tool shapes from base shape.

    Args:
        base_shape: Name of the base shape to cut from
        tool_shapes: List of tool shape object names to subtract
        result_name: Optional name for the resulting cut object
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
        base = doc.getObject(base_shape)
        if base is None:
            return {
                "success": False,
                "error": f"Base shape '{base_shape}' not found",
                "data": None
            }
        if not hasattr(base, 'Shape') or base.Shape is None:
            return {
                "success": False,
                "error": f"Base shape '{base_shape}' has no valid shape",
                "data": None
            }

        # Get all tool shapes
        tools = []
        for tool_name in tool_shapes:
            tool = doc.getObject(tool_name)
            if tool is None:
                return {
                    "success": False,
                    "error": f"Tool shape '{tool_name}' not found",
                    "data": None
                }
            if not hasattr(tool, 'Shape') or tool.Shape is None:
                return {
                    "success": False,
                    "error": f"Tool shape '{tool_name}' has no valid shape",
                    "data": None
                }
            tools.append(tool)

        if not tools:
            return {
                "success": False,
                "error": "At least one tool shape is required for cut operation",
                "data": None
            }

        # Create the cut feature
        if result_name:
            cut = doc.addObject('Part::Cut', result_name)
        else:
            cut = doc.addObject('Part::Cut', 'Cut')

        # Set base
        cut.Base = base

        # If multiple tools, create a compound of tools first
        if len(tools) > 1:
            tool_compound = doc.addObject('Part::Compound', 'ToolCompound')
            tool_compound.Links = tools
            cut.Tool = tool_compound
        else:
            cut.Tool = tools[0]

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
                "shapeType": cut.TypeId,
                "documentName": doc.Name,
                "baseShape": base_shape,
                "toolShapes": tool_shapes,
                "volume": cut.Shape.Volume if hasattr(cut, 'Shape') and cut.Shape else None,
                "message": f"Cut '{base.Label}' with {len(tools)} tool(s) resulting in '{cut.Label}'"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_boolean_common(base_shape, tool_shapes, result_name=None, body_name=None):
    """
    Perform Boolean common (intersection) operation on multiple shapes.

    Args:
        base_shape: Name of the base shape object
        tool_shapes: List of tool shape object names to intersect with the base
        result_name: Optional name for the resulting common object
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

        # Build list of all shapes to intersect (base + tools)
        all_shape_names = [base_shape] + list(tool_shapes)
        
        if len(all_shape_names) < 2:
            return {
                "success": False,
                "error": "At least two shape names are required for common operation",
                "data": None
            }

        # Get all shape objects
        shapes = []
        for shape_name in all_shape_names:
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

        # Create the common feature using Part::Common with Objects property
        if result_name:
            common = doc.addObject('Part::Common', result_name)
        else:
            common = doc.addObject('Part::Common', 'Common')

        # Set all shapes to intersect using the Objects property
        common.Objects = shapes

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
                "shapeType": common.TypeId,
                "documentName": doc.Name,
                "inputShapes": all_shape_names,
                "shapesCount": len(all_shape_names),
                "volume": common.Shape.Volume if hasattr(common, 'Shape') and common.Shape else None,
                "message": f"Created intersection of {len(all_shape_names)} shape(s) as '{common.Label}'"
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

        # Get shape check results (returns a bitmask)
        check_result = shape.check()

        # Decode the check result bitmask into human-readable issues
        # FreeCAD shape.check() returns a bitmask where different bits indicate different issues
        issues = []
        issue_descriptions = {
            1: ("FreeEdges", "Shape has free edges (edges not shared by two faces)"),
            2: ("NonManifoldEdges", "Shape has non-manifold edges (edges shared by more than two faces)"),
            4: ("EmptyWires", "Shape has empty wires (wires without edges)"),
            8: ("FreeWires", "Shape has free wires (wires not part of a face boundary)"),
            16: ("NonManifoldWires", "Shape has non-manifold wires (wires shared by more than two faces)"),
            32: ("EmptyShells", "Shape has empty shells (shells without faces)"),
            64: ("FreeShells", "Shape has free shells (shells not part of a solid)"),
            128: ("SolidsInShell", "Shape has solids in shell (shells containing solids)"),
            256: ("BadOrientation", "Shape has bad orientation (faces or solids with inconsistent orientation)"),
            512: ("InvalidRange", "Shape has invalid parameter range (curves or surfaces with invalid parameters)"),
            1024: ("InvalidCurveOnSurface", "Shape has invalid 2D curve on surface (pcurves)"),
            2048: ("InvalidPolygonOnTriangulation", "Shape has invalid polygon on triangulation"),
        }

        for bit_value, (issue_type, description) in issue_descriptions.items():
            if check_result & bit_value:
                issues.append({
                    "type": issue_type,
                    "description": description,
                    "bit": bit_value
                })

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
                "issueCount": len(issues),
                "issues": issues,
                "validationInfo": validation_info,
                "message": f"Shape '{shape_name}' is {'valid' if is_valid else 'INVALID'}" +
                          (f" - {len(issues)} issue(s) found" if issues else "")
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
        # FreeCAD's Part module provides ShapeFix utilities:
        # Part.ShapeFix.Shape, Part.ShapeFix.Solid, Part.ShapeFix.Shell,
        # Part.ShapeFix.Face, Part.ShapeFix.Wire, Part.ShapeFix.Edge
        try:
            healed_shape = original_shape.copy()

            # Use Part.ShapeFix.Shape for general shape healing
            if hasattr(Part, 'ShapeFix') and hasattr(Part.ShapeFix, 'Shape'):
                shape_fix = Part.ShapeFix.Shape(healed_shape)
                
                # Set tolerance
                if options["tolerance"]:
                    shape_fix.setPrecision(options["tolerance"])
                
                # Perform shape fix
                shape_fix.perform()
                healed_shape = shape_fix.shape()
                
            elif hasattr(Part, 'ShapeFix_Shape'):
                # Alternative API name
                shape_fix = Part.ShapeFix_Shape(healed_shape)
                shape_fix.perform()
                healed_shape = shape_fix.shape()
            else:
                # Fallback: use basic shape refinement methods available on TopoShape
                # These methods are available on FreeCAD TopoShape objects
                if options["fixSmallEdges"] or options["fixSmallFaces"]:
                    try:
                        healed_shape = healed_shape.removeSplitter()
                    except Exception:
                        pass

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

        # Build response structure expected by formatShapeInfo formatter
        # Topology section
        topology = {
            "vertices": len(shape.Vertexes),
            "edges": len(shape.Edges),
            "faces": len(shape.Faces),
            "wires": len(shape.Wires),
            "shells": len(shape.Shells),
            "solids": len(shape.Solids),
            "compounds": 1 if shape.ShapeType == "Compound" else 0,
        }

        # Geometric properties section
        properties = {}
        
        if not shape.isNull():
            # Volume and area
            properties["volume"] = shape.Volume
            properties["area"] = shape.Area
            
            # Center of mass with error handling
            try:
                com = shape.CenterOfMass
                properties["centerOfMass"] = {
                    "x": com.x,
                    "y": com.y,
                    "z": com.z,
                }
            except Exception:
                properties["centerOfMass"] = None

            # Bounding box
            if shape.BoundBox:
                bb = shape.BoundBox
                properties["boundingBox"] = {
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

        # Basic properties at top level for formatter
        result_data = {
            "shapeName": shape_name,
            "shapeLabel": obj.Label,
            "shapeType": obj.TypeId,
            "isValid": shape.isValid(),
            "isNull": shape.isNull(),
            "topology": topology,
            "properties": properties,
        }

        return {
            "success": True,
            "data": result_data,
            "message": f"Retrieved shape information for '{shape_name}'"
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
