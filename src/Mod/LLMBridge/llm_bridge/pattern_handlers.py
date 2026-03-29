# SPDX-License-Identifier: LGPL-2.1-or-later
# Pattern Handlers
#
# Provides handlers for FreeCAD pattern and array operations:
# - Linear pattern (PartDesign::LinearPattern)
# - Polar pattern (PartDesign::PolarPattern)
# - Rectangular pattern (PartDesign::RectangularPattern)
# - Path pattern (Path::PathArray)
# Each handler returns JSON-serializable structures.

import FreeCAD as App
from FreeCAD import Vector


def handle_create_linear_pattern(source_object, direction, count, spacing, name=None):
    """
    Create a linear pattern feature.

    Args:
        source_object: Name of the source feature to pattern
        direction: Direction vector as tuple (x, y, z) or string "X", "Y", "Z"
        count: Number of copies (including original)
        spacing: Spacing between copies in mm
        name: Optional name for the pattern feature

    Returns:
        dict with success status, pattern info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        source_obj = doc.getObject(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        body = None
        for obj in doc.Objects:
            if obj.TypeId == "PartDesign::Body":
                if hasattr(obj, "Group") and source_obj in obj.Group:
                    body = obj
                    break
                for child in obj.Group:
                    if child == source_obj:
                        body = obj
                        break

        if not body:
            for obj in doc.Objects:
                if obj.TypeId == "PartDesign::Body":
                    body = obj
                    break

        if not body:
            body = doc.addObject("PartDesign::Body", "Body")
            body.addObject(source_obj)
            doc.recompute()

        if name:
            pattern = doc.addObject("PartDesign::LinearPattern", name)
        else:
            pattern = doc.addObject("PartDesign::LinearPattern", "LinearPattern")

        pattern.Originals = [source_obj]

        if isinstance(direction, str):
            direction = direction.upper()
            if direction == "X":
                pattern.Direction = (1, 0, 0)
            elif direction == "Y":
                pattern.Direction = (0, 1, 0)
            elif direction == "Z":
                pattern.Direction = (0, 0, 1)
            else:
                return {
                    "success": False,
                    "error": f"Invalid direction '{direction}'. Use 'X', 'Y', 'Z' or a tuple.",
                    "data": None,
                }
        else:
            pattern.Direction = direction

        pattern.Count = count
        pattern.Step = spacing

        body.addObject(pattern)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "patternName": pattern.Name,
                "patternLabel": pattern.Label,
                "patternType": pattern.TypeId,
                "documentName": doc.Name,
                "sourceObject": source_obj.Name,
                "count": pattern.Count,
                "spacing": pattern.Step,
                "direction": pattern.Direction,
                "message": f"Created linear pattern '{pattern.Label}' with {pattern.Count} copies at {pattern.Step:.2f}mm spacing",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_polar_pattern(
    source_object, center_point=None, axis=None, count=2, angle=360, name=None
):
    """
    Create a polar pattern feature.

    Args:
        source_object: Name of the source feature to pattern
        center_point: Center point as tuple (x, y, z)
        axis: Rotation axis direction as tuple (x, y, z)
        count: Number of copies (including original)
        angle: Full angle in degrees (default: 360)
        name: Optional name for the pattern feature

    Returns:
        dict with success status, pattern info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        source_obj = doc.getObject(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        body = None
        for obj in doc.Objects:
            if obj.TypeId == "PartDesign::Body":
                if hasattr(obj, "Group") and source_obj in obj.Group:
                    body = obj
                    break
                for child in obj.Group:
                    if child == source_obj:
                        body = obj
                        break

        if not body:
            for obj in doc.Objects:
                if obj.TypeId == "PartDesign::Body":
                    body = obj
                    break

        if not body:
            body = doc.addObject("PartDesign::Body", "Body")
            body.addObject(source_obj)
            doc.recompute()

        if name:
            pattern = doc.addObject("PartDesign::PolarPattern", name)
        else:
            pattern = doc.addObject("PartDesign::PolarPattern", "PolarPattern")

        pattern.Originals = [source_obj]
        if axis is not None:
            pattern.Axis = axis if isinstance(axis, tuple) else tuple(axis)
        elif center_point is not None:
            pattern.Axis = (
                center_point if isinstance(center_point, tuple) else tuple(center_point)
            )
        pattern.Count = count
        pattern.Angle = angle

        body.addObject(pattern)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "patternName": pattern.Name,
                "patternLabel": pattern.Label,
                "patternType": pattern.TypeId,
                "documentName": doc.Name,
                "sourceObject": source_obj.Name,
                "count": pattern.Count,
                "angle": pattern.Angle,
                "center": pattern.Axis,
                "message": f"Created polar pattern '{pattern.Label}' with {pattern.Count} copies around {pattern.Angle:.2f} degrees",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_rectangular_pattern(
    source_object,
    direction_x,
    count_x,
    spacing_x,
    direction_y,
    count_y,
    spacing_y,
    name=None,
):
    """
    Create a rectangular pattern feature (2D grid).

    Args:
        source_object: Name of the source feature to pattern
        direction_x: First direction vector as tuple (x, y, z) or string "X", "Y", "Z"
        count_x: Number of copies in first direction (including original)
        spacing_x: Spacing between copies in first direction in mm
        direction_y: Second direction vector as tuple (x, y, z) or string "X", "Y", "Z"
        count_y: Number of copies in second direction (including original)
        spacing_y: Spacing between copies in second direction in mm
        name: Optional name for the pattern feature

    Returns:
        dict with success status, pattern info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        source_obj = doc.getObject(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        body = None
        for obj in doc.Objects:
            if obj.TypeId == "PartDesign::Body":
                if hasattr(obj, "Group") and source_obj in obj.Group:
                    body = obj
                    break
                for child in obj.Group:
                    if child == source_obj:
                        body = obj
                        break

        if not body:
            for obj in doc.Objects:
                if obj.TypeId == "PartDesign::Body":
                    body = obj
                    break

        if not body:
            body = doc.addObject("PartDesign::Body", "Body")
            body.addObject(source_obj)
            doc.recompute()

        if name:
            pattern = doc.addObject("PartDesign::RectangularPattern", name)
        else:
            pattern = doc.addObject("PartDesign::RectangularPattern", "RectPattern")

        pattern.Originals = [source_obj]

        if isinstance(direction_x, str):
            direction_x = direction_x.upper()
            if direction_x == "X":
                pattern.Direction = (1, 0, 0)
            elif direction_x == "Y":
                pattern.Direction = (0, 1, 0)
            elif direction_x == "Z":
                pattern.Direction = (0, 0, 1)
            else:
                return {
                    "success": False,
                    "error": f"Invalid direction_x '{direction_x}'. Use 'X', 'Y', 'Z' or a tuple.",
                    "data": None,
                }
        else:
            pattern.Direction = (
                direction_x if isinstance(direction_x, tuple) else tuple(direction_x)
            )

        pattern.Count = count_x
        pattern.Step = spacing_x

        if isinstance(direction_y, str):
            direction_y = direction_y.upper()
            if direction_y == "X":
                pattern.SecondDirection = (1, 0, 0)
            elif direction_y == "Y":
                pattern.SecondDirection = (0, 1, 0)
            elif direction_y == "Z":
                pattern.SecondDirection = (0, 0, 1)
            else:
                return {
                    "success": False,
                    "error": f"Invalid direction_y '{direction_y}'. Use 'X', 'Y', 'Z' or a tuple.",
                    "data": None,
                }
        else:
            pattern.SecondDirection = (
                direction_y if isinstance(direction_y, tuple) else tuple(direction_y)
            )

        pattern.Count2 = count_y
        pattern.Step2 = spacing_y

        body.addObject(pattern)
        doc.recompute()

        total_count = count_x * count_y

        return {
            "success": True,
            "data": {
                "patternName": pattern.Name,
                "patternLabel": pattern.Label,
                "patternType": pattern.TypeId,
                "documentName": doc.Name,
                "sourceObject": source_obj.Name,
                "countX": count_x,
                "spacingX": spacing_x,
                "directionX": pattern.Direction,
                "countY": count_y,
                "spacingY": spacing_y,
                "directionY": pattern.SecondDirection,
                "totalCount": total_count,
                "message": f"Created rectangular pattern '{pattern.Label}' with {count_x}x{count_y} grid ({total_count} total copies)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_path_pattern(
    source_object, path_object, count, spacing=None, align_to_path=True, name=None
):
    """
    Create a path-based pattern along a wire or sketch edge.

    Args:
        source_object: Name of the source feature to pattern
        path_object: Name of the path object (wire, sketch, or edge)
        count: Number of copies along the path (including original)
        spacing: Distance between instances in mm (optional, evenly distributed if omitted)
        align_to_path: Whether to align instances to path tangent (default: True)
        name: Optional name for the pattern feature

    Returns:
        dict with success status, pattern info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        source_obj = doc.getObject(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        path_obj = doc.getObject(path_object)
        if path_obj is None:
            return {
                "success": False,
                "error": f"Path object '{path_object}' not found",
                "data": None,
            }

        if name:
            pattern = doc.addObject("Path::PathArray", name)
        else:
            pattern = doc.addObject("Path::PathArray", "PathArray")

        pattern.Base = source_obj
        pattern.Path = path_obj
        pattern.Count = count
        pattern.UseLink = True

        doc.recompute()

        return {
            "success": True,
            "data": {
                "patternName": pattern.Name,
                "patternLabel": pattern.Label,
                "patternType": pattern.TypeId,
                "documentName": doc.Name,
                "sourceObject": source_obj.Name,
                "pathObject": path_obj.Name,
                "count": count,
                "message": f"Created path pattern '{pattern.Label}' with {count} copies along path",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_update_linear_pattern(pattern_name, count=None, spacing=None):
    """
    Update an existing linear pattern's parameters.

    Args:
        pattern_name: Name of the linear pattern to update
        count: New number of copies (optional)
        spacing: New spacing between copies in mm (optional)

    Returns:
        dict with success status, updated info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        pattern = doc.getObject(pattern_name)
        if pattern is None:
            return {
                "success": False,
                "error": f"Pattern '{pattern_name}' not found",
                "data": None,
            }

        if not pattern.TypeId.startswith("PartDesign::LinearPattern"):
            return {
                "success": False,
                "error": f"Object '{pattern_name}' is not a linear pattern",
                "data": None,
            }

        updates = []
        if count is not None:
            old_count = pattern.Count
            pattern.Count = count
            updates.append(f"count: {old_count} -> {count}")

        if spacing is not None:
            old_spacing = pattern.Step
            pattern.Step = spacing
            updates.append(f"spacing: {old_spacing:.2f} -> {spacing:.2f}")

        if not updates:
            return {
                "success": False,
                "error": "No parameters to update. Provide count and/or spacing.",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "patternName": pattern.Name,
                "patternLabel": pattern.Label,
                "patternType": pattern.TypeId,
                "documentName": doc.Name,
                "count": pattern.Count,
                "spacing": pattern.Step,
                "updates": updates,
                "message": f"Updated linear pattern '{pattern.Label}': {', '.join(updates)}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_update_polar_pattern(pattern_name, count=None, angle=None):
    """
    Update an existing polar pattern's parameters.

    Args:
        pattern_name: Name of the polar pattern to update
        count: New number of copies (optional)
        angle: New full angle in degrees (optional)

    Returns:
        dict with success status, updated info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        pattern = doc.getObject(pattern_name)
        if pattern is None:
            return {
                "success": False,
                "error": f"Pattern '{pattern_name}' not found",
                "data": None,
            }

        if not pattern.TypeId.startswith("PartDesign::PolarPattern"):
            return {
                "success": False,
                "error": f"Object '{pattern_name}' is not a polar pattern",
                "data": None,
            }

        updates = []
        if count is not None:
            old_count = pattern.Count
            pattern.Count = count
            updates.append(f"count: {old_count} -> {count}")

        if angle is not None:
            old_angle = pattern.Angle
            pattern.Angle = angle
            updates.append(f"angle: {old_angle:.2f} -> {angle:.2f}")

        if not updates:
            return {
                "success": False,
                "error": "No parameters to update. Provide count and/or angle.",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "patternName": pattern.Name,
                "patternLabel": pattern.Label,
                "patternType": pattern.TypeId,
                "documentName": doc.Name,
                "count": pattern.Count,
                "angle": pattern.Angle,
                "updates": updates,
                "message": f"Updated polar pattern '{pattern.Label}': {', '.join(updates)}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_pattern_info(pattern_name):
    """
    Get detailed information about a pattern.

    Args:
        pattern_name: Name of the pattern to query

    Returns:
        dict with success status, pattern properties, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        pattern = doc.getObject(pattern_name)
        if pattern is None:
            return {
                "success": False,
                "error": f"Pattern '{pattern_name}' not found",
                "data": None,
            }

        pattern_types = [
            "PartDesign::LinearPattern",
            "PartDesign::PolarPattern",
            "PartDesign::RectangularPattern",
            "Path::PathArray",
        ]

        if pattern.TypeId not in pattern_types:
            return {
                "success": False,
                "error": f"Object '{pattern_name}' is not a recognized pattern type",
                "data": None,
            }

        info = {
            "patternName": pattern.Name,
            "patternLabel": pattern.Label,
            "patternType": pattern.TypeId,
            "documentName": doc.Name,
        }

        if hasattr(pattern, "Originals") and pattern.Originals:
            info["sourceObjects"] = [obj.Name for obj in pattern.Originals]

        if pattern.TypeId == "PartDesign::LinearPattern":
            info["count"] = pattern.Count
            info["spacing"] = pattern.Step
            info["direction"] = pattern.Direction
        elif pattern.TypeId == "PartDesign::PolarPattern":
            info["count"] = pattern.Count
            info["angle"] = pattern.Angle
            info["center"] = pattern.Axis
        elif pattern.TypeId == "PartDesign::RectangularPattern":
            info["dir1Count"] = pattern.Count
            info["dir1Spacing"] = pattern.Step
            info["dir2Count"] = pattern.Count2
            info["dir2Spacing"] = pattern.Step2
            info["totalCount"] = pattern.Count * pattern.Count2
        elif pattern.TypeId == "Path::PathArray":
            info["count"] = pattern.Count
            if hasattr(pattern, "Path") and pattern.Path:
                info["pathObject"] = pattern.Path.Name

        if hasattr(pattern, "Visibility"):
            info["visible"] = pattern.Visibility

        if hasattr(pattern, "Placement"):
            placement = pattern.Placement
            info["position"] = (placement.Base.x, placement.Base.y, placement.Base.z)
            info["rotation"] = (
                placement.Rotation.Angle,
                placement.Rotation.Axis.x,
                placement.Rotation.Axis.y,
                placement.Rotation.Axis.z,
            )

        return {
            "success": True,
            "data": {
                **info,
                "message": f"Retrieved info for pattern '{pattern.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_delete_pattern(pattern_name):
    """
    Delete a pattern from the document.

    Args:
        pattern_name: Name of the pattern to delete

    Returns:
        dict with success status, deleted pattern info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        pattern = doc.getObject(pattern_name)
        if pattern is None:
            return {
                "success": False,
                "error": f"Pattern '{pattern_name}' not found",
                "data": None,
            }

        pattern_types = [
            "PartDesign::LinearPattern",
            "PartDesign::PolarPattern",
            "PartDesign::RectangularPattern",
            "Path::PathArray",
        ]

        if pattern.TypeId not in pattern_types:
            return {
                "success": False,
                "error": f"Object '{pattern_name}' is not a recognized pattern type",
                "data": None,
            }

        pattern_label = pattern.Label
        pattern_type = pattern.TypeId

        doc.removeObject(pattern_name)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "patternName": pattern_name,
                "patternLabel": pattern_label,
                "patternType": pattern_type,
                "documentName": doc.Name,
                "message": f"Deleted pattern '{pattern_label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_patterns():
    """
    List all pattern objects in the current document.

    Returns:
        dict with success status, list of patterns, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        pattern_types = {
            "PartDesign::LinearPattern": "linear",
            "PartDesign::PolarPattern": "polar",
            "PartDesign::RectangularPattern": "rectangular",
            "Path::PathArray": "path",
        }

        patterns = []
        for obj in doc.Objects:
            if obj.TypeId in pattern_types:
                source_objects = []
                if hasattr(obj, "Originals") and obj.Originals:
                    source_objects = [o.Name for o in obj.Originals]
                elif hasattr(obj, "Base") and obj.Base:
                    source_objects = [obj.Base.Name]

                pattern_info = {
                    "name": obj.Name,
                    "label": obj.Label,
                    "type": pattern_types[obj.TypeId],
                    "typeId": obj.TypeId,
                    "sourceObjects": source_objects,
                    "visible": obj.Visibility if hasattr(obj, "Visibility") else True,
                }

                if obj.TypeId == "PartDesign::LinearPattern":
                    pattern_info["count"] = obj.Count
                    pattern_info["spacing"] = obj.Step
                elif obj.TypeId == "PartDesign::PolarPattern":
                    pattern_info["count"] = obj.Count
                    pattern_info["angle"] = obj.Angle
                elif obj.TypeId == "PartDesign::RectangularPattern":
                    pattern_info["dir1Count"] = obj.Count
                    pattern_info["dir1Spacing"] = obj.Step
                    pattern_info["dir2Count"] = obj.Count2
                    pattern_info["dir2Spacing"] = obj.Step2
                    pattern_info["totalCount"] = obj.Count * obj.Count2
                elif obj.TypeId == "Path::PathArray":
                    pattern_info["count"] = obj.Count

                patterns.append(pattern_info)

        return {
            "success": True,
            "data": {
                "documentName": doc.Name,
                "patternsCount": len(patterns),
                "patterns": patterns,
                "message": f"Found {len(patterns)} pattern(s) in document",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_transform_link(source_object, direction, count, spacing, name=None):
    """
    Create a transform link (3D array/pattern) using MultiTransform.

    Args:
        source_object: Name of the source feature to pattern
        direction: Direction vector as tuple (x, y, z) or string "X", "Y", "Z"
        count: Number of copies (including original)
        spacing: Spacing between copies in mm
        name: Optional name for the transform feature

    Returns:
        dict with success status, transform info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        source_obj = doc.getObject(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        body = None
        for obj in doc.Objects:
            if obj.TypeId == "PartDesign::Body":
                if hasattr(obj, "Group") and source_obj in obj.Group:
                    body = obj
                    break
                for child in obj.Group:
                    if child == source_obj:
                        body = obj
                        break

        if not body:
            for obj in doc.Objects:
                if obj.TypeId == "PartDesign::Body":
                    body = obj
                    break

        if not body:
            body = doc.addObject("PartDesign::Body", "Body")
            body.addObject(source_obj)
            doc.recompute()

        if name:
            transform = doc.addObject("PartDesign::MultiTransform", name)
        else:
            transform = doc.addObject("PartDesign::MultiTransform", "MultiTransform")

        transform.Originals = [source_obj]

        if isinstance(direction, str):
            direction = direction.upper()
            if direction == "X":
                dir_vector = (1, 0, 0)
            elif direction == "Y":
                dir_vector = (0, 1, 0)
            elif direction == "Z":
                dir_vector = (0, 0, 1)
            else:
                return {
                    "success": False,
                    "error": f"Invalid direction '{direction}'. Use 'X', 'Y', 'Z' or a tuple.",
                    "data": None,
                }
        else:
            dir_vector = direction if isinstance(direction, tuple) else tuple(direction)

        linear_pattern = doc.addObject("PartDesign::LinearPattern", "LinearPattern")
        linear_pattern.Originals = [source_obj]
        linear_pattern.Direction = dir_vector
        linear_pattern.Count = count
        linear_pattern.Step = spacing

        transform.addObject(linear_pattern)
        body.addObject(transform)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "transformName": transform.Name,
                "transformLabel": transform.Label,
                "transformType": transform.TypeId,
                "documentName": doc.Name,
                "sourceObject": source_obj.Name,
                "count": count,
                "spacing": spacing,
                "direction": dir_vector,
                "message": f"Created transform link '{transform.Label}' with {count} copies at {spacing:.2f}mm spacing",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_create_linear_pattern",
    "handle_create_polar_pattern",
    "handle_create_rectangular_pattern",
    "handle_create_path_pattern",
    "handle_create_transform_link",
    "handle_update_linear_pattern",
    "handle_update_polar_pattern",
    "handle_get_pattern_info",
    "handle_delete_pattern",
    "handle_list_patterns",
]
