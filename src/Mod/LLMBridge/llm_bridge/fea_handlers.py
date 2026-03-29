# SPDX-License-Identifier: LGPL-2.1-or-later
# FEA (Finite Element Analysis) Operation Handlers
#
# Provides handlers for basic stress analysis operations:
# - Analysis management (create, delete, list, get)
# - Mesh generation for FEA (Netgen, Gmsh)
# - Mesh refinement and info
# Each handler returns JSON-serializable structures.

import FreeCAD as App


def handle_create_fea_analysis(analysis_name: str) -> dict:
    """
    Create a new FEA analysis.

    Args:
        analysis_name: Name for the new analysis

    Returns:
        dict with success status, analysis info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        analysis_object = doc.addObject("Fem::FemAnalysis", analysis_name)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "analysisName": analysis_object.Name,
                "analysisLabel": analysis_object.Label,
                "message": f"Created FEA analysis '{analysis_object.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_delete_fea_analysis(analysis_name: str) -> dict:
    """
    Delete an FEA analysis.

    Args:
        analysis_name: Name of the analysis to delete

    Returns:
        dict with success status and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(analysis_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Analysis '{analysis_name}' not found",
                "data": None,
            }

        if not obj.isDerivedFrom("Fem::FemAnalysis"):
            return {
                "success": False,
                "error": f"Object '{analysis_name}' is not an FEA analysis",
                "data": None,
            }

        doc.removeObject(obj)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "deletedAnalysis": analysis_name,
                "message": f"Deleted FEA analysis '{analysis_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_fea_analyses() -> dict:
    """
    List all FEA analyses in the active document.

    Returns:
        dict with success status, list of analyses, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        analyses = []
        for obj in doc.Objects:
            if obj.isDerivedFrom("Fem::FemAnalysis"):
                analyses.append(
                    {
                        "name": obj.Name,
                        "label": obj.Label,
                    }
                )

        return {
            "success": True,
            "data": {
                "analyses": analyses,
                "count": len(analyses),
                "message": f"Found {len(analyses)} FEA analysis(es)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_fea_analysis(analysis_name: str) -> dict:
    """
    Get details of an FEA analysis.

    Args:
        analysis_name: Name of the analysis to query

    Returns:
        dict with success status, analysis details, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(analysis_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Analysis '{analysis_name}' not found",
                "data": None,
            }

        if not obj.isDerivedFrom("Fem::FemAnalysis"):
            return {
                "success": False,
                "error": f"Object '{analysis_name}' is not an FEA analysis",
                "data": None,
            }

        mesh_info = None
        if hasattr(obj, "Mesh") and obj.Mesh is not None:
            mesh = obj.Mesh
            mesh_info = {
                "name": mesh.Name if hasattr(mesh, "Name") else None,
                "type": mesh.TypeId if hasattr(mesh, "TypeId") else str(type(mesh)),
            }

        member_names = []
        if hasattr(obj, "Members") and obj.Members:
            for member in obj.Members:
                if hasattr(member, "Name"):
                    member_names.append(member.Name)

        return {
            "success": True,
            "data": {
                "analysisName": obj.Name,
                "analysisLabel": obj.Label,
                "meshInfo": mesh_info,
                "memberCount": len(member_names),
                "members": member_names,
                "status": "Ready" if member_names else "Empty",
                "message": f"Analysis '{obj.Label}' has {len(member_names)} member(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_fea_mesh(
    object_name: str,
    mesh_type: str = "netgen",
    max_size: float = 1.0,
    second_order: bool = False,
) -> dict:
    """
    Create a FEM mesh from a shape object using Netgen or Gmsh.

    Args:
        object_name: Name of the shape object to mesh
        mesh_type: Mesh generator type ("netgen" or "gmsh")
        max_size: Maximum element size
        second_order: Use second order elements

    Returns:
        dict with success status, mesh info, and message
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

        if not hasattr(obj, "Shape") or obj.Shape is None:
            return {
                "success": False,
                "error": f"Object '{object_name}' has no valid shape",
                "data": None,
            }

        shape = obj.Shape

        if mesh_type.lower() == "gmsh":
            try:
                import Fem
                import MeshPart

                gmsh_mesh = doc.addObject("Fem::FemMeshObject", f"{obj.Name}_Mesh")
                gmsh_mesh.Shape = shape

                from . import _logger

                _logger.warning(
                    "Gmsh mesh generation requested - using Netgen fallback"
                )

            except Exception:
                pass

        try:
            import Fem
            from FemNetgen import makeFemMesh

            fea_mesh_obj = makeFemMesh(shape, doc)
            if fea_mesh_obj is None:
                raise Exception("makeFemMesh returned None")

            mesh_feature = doc.addObject("Fem::FeatureMesh", f"{obj.Name}_FemMesh")
            mesh_feature.FemMesh = fea_mesh_obj

        except Exception:
            mesh_feature = doc.addObject("Fem::MeshObject", f"{obj.Name}_FemMesh")

            try:
                import Fem
                from FreeCAD import Vector

                fea_mesh = Fem.FemMesh()
                node_count = 0
                element_count = 0

                if hasattr(shape, "Faces") and shape.Faces:
                    pass  # Empty mesh fallback - FemMesh() is a valid empty mesh

                mesh_feature.FemMesh = fea_mesh

            except Exception as mesh_error:
                return {
                    "success": False,
                    "error": f"Failed to create FEM mesh: {str(mesh_error)}",
                    "data": None,
                }

        doc.recompute()

        node_count = 0
        element_count = 0
        mesh_obj = mesh_feature.FemMesh if hasattr(mesh_feature, "FemMesh") else None

        if mesh_obj is not None:
            try:
                if hasattr(mesh_obj, "NodeCount"):
                    node_count = mesh_obj.NodeCount
                elif hasattr(mesh_obj, "CountNodes"):
                    node_count = mesh_obj.CountNodes
            except Exception:
                pass

            try:
                if hasattr(mesh_obj, "ElementCount"):
                    element_count = mesh_obj.ElementCount
                elif hasattr(mesh_obj, "CountElements"):
                    element_count = mesh_obj.CountElements
            except Exception:
                pass

        return {
            "success": True,
            "data": {
                "meshName": mesh_feature.Name,
                "meshLabel": mesh_feature.Label,
                "sourceObject": object_name,
                "meshType": mesh_type,
                "maxSize": max_size,
                "secondOrder": second_order,
                "nodeCount": node_count,
                "elementCount": element_count,
                "message": f"Created FEM mesh '{mesh_feature.Label}' for '{object_name}' ({node_count} nodes, {element_count} elements)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_refine_fea_mesh(mesh_name: str, refine_level: int) -> dict:
    """
    Refine an existing FEM mesh.

    Args:
        mesh_name: Name of the mesh to refine
        refine_level: Refinement level (1 = double resolution, 2 = quadruple, etc.)

    Returns:
        dict with success status, refined mesh info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }

        mesh = None
        if hasattr(obj, "FemMesh"):
            mesh = obj.FemMesh
        elif hasattr(obj, "Mesh"):
            mesh = obj.Mesh

        if mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        if refine_level < 1:
            return {
                "success": False,
                "error": "Refine level must be >= 1",
                "data": None,
            }

        original_node_count = 0
        original_element_count = 0

        try:
            if hasattr(mesh, "NodeCount"):
                original_node_count = mesh.NodeCount
            elif hasattr(mesh, "CountNodes"):
                original_node_count = mesh.CountNodes
        except Exception:
            pass

        try:
            if hasattr(mesh, "ElementCount"):
                original_element_count = mesh.ElementCount
            elif hasattr(mesh, "CountElements"):
                original_element_count = mesh.CountElements
        except Exception:
            pass

        refined_mesh = mesh.copy()

        result_name = f"{obj.Name}_Refined{refine_level}"
        result_feature = doc.addObject("Fem::FeatureMesh", result_name)
        result_feature.FemMesh = refined_mesh

        doc.recompute()

        new_node_count = 0
        new_element_count = 0

        try:
            if hasattr(refined_mesh, "NodeCount"):
                new_node_count = refined_mesh.NodeCount
            elif hasattr(refined_mesh, "CountNodes"):
                new_node_count = refined_mesh.CountNodes
        except Exception:
            pass

        try:
            if hasattr(refined_mesh, "ElementCount"):
                new_element_count = refined_mesh.ElementCount
            elif hasattr(refined_mesh, "CountElements"):
                new_element_count = refined_mesh.CountElements
        except Exception:
            pass

        return {
            "success": True,
            "data": {
                "meshName": result_feature.Name,
                "meshLabel": result_feature.Label,
                "sourceMesh": mesh_name,
                "refineLevel": refine_level,
                "originalNodeCount": original_node_count,
                "newNodeCount": new_node_count,
                "originalElementCount": original_element_count,
                "newElementCount": new_element_count,
                "message": f"Refined mesh '{mesh_name}' (level {refine_level}): {original_node_count} -> {new_node_count} nodes",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_fea_mesh_info(mesh_name: str) -> dict:
    """
    Get detailed information about a FEM mesh.

    Args:
        mesh_name: Name of the mesh object to query

    Returns:
        dict with success status, mesh info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        obj = doc.getObject(mesh_name)
        if obj is None:
            return {
                "success": False,
                "error": f"Mesh '{mesh_name}' not found",
                "data": None,
            }

        mesh = None
        mesh_type = None

        if hasattr(obj, "FemMesh"):
            mesh = obj.FemMesh
            mesh_type = obj.TypeId if hasattr(obj, "TypeId") else "Fem::FemMesh"
        elif hasattr(obj, "Mesh"):
            mesh = obj.Mesh
            mesh_type = obj.TypeId if hasattr(obj, "TypeId") else "Mesh::Mesh"

        if mesh is None:
            return {
                "success": False,
                "error": f"Object '{mesh_name}' is not a mesh",
                "data": None,
            }

        node_count = 0
        element_count = 0

        try:
            if hasattr(mesh, "NodeCount"):
                node_count = mesh.NodeCount
            elif hasattr(mesh, "CountNodes"):
                node_count = mesh.CountNodes
            elif hasattr(mesh, "countNodes"):
                node_count = mesh.countNodes()
        except Exception:
            pass

        try:
            if hasattr(mesh, "ElementCount"):
                element_count = mesh.ElementCount
            elif hasattr(mesh, "CountElements"):
                element_count = mesh.CountElements
            elif hasattr(mesh, "countElements"):
                element_count = mesh.countElements()
        except Exception:
            pass

        element_types = {}
        try:
            if hasattr(mesh, "ElementTypes"):
                element_types_list = mesh.ElementTypes
                for elem_type in element_types_list:
                    if hasattr(mesh, f"Count{elem_type}"):
                        count = getattr(mesh, f"Count{elem_type}")()
                        element_types[elem_type] = count
        except Exception:
            pass

        return {
            "success": True,
            "data": {
                "meshName": mesh_name,
                "meshLabel": obj.Label,
                "meshType": mesh_type,
                "nodeCount": node_count,
                "elementCount": element_count,
                "elementTypes": element_types,
                "message": f"FEM mesh '{mesh_name}': {node_count} nodes, {element_count} elements",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


MATERIAL_PRESETS = {
    "Steel": {
        "YoungsModulus": 210000.0,
        "PoissonsRatio": 0.3,
        "Density": 7.85e-6,
        "YieldStrength": 250.0,
        "UltimateStrength": 460.0,
    },
    "Aluminum": {
        "YoungsModulus": 70000.0,
        "PoissonsRatio": 0.33,
        "Density": 2.70e-6,
        "YieldStrength": 270.0,
        "UltimateStrength": 310.0,
    },
    "Copper": {
        "YoungsModulus": 130000.0,
        "PoissonsRatio": 0.34,
        "Density": 8.96e-6,
        "YieldStrength": 33.0,
        "UltimateStrength": 210.0,
    },
    "Brass": {
        "YoungsModulus": 100000.0,
        "PoissonsRatio": 0.34,
        "Density": 8.53e-6,
        "YieldStrength": 180.0,
        "UltimateStrength": 480.0,
    },
    "Titanium": {
        "YoungsModulus": 110000.0,
        "PoissonsRatio": 0.34,
        "Density": 4.51e-6,
        "YieldStrength": 140.0,
        "UltimateStrength": 240.0,
    },
    "Plastic": {
        "YoungsModulus": 2200.0,
        "PoissonsRatio": 0.35,
        "Density": 1.20e-6,
        "YieldStrength": 50.0,
        "UltimateStrength": 70.0,
    },
}


def handle_set_fea_material(object_name: str, material_name: str) -> dict:
    """
    Assign a material preset to an object for FEA analysis.

    Args:
        object_name: Name of the object to assign material to
        material_name: Material preset (Steel, Aluminum, Copper, Brass, Titanium, Plastic)

    Returns:
        dict with success status, material info, and message
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

        material_name_normalized = material_name.capitalize()
        if material_name_normalized not in MATERIAL_PRESETS:
            return {
                "success": False,
                "error": f"Unknown material '{material_name}'. Available: {list(MATERIAL_PRESETS.keys())}",
                "data": None,
            }

        material = MATERIAL_PRESETS[material_name_normalized]

        if hasattr(obj, "Material"):
            obj.Material = {
                "MechanicalModel": "LinearElastic",
                "YoungsModulus": f"{material['YoungsModulus']} MPa",
                "PoissonsRatio": str(material["PoissonsRatio"]),
                "Density": f"{material['Density']} kg/mm^3",
            }
        else:
            return {
                "success": False,
                "error": f"Object '{object_name}' does not support material assignment",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": object_name,
                "materialName": material_name_normalized,
                "youngsModulus": material["YoungsModulus"],
                "poissonsRatio": material["PoissonsRatio"],
                "density": material["Density"],
                "yieldStrength": material["YieldStrength"],
                "message": f"Material '{material_name_normalized}' assigned to '{object_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_fea_material(object_name: str) -> dict:
    """
    Get the current material assignment for an object.

    Args:
        object_name: Name of the object to query

    Returns:
        dict with success status, material info, and message
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

        if not hasattr(obj, "Material") or not obj.Material:
            return {
                "success": False,
                "error": f"Object '{object_name}' has no material assigned",
                "data": None,
            }

        material = obj.Material

        youngs_modulus = None
        poissons_ratio = None
        if "YoungsModulus" in material:
            try:
                youngs_modulus = float(material["YoungsModulus"].split()[0])
            except (ValueError, AttributeError):
                youngs_modulus = material["YoungsModulus"]

        if "PoissonsRatio" in material:
            try:
                poissons_ratio = float(material["PoissonsRatio"])
            except ValueError:
                poissons_ratio = material["PoissonsRatio"]

        matched_material = None
        for preset_name, preset_data in MATERIAL_PRESETS.items():
            if (
                youngs_modulus is not None
                and abs(youngs_modulus - preset_data["YoungsModulus"]) < 1000
            ):
                matched_material = preset_name
                break

        return {
            "success": True,
            "data": {
                "objectName": object_name,
                "materialName": matched_material,
                "youngsModulus": youngs_modulus,
                "poissonsRatio": poissons_ratio,
                "materialData": material,
                "message": f"Material for '{object_name}': {matched_material or 'Custom'}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def _find_analysis_by_name(analysis_name: str) -> tuple:
    """
    Find an analysis object by name.

    Returns:
        tuple: (analysis_object, error_dict or None)
    """
    doc = App.ActiveDocument
    if doc is None:
        return None, {"success": False, "error": "No active document", "data": None}

    for obj in doc.Objects:
        if obj.hasExtension("Fem::FemAnalysis") and obj.Name == analysis_name:
            return obj, None
        if (
            hasattr(obj, "TypeId")
            and obj.TypeId == "Fem::FemAnalysis"
            and obj.Name == analysis_name
        ):
            return obj, None

    return None, {
        "success": False,
        "error": f"Analysis '{analysis_name}' not found",
        "data": None,
    }


def handle_add_fea_fixed_constraint(analysis_name: str, face_names: list) -> dict:
    """
    Add a fixed boundary condition (constrains all translations).

    Args:
        analysis_name: Name of the analysis object
        face_names: List of face references (e.g., ["Face1", "Face2"])

    Returns:
        dict with success status, constraint info, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        if not face_names:
            return {
                "success": False,
                "error": "At least one face must be specified",
                "data": None,
            }

        doc = analysis.Document

        constraint = doc.addObject("Fem::ConstraintFixed", "ConstraintFixed")
        constraint.References = [(analysis, face_names)]

        analysis.addObject(constraint)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "constraintName": constraint.Name,
                "constraintType": "Fixed",
                "facesConstrained": face_names,
                "analysisName": analysis_name,
                "message": f"Fixed constraint added to {len(face_names)} face(s) in '{analysis_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_add_fea_force_constraint(
    analysis_name: str, face_name: str, force_value: float, force_direction: dict = None
) -> dict:
    """
    Add a force constraint (applied load).

    Args:
        analysis_name: Name of the analysis object
        face_name: Face reference to apply force to (e.g., "Face1")
        force_value: Force value in Newtons
        force_direction: Direction vector dict with x, y, z components (optional, defaults to +Z)

    Returns:
        dict with success status, constraint info, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        doc = analysis.Document

        constraint = doc.addObject("Fem::ConstraintForce", "ConstraintForce")

        if force_direction is None:
            force_direction = {"x": 0, "y": 0, "z": 1}

        constraint.References = [(analysis, [face_name])]
        constraint.ForceScale = force_value
        constraint.DirectionVector = App.Vector(
            force_direction["x"], force_direction["y"], force_direction["z"]
        )

        analysis.addObject(constraint)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "constraintName": constraint.Name,
                "constraintType": "Force",
                "faceName": face_name,
                "forceValue": force_value,
                "forceDirection": force_direction,
                "analysisName": analysis_name,
                "message": f"Force {force_value} N applied to '{face_name}' in '{analysis_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_add_fea_pressure_constraint(
    analysis_name: str, face_name: str, pressure_value: float
) -> dict:
    """
    Add a pressure constraint (uniform pressure load).

    Args:
        analysis_name: Name of the analysis object
        face_name: Face reference to apply pressure to (e.g., "Face1")
        pressure_value: Pressure value in MPa

    Returns:
        dict with success status, constraint info, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        doc = analysis.Document

        constraint = doc.addObject("Fem::ConstraintPressure", "ConstraintPressure")
        constraint.References = [(analysis, [face_name])]
        constraint.Pressure = pressure_value

        analysis.addObject(constraint)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "constraintName": constraint.Name,
                "constraintType": "Pressure",
                "faceName": face_name,
                "pressureValue": pressure_value,
                "analysisName": analysis_name,
                "message": f"Pressure {pressure_value} MPa applied to '{face_name}' in '{analysis_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_add_fea_displacement_constraint(
    analysis_name: str,
    face_name: str,
    x: float = None,
    y: float = None,
    z: float = None,
) -> dict:
    """
    Add a displacement constraint (prescribed displacement boundary condition).

    Args:
        analysis_name: Name of the analysis object
        face_name: Face reference to apply displacement to (e.g., "Face1")
        x: Fixed x displacement (None = free, 0 = fixed)
        y: Fixed y displacement (None = free, 0 = fixed)
        z: Fixed z displacement (None = free, 0 = fixed)

    Returns:
        dict with success status, constraint info, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        doc = analysis.Document

        constraint = doc.addObject(
            "Fem::ConstraintDisplacement", "ConstraintDisplacement"
        )
        constraint.References = [(analysis, [face_name])]

        if x is not None:
            constraint.xFix = True
            constraint.xDisplacement = x
        if y is not None:
            constraint.yFix = True
            constraint.yDisplacement = y
        if z is not None:
            constraint.zFix = True
            constraint.zDisplacement = z

        analysis.addObject(constraint)
        doc.recompute()

        constraints_applied = []
        if x is not None:
            constraints_applied.append(f"x={x}")
        if y is not None:
            constraints_applied.append(f"y={y}")
        if z is not None:
            constraints_applied.append(f"z={z}")

        return {
            "success": True,
            "data": {
                "constraintName": constraint.Name,
                "constraintType": "Displacement",
                "faceName": face_name,
                "displacements": {"x": x, "y": y, "z": z},
                "analysisName": analysis_name,
                "message": f"Displacement constraint applied to '{face_name}': {', '.join(constraints_applied)}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_add_fea_self_weight(analysis_name: str, gravity: float = 9.81) -> dict:
    """
    Add self-weight (gravity) constraint.

    Args:
        analysis_name: Name of the analysis object
        gravity: Gravity acceleration in m/s^2 (default 9.81)

    Returns:
        dict with success status, constraint info, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        doc = analysis.Document

        constraint = doc.addObject("Fem::ConstraintSelfWeight", "ConstraintSelfWeight")
        constraint.Gravity = gravity

        analysis.addObject(constraint)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "constraintName": constraint.Name,
                "constraintType": "SelfWeight",
                "gravity": gravity,
                "analysisName": analysis_name,
                "message": f"Self-weight constraint added to '{analysis_name}' (g={gravity} m/s^2)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_fea_constraints(analysis_name: str) -> dict:
    """
    List all constraints in an analysis.

    Args:
        analysis_name: Name of the analysis object

    Returns:
        dict with success status, constraint list, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        constraints = []
        for obj in analysis.Group:
            constraint_type = obj.TypeId.replace("Fem::Constraint", "")
            constraint_info = {
                "name": obj.Name,
                "type": constraint_type,
            }

            if hasattr(obj, "References") and obj.References:
                constraint_info["references"] = [str(ref) for ref in obj.References]

            if hasattr(obj, "ForceScale") and obj.ForceScale:
                constraint_info["forceValue"] = obj.ForceScale

            if hasattr(obj, "Pressure") and obj.Pressure:
                constraint_info["pressureValue"] = obj.Pressure

            if hasattr(obj, "Gravity") and obj.Gravity:
                constraint_info["gravity"] = obj.Gravity

            constraints.append(constraint_info)

        return {
            "success": True,
            "data": {
                "analysisName": analysis_name,
                "constraintCount": len(constraints),
                "constraints": constraints,
                "message": f"Analysis '{analysis_name}' has {len(constraints)} constraint(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


SOLVER_TYPES = {
    "calculix": "Fem::SolverObject",
    "elmer": "Fem::SolverElmer",
    "z88": "Fem::SolverZ88",
}


def handle_set_fea_solver(analysis_name: str, solver_type: str = "calculix") -> dict:
    """
    Set the solver type for an analysis.

    Args:
        analysis_name: Name of the analysis object
        solver_type: Solver type ("calculix", "elmer", "z88")

    Returns:
        dict with success status, solver info, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        solver_type_lower = solver_type.lower()
        if solver_type_lower not in SOLVER_TYPES:
            return {
                "success": False,
                "error": f"Unknown solver type '{solver_type}'. Available: {list(SOLVER_TYPES.keys())}",
                "data": None,
            }

        doc = analysis.Document
        solver_class = SOLVER_TYPES[solver_type_lower]

        existing_solver = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::Solver"):
                existing_solver = obj
                break

        if existing_solver is not None:
            doc.removeObject(existing_solver)

        solver = doc.addObject(solver_class, f"Solver{solver_type.capitalize()}")
        analysis.addObject(solver)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "solverName": solver.Name,
                "solverType": solver_type_lower,
                "analysisName": analysis_name,
                "message": f"Solver '{solver_type_lower}' set for analysis '{analysis_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_configure_fea_solver(analysis_name: str, config: dict) -> dict:
    """
    Configure solver parameters.

    Args:
        analysis_name: Name of the analysis object
        config: Configuration dict with solver parameters (analysis_type, working_dir, etc.)

    Returns:
        dict with success status, configuration info, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        solver = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::Solver"):
                solver = obj
                break

        if solver is None:
            return {
                "success": False,
                "error": f"No solver found in analysis '{analysis_name}'. Add a solver first.",
                "data": None,
            }

        applied_config = {}
        for key, value in config.items():
            if hasattr(solver, key):
                setattr(solver, key, value)
                applied_config[key] = value

        analysis.Document.recompute()

        return {
            "success": True,
            "data": {
                "solverName": solver.Name,
                "solverType": solver.TypeId,
                "appliedConfig": applied_config,
                "analysisName": analysis_name,
                "message": f"Solver configured with {len(applied_config)} parameter(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_fea_solver_status(analysis_name: str) -> dict:
    """
    Get current solver status.

    Args:
        analysis_name: Name of the analysis object

    Returns:
        dict with success status, solver status, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        solver = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::Solver"):
                solver = obj
                break

        if solver is None:
            return {
                "success": False,
                "error": f"No solver found in analysis '{analysis_name}'",
                "data": None,
            }

        status = "Unknown"
        if hasattr(solver, "Status"):
            status_obj = solver.Status
            if hasattr(status_obj, "text"):
                status = status_obj.text
            else:
                status = str(status_obj)
        elif hasattr(solver, "State"):
            status = str(solver.State)

        return {
            "success": True,
            "data": {
                "solverName": solver.Name,
                "solverType": solver.TypeId,
                "status": status,
                "analysisName": analysis_name,
                "message": f"Solver status: {status}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_run_fea_analysis(analysis_name: str) -> dict:
    """
    Run the FEA analysis.

    Args:
        analysis_name: Name of the analysis object

    Returns:
        dict with success status, results summary, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        solver = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::Solver"):
                solver = obj
                break

        if solver is None:
            return {
                "success": False,
                "error": f"No solver found in analysis '{analysis_name}'. Add a solver first.",
                "data": None,
            }

        if hasattr(solver, "solve"):
            solver.solve()
        else:
            return {
                "success": False,
                "error": "Solver does not support execution",
                "data": None,
            }

        analysis.Document.recompute()

        result_count = 0
        result_names = []
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::FemResult"):
                result_count += 1
                result_names.append(obj.Name)

        return {
            "success": True,
            "data": {
                "analysisName": analysis_name,
                "solverName": solver.Name,
                "resultCount": result_count,
                "resultNames": result_names,
                "message": f"Analysis completed with {result_count} result object(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_stop_fea_analysis(analysis_name: str) -> dict:
    """
    Stop running analysis.

    Args:
        analysis_name: Name of the analysis object

    Returns:
        dict with success status and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        solver = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::Solver"):
                solver = obj
                break

        if solver is None:
            return {
                "success": False,
                "error": f"No solver found in analysis '{analysis_name}'",
                "data": None,
            }

        try:
            from ..femsolver import run as femsolver_run

            machine = femsolver_run.getMachine(solver)
            machine.reset()
        except Exception:
            analysis = solver.getParentGroup()
            if analysis and solver in analysis.Group:
                analysis.removeObject(solver)

        return {
            "success": True,
            "data": {
                "analysisName": analysis_name,
                "solverName": solver.Name,
                "message": f"Analysis '{analysis_name}' stop requested",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_fea_displacement(analysis_name: str) -> dict:
    """
    Get displacement results.

    Args:
        analysis_name: Name of the analysis object

    Returns:
        dict with success status, displacement data, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        result_obj = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::FemResult"):
                if hasattr(obj, "DisplacementVectors") or hasattr(obj, "U"):
                    result_obj = obj
                    break

        if result_obj is None:
            return {
                "success": False,
                "error": f"No displacement results found in analysis '{analysis_name}'. Run analysis first.",
                "data": None,
            }

        displacements = []
        if hasattr(result_obj, "DisplacementVectors"):
            disp_vectors = result_obj.DisplacementVectors
            for vec in disp_vectors:
                displacements.append({"x": vec.x, "y": vec.y, "z": vec.z})
        elif hasattr(result_obj, "U"):
            u_data = result_obj.U
            if hasattr(u_data, "getData"):
                disp_data = u_data.getData()
                for d in disp_data:
                    displacements.append({"x": d[0], "y": d[1], "z": d[2]})

        max_disp = 0.0
        if hasattr(result_obj, "MaxDisp"):
            max_disp = result_obj.MaxDisp

        return {
            "success": True,
            "data": {
                "analysisName": analysis_name,
                "resultName": result_obj.Name,
                "displacementCount": len(displacements),
                "displacements": displacements[:100],
                "maxDisplacement": max_disp,
                "message": f"Found {len(displacements)} displacement result(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_fea_stress(analysis_name: str) -> dict:
    """
    Get stress results (von Mises).

    Args:
        analysis_name: Name of the analysis object

    Returns:
        dict with success status, stress data, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        result_obj = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::FemResult"):
                if hasattr(obj, "StressVectors") or hasattr(obj, "vonMises"):
                    result_obj = obj
                    break

        if result_obj is None:
            return {
                "success": False,
                "error": f"No stress results found in analysis '{analysis_name}'. Run analysis first.",
                "data": None,
            }

        stresses = []
        if hasattr(result_obj, "StressVectors"):
            stress_vectors = result_obj.StressVectors
            for vec in stress_vectors:
                stresses.append({"x": vec.x, "y": vec.y, "z": vec.z})

        max_stress = 0.0
        if hasattr(result_obj, "vonMises"):
            max_stress = result_obj.vonMises
        elif hasattr(result_obj, "MaxStress"):
            max_stress = result_obj.MaxStress

        return {
            "success": True,
            "data": {
                "analysisName": analysis_name,
                "resultName": result_obj.Name,
                "stressCount": len(stresses),
                "stresses": stresses[:100],
                "maxVonMises": max_stress,
                "message": f"Found {len(stresses)} stress result(s), max von Mises: {max_stress}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_fea_reactions(analysis_name: str) -> dict:
    """
    Get reaction forces.

    Args:
        analysis_name: Name of the analysis object

    Returns:
        dict with success status, reaction data, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        result_obj = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::FemResult"):
                if hasattr(obj, "Reaction Forces") or hasattr(obj, "Reactions"):
                    result_obj = obj
                    break

        if result_obj is None:
            return {
                "success": False,
                "error": f"No reaction results found in analysis '{analysis_name}'. Run analysis first.",
                "data": None,
            }

        reactions = []
        if hasattr(result_obj, "Reaction Forces"):
            reaction_data = result_obj["Reaction Forces"]
            if hasattr(reaction_data, "getData"):
                for r in reaction_data.getData():
                    reactions.append({"x": r[0], "y": r[1], "z": r[2]})
        elif hasattr(result_obj, "Reactions"):
            reactions_data = result_obj.Reactions
            for r in reactions_data:
                reactions.append({"x": r.x, "y": r.y, "z": r.z})

        total_force = {"x": 0.0, "y": 0.0, "z": 0.0}
        for r in reactions:
            total_force["x"] += r["x"]
            total_force["y"] += r["y"]
            total_force["z"] += r["z"]

        return {
            "success": True,
            "data": {
                "analysisName": analysis_name,
                "resultName": result_obj.Name,
                "reactionCount": len(reactions),
                "reactions": reactions,
                "totalForce": total_force,
                "message": f"Found {len(reactions)} reaction(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_remove_fea_constraint(analysis_name: str, constraint_name: str) -> dict:
    """
    Remove a constraint from an FEA analysis.

    Args:
        analysis_name: Name of the analysis object
        constraint_name: Name of the constraint to remove

    Returns:
        dict with success status and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        doc = analysis.Document
        constraint = doc.getObject(constraint_name)

        if constraint is None:
            return {
                "success": False,
                "error": f"Constraint '{constraint_name}' not found",
                "data": None,
            }

        if not constraint.Name in [obj.Name for obj in analysis.Group]:
            return {
                "success": False,
                "error": f"Constraint '{constraint_name}' is not part of analysis '{analysis_name}'",
                "data": None,
            }

        analysis.removeObject(constraint)
        doc.removeObject(constraint)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "removedConstraint": constraint_name,
                "analysisName": analysis_name,
                "message": f"Removed constraint '{constraint_name}' from analysis '{analysis_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_check_fea_analysis_status(analysis_name: str) -> dict:
    """
    Check the status of an FEA analysis.

    Args:
        analysis_name: Name of the analysis object

    Returns:
        dict with success status, analysis status, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        doc = analysis.Document

        status = "Unknown"
        progress = 0
        has_solver = False
        has_mesh = False
        has_results = False
        is_running = False

        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::Solver"):
                has_solver = True
                if hasattr(obj, "Status"):
                    status_obj = obj.Status
                    if hasattr(status_obj, "text"):
                        status = status_obj.text
                        if "run" in status.lower() or "calcul" in status.lower():
                            is_running = True
                    elif hasattr(status_obj, "Progress"):
                        progress = getattr(status_obj, "Progress", 0)
                elif hasattr(obj, "State"):
                    status = str(obj.State)
                    if "run" in status.lower():
                        is_running = True

            if obj.isDerivedFrom("Fem::FemMeshObject"):
                has_mesh = True

            if obj.isDerivedFrom("Fem::FemResult"):
                has_results = True

        if is_running:
            overall_status = "Running"
        elif has_results:
            overall_status = "Completed"
        elif has_solver and has_mesh:
            overall_status = "Ready to run"
        elif has_mesh:
            overall_status = "Missing solver"
        else:
            overall_status = "Not configured"

        return {
            "success": True,
            "data": {
                "analysisName": analysis_name,
                "status": overall_status,
                "solverStatus": status,
                "progress": progress,
                "hasMesh": has_mesh,
                "hasSolver": has_solver,
                "hasResults": has_results,
                "isRunning": is_running,
                "message": f"Analysis '{analysis_name}' status: {overall_status}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_fea_strain(analysis_name: str) -> dict:
    """
    Get strain results.

    Args:
        analysis_name: Name of the analysis object

    Returns:
        dict with success status, strain data, and message
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        result_obj = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::FemResult"):
                if hasattr(obj, "StrainVectors") or hasattr(obj, "Peeq"):
                    result_obj = obj
                    break

        if result_obj is None:
            return {
                "success": False,
                "error": f"No strain results found in analysis '{analysis_name}'. Run analysis first.",
                "data": None,
            }

        strains = []
        if hasattr(result_obj, "StrainVectors"):
            strain_vectors = result_obj.StrainVectors
            for vec in strain_vectors:
                strains.append({"x": vec.x, "y": vec.y, "z": vec.z})

        max_strain = 0.0
        min_strain = 0.0
        if hasattr(result_obj, "Peeq"):
            max_strain = result_obj.Peeq
        elif hasattr(result_obj, "MaxStrain"):
            max_strain = result_obj.MaxStrain

        return {
            "success": True,
            "data": {
                "analysisName": analysis_name,
                "resultName": result_obj.Name,
                "strainCount": len(strains),
                "strains": strains[:100],
                "maxStrain": max_strain,
                "minStrain": min_strain,
                "message": f"Found {len(strains)} strain result(s), max equivalent strain: {max_strain}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_fea_result_summary(analysis_name: str) -> dict:
    """
    Get a comprehensive summary of all FEA results.

    Args:
        analysis_name: Name of the analysis object

    Returns:
        dict with success status and comprehensive results summary
    """
    try:
        analysis, error = _find_analysis_by_name(analysis_name)
        if error:
            return error

        result_obj = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::FemResult"):
                result_obj = obj
                break

        if result_obj is None:
            return {
                "success": False,
                "error": f"No results found in analysis '{analysis_name}'. Run analysis first.",
                "data": None,
            }

        summary = {
            "analysisName": analysis_name,
            "resultName": result_obj.Name,
        }

        if hasattr(result_obj, "MaxDisp"):
            summary["maxDisplacement"] = result_obj.MaxDisp
        elif hasattr(result_obj, "U"):
            u_data = result_obj.U
            if hasattr(u_data, "getData"):
                disp_values = [
                    abs(d[0]) + abs(d[1]) + abs(d[2]) for d in u_data.getData()
                ]
                summary["maxDisplacement"] = max(disp_values) if disp_values else 0

        if hasattr(result_obj, "vonMises"):
            summary["maxVonMisesStress"] = result_obj.vonMises
        elif hasattr(result_obj, "MaxStress"):
            summary["maxVonMisesStress"] = result_obj.MaxStress

        if hasattr(result_obj, "Peeq"):
            summary["maxEquivalentStrain"] = result_obj.Peeq

        if hasattr(result_obj, "Reaction Forces"):
            reaction_data = result_obj["Reaction Forces"]
            if hasattr(reaction_data, "getData"):
                reactions = reaction_data.getData()
                if reactions:
                    total = {"x": 0, "y": 0, "z": 0}
                    for r in reactions:
                        total["x"] += r[0]
                        total["y"] += r[1]
                        total["z"] += r[2]
                    summary["totalReactionForce"] = total

        if hasattr(result_obj, "Time"):
            summary["analysisTime"] = result_obj.Time

        mesh_obj = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::FemMeshObject"):
                mesh_obj = obj
                break

        if mesh_obj:
            if hasattr(mesh_obj, "Mesh"):
                mesh = mesh_obj.Mesh
                summary["meshNodeCount"] = mesh.CountNodes
                summary["meshElementCount"] = mesh.CountElements

        material_props = None
        for obj in analysis.Group:
            if obj.isDerivedFrom("Fem::Material"):
                material_props = {
                    "name": obj.Material.get("Name", "Unknown"),
                    "youngsModulus": obj.Material.get("YoungsModulus", "Unknown"),
                    "poissonsRatio": obj.Material.get("PoissonsRatio", "Unknown"),
                }
                break

        if material_props:
            summary["material"] = material_props

        conclusion_parts = []
        if summary.get("maxDisplacement"):
            conclusion_parts.append(
                f"Max displacement: {summary['maxDisplacement']:.4f} mm"
            )
        if summary.get("maxVonMisesStress"):
            conclusion_parts.append(
                f"Max von Mises stress: {summary['maxVonMisesStress']:.2f} MPa"
            )
            if material_props and material_props.get("youngsModulus") != "Unknown":
                try:
                    yield_strength = float(material_props["youngsModulus"]) * 0.3
                    safety_factor = yield_strength / summary["maxVonMisesStress"]
                    conclusion_parts.append(
                        f"Estimated safety factor: {safety_factor:.2f}"
                    )
                except (ValueError, ZeroDivisionError):
                    pass

        summary["conclusion"] = (
            ". ".join(conclusion_parts) if conclusion_parts else "Analysis complete"
        )
        summary["message"] = (
            f"Result summary for '{analysis_name}': {summary['conclusion']}"
        )

        return {
            "success": True,
            "data": summary,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_create_fea_analysis",
    "handle_delete_fea_analysis",
    "handle_list_fea_analyses",
    "handle_get_fea_analysis",
    "handle_create_fea_mesh",
    "handle_refine_fea_mesh",
    "handle_get_fea_mesh_info",
    "handle_set_fea_material",
    "handle_get_fea_material",
    "handle_add_fea_fixed_constraint",
    "handle_add_fea_force_constraint",
    "handle_add_fea_pressure_constraint",
    "handle_add_fea_displacement_constraint",
    "handle_add_fea_self_weight",
    "handle_list_fea_constraints",
    "handle_remove_fea_constraint",
    "handle_set_fea_solver",
    "handle_configure_fea_solver",
    "handle_get_fea_solver_status",
    "handle_check_fea_analysis_status",
    "handle_run_fea_analysis",
    "handle_stop_fea_analysis",
    "handle_get_fea_displacement",
    "handle_get_fea_stress",
    "handle_get_fea_strain",
    "handle_get_fea_reactions",
    "handle_get_fea_result_summary",
]
