# SPDX-License-Identifier: LGPL-2.1-or-later
# BIM/Arch Handlers for FreeCAD BIM Workbench Operations
#
# Provides handlers for BIM/Arch workbench operations:
# - Building structure creation (Sites, Buildings, Floors/Levels)
# - Architectural elements (Walls, Windows, Doors, Roofs, Stairs)
# - Structural components (Columns, Beams, Slabs, Frames)
# - IFC data management and property handling
# - Quick building construction helpers
# Each handler returns JSON-serializable structures.

import math
import FreeCAD as App
import Draft
import Arch
import Part


def _parse_point(point_data):
    """
    Parse point data from various formats to FreeCAD Vector.

    Args:
        point_data: Can be:
            - dict with x, y, z keys
            - list/tuple [x, y, z] or [x, y]
            - App.Vector
            - App.Placement (uses Base)

    Returns:
        App.Vector: Parsed point
    """
    if point_data is None:
        return App.Vector(0, 0, 0)

    if isinstance(point_data, App.Vector):
        return point_data

    if isinstance(point_data, App.Placement):
        return point_data.Base

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


def _parse_placement(placement_data):
    """
    Parse placement data from various formats to FreeCAD Placement.

    Args:
        placement_data: Can be:
            - dict with position (x,y,z) and rotation (axis,angle)
            - list/tuple [x, y, z, axis_x, axis_y, axis_z, angle]
            - App.Placement
            - App.Vector (creates placement with this as Base)

    Returns:
        App.Placement: Parsed placement
    """
    if placement_data is None:
        return App.Placement()

    if isinstance(placement_data, App.Placement):
        return placement_data

    if isinstance(placement_data, App.Vector):
        return App.Placement(placement_data, App.Rotation())

    if isinstance(placement_data, dict):
        pos = _parse_point(placement_data.get("position", {}))
        rot = placement_data.get("rotation", {})
        if isinstance(rot, dict):
            axis = _parse_point(rot.get("axis", {"x": 0, "y": 0, "z": 1}))
            angle = float(rot.get("angle", 0))
            rotation = App.Rotation(axis, angle)
        else:
            rotation = App.Rotation()
        return App.Placement(pos, rotation)

    if isinstance(placement_data, (list, tuple)):
        if len(placement_data) >= 7:
            pos = App.Vector(
                float(placement_data[0]),
                float(placement_data[1]),
                float(placement_data[2]),
            )
            axis = App.Vector(
                float(placement_data[3]),
                float(placement_data[4]),
                float(placement_data[5]),
            )
            angle = float(placement_data[6])
            return App.Placement(pos, App.Rotation(axis, angle))
        elif len(placement_data) >= 3:
            return App.Placement(
                App.Vector(
                    float(placement_data[0]),
                    float(placement_data[1]),
                    float(placement_data[2]),
                )
            )

    return App.Placement()


def _parse_object_names(object_names):
    """
    Parse object names to actual document objects.

    Args:
        object_names: Name, list of names, or None

    Returns:
        list: List of document objects
    """
    if object_names is None:
        return []

    if isinstance(object_names, str):
        return [object_names]

    if isinstance(object_names, list):
        return object_names

    return []


def _get_objects_from_names(doc, object_names):
    """
    Get document objects from names, filtering out None results.

    Args:
        doc: ActiveDocument
        object_names: List of object names

    Returns:
        list: List of valid document objects
    """
    if not object_names:
        return []

    objects = []
    for name in object_names:
        obj = doc.getObject(name)
        if obj is not None:
            objects.append(obj)
    return objects


def _format_point(pt):
    """Format a point for display."""
    if isinstance(pt, App.Vector):
        return {"x": round(pt.x, 2), "y": round(pt.y, 2), "z": round(pt.z, 2)}
    return pt


def _format_placement(placement):
    """Format a placement for display."""
    if isinstance(placement, App.Placement):
        pos = placement.Base
        rot = placement.Rotation
        axis = rot.Axis
        angle = math.degrees(rot.Angle)
        return {
            "position": _format_point(pos),
            "rotation": {
                "axis": _format_point(axis),
                "angle": round(angle, 2),
            },
        }
    return str(placement)


def _is_bim_object(obj):
    """Check if an object is a BIM/Arch object."""
    if obj is None:
        return False
    bim_types = [
        "Site",
        "Building",
        "BuildingPart",
        "Wall",
        "Window",
        "Door",
        "Roof",
        "Stairs",
        "Space",
        "Column",
        "Beam",
        "Slab",
        "Frame",
        "Truss",
        "Fence",
        "Equipment",
        "Pipe",
        "PipeConnector",
        "Panel",
        "Axis",
        "Grid",
        "SectionPlane",
        "Schedule",
    ]
    return obj.TypeId in bim_types or any(obj.isDerivedFrom(f"Arch::") for _ in [1])


def _get_bim_object_name(obj):
    """Get a user-friendly name for a BIM object."""
    if hasattr(obj, "Label") and obj.Label:
        return obj.Label
    return obj.Name


def _get_building_hierarchy_internal(obj, visited=None):
    """
    Recursively get building hierarchy.

    Args:
        obj: BuildingPart or similar container object
        visited: Set of already visited object ids to prevent cycles

    Returns:
        dict: Hierarchy information
    """
    if visited is None:
        visited = set()

    obj_id = obj.ObjectId if hasattr(obj, "ObjectId") else id(obj)
    if obj_id in visited:
        return None
    visited.add(obj_id)

    info = {
        "name": obj.Label,
        "type": obj.TypeId,
        "ifcType": getattr(obj, "IfcType", None),
        "children": [],
    }

    if hasattr(obj, "Group"):
        for child in obj.Group:
            child_info = _get_building_hierarchy_internal(child, visited)
            if child_info:
                info["children"].append(child_info)
    elif hasattr(obj, "Children"):
        for child in obj.Children:
            child_info = _get_building_hierarchy_internal(child, visited)
            if child_info:
                info["children"].append(child_info)

    return info


# Building Structure Management


def handle_create_site(name=None):
    """
    Create a new site (land/terrain container).

    Args:
        name: Optional name for the site

    Returns:
        dict with success status, site info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        site = Arch.makeSite(name=name)

        if site is None:
            return {"success": False, "error": "Failed to create site", "data": None}

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": site.Name,
                "objectLabel": site.Label,
                "objectType": "Site",
                "ifcType": getattr(site, "IfcType", None),
                "message": f"Created Site '{site.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_building(object_names=None, name=None):
    """
    Create a building containing objects.

    Args:
        object_names: List of object names to include in the building
        name: Optional name for the building

    Returns:
        dict with success status, building info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        objects = _get_objects_from_names(doc, _parse_object_names(object_names))

        building = Arch.makeBuilding(objectslist=objects, name=name)

        if building is None:
            return {
                "success": False,
                "error": "Failed to create building",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": building.Name,
                "objectLabel": building.Label,
                "objectType": "Building",
                "ifcType": getattr(building, "IfcType", None),
                "childrenCount": len(objects),
                "message": f"Created Building '{building.Label}' with {len(objects)} object(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_building_part(object_names=None, name=None):
    """
    Create a floor/level (BuildingPart).

    Args:
        object_names: List of object names to include in the building part
        name: Optional name for the building part

    Returns:
        dict with success status, building part info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        objects = _get_objects_from_names(doc, _parse_object_names(object_names))

        building_part = Arch.makeBuildingPart(objectslist=objects, name=name)

        if building_part is None:
            return {
                "success": False,
                "error": "Failed to create building part",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": building_part.Name,
                "objectLabel": building_part.Label,
                "objectType": "BuildingPart",
                "ifcType": getattr(building_part, "IfcType", None),
                "childrenCount": len(objects),
                "message": f"Created BuildingPart '{building_part.Label}' with {len(objects)} object(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_building_level(name=None, elevation=None):
    """
    Create a single building level with elevation.

    Args:
        name: Optional name for the level
        elevation: Elevation value (Z coordinate)

    Returns:
        dict with success status, level info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        level = Arch.makeFloor(name=name)

        if level is None:
            return {
                "success": False,
                "error": "Failed to create building level",
                "data": None,
            }

        if elevation is not None:
            elev = float(elevation)
            level.Elevation = elev

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": level.Name,
                "objectLabel": level.Label,
                "objectType": "BuildingPart",
                "ifcType": getattr(level, "IfcType", None),
                "elevation": getattr(level, "Elevation", 0),
                "message": f"Created Building Level '{level.Label}' at elevation {getattr(level, 'Elevation', 0)}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_building_hierarchy():
    """
    Get building/floor/space hierarchy.

    Returns:
        dict with success status, hierarchy info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        hierarchy = []
        visited = set()

        for obj in doc.Objects:
            if hasattr(obj, "IfcType"):
                ifc_type = obj.IfcType
                if ifc_type in ["Site", "Building", "Building Storey"]:
                    if obj.ObjectId not in visited:
                        info = _get_building_hierarchy_internal(obj, visited)
                        if info:
                            hierarchy.append(info)

        return {
            "success": True,
            "data": {
                "hierarchy": hierarchy,
                "count": len(hierarchy),
                "message": f"Found {len(hierarchy)} building container(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# Architectural Elements


def handle_create_wall(placement=None, length=None, width=None, height=None, name=None):
    """
    Create a parametric wall.

    Args:
        placement: Placement as dict/list/Placement
        length: Wall length (if not using base object)
        width: Wall width (thickness)
        height: Wall height
        name: Optional name for the wall

    Returns:
        dict with success status, wall info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        wall = Arch.makeWall(
            baseobj=None,
            length=length,
            width=width,
            height=height,
            name=name,
        )

        if wall is None:
            return {"success": False, "error": "Failed to create wall", "data": None}

        if placement is not None:
            wall.Placement = _parse_placement(placement)

        doc.recompute()

        wall_length = getattr(wall, "Length", 0) if length else 0
        wall_width = getattr(wall, "Width", 0)
        wall_height = getattr(wall, "Height", 0)

        return {
            "success": True,
            "data": {
                "objectName": wall.Name,
                "objectLabel": wall.Label,
                "objectType": "Wall",
                "ifcType": getattr(wall, "IfcType", None),
                "dimensions": {
                    "length": wall_length,
                    "width": wall_width,
                    "height": wall_height,
                },
                "placement": _format_placement(wall.Placement),
                "message": f"Created Wall '{wall.Label}' ({wall_length}x{wall_width}x{wall_height})",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_window(width=None, height=None, placement=None, name=None):
    """
    Create a window in a wall.

    Args:
        width: Window width
        height: Window height
        placement: Placement as dict/list/Placement
        name: Optional name for the window

    Returns:
        dict with success status, window info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        window = Arch.makeWindow(
            baseobj=None,
            width=width,
            height=height,
            name=name,
        )

        if window is None:
            return {"success": False, "error": "Failed to create window", "data": None}

        if placement is not None:
            window.Placement = _parse_placement(placement)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": window.Name,
                "objectLabel": window.Label,
                "objectType": "Window",
                "ifcType": getattr(window, "IfcType", None),
                "dimensions": {
                    "width": getattr(window, "Width", 0),
                    "height": getattr(window, "Height", 0),
                },
                "placement": _format_placement(window.Placement),
                "message": f"Created Window '{window.Label}' ({width}x{height})",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_door(width=None, height=None, placement=None, name=None):
    """
    Create a door in a wall.

    Args:
        width: Door width
        height: Door height
        placement: Placement as dict/list/Placement
        name: Optional name for the door

    Returns:
        dict with success status, door info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        door = Arch.makeWindow(
            baseobj=None,
            width=width,
            height=height,
            name=name,
        )

        if door is None:
            return {"success": False, "error": "Failed to create door", "data": None}

        if hasattr(door, "IfcType"):
            door.IfcType = "Door"

        if placement is not None:
            door.Placement = _parse_placement(placement)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": door.Name,
                "objectLabel": door.Label,
                "objectType": "Door",
                "ifcType": getattr(door, "IfcType", None),
                "dimensions": {
                    "width": getattr(door, "Width", 0),
                    "height": getattr(door, "Height", 0),
                },
                "placement": _format_placement(door.Placement),
                "message": f"Created Door '{door.Label}' ({width}x{height})",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_roof(base_object=None, angle=None, name=None):
    """
    Create a roof from a profile.

    Args:
        base_object: Name of base object (sketch or wire) for roof profile
        angle: Roof angle in degrees
        name: Optional name for the roof

    Returns:
        dict with success status, roof info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        base_obj = None
        if base_object:
            base_obj = doc.getObject(base_object)
            if base_obj is None:
                return {
                    "success": False,
                    "error": f"Base object '{base_object}' not found",
                    "data": None,
                }

        angles = [float(angle)] if angle is not None else [45.0]

        roof = Arch.makeRoof(baseobj=base_obj, angles=angles, name=name)

        if roof is None:
            return {"success": False, "error": "Failed to create roof", "data": None}

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": roof.Name,
                "objectLabel": roof.Label,
                "objectType": "Roof",
                "ifcType": getattr(roof, "IfcType", None),
                "angles": angles,
                "message": f"Created Roof '{roof.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_stairs(length=None, width=None, num_steps=None, name=None):
    """
    Create a staircase.

    Args:
        length: Stairs length
        width: Stairs width
        num_steps: Number of steps
        name: Optional name for the stairs

    Returns:
        dict with success status, stairs info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        stairs = Arch.makeStairs(
            baseobj=None,
            length=length,
            width=width,
            height=None,
            steps=num_steps,
            name=name,
        )

        if stairs is None:
            return {"success": False, "error": "Failed to create stairs", "data": None}

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": stairs.Name,
                "objectLabel": stairs.Label,
                "objectType": "Stairs",
                "ifcType": getattr(stairs, "IfcType", None),
                "dimensions": {
                    "length": getattr(stairs, "Length", 0),
                    "width": getattr(stairs, "Width", 0),
                    "height": getattr(stairs, "Height", 0),
                },
                "numberOfSteps": getattr(stairs, "NumberOfSteps", num_steps or 0),
                "message": f"Created Stairs '{stairs.Label}' with {getattr(stairs, 'NumberOfSteps', num_steps or 0)} steps",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_curtain_wall(base_object=None, name=None):
    """
    Create a curtain wall system.

    Args:
        base_object: Name of base object for curtain wall
        name: Optional name for the curtain wall

    Returns:
        dict with success status, curtain wall info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        base_obj = None
        if base_object:
            base_obj = doc.getObject(base_object)
            if base_obj is None:
                return {
                    "success": False,
                    "error": f"Base object '{base_object}' not found",
                    "data": None,
                }

        curtain_wall = Arch.makeCurtainWall(baseobj=base_obj, name=name)

        if curtain_wall is None:
            return {
                "success": False,
                "error": "Failed to create curtain wall",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": curtain_wall.Name,
                "objectLabel": curtain_wall.Label,
                "objectType": "CurtainWall",
                "ifcType": getattr(curtain_wall, "IfcType", None),
                "message": f"Created CurtainWall '{curtain_wall.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_space(placement=None, name=None):
    """
    Create a space/room.

    Args:
        placement: Placement as dict/list/Placement
        name: Optional name for the space

    Returns:
        dict with success status, space info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        space = Arch.makeSpace(baseobj=None, name=name)

        if space is None:
            return {"success": False, "error": "Failed to create space", "data": None}

        if placement is not None:
            space.Placement = _parse_placement(placement)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": space.Name,
                "objectLabel": space.Label,
                "objectType": "Space",
                "ifcType": getattr(space, "IfcType", None),
                "placement": _format_placement(space.Placement),
                "message": f"Created Space '{space.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# Structural Elements


def handle_create_column(placement=None, width=None, height=None, name=None):
    """
    Create a vertical column.

    Args:
        placement: Placement as dict/list/Placement
        width: Column width
        height: Column height
        name: Optional name for the column

    Returns:
        dict with success status, column info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        column = Arch.makeStructure(name=name)

        if column is None:
            return {"success": False, "error": "Failed to create column", "data": None}

        if hasattr(column, "IfcType"):
            column.IfcType = "Column"

        if width:
            column.Width = float(width)
        if height:
            column.Height = float(height)

        if placement is not None:
            column.Placement = _parse_placement(placement)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": column.Name,
                "objectLabel": column.Label,
                "objectType": "Column",
                "ifcType": getattr(column, "IfcType", None),
                "dimensions": {
                    "width": getattr(column, "Width", 0),
                    "height": getattr(column, "Height", 0),
                },
                "placement": _format_placement(column.Placement),
                "message": f"Created Column '{column.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_beam(start=None, end=None, width=None, height=None, name=None):
    """
    Create a horizontal beam.

    Args:
        start: Start point as dict/list/Vector
        end: End point as dict/list/Vector
        width: Beam width
        height: Beam height
        name: Optional name for the beam

    Returns:
        dict with success status, beam info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        beam = Arch.makeStructure(name=name)

        if beam is None:
            return {"success": False, "error": "Failed to create beam", "data": None}

        if hasattr(beam, "IfcType"):
            beam.IfcType = "Beam"

        if width:
            beam.Width = float(width)
        if height:
            beam.Height = float(height)

        if start is not None and end is not None:
            start_pt = _parse_point(start)
            end_pt = _parse_point(end)

            direction = end_pt.sub(start_pt)
            length = direction.Length

            placement = App.Placement(
                start_pt,
                App.Rotation(App.Vector(0, 0, 1), direction),
            )
            beam.Placement = placement

            if hasattr(beam, "Length") and length:
                beam.Length = length

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": beam.Name,
                "objectLabel": beam.Label,
                "objectType": "Beam",
                "ifcType": getattr(beam, "IfcType", None),
                "dimensions": {
                    "width": getattr(beam, "Width", 0),
                    "height": getattr(beam, "Height", 0),
                    "length": getattr(beam, "Length", 0),
                },
                "message": f"Created Beam '{beam.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_slab(base_object=None, thickness=None, name=None):
    """
    Create a floor/roof slab.

    Args:
        base_object: Name of base object for slab
        thickness: Slab thickness
        name: Optional name for the slab

    Returns:
        dict with success status, slab info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        base_obj = None
        if base_object:
            base_obj = doc.getObject(base_object)
            if base_obj is None:
                return {
                    "success": False,
                    "error": f"Base object '{base_object}' not found",
                    "data": None,
                }

        slab = Arch.makeStructure(name=name)

        if slab is None:
            return {"success": False, "error": "Failed to create slab", "data": None}

        if hasattr(slab, "IfcType"):
            slab.IfcType = "Slab"

        if thickness:
            slab.Height = float(thickness)

        if base_obj is None and thickness:
            slab.Height = float(thickness)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": slab.Name,
                "objectLabel": slab.Label,
                "objectType": "Slab",
                "ifcType": getattr(slab, "IfcType", None),
                "thickness": getattr(slab, "Height", 0),
                "message": f"Created Slab '{slab.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_frame(base_object=None, profile=None, name=None):
    """
    Create a frame structure.

    Args:
        base_object: Name of base sketch/object for frame
        profile: Name of profile object
        name: Optional name for the frame

    Returns:
        dict with success status, frame info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        base_obj = None
        if base_object:
            base_obj = doc.getObject(base_object)
            if base_obj is None:
                return {
                    "success": False,
                    "error": f"Base object '{base_object}' not found",
                    "data": None,
                }

        profile_obj = None
        if profile:
            profile_obj = doc.getObject(profile)
            if profile_obj is None:
                return {
                    "success": False,
                    "error": f"Profile object '{profile}' not found",
                    "data": None,
                }

        frame = Arch.makeFrame(baseobj=base_obj, profile=profile_obj, name=name)

        if frame is None:
            return {"success": False, "error": "Failed to create frame", "data": None}

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": frame.Name,
                "objectLabel": frame.Label,
                "objectType": "Frame",
                "ifcType": getattr(frame, "IfcType", None),
                "message": f"Created Frame '{frame.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_truss(placement=None, length=None, height=None, name=None):
    """
    Create a truss.

    Args:
        placement: Placement as dict/list/Placement
        length: Truss length
        height: Truss height
        name: Optional name for the truss

    Returns:
        dict with success status, truss info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        truss = Arch.makeTruss(name=name)

        if truss is None:
            return {"success": False, "error": "Failed to create truss", "data": None}

        if placement is not None:
            truss.Placement = _parse_placement(placement)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": truss.Name,
                "objectLabel": truss.Label,
                "objectType": "Truss",
                "ifcType": getattr(truss, "IfcType", None),
                "dimensions": {
                    "length": length or 0,
                    "height": height or 0,
                },
                "placement": _format_placement(truss.Placement),
                "message": f"Created Truss '{truss.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_fence(placement=None, length=None, height=None, name=None):
    """
    Create a fence.

    Args:
        placement: Placement as dict/list/Placement
        length: Fence length
        height: Fence height
        name: Optional name for the fence

    Returns:
        dict with success status, fence info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        fence = Arch.makeFence(section=None, post=None, path=None)

        if fence is None:
            return {"success": False, "error": "Failed to create fence", "data": None}

        if placement is not None:
            fence.Placement = _parse_placement(placement)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": fence.Name,
                "objectLabel": fence.Label,
                "objectType": "Fence",
                "ifcType": getattr(fence, "IfcType", None),
                "dimensions": {
                    "length": length or 0,
                    "height": height or 0,
                },
                "placement": _format_placement(fence.Placement),
                "message": f"Created Fence '{fence.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# Equipment & Infrastructure


def handle_create_equipment(base_object=None, placement=None, name=None):
    """
    Create equipment/furniture.

    Args:
        base_object: Name of base object for equipment
        placement: Placement as dict/list/Placement
        name: Optional name for the equipment

    Returns:
        dict with success status, equipment info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        base_obj = None
        if base_object:
            base_obj = doc.getObject(base_object)
            if base_obj is None:
                return {
                    "success": False,
                    "error": f"Base object '{base_object}' not found",
                    "data": None,
                }

        pl = _parse_placement(placement) if placement else None

        equipment = Arch.makeEquipment(baseobj=base_obj, placement=pl, name=name)

        if equipment is None:
            return {
                "success": False,
                "error": "Failed to create equipment",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": equipment.Name,
                "objectLabel": equipment.Label,
                "objectType": "Equipment",
                "ifcType": getattr(equipment, "IfcType", None),
                "placement": _format_placement(equipment.Placement),
                "message": f"Created Equipment '{equipment.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_pipe(start=None, end=None, radius=None, name=None):
    """
    Create a pipe.

    Args:
        start: Start point as dict/list/Vector
        end: End point as dict/list/Vector
        radius: Pipe radius
        name: Optional name for the pipe

    Returns:
        dict with success status, pipe info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        diameter = float(radius) * 2 if radius else 0

        pipe = Arch.makePipe(
            baseobj=None,
            diameter=diameter,
            length=0,
            placement=None,
            name=name,
        )

        if pipe is None:
            return {"success": False, "error": "Failed to create pipe", "data": None}

        if start is not None and end is not None:
            start_pt = _parse_point(start)
            end_pt = _parse_point(end)

            direction = end_pt.sub(start_pt)
            length = direction.Length

            placement = App.Placement(
                start_pt,
                App.Rotation(App.Vector(0, 0, 1), direction),
            )
            pipe.Placement = placement

            if hasattr(pipe, "Length"):
                pipe.Length = length

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": pipe.Name,
                "objectLabel": pipe.Label,
                "objectType": "Pipe",
                "ifcType": getattr(pipe, "IfcType", None),
                "diameter": diameter,
                "radius": radius,
                "length": getattr(pipe, "Length", 0),
                "message": f"Created Pipe '{pipe.Label}' (radius={radius})",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_pipe_connector(objects=None, name=None):
    """
    Create a pipe connector fitting.

    Args:
        objects: List of pipe object names to connect
        name: Optional name for the connector

    Returns:
        dict with success status, connector info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        pipe_objects = _get_objects_from_names(doc, _parse_object_names(objects))

        if len(pipe_objects) < 2:
            return {
                "success": False,
                "error": "At least 2 pipe objects are required",
                "data": None,
            }

        connector = Arch.makePipeConnector(pipes=pipe_objects, radius=0, name=name)

        if connector is None:
            return {
                "success": False,
                "error": "Failed to create pipe connector",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": connector.Name,
                "objectLabel": connector.Label,
                "objectType": "PipeConnector",
                "ifcType": getattr(connector, "IfcType", None),
                "connectedPipes": len(pipe_objects),
                "message": f"Created PipeConnector '{connector.Label}' connecting {len(pipe_objects)} pipes",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_panel(base_object=None, name=None):
    """
    Create a panel/board.

    Args:
        base_object: Name of base object for panel
        name: Optional name for the panel

    Returns:
        dict with success status, panel info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        base_obj = None
        if base_object:
            base_obj = doc.getObject(base_object)
            if base_obj is None:
                return {
                    "success": False,
                    "error": f"Base object '{base_object}' not found",
                    "data": None,
                }

        panel = Arch.makePanel(baseobj=base_obj, name=name)

        if panel is None:
            return {"success": False, "error": "Failed to create panel", "data": None}

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": panel.Name,
                "objectLabel": panel.Label,
                "objectType": "Panel",
                "ifcType": getattr(panel, "IfcType", None),
                "message": f"Created Panel '{panel.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# Annotation & Grids


def handle_create_axis(num=None, spacing=None, name=None):
    """
    Create an axis system.

    Args:
        num: Number of axes
        spacing: Spacing between axes
        name: Optional name for the axis system

    Returns:
        dict with success status, axis info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        num_axes = int(num) if num is not None else 1
        size = float(spacing) if spacing is not None else 1000

        axis = Arch.makeAxis(num=num_axes, size=size, name=name)

        if axis is None:
            return {"success": False, "error": "Failed to create axis", "data": None}

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": axis.Name,
                "objectLabel": axis.Label,
                "objectType": "Axis",
                "ifcType": getattr(axis, "IfcType", None),
                "numberOfAxes": num_axes,
                "spacing": size,
                "message": f"Created Axis '{axis.Label}' with {num_axes} axes",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_grid(placement=None, name=None):
    """
    Create a reference grid.

    Args:
        placement: Placement as dict/list/Placement
        name: Optional name for the grid

    Returns:
        dict with success status, grid info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        grid = Arch.makeGrid(name=name)

        if grid is None:
            return {"success": False, "error": "Failed to create grid", "data": None}

        if placement is not None:
            grid.Placement = _parse_placement(placement)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": grid.Name,
                "objectLabel": grid.Label,
                "objectType": "Grid",
                "ifcType": getattr(grid, "IfcType", None),
                "placement": _format_placement(grid.Placement),
                "message": f"Created Grid '{grid.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_section_plane(object_names=None, name=None):
    """
    Create a section plane for views.

    Args:
        object_names: List of object names to include in section
        name: Optional name for the section plane

    Returns:
        dict with success status, section plane info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        objects = _get_objects_from_names(doc, _parse_object_names(object_names))

        section_plane = Arch.makeSectionPlane(
            objectslist=objects if objects else None, name=name
        )

        if section_plane is None:
            return {
                "success": False,
                "error": "Failed to create section plane",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": section_plane.Name,
                "objectLabel": section_plane.Label,
                "objectType": "SectionPlane",
                "ifcType": getattr(section_plane, "IfcType", None),
                "objectsCount": len(objects),
                "message": f"Created SectionPlane '{section_plane.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_schedule(object_names=None, name=None):
    """
    Create a quantity takeoff schedule.

    Args:
        object_names: List of object names to include in schedule
        name: Optional name for the schedule

    Returns:
        dict with success status, schedule info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        schedule = Arch.makeSchedule()

        if schedule is None:
            return {
                "success": False,
                "error": "Failed to create schedule",
                "data": None,
            }

        if name:
            schedule.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": schedule.Name,
                "objectLabel": schedule.Label,
                "objectType": "Schedule",
                "ifcType": getattr(schedule, "IfcType", None),
                "message": f"Created Schedule '{schedule.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# IFC Data Management


def handle_set_ifc_type(object_name=None, ifc_type=None):
    """
    Set IFC entity type on an object.

    Args:
        object_name: Name of the object
        ifc_type: IFC type string (e.g., "Wall", "Column", "Beam")

    Returns:
        dict with success status, updated info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not object_name:
            return {"success": False, "error": "Object name is required", "data": None}

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None,
            }

        if not hasattr(obj, "IfcType"):
            return {
                "success": False,
                "error": "Object does not support IFC types",
                "data": None,
            }

        old_type = obj.IfcType
        obj.IfcType = ifc_type

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "oldIfcType": old_type,
                "newIfcType": obj.IfcType,
                "message": f"Set IFC type of '{obj.Label}' from '{old_type}' to '{ifc_type}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_ifc_properties(object_name=None):
    """
    Get IFC properties from an object.

    Args:
        object_name: Name of the object

    Returns:
        dict with success status, properties info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not object_name:
            return {"success": False, "error": "Object name is required", "data": None}

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None,
            }

        properties = {}

        if hasattr(obj, "IfcType"):
            properties["ifcType"] = obj.IfcType

        if hasattr(obj, "IfcProperties"):
            ifc_props = obj.IfcProperties
            if isinstance(ifc_props, dict):
                properties["ifcProperties"] = ifc_props
            elif hasattr(ifc_props, "Sheet"):
                properties["ifcProperties"] = "Spreadsheet"

        if hasattr(obj, "Material"):
            mat = obj.Material
            if mat:
                properties["material"] = getattr(mat, "Label", str(mat))

        return {
            "success": True,
            "data": {
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "objectType": obj.TypeId,
                "ifcType": getattr(obj, "IfcType", None),
                "properties": properties,
                "message": f"Retrieved IFC properties for '{obj.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_ifc_property(object_name=None, prop_name=None, value=None):
    """
    Set an IFC property on an object.

    Args:
        object_name: Name of the object
        prop_name: Property name to set
        value: Property value to set

    Returns:
        dict with success status, updated info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not object_name:
            return {"success": False, "error": "Object name is required", "data": None}

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None,
            }

        if not hasattr(obj, "IfcProperties"):
            if not hasattr(obj, "IfcType"):
                return {
                    "success": False,
                    "error": "Object does not support IFC properties",
                    "data": None,
                }

            setattr(obj, prop_name, value)
            doc.recompute()

            return {
                "success": True,
                "data": {
                    "objectName": obj.Name,
                    "objectLabel": obj.Label,
                    "propertyName": prop_name,
                    "propertyValue": value,
                    "message": f"Set property '{prop_name}' = '{value}' on '{obj.Label}'",
                },
            }

        ifc_props = obj.IfcProperties
        if isinstance(ifc_props, dict):
            ifc_props[prop_name] = value
            obj.IfcProperties = ifc_props
        else:
            return {
                "success": False,
                "error": "IFC properties format not supported",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "propertyName": prop_name,
                "propertyValue": value,
                "message": f"Set IFC property '{prop_name}' = '{value}' on '{obj.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_bim_material(object_name=None):
    """
    Get material from a BIM object.

    Args:
        object_name: Name of the object

    Returns:
        dict with success status, material info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not object_name:
            return {"success": False, "error": "Object name is required", "data": None}

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None,
            }

        material_info = None

        if hasattr(obj, "Material"):
            mat = obj.Material
            if mat:
                material_info = {
                    "name": getattr(mat, "Label", None),
                    "type": mat.TypeId if hasattr(mat, "TypeId") else None,
                }

                if hasattr(mat, "Color"):
                    material_info["color"] = mat.Color

                if hasattr(mat, "Transparency"):
                    material_info["transparency"] = mat.Transparency

        return {
            "success": True,
            "data": {
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "material": material_info,
                "message": f"Retrieved material for '{obj.Label}': {material_info['name'] if material_info else 'None'}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_assign_material(object_name=None, material_name=None):
    """
    Assign material to a BIM object.

    Args:
        object_name: Name of the object
        material_name: Name of the material to assign

    Returns:
        dict with success status, assignment info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not object_name:
            return {"success": False, "error": "Object name is required", "data": None}

        obj = doc.getObject(object_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' not found",
                "data": None,
            }

        material = None
        for m in doc.Objects:
            if hasattr(m, "Label") and m.Label == material_name:
                if hasattr(m, "Material") or m.isDerivedFrom(
                    "App::MaterialObjectPython"
                ):
                    material = m
                    break

        if material is None:
            for m in doc.Objects:
                if hasattr(m, "TypeId") and m.TypeId == "App::MaterialObjectPython":
                    if hasattr(m, "Label") and material_name in m.Label:
                        material = m
                        break

        if material is None:
            return {
                "success": False,
                "error": f"Material '{material_name}' not found",
                "data": None,
            }

        old_material = getattr(obj, "Material", None)
        obj.Material = material

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": obj.Name,
                "objectLabel": obj.Label,
                "oldMaterial": getattr(old_material, "Label", str(old_material))
                if old_material
                else None,
                "newMaterial": material.Label,
                "message": f"Assigned material '{material.Label}' to '{obj.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# Quick Building Construction


def handle_quick_wall(start=None, end=None, height=None, thickness=None, name=None):
    """
    Quick wall creation from a line.

    Args:
        start: Start point as dict/list/Vector
        end: End point as dict/list/Vector
        height: Wall height
        thickness: Wall thickness (width)
        name: Optional name for the wall

    Returns:
        dict with success status, wall info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        start_pt = _parse_point(start)
        end_pt = _parse_point(end)

        line = Draft.makeLine(start_pt, end_pt)

        wall = Arch.makeWall(
            baseobj=line,
            height=height,
            width=thickness,
            name=name,
        )

        if wall is None:
            return {"success": False, "error": "Failed to create wall", "data": None}

        doc.recompute()

        wall_length = start_pt.distanceToPoint(end_pt)

        return {
            "success": True,
            "data": {
                "objectName": wall.Name,
                "objectLabel": wall.Label,
                "objectType": "Wall",
                "ifcType": getattr(wall, "IfcType", None),
                "dimensions": {
                    "length": wall_length,
                    "width": getattr(wall, "Width", 0),
                    "height": getattr(wall, "Height", 0),
                },
                "message": f"Created Wall '{wall.Label}' from {_format_point(start_pt)} to {_format_point(end_pt)}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_quick_window(wall_name=None, width=None, height=None, position=None):
    """
    Insert a window into a wall at a specific position.

    Args:
        wall_name: Name of the wall to insert window into
        width: Window width
        height: Window height
        position: Position along wall (0-1 normalized or dict with x,y,z)

    Returns:
        dict with success status, window info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not wall_name:
            return {"success": False, "error": "Wall name is required", "data": None}

        wall = doc.getObject(wall_name)
        if wall is None:
            return {
                "success": False,
                "error": f"Wall '{wall_name}' not found",
                "data": None,
            }

        window = Arch.makeWindow(
            baseobj=None,
            width=width,
            height=height,
            name=None,
        )

        if window is None:
            return {"success": False, "error": "Failed to create window", "data": None}

        window.IfcType = "Window"

        if hasattr(wall, "Width"):
            window.HoleDepth = wall.Width

        if position is not None:
            if isinstance(position, dict):
                window.Placement.Base = _parse_point(position)
            elif isinstance(position, (int, float)):
                if hasattr(wall, "Length"):
                    offset = (
                        float(position) * wall.Length
                        if position <= 1
                        else float(position)
                    )
                    if hasattr(wall, "Placement") and hasattr(wall.Placement, "Base"):
                        normal = App.Vector(0, 0, 1)
                        if hasattr(wall.Placement, "Rotation"):
                            normal = wall.Placement.Rotation.multVec(normal)
                        offset_vec = normal.multiply(offset)
                        new_pos = wall.Placement.Base.add(offset_vec)
                        window.Placement.Base = new_pos

        window.Hosts = [wall]

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": window.Name,
                "objectLabel": window.Label,
                "objectType": "Window",
                "ifcType": getattr(window, "IfcType", None),
                "hostWall": wall_name,
                "dimensions": {
                    "width": getattr(window, "Width", 0),
                    "height": getattr(window, "Height", 0),
                },
                "message": f"Created Window '{window.Label}' in wall '{wall_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_quick_door(wall_name=None, width=None, height=None, position=None):
    """
    Insert a door into a wall at a specific position.

    Args:
        wall_name: Name of the wall to insert door into
        width: Door width
        height: Door height
        position: Position along wall (0-1 normalized or dict with x,y,z)

    Returns:
        dict with success status, door info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not wall_name:
            return {"success": False, "error": "Wall name is required", "data": None}

        wall = doc.getObject(wall_name)
        if wall is None:
            return {
                "success": False,
                "error": f"Wall '{wall_name}' not found",
                "data": None,
            }

        door = Arch.makeWindow(
            baseobj=None,
            width=width,
            height=height,
            name=None,
        )

        if door is None:
            return {"success": False, "error": "Failed to create door", "data": None}

        door.IfcType = "Door"

        if hasattr(wall, "Width"):
            door.HoleDepth = wall.Width

        if position is not None:
            if isinstance(position, dict):
                door.Placement.Base = _parse_point(position)
            elif isinstance(position, (int, float)):
                if hasattr(wall, "Length"):
                    offset = (
                        float(position) * wall.Length
                        if position <= 1
                        else float(position)
                    )
                    if hasattr(wall, "Placement") and hasattr(wall.Placement, "Base"):
                        normal = App.Vector(0, 0, 1)
                        if hasattr(wall.Placement, "Rotation"):
                            normal = wall.Placement.Rotation.multVec(normal)
                        offset_vec = normal.multiply(offset)
                        new_pos = wall.Placement.Base.add(offset_vec)
                        door.Placement.Base = new_pos

        door.Hosts = [wall]

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": door.Name,
                "objectLabel": door.Label,
                "objectType": "Door",
                "ifcType": getattr(door, "IfcType", None),
                "hostWall": wall_name,
                "dimensions": {
                    "width": getattr(door, "Width", 0),
                    "height": getattr(door, "Height", 0),
                },
                "message": f"Created Door '{door.Label}' in wall '{wall_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_quick_floor(building_name=None, level=None, objects=None):
    """
    Add a floor/level to a building.

    Args:
        building_name: Name of the building
        level: Level name or number
        objects: List of object names to add to the floor

    Returns:
        dict with success status, floor info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not building_name:
            return {
                "success": False,
                "error": "Building name is required",
                "data": None,
            }

        building = doc.getObject(building_name)
        if building is None:
            return {
                "success": False,
                "error": f"Building '{building_name}' not found",
                "data": None,
            }

        objs = _get_objects_from_names(doc, _parse_object_names(objects))

        floor = Arch.makeFloor(name=level)

        if floor is None:
            return {"success": False, "error": "Failed to create floor", "data": None}

        if objs:
            for obj in objs:
                floor.addObject(obj)

        if hasattr(building, "addObject"):
            building.addObject(floor)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": floor.Name,
                "objectLabel": floor.Label,
                "objectType": "BuildingPart",
                "ifcType": getattr(floor, "IfcType", None),
                "parentBuilding": building_name,
                "objectsCount": len(objs),
                "message": f"Created Floor '{floor.Label}' in Building '{building_name}' with {len(objs)} object(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_create_site",
    "handle_create_building",
    "handle_create_building_part",
    "handle_create_building_level",
    "handle_get_building_hierarchy",
    "handle_create_wall",
    "handle_create_window",
    "handle_create_door",
    "handle_create_roof",
    "handle_create_stairs",
    "handle_create_curtain_wall",
    "handle_create_space",
    "handle_create_column",
    "handle_create_beam",
    "handle_create_slab",
    "handle_create_frame",
    "handle_create_truss",
    "handle_create_fence",
    "handle_create_equipment",
    "handle_create_pipe",
    "handle_create_pipe_connector",
    "handle_create_panel",
    "handle_create_axis",
    "handle_create_grid",
    "handle_create_section_plane",
    "handle_create_schedule",
    "handle_set_ifc_type",
    "handle_get_ifc_properties",
    "handle_set_ifc_property",
    "handle_get_bim_material",
    "handle_assign_material",
    "handle_quick_wall",
    "handle_quick_window",
    "handle_quick_door",
    "handle_quick_floor",
]
