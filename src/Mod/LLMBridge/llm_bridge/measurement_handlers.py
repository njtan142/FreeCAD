# SPDX-License-Identifier: LGPL-2.1-or-later
# Measurement Handlers
#
# Provides handlers for geometric measurement operations:
# - Distance measurement
# - Angle measurement
# - Length measurement
# - Area measurement
# - Measurement utilities
# Each handler returns JSON-serializable structures.

import FreeCAD as App
import Part


def handle_measure_distance(point1, point2):
    """
    Measure distance between two points.

    Args:
        point1: First point as tuple (x, y, z) or object name
        point2: Second point as tuple (x, y, z) or object name

    Returns:
        dict with success status and distance measurement
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        p1 = _resolve_point(doc, point1)
        p2 = _resolve_point(doc, point2)

        if p1 is None or p2 is None:
            return {
                "success": False,
                "error": "Invalid point coordinates or object not found",
                "data": None,
            }

        distance = p1.distanceToPoint(p2)

        return {
            "success": True,
            "data": {
                "distance": distance,
                "distanceMm": distance,
                "point1": {"x": p1.x, "y": p1.y, "z": p1.z},
                "point2": {"x": p2.x, "y": p2.y, "z": p2.z},
                "message": f"Distance: {distance:.4f} mm",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_measure_object_distance(obj1_name, obj2_name):
    """
    Measure minimum distance between two objects.

    Args:
        obj1_name: Name of the first object
        obj2_name: Name of the second object

    Returns:
        dict with success status and distance measurement
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj1 = doc.getObject(obj1_name)
        obj2 = doc.getObject(obj2_name)

        if obj1 is None:
            return {
                "success": False,
                "error": f"Object '{obj1_name}' not found",
                "data": None,
            }

        if obj2 is None:
            return {
                "success": False,
                "error": f"Object '{obj2_name}' not found",
                "data": None,
            }

        if not hasattr(obj1, "Shape") or not obj1.Shape:
            return {
                "success": False,
                "error": f"Object '{obj1_name}' has no shape",
                "data": None,
            }

        if not hasattr(obj2, "Shape") or not obj2.Shape:
            return {
                "success": False,
                "error": f"Object '{obj2_name}' has no shape",
                "data": None,
            }

        distance = obj1.Shape.distanceToElement(obj2.Shape)

        return {
            "success": True,
            "data": {
                "distance": distance,
                "distanceMm": distance,
                "object1": {"name": obj1.Name, "label": obj1.Label},
                "object2": {"name": obj2.Name, "label": obj2.Label},
                "message": f"Minimum distance between '{obj1.Label}' and '{obj2.Label}': {distance:.4f} mm",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_measure_angle(point1, point2, point3):
    """
    Measure angle at point2 formed by point1-point2-point3.

    Args:
        point1: First point as tuple (x, y, z) or object name
        point2: Vertex point as tuple (x, y, z) or object name
        point3: Third point as tuple (x, y, z) or object name

    Returns:
        dict with success status and angle measurement in degrees
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        p1 = _resolve_point(doc, point1)
        p2 = _resolve_point(doc, point2)
        p3 = _resolve_point(doc, point3)

        if p1 is None or p2 is None or p3 is None:
            return {
                "success": False,
                "error": "Invalid point coordinates or object not found",
                "data": None,
            }

        v1 = p1.sub(p2)
        v2 = p3.sub(p2)

        v1.normalize()
        v2.normalize()

        dot = v1.dot(v2)
        dot = max(-1.0, min(1.0, dot))

        angle_rad = App.acos(dot)
        angle_deg = angle_rad * 180 / App.PI

        return {
            "success": True,
            "data": {
                "angleRadians": angle_rad,
                "angleDegrees": angle_deg,
                "point1": {"x": p1.x, "y": p1.y, "z": p1.z},
                "point2": {"x": p2.x, "y": p2.y, "z": p2.z},
                "point3": {"x": p3.x, "y": p3.y, "z": p3.z},
                "message": f"Angle: {angle_deg:.4f} degrees",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_measure_length(obj_name):
    """
    Get length of a line/wire/edge.

    Args:
        obj_name: Name of the object to measure

    Returns:
        dict with success status and length measurement
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(obj_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{obj_name}' not found",
                "data": None,
            }

        if hasattr(obj, "Shape") and obj.Shape:
            shape = obj.Shape

            if hasattr(shape, "Length"):
                length = shape.Length
            elif hasattr(shape, "Edges") and shape.Edges:
                length = sum(edge.Length for edge in shape.Edges)
            else:
                return {
                    "success": False,
                    "error": f"Object '{obj_name}' does not have a measurable length",
                    "data": None,
                }

            return {
                "success": True,
                "data": {
                    "length": length,
                    "lengthMm": length,
                    "objectName": obj.Name,
                    "objectLabel": obj.Label,
                    "objectType": obj.TypeId,
                    "message": f"Length of '{obj.Label}': {length:.4f} mm",
                },
            }
        else:
            return {
                "success": False,
                "error": f"Object '{obj_name}' has no shape",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_measure_area(obj_name):
    """
    Get surface area of a face or object.

    Args:
        obj_name: Name of the object to measure

    Returns:
        dict with success status and area measurement
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(obj_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{obj_name}' not found",
                "data": None,
            }

        if hasattr(obj, "Shape") and obj.Shape:
            shape = obj.Shape

            if hasattr(shape, "Area"):
                area = shape.Area
            elif hasattr(shape, "Faces") and shape.Faces:
                area = sum(face.Area for face in shape.Faces)
            else:
                return {
                    "success": False,
                    "error": f"Object '{obj_name}' does not have a measurable area",
                    "data": None,
                }

            return {
                "success": True,
                "data": {
                    "area": area,
                    "areaMm2": area,
                    "objectName": obj.Name,
                    "objectLabel": obj.Label,
                    "objectType": obj.TypeId,
                    "message": f"Area of '{obj.Label}': {area:.4f} mm²",
                },
            }
        else:
            return {
                "success": False,
                "error": f"Object '{obj_name}' has no shape",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_measure_info(obj_name):
    """
    Get all measurement info for an object.

    Args:
        obj_name: Name of the object

    Returns:
        dict with success status and all measurement properties
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(obj_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{obj_name}' not found",
                "data": None,
            }

        if not hasattr(obj, "Shape") or not obj.Shape:
            return {
                "success": False,
                "error": f"Object '{obj_name}' has no shape",
                "data": None,
            }

        shape = obj.Shape
        info = {
            "objectName": obj.Name,
            "objectLabel": obj.Label,
            "objectType": obj.TypeId,
            "documentName": doc.Name,
        }

        if hasattr(shape, "BoundBox"):
            bb = shape.BoundBox
            info["boundingBox"] = {
                "xMin": bb.XMin,
                "xMax": bb.XMax,
                "yMin": bb.YMin,
                "yMax": bb.YMax,
                "zMin": bb.ZMin,
                "zMax": bb.ZMax,
                "xLength": bb.XLength,
                "yLength": bb.YLength,
                "zLength": bb.ZLength,
                "diagonal": bb.DiagonalLength,
            }

        if hasattr(shape, "Volume"):
            info["volume"] = shape.Volume

        if hasattr(shape, "Area"):
            info["area"] = shape.Area

        if hasattr(shape, "Length"):
            info["length"] = shape.Length

        if hasattr(shape, "Edges"):
            info["edgesCount"] = len(shape.Edges)
            info["totalEdgesLength"] = sum(e.Length for e in shape.Edges)

        if hasattr(shape, "Faces"):
            info["facesCount"] = len(shape.Faces)
            info["totalFacesArea"] = sum(f.Area for f in shape.Faces)

        if hasattr(shape, "Vertices"):
            info["verticesCount"] = len(shape.Vertices)

        info["message"] = f"Measurement info for '{obj.Label}'"

        return {"success": True, "data": info}
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def _resolve_point(doc, point):
    """
    Resolve a point from various input formats.

    Args:
        doc: Active document
        point: Point as tuple (x, y, z), object name with Position property,
               or object name with Vertex

    Returns:
        FreeCAD.Vector or None
    """
    from FreeCAD import Vector

    if isinstance(point, (tuple, list)) and len(point) >= 3:
        return Vector(point[0], point[1], point[2])

    obj = doc.getObject(point)
    if obj is None:
        return None

    if hasattr(obj, "Placement"):
        return obj.Placement.Base

    if hasattr(obj, "Shape") and obj.Shape and hasattr(obj.Shape, "CenterOfMass"):
        return obj.Shape.CenterOfMass

    return None


__all__ = [
    "handle_measure_distance",
    "handle_measure_object_distance",
    "handle_measure_angle",
    "handle_measure_length",
    "handle_measure_area",
    "handle_get_measure_info",
]
