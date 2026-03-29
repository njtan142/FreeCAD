# SPDX-License-Identifier: LGPL-2.1-or-later
# Draft Handlers for FreeCAD Draft Workbench Operations
#
# Provides handlers for Draft workbench operations:
# - Geometry creation (point, line, circle, arc, ellipse, rectangle, polygon, bspline, bezier, wire)
# - Dimension creation (linear, radial, angular, ordinate)
# - Text annotations
# - Modification operations (move, rotate, scale, offset, join, split)
# - Utility functions (list draft objects, get properties)
# Each handler returns JSON-serializable structures.

import math
import FreeCAD as App
import Draft


def _parse_point(point_data):
    """
    Parse point data from various formats to FreeCAD Vector.

    Args:
        point_data: Can be:
            - dict with x, y, z keys
            - list/tuple [x, y, z] or [x, y]
            - App.Vector

    Returns:
        App.Vector: Parsed point
    """
    if point_data is None:
        return App.Vector(0, 0, 0)

    if isinstance(point_data, App.Vector):
        return point_data

    if isinstance(point_data, dict):
        x = float(point_data.get("x", 0))
        y = float(point_data.get("y", 0))
        z = float(point_data.get("z", 0))
        return App.Vector(x, y, z)

    if isinstance(point_data, (list, tuple)):
        if len(point_data) >= 3:
            return App.Vector(
                float(point_data[0]), float(point_data[1]), float(point_data[2])
            )
        elif len(point_data) >= 2:
            return App.Vector(float(point_data[0]), float(point_data[1]), 0.0)

    return App.Vector(0, 0, 0)


def _parse_points_list(points_data):
    """
    Parse a list of points.

    Args:
        points_data: List of point data (can be dicts, lists, tuples, or Vectors)

    Returns:
        list: List of App.Vector objects
    """
    if not points_data:
        return []

    result = []
    for pt in points_data:
        result.append(_parse_point(pt))
    return result


def _format_point(pt):
    """Format a point for display."""
    if isinstance(pt, App.Vector):
        return {"x": round(pt.x, 2), "y": round(pt.y, 2), "z": round(pt.z, 2)}
    return pt


def _is_draft_object(obj):
    """Check if an object is a Draft object."""
    if obj is None:
        return False
    draft_types = [
        "Draft::Point",
        "Draft::Line",
        "Draft::Wire",
        "Draft::Circle",
        "Draft::Arc",
        "Draft::Ellipse",
        "Draft::Rectangle",
        "Draft::Polygon",
        "Draft::BSpline",
        "Draft::Bezier",
        "Draft::Dimension",
        "Draft::LinearDimension",
        "Draft::RadialDimension",
        "Draft::AngularDimension",
        "Draft::Text",
        "Annotation",
    ]
    return obj.TypeId in draft_types or obj.isDerivedFrom("Draft::")


def _get_draft_object_name(obj):
    """Get a user-friendly name for a draft object."""
    if hasattr(obj, "Label") and obj.Label:
        return obj.Label
    return obj.Name


def handle_create_point(x, y, z=None, name=None):
    """
    Create a point in 3D space.

    Args:
        x: X coordinate
        y: Y coordinate
        z: Z coordinate (optional, defaults to 0)
        name: Optional name for the point

    Returns:
        dict with success status, point info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        z_val = float(z) if z is not None else 0.0
        point = Draft.makePoint(float(x), float(y), z_val)

        if name:
            point.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": point.Name,
                "objectLabel": point.Label,
                "objectType": "Point",
                "coordinates": {"x": float(x), "y": float(y), "z": z_val},
                "message": f"Created Point '{point.Label}' at ({x}, {y}, {z_val})",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_line(point1, point2, name=None):
    """
    Create a line segment between two points.

    Args:
        point1: First point as dict/list/Vector {"x": 0, "y": 0, "z": 0} or [x, y, z]
        point2: Second point
        name: Optional name for the line

    Returns:
        dict with success status, line info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        p1 = _parse_point(point1)
        p2 = _parse_point(point2)

        line = Draft.makeLine(p1, p2)

        if name:
            line.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": line.Name,
                "objectLabel": line.Label,
                "objectType": "Line",
                "startPoint": _format_point(p1),
                "endPoint": _format_point(p2),
                "message": f"Created Line '{line.Label}' from {_format_point(p1)} to {_format_point(p2)}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_circle(center, radius, name=None):
    """
    Create a circle.

    Args:
        center: Center point as dict/list/Vector
        radius: Radius of the circle
        name: Optional name for the circle

    Returns:
        dict with success status, circle info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        c = _parse_point(center)
        r = float(radius)

        if r <= 0:
            return {"success": False, "error": "Radius must be positive", "data": None}

        circle = Draft.makeCircle(r, c)

        if name:
            circle.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": circle.Name,
                "objectLabel": circle.Label,
                "objectType": "Circle",
                "center": _format_point(c),
                "radius": r,
                "message": f"Created Circle '{circle.Label}' at {_format_point(c)} with {r}mm radius",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_arc(center, radius, start_angle, end_angle, name=None):
    """
    Create a circular arc.

    Args:
        center: Center point as dict/list/Vector
        radius: Radius of the arc
        start_angle: Start angle in degrees
        end_angle: End angle in degrees
        name: Optional name for the arc

    Returns:
        dict with success status, arc info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        c = _parse_point(center)
        r = float(radius)
        start = float(start_angle)
        end = float(end_angle)

        if r <= 0:
            return {"success": False, "error": "Radius must be positive", "data": None}

        arc = Draft.makeCircle(r, c, start_angle=start, end_angle=end)

        if name:
            arc.Label = name

        doc.recompute()

        arc_length = abs(end - start) * math.pi * r / 180.0

        return {
            "success": True,
            "data": {
                "objectName": arc.Name,
                "objectLabel": arc.Label,
                "objectType": "Arc",
                "center": _format_point(c),
                "radius": r,
                "startAngle": start,
                "endAngle": end,
                "arcLength": round(arc_length, 2),
                "message": f"Created Arc '{arc.Label}' from {start}deg to {end}deg",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_ellipse(center, radius1, radius2, name=None):
    """
    Create an ellipse.

    Args:
        center: Center point as dict/list/Vector
        radius1: Major radius (semi-major axis)
        radius2: Minor radius (semi-minor axis)
        name: Optional name for the ellipse

    Returns:
        dict with success status, ellipse info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        c = _parse_point(center)
        r1 = float(radius1)
        r2 = float(radius2)

        if r1 <= 0 or r2 <= 0:
            return {"success": False, "error": "Radii must be positive", "data": None}

        ellipse = Draft.makeEllipse(r1, r2, c)

        if name:
            ellipse.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": ellipse.Name,
                "objectLabel": ellipse.Label,
                "objectType": "Ellipse",
                "center": _format_point(c),
                "majorRadius": r1,
                "minorRadius": r2,
                "message": f"Created Ellipse '{ellipse.Label}' at {_format_point(c)} with radii {r1}mm x {r2}mm",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_rectangle(width, height, position=None, name=None):
    """
    Create a rectangle.

    Args:
        width: Width of the rectangle
        height: Height of the rectangle
        position: Position as dict/list/Vector (optional)
        name: Optional name for the rectangle

    Returns:
        dict with success status, rectangle info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        w = float(width)
        h = float(height)

        if w <= 0 or h <= 0:
            return {
                "success": False,
                "error": "Width and height must be positive",
                "data": None,
            }

        pos = _parse_point(position) if position else App.Vector(0, 0, 0)
        rectangle = Draft.makeRectangle(w, h, pos)

        if name:
            rectangle.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": rectangle.Name,
                "objectLabel": rectangle.Label,
                "objectType": "Rectangle",
                "width": w,
                "height": h,
                "position": _format_point(pos),
                "perimeter": 2 * (w + h),
                "area": w * h,
                "message": f"Created Rectangle '{rectangle.Label}' {w}mm x {h}mm at {_format_point(pos)}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_polygon(sides, radius, center=None, name=None):
    """
    Create a regular polygon.

    Args:
        sides: Number of sides (3-12)
        radius: Radius of the circumscribed circle
        center: Center point as dict/list/Vector (optional)
        name: Optional name for the polygon

    Returns:
        dict with success status, polygon info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        n = int(sides)
        r = float(radius)

        if n < 3 or n > 12:
            return {
                "success": False,
                "error": "Number of sides must be between 3 and 12",
                "data": None,
            }

        if r <= 0:
            return {"success": False, "error": "Radius must be positive", "data": None}

        c = _parse_point(center) if center else App.Vector(0, 0, 0)
        polygon = Draft.makePolygon(n, r, c)

        if name:
            polygon.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": polygon.Name,
                "objectLabel": polygon.Label,
                "objectType": "Polygon",
                "sides": n,
                "radius": r,
                "center": _format_point(c),
                "message": f"Created {n}-sided Polygon '{polygon.Label}' with {r}mm radius at {_format_point(c)}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_bspline(points, name=None):
    """
    Create a B-spline curve through specified points.

    Args:
        points: List of points as dicts/lists/Vectors
        name: Optional name for the bspline

    Returns:
        dict with success status, bspline info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        pts = _parse_points_list(points)

        if len(pts) < 2:
            return {
                "success": False,
                "error": "At least 2 points are required",
                "data": None,
            }

        bspline = Draft.makeBSpline(pts)

        if name:
            bspline.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": bspline.Name,
                "objectLabel": bspline.Label,
                "objectType": "BSpline",
                "pointCount": len(pts),
                "points": [_format_point(p) for p in pts],
                "message": f"Created BSpline '{bspline.Label}' through {len(pts)} points",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_bezier(points, name=None):
    """
    Create a Bezier curve through specified control points.

    Args:
        points: List of points as dicts/lists/Vectors
        name: Optional name for the bezier

    Returns:
        dict with success status, bezier info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        pts = _parse_points_list(points)

        if len(pts) < 2:
            return {
                "success": False,
                "error": "At least 2 points are required",
                "data": None,
            }

        bezier = Draft.makeBezier(pts)

        if name:
            bezier.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": bezier.Name,
                "objectLabel": bezier.Label,
                "objectType": "Bezier",
                "pointCount": len(pts),
                "points": [_format_point(p) for p in pts],
                "message": f"Created Bezier '{bezier.Label}' with {len(pts)} control points",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_wire(points, name=None):
    """
    Create a polyline/wire through specified points.

    Args:
        points: List of points as dicts/lists/Vectors
        name: Optional name for the wire

    Returns:
        dict with success status, wire info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        pts = _parse_points_list(points)

        if len(pts) < 2:
            return {
                "success": False,
                "error": "At least 2 points are required",
                "data": None,
            }

        wire = Draft.makeWire(pts)

        if name:
            wire.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": wire.Name,
                "objectLabel": wire.Label,
                "objectType": "Wire",
                "pointCount": len(pts),
                "points": [_format_point(p) for p in pts],
                "closed": wire.Closed if hasattr(wire, "Closed") else False,
                "message": f"Created Wire '{wire.Label}' with {len(pts)} points",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_linear_dimension(point1, point2, offset=None, name=None):
    """
    Create a linear dimension between two points.

    Args:
        point1: First point as dict/list/Vector
        point2: Second point as dict/list/Vector
        offset: Offset distance for multi-line dimensions (optional)
        name: Optional name for the dimension

    Returns:
        dict with success status, dimension info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        p1 = _parse_point(point1)
        p2 = _parse_point(point2)

        dim = Draft.makeLinearDimension(p1, p2)

        if offset is not None:
            off = float(offset)
            if hasattr(dim, "Offset"):
                dim.Offset = off

        if name:
            dim.Label = name

        doc.recompute()

        distance = p1.distanceToPoint(p2)

        return {
            "success": True,
            "data": {
                "objectName": dim.Name,
                "objectLabel": dim.Label,
                "objectType": "LinearDimension",
                "startPoint": _format_point(p1),
                "endPoint": _format_point(p2),
                "offset": offset,
                "measurement": round(distance, 2),
                "unit": "mm",
                "message": f"Created LinearDimension '{dim.Label}': {round(distance, 2)}mm",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_radial_dimension(circle, name=None):
    """
    Create a radial dimension (radius) for a circle or arc.

    Args:
        circle: Name of the circle/arc object or dict with center and radius
        name: Optional name for the dimension

    Returns:
        dict with success status, dimension info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(circle, dict):
            center = _parse_point(circle.get("center"))
            radius = float(circle.get("radius"))
            dim = Draft.makeRadialDimension(center, radius)
        else:
            obj = doc.getObject(circle)
            if obj is None:
                return {
                    "success": False,
                    "error": f"Object '{circle}' not found",
                    "data": None,
                }

            if hasattr(obj, "Radius"):
                radius = obj.Radius
            elif hasattr(obj, "Shape") and obj.Shape.Radius:
                radius = obj.Shape.Radius
            else:
                return {
                    "success": False,
                    "error": "Object does not have a radius",
                    "data": None,
                }

            center = (
                obj.Shape.Center
                if hasattr(obj.Shape, "Center")
                else App.Vector(0, 0, 0)
            )
            dim = Draft.makeRadialDimension(center, radius)

        if name:
            dim.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": dim.Name,
                "objectLabel": dim.Label,
                "objectType": "RadialDimension",
                "measurement": round(radius, 2),
                "unit": "mm",
                "message": f"Created RadialDimension '{dim.Label}': {round(radius, 2)}mm radius",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_angular_dimension(line1, line2, name=None):
    """
    Create an angular dimension between two lines.

    Args:
        line1: Name of first line object or dict with point data
        line2: Name of second line object or dict with point data
        name: Optional name for the dimension

    Returns:
        dict with success status, dimension info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(line1, dict) and isinstance(line2, dict):
            p1 = _parse_point(line1)
            p2 = _parse_point(line2)
            dim = Draft.makeAngularDimension(p1, p2, p1.add(p2).multiply(0.5))
        else:
            obj1 = doc.getObject(line1) if isinstance(line1, str) else None
            obj2 = doc.getObject(line2) if isinstance(line2, str) else None

            if obj1 is None or obj2 is None:
                return {
                    "success": False,
                    "error": "One or both line objects not found",
                    "data": None,
                }

            if hasattr(obj1.Shape, "CenterOfMass") and hasattr(
                obj2.Shape, "CenterOfMass"
            ):
                center = obj1.Shape.CenterOfMass.add(obj2.Shape.CenterOfMass).multiply(
                    0.5
                )
            else:
                center = App.Vector(0, 0, 0)

            dim = Draft.makeAngularDimension(
                obj1.Shape.CenterOfMass
                if hasattr(obj1.Shape, "CenterOfMass")
                else App.Vector(0, 0, 0),
                obj2.Shape.CenterOfMass
                if hasattr(obj2.Shape, "CenterOfMass")
                else App.Vector(0, 0, 0),
                center,
            )

        if name:
            dim.Label = name

        doc.recompute()

        angle = 0.0
        if hasattr(dim, "Angle"):
            angle = dim.Angle

        angle_deg = round(math.degrees(angle), 2)
        angle_str = f"{angle_deg}°" if not str(angle_deg).endswith("°") else angle_deg

        return {
            "success": True,
            "data": {
                "objectName": dim.Name,
                "objectLabel": dim.Label,
                "objectType": "AngularDimension",
                "measurement": angle_deg,
                "unit": "deg",
                "message": f"Created AngularDimension '{dim.Label}': {angle_str}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_ordinate_dimension(point, direction=None, origin=None, name=None):
    """
    Create an ordinate dimension (X or Y ordinate from a baseline).

    Args:
        point: Point as dict/list/Vector for the dimension endpoint
        direction: Direction as dict/list/Vector (optional, 0=X, 1=Y)
        origin: Origin point as dict/list/Vector (optional)
        name: Optional name for the dimension

    Returns:
        dict with success status, dimension info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        p = _parse_point(point)
        dir_val = int(direction) if direction is not None else 0
        orig = _parse_point(origin) if origin else App.Vector(0, 0, 0)

        dim = Draft.makeOrdinateDimension(dir_val, p, orig)

        if name:
            dim.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": dim.Name,
                "objectLabel": dim.Label,
                "objectType": "OrdinateDimension",
                "direction": dir_val,
                "origin": _format_point(orig),
                "point": _format_point(p),
                "message": f"Created OrdinateDimension '{dim.Label}' at {_format_point(p)}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_text(text, position, name=None):
    """
    Create a text annotation.

    Args:
        text: Text string to display
        position: Position as dict/list/Vector
        name: Optional name for the text

    Returns:
        dict with success status, text info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        pos = _parse_point(position)

        text_obj = Draft.makeText(text, pos)

        if name:
            text_obj.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": text_obj.Name,
                "objectLabel": text_obj.Label,
                "objectType": "Text",
                "text": text,
                "position": _format_point(pos),
                "message": f"Created Text '{text_obj.Label}': '{text}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_dimension_text(dimension, text):
    """
    Add custom text to an existing dimension.

    Args:
        dimension: Name of the dimension object
        text: Custom text to add

    Returns:
        dict with success status, updated dimension info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        dim_obj = doc.getObject(dimension)
        if dim_obj is None:
            return {
                "success": False,
                "error": f"Dimension '{dimension}' not found",
                "data": None,
            }

        if not hasattr(dim_obj, "CustomText"):
            return {
                "success": False,
                "error": "Object does not support custom text",
                "data": None,
            }

        old_text = getattr(dim_obj, "CustomText", "")

        dim_obj.CustomText = text
        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": dim_obj.Name,
                "objectLabel": dim_obj.Label,
                "oldText": old_text,
                "newText": text,
                "message": f"Updated dimension text to '{text}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_move(objects, vector):
    """
    Move one or more objects by a vector.

    Args:
        objects: Name or list of names of objects to move
        vector: Displacement vector as dict/list/Vector {"x": 10, "y": 0, "z": 0} or [dx, dy, dz]

    Returns:
        dict with success status, movement info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(objects, str):
            object_names = [objects]
        elif isinstance(objects, list):
            object_names = objects
        else:
            return {"success": False, "error": "Invalid objects format", "data": None}

        v = _parse_point(vector)

        moved_objects = []
        original_positions = {}
        new_positions = {}

        for obj_name in object_names:
            obj = doc.getObject(obj_name)
            if obj is None:
                continue

            if hasattr(obj, "Placement"):
                old_pos = obj.Placement.Base
                original_positions[obj_name] = _format_point(old_pos)

                new_pos = old_pos.add(v)
                new_placement = App.Placement(new_pos, obj.Placement.Rotation)
                obj.Placement = new_placement

                new_positions[obj_name] = _format_point(new_pos)
                moved_objects.append(obj_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectNames": moved_objects,
                "originalPositions": original_positions,
                "newPositions": new_positions,
                "displacement": _format_point(v),
                "message": f"Moved {len(moved_objects)} object(s) by {_format_point(v)}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_rotate(objects, angle, center=None):
    """
    Rotate one or more objects around a center point.

    Args:
        objects: Name or list of names of objects to rotate
        angle: Rotation angle in degrees
        center: Center of rotation as dict/list/Vector (optional, defaults to origin)

    Returns:
        dict with success status, rotation info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(objects, str):
            object_names = [objects]
        elif isinstance(objects, list):
            object_names = objects
        else:
            return {"success": False, "error": "Invalid objects format", "data": None}

        angle_rad = math.radians(float(angle))
        c = _parse_point(center) if center else App.Vector(0, 0, 0)

        rotation = App.Rotation(App.Vector(0, 0, 1), angle_rad)

        rotated_objects = []

        for obj_name in object_names:
            obj = doc.getObject(obj_name)
            if obj is None:
                continue

            if hasattr(obj, "Placement"):
                old_placement = obj.Placement

                translated = old_placement.Base.sub(c)
                rotated = rotation.multVec(translated)
                new_base = c.add(rotated)

                new_placement = App.Placement(
                    new_base, rotation.multiply(old_placement.Rotation)
                )
                obj.Placement = new_placement
                rotated_objects.append(obj_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectNames": rotated_objects,
                "angle": f"{angle}deg",
                "center": _format_point(c),
                "message": f"Rotated {len(rotated_objects)} object(s) by {angle}deg around {_format_point(c)}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_scale(objects, factor, center=None):
    """
    Scale one or more objects uniformly.

    Args:
        objects: Name or list of names of objects to scale
        factor: Scale factor (e.g., 2.0 for doubling size)
        center: Center of scaling as dict/list/Vector (optional, defaults to origin)

    Returns:
        dict with success status, scaling info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(objects, str):
            object_names = [objects]
        elif isinstance(objects, list):
            object_names = objects
        else:
            return {"success": False, "error": "Invalid objects format", "data": None}

        f = float(factor)
        c = _parse_point(center) if center else App.Vector(0, 0, 0)

        scaled_objects = []

        for obj_name in object_names:
            obj = doc.getObject(obj_name)
            if obj is None:
                continue

            try:
                Draft.scale(obj, App.Vector(f, f, f), center=c, copy=False)
                scaled_objects.append(obj_name)
            except Exception:
                pass

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectNames": scaled_objects,
                "scaleFactor": f,
                "center": _format_point(c),
                "message": f"Scaled {len(scaled_objects)} object(s) by factor {f}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_offset(object, distance):
    """
    Create an offset copy of an object.

    Args:
        object: Name of the object to offset
        distance: Offset distance

    Returns:
        dict with success status, offset info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(object)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object}' not found",
                "data": None,
            }

        d = float(distance)

        offset_obj = Draft.offset(obj, d, copy=True)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "originalName": obj.Name,
                "originalLabel": obj.Label,
                "newObjectName": offset_obj.Name if offset_obj else None,
                "newObjectLabel": offset_obj.Label if offset_obj else None,
                "distance": d,
                "message": f"Created offset of '{obj.Label}' by {d}mm",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_join(objects):
    """
    Join multiple wire/edge objects into a single wire.

    Args:
        objects: List of object names to join

    Returns:
        dict with success status, joined object info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not isinstance(objects, list) or len(objects) < 2:
            return {
                "success": False,
                "error": "At least 2 objects are required to join",
                "data": None,
            }

        obj_list = []
        for obj_name in objects:
            obj = doc.getObject(obj_name)
            if obj is None:
                return {
                    "success": False,
                    "error": f"Object '{obj_name}' not found",
                    "data": None,
                }
            obj_list.append(obj)

        joined = Draft.join(obj_list)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "originalNames": objects,
                "newObjectName": joined.Name if joined else None,
                "newObjectLabel": joined.Label if joined else None,
                "objectType": joined.TypeId if joined else "Unknown",
                "message": f"Joined {len(objects)} objects into '{joined.Label if joined else 'unknown'}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_split(object, point):
    """
    Split an object at a specified point.

    Args:
        object: Name of the object to split
        point: Point of division as dict/list/Vector

    Returns:
        dict with success status, split objects info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(object)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object}' not found",
                "data": None,
            }

        p = _parse_point(point)

        result = Draft.split(obj, p)

        doc.recompute()

        if isinstance(result, list):
            new_names = [o.Name for o in result if o]
        else:
            new_names = [result.Name] if result else []

        return {
            "success": True,
            "data": {
                "originalName": obj.Name,
                "originalLabel": obj.Label,
                "newObjectNames": new_names,
                "splitPoint": _format_point(p),
                "message": f"Split '{obj.Label}' into {len(new_names)} object(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_draft_objects():
    """
    List all Draft objects in the current document.

    Returns:
        dict with success status, list of draft objects, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        draft_objects = []
        for obj in doc.Objects:
            if _is_draft_object(obj):
                obj_info = {
                    "name": obj.Name,
                    "label": obj.Label,
                    "type": obj.TypeId,
                    "visible": obj.ViewObject.Visibility
                    if hasattr(obj, "ViewObject")
                    else True,
                }

                if hasattr(obj, "Placement"):
                    pos = obj.Placement.Base
                    obj_info["position"] = _format_point(pos)

                if hasattr(obj, "Radius"):
                    obj_info["radius"] = obj.Radius
                if hasattr(obj, "Length"):
                    obj_info["length"] = obj.Length
                if hasattr(obj, "Width"):
                    obj_info["width"] = obj.Width
                if hasattr(obj, "Height"):
                    obj_info["height"] = obj.Height

                draft_objects.append(obj_info)

        return {
            "success": True,
            "data": {
                "objects": draft_objects,
                "count": len(draft_objects),
                "message": f"Found {len(draft_objects)} Draft object(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_draft_properties(object_name):
    """
    Get properties of a Draft object.

    Args:
        object_name: Name of the Draft object

    Returns:
        dict with success status, object properties, and message
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

        properties = {
            "name": obj.Name,
            "label": obj.Label,
            "type": obj.TypeId,
            "module": "Draft",
        }

        if hasattr(obj, "Placement"):
            placement = obj.Placement
            properties["position"] = _format_point(placement.Base)
            if hasattr(placement.Rotation, "Axis"):
                axis = placement.Rotation.Axis
                angle = placement.Rotation.Angle
                properties["rotation"] = {
                    "axis": _format_point(axis),
                    "angle": f"{math.degrees(angle):.2f}deg",
                }

        if hasattr(obj, "Shape") and obj.Shape:
            bb = obj.Shape.BoundBox
            properties["boundingBox"] = {
                "xMin": bb.XMin,
                "xMax": bb.XMax,
                "yMin": bb.YMin,
                "yMax": bb.YMax,
                "zMin": bb.ZMin,
                "zMax": bb.ZMax,
            }

        if hasattr(obj, "Radius"):
            properties["radius"] = obj.Radius
        if hasattr(obj, "Length"):
            properties["length"] = obj.Length
        if hasattr(obj, "Width"):
            properties["width"] = obj.Width
        if hasattr(obj, "Height"):
            properties["height"] = obj.Height
        if hasattr(obj, "Perimeter"):
            properties["perimeter"] = obj.Perimeter
        if hasattr(obj, "Area"):
            properties["area"] = obj.Area

        draft_specific_props = []
        for prop_name in obj.PropertiesList:
            if prop_name.startswith("_"):
                continue
            if prop_name in ["Placement", "Label", "TypeId", "Shape", "ViewObject"]:
                continue
            try:
                value = getattr(obj, prop_name)
                if not callable(value):
                    draft_specific_props.append(
                        {
                            "name": prop_name,
                            "value": str(value)[:100],
                        }
                    )
            except Exception:
                pass

        properties["draftProperties"] = draft_specific_props

        return {
            "success": True,
            "data": {
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "properties": properties,
                "message": f"Retrieved properties for '{obj.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_create_point",
    "handle_create_line",
    "handle_create_circle",
    "handle_create_arc",
    "handle_create_ellipse",
    "handle_create_rectangle",
    "handle_create_polygon",
    "handle_create_bspline",
    "handle_create_bezier",
    "handle_create_wire",
    "handle_create_linear_dimension",
    "handle_create_radial_dimension",
    "handle_create_angular_dimension",
    "handle_create_ordinate_dimension",
    "handle_create_text",
    "handle_create_dimension_text",
    "handle_move",
    "handle_rotate",
    "handle_scale",
    "handle_offset",
    "handle_join",
    "handle_split",
    "handle_list_draft_objects",
    "handle_get_draft_properties",
]
