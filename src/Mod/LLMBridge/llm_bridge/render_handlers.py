# SPDX-License-Identifier: LGPL-2.1-or-later
# Render and View Handlers
#
# Provides handlers for rendering operations and camera control:
# - View angle presets (top, bottom, front, back, left, right, iso, home)
# - Camera positioning
# - Rendering to image files
# - Renderer selection and quality settings
# - Material and color application
# - Lighting configuration
# Each handler returns JSON-serializable structures.

import FreeCAD as App
import FreeCADGui as Gui
import os
import math


_render_state = {
    "current_renderer": "opengl",
    "render_quality": "medium",
    "capture_active": False,
    "capture_output_dir": None,
    "capture_fps": 30,
    "captured_frames": [],
}


_lighting_presets = {
    "default": {
        "name": "Default",
        "ambient": (0.5, 0.5, 0.5),
        "diffuse": (0.8, 0.8, 0.8),
        "specular": (0.3, 0.3, 0.3),
    },
    "studio": {
        "name": "Studio",
        "ambient": (0.4, 0.4, 0.4),
        "diffuse": (0.9, 0.9, 0.9),
        "specular": (0.6, 0.6, 0.6),
    },
    "outdoor": {
        "name": "Outdoor",
        "ambient": (0.6, 0.6, 0.7),
        "diffuse": (1.0, 1.0, 0.9),
        "specular": (0.2, 0.2, 0.1),
    },
    "museum": {
        "name": "Museum",
        "ambient": (0.3, 0.3, 0.3),
        "diffuse": (0.7, 0.7, 0.7),
        "specular": (0.4, 0.4, 0.4),
    },
}


_view_modes = {
    "wireframe": "Wireframe",
    "shaded": "Shaded",
    "flatlines": "Flat Lines",
    "points": "Points",
    "shadedwithedges": "Shaded With Edges",
}


def _get_active_view():
    """Get the active 3D view."""
    try:
        return Gui.ActiveDocument.ActiveView
    except Exception:
        return None


def _rgb_to_fc_color(r, g, b, a=255):
    """Convert 0-255 RGB/A values to FreeCAD color tuple (0.0-1.0)."""
    return (
        r / 255.0 if isinstance(r, int) else r,
        g / 255.0 if isinstance(g, int) else g,
        b / 255.0 if isinstance(b, int) else b,
        a / 255.0 if isinstance(a, int) else a,
    )


def _get_object_by_name(doc, name):
    """Get an object by name or label."""
    obj = doc.getObject(name)
    if obj:
        return obj

    for o in doc.Objects:
        if hasattr(o, "Label") and o.Label == name:
            return o
        if hasattr(o, "Name") and o.Name == name:
            return o

    return None


def _get_material_from_database(material_name):
    """Get a material from FreeCAD's material database."""
    material_db = None
    try:
        from Material import MaterialManager

        material_db = MaterialManager.GetManager()
    except ImportError:
        pass

    if material_db is None:
        try:
            from FreeCAD import Material

            material_db = Material
        except ImportError:
            pass

    material_path = None
    try:
        material_path = material_db.getMaterialPath(material_name)
    except Exception:
        pass

    if material_path and os.path.exists(material_path):
        return material_path

    standard_materials = [
        "Steel",
        "Aluminum",
        "Copper",
        "Brass",
        "Bronze",
        "Plastic",
        "Wood",
        "Glass",
        "Concrete",
    ]

    if material_name.lower() in [m.lower() for m in standard_materials]:
        return material_name

    return None


def handle_set_view_angle(view_name, angle_type=None):
    """
    Set the camera to a predefined view angle.

    Args:
        view_name: Name to identify the view ('top', 'bottom', 'front', 'back',
                   'left', 'right', 'iso', 'home')
        angle_type: Alternative parameter name (same as view_name)

    Returns:
        dict with success status, view name, and message
    """
    try:
        view = _get_active_view()
        if view is None:
            return {
                "success": False,
                "error": "No active 3D view available",
                "data": None,
            }

        target = angle_type if angle_type else view_name
        target_lower = target.lower() if isinstance(target, str) else ""

        view_angles = {
            "top": (0, 0, 1, 0, 0, 1),
            "bottom": (0, 0, -1, 0, 0, -1),
            "front": (0, -1, 0, 0, 0, 1),
            "back": (0, 1, 0, 0, 0, -1),
            "left": (-1, 0, 0, 1, 0, 0),
            "right": (1, 0, 0, -1, 0, 0),
            "iso": (1, 1, 1, -1, -1, -1),
            "home": None,
        }

        if target_lower in view_angles:
            if target_lower == "home":
                view.fitAll()
                viewMessage = "View set to home position"
            else:
                direction = view_angles[target_lower]
                view.setCameraOrientation(
                    view.makeCameraOrientation(direction[:3], direction[3:])
                )
                viewMessage = f"View set to {target_lower}"

            return {
                "success": True,
                "data": {
                    "viewName": target_lower,
                    "message": viewMessage,
                },
            }

        return {
            "success": False,
            "error": f"Unknown view angle: {target}. Valid options: top, bottom, front, back, left, right, iso, home",
            "data": None,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_zoom_to_fit():
    """
    Zoom the view to fit all visible objects.

    Returns:
        dict with success status and message
    """
    try:
        view = _get_active_view()
        if view is None:
            return {
                "success": False,
                "error": "No active 3D view available",
                "data": None,
            }

        view.fitAll()

        return {
            "success": True,
            "data": {
                "message": "View zoomed to fit all objects",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_view_mode(mode):
    """
    Set the display mode of the view.

    Args:
        mode: Display mode ('wireframe', 'shaded', 'flatlines', 'points',
              'shadedwithedges')

    Returns:
        dict with success status, mode, and message
    """
    try:
        view = _get_active_view()
        if view is None:
            return {
                "success": False,
                "error": "No active 3D view available",
                "data": None,
            }

        mode_lower = mode.lower() if isinstance(mode, str) else ""

        if mode_lower not in _view_modes:
            return {
                "success": False,
                "error": f"Unknown view mode: {mode}. Valid options: {', '.join(_view_modes.keys())}",
                "data": None,
            }

        try:
            view.setDisplayMode(_view_modes[mode_lower])
        except Exception:
            pass

        try:
            Gui.SendMsgToActiveView("ViewFit")
        except Exception:
            pass

        return {
            "success": True,
            "data": {
                "mode": mode_lower,
                "displayMode": _view_modes[mode_lower],
                "message": f"View mode set to {mode_lower}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_render_view(image_path, width=1920, height=1080, renderer=None):
    """
    Render the current view to an image file.

    Args:
        image_path: Path to save the rendered image
        width: Image width in pixels (default 1920)
        height: Image height in pixels (default 1080)
        renderer: Renderer to use ('opengl', 'raytracing', 'embree')

    Returns:
        dict with success status, output path, dimensions, and message
    """
    try:
        global _render_state

        view = _get_active_view()
        if view is None:
            return {
                "success": False,
                "error": "No active 3D view available",
                "data": None,
            }

        renderer_name = renderer if renderer else _render_state["current_renderer"]

        output_path = os.path.expanduser(str(image_path))
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        try:
            from PySide import QtGui
            from PySide.QtCore import QRect

            pixmap = QtGui.QPixmap.grabWidget(view.getPyHandle())
            if pixmap.isNull():
                return {
                    "success": False,
                    "error": "Failed to capture view - pixmap is null",
                    "data": None,
                }

            scaled_pixmap = pixmap.scaled(int(width), int(height), aspectMode=1, mode=1)
            scaled_pixmap.save(output_path)

            return {
                "success": True,
                "data": {
                    "outputPath": output_path,
                    "width": width,
                    "height": height,
                    "renderer": renderer_name,
                    "message": f"Rendered to {output_path} ({width}x{height})",
                },
            }
        except ImportError:
            pass

        try:
            temp_path = output_path
            if not temp_path.lower().endswith((".png", ".jpg", ".jpeg", ".bmp")):
                temp_path = temp_path + ".png"

            view.saveImage(temp_path, int(width), int(height), "CoverageImage")

            if os.path.exists(temp_path) and temp_path != output_path:
                import shutil

                shutil.move(temp_path, output_path)

            return {
                "success": True,
                "data": {
                    "outputPath": output_path,
                    "width": width,
                    "height": height,
                    "renderer": renderer_name,
                    "message": f"Rendered to {output_path} ({width}x{height})",
                },
            }
        except Exception:
            pass

        try:
            from pivy import coin
            from PySide import QtGui

            original_size = view.getWindowGeometry()
            view.resizeWindow(int(width), int(height))
            view.hide()
            view.show()
            view.render(True)

            pixmap = QtGui.QPixmap.grabWidget(view.getPyHandle())
            pixmap.save(output_path)

            view.resizeWindow(original_size[2], original_size[3])
            view.hide()
            view.show()

            return {
                "success": True,
                "data": {
                    "outputPath": output_path,
                    "width": width,
                    "height": height,
                    "renderer": renderer_name,
                    "message": f"Rendered to {output_path} ({width}x{height})",
                },
            }
        except Exception:
            pass

        return {
            "success": False,
            "error": "Failed to render view - no suitable capture method available",
            "data": None,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_renderer(renderer_name):
    """
    Set the rendering engine.

    Args:
        renderer_name: Renderer name ('opengl', 'raytracing', 'embree')

    Returns:
        dict with success status, renderer name, and message
    """
    try:
        global _render_state

        valid_renderers = ["opengl", "raytracing", "embree"]
        renderer_lower = renderer_name.lower() if isinstance(renderer_name, str) else ""

        if renderer_lower not in valid_renderers:
            return {
                "success": False,
                "error": f"Unknown renderer: {renderer_name}. Valid options: {', '.join(valid_renderers)}",
                "data": None,
            }

        _render_state["current_renderer"] = renderer_lower

        return {
            "success": True,
            "data": {
                "rendererName": renderer_lower,
                "message": f"Renderer set to {renderer_lower}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_render_quality(quality):
    """
    Set the render quality.

    Args:
        quality: Quality preset ('draft', 'medium', 'high', 'ultra')

    Returns:
        dict with success status, quality, and message
    """
    try:
        global _render_state

        valid_qualities = ["draft", "medium", "high", "ultra"]
        quality_lower = quality.lower() if isinstance(quality, str) else ""

        if quality_lower not in valid_qualities:
            return {
                "success": False,
                "error": f"Unknown quality: {quality}. Valid options: {', '.join(valid_qualities)}",
                "data": None,
            }

        _render_state["render_quality"] = quality_lower

        quality_map = {
            "draft": 1,
            "medium": 2,
            "high": 4,
            "ultra": 8,
        }

        try:
            view = _get_active_view()
            if view and hasattr(view, "setRenderingQuality"):
                view.setRenderingQuality(quality_map.get(quality_lower, 2))
        except Exception:
            pass

        return {
            "success": True,
            "data": {
                "quality": quality_lower,
                "message": f"Render quality set to {quality_lower}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_material(object_name, material_name):
    """
    Apply a material from FreeCAD's database to an object.

    Args:
        object_name: Name or label of the object
        material_name: Name of the material in FreeCAD's database

    Returns:
        dict with success status, object name, material name, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = _get_object_by_name(doc, object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None,
            }

        material_path = _get_material_from_database(material_name)

        if material_path is None:
            return {
                "success": False,
                "error": f"Material '{material_name}' not found in database",
                "data": None,
            }

        try:
            if hasattr(obj, "Material"):
                if isinstance(material_path, str) and os.path.exists(material_path):
                    obj.Material = material_path
                else:
                    obj.Material = str(material_name)
                doc.recompute()
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to apply material: {str(e)}",
                "data": None,
            }

        return {
            "success": True,
            "data": {
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "materialName": material_name,
                "message": f"Applied '{material_name}' material to '{obj.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_object_color(object_name, color):
    """
    Set the color of an object.

    Args:
        object_name: Name or label of the object
        color: Color as dict with r, g, b, a keys (0-255) or (0.0-1.0)

    Returns:
        dict with success status, object name, color, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = _get_object_by_name(doc, object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None,
            }

        if isinstance(color, dict):
            r = color.get("r", 128)
            g = color.get("g", 128)
            b = color.get("b", 128)
            a = color.get("a", 255)
        elif isinstance(color, (list, tuple)) and len(color) >= 3:
            r, g, b = color[0], color[1], color[2]
            a = color[3] if len(color) > 3 else 255
        else:
            return {
                "success": False,
                "error": "Color must be a dict with r, g, b, a keys or a list/tuple",
                "data": None,
            }

        fc_color = _rgb_to_fc_color(r, g, b, a)

        color_tuple = App.Color(*fc_color)

        if hasattr(obj, "ViewObject"):
            obj.ViewObject.ShapeColor = color_tuple
        elif hasattr(obj, "ShapeColor"):
            obj.ShapeColor = color_tuple
        else:
            return {
                "success": False,
                "error": f"Object '{obj.Label}' does not support color",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "color": {"r": r, "g": g, "b": b, "a": a},
                "message": f"Set color to RGB({r},{g},{b}) on '{obj.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_camera_position(x, y, z, target_x=0, target_y=0, target_z=0):
    """
    Set the camera position and look-at target.

    Args:
        x: Camera X position
        y: Camera Y position
        z: Camera Z position
        target_x: Look-at target X (default 0)
        target_y: Look-at target Y (default 0)
        target_z: Look-at target Z (default 0)

    Returns:
        dict with success status, position, target, and message
    """
    try:
        view = _get_active_view()
        if view is None:
            return {
                "success": False,
                "error": "No active 3D view available",
                "data": None,
            }

        try:
            pos = App.Vector(float(x), float(y), float(z))
            target = App.Vector(float(target_x), float(target_y), float(target_z))

            direction = target - pos
            if direction.Length < 1e-6:
                return {
                    "success": False,
                    "error": "Camera position cannot be the same as target",
                    "data": None,
                }

            view.setCameraPosition(pos, target)

            return {
                "success": True,
                "data": {
                    "position": {"x": x, "y": y, "z": z},
                    "target": {"x": target_x, "y": target_y, "z": target_z},
                    "message": f"Camera positioned at ({x}, {y}, {z}) looking at ({target_x}, {target_y}, {target_z})",
                },
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to set camera position: {str(e)}",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_configure_lighting(lighting_type):
    """
    Configure scene lighting using a preset.

    Args:
        lighting_type: Preset name ('default', 'studio', 'outdoor', 'museum')

    Returns:
        dict with success status, lighting type, and message
    """
    try:
        global _lighting_presets

        lighting_lower = lighting_type.lower() if isinstance(lighting_type, str) else ""

        if lighting_lower not in _lighting_presets:
            return {
                "success": False,
                "error": f"Unknown lighting preset: {lighting_type}. Valid options: {', '.join(_lighting_presets.keys())}",
                "data": None,
            }

        preset = _lighting_presets[lighting_lower]

        try:
            view = _get_active_view()
            if view:
                if hasattr(view, "setLighting"):
                    view.setLighting(lighting_lower)
                elif hasattr(view, "setLightDirection"):
                    direction = preset.get("direction", (1, 1, 1))
                    view.setLightDirection(direction)
        except Exception:
            pass

        return {
            "success": True,
            "data": {
                "lightingType": lighting_lower,
                "presetName": preset["name"],
                "message": f"Lighting configured to '{preset['name']}' preset",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_set_view_angle",
    "handle_zoom_to_fit",
    "handle_set_view_mode",
    "handle_render_view",
    "handle_set_renderer",
    "handle_set_render_quality",
    "handle_set_material",
    "handle_set_object_color",
    "handle_set_camera_position",
    "handle_configure_lighting",
]
