# SPDX-License-Identifier: LGPL-2.1-or-later
# TechDraw Handlers for FreeCAD TechDraw Workbench Operations
#
# Provides handlers for TechDraw workbench operations:
# - Page management (create, list, delete, get properties)
# - View creation (standard, isometric, front, top, side, section, projection, detail)
# - Dimension tools (linear, radial, diameter, angular)
# - Annotations (text, balloon, leader line)
# - Export (SVG, PDF)
# Each handler returns JSON-serializable structures.

import math
import os

import FreeCAD as App

try:
    import TechDraw
except ImportError:
    TechDraw = None

DEFAULT_TEMPLATE_PATHS = [
    ":/TEAM/A3_LandscapeTD.svg",
    ":/TEAM/A4_LandscapeTD.svg",
    ":/TEAM/A4_PortraitTD.svg",
]


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


def _format_point(pt):
    """Format a point for display."""
    if isinstance(pt, App.Vector):
        return {"x": round(pt.x, 2), "y": round(pt.y, 2), "z": round(pt.z, 2)}
    return pt


def _get_techdraw_page(page_name):
    """Get a TechDraw page by name."""
    if TechDraw is None:
        return None
    doc = App.ActiveDocument
    if doc is None:
        return None
    page = doc.getObject(page_name)
    if page is not None and page.isDerivedFrom("TechDraw::Page"):
        return page
    for obj in doc.Objects:
        if obj.isDerivedFrom("TechDraw::Page"):
            if obj.Name == page_name or obj.Label == page_name:
                return obj
    return None


def _find_template_path(template):
    """Find the template path from various input formats."""
    if template is None:
        return DEFAULT_TEMPLATE_PATHS[0]

    template_str = str(template).strip()

    if template_str.startswith(":"):
        return template_str

    if os.path.exists(template_str):
        return template_str

    for default_path in DEFAULT_TEMPLATE_PATHS:
        if (
            default_path.endswith(template_str)
            or template_str.lower() in default_path.lower()
        ):
            return default_path

    return DEFAULT_TEMPLATE_PATHS[0]


def _is_techdraw_page(obj):
    """Check if an object is a TechDraw page."""
    if obj is None:
        return False
    return obj.isDerivedFrom("TechDraw::Page")


def _is_techdraw_view(obj):
    """Check if an object is a TechDraw view."""
    if obj is None:
        return False
    return obj.isDerivedFrom("TechDraw::DrawView")


# ============================================================================
# Page Management
# ============================================================================


def handle_create_drawing_page(template=None, name=None):
    """
    Create a new TechDraw page.

    Args:
        template: Template path or name (e.g., "A4_Landscape", "A3_Landscape").
                  If None, uses default template.
        name: Optional name for the page

    Returns:
        dict with success status, page info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        template_path = _find_template_path(template)

        page = TechDraw.makeTechDrawPage()
        page.Template = template_path

        if name:
            page.Label = name

        doc.recompute()

        paper_size = "Unknown"
        if hasattr(page, "PageWidth") and hasattr(page, "PageHeight"):
            paper_size = f"{int(page.PageWidth)}x{int(page.PageHeight)}"

        return {
            "success": True,
            "data": {
                "objectName": page.Name,
                "objectLabel": page.Label,
                "objectType": "TechDraw::Page",
                "template": template_path,
                "paperSize": paper_size,
                "viewCount": 0,
                "message": f"Created TechDraw page '{page.Label}' using template '{template_path}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_drawing_pages():
    """
    List all TechDraw pages in the current document.

    Returns:
        dict with success status, list of pages, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        pages = []
        for obj in doc.Objects:
            if _is_techdraw_page(obj):
                view_count = 0
                for child in doc.Objects:
                    if hasattr(child, "ParentPage") and child.ParentPage == obj:
                        view_count += 1

                paper_size = "Unknown"
                if hasattr(obj, "PageWidth") and hasattr(obj, "PageHeight"):
                    paper_size = f"{int(obj.PageWidth)}x{int(obj.PageHeight)}"

                pages.append(
                    {
                        "name": obj.Name,
                        "label": obj.Label,
                        "template": getattr(obj, "Template", "Unknown"),
                        "paperSize": paper_size,
                        "viewCount": view_count,
                    }
                )

        return {
            "success": True,
            "data": {
                "pages": pages,
                "count": len(pages),
                "message": f"Found {len(pages)} TechDraw page(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_delete_drawing_page(page_name):
    """
    Delete a TechDraw page.

    Args:
        page_name: Name or label of the page to delete

    Returns:
        dict with success status and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        page_label = page.Label
        doc.removeObject(page.Name)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "deletedPage": page_label,
                "message": f"Deleted TechDraw page '{page_label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_drawing_page_properties(page_name):
    """
    Get properties of a TechDraw page.

    Args:
        page_name: Name or label of the page

    Returns:
        dict with success status, page properties, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        properties = {
            "name": page.Name,
            "label": page.Label,
            "type": page.TypeId,
            "module": "TechDraw",
        }

        if hasattr(page, "Template"):
            properties["template"] = page.Template
        if hasattr(page, "PageWidth"):
            properties["pageWidth"] = page.PageWidth
        if hasattr(page, "PageHeight"):
            properties["pageHeight"] = page.PageHeight
        if hasattr(page, "Scale"):
            properties["scale"] = page.Scale
        if hasattr(page, "ScaleType"):
            properties["scaleType"] = page.ScaleType

        views = []
        for obj in doc.Objects:
            if hasattr(obj, "ParentPage") and obj.ParentPage == page:
                views.append(
                    {
                        "name": obj.Name,
                        "label": obj.Label,
                        "type": obj.TypeId,
                    }
                )
        properties["views"] = views
        properties["viewCount"] = len(views)

        return {
            "success": True,
            "data": {
                "pageName": page.Name,
                "pageLabel": page.Label,
                "properties": properties,
                "message": f"Retrieved properties for TechDraw page '{page.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# ============================================================================
# View Creation
# ============================================================================


def _get_source_object(source_object):
    """Get a source object by name or return it if it's already an object."""
    if source_object is None:
        return None

    if isinstance(source_object, App.DocumentObject):
        return source_object

    doc = App.ActiveDocument
    if doc is None:
        return None

    return doc.getObject(source_object)


def _add_view_to_page(page, view, view_name=None):
    """Add a view to a page with optional naming."""
    if view_name:
        view.Label = view_name
    page.addView(view)
    return view


def handle_create_view(page_name, source_object, view_name=None, projection_type=None):
    """
    Create a standard projection view on a TechDraw page.

    Args:
        page_name: Name of the TechDraw page
        source_object: Source 3D object or object name
        view_name: Optional name for the view
        projection_type: Optional projection type ("Front", "Top", "Side", "Isometric")

    Returns:
        dict with success status, view info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        source_obj = _get_source_object(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        view = TechDraw.makeDrawViewPart(source_obj, page)
        if projection_type:
            projection_type_lower = projection_type.lower()
            if projection_type_lower in ("front", "isometric"):
                view.Direction = App.Vector(0, 0, 1)
                view.XDirection = App.Vector(1, 0, 0)
            elif projection_type_lower == "top":
                view.Direction = App.Vector(0, -1, 0)
                view.XDirection = App.Vector(1, 0, 0)
            elif projection_type_lower == "side":
                view.Direction = App.Vector(1, 0, 0)
                view.XDirection = App.Vector(0, 1, 0)
        _add_view_to_page(page, view, view_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": view.Name,
                "objectLabel": view.Label,
                "objectType": view.TypeId,
                "sourceObject": source_obj.Label,
                "parentPage": page.Label,
                "position": _format_point(view.Position)
                if hasattr(view, "Position")
                else None,
                "scale": view.Scale if hasattr(view, "Scale") else 1.0,
                "projectionType": projection_type if projection_type else "Default",
                "message": f"Created view of '{source_obj.Label}' on page '{page.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_isometric_view(page_name, source_object, view_name=None):
    """
    Create an isometric (trimetric) view on a TechDraw page.

    Args:
        page_name: Name of the TechDraw page
        source_object: Source 3D object or object name
        view_name: Optional name for the view

    Returns:
        dict with success status, view info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        source_obj = _get_source_object(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        view = TechDraw.makeDrawViewPart(source_obj, page)
        view.Direction = App.Vector(1, -1, 1)
        view.XDirection = App.Vector(1, 0.5, 0.5)
        _add_view_to_page(page, view, view_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": view.Name,
                "objectLabel": view.Label,
                "objectType": view.TypeId,
                "viewType": "Isometric",
                "sourceObject": source_obj.Label,
                "parentPage": page.Label,
                "direction": _format_point(view.Direction)
                if hasattr(view, "Direction")
                else None,
                "scale": view.Scale if hasattr(view, "Scale") else 1.0,
                "message": f"Created isometric view of '{source_obj.Label}' on page '{page.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_front_view(page_name, source_object, view_name=None):
    """
    Create a front view on a TechDraw page.

    Args:
        page_name: Name of the TechDraw page
        source_object: Source 3D object or object name
        view_name: Optional name for the view

    Returns:
        dict with success status, view info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        source_obj = _get_source_object(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        view = TechDraw.makeDrawViewPart(source_obj, page)
        view.Direction = App.Vector(0, 0, 1)
        view.XDirection = App.Vector(1, 0, 0)
        _add_view_to_page(page, view, view_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": view.Name,
                "objectLabel": view.Label,
                "objectType": view.TypeId,
                "viewType": "Front",
                "sourceObject": source_obj.Label,
                "parentPage": page.Label,
                "direction": _format_point(view.Direction)
                if hasattr(view, "Direction")
                else None,
                "scale": view.Scale if hasattr(view, "Scale") else 1.0,
                "message": f"Created front view of '{source_obj.Label}' on page '{page.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_top_view(page_name, source_object, view_name=None):
    """
    Create a top (plan) view on a TechDraw page.

    Args:
        page_name: Name of the TechDraw page
        source_object: Source 3D object or object name
        view_name: Optional name for the view

    Returns:
        dict with success status, view info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        source_obj = _get_source_object(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        view = TechDraw.makeDrawViewPart(source_obj, page)
        view.Direction = App.Vector(0, -1, 0)
        view.XDirection = App.Vector(1, 0, 0)
        _add_view_to_page(page, view, view_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": view.Name,
                "objectLabel": view.Label,
                "objectType": view.TypeId,
                "viewType": "Top",
                "sourceObject": source_obj.Label,
                "parentPage": page.Label,
                "direction": _format_point(view.Direction)
                if hasattr(view, "Direction")
                else None,
                "scale": view.Scale if hasattr(view, "Scale") else 1.0,
                "message": f"Created top view of '{source_obj.Label}' on page '{page.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_side_view(page_name, source_object, view_name=None, side="Right"):
    """
    Create a side view on a TechDraw page.

    Args:
        page_name: Name of the TechDraw page
        source_object: Source 3D object or object name
        view_name: Optional name for the view
        side: Side for the view ("Right" or "Left")

    Returns:
        dict with success status, view info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        source_obj = _get_source_object(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        view = TechDraw.makeDrawViewPart(source_obj, page)
        side_lower = side.lower() if side else "right"
        if side_lower == "left":
            view.Direction = App.Vector(-1, 0, 0)
            view.XDirection = App.Vector(0, -1, 0)
        else:
            view.Direction = App.Vector(1, 0, 0)
            view.XDirection = App.Vector(0, 1, 0)
        _add_view_to_page(page, view, view_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": view.Name,
                "objectLabel": view.Label,
                "objectType": view.TypeId,
                "viewType": "Side",
                "sourceObject": source_obj.Label,
                "parentPage": page.Label,
                "direction": _format_point(view.Direction)
                if hasattr(view, "Direction")
                else None,
                "scale": view.Scale if hasattr(view, "Scale") else 1.0,
                "side": side,
                "message": f"Created side view of '{source_obj.Label}' on page '{page.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_section_view(page_name, source_object, section_line, view_name=None):
    """
    Create a section view on a TechDraw page.

    Args:
        page_name: Name of the TechDraw page
        source_object: Source 3D object or object name
        section_line: Dict with two points defining the section line:
                      {"point1": {"x": 0, "y": 0}, "point2": {"x": 100, "y": 0}}
                      or list of two points
        view_name: Optional name for the view

    Returns:
        dict with success status, view info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        source_obj = _get_source_object(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        if isinstance(section_line, dict):
            point1 = _parse_point(section_line.get("point1"))
            point2 = _parse_point(section_line.get("point2"))
        elif isinstance(section_line, (list, tuple)) and len(section_line) == 2:
            point1 = _parse_point(section_line[0])
            point2 = _parse_point(section_line[1])
        else:
            return {
                "success": False,
                "error": "section_line must be a dict with point1/point2 or a list of two points",
                "data": None,
            }

        view = TechDraw.makeDrawViewPart(source_obj, page)
        view.Direction = App.Vector(0, 0, 1)
        view.XDirection = App.Vector(1, 0, 0)

        section = TechDraw.makeSectionView(view)
        section.Direction = App.Vector(0, 0, 1)

        if hasattr(section, "SectionLine"):
            section.SectionLine = [point1, point2]

        _add_view_to_page(page, section, view_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": section.Name,
                "objectLabel": section.Label,
                "objectType": section.TypeId,
                "viewType": "Section",
                "sourceObject": source_obj.Label,
                "parentPage": page.Label,
                "sectionLine": {
                    "point1": _format_point(point1),
                    "point2": _format_point(point2),
                },
                "message": f"Created section view of '{source_obj.Label}' on page '{page.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_projection_group(
    page_name, source_object, view_name=None, views=None
):
    """
    Create a projection group (multiple views) on a TechDraw page.

    Args:
        page_name: Name of the TechDraw page
        source_object: Source 3D object or object name
        view_name: Optional name for the projection group
        views: Optional list of view types to create (e.g., ["Front", "Top", "Side"])

    Returns:
        dict with success status, group info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        source_obj = _get_source_object(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        group = TechDraw.makeDrawViewPart(source_obj, page)

        direction_map = {
            "front": (App.Vector(0, 0, 1), App.Vector(1, 0, 0)),
            "top": (App.Vector(0, -1, 0), App.Vector(1, 0, 0)),
            "bottom": (App.Vector(0, 1, 0), App.Vector(1, 0, 0)),
            "left": (App.Vector(-1, 0, 0), App.Vector(0, -1, 0)),
            "right": (App.Vector(1, 0, 0), App.Vector(0, 1, 0)),
            "fronttop": (App.Vector(0, -1, 1), App.Vector(1, 0, 0)),
            "isometric": (App.Vector(1, -1, 1), App.Vector(1, 0.5, 0.5)),
        }

        if views:
            created_views = []
            for view_type in views:
                view_type_lower = (
                    view_type.lower() if isinstance(view_type, str) else "front"
                )
                if view_type_lower in direction_map:
                    direction, xdirection = direction_map[view_type_lower]
                    view = TechDraw.makeDrawViewPart(source_obj, page)
                    view.Direction = direction
                    view.XDirection = xdirection
                    page.addView(view)
                    created_views.append(
                        {
                            "name": view.Name,
                            "label": view.Label,
                            "type": view_type,
                            "direction": _format_point(direction),
                        }
                    )
        else:
            created_views = []

        _add_view_to_page(page, group, view_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": group.Name,
                "objectLabel": group.Label,
                "objectType": group.TypeId,
                "viewType": "ProjectionGroup",
                "sourceObject": source_obj.Label,
                "parentPage": page.Label,
                "scale": group.Scale if hasattr(group, "Scale") else 1.0,
                "views": created_views,
                "message": f"Created projection group for '{source_obj.Label}' on page '{page.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_detail_view(page_name, source_object, detail_point, view_name=None):
    """
    Create a detail (enlarged) view on a TechDraw page.

    Args:
        page_name: Name of the TechDraw page
        source_object: Source 3D object or object name
        detail_point: Center point of the detail view as dict/list/Vector
        view_name: Optional name for the view

    Returns:
        dict with success status, view info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        source_obj = _get_source_object(source_object)
        if source_obj is None:
            return {
                "success": False,
                "error": f"Source object '{source_object}' not found",
                "data": None,
            }

        detail_center = _parse_point(detail_point)

        parent_view = TechDraw.makeDrawViewPart(source_obj, page)
        page.addView(parent_view)

        detail = TechDraw.makeDrawViewDetail(parent_view)
        detail_detail = TechDraw.makeDrawViewDetail(parent_view)
        detail_detail.DetailOrigin = detail_center
        detail_detail.Scale = 2.0

        _add_view_to_page(page, detail_detail, view_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": detail_detail.Name,
                "objectLabel": detail_detail.Label,
                "objectType": detail_detail.TypeId,
                "viewType": "Detail",
                "sourceObject": source_obj.Label,
                "parentPage": page.Label,
                "detailPoint": _format_point(detail_center),
                "scale": detail_detail.Scale
                if hasattr(detail_detail, "Scale")
                else 2.0,
                "message": f"Created detail view at {_format_point(detail_center)} on page '{page.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# ============================================================================
# Dimension Tools
# ============================================================================


def _get_view_from_page(page_name, view_name):
    """Get a view from a page by name."""
    doc = App.ActiveDocument
    if doc is None:
        return None

    page = _get_techdraw_page(page_name)
    if page is None:
        return None

    for obj in doc.Objects:
        if hasattr(obj, "ParentPage") and obj.ParentPage == page:
            if obj.Name == view_name or obj.Label == view_name:
                return obj
    return None


def handle_create_linear_dimension(page_name, view_name, point1, point2):
    """
    Create a linear dimension on a TechDraw view.

    Args:
        page_name: Name of the TechDraw page
        view_name: Name of the view to add dimension to
        point1: First point as dict/list/Vector
        point2: Second point as dict/list/Vector

    Returns:
        dict with success status, dimension info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        view = _get_view_from_page(page_name, view_name)
        if view is None:
            return {
                "success": False,
                "error": f"View '{view_name}' not found on page '{page_name}'",
                "data": None,
            }

        p1 = _parse_point(point1)
        p2 = _parse_point(point2)

        dimension = TechDraw.makeLinearDim(page, p1, p2)
        page.addView(dimension)

        doc.recompute()

        distance = p1.distanceToPoint(p2)

        return {
            "success": True,
            "data": {
                "objectName": dimension.Name,
                "objectLabel": dimension.Label,
                "objectType": dimension.TypeId,
                "dimensionType": "Linear",
                "parentPage": page.Label,
                "parentView": view.Label,
                "startPoint": _format_point(p1),
                "endPoint": _format_point(p2),
                "measurement": round(distance, 2),
                "unit": "mm",
                "message": f"Created linear dimension: {round(distance, 2)}mm",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_radial_dimension(page_name, view_name, circle_name):
    """
    Create a radial (radius) dimension on a TechDraw view.

    Args:
        page_name: Name of the TechDraw page
        view_name: Name of the view to add dimension to
        circle_name: Name of the circle object or dict with center and radius

    Returns:
        dict with success status, dimension info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        view = _get_view_from_page(page_name, view_name)
        if view is None:
            return {
                "success": False,
                "error": f"View '{view_name}' not found on page '{page_name}'",
                "data": None,
            }

        radius = 0.0
        center = App.Vector(0, 0, 0)

        if isinstance(circle_name, dict):
            center = _parse_point(circle_name.get("center"))
            radius = float(circle_name.get("radius", 0))
        else:
            circle_obj = doc.getObject(circle_name)
            if circle_obj is None:
                return {
                    "success": False,
                    "error": f"Object '{circle_name}' not found",
                    "data": None,
                }

            if hasattr(circle_obj, "Radius"):
                radius = circle_obj.Radius
            elif hasattr(circle_obj, "Shape") and circle_obj.Shape.Radius:
                radius = circle_obj.Shape.Radius

            if hasattr(circle_obj, "Shape") and hasattr(circle_obj.Shape, "Center"):
                center = circle_obj.Shape.Center

        dimension = TechDraw.makeRadialDim(page, center, radius)
        page.addView(dimension)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": dimension.Name,
                "objectLabel": dimension.Label,
                "objectType": dimension.TypeId,
                "dimensionType": "Radial",
                "parentPage": page.Label,
                "parentView": view.Label,
                "measurement": round(radius, 2),
                "unit": "mm",
                "message": f"Created radial dimension: {round(radius, 2)}mm radius",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_diameter_dimension(page_name, view_name, circle_name):
    """
    Create a diameter dimension on a TechDraw view.

    Args:
        page_name: Name of the TechDraw page
        view_name: Name of the view to add dimension to
        circle_name: Name of the circle object or dict with center and radius

    Returns:
        dict with success status, dimension info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        view = _get_view_from_page(page_name, view_name)
        if view is None:
            return {
                "success": False,
                "error": f"View '{view_name}' not found on page '{page_name}'",
                "data": None,
            }

        radius = 0.0
        center = App.Vector(0, 0, 0)

        if isinstance(circle_name, dict):
            center = _parse_point(circle_name.get("center"))
            radius = float(circle_name.get("radius", 0))
        else:
            circle_obj = doc.getObject(circle_name)
            if circle_obj is None:
                return {
                    "success": False,
                    "error": f"Object '{circle_name}' not found",
                    "data": None,
                }

            if hasattr(circle_obj, "Radius"):
                radius = circle_obj.Radius
            elif hasattr(circle_obj, "Shape") and circle_obj.Shape.Radius:
                radius = circle_obj.Shape.Radius

            if hasattr(circle_obj, "Shape") and hasattr(circle_obj.Shape, "Center"):
                center = circle_obj.Shape.Center

        diameter = radius * 2

        dimension = TechDraw.makeDiameterDim(page, center, radius)
        page.addView(dimension)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": dimension.Name,
                "objectLabel": dimension.Label,
                "objectType": dimension.TypeId,
                "dimensionType": "Diameter",
                "parentPage": page.Label,
                "parentView": view.Label,
                "measurement": round(diameter, 2),
                "unit": "mm",
                "message": f"Created diameter dimension: {round(diameter, 2)}mm",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_angular_dimension(page_name, view_name, line1_name, line2_name):
    """
    Create an angular dimension between two lines on a TechDraw view.

    Args:
        page_name: Name of the TechDraw page
        view_name: Name of the view to add dimension to
        line1_name: First line object name or dict with points
        line2_name: Second line object name or dict with points

    Returns:
        dict with success status, dimension info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        view = _get_view_from_page(page_name, view_name)
        if view is None:
            return {
                "success": False,
                "error": f"View '{view_name}' not found on page '{page_name}'",
                "data": None,
            }

        p1_start = App.Vector(0, 0, 0)
        p1_end = App.Vector(1, 0, 0)
        p2_start = App.Vector(0, 0, 0)
        p2_end = App.Vector(0, 1, 0)

        if isinstance(line1_name, dict):
            p1_start = _parse_point(line1_name.get("start"))
            p1_end = _parse_point(line1_name.get("end"))
        else:
            line1_obj = doc.getObject(line1_name)
            if line1_obj is not None and hasattr(line1_obj, "Shape"):
                edges = line1_obj.Shape.Edges
                if edges:
                    p1_start = edges[0].Vertexes[0].Point
                    p1_end = edges[0].Vertexes[-1].Point

        if isinstance(line2_name, dict):
            p2_start = _parse_point(line2_name.get("start"))
            p2_end = _parse_point(line2_name.get("end"))
        else:
            line2_obj = doc.getObject(line2_name)
            if line2_obj is not None and hasattr(line2_obj, "Shape"):
                edges = line2_obj.Shape.Edges
                if edges:
                    p2_start = edges[0].Vertexes[0].Point
                    p2_end = edges[0].Vertexes[-1].Point

        dimension = TechDraw.makeAngularDim(page, p1_start, p1_end, p2_start, p2_end)
        page.addView(dimension)

        doc.recompute()

        angle_rad = 0.0
        if hasattr(dimension, "Angle"):
            angle_rad = dimension.Angle

        angle_deg = round(math.degrees(angle_rad), 2)

        return {
            "success": True,
            "data": {
                "objectName": dimension.Name,
                "objectLabel": dimension.Label,
                "objectType": dimension.TypeId,
                "dimensionType": "Angular",
                "parentPage": page.Label,
                "parentView": view.Label,
                "line1": _format_point(p1_start),
                "line2": _format_point(p2_start),
                "measurement": angle_deg,
                "unit": "deg",
                "message": f"Created angular dimension: {angle_deg}deg",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# ============================================================================
# Annotations
# ============================================================================


def handle_create_text_annotation(page_name, text, position, name=None):
    """
    Create a text annotation on a TechDraw page.

    Args:
        page_name: Name of the TechDraw page
        text: Text string to display
        position: Position as dict/list/Vector
        name: Optional name for the annotation

    Returns:
        dict with success status, annotation info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        pos = _parse_point(position)

        annotation = TechDraw.makeText(text, pos)
        page.addView(annotation)

        if name:
            annotation.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": annotation.Name,
                "objectLabel": annotation.Label,
                "objectType": annotation.TypeId,
                "text": text,
                "position": _format_point(pos),
                "parentPage": page.Label,
                "message": f"Created text annotation '{annotation.Label}': '{text}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_balloon_annotation(
    page_name, text, position, target_object, name=None
):
    """
    Create a balloon annotation on a TechDraw page.

    Args:
        page_name: Name of the TechDraw page
        text: Text to display in the balloon
        position: Position as dict/list/Vector
        target_object: Target object or object name for the balloon reference
        name: Optional name for the annotation

    Returns:
        dict with success status, annotation info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        pos = _parse_point(position)

        balloon = TechDraw.makeBalloon()
        balloon.Text = text
        balloon.Y = pos.y
        balloon.X = pos.x

        page.addView(balloon)

        if name:
            balloon.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": balloon.Name,
                "objectLabel": balloon.Label,
                "objectType": balloon.TypeId,
                "text": text,
                "position": _format_point(pos),
                "parentPage": page.Label,
                "message": f"Created balloon annotation '{balloon.Label}': '{text}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_leader_line(page_name, start_point, end_point, name=None):
    """
    Create a leader line on a TechDraw page.

    Args:
        page_name: Name of the TechDraw page
        start_point: Start point as dict/list/Vector
        end_point: End point as dict/list/Vector
        name: Optional name for the leader line

    Returns:
        dict with success status, leader line info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        start = _parse_point(start_point)
        end = _parse_point(end_point)

        leader = TechDraw.makeLeader()
        leader.StartPoint = start
        leader.EndPoint = end

        page.addView(leader)

        if name:
            leader.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": leader.Name,
                "objectLabel": leader.Label,
                "objectType": leader.TypeId,
                "startPoint": _format_point(start),
                "endPoint": _format_point(end),
                "parentPage": page.Label,
                "message": f"Created leader line '{leader.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# ============================================================================
# Export
# ============================================================================


def handle_export_to_svg(page_name, file_path):
    """
    Export a TechDraw page to SVG format.

    Args:
        page_name: Name of the TechDraw page
        file_path: Output file path for the SVG

    Returns:
        dict with success status, export info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        if not file_path:
            return {"success": False, "error": "file_path is required", "data": None}

        svg_path = file_path
        if not svg_path.lower().endswith(".svg"):
            svg_path = svg_path + ".svg"

        page.exportToSvg(svg_path)

        return {
            "success": True,
            "data": {
                "pageName": page.Label,
                "outputPath": svg_path,
                "format": "SVG",
                "message": f"Exported page '{page.Label}' to {svg_path}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_export_to_pdf(page_name, file_path):
    """
    Export a TechDraw page to PDF format.

    Args:
        page_name: Name of the TechDraw page
        file_path: Output file path for the PDF

    Returns:
        dict with success status, export info, and message
    """
    try:
        if TechDraw is None:
            return {
                "success": False,
                "error": "TechDraw module not available",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        page = _get_techdraw_page(page_name)
        if page is None:
            return {
                "success": False,
                "error": f"TechDraw page '{page_name}' not found",
                "data": None,
            }

        if not file_path:
            return {"success": False, "error": "file_path is required", "data": None}

        pdf_path = file_path
        if not pdf_path.lower().endswith(".pdf"):
            pdf_path = pdf_path + ".pdf"

        page.exportToPdf(pdf_path)

        return {
            "success": True,
            "data": {
                "pageName": page.Label,
                "outputPath": pdf_path,
                "format": "PDF",
                "message": f"Exported page '{page.Label}' to {pdf_path}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


handle_get_page_list = handle_list_drawing_pages
handle_delete_page = handle_delete_drawing_page
handle_get_page_properties = handle_get_drawing_page_properties


__all__ = [
    "handle_create_drawing_page",
    "handle_list_drawing_pages",
    "handle_delete_drawing_page",
    "handle_get_drawing_page_properties",
    "handle_create_view",
    "handle_create_isometric_view",
    "handle_create_front_view",
    "handle_create_top_view",
    "handle_create_side_view",
    "handle_create_section_view",
    "handle_create_projection_group",
    "handle_create_detail_view",
    "handle_create_linear_dimension",
    "handle_create_radial_dimension",
    "handle_create_diameter_dimension",
    "handle_create_angular_dimension",
    "handle_create_text_annotation",
    "handle_create_balloon_annotation",
    "handle_create_leader_line",
    "handle_export_to_svg",
    "handle_export_to_pdf",
    "handle_get_page_list",
    "handle_delete_page",
    "handle_get_page_properties",
]
