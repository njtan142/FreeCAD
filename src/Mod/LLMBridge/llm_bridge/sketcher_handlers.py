# SPDX-License-Identifier: LGPL-2.1-or-later
# Sketcher Constraint Tools Handlers
#
# Provides handlers for sketcher constraint operations:
# - Create sketch on plane/face
# - Add geometry (lines, circles, arcs, rectangles, points)
# - Add geometric constraints (horizontal, vertical, parallel, perpendicular, tangent, coincident)
# - Add dimensional constraints (distance, angle, radius, diameter)
# - Set constraint values
# - List sketch constraints
# - Delete constraints
# - Get sketch geometry
# Each handler returns JSON-serializable structures.

import math

import FreeCAD as App


def handle_create_sketch(support=None, map_mode='FlatFace', name=None):
    """
    Create a new sketch on a plane or face.

    Args:
        support: Support specification for sketch placement (e.g., "Body.Face4" or tuple)
        map_mode: Map mode for sketch placement (default: "FlatFace")
        name: Optional name for the sketch

    Returns:
        dict with success status, sketch info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        import Part
        import Sketcher

        # Parse support if provided
        sketch_support = None
        if support:
            # Support can be a string like "Body.Face4" or a tuple
            if isinstance(support, str):
                # Parse "ObjectName.FaceName" format
                if '.' in support:
                    obj_name, sub_name = support.split('.', 1)
                    obj = doc.getObject(obj_name)
                    if obj:
                        sketch_support = (obj, [sub_name])
                else:
                    # Just object name
                    obj = doc.getObject(support)
                    if obj:
                        sketch_support = (obj, [])

        # Create the sketch
        if name:
            sketch = doc.addObject('Sketcher::SketchObject', name)
        else:
            sketch = doc.addObject('Sketcher::SketchObject', 'Sketch')

        # Set support if provided
        if sketch_support:
            sketch.Support = sketch_support

        # Set map mode with validation
        map_mode_map = {
            'Deactivated': 0,
            'FlatFace': 1,
            'Plane': 2,
            'ThreePoints': 3,
            'ThreePlanes': 4,
            'Curved': 5,
            'Axis': 6,
            'Concentric': 7,
            'RefPlane': 8
        }
        if map_mode not in map_mode_map:
            return {
                "success": False,
                "error": f"Invalid map mode: '{map_mode}'. Valid options: {', '.join(map_mode_map.keys())}",
                "data": None
            }
        sketch.MapMode = map_mode_map[map_mode]

        doc.recompute()

        return {
            "success": True,
            "data": {
                "sketchName": sketch.Name,
                "sketchLabel": sketch.Label,
                "documentName": doc.Name,
                "support": str(sketch.Support) if sketch.Support else "(none)",
                "mapMode": map_mode,
                "message": f"Created sketch '{sketch.Label}' on {map_mode} plane"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_add_geometry(sketch_name, geometry_type, params):
    """
    Add geometry elements to a sketch.

    Args:
        sketch_name: Name of the sketch to add geometry to
        geometry_type: Type of geometry - "line", "circle", "arc", "rectangle", "point"
        params: Geometry parameters based on type

    Returns:
        dict with success status, sketch info, and geometry details
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        sketch = doc.getObject(sketch_name)
        if sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{sketch_name}' not found",
                "data": None
            }

        if not hasattr(sketch, 'addGeometry'):
            return {
                "success": False,
                "error": f"Object '{sketch_name}' is not a sketch",
                "data": None
            }

        import Part
        from FreeCAD import Vector

        geometry_added = []
        geometry_type_map = {
            'line': 'LineSegment',
            'circle': 'Circle',
            'arc': 'ArcOfCircle',
            'rectangle': 'Rectangle',
            'point': 'Point'
        }

        if geometry_type == 'line':
            # Line: { start: {x, y}, end: {x, y} }
            start = params.get('start', {})
            end = params.get('end', {})
            line = Part.LineSegment()
            line.StartPoint = Vector(start.get('x', 0), start.get('y', 0), 0)
            line.EndPoint = Vector(end.get('x', 0), end.get('y', 0), 0)
            idx = sketch.addGeometry(line)
            geometry_added.append({
                "index": idx,
                "type": "LineSegment",
                "startPoint": {"x": start.get('x', 0), "y": start.get('y', 0)},
                "endPoint": {"x": end.get('x', 0), "y": end.get('y', 0)}
            })

        elif geometry_type == 'circle':
            # Circle: { center: {x, y}, radius: number }
            center = params.get('center', {})
            radius = params.get('radius', 10)
            circle = Part.Circle()
            circle.Center = Vector(center.get('x', 0), center.get('y', 0), 0)
            circle.Radius = radius
            idx = sketch.addGeometry(circle)
            geometry_added.append({
                "index": idx,
                "type": "Circle",
                "centerPoint": {"x": center.get('x', 0), "y": center.get('y', 0)},
                "radius": radius
            })

        elif geometry_type == 'arc':
            # Arc: { center: {x, y}, radius: number, startAngle: number, endAngle: number }
            center = params.get('center', {})
            radius = params.get('radius', 10)
            start_angle = math.radians(params.get('startAngle', 0))
            end_angle = math.radians(params.get('endAngle', 90))
            arc = Part.Circle()
            arc.Center = Vector(center.get('x', 0), center.get('y', 0), 0)
            arc.Radius = radius
            idx = sketch.addGeometry(arc, start_angle, end_angle)
            geometry_added.append({
                "index": idx,
                "type": "ArcOfCircle",
                "centerPoint": {"x": center.get('x', 0), "y": center.get('y', 0)},
                "radius": radius,
                "startAngle": params.get('startAngle', 0),
                "endAngle": params.get('endAngle', 90)
            })

        elif geometry_type == 'rectangle':
            # Rectangle: { corner1: {x, y}, corner2: {x, y} }
            corner1 = params.get('corner1', {})
            corner2 = params.get('corner2', {})
            x1, y1 = corner1.get('x', 0), corner1.get('y', 0)
            x2, y2 = corner2.get('x', 50), corner2.get('y', 30)

            # Create 4 lines for rectangle
            lines = [
                Part.LineSegment(Vector(x1, y1, 0), Vector(x2, y1, 0)),  # Bottom
                Part.LineSegment(Vector(x2, y1, 0), Vector(x2, y2, 0)),  # Right
                Part.LineSegment(Vector(x2, y2, 0), Vector(x1, y2, 0)),  # Top
                Part.LineSegment(Vector(x1, y2, 0), Vector(x1, y1, 0))   # Left
            ]
            indices = sketch.addGeometry(lines)

            for i, line in enumerate(lines):
                geometry_added.append({
                    "index": indices[i],
                    "type": "LineSegment",
                    "startPoint": {"x": line.StartPoint.x, "y": line.StartPoint.y},
                    "endPoint": {"x": line.EndPoint.x, "y": line.EndPoint.y}
                })

            # Auto-add coincident constraints at rectangle corners to close the shape
            # Corner 1: end of line 0 = start of line 1
            sketch.addConstraint(Sketcher.Constraint.Coincident, indices[0], indices[1], 2, 1)
            # Corner 2: end of line 1 = start of line 2
            sketch.addConstraint(Sketcher.Constraint.Coincident, indices[1], indices[2], 2, 1)
            # Corner 3: end of line 2 = start of line 3
            sketch.addConstraint(Sketcher.Constraint.Coincident, indices[2], indices[3], 2, 1)
            # Corner 4: end of line 3 = start of line 0 (close the rectangle)
            sketch.addConstraint(Sketcher.Constraint.Coincident, indices[3], indices[0], 2, 1)

        elif geometry_type == 'point':
            # Point: { x: number, y: number }
            x = params.get('x', 0)
            y = params.get('y', 0)
            point = Part.Point()
            point.Location = Vector(x, y, 0)
            idx = sketch.addGeometry(point)
            geometry_added.append({
                "index": idx,
                "type": "Point",
                "location": {"x": x, "y": y}
            })

        doc.recompute()

        return {
            "success": True,
            "data": {
                "sketchName": sketch.Name,
                "sketchLabel": sketch.Label,
                "geometryAdded": True,
                "geometryCount": len(geometry_added),
                "geometry": geometry_added,
                "message": f"Added {len(geometry_added)} geometry element(s) to sketch"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_add_geometric_constraint(sketch_name, constraint_type, geo_index1,
                                    point_pos1=None, geo_index2=None, point_pos2=None):
    """
    Add geometric constraints to sketch geometry.

    Args:
        sketch_name: Name of the sketch
        constraint_type: Type of geometric constraint
        geo_index1: Index of first geometry element
        point_pos1: Point position on first element (1=start, 2=end, 3=center)
        geo_index2: Index of second geometry element
        point_pos2: Point position on second element

    Returns:
        dict with success status, sketch info, and constraint details
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        sketch = doc.getObject(sketch_name)
        if sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{sketch_name}' not found",
                "data": None
            }

        import Sketcher

        constraint_type_map = {
            'coincident': Sketcher.Constraint.Coincident,
            'horizontal': Sketcher.Constraint.Horizontal,
            'vertical': Sketcher.Constraint.Vertical,
            'parallel': Sketcher.Constraint.Parallel,
            'perpendicular': Sketcher.Constraint.Perpendicular,
            'tangent': Sketcher.Constraint.Tangent,
            'equal': Sketcher.Constraint.Equal,
            'symmetric': Sketcher.Constraint.Symmetric,
            'concentric': Sketcher.Constraint.Coincident,  # Concentric uses Coincident for circle centers
            'midpoint': Sketcher.Constraint.Midpoint
        }

        if constraint_type not in constraint_type_map:
            return {
                "success": False,
                "error": f"Unknown constraint type: {constraint_type}. Supported types: {', '.join(constraint_type_map.keys())}",
                "data": None
            }

        constraint_enum = constraint_type_map[constraint_type]

        # Add constraint based on type
        if constraint_type in ['horizontal', 'vertical']:
            # Single geometry constraint
            idx = sketch.addConstraint(constraint_enum, geo_index1, -1, point_pos1 or -1)
        elif constraint_type in ['parallel', 'perpendicular', 'tangent', 'equal', 'symmetric']:
            # Two geometry constraint
            if geo_index2 is None:
                return {
                    "success": False,
                    "error": f"Constraint '{constraint_type}' requires geo_index2",
                    "data": None
                }
            idx = sketch.addConstraint(constraint_enum, geo_index1, geo_index2,
                                       point_pos1 or -1, point_pos2 or -1)
        elif constraint_type in ['coincident', 'concentric', 'midpoint']:
            # Coincident/concentric/midpoint requires two points
            if geo_index2 is None:
                return {
                    "success": False,
                    "error": f"{constraint_type.capitalize()} constraint requires geo_index2",
                    "data": None
                }
            idx = sketch.addConstraint(constraint_enum, geo_index1, geo_index2,
                                       point_pos1 or -1, point_pos2 or -1)
        else:
            return {
                "success": False,
                "error": f"Unsupported constraint type: {constraint_type}",
                "data": None
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "sketchName": sketch.Name,
                "sketchLabel": sketch.Label,
                "constraintAdded": True,
                "constraintCount": len(sketch.Constraints),
                "constraintIndex": idx,
                "constraintType": constraint_type,
                "message": f"Added {constraint_type} constraint to sketch"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_add_dimensional_constraint(sketch_name, constraint_type, value,
                                      geo_index1, point_pos1=None,
                                      geo_index2=None, point_pos2=None):
    """
    Add dimensional constraints to sketch geometry.

    Args:
        sketch_name: Name of the sketch
        constraint_type: Type of dimensional constraint
        value: Constraint value (number or string with units)
        geo_index1: Index of first geometry element
        point_pos1: Point position on first element
        geo_index2: Index of second geometry element
        point_pos2: Point position on second element

    Returns:
        dict with success status, sketch info, and constraint details
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        sketch = doc.getObject(sketch_name)
        if sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{sketch_name}' not found",
                "data": None
            }

        import Sketcher

        # Parse value with units
        parsed_value = _parse_value_with_unit(value)

        constraint_type_map = {
            'distance_x': Sketcher.Constraint.DistanceX,
            'distance_y': Sketcher.Constraint.DistanceY,
            'distance': Sketcher.Constraint.Distance,
            'angle': Sketcher.Constraint.Angle,
            'radius': Sketcher.Constraint.Radius,
            'diameter': Sketcher.Constraint.Diameter
        }

        if constraint_type not in constraint_type_map:
            return {
                "success": False,
                "error": f"Unknown constraint type: {constraint_type}",
                "data": None
            }

        constraint_enum = constraint_type_map[constraint_type]

        # Determine point positions based on constraint type
        if constraint_type in ['distance_x', 'distance_y']:
            # Horizontal/vertical distance - typically on a point
            idx = sketch.addConstraint(constraint_enum, geo_index1, -1,
                                       point_pos1 or -1, parsed_value)
        elif constraint_type in ['radius', 'diameter']:
            # Radius/diameter - on a circle/arc
            idx = sketch.addConstraint(constraint_enum, geo_index1, -1,
                                       point_pos1 or -1, parsed_value)
        elif constraint_type == 'distance':
            # Distance can be between two points or length of a line
            if geo_index2 is not None:
                idx = sketch.addConstraint(constraint_enum, geo_index1, geo_index2,
                                           point_pos1 or -1, point_pos2 or -1, parsed_value)
            else:
                idx = sketch.addConstraint(constraint_enum, geo_index1, -1,
                                           point_pos1 or -1, parsed_value)
        elif constraint_type == 'angle':
            # Angle between two lines
            if geo_index2 is None:
                return {
                    "success": False,
                    "error": "Angle constraint requires geo_index2",
                    "data": None
                }
            idx = sketch.addConstraint(constraint_enum, geo_index1, geo_index2,
                                       point_pos1 or -1, point_pos2 or -1, parsed_value)
        else:
            return {
                "success": False,
                "error": f"Unsupported constraint type: {constraint_type}",
                "data": None
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "sketchName": sketch.Name,
                "sketchLabel": sketch.Label,
                "constraintAdded": True,
                "constraintCount": len(sketch.Constraints),
                "constraintIndex": idx,
                "constraintType": constraint_type,
                "constraintValue": parsed_value,
                "message": f"Added {constraint_type} constraint ({parsed_value:.2f}) to sketch"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_set_constraint_value(sketch_name, constraint_index, value):
    """
    Modify the value of an existing dimensional constraint.

    Args:
        sketch_name: Name of the sketch
        constraint_index: Index of the constraint to modify
        value: New value (number or string with units)

    Returns:
        dict with success status, sketch info, and before/after values
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        sketch = doc.getObject(sketch_name)
        if sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{sketch_name}' not found",
                "data": None
            }

        if constraint_index < 0 or constraint_index >= len(sketch.Constraints):
            return {
                "success": False,
                "error": f"Constraint index {constraint_index} out of range",
                "data": None
            }

        # Get old value
        old_constraint = sketch.Constraints[constraint_index]
        old_value = old_constraint.Value

        # Parse new value
        new_value = _parse_value_with_unit(value)

        # Set new value
        sketch.setDatum(constraint_index, new_value)
        doc.recompute()

        # Get constraint type for display
        constraint_type = _get_constraint_type_name(old_constraint.Type)

        return {
            "success": True,
            "data": {
                "sketchName": sketch.Name,
                "sketchLabel": sketch.Label,
                "constraintIndex": constraint_index,
                "constraintType": constraint_type,
                "oldValue": old_value,
                "newValue": new_value,
                "message": f"Updated constraint {constraint_index} from {old_value:.2f} to {new_value:.2f}"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_list_sketch_constraints(sketch_name):
    """
    List all constraints in a sketch.

    Args:
        sketch_name: Name of the sketch to query

    Returns:
        dict with success status, sketch info, and list of constraints
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        sketch = doc.getObject(sketch_name)
        if sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{sketch_name}' not found",
                "data": None
            }

        constraints = []
        for i, constraint in enumerate(sketch.Constraints):
            constraint_info = {
                "index": i,
                "type": _get_constraint_type_name(constraint.Type),
                "value": constraint.Value if hasattr(constraint, 'Value') else None,
                "geoIndex1": constraint.First if hasattr(constraint, 'First') else None,
                "pointPos1": constraint.FirstPos if hasattr(constraint, 'FirstPos') else None,
                "geoIndex2": constraint.Second if hasattr(constraint, 'Second') else None,
                "pointPos2": constraint.SecondPos if hasattr(constraint, 'SecondPos') else None,
                "name": constraint.Name if hasattr(constraint, 'Name') else None
            }
            constraints.append(constraint_info)

        # Also get geometry for context
        geometry = []
        for i, geom in enumerate(sketch.Geometry):
            geom_info = {
                "index": i,
                "type": geom.TypeId
            }
            if hasattr(geom, 'StartPoint') and geom.StartPoint:
                geom_info["startPoint"] = {"x": geom.StartPoint.x, "y": geom.StartPoint.y}
            if hasattr(geom, 'EndPoint') and geom.EndPoint:
                geom_info["endPoint"] = {"x": geom.EndPoint.x, "y": geom.EndPoint.y}
            if hasattr(geom, 'Center') and geom.Center:
                geom_info["centerPoint"] = {"x": geom.Center.x, "y": geom.Center.y}
            if hasattr(geom, 'Radius'):
                geom_info["radius"] = geom.Radius
            geometry.append(geom_info)

        return {
            "success": True,
            "data": {
                "sketchName": sketch.Name,
                "sketchLabel": sketch.Label,
                "geometryCount": len(geometry),
                "geometry": geometry,
                "constraintCount": len(constraints),
                "constraints": constraints,
                "message": f"Found {len(constraints)} constraint(s) in sketch"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_delete_constraint(sketch_name, constraint_index):
    """
    Remove a constraint from a sketch.

    Args:
        sketch_name: Name of the sketch
        constraint_index: Index of the constraint to remove

    Returns:
        dict with success status, sketch info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        sketch = doc.getObject(sketch_name)
        if sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{sketch_name}' not found",
                "data": None
            }

        if constraint_index < 0 or constraint_index >= len(sketch.Constraints):
            return {
                "success": False,
                "error": f"Constraint index {constraint_index} out of range",
                "data": None
            }

        # Get constraint info before deletion
        old_constraint = sketch.Constraints[constraint_index]
        constraint_type = _get_constraint_type_name(old_constraint.Type)

        # Delete constraint
        sketch.delConstraint(constraint_index)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "sketchName": sketch.Name,
                "sketchLabel": sketch.Label,
                "constraintIndex": constraint_index,
                "constraintType": constraint_type,
                "message": f"Deleted constraint {constraint_index} ({constraint_type}) from sketch"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_get_sketch_geometry(sketch_name):
    """
    Query sketch geometry and constraints.

    Args:
        sketch_name: Name of the sketch to query

    Returns:
        dict with success status, sketch info, geometry, and constraints
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        sketch = doc.getObject(sketch_name)
        if sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{sketch_name}' not found",
                "data": None
            }

        # Get geometry
        geometry = []
        for i, geom in enumerate(sketch.Geometry):
            geom_info = {
                "index": i,
                "type": geom.TypeId
            }
            if hasattr(geom, 'StartPoint') and geom.StartPoint:
                geom_info["startPoint"] = {"x": geom.StartPoint.x, "y": geom.StartPoint.y}
            if hasattr(geom, 'EndPoint') and geom.EndPoint:
                geom_info["endPoint"] = {"x": geom.EndPoint.x, "y": geom.EndPoint.y}
            if hasattr(geom, 'Center') and geom.Center:
                geom_info["centerPoint"] = {"x": geom.Center.x, "y": geom.Center.y}
            if hasattr(geom, 'Radius'):
                geom_info["radius"] = geom.Radius
            geometry.append(geom_info)

        # Get constraints
        constraints = []
        for i, constraint in enumerate(sketch.Constraints):
            constraint_info = {
                "index": i,
                "type": _get_constraint_type_name(constraint.Type),
                "value": constraint.Value if hasattr(constraint, 'Value') else None,
                "geoIndex1": constraint.First if hasattr(constraint, 'First') else None,
                "pointPos1": constraint.FirstPos if hasattr(constraint, 'FirstPos') else None,
                "geoIndex2": constraint.Second if hasattr(constraint, 'Second') else None,
                "pointPos2": constraint.SecondPos if hasattr(constraint, 'SecondPos') else None,
                "name": constraint.Name if hasattr(constraint, 'Name') else None
            }
            constraints.append(constraint_info)

        return {
            "success": True,
            "data": {
                "sketchName": sketch.Name,
                "sketchLabel": sketch.Label,
                "geometryCount": len(geometry),
                "geometry": geometry,
                "constraintCount": len(constraints),
                "constraints": constraints,
                "message": f"Sketch has {len(geometry)} geometry element(s) and {len(constraints)} constraint(s)"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


# ============================================================================
# Helper Functions
# ============================================================================

def _parse_value_with_unit(value):
    """
    Parse a value string that may include units.

    Supported units:
    - Length: mm, cm, m, in, ft (internal unit: mm)
    - Angle: deg, rad, grad (internal unit: radians)

    Args:
        value: Value string like "50", "50mm", "90deg", or numeric

    Returns:
        float: Value in internal units (mm for length, radians for angle)
    """
    if value is None:
        return 0.0

    if isinstance(value, (int, float)):
        return float(value)

    import re
    value_str = str(value).strip().lower()

    # Pattern to extract number and optional unit
    match = re.match(r'^(-?\d+\.?\d*)\s*(mm|cm|m|in|ft|deg|rad|grad)?$', value_str)

    if not match:
        # Try to parse as plain number
        try:
            return float(value_str)
        except ValueError:
            raise ValueError(f"Invalid value format: {value}")

    num_value = float(match.group(1))
    unit = match.group(2) or ''

    # Length units (convert to mm)
    if unit in ['mm', '']:
        return num_value
    elif unit == 'cm':
        return num_value * 10
    elif unit == 'm':
        return num_value * 1000
    elif unit == 'in':
        return num_value * 25.4
    elif unit == 'ft':
        return num_value * 304.8
    # Angle units (convert to radians)
    elif unit == 'deg':
        return math.radians(num_value)
    elif unit == 'rad':
        return num_value
    elif unit == 'grad':
        return math.radians(num_value * 0.9)

    return num_value


def _get_constraint_type_name(constraint_type):
    """
    Get human-readable name for constraint type.

    Args:
        constraint_type: Sketcher constraint type enum

    Returns:
        str: Human-readable constraint type name
    """
    try:
        import Sketcher

        type_map = {
            Sketcher.Constraint.Coincident: 'Coincident',
            Sketcher.Constraint.Horizontal: 'Horizontal',
            Sketcher.Constraint.Vertical: 'Vertical',
            Sketcher.Constraint.Parallel: 'Parallel',
            Sketcher.Constraint.Perpendicular: 'Perpendicular',
            Sketcher.Constraint.Tangent: 'Tangent',
            Sketcher.Constraint.Equal: 'Equal',
            Sketcher.Constraint.Symmetric: 'Symmetric',
            Sketcher.Constraint.DistanceX: 'DistanceX',
            Sketcher.Constraint.DistanceY: 'DistanceY',
            Sketcher.Constraint.Distance: 'Distance',
            Sketcher.Constraint.Radius: 'Radius',
            Sketcher.Constraint.Diameter: 'Diameter',
            Sketcher.Constraint.Angle: 'Angle',
            Sketcher.Constraint.InternalAngle: 'InternalAngle',
            Sketcher.Constraint.PointOnObject: 'PointOnObject',
            Sketcher.Constraint.Midpoint: 'Midpoint',
            Sketcher.Constraint.Lock: 'Lock'
        }
        return type_map.get(constraint_type, str(constraint_type))
    except Exception:
        return str(constraint_type)


# Export all handlers for easy import
__all__ = [
    'handle_create_sketch',
    'handle_add_geometry',
    'handle_add_geometric_constraint',
    'handle_add_dimensional_constraint',
    'handle_set_constraint_value',
    'handle_list_sketch_constraints',
    'handle_delete_constraint',
    'handle_get_sketch_geometry',
]
