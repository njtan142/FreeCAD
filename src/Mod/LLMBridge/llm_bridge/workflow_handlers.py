# SPDX-License-Identifier: LGPL-2.1-or-later
# Workflow Handlers
#
# Provides handlers for workflow operations:
# - Undo/redo operations
# - Visibility management
# - Selection management
# Each handler returns JSON-serializable structures.

import FreeCAD as App


def handle_undo():
    """
    Undo the last operation.

    Returns:
        dict with success status and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if doc.Undo():
            return {
                "success": True,
                "data": {
                    "success": True,
                    "undoneObject": doc.Name,
                    "documentName": doc.Name,
                    "message": "Undid last operation",
                },
            }
        else:
            return {"success": False, "error": "Nothing to undo", "data": None}
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_redo():
    """
    Redo the last undone operation.

    Returns:
        dict with success status and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if doc.Redo():
            return {
                "success": True,
                "data": {
                    "success": True,
                    "redoneObject": doc.Name,
                    "documentName": doc.Name,
                    "message": "Redid last undone operation",
                },
            }
        else:
            return {"success": False, "error": "Nothing to redo", "data": None}
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_undo_stack_size():
    """
    Get the current undo/redo stack depth.

    Returns:
        dict with success status and stack sizes
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        undo_size = doc.UndoSize()
        redo_size = doc.RedoSize()
        return {
            "success": True,
            "data": {
                "success": True,
                "undoSize": undo_size,
                "redoSize": redo_size,
                "canUndo": undo_size > 0,
                "canRedo": redo_size > 0,
                "documentName": doc.Name,
                "message": f"Undo stack contains {undo_size} operation(s), redo stack contains {redo_size}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_show_object(obj_name):
    """
    Show a hidden object.

    Args:
        obj_name: Name of the object to show

    Returns:
        dict with success status and message
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

        obj.ViewObject.Visibility = True

        return {
            "success": True,
            "data": {
                "success": True,
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "visible": True,
                "documentName": doc.Name,
                "message": f"Object '{obj.Label}' is now visible",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_hide_object(obj_name):
    """
    Hide an object.

    Args:
        obj_name: Name of the object to hide

    Returns:
        dict with success status and message
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

        obj.ViewObject.Visibility = False

        return {
            "success": True,
            "data": {
                "success": True,
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "visible": False,
                "documentName": doc.Name,
                "message": f"Object '{obj.Label}' is now hidden",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_toggle_visibility(obj_name):
    """
    Toggle visibility state of an object.

    Args:
        obj_name: Name of the object to toggle

    Returns:
        dict with success status and new visibility state
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

        obj.ViewObject.Visibility = not obj.ViewObject.Visibility

        return {
            "success": True,
            "data": {
                "success": True,
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "visible": obj.ViewObject.Visibility,
                "documentName": doc.Name,
                "message": f"Object '{obj.Label}' is now {'visible' if obj.ViewObject.Visibility else 'hidden'}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_show_all():
    """
    Show all objects in the document.

    Returns:
        dict with success status and count of objects shown
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        count = 0
        for obj in doc.Objects:
            if hasattr(obj, "ViewObject") and obj.ViewObject:
                obj.ViewObject.Visibility = True
                count += 1

        return {
            "success": True,
            "data": {
                "documentName": doc.Name,
                "objectsShown": count,
                "message": f"Shown {count} object(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_hide_all():
    """
    Hide all objects in the document.

    Returns:
        dict with success status and count of objects hidden
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        count = 0
        for obj in doc.Objects:
            if hasattr(obj, "ViewObject") and obj.ViewObject:
                obj.ViewObject.Visibility = False
                count += 1

        return {
            "success": True,
            "data": {
                "documentName": doc.Name,
                "objectsHidden": count,
                "message": f"Hidden {count} object(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_visible_objects():
    """
    List currently visible objects in the document.

    Returns:
        dict with success status and list of visible objects
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        visible_objects = []
        for obj in doc.Objects:
            if (
                hasattr(obj, "ViewObject")
                and obj.ViewObject
                and obj.ViewObject.Visibility
            ):
                visible_objects.append(
                    {"name": obj.Name, "label": obj.Label, "type": obj.TypeId}
                )

        return {
            "success": True,
            "data": {
                "success": True,
                "count": len(visible_objects),
                "objects": visible_objects,
                "documentName": doc.Name,
                "message": f"Found {len(visible_objects)} visible object(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_object_visibility(obj_name, visible):
    """
    Set visibility state of an object explicitly.

    Args:
        obj_name: Name of the object
        visible: Boolean visibility state

    Returns:
        dict with success status and message
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

        obj.ViewObject.Visibility = bool(visible)

        return {
            "success": True,
            "data": {
                "success": True,
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "visible": obj.ViewObject.Visibility,
                "documentName": doc.Name,
                "message": f"Object '{obj.Label}' set to {'visible' if obj.ViewObject.Visibility else 'hidden'}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_select_object(obj_name):
    """
    Select an object.

    Args:
        obj_name: Name of the object to select

    Returns:
        dict with success status and selection info
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

        import FreeCADGui as Gui

        Gui.Selection.clearSelection()
        Gui.Selection.addSelection(obj)

        return {
            "success": True,
            "data": {
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "documentName": doc.Name,
                "message": f"Selected object '{obj.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_deselect_object(obj_name):
    """
    Deselect an object.

    Args:
        obj_name: Name of the object to deselect

    Returns:
        dict with success status and message
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

        import FreeCADGui as Gui

        Gui.Selection.removeSelection(obj)

        return {
            "success": True,
            "data": {
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "documentName": doc.Name,
                "message": f"Deselected object '{obj.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_select_all():
    """
    Select all objects in the document.

    Returns:
        dict with success status and count of selected objects
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        import FreeCADGui as Gui

        Gui.Selection.clearSelection()

        count = 0
        for obj in doc.Objects:
            if hasattr(obj, "Shape") or hasattr(obj, "ViewObject"):
                Gui.Selection.addSelection(obj)
                count += 1

        return {
            "success": True,
            "data": {
                "documentName": doc.Name,
                "objectsSelected": count,
                "message": f"Selected {count} object(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_clear_selection():
    """
    Clear the current selection.

    Returns:
        dict with success status and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        import FreeCADGui as Gui

        Gui.Selection.clearSelection()

        return {
            "success": True,
            "data": {"documentName": doc.Name, "message": "Selection cleared"},
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_is_selected(obj_name):
    """
    Check if an object is selected.

    Args:
        obj_name: Name of the object to check

    Returns:
        dict with success status and selection state
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

        import FreeCADGui as Gui

        is_selected = Gui.Selection.isSelected(obj)

        return {
            "success": True,
            "data": {
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "isSelected": is_selected,
                "documentName": doc.Name,
                "message": f"Object '{obj.Label}' is {'selected' if is_selected else 'not selected'}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_undo",
    "handle_redo",
    "handle_get_undo_stack_size",
    "handle_show_object",
    "handle_hide_object",
    "handle_toggle_visibility",
    "handle_show_all",
    "handle_hide_all",
    "handle_get_visible_objects",
    "handle_set_object_visibility",
    "handle_select_object",
    "handle_deselect_object",
    "handle_select_all",
    "handle_clear_selection",
    "handle_is_selected",
]
