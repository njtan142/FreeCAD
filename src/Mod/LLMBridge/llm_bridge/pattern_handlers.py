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


def handle_create_linear_pattern(object_name, direction, count, spacing, name=None):
    """
    Create a linear pattern feature.

    Args:
        object_name: Name of the source feature to pattern
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

        source_obj = doc.getObject(object_name)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{object_name}' not found",
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


def handle_create_polar_pattern(object_name, center, count, angle=360, name=None):
    """
    Create a polar pattern feature.

    Args:
        object_name: Name of the source feature to pattern
        center: Center point as tuple (x, y, z)
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

        source_obj = doc.getObject(object_name)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{object_name}' not found",
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
        pattern.Axis = center if isinstance(center, tuple) else tuple(center)
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
    object_name, dir1_count, dir1_spacing, dir2_count, dir2_spacing, name=None
):
    """
    Create a rectangular pattern feature (2D grid).

    Args:
        object_name: Name of the source feature to pattern
        dir1_count: Number of copies in first direction (including original)
        dir1_spacing: Spacing between copies in first direction in mm
        dir2_count: Number of copies in second direction (including original)
        dir2_spacing: Spacing between copies in second direction in mm
        name: Optional name for the pattern feature

    Returns:
        dict with success status, pattern info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        source_obj = doc.getObject(object_name)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{object_name}' not found",
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
        pattern.Direction = (1, 0, 0)
        pattern.Count = dir1_count
        pattern.Step = dir1_spacing
        pattern.SecondDirection = (0, 1, 0)
        pattern.Count2 = dir2_count
        pattern.Step2 = dir2_spacing

        body.addObject(pattern)
        doc.recompute()

        total_count = dir1_count * dir2_count

        return {
            "success": True,
            "data": {
                "patternName": pattern.Name,
                "patternLabel": pattern.Label,
                "patternType": pattern.TypeId,
                "documentName": doc.Name,
                "sourceObject": source_obj.Name,
                "dir1Count": dir1_count,
                "dir1Spacing": dir1_spacing,
                "dir2Count": dir2_count,
                "dir2Spacing": dir2_spacing,
                "totalCount": total_count,
                "message": f"Created rectangular pattern '{pattern.Label}' with {dir1_count}x{dir2_count} grid ({total_count} total copies)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_path_pattern(object_name, path_object, count, name=None):
    """
    Create a path-based pattern along a wire or sketch edge.

    Args:
        object_name: Name of the source feature to pattern
        path_object: Name of the path object (wire, sketch, or edge)
        count: Number of copies along the path (including original)
        name: Optional name for the pattern feature

    Returns:
        dict with success status, pattern info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        source_obj = doc.getObject(object_name)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{object_name}' not found",
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


__all__ = [
    "handle_create_linear_pattern",
    "handle_create_polar_pattern",
    "handle_create_rectangular_pattern",
    "handle_create_path_pattern",
    "handle_update_linear_pattern",
    "handle_update_polar_pattern",
    "handle_get_pattern_info",
    "handle_delete_pattern",
    "handle_list_patterns",
]
