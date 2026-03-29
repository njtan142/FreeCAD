# SPDX-License-Identifier: LGPL-2.1-or-later
# CAM/Path Workbench Handlers
#
# Provides handlers for Path workbench operations:
# - Job Management
# - Tool Management
# - Path Operations (Profile, Pocket, Drill, Face)
# - Dressup Operations (Radius, Tag, LeadInOut)
# - G-code Operations
# Each handler returns JSON-serializable structures.

import FreeCAD as App
import Path
import Path.Main.Job as PathJob
import Path.Tool.Controller as PathToolController
import Path.Op.Profile as PathProfile
import Path.Op.PocketShape as PathPocketShape
import Path.Op.Drilling as PathDrilling
import Path.Op.MillFace as PathMillFace
import Path.Dressup.Tags as PathDressupTags
import Path.Dressup.Utils as PathDressup
import PathScripts.PathUtils as PathUtils
import json


def handle_create_path_job(model_object, name=None):
    """
    Create a PathJob from a base model.

    Args:
        model_object: Name of the base model object or list of object names
        name: Optional name for the job (default: 'Job')

    Returns:
        dict with success status, job info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(model_object, str):
            model = doc.getObject(model_object)
            if model is None:
                return {
                    "success": False,
                    "error": f"Model '{model_object}' not found",
                    "data": None,
                }
            models = [model]
        elif isinstance(model_object, list):
            models = []
            for obj_name in model_object:
                obj = doc.getObject(obj_name)
                if obj is None:
                    return {
                        "success": False,
                        "error": f"Model '{obj_name}' not found",
                        "data": None,
                    }
                models.append(obj)
        else:
            return {
                "success": False,
                "error": "model_object must be a string or list of strings",
                "data": None,
            }

        job_name = name if name else "Job"
        job = PathJob.Create(job_name, models)

        return {
            "success": True,
            "data": {
                "jobName": job.Name,
                "jobLabel": job.Label,
                "jobType": job.TypeId,
                "documentName": doc.Name,
                "modelNames": [m.Name for m in models],
                "message": f"Created PathJob '{job.Label}' with {len(models)} model(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_configure_path_job(job_name, tool_controller=None, stock=None):
    """
    Configure job parameters like tool controller and stock.

    Args:
        job_name: Name of the PathJob to configure
        tool_controller: Optional name of a tool controller to add
        stock: Optional stock object name or dict with stock properties

    Returns:
        dict with success status, job info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        job = doc.getObject(job_name)
        if job is None:
            return {
                "success": False,
                "error": f"Job '{job_name}' not found",
                "data": None,
            }

        if not hasattr(job, "Proxy") or not isinstance(job.Proxy, PathJob.ObjectJob):
            return {
                "success": False,
                "error": f"Object '{job_name}' is not a PathJob",
                "data": None,
            }

        changes = []

        if tool_controller:
            tc = doc.getObject(tool_controller)
            if tc is None:
                return {
                    "success": False,
                    "error": f"Tool controller '{tool_controller}' not found",
                    "data": None,
                }
            job.Proxy.addToolController(tc)
            changes.append(f"added tool controller '{tc.Label}'")

        if stock:
            if isinstance(stock, str):
                stock_obj = doc.getObject(stock)
                if stock_obj:
                    job.Stock = stock_obj
                    changes.append(f"set stock to '{stock_obj.Label}'")
            elif isinstance(stock, dict):
                if hasattr(job, "Stock") and job.Stock:
                    for key, value in stock.items():
                        if hasattr(job.Stock, key):
                            setattr(job.Stock, key, value)
                            changes.append(f"set stock.{key} = {value}")
                else:
                    return {
                        "success": False,
                        "error": "Job has no stock object to configure",
                        "data": None,
                    }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "jobName": job.Name,
                "jobLabel": job.Label,
                "changes": changes,
                "message": f"Configured PathJob '{job.Label}': {', '.join(changes) if changes else 'no changes'}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_delete_path_job(job_name):
    """
    Delete a PathJob from the document.

    Args:
        job_name: Name of the PathJob to delete

    Returns:
        dict with success status, deleted job info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        job = doc.getObject(job_name)
        if job is None:
            return {
                "success": False,
                "error": f"Job '{job_name}' not found",
                "data": None,
            }

        if not hasattr(job, "Proxy") or not isinstance(job.Proxy, PathJob.ObjectJob):
            return {
                "success": False,
                "error": f"Object '{job_name}' is not a PathJob",
                "data": None,
            }

        job_label = job.Label
        job_type = job.TypeId

        doc.removeObject(job_name)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "jobName": job_name,
                "jobLabel": job_label,
                "jobType": job_type,
                "documentName": doc.Name,
                "message": f"Deleted PathJob '{job_label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_path_jobs():
    """
    List all PathJobs in the document.

    Returns:
        dict with success status, list of jobs, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        jobs = []
        for obj in doc.Objects:
            if hasattr(obj, "Proxy") and isinstance(obj.Proxy, PathJob.ObjectJob):
                job_info = {
                    "name": obj.Name,
                    "label": obj.Label,
                    "type": obj.TypeId,
                    "operationsCount": len(obj.Operations.Group)
                    if hasattr(obj, "Operations") and obj.Operations
                    else 0,
                    "toolControllersCount": len(obj.Tools.Group)
                    if hasattr(obj, "Tools") and obj.Tools
                    else 0,
                }
                jobs.append(job_info)

        return {
            "success": True,
            "data": {
                "documentName": doc.Name,
                "jobsCount": len(jobs),
                "jobs": jobs,
                "message": f"Found {len(jobs)} PathJob(s) in document",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_path_tool(name, tool_type, diameter, cutting_edge_angle=None):
    """
    Create a PathTool definition.

    Args:
        name: Name for the tool
        tool_type: Type of tool (e.g., 'endmill', 'drill', 'ballend', 'chamfer')
        diameter: Tool diameter
        cutting_edge_angle: Optional cutting edge angle for chamfer tools

    Returns:
        dict with success status, tool info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        valid_types = [
            "endmill",
            "drill",
            "ballend",
            "chamfer",
            "bullnose",
            "dovetail",
            "slittingsaw",
            "tap",
            "reamer",
            "probe",
            "custom",
        ]
        if tool_type.lower() not in valid_types:
            return {
                "success": False,
                "error": f"Invalid tool type '{tool_type}'. Valid types: {', '.join(valid_types)}",
                "data": None,
            }

        shape_id = f"{tool_type.lower()}.fcstd"
        try:
            from Path.Tool.toolbit.models.base import ToolBit

            toolbit = ToolBit.from_shape_id(shape_id, name)
            if toolbit is None:
                return {
                    "success": False,
                    "error": f"Failed to create toolbit for type '{tool_type}'",
                    "data": None,
                }
            toolbit.label = name

            if hasattr(toolbit.obj, "Diameter"):
                toolbit.obj.Diameter = diameter
            if cutting_edge_angle and hasattr(toolbit.obj, "CuttingEdgeAngle"):
                toolbit.obj.CuttingEdgeAngle = cutting_edge_angle

            doc.recompute()

            return {
                "success": True,
                "data": {
                    "toolName": toolbit.obj.Name,
                    "toolLabel": toolbit.obj.Label,
                    "toolType": tool_type,
                    "diameter": diameter,
                    "documentName": doc.Name,
                    "message": f"Created tool '{toolbit.obj.Label}' of type '{tool_type}' with diameter {diameter}mm",
                },
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create tool: {str(e)}",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_path_toolbit(geometry, name=None):
    """
    Create a ToolBit from geometry.

    Args:
        geometry: Geometry data (dict with type and parameters) or object name with geometry
        name: Optional name for the toolbit

    Returns:
        dict with success status, toolbit info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(geometry, str):
            base_obj = doc.getObject(geometry)
            if base_obj is None:
                return {
                    "success": False,
                    "error": f"Object '{geometry}' not found",
                    "data": None,
                }
            toolbit_label = name if name else f"ToolBit_{base_obj.Label}"
            return {
                "success": True,
                "data": {
                    "baseObject": geometry,
                    "message": f"Toolbit creation from geometry '{geometry}' requires additional parameters",
                },
            }
        elif isinstance(geometry, dict):
            from Path.Tool.toolbit.models.base import ToolBit

            toolbit = ToolBit.from_dict(geometry)
            if toolbit is None:
                return {
                    "success": False,
                    "error": "Failed to create toolbit from geometry data",
                    "data": None,
                }
            if name:
                toolbit.label = name
            doc.recompute()

            return {
                "success": True,
                "data": {
                    "toolbitName": toolbit.obj.Name,
                    "toolbitLabel": toolbit.obj.Label,
                    "shapeType": toolbit.get_shape_name(),
                    "documentName": doc.Name,
                    "message": f"Created ToolBit '{toolbit.obj.Label}'",
                },
            }
        else:
            return {
                "success": False,
                "error": "geometry must be an object name (str) or geometry data (dict)",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_tool_controller(job_name, tool, speed=None, feed_rate=None):
    """
    Create a ToolController for a job.

    Args:
        job_name: Name of the PathJob
        tool: Tool object name or ToolBit
        speed: Optional spindle speed (RPM)
        feed_rate: Optional feed rate

    Returns:
        dict with success status, tool controller info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        job = doc.getObject(job_name)
        if job is None:
            return {
                "success": False,
                "error": f"Job '{job_name}' not found",
                "data": None,
            }

        if not hasattr(job, "Proxy") or not isinstance(job.Proxy, PathJob.ObjectJob):
            return {
                "success": False,
                "error": f"Object '{job_name}' is not a PathJob",
                "data": None,
            }

        tool_obj = None
        if isinstance(tool, str):
            tool_obj = doc.getObject(tool)
        elif hasattr(tool, "obj"):
            tool_obj = tool.obj

        if tool_obj is None:
            return {"success": False, "error": f"Tool '{tool}' not found", "data": None}

        tc_name = f"TC: {tool_obj.Label}"
        tool_number = job.Proxy.nextToolNumber()
        tc = PathToolController.Create(tc_name, tool_obj, tool_number)

        if speed:
            tc.SpindleSpeed = speed
        if feed_rate:
            tc.HorizFeed = feed_rate
            tc.VertFeed = feed_rate

        job.Proxy.addToolController(tc)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "toolControllerName": tc.Name,
                "toolControllerLabel": tc.Label,
                "toolNumber": tc.ToolNumber,
                "spindleSpeed": tc.SpindleSpeed,
                "horizontalFeed": tc.HorizFeed.Value
                if hasattr(tc.HorizFeed, "Value")
                else tc.HorizFeed,
                "verticalFeed": tc.VertFeed.Value
                if hasattr(tc.VertFeed, "Value")
                else tc.VertFeed,
                "documentName": doc.Name,
                "message": f"Created ToolController '{tc.Label}' with tool #{tool_number}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_path_tools():
    """
    List all tools in the document.

    Returns:
        dict with success status, list of tools, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        tools = []
        for obj in doc.Objects:
            if hasattr(obj, "Proxy"):
                proxy_type = type(obj.Proxy).__name__
                if "ToolBit" in proxy_type or "ToolController" in proxy_type:
                    tool_info = {
                        "name": obj.Name,
                        "label": obj.Label,
                        "type": proxy_type,
                    }
                    if hasattr(obj, "Diameter"):
                        tool_info["diameter"] = obj.Diameter
                    if hasattr(obj, "ToolNumber"):
                        tool_info["toolNumber"] = obj.ToolNumber
                    tools.append(tool_info)

        return {
            "success": True,
            "data": {
                "documentName": doc.Name,
                "toolsCount": len(tools),
                "tools": tools,
                "message": f"Found {len(tools)} tool(s) in document",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_path_profile(base_object, job_name=None, name=None):
    """
    Create a Profile operation from edges.

    Args:
        base_object: Name of the base object or list of (object, edges) tuples
        job_name: Optional name of the PathJob to add the operation to
        name: Optional name for the profile operation

    Returns:
        dict with success status, operation info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(base_object, str):
            base = doc.getObject(base_object)
            if base is None:
                return {
                    "success": False,
                    "error": f"Object '{base_object}' not found",
                    "data": None,
                }
            base_for_op = [(base, [])]
        elif isinstance(base_object, list):
            base_for_op = []
            for item in base_object:
                if isinstance(item, tuple):
                    obj_name, edges = item
                    obj = doc.getObject(obj_name)
                    if obj is None:
                        return {
                            "success": False,
                            "error": f"Object '{obj_name}' not found",
                            "data": None,
                        }
                    base_for_op.append((obj, edges))
                else:
                    obj = doc.getObject(item)
                    if obj is None:
                        return {
                            "success": False,
                            "error": f"Object '{item}' not found",
                            "data": None,
                        }
                    base_for_op.append((obj, []))
        else:
            return {
                "success": False,
                "error": "base_object must be a string or list of object names/edges",
                "data": None,
            }

        op_name = name if name else "Profile"
        op = PathProfile.Create(op_name)

        if base_for_op:
            op.Base = base_for_op

        if job_name:
            job = doc.getObject(job_name)
            if (
                job
                and hasattr(job, "Proxy")
                and isinstance(job.Proxy, PathJob.ObjectJob)
            ):
                job.Proxy.addOperation(op)
            else:
                return {
                    "success": False,
                    "error": f"Job '{job_name}' not found or invalid",
                    "data": None,
                }
        else:
            instances = PathJob.Instances()
            if instances:
                instances[0].Proxy.addOperation(op)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "operationName": op.Name,
                "operationLabel": op.Label,
                "operationType": op.TypeId,
                "documentName": doc.Name,
                "baseObjects": [obj.Name for obj, _ in base_for_op],
                "message": f"Created Profile operation '{op.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_path_pocket(base_object, job_name=None, name=None):
    """
    Create a Pocket operation.

    Args:
        base_object: Name of the base object or list of object names
        job_name: Optional name of the PathJob to add the operation to
        name: Optional name for the pocket operation

    Returns:
        dict with success status, operation info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(base_object, str):
            base = doc.getObject(base_object)
            if base is None:
                return {
                    "success": False,
                    "error": f"Object '{base_object}' not found",
                    "data": None,
                }
            base_for_op = [(base, [])]
        elif isinstance(base_object, list):
            base_for_op = []
            for item in base_object:
                obj = doc.getObject(item) if isinstance(item, str) else item
                if obj is None:
                    return {
                        "success": False,
                        "error": f"Object '{item}' not found",
                        "data": None,
                    }
                base_for_op.append((obj, []))
        else:
            return {
                "success": False,
                "error": "base_object must be a string or list of object names",
                "data": None,
            }

        op_name = name if name else "Pocket"
        op = PathPocketShape.Create(op_name)

        if base_for_op:
            op.Base = base_for_op

        if job_name:
            job = doc.getObject(job_name)
            if (
                job
                and hasattr(job, "Proxy")
                and isinstance(job.Proxy, PathJob.ObjectJob)
            ):
                job.Proxy.addOperation(op)
            else:
                return {
                    "success": False,
                    "error": f"Job '{job_name}' not found or invalid",
                    "data": None,
                }
        else:
            instances = PathJob.Instances()
            if instances:
                instances[0].Proxy.addOperation(op)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "operationName": op.Name,
                "operationLabel": op.Label,
                "operationType": op.TypeId,
                "documentName": doc.Name,
                "baseObjects": [obj.Name for obj, _ in base_for_op],
                "message": f"Created Pocket operation '{op.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_path_drill(centers, job_name=None, name=None):
    """
    Create a Drill operation.

    Args:
        centers: List of center points (dict with x, y, z) or object names to drill
        job_name: Optional name of the PathJob to add the operation to
        name: Optional name for the drill operation

    Returns:
        dict with success status, operation info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(centers, str):
            base = doc.getObject(centers)
            if base is None:
                return {
                    "success": False,
                    "error": f"Object '{centers}' not found",
                    "data": None,
                }
            base_for_op = [(base, [])]
        elif isinstance(centers, list):
            if len(centers) > 0 and isinstance(centers[0], dict):
                base_for_op = []
            else:
                base_for_op = []
                for item in centers:
                    obj = doc.getObject(item) if isinstance(item, str) else item
                    if obj is None:
                        return {
                            "success": False,
                            "error": f"Object '{item}' not found",
                            "data": None,
                        }
                    base_for_op.append((obj, []))
        else:
            return {
                "success": False,
                "error": "centers must be a list of points or object names",
                "data": None,
            }

        op_name = name if name else "Drill"
        op = PathDrilling.Create(op_name)

        if base_for_op:
            op.Base = base_for_op

        if job_name:
            job = doc.getObject(job_name)
            if (
                job
                and hasattr(job, "Proxy")
                and isinstance(job.Proxy, PathJob.ObjectJob)
            ):
                job.Proxy.addOperation(op)
            else:
                return {
                    "success": False,
                    "error": f"Job '{job_name}' not found or invalid",
                    "data": None,
                }
        else:
            instances = PathJob.Instances()
            if instances:
                instances[0].Proxy.addOperation(op)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "operationName": op.Name,
                "operationLabel": op.Label,
                "operationType": op.TypeId,
                "documentName": doc.Name,
                "centersCount": len(centers) if isinstance(centers, list) else 1,
                "message": f"Created Drill operation '{op.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_path_face(base_object, job_name=None, name=None):
    """
    Create a Face operation.

    Args:
        base_object: Name of the base object or list of object names
        job_name: Optional name of the PathJob to add the operation to
        name: Optional name for the face operation

    Returns:
        dict with success status, operation info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(base_object, str):
            base = doc.getObject(base_object)
            if base is None:
                return {
                    "success": False,
                    "error": f"Object '{base_object}' not found",
                    "data": None,
                }
            base_for_op = [(base, [])]
        elif isinstance(base_object, list):
            base_for_op = []
            for item in base_object:
                obj = doc.getObject(item) if isinstance(item, str) else item
                if obj is None:
                    return {
                        "success": False,
                        "error": f"Object '{item}' not found",
                        "data": None,
                    }
                base_for_op.append((obj, []))
        else:
            return {
                "success": False,
                "error": "base_object must be a string or list of object names",
                "data": None,
            }

        op_name = name if name else "Face"
        op = PathMillFace.Create(op_name)

        if base_for_op:
            op.Base = base_for_op

        if job_name:
            job = doc.getObject(job_name)
            if (
                job
                and hasattr(job, "Proxy")
                and isinstance(job.Proxy, PathJob.ObjectJob)
            ):
                job.Proxy.addOperation(op)
            else:
                return {
                    "success": False,
                    "error": f"Job '{job_name}' not found or invalid",
                    "data": None,
                }
        else:
            instances = PathJob.Instances()
            if instances:
                instances[0].Proxy.addOperation(op)

        doc.recompute()

        return {
            "success": True,
            "data": {
                "operationName": op.Name,
                "operationLabel": op.Label,
                "operationType": op.TypeId,
                "documentName": doc.Name,
                "baseObjects": [obj.Name for obj, _ in base_for_op],
                "message": f"Created Face operation '{op.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_path_dressup_radius(job_name, radius_compensation=True):
    """
    Add radius compensation dressup to an operation.

    Args:
        job_name: Name of the PathJob or operation to add dressup to
        radius_compensation: Whether to enable radius compensation

    Returns:
        dict with success status, dressup info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        base_op = doc.getObject(job_name)
        if base_op is None:
            return {
                "success": False,
                "error": f"Object '{job_name}' not found",
                "data": None,
            }

        if hasattr(base_op, "Proxy") and isinstance(base_op.Proxy, PathJob.ObjectJob):
            operations = (
                base_op.Operations.Group if hasattr(base_op, "Operations") else []
            )
            if not operations:
                return {
                    "success": False,
                    "error": "Job has no operations to dress up",
                    "data": None,
                }
            base_op = operations[0]

        if not base_op.isDerivedFrom("Path::Feature"):
            return {
                "success": False,
                "error": "Object is not a path operation",
                "data": None,
            }

        if base_op.isDerivedFrom("Path::FeatureCompoundPython"):
            return {
                "success": False,
                "error": "Cannot add radius dressup to a compound operation",
                "data": None,
            }

        try:
            from Path.Dressup.Gui.Radius import ObjectRadius

            dressup_name = f"Radius_Dressup_{base_op.Name}"
            dressup_obj = doc.addObject("Path::FeaturePython", dressup_name)
            ObjectRadius(dressup_obj, base_op)

            job = PathUtils.findParentJob(base_op)
            if job:
                job.Proxy.addOperation(dressup_obj, base_op)

            doc.recompute()

            return {
                "success": True,
                "data": {
                    "dressupName": dressup_obj.Name,
                    "dressupLabel": dressup_obj.Label,
                    "baseOperation": base_op.Name,
                    "radiusCompensation": radius_compensation,
                    "message": f"Created radius dressup for '{base_op.Label}'",
                },
            }
        except ImportError:
            return {
                "success": False,
                "error": "Radius dressup not available",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_path_dressup_tag(job_name, tag_width=None, tag_height=None):
    """
    Add holding tags dressup to an operation.

    Args:
        job_name: Name of the PathJob or operation to add dressup to
        tag_width: Optional width of holding tags
        tag_height: Optional height of holding tags

    Returns:
        dict with success status, dressup info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        base_op = doc.getObject(job_name)
        if base_op is None:
            return {
                "success": False,
                "error": f"Object '{job_name}' not found",
                "data": None,
            }

        if hasattr(base_op, "Proxy") and isinstance(base_op.Proxy, PathJob.ObjectJob):
            operations = (
                base_op.Operations.Group if hasattr(base_op, "Operations") else []
            )
            if not operations:
                return {
                    "success": False,
                    "error": "Job has no operations to dress up",
                    "data": None,
                }
            base_op = operations[0]

        if not base_op.isDerivedFrom("Path::Feature"):
            return {
                "success": False,
                "error": "Object is not a path operation",
                "data": None,
            }

        if base_op.isDerivedFrom("Path::FeatureCompoundPython"):
            return {
                "success": False,
                "error": "Cannot add tag dressup to a compound operation",
                "data": None,
            }

        dressup = PathDressupTags.Create(base_op, f"Tag_Dressup_{base_op.Name}")
        if dressup is None:
            return {
                "success": False,
                "error": "Failed to create tag dressup",
                "data": None,
            }

        if tag_width and hasattr(dressup, "TagWidth"):
            dressup.TagWidth = tag_width
        if tag_height and hasattr(dressup, "TagHeight"):
            dressup.TagHeight = tag_height

        doc.recompute()

        return {
            "success": True,
            "data": {
                "dressupName": dressup.Name,
                "dressupLabel": dressup.Label,
                "baseOperation": base_op.Name,
                "tagWidth": tag_width,
                "tagHeight": tag_height,
                "message": f"Created tag dressup for '{base_op.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_create_path_dressup_leadoff(job_name, lead_in=None, lead_out=None):
    """
    Add lead in/out moves dressup to an operation.

    Args:
        job_name: Name of the PathJob or operation to add dressup to
        lead_in: Optional lead in style ('Arc', 'Line', 'Perpendicular', 'Tangent', 'Helix')
        lead_out: Optional lead out style

    Returns:
        dict with success status, dressup info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        base_op = doc.getObject(job_name)
        if base_op is None:
            return {
                "success": False,
                "error": f"Object '{job_name}' not found",
                "data": None,
            }

        if hasattr(base_op, "Proxy") and isinstance(base_op.Proxy, PathJob.ObjectJob):
            operations = (
                base_op.Operations.Group if hasattr(base_op, "Operations") else []
            )
            if not operations:
                return {
                    "success": False,
                    "error": "Job has no operations to dress up",
                    "data": None,
                }
            base_op = operations[0]

        if not base_op.isDerivedFrom("Path::Feature"):
            return {
                "success": False,
                "error": "Object is not a path operation",
                "data": None,
            }

        if base_op.isDerivedFrom("Path::FeatureCompoundPython"):
            return {
                "success": False,
                "error": "Cannot add lead in/out dressup to a compound operation",
                "data": None,
            }

        try:
            from Path.Dressup.Gui.LeadInOut import ObjectDressup

            dressup_name = f"LeadInOut_Dressup_{base_op.Name}"
            dressup_obj = doc.addObject("Path::FeaturePython", dressup_name)
            dbo = ObjectDressup(dressup_obj)
            dressup_obj.Base = base_op

            job = PathUtils.findParentJob(base_op)
            if job:
                job.Proxy.addOperation(dressup_obj, base_op)

            if lead_in is not None:
                dressup_obj.LeadIn = True
                if lead_in and hasattr(dressup_obj, "StyleIn"):
                    dressup_obj.StyleIn = lead_in
            if lead_out is not None:
                dressup_obj.LeadOut = True
                if lead_out and hasattr(dressup_obj, "StyleOut"):
                    dressup_obj.StyleOut = lead_out

            dbo.setup(dressup_obj)
            doc.recompute()

            return {
                "success": True,
                "data": {
                    "dressupName": dressup_obj.Name,
                    "dressupLabel": dressup_obj.Label,
                    "baseOperation": base_op.Name,
                    "leadIn": lead_in,
                    "leadOut": lead_out,
                    "message": f"Created lead in/out dressup for '{base_op.Label}'",
                },
            }
        except ImportError as e:
            return {
                "success": False,
                "error": f"Lead in/out dressup not available: {str(e)}",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_export_gcode(job_name, file_path):
    """
    Export G-code from a PathJob.

    Args:
        job_name: Name of the PathJob to export
        file_path: Output file path for G-code

    Returns:
        dict with success status, export info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        job = doc.getObject(job_name)
        if job is None:
            return {
                "success": False,
                "error": f"Job '{job_name}' not found",
                "data": None,
            }

        if not hasattr(job, "Proxy") or not isinstance(job.Proxy, PathJob.ObjectJob):
            return {
                "success": False,
                "error": f"Object '{job_name}' is not a PathJob",
                "data": None,
            }

        from Path.Post.Processor import PostProcessorFactory

        processor = PostProcessorFactory.get_post_processor(job, job.PostProcessor)
        if processor is None:
            return {
                "success": False,
                "error": f"Post processor '{job.PostProcessor}' not found",
                "data": None,
            }

        gcode_output = processor.export()

        if gcode_output:
            with open(file_path, "w") as f:
                if isinstance(gcode_output, list):
                    for section in gcode_output:
                        if hasattr(section, "gcode"):
                            f.write(section.gcode)
                        elif isinstance(section, tuple) and len(section) > 1:
                            f.write(str(section[1]))
                        else:
                            f.write(str(section))
                else:
                    f.write(str(gcode_output))

            return {
                "success": True,
                "data": {
                    "jobName": job.Name,
                    "jobLabel": job.Label,
                    "filePath": file_path,
                    "postProcessor": job.PostProcessor,
                    "operationsCount": len(job.Operations.Group)
                    if hasattr(job, "Operations")
                    else 0,
                    "message": f"Exported G-code from '{job.Label}' to '{file_path}'",
                },
            }
        else:
            return {
                "success": False,
                "error": "Failed to generate G-code output",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_simulate_path(job_name):
    """
    Get path simulation data from a PathJob.

    Args:
        job_name: Name of the PathJob to simulate

    Returns:
        dict with success status, simulation data, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        job = doc.getObject(job_name)
        if job is None:
            return {
                "success": False,
                "error": f"Job '{job_name}' not found",
                "data": None,
            }

        if not hasattr(job, "Proxy") or not isinstance(job.Proxy, PathJob.ObjectJob):
            return {
                "success": False,
                "error": f"Object '{job_name}' is not a PathJob",
                "data": None,
            }

        path_data = []
        for op in job.Operations.Group:
            if hasattr(op, "Path") and op.Path:
                commands = []
                for cmd in op.Path.Commands:
                    cmd_info = {
                        "command": cmd.Name,
                        "x": cmd.x if hasattr(cmd, "x") else None,
                        "y": cmd.y if hasattr(cmd, "y") else None,
                        "z": cmd.z if hasattr(cmd, "z") else None,
                        "a": cmd.a if hasattr(cmd, "a") else None,
                        "b": cmd.b if hasattr(cmd, "b") else None,
                        "c": cmd.c if hasattr(cmd, "c") else None,
                    }
                    commands.append(cmd_info)

                path_data.append(
                    {
                        "operationName": op.Name,
                        "operationLabel": op.Label,
                        "commandsCount": len(commands),
                        "commands": commands,
                    }
                )

        return {
            "success": True,
            "data": {
                "jobName": job.Name,
                "jobLabel": job.Label,
                "operationsCount": len(path_data),
                "operations": path_data,
                "message": f"Retrieved simulation data for '{job.Label}' with {len(path_data)} operation(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_create_path_job",
    "handle_configure_path_job",
    "handle_delete_path_job",
    "handle_list_path_jobs",
    "handle_create_path_tool",
    "handle_create_path_toolbit",
    "handle_create_tool_controller",
    "handle_list_path_tools",
    "handle_create_path_profile",
    "handle_create_path_pocket",
    "handle_create_path_drill",
    "handle_create_path_face",
    "handle_create_path_dressup_radius",
    "handle_create_path_dressup_tag",
    "handle_create_path_dressup_leadoff",
    "handle_export_gcode",
    "handle_simulate_path",
]
