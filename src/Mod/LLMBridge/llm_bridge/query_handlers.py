# SPDX-License-Identifier: LGPL-2.1-or-later
# Query Handlers for Enhanced Model Query Tools
#
# Provides structured query handlers for document introspection.
# Each handler returns JSON-serializable structures.

import json

import FreeCAD as App


def handle_document_overview() -> dict:
    """
    Get an overview of the active document.
    
    Returns:
        dict with document name, label, object count, and list of objects
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }
        
        objects = []
        for obj in doc.Objects:
            obj_info = {
                "name": obj.Name,
                "label": obj.Label,
                "type": obj.TypeId,
            }
            # Add visibility if GUI is available
            try:
                import FreeCADGui as Gui
                gui_obj = Gui.getDocument(doc.Name).getObject(obj.Name)
                if gui_obj:
                    obj_info["visibility"] = gui_obj.Visibility
            except Exception:
                obj_info["visibility"] = None
            
            objects.append(obj_info)
        
        return {
            "success": True,
            "data": {
                "name": doc.Name,
                "label": doc.Label,
                "objectCount": len(doc.Objects),
                "objects": objects
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_object_details(object_name: str) -> dict:
    """
    Get detailed information about a specific object.
    
    Args:
        object_name: Name of the object to query
        
    Returns:
        dict with object properties including placement, dimensions, color
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }
        
        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None
            }
        
        # Base properties
        result = {
            "name": obj.Name,
            "label": obj.Label,
            "type": obj.TypeId,
            "properties": {}
        }
        
        # Get placement if available
        if hasattr(obj, "Placement"):
            placement = obj.Placement
            result["properties"]["placement"] = {
                "position": {
                    "x": placement.Base.x,
                    "y": placement.Base.y,
                    "z": placement.Base.z
                },
                "rotation": {
                    "axis": {
                        "x": placement.Rotation.Axis.x,
                        "y": placement.Rotation.Axis.y,
                        "z": placement.Rotation.Axis.z
                    },
                    "angle": placement.Rotation.Angle
                }
            }
        
        # Get dimensions for shape objects
        if hasattr(obj, "Shape") and obj.Shape:
            shape = obj.Shape
            try:
                result["properties"]["dimensions"] = {
                    "boundingBox": {
                        "minX": shape.BoundBox.XMin,
                        "minY": shape.BoundBox.YMin,
                        "minZ": shape.BoundBox.ZMin,
                        "maxX": shape.BoundBox.XMax,
                        "maxY": shape.BoundBox.YMax,
                        "maxZ": shape.BoundBox.ZMax,
                    },
                    "volume": shape.Volume,
                    "area": shape.Area
                }
            except Exception:
                result["properties"]["dimensions"] = None
        
        # Get color if available (via GUI)
        try:
            import FreeCADGui as Gui
            gui_doc = Gui.getDocument(doc.Name)
            if gui_doc:
                gui_obj = gui_doc.getObject(object_name)
                if gui_obj and hasattr(gui_obj, "ShapeColor"):
                    result["properties"]["color"] = {
                        "r": gui_obj.ShapeColor[0],
                        "g": gui_obj.ShapeColor[1],
                        "b": gui_obj.ShapeColor[2],
                        "a": gui_obj.ShapeColor[3] if len(gui_obj.ShapeColor) > 3 else 1.0
                    }
        except Exception:
            pass
        
        # Get common properties
        common_props = ["Width", "Height", "Length", "Radius", "Angle"]
        for prop in common_props:
            if hasattr(obj, prop):
                result["properties"][prop.lower()] = getattr(obj, prop)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_selection() -> dict:
    """
    Get currently selected objects in the viewport.
    
    Returns:
        dict with list of selected objects
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }
        
        selected = []
        
        try:
            import FreeCADGui as Gui
            gui_doc = Gui.getDocument(doc.Name)
            if gui_doc:
                selection = gui_doc.getSelection()
                for sel in selection:
                    selected.append({
                        "name": sel.Object.Name if hasattr(sel, 'Object') else None,
                        "label": sel.Object.Label if hasattr(sel, 'Object') else None,
                        "type": sel.Object.TypeId if hasattr(sel, 'Object') else None,
                        "subElement": sel.SubElementNames if hasattr(sel, 'SubElementNames') else None
                    })
        except Exception:
            # GUI not available or no selection
            pass
        
        return {
            "success": True,
            "data": {
                "count": len(selected),
                "selected": selected
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_dependencies(object_name: str) -> dict:
    """
    Get dependencies and parent-child relationships for an object.
    
    Args:
        object_name: Name of the object to query
        
    Returns:
        dict with in-dependencies (parents) and out-dependencies (children)
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }
        
        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None
            }
        
        # Get objects that this object depends on (InList)
        in_deps = []
        for dep in obj.InList:
            in_deps.append({
                "name": dep.Name,
                "label": dep.Label,
                "type": dep.TypeId
            })
        
        # Get objects that depend on this object (OutList)
        out_deps = []
        for dep in obj.OutList:
            out_deps.append({
                "name": dep.Name,
                "label": dep.Label,
                "type": dep.TypeId
            })
        
        return {
            "success": True,
            "data": {
                "object": object_name,
                "dependencies": {
                    "dependsOn": in_deps,  # Objects this one depends on
                    "usedBy": out_deps     # Objects that depend on this one
                }
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_list_objects() -> dict:
    """
    List all objects in the active document.
    
    Returns:
        dict with array of objects (name, label, type, visibility)
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }
        
        objects = []
        for obj in doc.Objects:
            obj_info = {
                "name": obj.Name,
                "label": obj.Label,
                "type": obj.TypeId,
                "visibility": None
            }
            
            # Try to get visibility from GUI
            try:
                import FreeCADGui as Gui
                gui_doc = Gui.getDocument(doc.Name)
                if gui_doc:
                    gui_obj = gui_doc.getObject(obj.Name)
                    if gui_obj and hasattr(gui_obj, "Visibility"):
                        obj_info["visibility"] = gui_obj.Visibility
            except Exception:
                pass
            
            objects.append(obj_info)
        
        return {
            "success": True,
            "data": {
                "count": len(objects),
                "objects": objects
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_get_object_properties(object_name: str) -> dict:
    """
    Get detailed properties of a specific object.
    
    Args:
        object_name: Name of the object
        
    Returns:
        dict with comprehensive object properties
    """
    # This is essentially the same as handle_object_details
    # but named to match the tool name
    return handle_object_details(object_name)


def handle_get_document_info() -> dict:
    """
    Get document metadata.
    
    Returns:
        dict with document info (name, label, modified, objectCount, filePath)
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }
        
        return {
            "success": True,
            "data": {
                "name": doc.Name,
                "label": doc.Label,
                "objectCount": len(doc.Objects),
                "modified": doc.Modified,
                "filePath": doc.FileName if hasattr(doc, 'FileName') else None
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


# Export all handlers for easy import
__all__ = [
    'handle_document_overview',
    'handle_object_details',
    'handle_selection',
    'handle_dependencies',
    'handle_list_objects',
    'handle_get_object_properties',
    'handle_get_document_info',
]
