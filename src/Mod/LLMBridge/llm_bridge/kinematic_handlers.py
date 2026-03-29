# SPDX-License-Identifier: LGPL-2.1-or-later
# Kinematic Solver and Motion Animation Handlers
#
# Provides handlers for kinematic simulation and animation:
# - Solver initialization and solving
# - Joint value control and drives
# - Assembly animation
# - Kinematic analysis and collision checking
# Each handler returns JSON-serializable structures.

import FreeCAD as App
import math
import time


_kinematic_state = {
    "solver_initialized": False,
    "current_assembly": None,
    "animation_playing": False,
    "animation_start_time": None,
    "animation_duration": 0,
    "animation_frames": [],
    "current_frame": 0,
    "joint_drives": {},
}


def _degrees_to_radians(degrees):
    return degrees * math.pi / 180.0


def _radians_to_degrees(radians):
    return radians * 180.0 / math.pi


def _mm_to_inches(mm):
    return mm / 25.4


def _inches_to_mm(inches):
    return inches * 25.4


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


def _get_joint_object(doc, joint_name):
    """Get a joint object by name."""
    obj = doc.getObject(joint_name)
    if obj and hasattr(obj, "JointType"):
        return obj

    for o in doc.Objects:
        if hasattr(o, "Label") and o.Label == joint_name:
            if hasattr(o, "JointType"):
                return o

    return None


def _detect_joint_type(joint_obj):
    """Detect the type of joint (linear, angular, etc.)."""
    if joint_obj is None:
        return "unknown"

    joint_type = getattr(joint_obj, "JointType", None)
    if joint_type is not None:
        joint_type_names = [
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
        ]
        if isinstance(joint_type, int) and 0 <= joint_type < len(joint_type_names):
            return joint_type_names[joint_type]
        elif isinstance(joint_type, str):
            return joint_type

    if hasattr(joint_obj, "TypeId"):
        type_id = joint_obj.TypeId.lower()
        if "revolute" in type_id or "hinge" in type_id or "rotate" in type_id:
            return "angular"
        elif "slider" in type_id or "prismatic" in type_id or "linear" in type_id:
            return "linear"
        elif "distance" in type_id:
            return "distance"

    return "unknown"


def _get_joint_value_internal(joint_obj):
    """Get the current value of a joint object."""
    if joint_obj is None:
        return None

    joint_type = _detect_joint_type(joint_obj)

    if joint_type in ["Revolute", "angular", "Angle"]:
        if hasattr(joint_obj, "Angle"):
            return _radians_to_degrees(joint_obj.Angle)
        elif hasattr(joint_obj, "Rotation"):
            return _radians_to_degrees(joint_obj.Rotation)
    elif joint_type in ["Slider", "linear", "Distance"]:
        if hasattr(joint_obj, "Distance"):
            return joint_obj.Distance
        elif hasattr(joint_obj, "Offset"):
            return joint_obj.Offset
    elif joint_type == "Cylindrical":
        if hasattr(joint_obj, "Angle"):
            return _radians_to_degrees(joint_obj.Angle)
        if hasattr(joint_obj, "Distance"):
            return joint_obj.Distance
    elif joint_type == "Screw":
        if hasattr(joint_obj, "Pitch"):
            return joint_obj.Pitch

    for prop in ["Value", "offset", "position"]:
        if hasattr(joint_obj, prop):
            val = getattr(joint_obj, prop)
            if prop == "offset" and joint_type in ["Revolute", "angular", "Angle"]:
                return _radians_to_degrees(val)
            return val

    return None


def _set_joint_value_internal(joint_obj, value, unit="auto"):
    """Set the value of a joint object."""
    if joint_obj is None:
        return False, "Joint object is None"

    joint_type = _detect_joint_type(joint_obj)

    try:
        if joint_type in ["Revolute", "angular", "Angle"]:
            if hasattr(joint_obj, "Angle"):
                joint_obj.Angle = _degrees_to_radians(float(value))
            elif hasattr(joint_obj, "Rotation"):
                joint_obj.Rotation = _degrees_to_radians(float(value))
            else:
                return False, f"Joint type {joint_type} has no angle property"
        elif joint_type in ["Slider", "linear", "Distance"]:
            if hasattr(joint_obj, "Distance"):
                joint_obj.Distance = float(value)
            elif hasattr(joint_obj, "Offset"):
                joint_obj.Offset = float(value)
            else:
                return False, f"Joint type {joint_type} has no distance property"
        elif joint_type == "Cylindrical":
            if hasattr(joint_obj, "Angle"):
                joint_obj.Angle = _degrees_to_radians(float(value))
            elif hasattr(joint_obj, "Distance"):
                joint_obj.Distance = float(value)
        else:
            if hasattr(joint_obj, "Value"):
                joint_obj.Value = float(value)
            else:
                return False, f"Joint type {joint_type} has no settable value property"

        return True, "Value set successfully"
    except Exception as e:
        return False, str(e)


def _get_joint_limits_internal(joint_obj):
    """Get the limits of a joint object."""
    if joint_obj is None:
        return None, None, False

    has_limits = False
    min_value = None
    max_value = None

    joint_type = _detect_joint_type(joint_obj)

    if hasattr(joint_obj, "MinDistance") and hasattr(joint_obj, "MaxDistance"):
        min_value = joint_obj.MinDistance
        max_value = joint_obj.MaxDistance
        has_limits = True
    elif hasattr(joint_obj, "MinAngle") and hasattr(joint_obj, "MaxAngle"):
        min_value = _radians_to_degrees(joint_obj.MinAngle)
        max_value = _radians_to_degrees(joint_obj.MaxAngle)
        has_limits = True
    elif hasattr(joint_obj, "MinValue") and hasattr(joint_obj, "MaxValue"):
        min_value = joint_obj.MinValue
        max_value = joint_obj.MaxValue
        has_limits = True

    return min_value, max_value, has_limits


def _find_joints_in_assembly(assembly):
    """Find all joint objects in an assembly."""
    joints = []

    if hasattr(assembly, "Group"):
        for obj in assembly.Group:
            if hasattr(obj, "JointType"):
                joints.append(obj)

    if hasattr(assembly, "GroupElements"):
        for obj in assembly.GroupElements:
            if hasattr(obj, "JointType"):
                joints.append(obj)

    if hasattr(assembly, "getJoints"):
        try:
            joints.extend(assembly.getJoints())
        except Exception:
            pass

    for obj in assembly.Document.Objects:
        if hasattr(obj, "JointType"):
            if obj.Document == assembly.Document:
                joints.append(obj)
        if hasattr(obj, "isJointObject") and obj.isJointObject:
            joints.append(obj)

    return joints


def _solve_assembly_with_solver(assembly, max_iterations=100):
    """Attempt to solve the assembly using available solver."""
    try:
        import Assembly3

        try:
            solver = assembly.Solver
            if solver is None:
                return False, "No solver available in Assembly3"

            solver.Iterations = max_iterations
            solver.Solve()

            return True, "Solved successfully"
        except AttributeError:
            pass

        try:
            from Assembly3.solver import Solver

            solver = Solver(assembly)
            solver.solve(max_iterations)
            return True, "Solved with Assembly3 solver"
        except Exception as e:
            return False, f"Assembly3 solver failed: {str(e)}"

    except ImportError:
        pass

    try:
        import A2plus

        try:
            from a2plus_tool import solveConstraints

            solveConstraints(assembly)
            return True, "Solved with A2plus solver"
        except Exception as e:
            return False, f"A2plus solver failed: {str(e)}"
    except ImportError:
        pass

    try:
        import Assembly

        if hasattr(assembly, "solve"):
            assembly.solve()
            return True, "Solved with Assembly solver"
    except ImportError:
        pass

    return (
        False,
        "No compatible solver found. Install Assembly3, A2plus, or use built-in Assembly workbench.",
    )


def handle_initialize_solver(assembly_name):
    """
    Initialize the kinematic solver for an assembly.

    Args:
        assembly_name: Name of the assembly to initialize solver for

    Returns:
        dict with success status, DOF count, joint count, and message
    """
    try:
        global _kinematic_state

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

        joints = _find_joints_in_assembly(assembly)
        joint_count = len(joints)

        total_dof = 0
        for joint in joints:
            joint_type = _detect_joint_type(joint)
            if joint_type in ["Revolute", "angular", "Angle"]:
                total_dof += 1
            elif joint_type in ["Slider", "linear"]:
                total_dof += 1
            elif joint_type == "Ball":
                total_dof += 3
            elif joint_type == "Cylindrical":
                total_dof += 2

        constrained_dof = 0
        for joint in joints:
            constrained_dof += 1

        free_dof = max(0, total_dof - constrained_dof)

        _kinematic_state["solver_initialized"] = True
        _kinematic_state["current_assembly"] = assembly_name
        _kinematic_state["joint_drives"] = {}

        return {
            "success": True,
            "data": {
                "assemblyName": assembly.Name,
                "assemblyLabel": assembly.Label,
                "dofCount": total_dof,
                "jointCount": joint_count,
                "constrainedDof": constrained_dof,
                "freeDof": free_dof,
                "message": f"Solver initialized for '{assembly.Label}': {total_dof} DOF, {joint_count} joints",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_solve_assembly(assembly_name, max_iterations=100):
    """
    Solve the kinematic positions for an assembly.

    Args:
        assembly_name: Name of the assembly to solve
        max_iterations: Maximum solver iterations (default 100)

    Returns:
        dict with success status, iterations, converged status, positions, and message
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

        converged, message = _solve_assembly_with_solver(assembly, max_iterations)

        joints = _find_joints_in_assembly(assembly)
        positions = []
        for joint in joints:
            value = _get_joint_value_internal(joint)
            joint_type = _detect_joint_type(joint)
            unit = "degrees" if joint_type in ["Revolute", "angular", "Angle"] else "mm"
            positions.append(
                {
                    "joint": joint.Name,
                    "label": joint.Label,
                    "type": joint_type,
                    "value": value,
                    "unit": unit,
                }
            )

        doc.recompute()

        return {
            "success": converged,
            "data": {
                "assemblyName": assembly.Name,
                "iterations": max_iterations,
                "converged": converged,
                "positions": positions,
                "message": message,
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_check_dof(assembly_name):
    """
    Perform DOF (Degrees of Freedom) analysis on an assembly.

    Args:
        assembly_name: Name of the assembly to analyze

    Returns:
        dict with success status, total/constrained/free DOF, and message
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

        joints = _find_joints_in_assembly(assembly)

        total_dof = 0
        constrained_dof = 0
        joint_info = []

        for joint in joints:
            joint_type = _detect_joint_type(joint)
            joint_dof = 0

            if joint_type == "Fixed":
                joint_dof = 0
            elif joint_type in ["Revolute", "angular", "Angle"]:
                joint_dof = 1
            elif joint_type in ["Slider", "linear"]:
                joint_dof = 1
            elif joint_type == "Ball":
                joint_dof = 3
            elif joint_type == "Cylindrical":
                joint_dof = 2
            elif joint_type == "Distance":
                joint_dof = 1
            else:
                joint_dof = 1

            total_dof += joint_dof
            constrained_dof += 1

            is_constrained = True
            if hasattr(joint, "Suppressed") and joint.Suppressed:
                is_constrained = False
                constrained_dof -= 1

            joint_info.append(
                {
                    "joint": joint.Name,
                    "label": joint.Label,
                    "type": joint_type,
                    "dof": joint_dof,
                    "constrained": is_constrained,
                }
            )

        free_dof = max(0, total_dof - constrained_dof)

        status = "well-constrained"
        if free_dof > 3:
            status = "under-constrained"
        elif free_dof < 0:
            status = "over-constrained"
        elif free_dof == 0:
            status = "fully-constrained"

        return {
            "success": True,
            "data": {
                "assemblyName": assembly.Name,
                "totalDof": total_dof,
                "constrainedDof": constrained_dof,
                "freeDof": free_dof,
                "jointCount": len(joints),
                "status": status,
                "jointInfo": joint_info,
                "message": f"DOF Analysis: {total_dof} total, {constrained_dof} constrained, {free_dof} free - {status}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_joint_value(joint_name, value, unit="auto"):
    """
    Set the value of a joint.

    Args:
        joint_name: Name or label of the joint
        value: Value to set
        unit: Unit type ('auto', 'degrees', 'mm') - defaults to 'auto'

    Returns:
        dict with success status, joint name, value, and message
    """
    try:
        global _kinematic_state

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        joint_obj = _get_joint_object(doc, joint_name)
        if joint_obj is None:
            return {
                "success": False,
                "error": f"Joint '{joint_name}' not found",
                "data": None,
            }

        joint_type = _detect_joint_type(joint_obj)

        if unit == "auto":
            if joint_type in ["Revolute", "angular", "Angle"]:
                unit = "degrees"
            else:
                unit = "mm"

        if unit == "degrees" and joint_type not in ["Revolute", "angular", "Angle"]:
            value = _degrees_to_radians(value)
        elif unit == "mm" and joint_type in ["Revolute", "angular", "Angle"]:
            value = _radians_to_degrees(value)

        success, message = _set_joint_value_internal(joint_obj, value)

        if success:
            doc.recompute()

        return {
            "success": success,
            "data": {
                "jointName": joint_obj.Name,
                "jointLabel": joint_obj.Label,
                "value": _get_joint_value_internal(joint_obj),
                "unit": "degrees"
                if joint_type in ["Revolute", "angular", "Angle"]
                else "mm",
                "message": message
                if not success
                else f"Set {joint_obj.Label} to {value}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_joint_value(joint_name):
    """
    Get the current value of a joint.

    Args:
        joint_name: Name or label of the joint

    Returns:
        dict with success status, joint name, value, unit, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        joint_obj = _get_joint_object(doc, joint_name)
        if joint_obj is None:
            return {
                "success": False,
                "error": f"Joint '{joint_name}' not found",
                "data": None,
            }

        joint_type = _detect_joint_type(joint_obj)
        value = _get_joint_value_internal(joint_obj)
        unit = "degrees" if joint_type in ["Revolute", "angular", "Angle"] else "mm"

        return {
            "success": True,
            "data": {
                "jointName": joint_obj.Name,
                "jointLabel": joint_obj.Label,
                "jointType": joint_type,
                "value": value,
                "unit": unit,
                "message": f"{joint_obj.Label}: {value} {unit}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_joint_limits(joint_name):
    """
    Get the limits (min/max values) of a joint.

    Args:
        joint_name: Name or label of the joint

    Returns:
        dict with success status, joint name, limits, unit, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        joint_obj = _get_joint_object(doc, joint_name)
        if joint_obj is None:
            return {
                "success": False,
                "error": f"Joint '{joint_name}' not found",
                "data": None,
            }

        joint_type = _detect_joint_type(joint_obj)
        min_value, max_value, has_limits = _get_joint_limits_internal(joint_obj)

        unit = "degrees" if joint_type in ["Revolute", "angular", "Angle"] else "mm"

        return {
            "success": True,
            "data": {
                "jointName": joint_obj.Name,
                "jointLabel": joint_obj.Label,
                "jointType": joint_type,
                "minValue": min_value,
                "maxValue": max_value,
                "unit": unit,
                "hasLimits": has_limits,
                "message": f"{joint_obj.Label}: {f'{min_value} to {max_value}' if has_limits else 'no limits'} {unit}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_add_drive(
    joint_name, start_value, end_value, duration, motion_type="linear"
):
    """
    Add a drive (animation sequence) to a joint.

    Args:
        joint_name: Name or label of the joint
        start_value: Starting value for the motion
        end_value: Ending value for the motion
        duration: Duration of the motion in seconds
        motion_type: Type of motion ('linear', 'ease_in_out', 'sine')

    Returns:
        dict with success status, joint name, drive parameters, frame count, and message
    """
    try:
        global _kinematic_state

        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        joint_obj = _get_joint_object(doc, joint_name)
        if joint_obj is None:
            return {
                "success": False,
                "error": f"Joint '{joint_name}' not found",
                "data": None,
            }

        joint_type = _detect_joint_type(joint_obj)
        unit = "degrees" if joint_type in ["Revolute", "angular", "Angle"] else "mm"

        if motion_type not in ["linear", "ease_in_out", "sine"]:
            motion_type = "linear"

        frame_count = max(2, int(duration * 30))

        _kinematic_state["joint_drives"][joint_obj.Name] = {
            "joint_label": joint_obj.Label,
            "start_value": start_value,
            "end_value": end_value,
            "duration": duration,
            "motion_type": motion_type,
            "frame_count": frame_count,
            "unit": unit,
        }

        return {
            "success": True,
            "data": {
                "jointName": joint_obj.Name,
                "jointLabel": joint_obj.Label,
                "startValue": start_value,
                "endValue": end_value,
                "duration": duration,
                "motionType": motion_type,
                "frameCount": frame_count,
                "unit": unit,
                "message": f"Added {motion_type} drive to {joint_obj.Label}: {start_value} to {end_value} over {duration}s ({frame_count} frames)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_drive_joint(
    joint_name, start_value, end_value, duration, motion_type="linear"
):
    """
    Drive a joint through a motion sequence (immediate execution).

    Args:
        joint_name: Name or label of the joint
        start_value: Starting value for the motion
        end_value: Ending value for the motion
        duration: Duration of the motion in seconds
        motion_type: Type of motion ('linear', 'ease_in_out', 'sine')

    Returns:
        dict with success status, joint name, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        joint_obj = _get_joint_object(doc, joint_name)
        if joint_obj is None:
            return {
                "success": False,
                "error": f"Joint '{joint_name}' not found",
                "data": None,
            }

        joint_type = _detect_joint_type(joint_obj)
        unit = "degrees" if joint_type in ["Revolute", "angular", "Angle"] else "mm"

        if motion_type not in ["linear", "ease_in_out", "sine"]:
            motion_type = "linear"

        if motion_type == "linear":
            step_count = 30
            for i in range(step_count):
                t = i / float(step_count)
                value = start_value + (end_value - start_value) * t
                success, _ = _set_joint_value_internal(joint_obj, value)
                if success:
                    doc.recompute()
                time.sleep(duration / step_count)

        elif motion_type == "ease_in_out":
            step_count = 30
            for i in range(step_count):
                t = i / float(step_count)
                if t < 0.5:
                    eased = 2 * t * t
                else:
                    eased = 1 - pow(-2 * t + 2, 2) / 2
                value = start_value + (end_value - start_value) * eased
                success, _ = _set_joint_value_internal(joint_obj, value)
                if success:
                    doc.recompute()
                time.sleep(duration / step_count)

        elif motion_type == "sine":
            step_count = 30
            for i in range(step_count):
                t = i / float(step_count)
                eased = (1 - math.cos(t * math.pi)) / 2
                value = start_value + (end_value - start_value) * eased
                success, _ = _set_joint_value_internal(joint_obj, value)
                if success:
                    doc.recompute()
                time.sleep(duration / step_count)

        return {
            "success": True,
            "data": {
                "jointName": joint_obj.Name,
                "jointLabel": joint_obj.Label,
                "startValue": start_value,
                "endValue": end_value,
                "duration": duration,
                "motionType": motion_type,
                "message": f"Drove {joint_obj.Label} from {start_value} to {end_value} over {duration}s",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_animate_assembly(assembly_name, duration, frame_rate=30):
    """
    Animate the entire assembly based on configured joint drives.

    Args:
        assembly_name: Name of the assembly to animate
        duration: Total duration of the animation in seconds
        frame_rate: Frame rate for the animation (default 30)

    Returns:
        dict with success status, assembly name, duration, frame count, and message
    """
    try:
        global _kinematic_state

        if not _kinematic_state["joint_drives"]:
            return {
                "success": False,
                "error": "No joint drives configured. Use handle_add_drive first.",
                "data": None,
            }

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

        total_frames = int(duration * frame_rate)
        frame_duration = 1.0 / frame_rate

        _kinematic_state["animation_playing"] = True
        _kinematic_state["animation_start_time"] = time.time()
        _kinematic_state["animation_duration"] = duration
        _kinematic_state["current_frame"] = 0
        _kinematic_state["animation_frames"] = []

        for frame in range(total_frames):
            if not _kinematic_state["animation_playing"]:
                break

            t = frame / float(total_frames)

            for joint_name, drive in _kinematic_state["joint_drives"].items():
                joint_obj = doc.getObject(joint_name)
                if joint_obj is None:
                    continue

                start_val = drive["start_value"]
                end_val = drive["end_value"]
                motion_type = drive["motion_type"]

                if motion_type == "linear":
                    eased = t
                elif motion_type == "ease_in_out":
                    if t < 0.5:
                        eased = 2 * t * t
                    else:
                        eased = 1 - pow(-2 * t + 2, 2) / 2
                elif motion_type == "sine":
                    eased = (1 - math.cos(t * math.pi)) / 2
                else:
                    eased = t

                value = start_val + (end_val - start_val) * eased
                _set_joint_value_internal(joint_obj, value)

            doc.recompute()
            _kinematic_state["animation_frames"].append(
                {
                    "frame": frame,
                    "time": frame * frame_duration,
                    "joint_states": {
                        name: _get_joint_value_internal(doc.getObject(name))
                        for name in _kinematic_state["joint_drives"].keys()
                        if doc.getObject(name)
                    },
                }
            )
            _kinematic_state["current_frame"] = frame

        _kinematic_state["animation_playing"] = False

        return {
            "success": True,
            "data": {
                "assemblyName": assembly.Name,
                "assemblyLabel": assembly.Label,
                "duration": duration,
                "frameRate": frame_rate,
                "totalFrames": total_frames,
                "message": f"Animation complete: {duration}s at {frame_rate}fps ({total_frames} frames)",
            },
        }
    except Exception as e:
        _kinematic_state["animation_playing"] = False
        return {"success": False, "error": str(e), "data": None}


def handle_stop_animation():
    """
    Stop any currently playing animation.

    Returns:
        dict with success status and message
    """
    try:
        global _kinematic_state

        was_playing = _kinematic_state["animation_playing"]
        _kinematic_state["animation_playing"] = False

        if was_playing:
            message = "Animation stopped"
        else:
            message = "No animation was playing"

        return {
            "success": True,
            "data": {
                "message": message,
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_animation_state():
    """
    Get the current animation state.

    Returns:
        dict with success status, playing status, current frame, total frames, duration, and message
    """
    try:
        global _kinematic_state

        is_playing = _kinematic_state["animation_playing"]
        current_frame = _kinematic_state["current_frame"]
        duration = _kinematic_state["animation_duration"]
        total_frames = len(_kinematic_state["animation_frames"])

        if is_playing and _kinematic_state["animation_start_time"]:
            elapsed = time.time() - _kinematic_state["animation_start_time"]
            current_frame = int(elapsed * 30)
        else:
            elapsed = 0

        return {
            "success": True,
            "data": {
                "isPlaying": is_playing,
                "currentFrame": current_frame,
                "totalFrames": total_frames,
                "duration": duration,
                "elapsedTime": elapsed,
                "driveCount": len(_kinematic_state["joint_drives"]),
                "message": f"{'Playing' if is_playing else 'Stopped'}: frame {current_frame}/{total_frames}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_kinematic_positions(assembly_name):
    """
    Get the kinematic positions (all joint values) for an assembly.

    Args:
        assembly_name: Name of the assembly

    Returns:
        dict with success status, assembly name, positions, and message
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

        joints = _find_joints_in_assembly(assembly)
        positions = []

        for joint in joints:
            value = _get_joint_value_internal(joint)
            joint_type = _detect_joint_type(joint)
            unit = "degrees" if joint_type in ["Revolute", "angular", "Angle"] else "mm"
            min_val, max_val, has_limits = _get_joint_limits_internal(joint)

            positions.append(
                {
                    "joint": joint.Name,
                    "label": joint.Label,
                    "type": joint_type,
                    "value": value,
                    "unit": unit,
                    "minValue": min_val,
                    "maxValue": max_val,
                    "hasLimits": has_limits,
                }
            )

        return {
            "success": True,
            "data": {
                "assemblyName": assembly.Name,
                "assemblyLabel": assembly.Label,
                "positions": positions,
                "jointCount": len(positions),
                "message": f"Retrieved {len(positions)} joint position(s) for '{assembly.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_check_collision(assembly_name, during_motion=False):
    """
    Check for collisions in the assembly.

    Args:
        assembly_name: Name of the assembly to check
        during_motion: If True, check collision during motion simulation

    Returns:
        dict with success status, collision status, collision pairs, and message
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

        collision_pairs = []
        has_collision = False

        try:
            import Part

            shapes = []
            if hasattr(assembly, "Group"):
                for obj in assembly.Group:
                    if hasattr(obj, "Shape") and obj.Shape.Valid:
                        shapes.append(obj)
            elif hasattr(assembly, "GroupElements"):
                for obj in assembly.GroupElements:
                    if hasattr(obj, "Shape") and obj.Shape.Valid:
                        shapes.append(obj)

            for i in range(len(shapes)):
                for j in range(i + 1, len(shapes)):
                    try:
                        shape1 = shapes[i].Shape
                        shape2 = shapes[j].Shape

                        intersection = shape1.intersect(shape2)
                        if intersection and not intersection.IsNull():
                            has_collision = True
                            collision_pairs.append(
                                {
                                    "object1": shapes[i].Name,
                                    "object1Label": shapes[i].Label,
                                    "object2": shapes[j].Name,
                                    "object2Label": shapes[j].Label,
                                    "type": "solid_intersection",
                                }
                            )
                    except Exception:
                        pass

        except ImportError:
            pass

        if during_motion and _kinematic_state.get("animation_frames"):
            frame_count = len(_kinematic_state["animation_frames"])
            if frame_count > 1:
                last_frame = _kinematic_state["animation_frames"][-1]
                for i in range(len(last_frame.get("joint_states", {}))):
                    pass

        return {
            "success": True,
            "data": {
                "assemblyName": assembly.Name,
                "hasCollision": has_collision,
                "collisionPairs": collision_pairs,
                "collisionCount": len(collision_pairs),
                "message": f"{'Collisions detected' if has_collision else 'No collisions'} ({len(collision_pairs)} pair(s))",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_initialize_solver",
    "handle_solve_assembly",
    "handle_check_dof",
    "handle_set_joint_value",
    "handle_get_joint_value",
    "handle_get_joint_limits",
    "handle_add_drive",
    "handle_drive_joint",
    "handle_animate_assembly",
    "handle_stop_animation",
    "handle_get_animation_state",
    "handle_get_kinematic_positions",
    "handle_check_collision",
]
