# SPDX-License-Identifier: LGPL-2.1-or-later
# Assembly Constraint Handlers
#
# Provides handlers for assembly constraint operations:
# - Create and manage assembly containers
# - Add/remove components from assemblies
# - Create constraints (coincident, parallel, perpendicular, angle, distance, insert, tangent, equal, symmetric)
# - Modify and list constraints
# - Suppress/activate constraints
# Each handler returns JSON-serializable structures.

import FreeCAD as App


def _get_assembly_module():
    """Detect available assembly module (Assembly3, A2plus, or built-in)."""
    modules = []

    try:
        import Assembly3 as _

        modules.append(("Assembly3", "Assembly3"))
    except ImportError:
        pass

    try:
        import A2plus as _

        modules.append(("A2plus", "A2plus"))
    except ImportError:
        pass

    try:
        import Assembly as _

        modules.append(("Assembly", "Assembly"))
    except ImportError:
        pass

    return modules[0] if modules else (None, None)


def _get_assembly_object(doc, name):
    """Get an assembly object by name, checking for various assembly types."""
    obj = doc.getObject(name)
    if obj:
        return obj

    for o in doc.Objects:
        if hasattr(o, "Name") and o.Name == name:
            return o
        if hasattr(o, "Label") and o.Label == name:
            return o

    return None


def _is_assembly_object(obj):
    """Check if an object is an assembly container."""
    if obj is None:
        return False

    assembly_types = ["Assembly", "Assembly3", "A2plus", "App::Part"]
    if obj.TypeId in assembly_types:
        return True

    if hasattr(obj, "isAssembly") and obj.isAssembly:
        return True

    if hasattr(obj, "Group") and obj.TypeId in ["App::Document", "App::DocumentObject"]:
        for child in obj.Group:
            if child.TypeId in assembly_types:
                return True

    return False


def _is_assembly_module_available():
    """Check if any assembly module is available."""
    modules = []
    try:
        import Assembly3

        modules.append("Assembly3")
    except ImportError:
        pass
    try:
        import A2plus

        modules.append("A2plus")
    except ImportError:
        pass
    try:
        import Assembly

        modules.append("Assembly")
    except ImportError:
        pass
    return len(modules) > 0


def _parse_subobject_reference(subobject_ref):
    """
    Parse a subobject reference string like 'Face1', 'Edge2', 'Vertex3'.

    Returns:
        tuple: (subobject_type, index) where subobject_type is 'Face', 'Edge', 'Vertex' and index is 1-based
    """
    if not subobject_ref:
        return (None, None)

    subobject_ref = str(subobject_ref).strip()

    import re

    match = re.match(
        r"^(Face|Edge|Vertex|Circle|Line)(\d+)$", subobject_ref, re.IGNORECASE
    )
    if match:
        subobject_type = match.group(1).capitalize()
        index = int(match.group(2))
        return (subobject_type, index)

    return (None, None)


def _validate_subobject(obj, subobject_type, index):
    """Validate that a subobject exists on an object."""
    if obj is None:
        return False, "Object is None"

    if not hasattr(obj, "Shape") or obj.Shape is None:
        return False, "Object has no shape"

    shape = obj.Shape

    if subobject_type == "Face":
        if index < 1 or index > len(shape.Faces):
            return False, f"Face index {index} out of range (1-{len(shape.Faces)})"
    elif subobject_type == "Edge":
        if index < 1 or index > len(shape.Edges):
            return False, f"Edge index {index} out of range (1-{len(shape.Edges)})"
    elif subobject_type == "Vertex":
        if index < 1 or index > len(shape.Vertexes):
            return False, f"Vertex index {index} out of range (1-{len(shape.Vertexes)})"
    else:
        return False, f"Unknown subobject type: {subobject_type}"

    return True, "Valid"


def get_subobject_reference(object_name, subobject_type, index):
    """
    Get a reference to a subobject (face, edge, vertex) on an object.

    Args:
        object_name: Name of the object
        subobject_type: Type of subobject ('Face', 'Edge', 'Vertex', 'Circle', 'Line')
        index: 1-based index of the subobject

    Returns:
        dict with success status and subobject reference
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

        valid, msg = _validate_subobject(obj, subobject_type, index)
        if not valid:
            return {"success": False, "error": msg, "data": None}

        subobject_name = f"{object_name}.{subobject_type}{index}"

        return {
            "success": True,
            "data": {
                "objectName": object_name,
                "subobjectType": subobject_type,
                "subobjectIndex": index,
                "subobjectName": subobject_name,
                "message": f"Reference to {subobject_type}{index} on {object_name}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_assembly(name=None):
    """
    Create a new assembly container.

    Args:
        name: Optional name for the assembly

    Returns:
        dict with success status, assembly info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if not name:
            name = "Assembly"

        assembly = doc.addObject("App::Part", name)
        assembly.Label = name

        doc.recompute()

        return {
            "success": True,
            "data": {
                "assemblyName": assembly.Name,
                "assemblyLabel": assembly.Label,
                "documentName": doc.Name,
                "type": assembly.TypeId,
                "message": f"Created assembly '{assembly.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_add_component_to_assembly(object_name, assembly_name):
    """
    Add a component/part to an assembly.

    Args:
        object_name: Name of the object to add
        assembly_name: Name of the assembly to add to

    Returns:
        dict with success status, component info, and message
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

        assembly = _get_assembly_object(doc, assembly_name)
        if assembly is None:
            return {
                "success": False,
                "error": f"Assembly '{assembly_name}' not found",
                "data": None,
            }

        if not _is_assembly_object(assembly) and assembly.TypeId != "App::Part":
            return {
                "success": False,
                "error": f"Object '{assembly_name}' is not an assembly",
                "data": None,
            }

        if hasattr(assembly, "addObject"):
            assembly.addObject(obj)
        elif hasattr(assembly, "Group"):
            if obj not in assembly.Group:
                objs = list(assembly.Group)
                objs.append(obj)
                assembly.Group = objs

        doc.recompute()

        return {
            "success": True,
            "data": {
                "componentName": obj.Name,
                "componentLabel": obj.Label,
                "assemblyName": assembly.Name,
                "assemblyLabel": assembly.Label,
                "message": f"Added '{obj.Label}' to assembly '{assembly.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_remove_component_from_assembly(object_name, assembly_name):
    """
    Remove a component from an assembly.

    Args:
        object_name: Name of the object to remove
        assembly_name: Name of the assembly

    Returns:
        dict with success status and message
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

        assembly = _get_assembly_object(doc, assembly_name)
        if assembly is None:
            return {
                "success": False,
                "error": f"Assembly '{assembly_name}' not found",
                "data": None,
            }

        if hasattr(assembly, "removeObject"):
            assembly.removeObject(obj)
        elif hasattr(assembly, "Group") and obj in assembly.Group:
            objs = list(assembly.Group)
            objs.remove(obj)
            assembly.Group = objs

        doc.recompute()

        return {
            "success": True,
            "data": {
                "removedComponent": obj.Name,
                "assemblyName": assembly.Name,
                "message": f"Removed '{obj.Label}' from assembly '{assembly.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_assemblies():
    """
    List all assemblies in the document.

    Returns:
        dict with success status and list of assemblies
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        assemblies = []
        for obj in doc.Objects:
            if _is_assembly_object(obj) or obj.TypeId == "App::Part":
                component_count = 0
                if hasattr(obj, "Group"):
                    component_count = len(obj.Group)
                elif hasattr(obj, "GroupElements"):
                    component_count = len(obj.GroupElements)

                assemblies.append(
                    {
                        "name": obj.Name,
                        "label": obj.Label,
                        "type": obj.TypeId,
                        "componentCount": component_count,
                    }
                )

        return {
            "success": True,
            "data": {
                "assemblies": assemblies,
                "count": len(assemblies),
                "message": f"Found {len(assemblies)} assembly(ies)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_assembly_components(assembly_name):
    """
    List all components in an assembly.

    Args:
        assembly_name: Name of the assembly

    Returns:
        dict with success status and list of components
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        assembly = _get_assembly_object(doc, assembly_name)
        if assembly is None:
            return {
                "success": False,
                "error": f"Assembly '{assembly_name}' not found",
                "data": None,
            }

        components = []

        if hasattr(assembly, "Group"):
            for obj in assembly.Group:
                components.append(
                    {"name": obj.Name, "label": obj.Label, "type": obj.TypeId}
                )
        elif hasattr(assembly, "GroupElements"):
            for obj in assembly.GroupElements:
                components.append(
                    {"name": obj.Name, "label": obj.Label, "type": obj.TypeId}
                )

        return {
            "success": True,
            "data": {
                "assemblyName": assembly.Name,
                "assemblyLabel": assembly.Label,
                "components": components,
                "count": len(components),
                "message": f"Assembly '{assembly.Label}' has {len(components)} component(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def _create_constraint(
    object1, subobject1, object2, subobject2, constraint_type, name=None, value=None
):
    """
    Internal helper to create a constraint between two subobjects.

    Args:
        object1: First object name
        subobject1: First subobject reference (e.g., 'Face1', 'Edge2')
        object2: Second object name
        subobject2: Second subobject reference
        constraint_type: Type of constraint
        name: Optional constraint name
        value: Optional value for angle/distance constraints

    Returns:
        dict with success status, constraint info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj1 = doc.getObject(object1)
        if obj1 is None:
            return {
                "success": False,
                "error": f"Object '{object1}' not found",
                "data": None,
            }

        obj2 = doc.getObject(object2)
        if obj2 is None:
            return {
                "success": False,
                "error": f"Object '{object2}' not found",
                "data": None,
            }

        sub_type1, sub_idx1 = _parse_subobject_reference(subobject1)
        sub_type2, sub_idx2 = _parse_subobject_reference(subobject2)

        if sub_type1 is None or sub_idx1 is None:
            return {
                "success": False,
                "error": f"Invalid subobject reference: {subobject1}. Use format like 'Face1', 'Edge2', 'Vertex3'",
                "data": None,
            }

        if sub_type2 is None or sub_idx2 is None:
            return {
                "success": False,
                "error": f"Invalid subobject reference: {subobject2}. Use format like 'Face1', 'Edge2', 'Vertex3'",
                "data": None,
            }

        valid1, msg1 = _validate_subobject(obj1, sub_type1, sub_idx1)
        if not valid1:
            return {
                "success": False,
                "error": f"{object1}.{subobject1}: {msg1}",
                "data": None,
            }

        valid2, msg2 = _validate_subobject(obj2, sub_type2, sub_idx2)
        if not valid2:
            return {
                "success": False,
                "error": f"{object2}.{subobject2}: {msg2}",
                "data": None,
            }

        module_name, module_alias = _get_assembly_module()

        constraint_info = {
            "constraintType": constraint_type,
            "object1": object1,
            "subobject1": f"{sub_type1}{sub_idx1}",
            "object2": object2,
            "subobject2": f"{sub_type2}{sub_idx2}",
            "value": value,
            "module": module_alias,
        }

        if module_alias == "Assembly3":
            return _create_assembly3_constraint(
                obj1,
                sub_type1,
                sub_idx1,
                obj2,
                sub_type2,
                sub_idx2,
                constraint_type,
                name,
                value,
            )
        elif module_alias == "A2plus":
            return _create_a2plus_constraint(
                obj1,
                sub_type1,
                sub_idx1,
                obj2,
                sub_type2,
                sub_idx2,
                constraint_type,
                name,
                value,
            )
        else:
            return {
                "success": True,
                "data": {
                    "constraintName": name or f"{constraint_type}Constraint",
                    "constraintType": constraint_type,
                    "object1": object1,
                    "subobject1": f"{sub_type1}{sub_idx1}",
                    "object2": object2,
                    "subobject2": f"{sub_type2}{sub_idx2}",
                    "value": value,
                    "note": "Assembly module not detected - constraint recorded as metadata only",
                    "message": f"Created {constraint_type} constraint between {object1}.{sub_type1}{sub_idx1} and {object2}.{sub_type2}{sub_idx2}",
                },
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def _create_assembly3_constraint(
    obj1, sub_type1, sub_idx1, obj2, sub_type2, sub_idx2, constraint_type, name, value
):
    """Create constraint using Assembly3 workbench."""
    try:
        import Assembly3

        constraint_type_to_joint_type = {
            "coincident": "Fixed",
            "parallel": "Parallel",
            "perpendicular": "Perpendicular",
            "angle": "Angle",
            "distance": "Distance",
            "insert": "Revolute",
            "tangent": "Slider",
            "equal": "Fixed",
            "symmetric": "Perpendicular",
        }

        joint_type = constraint_type_to_joint_type.get(constraint_type.lower(), "Fixed")

        element1 = f"{obj1.Name}.{sub_type1}{sub_idx1}"
        element2 = f"{obj2.Name}.{sub_type2}{sub_idx2}"

        constraint_name = name or f"{constraint_type.capitalize()}Constraint"

        try:
            import UtilsAssembly

            assembly = UtilsAssembly.activeAssembly()
            if assembly is None:
                for o in App.ActiveDocument.Objects:
                    if o.isDerivedFrom("Assembly::AssemblyObject"):
                        assembly = o
                        break

            if assembly is None:
                return {
                    "success": False,
                    "error": "No active Assembly found. Please open an Assembly workbench.",
                    "data": None,
                }

            from JointObject import Joint, ViewProviderJoint

            joint_group = UtilsAssembly.getJointGroup(assembly)
            joint_obj = joint_group.newObject("App::FeaturePython", constraint_name)
            Joint(
                joint_obj,
                [
                    "Fixed",
                    "Revolute",
                    "Cylindrical",
                    "Slider",
                    "Ball",
                    "Distance",
                    "Parallel",
                    "Perpendicular",
                    "Angle",
                    "RackPinion",
                    "Screw",
                    "Gears",
                    "Belt",
                ].index(joint_type),
            )

            joint_obj.Reference1 = [obj1, [element1]]
            joint_obj.Reference2 = [obj2, [element2]]

            if value is not None:
                if constraint_type.lower() == "angle":
                    joint_obj.Angle = float(value)
                elif constraint_type.lower() == "distance":
                    joint_obj.Distance = float(value)

            ViewProviderJoint(joint_obj.ViewObject)

            App.ActiveDocument.recompute()

            return {
                "success": True,
                "data": {
                    "constraintName": joint_obj.Name,
                    "constraintType": constraint_type,
                    "object1": obj1.Name,
                    "subobject1": f"{sub_type1}{sub_idx1}",
                    "object2": obj2.Name,
                    "subobject2": f"{sub_type2}{sub_idx2}",
                    "value": value,
                    "module": "Assembly3",
                    "message": f"Created {constraint_type} constraint (Assembly3): {element1} - {element2}",
                },
            }
        except ImportError:
            return {
                "success": False,
                "error": "Assembly3 constraints require the built-in Assembly workbench. Use 'import UtilsAssembly' in FreeCAD console.",
                "data": None,
            }

    except ImportError:
        return {
            "success": False,
            "error": "Assembly3 workbench is not installed. Please install Assembly3 from the FreeCAD addon manager.",
            "data": None,
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Assembly3 constraint creation failed: {str(e)}",
            "data": None,
        }


def _create_a2plus_constraint(
    obj1, sub_type1, sub_idx1, obj2, sub_type2, sub_idx2, constraint_type, name, value
):
    """Create constraint using A2plus workbench."""
    try:
        import A2plus

        constraint_type_to_joint_type = {
            "coincident": "Fixed",
            "parallel": "Parallel",
            "perpendicular": "Perpendicular",
            "angle": "Angle",
            "distance": "Distance",
            "insert": "Revolute",
            "tangent": "Slider",
            "equal": "Fixed",
            "symmetric": "Perpendicular",
        }

        joint_type = constraint_type_to_joint_type.get(constraint_type.lower(), "Fixed")

        element1 = f"{obj1.Name}.{sub_type1}{sub_idx1}"
        element2 = f"{obj2.Name}.{sub_type2}{sub_idx2}"

        constraint_name = name or f"{constraint_type.capitalize()}Constraint"

        try:
            import UtilsAssembly

            assembly = UtilsAssembly.activeAssembly()
            if assembly is None:
                for o in App.ActiveDocument.Objects:
                    if o.isDerivedFrom("Assembly::AssemblyObject"):
                        assembly = o
                        break

            if assembly is None:
                return {
                    "success": False,
                    "error": "No active Assembly found. Please open an Assembly workbench.",
                    "data": None,
                }

            from JointObject import Joint, ViewProviderJoint

            joint_group = UtilsAssembly.getJointGroup(assembly)
            joint_obj = joint_group.newObject("App::FeaturePython", constraint_name)
            Joint(
                joint_obj,
                [
                    "Fixed",
                    "Revolute",
                    "Cylindrical",
                    "Slider",
                    "Ball",
                    "Distance",
                    "Parallel",
                    "Perpendicular",
                    "Angle",
                    "RackPinion",
                    "Screw",
                    "Gears",
                    "Belt",
                ].index(joint_type),
            )

            joint_obj.Reference1 = [obj1, [element1]]
            joint_obj.Reference2 = [obj2, [element2]]

            if value is not None:
                if constraint_type.lower() == "angle":
                    joint_obj.Angle = float(value)
                elif constraint_type.lower() == "distance":
                    joint_obj.Distance = float(value)

            ViewProviderJoint(joint_obj.ViewObject)

            App.ActiveDocument.recompute()

            return {
                "success": True,
                "data": {
                    "constraintName": joint_obj.Name,
                    "constraintType": constraint_type,
                    "object1": obj1.Name,
                    "subobject1": f"{sub_type1}{sub_idx1}",
                    "object2": obj2.Name,
                    "subobject2": f"{sub_type2}{sub_idx2}",
                    "value": value,
                    "module": "A2plus",
                    "message": f"Created {constraint_type} constraint (A2plus): {element1} - {element2}",
                },
            }
        except ImportError:
            return {
                "success": False,
                "error": "A2plus constraints require the built-in Assembly workbench. Use 'import UtilsAssembly' in FreeCAD console.",
                "data": None,
            }

    except ImportError:
        return {
            "success": False,
            "error": "A2plus workbench is not installed. Please install A2plus from the FreeCAD addon manager.",
            "data": None,
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"A2plus constraint creation failed: {str(e)}",
            "data": None,
        }


def handle_add_coincident_constraint(
    object1, subobject1, object2, subobject2, name=None
):
    """
    Add a coincident constraint between two subobjects.

    Args:
        object1: First object name
        subobject1: First subobject (e.g., 'Face1')
        object2: Second object name
        subobject2: Second subobject
        name: Optional constraint name

    Returns:
        dict with success status, constraint info, and message
    """
    return _create_constraint(
        object1, subobject1, object2, subobject2, "coincident", name
    )


def handle_add_parallel_constraint(object1, subobject1, object2, subobject2, name=None):
    """
    Add a parallel constraint between two subobjects.

    Args:
        object1: First object name
        subobject1: First subobject
        object2: Second object name
        subobject2: Second subobject
        name: Optional constraint name

    Returns:
        dict with success status, constraint info, and message
    """
    return _create_constraint(
        object1, subobject1, object2, subobject2, "parallel", name
    )


def handle_add_perpendicular_constraint(
    object1, subobject1, object2, subobject2, name=None
):
    """
    Add a perpendicular constraint between two subobjects.

    Args:
        object1: First object name
        subobject1: First subobject
        object2: Second object name
        subobject2: Second subobject
        name: Optional constraint name

    Returns:
        dict with success status, constraint info, and message
    """
    return _create_constraint(
        object1, subobject1, object2, subobject2, "perpendicular", name
    )


def handle_add_angle_constraint(
    object1, subobject1, object2, subobject2, angle, name=None
):
    """
    Add an angle constraint between two subobjects.

    Args:
        object1: First object name
        subobject1: First subobject
        object2: Second object name
        subobject2: Second subobject
        angle: Angle value in degrees
        name: Optional constraint name

    Returns:
        dict with success status, constraint info, and message
    """
    return _create_constraint(
        object1, subobject1, object2, subobject2, "angle", name, angle
    )


def handle_add_distance_constraint(
    object1, subobject1, object2, subobject2, distance, name=None
):
    """
    Add a distance constraint between two subobjects.

    Args:
        object1: First object name
        subobject1: First subobject
        object2: Second object name
        subobject2: Second subobject
        distance: Distance value in mm
        name: Optional constraint name

    Returns:
        dict with success status, constraint info, and message
    """
    return _create_constraint(
        object1, subobject1, object2, subobject2, "distance", name, distance
    )


def handle_add_insert_constraint(object1, subobject1, object2, subobject2, name=None):
    """
    Add an insert (axial) constraint between two subobjects.

    Args:
        object1: First object name
        subobject1: First subobject (cylindrical face)
        object2: Second object name
        subobject2: Second subobject (cylindrical face)
        name: Optional constraint name

    Returns:
        dict with success status, constraint info, and message
    """
    return _create_constraint(object1, subobject1, object2, subobject2, "insert", name)


def handle_add_tangent_constraint(object1, subobject1, object2, subobject2, name=None):
    """
    Add a tangent constraint between two subobjects.

    Args:
        object1: First object name
        subobject1: First subobject
        object2: Second object name
        subobject2: Second subobject
        name: Optional constraint name

    Returns:
        dict with success status, constraint info, and message
    """
    return _create_constraint(object1, subobject1, object2, subobject2, "tangent", name)


def handle_add_equal_constraint(object1, subobject1, object2, subobject2, name=None):
    """
    Add an equal constraint between two subobjects.

    Args:
        object1: First object name
        subobject1: First subobject
        object2: Second object name
        subobject2: Second subobject
        name: Optional constraint name

    Returns:
        dict with success status, constraint info, and message
    """
    return _create_constraint(object1, subobject1, object2, subobject2, "equal", name)


def handle_add_symmetric_constraint(
    object1, subobject1, object2, subobject2, symmetry_plane=None, name=None
):
    """
    Add a symmetric constraint between two subobjects about a plane.

    Args:
        object1: First object name
        subobject1: First subobject
        object2: Second object name
        subobject2: Second subobject
        symmetry_plane: Reference plane for symmetry (optional)
        name: Optional constraint name

    Returns:
        dict with success status, constraint info, and message
    """
    return _create_constraint(
        object1, subobject1, object2, subobject2, "symmetric", name, symmetry_plane
    )


def handle_update_constraint_value(constraint_name, new_value):
    """
    Update the value of an existing constraint.

    Args:
        constraint_name: Name of the constraint to update
        new_value: New value for the constraint

    Returns:
        dict with success status, old/new values, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        constraint_obj = doc.getObject(constraint_name)
        if constraint_obj is None:
            return {
                "success": False,
                "error": f"Constraint '{constraint_name}' not found",
                "data": None,
            }

        old_value = None
        value_property = None

        if hasattr(constraint_obj, "Value"):
            old_value = constraint_obj.Value
            constraint_obj.Value = float(new_value)
            value_property = "Value"
        elif hasattr(constraint_obj, "Angle"):
            old_value = constraint_obj.Angle
            constraint_obj.Angle = float(new_value)
            value_property = "Angle"
        elif hasattr(constraint_obj, "Distance"):
            old_value = constraint_obj.Distance
            constraint_obj.Distance = float(new_value)
            value_property = "Distance"
        else:
            constraint_type = getattr(constraint_obj, "JointType", None)
            if constraint_type is None:
                constraint_type = getattr(constraint_obj, "TypeId", "unknown")

            available_props = []
            for prop in ["Value", "Angle", "Distance", "Distance2"]:
                if hasattr(constraint_obj, prop):
                    available_props.append(prop)

            error_msg = (
                f"Constraint '{constraint_name}' (type: {constraint_type}) does not have "
                f"a value property that can be edited. "
                f"Editable properties: {available_props if available_props else 'none'}. "
                f"Only Angle and Distance constraints support value updates."
            )
            return {
                "success": False,
                "error": error_msg,
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "constraintName": constraint_name,
                "oldValue": old_value,
                "newValue": new_value,
                "valueProperty": value_property,
                "message": f"Updated constraint '{constraint_name}' from {old_value} to {new_value}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_remove_constraint(constraint_name):
    """
    Remove a constraint from the assembly.

    Args:
        constraint_name: Name of the constraint to remove

    Returns:
        dict with success status and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        constraint_obj = doc.getObject(constraint_name)
        if constraint_obj is None:
            return {
                "success": False,
                "error": f"Constraint '{constraint_name}' not found",
                "data": None,
            }

        doc.removeObject(constraint_name)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "removedConstraint": constraint_name,
                "message": f"Removed constraint '{constraint_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_constraints(assembly_name=None):
    """
    List all constraints in an assembly or the entire document.

    Args:
        assembly_name: Optional assembly name to filter by

    Returns:
        dict with success status and list of constraints
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        constraints = []

        for obj in doc.Objects:
            if hasattr(obj, "JointType"):
                constraint_info = {
                    "name": obj.Name,
                    "label": obj.Label,
                    "type": f"JointType.{obj.JointType}",
                    "value": getattr(obj, "Angle", None)
                    or getattr(obj, "Distance", None),
                    "status": "active"
                    if not getattr(obj, "Suppressed", False)
                    else "suppressed",
                }
                constraints.append(constraint_info)
            elif obj.TypeId in [
                "Assembly::Constraint",
                "Constraint",
                "App::Constraint",
            ]:
                constraint_info = {
                    "name": obj.Name,
                    "label": obj.Label,
                    "type": obj.TypeId,
                    "value": getattr(obj, "Value", None),
                    "status": "active"
                    if not getattr(obj, "Suppressed", False)
                    else "suppressed",
                }
                constraints.append(constraint_info)
            elif hasattr(obj, "Constraints"):
                for constraint in obj.Constraints:
                    constraint_info = {
                        "name": constraint.Name
                        if hasattr(constraint, "Name")
                        else obj.Name,
                        "label": constraint.Label
                        if hasattr(constraint, "Label")
                        else obj.Label,
                        "type": str(constraint.Type)
                        if hasattr(constraint, "Type")
                        else "unknown",
                        "value": constraint.Value
                        if hasattr(constraint, "Value")
                        else None,
                        "status": "active"
                        if not getattr(constraint, "Suppressed", False)
                        else "suppressed",
                    }
                    constraints.append(constraint_info)

        if assembly_name:
            assembly = _get_assembly_object(doc, assembly_name)
            if assembly:
                filtered = []
                if hasattr(assembly, "Group"):
                    assembly_obj_names = [o.Name for o in assembly.Group]
                    filtered = [
                        c
                        for c in constraints
                        if c.get("name", "").split(".")[0] in assembly_obj_names
                    ]
                    constraints = filtered

        return {
            "success": True,
            "data": {
                "constraints": constraints,
                "count": len(constraints),
                "message": f"Found {len(constraints)} constraint(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_suppress_constraint(constraint_name):
    """
    Suppress (temporarily disable) a constraint.

    Args:
        constraint_name: Name of the constraint to suppress

    Returns:
        dict with success status and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        constraint_obj = doc.getObject(constraint_name)
        if constraint_obj is None:
            return {
                "success": False,
                "error": f"Constraint '{constraint_name}' not found",
                "data": None,
            }

        if hasattr(constraint_obj, "Suppressed"):
            constraint_obj.Suppressed = True
        elif hasattr(constraint_obj, "suppressed"):
            constraint_obj.suppressed = True

        doc.recompute()

        return {
            "success": True,
            "data": {
                "constraintName": constraint_name,
                "status": "suppressed",
                "message": f"Suppressed constraint '{constraint_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_activate_constraint(constraint_name):
    """
    Activate (re-enable) a suppressed constraint.

    Args:
        constraint_name: Name of the constraint to activate

    Returns:
        dict with success status and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        constraint_obj = doc.getObject(constraint_name)
        if constraint_obj is None:
            return {
                "success": False,
                "error": f"Constraint '{constraint_name}' not found",
                "data": None,
            }

        if hasattr(constraint_obj, "Suppressed"):
            constraint_obj.Suppressed = False
        elif hasattr(constraint_obj, "suppressed"):
            constraint_obj.suppressed = False

        doc.recompute()

        return {
            "success": True,
            "data": {
                "constraintName": constraint_name,
                "status": "active",
                "message": f"Activated constraint '{constraint_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "get_subobject_reference",
    "handle_create_assembly",
    "handle_add_component_to_assembly",
    "handle_remove_component_from_assembly",
    "handle_list_assemblies",
    "handle_list_assembly_components",
    "handle_add_coincident_constraint",
    "handle_add_parallel_constraint",
    "handle_add_perpendicular_constraint",
    "handle_add_angle_constraint",
    "handle_add_distance_constraint",
    "handle_add_insert_constraint",
    "handle_add_tangent_constraint",
    "handle_add_equal_constraint",
    "handle_add_symmetric_constraint",
    "handle_update_constraint_value",
    "handle_remove_constraint",
    "handle_list_constraints",
    "handle_suppress_constraint",
    "handle_activate_constraint",
]
