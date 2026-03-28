# SPDX-License-Identifier: LGPL-2.1-or-later
# PartDesign Feature Handlers
#
# Provides handlers for PartDesign feature operations:
# - Create pad (extrude)
# - Create pocket (cut)
# - Create revolution (revolve)
# - Create groove (revolved cut)
# - Create fillet
# - Create chamfer
# - Create body
# - Set active body
# - List bodies
# - Update feature
# - Replace sketch
# - Delete feature
# Each handler returns JSON-serializable structures.

import FreeCAD as App


def handle_create_pad(sketch_name, length=None, name=None, body_name=None):
    """
    Create a pad (extrusion) feature from a sketch.

    Args:
        sketch_name: Name of the sketch to pad
        length: Length of the pad (default: 10mm)
        name: Optional name for the pad feature
        body_name: Optional name of the body to add the feature to

    Returns:
        dict with success status, feature info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        import PartDesign

        sketch = doc.getObject(sketch_name)
        if sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{sketch_name}' not found",
                "data": None
            }

        # Find or use specified body
        body = None
        if body_name:
            body = doc.getObject(body_name)
            if not body:
                return {
                    "success": False,
                    "error": f"Body '{body_name}' not found",
                    "data": None
                }
        else:
            # Find the first PartDesign::Body or use active body
            for obj in doc.Objects:
                if obj.TypeId == 'PartDesign::Body':
                    body = obj
                    break
            
            # Auto-create body if none exists
            if not body:
                body = doc.addObject('PartDesign::Body', 'Body')
                doc.recompute()

        # Create the pad feature
        if name:
            pad = doc.addObject('PartDesign::Pad', name)
        else:
            pad = doc.addObject('PartDesign::Pad', 'Pad')

        # Set the sketch as support
        pad.Profile = sketch
        pad.Length = length if length else 10.0

        # Add to body if specified
        if body:
            body.addObject(pad)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": pad.Name,
                "featureLabel": pad.Label,
                "featureType": pad.TypeId,
                "documentName": doc.Name,
                "sketchName": sketch.Name,
                "length": pad.Length,
                "bodyName": body.Name if body else None,
                "message": f"Created pad '{pad.Label}' with length {pad.Length:.2f}mm"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_create_pocket(sketch_name, length=None, name=None, body_name=None):
    """
    Create a pocket (cut) feature from a sketch.

    Args:
        sketch_name: Name of the sketch to use for the pocket
        length: Depth of the pocket (default: 10mm)
        name: Optional name for the pocket feature
        body_name: Optional name of the body to add the feature to

    Returns:
        dict with success status, feature info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        import PartDesign

        sketch = doc.getObject(sketch_name)
        if sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{sketch_name}' not found",
                "data": None
            }

        # Find or use specified body
        body = None
        if body_name:
            body = doc.getObject(body_name)
            if not body:
                return {
                    "success": False,
                    "error": f"Body '{body_name}' not found",
                    "data": None
                }
        else:
            # Find the first PartDesign::Body or use active body
            for obj in doc.Objects:
                if obj.TypeId == 'PartDesign::Body':
                    body = obj
                    break
            
            # Auto-create body if none exists
            if not body:
                body = doc.addObject('PartDesign::Body', 'Body')
                doc.recompute()

        # Create the pocket feature
        if name:
            pocket = doc.addObject('PartDesign::Pocket', name)
        else:
            pocket = doc.addObject('PartDesign::Pocket', 'Pocket')

        # Set the sketch as support
        pocket.Profile = sketch
        pocket.Length = length if length else 10.0

        # Add to body if specified
        if body:
            body.addObject(pocket)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": pocket.Name,
                "featureLabel": pocket.Label,
                "featureType": pocket.TypeId,
                "documentName": doc.Name,
                "sketchName": sketch.Name,
                "length": pocket.Length,
                "bodyName": body.Name if body else None,
                "message": f"Created pocket '{pocket.Label}' with depth {pocket.Length:.2f}mm"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_create_revolution(sketch_name, axis='Vertical', angle=360, name=None, body_name=None):
    """
    Create a revolution (revolve) feature from a sketch.

    Args:
        sketch_name: Name of the sketch to revolve
        axis: Axis of revolution - "Vertical", "Horizontal", or "Custom"
        angle: Angle of revolution in degrees (default: 360)
        name: Optional name for the revolution feature
        body_name: Optional name of the body to add the feature to

    Returns:
        dict with success status, feature info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        import PartDesign
        from FreeCAD import Vector

        sketch = doc.getObject(sketch_name)
        if sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{sketch_name}' not found",
                "data": None
            }

        # Find or use specified body
        body = None
        if body_name:
            body = doc.getObject(body_name)
            if not body:
                return {
                    "success": False,
                    "error": f"Body '{body_name}' not found",
                    "data": None
                }
        else:
            # Find the first PartDesign::Body or use active body
            for obj in doc.Objects:
                if obj.TypeId == 'PartDesign::Body':
                    body = obj
                    break
            
            # Auto-create body if none exists
            if not body:
                body = doc.addObject('PartDesign::Body', 'Body')
                doc.recompute()

        # Create the revolution feature
        if name:
            revolution = doc.addObject('PartDesign::Revolution', name)
        else:
            revolution = doc.addObject('PartDesign::Revolution', 'Revolution')

        # Set the sketch as support
        revolution.Profile = sketch

        # Set axis based on parameter
        axis_map = {
            'Vertical': (0, 1, 0),
            'Horizontal': (1, 0, 0),
            'Custom': (0, 0, 1)  # Z-axis as default custom
        }
        axis_vector = axis_map.get(axis, (0, 1, 0))
        revolution.Axis = axis_vector
        revolution.Angle = angle

        # Add to body if specified
        if body:
            body.addObject(revolution)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": revolution.Name,
                "featureLabel": revolution.Label,
                "featureType": revolution.TypeId,
                "documentName": doc.Name,
                "sketchName": sketch.Name,
                "axis": axis,
                "angle": revolution.Angle,
                "bodyName": body.Name if body else None,
                "message": f"Created revolution '{revolution.Label}' with angle {revolution.Angle:.2f} degrees"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_create_groove(sketch_name, axis='Vertical', angle=360, name=None, body_name=None):
    """
    Create a groove (revolved cut) feature from a sketch.

    Args:
        sketch_name: Name of the sketch to use for the groove
        axis: Axis of revolution - "Vertical", "Horizontal", or "Custom"
        angle: Angle of revolution in degrees (default: 360)
        name: Optional name for the groove feature
        body_name: Optional name of the body to add the feature to

    Returns:
        dict with success status, feature info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        import PartDesign
        from FreeCAD import Vector

        sketch = doc.getObject(sketch_name)
        if sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{sketch_name}' not found",
                "data": None
            }

        # Find or use specified body
        body = None
        if body_name:
            body = doc.getObject(body_name)
            if not body:
                return {
                    "success": False,
                    "error": f"Body '{body_name}' not found",
                    "data": None
                }
        else:
            # Find the first PartDesign::Body or use active body
            for obj in doc.Objects:
                if obj.TypeId == 'PartDesign::Body':
                    body = obj
                    break
            
            # Auto-create body if none exists
            if not body:
                body = doc.addObject('PartDesign::Body', 'Body')
                doc.recompute()

        # Create the groove feature
        if name:
            groove = doc.addObject('PartDesign::Groove', name)
        else:
            groove = doc.addObject('PartDesign::Groove', 'Groove')

        # Set the sketch as support
        groove.Profile = sketch

        # Set axis based on parameter
        axis_map = {
            'Vertical': (0, 1, 0),
            'Horizontal': (1, 0, 0),
            'Custom': (0, 0, 1)  # Z-axis as default custom
        }
        axis_vector = axis_map.get(axis, (0, 1, 0))
        groove.Axis = axis_vector
        groove.Angle = angle

        # Add to body if specified
        if body:
            body.addObject(groove)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": groove.Name,
                "featureLabel": groove.Label,
                "featureType": groove.TypeId,
                "documentName": doc.Name,
                "sketchName": sketch.Name,
                "axis": axis,
                "angle": groove.Angle,
                "bodyName": body.Name if body else None,
                "message": f"Created groove '{groove.Label}' with angle {groove.Angle:.2f} degrees"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_create_fillet(feature_name, radius, edges=None, name=None):
    """
    Create a fillet feature on edges.

    Args:
        feature_name: Name of the base feature to fillet
        radius: Radius of the fillet
        edges: List of edge indices to fillet, or "all" for all edges
        name: Optional name for the fillet feature

    Returns:
        dict with success status, feature info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        import PartDesign

        base_feature = doc.getObject(feature_name)
        if base_feature is None:
            return {
                "success": False,
                "error": f"Feature '{feature_name}' not found",
                "data": None
            }

        # Validate edges - must be provided
        if edges is None:
            return {
                "success": False,
                "error": "Edges parameter is required. Provide a list of edge indices or 'all' for all edges.",
                "data": None
            }

        # Handle "all" edges
        if edges == "all":
            if not hasattr(base_feature, 'Shape') or not base_feature.Shape:
                return {
                    "success": False,
                    "error": f"Feature '{feature_name}' has no shape to extract edges from",
                    "data": None
                }
            edges = list(range(len(base_feature.Shape.Edges)))
        
        # Validate edges list is not empty
        if not edges or len(edges) == 0:
            return {
                "success": False,
                "error": "At least one edge must be specified for fillet",
                "data": None
            }

        # Create the fillet feature
        if name:
            fillet = doc.addObject('PartDesign::Fillet', name)
        else:
            fillet = doc.addObject('PartDesign::Fillet', 'Fillet')

        # Set the base feature
        fillet.Base = (base_feature, [])

        # Add edges to fillet
        for edge_idx in edges:
            fillet.addRefEdge((base_feature, f"Edge{edge_idx}"))

        # Set fillet radius
        fillet.Radius = radius

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": fillet.Name,
                "featureLabel": fillet.Label,
                "featureType": fillet.TypeId,
                "documentName": doc.Name,
                "baseFeature": base_feature.Name,
                "radius": fillet.Radius,
                "edgesCount": len(edges),
                "message": f"Created fillet '{fillet.Label}' with radius {fillet.Radius:.2f}mm on {len(edges)} edge(s)"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_create_chamfer(feature_name, size, edges=None, name=None):
    """
    Create a chamfer feature on edges.

    Args:
        feature_name: Name of the base feature to chamfer
        size: Size of the chamfer
        edges: List of edge indices to chamfer, or "all" for all edges
        name: Optional name for the chamfer feature

    Returns:
        dict with success status, feature info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        import PartDesign

        base_feature = doc.getObject(feature_name)
        if base_feature is None:
            return {
                "success": False,
                "error": f"Feature '{feature_name}' not found",
                "data": None
            }

        # Validate edges - must be provided
        if edges is None:
            return {
                "success": False,
                "error": "Edges parameter is required. Provide a list of edge indices or 'all' for all edges.",
                "data": None
            }

        # Handle "all" edges
        if edges == "all":
            if not hasattr(base_feature, 'Shape') or not base_feature.Shape:
                return {
                    "success": False,
                    "error": f"Feature '{feature_name}' has no shape to extract edges from",
                    "data": None
                }
            edges = list(range(len(base_feature.Shape.Edges)))
        
        # Validate edges list is not empty
        if not edges or len(edges) == 0:
            return {
                "success": False,
                "error": "At least one edge must be specified for chamfer",
                "data": None
            }

        # Create the chamfer feature
        if name:
            chamfer = doc.addObject('PartDesign::Chamfer', name)
        else:
            chamfer = doc.addObject('PartDesign::Chamfer', 'Chamfer')

        # Set the base feature
        chamfer.Base = (base_feature, [])

        # Add edges to chamfer
        for edge_idx in edges:
            chamfer.addRefEdge((base_feature, f"Edge{edge_idx}"))

        # Set chamfer size
        chamfer.Size = size

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": chamfer.Name,
                "featureLabel": chamfer.Label,
                "featureType": chamfer.TypeId,
                "documentName": doc.Name,
                "baseFeature": base_feature.Name,
                "size": chamfer.Size,
                "edgesCount": len(edges),
                "message": f"Created chamfer '{chamfer.Label}' with size {chamfer.Size:.2f}mm on {len(edges)} edge(s)"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_create_body(name=None):
    """
    Create a new PartDesign Body.

    Args:
        name: Optional name for the body

    Returns:
        dict with success status, body info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        import PartDesign

        # Create the body
        if name:
            body = doc.addObject('PartDesign::Body', name)
        else:
            body = doc.addObject('PartDesign::Body', 'Body')

        doc.recompute()

        return {
            "success": True,
            "data": {
                "bodyName": body.Name,
                "bodyLabel": body.Label,
                "documentName": doc.Name,
                "message": f"Created body '{body.Label}'"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_set_active_body(body_name):
    """
    Set the active body in the document.

    Args:
        body_name: Name of the body to set as active

    Returns:
        dict with success status, body info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        import PartDesign

        body = doc.getObject(body_name)
        if body is None:
            return {
                "success": False,
                "error": f"Body '{body_name}' not found",
                "data": None
            }

        if body.TypeId != 'PartDesign::Body':
            return {
                "success": False,
                "error": f"Object '{body_name}' is not a PartDesign::Body",
                "data": None
            }

        # Set as active body using PartDesign workbench
        import PartDesignGui
        PartDesignGui.setActiveBody(body)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "bodyName": body.Name,
                "bodyLabel": body.Label,
                "documentName": doc.Name,
                "isActive": True,
                "message": f"Set body '{body.Label}' as active"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_list_bodies():
    """
    List all PartDesign bodies in the document.

    Returns:
        dict with success status, list of bodies, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        bodies = []
        for obj in doc.Objects:
            if obj.TypeId == 'PartDesign::Body':
                body_info = {
                    "name": obj.Name,
                    "label": obj.Label,
                    "isActive": _is_active_body(obj),
                    "featuresCount": len(obj.Group) if hasattr(obj, 'Group') else 0
                }
                bodies.append(body_info)

        return {
            "success": True,
            "data": {
                "documentName": doc.Name,
                "bodiesCount": len(bodies),
                "bodies": bodies,
                "message": f"Found {len(bodies)} body(ies) in document"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_update_feature(feature_name, properties):
    """
    Update properties of an existing feature.

    Args:
        feature_name: Name of the feature to update
        properties: Dictionary of property names and values to update

    Returns:
        dict with success status, feature info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        feature = doc.getObject(feature_name)
        if feature is None:
            return {
                "success": False,
                "error": f"Feature '{feature_name}' not found",
                "data": None
            }

        updated_properties = []
        for prop_name, prop_value in properties.items():
            if hasattr(feature, prop_name):
                old_value = getattr(feature, prop_name)
                setattr(feature, prop_name, prop_value)
                updated_properties.append({
                    "name": prop_name,
                    "oldValue": old_value,
                    "newValue": prop_value
                })
            else:
                return {
                    "success": False,
                    "error": f"Property '{prop_name}' not found on feature '{feature_name}'",
                    "data": None
                }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": feature.Name,
                "featureLabel": feature.Label,
                "featureType": feature.TypeId,
                "documentName": doc.Name,
                "updatedProperties": updated_properties,
                "message": f"Updated {len(updated_properties)} property(ies) on feature '{feature.Label}'"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_replace_sketch(feature_name, new_sketch_name):
    """
    Replace the sketch used by a feature with a new sketch.

    Args:
        feature_name: Name of the feature using the old sketch
        new_sketch_name: Name of the new sketch to use

    Returns:
        dict with success status, feature info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        feature = doc.getObject(feature_name)
        if feature is None:
            return {
                "success": False,
                "error": f"Feature '{feature_name}' not found",
                "data": None
            }

        new_sketch = doc.getObject(new_sketch_name)
        if new_sketch is None:
            return {
                "success": False,
                "error": f"Sketch '{new_sketch_name}' not found",
                "data": None
            }

        # Get old sketch name for reporting
        old_sketch_name = None
        if hasattr(feature, 'Profile') and feature.Profile:
            old_sketch_name = feature.Profile.Name

        # Replace the sketch
        feature.Profile = new_sketch

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": feature.Name,
                "featureLabel": feature.Label,
                "featureType": feature.TypeId,
                "documentName": doc.Name,
                "oldSketchName": old_sketch_name,
                "newSketchName": new_sketch.Name,
                "message": f"Replaced sketch on feature '{feature.Label}' from '{old_sketch_name}' to '{new_sketch.Label}'"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None
        }


def handle_delete_feature(feature_name):
    """
    Delete a feature from the document.

    Args:
        feature_name: Name of the feature to delete

    Returns:
        dict with success status, deleted feature info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None
            }

        feature = doc.getObject(feature_name)
        if feature is None:
            return {
                "success": False,
                "error": f"Feature '{feature_name}' not found",
                "data": None
            }

        # Get feature info before deletion
        feature_type = feature.TypeId
        feature_label = feature.Label

        # Delete the feature
        doc.removeObject(feature_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "featureName": feature_name,
                "featureLabel": feature_label,
                "featureType": feature_type,
                "documentName": doc.Name,
                "message": f"Deleted feature '{feature_label}' ({feature_type})"
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

def _is_active_body(body):
    """
    Check if a body is the active body.

    Args:
        body: The body object to check

    Returns:
        bool: True if the body is active
    """
    try:
        import PartDesignGui
        active_body = PartDesignGui.getActiveBody()
        return active_body == body
    except Exception:
        return False


# Export all handlers for easy import
__all__ = [
    'handle_create_pad',
    'handle_create_pocket',
    'handle_create_revolution',
    'handle_create_groove',
    'handle_create_fillet',
    'handle_create_chamfer',
    'handle_create_body',
    'handle_set_active_body',
    'handle_list_bodies',
    'handle_update_feature',
    'handle_replace_sketch',
    'handle_delete_feature',
]
