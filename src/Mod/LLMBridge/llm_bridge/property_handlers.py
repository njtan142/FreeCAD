# SPDX-License-Identifier: LGPL-2.1-or-later
# Property Handlers for Parametric Feature Editing Tools
#
# Provides handlers for parametric editing:
# - Set object properties
# - Update dimensions
# - Move, rotate, scale objects
# - Manage expressions for parametric relationships
# Each handler returns JSON-serializable structures with before/after values.

import math
import re

import FreeCAD as App


def parse_value_with_unit(value_str):
    """
    Parse a value string that may include units.

    Supported units:
    - Length: mm, cm, m, in, ft
    - Angle: deg, rad, grad

    Args:
        value_str: String like "50", "50mm", "90deg", "1.5m"

    Returns:
        tuple: (value_in_internal_units, unit_type)
               Internal units: mm for length, radians for angle
    """
    if value_str is None:
        return None, None

    value_str = str(value_str).strip().lower()

    # Pattern to extract number and optional unit
    match = re.match(r'^(-?\d+\.?\d*)\s*(mm|cm|m|in|ft|deg|rad|grad)?$', value_str)

    if not match:
        # Try to parse as plain number
        try:
            return float(value_str), 'number'
        except ValueError:
            raise ValueError(f"Invalid value format: {value_str}")

    value = float(match.group(1))
    unit = match.group(2) or ''

    # Length units (convert to mm - FreeCAD internal unit)
    if unit in ['mm', '']:
        return value, 'length'
    elif unit == 'cm':
        return value * 10, 'length'
    elif unit == 'm':
        return value * 1000, 'length'
    elif unit == 'in':
        return value * 25.4, 'length'
    elif unit == 'ft':
        return value * 304.8, 'length'
    # Angle units (convert to radians - FreeCAD internal unit)
    elif unit == 'deg':
        return math.radians(value), 'angle'
    elif unit == 'rad':
        return value, 'angle'
    elif unit == 'grad':
        return math.radians(value * 0.9), 'angle'
    else:
        # Plain number
        return value, 'number'


def format_value(value, unit_type):
    """
    Format a value for display with appropriate units.

    Args:
        value: The internal value (mm for length, radians for angle)
        unit_type: 'length', 'angle', or 'number'

    Returns:
        str: Formatted value string
    """
    if value is None:
        return "None"

    if unit_type == 'length':
        return f"{value:.2f}mm"
    elif unit_type == 'angle':
        return f"{math.degrees(value):.2f}deg"
    else:
        return f"{value:.4f}"


def get_property_unit_type(prop_name):
    """
    Determine the unit type based on property name.

    Args:
        prop_name: Property name like "Length", "Angle", "Radius"

    Returns:
        str: 'length', 'angle', or 'number'
    """
    prop_lower = prop_name.lower()

    angle_keywords = ['angle', 'rotation', 'yaw', 'pitch', 'roll']
    length_keywords = ['length', 'width', 'height', 'radius', 'diameter',
                       'x', 'y', 'z', 'dx', 'dy', 'dz', 'distance', 'offset']

    for keyword in angle_keywords:
        if keyword in prop_lower:
            return 'angle'

    for keyword in length_keywords:
        if keyword in prop_lower:
            return 'length'

    return 'number'


def handle_set_object_property(object_name: str, property_name: str, value) -> dict:
    """
    Set a single property on an object.

    Args:
        object_name: Name of the object to modify
        property_name: Name of the property to set (e.g., "Length", "Radius")
        value: Value to set (can be string with units like "50mm" or numeric)

    Returns:
        dict with success status, object info, before/after values
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "objectName": object_name,
                "propertyName": property_name
            }

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "objectName": object_name,
                "propertyName": property_name
            }

        # Check if property exists
        if not hasattr(obj, property_name):
            available_props = [p for p in obj.PropertiesList if not p.startswith('_')]
            return {
                "success": False,
                "error": f"Property '{property_name}' not found on object '{object_name}'",
                "objectName": object_name,
                "propertyName": property_name,
                "availableProperties": available_props[:20]  # Limit list
            }

        # Get before value
        before_value = getattr(obj, property_name)
        unit_type = get_property_unit_type(property_name)

        # Parse value with units
        if isinstance(value, str):
            parsed_value, parsed_unit_type = parse_value_with_unit(value)
            if parsed_unit_type and parsed_unit_type != 'number':
                unit_type = parsed_unit_type
            value = parsed_value

        # Store before value for response
        before_display = format_value(before_value, unit_type)

        # Set the property (undo stack is automatically managed by FreeCAD)
        try:
            setattr(obj, property_name, value)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to set property: {str(e)}",
                "objectName": object_name,
                "propertyName": property_name,
                "beforeValue": before_display
            }

        # Get after value (in case FreeCAD adjusted it)
        after_value = getattr(obj, property_name)
        after_display = format_value(after_value, unit_type)

        # Recompute the document to apply changes
        doc.recompute()

        return {
            "success": True,
            "objectName": obj.Name,
            "objectLabel": obj.Label,
            "propertyName": property_name,
            "beforeValue": before_display,
            "afterValue": after_display,
            "message": f"Set {property_name} to {after_display}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to set property: {str(e)}",
            "objectName": object_name,
            "propertyName": property_name
        }


def handle_update_dimensions(object_name: str, dimensions: dict) -> dict:
    """
    Update multiple dimensional properties at once.

    Args:
        object_name: Name of the object to modify
        dimensions: Dict of dimension name to value, e.g., {"Length": "50mm", "Width": "30mm"}

    Returns:
        dict with success status, object info, and list of changes
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "objectName": object_name
            }

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "objectName": object_name
            }

        changes = []
        failed_changes = []

        for prop_name, value in dimensions.items():
            if not hasattr(obj, prop_name):
                failed_changes.append({
                    "property": prop_name,
                    "error": f"Property not found"
                })
                continue

            try:
                before_value = getattr(obj, prop_name)
                unit_type = get_property_unit_type(prop_name)

                # Parse value with units
                if isinstance(value, str):
                    parsed_value, parsed_unit_type = parse_value_with_unit(value)
                    if parsed_unit_type and parsed_unit_type != 'number':
                        unit_type = parsed_unit_type
                    value = parsed_value

                before_display = format_value(before_value, unit_type)

                # Set the property
                setattr(obj, prop_name, value)

                # Get after value
                after_value = getattr(obj, prop_name)
                after_display = format_value(after_value, unit_type)

                changes.append({
                    "property": prop_name,
                    "beforeValue": before_display,
                    "afterValue": after_display
                })
            except Exception as e:
                failed_changes.append({
                    "property": prop_name,
                    "error": str(e)
                })

        # Recompute the document
        doc.recompute()

        result = {
            "success": len(failed_changes) == 0,
            "objectName": obj.Name,
            "objectLabel": obj.Label,
            "changes": changes,
            "changeCount": len(changes),
            "message": f"Updated {len(changes)} dimension(s)"
        }

        if failed_changes:
            result["failedChanges"] = failed_changes
            result["error"] = f"{len(failed_changes)} property update(s) failed"

        return result
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to update dimensions: {str(e)}",
            "objectName": object_name
        }


def handle_move_object(object_name: str, position: dict = None, offset: dict = None,
                       relative: bool = False) -> dict:
    """
    Reposition an object to a new location.

    Args:
        object_name: Name of the object to move
        position: Absolute position dict {"x": 10, "y": 20, "z": 0}
        offset: Relative offset dict {"x": 5, "y": 0, "z": 0}
        relative: If True, position is treated as offset from current position

    Returns:
        dict with success status, object info, before/after positions
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "objectName": object_name
            }

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "objectName": object_name
            }

        if not hasattr(obj, 'Placement'):
            return {
                "success": False,
                "error": f"Object '{object_name}' does not have a Placement property",
                "objectName": object_name
            }

        # Get current placement
        old_placement = obj.Placement
        old_pos = old_placement.Base

        before_position = {
            "x": old_pos.x,
            "y": old_pos.y,
            "z": old_pos.z
        }

        # Calculate new position
        if offset is not None or relative:
            # Relative movement
            dx = offset.get('x', 0) if offset else position.get('x', 0) if position else 0
            dy = offset.get('y', 0) if offset else position.get('y', 0) if position else 0
            dz = offset.get('z', 0) if offset else position.get('z', 0) if position else 0

            # Parse values with units
            if isinstance(dx, str):
                dx, _ = parse_value_with_unit(dx)
            if isinstance(dy, str):
                dy, _ = parse_value_with_unit(dy)
            if isinstance(dz, str):
                dz, _ = parse_value_with_unit(dz)

            new_x = old_pos.x + dx
            new_y = old_pos.y + dy
            new_z = old_pos.z + dz
        elif position is not None:
            # Absolute position
            x = position.get('x', old_pos.x)
            y = position.get('y', old_pos.y)
            z = position.get('z', old_pos.z)

            # Parse values with units
            if isinstance(x, str):
                x, _ = parse_value_with_unit(x)
            if isinstance(y, str):
                y, _ = parse_value_with_unit(y)
            if isinstance(z, str):
                z, _ = parse_value_with_unit(z)

            new_x, new_y, new_z = x, y, z
        else:
            return {
                "success": False,
                "error": "Either 'position' or 'offset' must be provided",
                "objectName": object_name
            }

        # Create new placement preserving rotation
        new_placement = App.Placement(
            App.Vector(new_x, new_y, new_z),
            old_placement.Rotation
        )

        # Apply the new placement
        obj.Placement = new_placement
        doc.recompute()

        after_position = {
            "x": obj.Placement.Base.x,
            "y": obj.Placement.Base.y,
            "z": obj.Placement.Base.z
        }

        displacement = math.sqrt(
            (after_position['x'] - before_position['x']) ** 2 +
            (after_position['y'] - before_position['y']) ** 2 +
            (after_position['z'] - before_position['z']) ** 2
        )

        return {
            "success": True,
            "objectName": obj.Name,
            "objectLabel": obj.Label,
            "beforePosition": before_position,
            "afterPosition": after_position,
            "displacement": f"{displacement:.2f}mm",
            "message": f"Moved object by {displacement:.2f}mm"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to move object: {str(e)}",
            "objectName": object_name
        }


def handle_rotate_object(object_name: str, angle, axis: dict = None,
                         center: dict = None) -> dict:
    """
    Rotate an object around an axis.

    Args:
        object_name: Name of the object to rotate
        angle: Rotation angle (can be string like "90deg" or numeric in radians)
        axis: Axis of rotation dict {"x": 0, "y": 0, "z": 1} for Z-axis
        center: Center point of rotation dict {"x": 0, "y": 0, "z": 0}

    Returns:
        dict with success status, object info, before/after rotations
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "objectName": object_name
            }

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "objectName": object_name
            }

        if not hasattr(obj, 'Placement'):
            return {
                "success": False,
                "error": f"Object '{object_name}' does not have a Placement property",
                "objectName": object_name
            }

        # Parse angle
        if isinstance(angle, str):
            angle_rad, _ = parse_value_with_unit(angle)
        else:
            angle_rad = angle  # Assume radians if numeric

        # Default axis is Z-axis
        if axis is None:
            axis = {"x": 0, "y": 0, "z": 1}

        axis_x = axis.get('x', 0)
        axis_y = axis.get('y', 0)
        axis_z = axis.get('z', 1)

        # Normalize axis vector
        axis_length = math.sqrt(axis_x ** 2 + axis_y ** 2 + axis_z ** 2)
        if axis_length > 0:
            axis_x /= axis_length
            axis_y /= axis_length
            axis_z /= axis_length

        # Get current placement
        old_placement = obj.Placement
        old_rotation = old_placement.Rotation

        # Extract old rotation as axis-angle for display
        old_axis = old_rotation.Axis
        old_angle = old_rotation.Angle

        before_rotation = {
            "axis": {"x": old_axis.x, "y": old_axis.y, "z": old_axis.z},
            "angle": f"{math.degrees(old_angle):.2f}deg"
        }

        # Create rotation quaternion
        rotation_quat = App.Rotation(App.Vector(axis_x, axis_y, axis_z), angle_rad)

        # Apply rotation - combine with existing rotation
        if center is None:
            # Rotate around object's current position
            new_rotation = old_rotation.multiply(rotation_quat)
            new_placement = App.Placement(old_placement.Base, new_rotation)
        else:
            # Rotate around specified center point
            center_x = center.get('x', 0)
            center_y = center.get('y', 0)
            center_z = center.get('z', 0)

            # Parse center values with units
            if isinstance(center_x, str):
                center_x, _ = parse_value_with_unit(center_x)
            if isinstance(center_y, str):
                center_y, _ = parse_value_with_unit(center_y)
            if isinstance(center_z, str):
                center_z, _ = parse_value_with_unit(center_z)

            center_vec = App.Vector(center_x, center_y, center_z)

            # Translate to center, rotate, translate back
            translated_pos = old_placement.Base - center_vec
            rotated_pos = rotation_quat.multVec(translated_pos)
            new_pos = center_vec + rotated_pos
            new_rotation = old_rotation.multiply(rotation_quat)
            new_placement = App.Placement(new_pos, new_rotation)

        # Apply the new placement
        obj.Placement = new_placement
        doc.recompute()

        # Get new rotation for display
        new_rotation = obj.Placement.Rotation
        new_axis = new_rotation.Axis
        new_angle = new_rotation.Angle

        after_rotation = {
            "axis": {"x": new_axis.x, "y": new_axis.y, "z": new_axis.z},
            "angle": f"{math.degrees(new_angle):.2f}deg"
        }

        angle_degrees = math.degrees(angle_rad)

        return {
            "success": True,
            "objectName": obj.Name,
            "objectLabel": obj.Label,
            "beforeRotation": before_rotation,
            "afterRotation": after_rotation,
            "rotationApplied": f"{angle_degrees:.2f}deg",
            "axis": {"x": axis_x, "y": axis_y, "z": axis_z},
            "message": f"Rotated object by {angle_degrees:.2f}deg"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to rotate object: {str(e)}",
            "objectName": object_name
        }


def handle_scale_object(object_name: str, scale: float = None,
                        scale_x: float = None, scale_y: float = None,
                        scale_z: float = None, uniform: bool = True) -> dict:
    """
    Scale an object uniformly or non-uniformly.

    Note: FreeCAD objects don't have a native scale property. This handler
    scales the object by modifying its Placement scale factor or by creating
    a scaled copy depending on the object type.

    Args:
        object_name: Name of the object to scale
        scale: Uniform scale factor (e.g., 2.0 for 2x size)
        scale_x, scale_y, scale_z: Non-uniform scale factors
        uniform: If True, apply uniform scaling; if False, use individual axes

    Returns:
        dict with success status, object info, and scale factors applied
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "objectName": object_name
            }

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "objectName": object_name
            }

        # Determine scale factors
        if scale is not None:
            # Uniform scaling
            if isinstance(scale, str):
                scale, _ = parse_value_with_unit(scale)
            sx = sy = sz = float(scale)
        else:
            # Non-uniform scaling
            sx = float(scale_x) if scale_x is not None else 1.0
            sy = float(scale_y) if scale_y is not None else 1.0
            sz = float(scale_z) if scale_z is not None else 1.0

            if isinstance(sx, str):
                sx, _ = parse_value_with_unit(sx)
            if isinstance(sy, str):
                sy, _ = parse_value_with_unit(sy)
            if isinstance(sz, str):
                sz, _ = parse_value_with_unit(sz)

        # Get bounding box before scaling
        if hasattr(obj, 'Shape') and obj.Shape:
            old_bb = obj.Shape.BoundBox
            old_dimensions = {
                "x": old_bb.XLength,
                "y": old_bb.YLength,
                "z": old_bb.ZLength
            }
        else:
            old_dimensions = None

        # For PartDesign features and similar, we need to scale the underlying geometry
        # This is done by modifying dimensional properties if available
        scaled = False

        # Try to scale by modifying dimensional properties
        if hasattr(obj, 'Length') and hasattr(obj, 'Width') and hasattr(obj, 'Height'):
            # Box-like object
            try:
                obj.Length = obj.Length * sx
                obj.Width = obj.Width * sy
                obj.Height = obj.Height * sz
                scaled = True
            except Exception:
                pass
        elif hasattr(obj, 'Radius'):
            # Cylinder, sphere, etc.
            try:
                obj.Radius = obj.Radius * max(sx, sy, sz)
                if hasattr(obj, 'Height'):
                    obj.Height = obj.Height * sz
                scaled = True
            except Exception:
                pass

        if not scaled:
            # Try using Scale property if available
            if hasattr(obj, 'Scale'):
                try:
                    if uniform:
                        obj.Scale = scale
                    else:
                        obj.Scale = (sx, sy, sz)
                    scaled = True
                except Exception:
                    pass

        if not scaled:
            # For objects without direct scale support, use Draft scaling
            try:
                import Draft
                scale_factor = App.Vector(sx, sy, sz)
                scaled_obj = Draft.scale(obj, scale_factor, copy=False)
                if scaled_obj:
                    obj = scaled_obj
                    scaled = True
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Scaling failed: object does not support direct scaling and Draft fallback failed: {str(e)}",
                    "objectName": object_name,
                    "scaleFactors": {"x": sx, "y": sy, "z": sz}
                }

        doc.recompute()

        # Get bounding box after scaling
        if hasattr(obj, 'Shape') and obj.Shape:
            new_bb = obj.Shape.BoundBox
            new_dimensions = {
                "x": new_bb.XLength,
                "y": new_bb.YLength,
                "z": new_bb.ZLength
            }
        else:
            new_dimensions = None

        result = {
            "success": True,
            "objectName": obj.Name,
            "objectLabel": obj.Label,
            "scaleFactors": {"x": sx, "y": sy, "z": sz},
            "uniform": uniform,
            "message": f"Scaled object by factors ({sx}, {sy}, {sz})"
        }

        if old_dimensions and new_dimensions:
            result["beforeDimensions"] = old_dimensions
            result["afterDimensions"] = new_dimensions

        return result
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to scale object: {str(e)}",
            "objectName": object_name
        }


def handle_set_expression(object_name: str, property_name: str,
                          expression: str) -> dict:
    """
    Create a parametric relationship by setting an expression on a property.

    Args:
        object_name: Name of the object
        property_name: Property to set expression on (e.g., "Length")
        expression: Expression string (e.g., "Body.Cube.Length * 2" or "50mm")

    Returns:
        dict with success status, object info, and expression details
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "objectName": object_name
            }

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "objectName": object_name
            }

        # Check if property exists
        if not hasattr(obj, property_name):
            available_props = [p for p in obj.PropertiesList if not p.startswith('_')]
            return {
                "success": False,
                "error": f"Property '{property_name}' not found",
                "objectName": object_name,
                "propertyName": property_name,
                "availableProperties": available_props[:20]
            }

        # Get current value before setting expression
        before_value = getattr(obj, property_name)
        unit_type = get_property_unit_type(property_name)
        before_display = format_value(before_value, unit_type)

        # Check if there's already an expression
        existing_expr = obj.getExpression(property_name)
        if existing_expr:
            old_expr_display = existing_expr
        else:
            old_expr_display = None

        # Set the expression
        # FreeCAD expressions need to be set with the expression engine
        try:
            obj.setExpression(property_name, expression)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to set expression: {str(e)}",
                "objectName": object_name,
                "propertyName": property_name,
                "expression": expression
            }

        # Recompute to evaluate the expression
        doc.recompute()

        # Get the new value
        after_value = getattr(obj, property_name)
        after_display = format_value(after_value, unit_type)

        # Verify the expression was set
        current_expr = obj.getExpression(property_name)

        return {
            "success": True,
            "objectName": obj.Name,
            "objectLabel": obj.Label,
            "propertyName": property_name,
            "expression": expression,
            "previousExpression": old_expr_display,
            "beforeValue": before_display,
            "afterValue": after_display,
            "message": f"Set expression '{expression}' on {property_name}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to set expression: {str(e)}",
            "objectName": object_name,
            "propertyName": property_name
        }


def handle_get_expression(object_name: str, property_name: str = None) -> dict:
    """
    Query existing expressions on an object.

    Args:
        object_name: Name of the object
        property_name: Optional specific property to query. If None, returns all expressions.

    Returns:
        dict with success status and expression information
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "objectName": object_name
            }

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "objectName": object_name
            }

        expressions = {}

        if property_name:
            # Get expression for specific property
            if not hasattr(obj, property_name):
                return {
                    "success": False,
                    "error": f"Property '{property_name}' not found",
                    "objectName": object_name,
                    "propertyName": property_name
                }

            expr = obj.getExpression(property_name)
            current_value = getattr(obj, property_name)
            unit_type = get_property_unit_type(property_name)

            expressions[property_name] = {
                "expression": expr,
                "currentValue": format_value(current_value, unit_type),
                "hasExpression": expr is not None
            }
        else:
            # Get all expressions on the object
            for prop in obj.PropertiesList:
                if prop.startswith('_'):
                    continue
                try:
                    expr = obj.getExpression(prop)
                    if expr:
                        current_value = getattr(obj, prop)
                        unit_type = get_property_unit_type(prop)
                        expressions[prop] = {
                            "expression": expr,
                            "currentValue": format_value(current_value, unit_type)
                        }
                except Exception:
                    pass

        return {
            "success": True,
            "objectName": obj.Name,
            "objectLabel": obj.Label,
            "expressions": expressions,
            "expressionCount": len(expressions),
            "message": f"Found {len(expressions)} expression(s)"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to get expression: {str(e)}",
            "objectName": object_name
        }


def handle_clear_expression(object_name: str, property_name: str = None) -> dict:
    """
    Remove expressions from an object's property.

    Args:
        object_name: Name of the object
        property_name: Optional specific property to clear. If None, clears all expressions.

    Returns:
        dict with success status and information about cleared expressions
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "objectName": object_name
            }

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "objectName": object_name
            }

        cleared = []

        if property_name:
            # Clear expression for specific property
            if not hasattr(obj, property_name):
                return {
                    "success": False,
                    "error": f"Property '{property_name}' not found",
                    "objectName": object_name,
                    "propertyName": property_name
                }

            expr = obj.getExpression(property_name)
            if expr:
                # Clear by setting expression to empty string or None
                obj.setExpression(property_name, None)
                cleared.append(property_name)
        else:
            # Clear all expressions on the object
            for prop in obj.PropertiesList:
                if prop.startswith('_'):
                    continue
                try:
                    expr = obj.getExpression(prop)
                    if expr:
                        obj.setExpression(prop, None)
                        cleared.append(prop)
                except Exception:
                    pass

        # Recompute after clearing expressions
        doc.recompute()

        return {
            "success": True,
            "objectName": obj.Name,
            "objectLabel": obj.Label,
            "clearedProperties": cleared,
            "clearedCount": len(cleared),
            "message": f"Cleared {len(cleared)} expression(s)"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to clear expression: {str(e)}",
            "objectName": object_name
        }


# Export all handlers for easy import
__all__ = [
    'handle_set_object_property',
    'handle_update_dimensions',
    'handle_move_object',
    'handle_rotate_object',
    'handle_scale_object',
    'handle_set_expression',
    'handle_get_expression',
    'handle_clear_expression',
    'parse_value_with_unit',
    'format_value',
    'get_property_unit_type',
]
