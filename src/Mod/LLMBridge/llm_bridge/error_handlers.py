# SPDX-License-Identifier: LGPL-2.1-or-later
# Error Handlers
#
# Provides handlers for error analysis and recovery:
# - Error parsing and categorization
# - Recovery suggestions
# - Operation tracking
# - Error recovery actions
# Each handler returns JSON-serializable structures.

import re
import traceback as tb_module
from typing import Optional, Dict, List, Any

import FreeCAD as App

ERROR_CATEGORIES = {
    "ATTRIBUTE_ERROR": "Object does not have the requested attribute",
    "TYPE_ERROR": "Wrong type for operation",
    "VALUE_ERROR": "Invalid value provided to function",
    "REFERENCE_ERROR": "Referenced object not found in document",
    "CONSTRAINT_ERROR": "Geometric constraint conflict",
    "SOLVER_ERROR": "Sketch solver failed to converge",
    "BOOLEAN_ERROR": "Boolean operation failed",
    "DOCUMENT_ERROR": "Document operation failed",
    "PLACEMENT_ERROR": "Invalid placement/position",
    "EXPRESSION_ERROR": "Invalid expression syntax",
    "PERMISSION_ERROR": "Object is locked or read-only",
    "MEMORY_ERROR": "Insufficient memory for operation",
}

ERROR_PATTERNS = {
    "ATTRIBUTE_ERROR": [
        r"AttributeError",
        r"has no attribute",
        r"object has no attribute",
    ],
    "TYPE_ERROR": [
        r"TypeError",
        r"not callable",
        r"unexpected keyword argument",
        r"missing 1 required positional argument",
    ],
    "VALUE_ERROR": [
        r"ValueError",
        r"invalid value",
        r"must be greater than",
        r"must be less than",
        r"out of range",
    ],
    "REFERENCE_ERROR": [
        r"ReferenceError",
        r"object not found",
        r"'NoneType' object",
        r"has been deleted",
        r"invalid object",
    ],
    "CONSTRAINT_ERROR": [
        r"ConstraintError",
        r"conflicting constraint",
        r"redundant constraint",
        r"under-constrained",
        r"over-constrained",
    ],
    "SOLVER_ERROR": [
        r"SolverError",
        r"solver failed",
        r"failed to converge",
        r"cannot solve",
        r"Sketch solver",
    ],
    "BOOLEAN_ERROR": [
        r"BooleanError",
        r"Boolean operation failed",
        r"fuse failed",
        r"cut failed",
        r"common failed",
        r"invalid shape for boolean",
    ],
    "DOCUMENT_ERROR": [
        r"DocumentError",
        r"document is None",
        r"No active document",
        r"document is read-only",
    ],
    "PLACEMENT_ERROR": [
        r"PlacementError",
        r"invalid placement",
        r"invalid position",
        r"invalid rotation",
        r"invalid angle",
    ],
    "EXPRESSION_ERROR": [
        r"ExpressionError",
        r"invalid expression",
        r"expression syntax",
        r"parse error",
        r"unknown expression",
    ],
    "PERMISSION_ERROR": [
        r"PermissionError",
        r"object is locked",
        r"read-only",
        r"cannot modify",
        r"is not editable",
    ],
    "MEMORY_ERROR": [
        r"MemoryError",
        r"out of memory",
        r"allocation failed",
        r"insufficient memory",
    ],
}

OPERATION_ERRORS = {
    "create_sketch": [
        "Object not found",
        "invalid placement",
        "plane not valid",
        "Sketch does not support",
    ],
    "add_geometry": [
        "Sketch is not valid",
        "Geometry type not supported",
        "invalid parameters",
    ],
    "add_constraint": [
        "Constraint not allowed",
        "conflicting constraint",
        "redundant constraint",
        "Solver failed",
        "under-constrained sketch",
    ],
    "create_pad": [
        "Sketch not attached",
        "invalid length",
        "invalid direction",
        "boolean operation failed",
        "Operation pad is not valid",
    ],
    "create_pocket": [
        "Sketch not attached",
        "invalid depth",
        "invalid direction",
        "pocket operation failed",
        "Operation pocket is not valid",
    ],
    "boolean_fuse": [
        "Boolean operation failed",
        "Shapes are not valid",
        "Invalid input shapes",
        "Fuse failed",
    ],
    "boolean_cut": [
        "Boolean operation failed",
        "Invalid tool shape",
        "Cut failed",
        "Shapes cannot be cut",
    ],
    "create_fillet": [
        "Invalid radius",
        "Edge not found",
        "Fillet failed",
        "Radius must be positive",
    ],
    "create_chamfer": [
        "Invalid distance",
        "Edge not found",
        "Chamfer failed",
    ],
    "set_property": [
        "Property not found",
        "Property is read-only",
        "Invalid property value",
        "Type mismatch",
    ],
    "move_object": [
        "Object not found",
        "Invalid placement",
        "Object is locked",
        "Cannot move fixed object",
    ],
    "rotate_object": [
        "Object not found",
        "Invalid rotation",
        "Object is locked",
    ],
    "set_expression": [
        "Invalid expression",
        "Expression syntax error",
        "Property does not support expressions",
        "Unknown variable",
    ],
}

OPERATION_HISTORY = []
ERROR_HISTORY = []


def handle_parse_error(error_text: str) -> Dict[str, Any]:
    """
    Parse Python/FreeCAD error text into structured data.

    Args:
        error_text: The raw error text to parse

    Returns:
        dict with success status and parsed error data
    """
    try:
        if not error_text:
            return {
                "success": False,
                "error": "No error text provided",
                "data": None,
            }

        parsed = {
            "raw_error": error_text,
            "error_type": None,
            "error_message": None,
            "category": None,
            "suggestions": [],
        }

        lines = error_text.strip().split("\n")
        if lines:
            first_line = lines[0]
            match = re.search(r"(\w+Error|\w+Exception):\s*(.*)", first_line)
            if match:
                parsed["error_type"] = match.group(1)
                parsed["error_message"] = match.group(2)

        category = handle_get_error_category(error_text)
        if category.get("success"):
            parsed["category"] = category["data"]["category"]

        traceback_info = handle_extract_traceback_info(error_text)
        if traceback_info.get("success"):
            parsed["traceback"] = traceback_info["data"]

        return {"success": True, "data": parsed, "error": None}
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_error_category(error_text: str) -> Dict[str, Any]:
    """
    Categorize error based on error text content.

    Args:
        error_text: The error text to categorize

    Returns:
        dict with success status and category information
    """
    try:
        if not error_text:
            return {
                "success": False,
                "error": "No error text provided",
                "data": None,
            }

        error_text_lower = error_text.lower()

        for category, patterns in ERROR_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, error_text, re.IGNORECASE):
                    return {
                        "success": True,
                        "data": {
                            "category": category,
                            "description": ERROR_CATEGORIES[category],
                            "matched_pattern": pattern,
                        },
                        "error": None,
                    }

        return {
            "success": True,
            "data": {
                "category": "UNKNOWN",
                "description": "Unknown error type",
                "matched_pattern": None,
            },
            "error": None,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_extract_traceback_info(traceback_text: str) -> Dict[str, Any]:
    """
    Extract file, line, function from traceback text.

    Args:
        traceback_text: The traceback text to parse

    Returns:
        dict with success status and extracted traceback information
    """
    try:
        if not traceback_text:
            return {
                "success": False,
                "error": "No traceback text provided",
                "data": None,
            }

        traceback_entries = []
        lines = traceback_text.strip().split("\n")

        file_pattern = r'File "(.*?)", line (\d+), (\w+)'
        for line in lines:
            match = re.search(file_pattern, line)
            if match:
                traceback_entries.append(
                    {
                        "file": match.group(1),
                        "line": int(match.group(2)),
                        "function": match.group(3),
                        "code": line.strip(),
                    }
                )

        if not traceback_entries:
            for i, line in enumerate(lines):
                if "line" in line.lower() and i > 0:
                    traceback_entries.append(
                        {
                            "file": None,
                            "line": None,
                            "function": None,
                            "code": line.strip(),
                        }
                    )

        return {
            "success": True,
            "data": {
                "entries": traceback_entries,
                "count": len(traceback_entries),
                "has_traceback": len(traceback_entries) > 0,
            },
            "error": None,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_analyze_error_context(
    error_text: str, operation_type: str
) -> Dict[str, Any]:
    """
    Analyze error in context of the operation attempted.

    Args:
        error_text: The error text to analyze
        operation_type: The type of operation that failed

    Returns:
        dict with success status and context analysis
    """
    try:
        if not error_text:
            return {
                "success": False,
                "error": "No error text provided",
                "data": None,
            }

        if not operation_type:
            return {
                "success": False,
                "error": "No operation type provided",
                "data": None,
            }

        category_result = handle_get_error_category(error_text)
        category = "UNKNOWN"
        if category_result.get("success"):
            category = category_result["data"]["category"]

        suggestions = handle_get_recovery_suggestions(error_text, operation_type)
        recovery_suggestions = []
        if suggestions.get("success"):
            recovery_suggestions = suggestions["data"].get("suggestions", [])

        context_analysis = {
            "operation_type": operation_type,
            "category": category,
            "error_summary": error_text[:200] if len(error_text) > 200 else error_text,
            "likely_causes": [],
            "recovery_suggestions": recovery_suggestions,
        }

        if category == "ATTRIBUTE_ERROR":
            context_analysis["likely_causes"] = [
                "Object does not exist or was deleted",
                "Property name is misspelled",
                "Object type does not support this operation",
                "Object is not fully initialized",
            ]
        elif category == "TYPE_ERROR":
            context_analysis["likely_causes"] = [
                "Wrong type of argument passed to function",
                "Expected a different object type",
                "Object is None when an object was expected",
            ]
        elif category == "VALUE_ERROR":
            context_analysis["likely_causes"] = [
                "Value is out of valid range",
                "Invalid parameter combination",
                "Negative value where positive expected",
            ]
        elif category == "REFERENCE_ERROR":
            context_analysis["likely_causes"] = [
                "Referenced object was deleted",
                "Object name is incorrect",
                "Object is not in the document",
                "Sketch was modified after reference created",
            ]
        elif category == "CONSTRAINT_ERROR":
            context_analysis["likely_causes"] = [
                "Sketch is over-constrained",
                "Conflicting constraints applied",
                "Incompatible geometry for constraint",
                "Sketch needs more constraints",
            ]
        elif category == "SOLVER_ERROR":
            context_analysis["likely_causes"] = [
                "Sketch cannot be solved as constrained",
                "Conflicting or redundant constraints",
                "Geometry is invalid",
                "Sketch is over-constrained",
            ]
        elif category == "BOOLEAN_ERROR":
            context_analysis["likely_causes"] = [
                "Input shapes are not valid for boolean",
                "Shapes do not intersect",
                "One shape is not solid",
                "Shapes are degenerate",
            ]
        elif category == "DOCUMENT_ERROR":
            context_analysis["likely_causes"] = [
                "No active document",
                "Document was closed",
                "Document is read-only",
            ]
        elif category == "PLACEMENT_ERROR":
            context_analysis["likely_causes"] = [
                "Invalid vector values",
                "Invalid rotation angles",
                "Placement outside valid bounds",
            ]
        elif category == "EXPRESSION_ERROR":
            context_analysis["likely_causes"] = [
                "Expression syntax is invalid",
                "Referenced property does not exist",
                "Circular reference in expression",
                "Invalid units in expression",
            ]
        elif category == "PERMISSION_ERROR":
            context_analysis["likely_causes"] = [
                "Object is locked",
                "Object is in read-only mode",
                "Operation not allowed in current context",
            ]
        elif category == "MEMORY_ERROR":
            context_analysis["likely_causes"] = [
                "Operation requires too much memory",
                "Model is too complex",
                "Insufficient system resources",
            ]

        return {"success": True, "data": context_analysis, "error": None}
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_recovery_suggestions(error_text: str, operation: str) -> Dict[str, Any]:
    """
    Get suggested fixes based on error and operation.

    Args:
        error_text: The error text to analyze
        operation: The operation that was attempted

    Returns:
        dict with success status and recovery suggestions
    """
    try:
        if not error_text:
            return {
                "success": False,
                "error": "No error text provided",
                "data": None,
            }

        if not operation:
            return {
                "success": False,
                "error": "No operation provided",
                "data": None,
            }

        suggestions = []
        category_result = handle_get_error_category(error_text)
        category = "UNKNOWN"
        if category_result.get("success"):
            category = category_result["data"]["category"]

        if operation in OPERATION_ERRORS:
            op_errors = OPERATION_ERRORS[operation]
            for err in op_errors:
                if err.lower() in error_text.lower():
                    suggestions.append(f"Review {operation} parameters")

        general_suggestions = {
            "ATTRIBUTE_ERROR": [
                "Verify the object exists before accessing its attributes",
                "Check for typos in property or method names",
                "Ensure the object is of the correct type",
                "Check if the object was deleted or is None",
            ],
            "TYPE_ERROR": [
                "Verify the type of arguments passed to the function",
                "Check if None is being passed where an object is expected",
                "Ensure objects are properly initialized before use",
                "Review the function signature for correct parameter types",
            ],
            "VALUE_ERROR": [
                "Check that all parameter values are within valid ranges",
                "Verify numeric values are not negative when required positive",
                "Ensure string values match expected formats",
                "Review minimum and maximum constraints",
            ],
            "REFERENCE_ERROR": [
                "Verify all referenced objects still exist",
                "Check for deleted objects in expressions",
                "Ensure objects are in the correct document",
                "Rebuild references if objects were recreated",
            ],
            "CONSTRAINT_ERROR": [
                "Review and remove conflicting constraints",
                "Check for redundant constraints",
                "Ensure sketch is properly constrained (not under or over)",
                "Verify geometry is compatible with constraints",
            ],
            "SOLVER_ERROR": [
                "Check sketch for conflicting constraints",
                "Verify all geometry is properly defined",
                "Remove unnecessary constraints",
                "Ensure sketch is not over-constrained",
                "Check for coincident points that should be separate",
            ],
            "BOOLEAN_ERROR": [
                "Verify both shapes are valid solids",
                "Check that shapes intersect or touch",
                "Ensure faces are not coplanar",
                "Try healing shapes before boolean operation",
                "Check that shapes are not degenerate",
            ],
            "DOCUMENT_ERROR": [
                "Verify an active document exists",
                "Check if document was closed",
                "Ensure document is not read-only",
                "Create or open a document first",
            ],
            "PLACEMENT_ERROR": [
                "Verify placement vector values are valid",
                "Check rotation angles are in correct format",
                "Ensure placement is within model bounds",
                "Review placement syntax",
            ],
            "EXPRESSION_ERROR": [
                "Check expression syntax is correct",
                "Verify all referenced properties exist",
                "Avoid circular references",
                "Use correct unit syntax in expressions",
            ],
            "PERMISSION_ERROR": [
                "Unlock the object before modifying",
                "Check if object is in a read-only layer",
                "Exit any edit modes that might lock objects",
                "Verify you have permission to modify",
            ],
            "MEMORY_ERROR": [
                "Simplify the model geometry",
                "Reduce mesh refinement settings",
                "Break complex operations into smaller steps",
                "Close other documents to free memory",
            ],
        }

        if category in general_suggestions:
            suggestions.extend(general_suggestions[category])

        if not suggestions:
            suggestions = [
                "Review the error message for specific guidance",
                "Check FreeCAD documentation for the operation",
                "Verify all required preconditions are met",
                "Try the operation with simpler parameters first",
            ]

        return {
            "success": True,
            "data": {
                "operation": operation,
                "category": category,
                "suggestions": suggestions,
                "count": len(suggestions),
            },
            "error": None,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_validate_operation(object_name: str, operation: str) -> Dict[str, Any]:
    """
    Validate an operation can succeed before attempting.

    Args:
        object_name: Name of the object to validate
        operation: The operation to validate

    Returns:
        dict with success status and validation result
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None,
            }

        validation_result = {
            "object_name": object_name,
            "operation": operation,
            "is_valid": True,
            "issues": [],
            "warnings": [],
        }

        obj = doc.getObject(object_name)
        if obj is None:
            validation_result["is_valid"] = False
            validation_result["issues"].append(
                f"Object '{object_name}' not found in document"
            )
            return {"success": True, "data": validation_result, "error": None}

        if hasattr(obj, "isValid"):
            if not obj.isValid():
                validation_result["is_valid"] = False
                validation_result["issues"].append("Object is in invalid state")

        if operation in [
            "set_property",
            "move_object",
            "rotate_object",
            "scale_object",
        ]:
            if hasattr(obj, "isReadOnly") and obj.isReadOnly():
                validation_result["is_valid"] = False
                validation_result["issues"].append("Object is read-only")

        if operation in ["move_object", "rotate_object", "scale_object"]:
            if hasattr(obj, "isFixed"):
                validation_result["warnings"].append(
                    "Object may be fixed and cannot be transformed"
                )

        if operation in [
            "create_pad",
            "create_pocket",
            "boolean_fuse",
            "boolean_cut",
            "boolean_common",
        ]:
            if hasattr(obj, "Shape"):
                if obj.Shape.isNull():
                    validation_result["is_valid"] = False
                    validation_result["issues"].append("Object has empty shape")

        if operation in ["add_geometry", "add_constraint"]:
            if not hasattr(obj, "Geometry"):
                validation_result["is_valid"] = False
                validation_result["issues"].append(
                    "Object does not support geometry operations"
                )

        return {"success": True, "data": validation_result, "error": None}
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_common_errors(operation_type: str) -> Dict[str, Any]:
    """
    Get common errors for a given operation type.

    Args:
        operation_type: The type of operation to get errors for

    Returns:
        dict with success status and common errors
    """
    try:
        if not operation_type:
            return {
                "success": False,
                "error": "No operation type provided",
                "data": None,
            }

        all_errors = {}
        for op, errors in OPERATION_ERRORS.items():
            all_errors[op] = errors

        if operation_type == "all":
            return {
                "success": True,
                "data": {
                    "operation_errors": all_errors,
                    "error_categories": ERROR_CATEGORIES,
                },
                "error": None,
            }

        if operation_type not in OPERATION_ERRORS:
            return {
                "success": True,
                "data": {
                    "operation_type": operation_type,
                    "common_errors": [],
                    "message": f"No specific errors documented for operation '{operation_type}'",
                },
                "error": None,
            }

        return {
            "success": True,
            "data": {
                "operation_type": operation_type,
                "common_errors": OPERATION_ERRORS[operation_type],
                "count": len(OPERATION_ERRORS[operation_type]),
            },
            "error": None,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_operation_history(count: int = 10) -> Dict[str, Any]:
    """
    Get recent operations with their status.

    Args:
        count: Maximum number of operations to return

    Returns:
        dict with success status and operation history
    """
    try:
        if count <= 0:
            count = 10

        history = OPERATION_HISTORY[-count:] if OPERATION_HISTORY else []

        return {
            "success": True,
            "data": {
                "operations": history,
                "count": len(history),
                "total_recorded": len(OPERATION_HISTORY),
            },
            "error": None,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_last_error() -> Dict[str, Any]:
    """
    Get the most recent error details.

    Returns:
        dict with success status and last error details
    """
    try:
        if not ERROR_HISTORY:
            return {
                "success": True,
                "data": {
                    "has_error": False,
                    "error": None,
                    "message": "No errors recorded",
                },
                "error": None,
            }

        last_error = ERROR_HISTORY[-1]

        return {
            "success": True,
            "data": {
                "has_error": True,
                "error": last_error,
                "total_errors": len(ERROR_HISTORY),
            },
            "error": None,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_clear_error_history() -> Dict[str, Any]:
    """
    Clear the error tracking history.

    Returns:
        dict with success status and confirmation
    """
    try:
        global ERROR_HISTORY, OPERATION_HISTORY

        cleared_errors = len(ERROR_HISTORY)
        cleared_ops = len(OPERATION_HISTORY)

        ERROR_HISTORY = []
        OPERATION_HISTORY = []

        return {
            "success": True,
            "data": {
                "errors_cleared": cleared_errors,
                "operations_cleared": cleared_ops,
                "message": f"Cleared {cleared_errors} errors and {cleared_ops} operations from history",
            },
            "error": None,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_suggest_undo_strategy(
    object_name: str, failed_operation: str
) -> Dict[str, Any]:
    """
    Suggest undo approach after failed operation.

    Args:
        object_name: Name of the object involved in failed operation
        failed_operation: The operation that failed

    Returns:
        dict with success status and undo strategy suggestions
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None,
            }

        obj = doc.getObject(object_name)

        strategy = {
            "object_name": object_name,
            "failed_operation": failed_operation,
            "suggested_undo_steps": [],
            "can_undo": doc.UndoSize() > 0,
            "undo_available": doc.UndoSize(),
        }

        if failed_operation in [
            "create_pad",
            "create_pocket",
            "create_fillet",
            "create_chamfer",
        ]:
            strategy["suggested_undo_steps"] = [
                "Call doc.Undo() to revert the feature creation",
                "If that fails, manually delete the created feature object",
                "Check if sketch is still valid after undo",
                "Verify the base object is not corrupted",
            ]
        elif failed_operation in ["boolean_fuse", "boolean_cut", "boolean_common"]:
            strategy["suggested_undo_steps"] = [
                "Call doc.Undo() to revert the boolean operation",
                "If original shapes were modified, undo those operations first",
                "Verify both input shapes are still valid",
                "Consider healing shapes before retrying",
            ]
        elif failed_operation in [
            "add_constraint",
            "add_geometric_constraint",
            "add_dimensional_constraint",
        ]:
            strategy["suggested_undo_steps"] = [
                "Call doc.Undo() to remove the constraint",
                "Identify and remove the specific constraint if name is known",
                "Recompute the sketch to verify it solves",
                "Check for conflicting constraints before adding new ones",
            ]
        elif failed_operation in ["set_property", "set_expression"]:
            strategy["suggested_undo_steps"] = [
                "Call doc.Undo() to revert the property change",
                "If the old value is known, set it directly",
                "Check if property change affected other objects",
                "Verify expression syntax is correct",
            ]
        elif failed_operation in ["move_object", "rotate_object", "scale_object"]:
            strategy["suggested_undo_steps"] = [
                "Call doc.Undo() to revert the transformation",
                "If transformation was complex, reset placement to original",
                "Check if object is fixed before transforming",
                "Verify object is not part of a pattern",
            ]
        else:
            strategy["suggested_undo_steps"] = [
                "Call doc.Undo() to revert the operation",
                "Check doc.UndoSize() to confirm undo is available",
                "If undo fails, manually restore previous state",
                "Document the failure to avoid repeating the operation",
            ]

        if obj is None:
            strategy["object_exists"] = False
            strategy["suggested_undo_steps"].append(
                f"Object '{object_name}' no longer exists - no undo needed for object itself"
            )
        else:
            strategy["object_exists"] = True

        return {"success": True, "data": strategy, "error": None}
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_recover_from_validation_error(
    validation_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate recovery code for validation failures.

    Args:
        validation_result: The validation result to recover from

    Returns:
        dict with success status and recovery actions
    """
    try:
        if not validation_result:
            return {
                "success": False,
                "error": "No validation result provided",
                "data": None,
            }

        recovery = {
            "validation_result": validation_result,
            "recovery_actions": [],
            "can_recover": True,
        }

        issues = validation_result.get("issues", [])
        warnings = validation_result.get("warnings", [])
        is_valid = validation_result.get("is_valid", True)

        if is_valid and not issues:
            recovery["recovery_actions"].append(
                "Validation passed - no recovery needed"
            )
            return {"success": True, "data": recovery, "error": None}

        recovery["can_recover"] = len(issues) > 0

        for issue in issues:
            issue_lower = issue.lower()
            if "not found" in issue_lower:
                recovery["recovery_actions"].append(
                    "Verify the object name is correct and object exists in the document"
                )
            elif "read-only" in issue_lower or "locked" in issue_lower:
                recovery["recovery_actions"].append(
                    "Unlock the object or exit read-only mode before modifying"
                )
            elif "empty shape" in issue_lower or "invalid state" in issue_lower:
                recovery["recovery_actions"].append(
                    "Rebuild the object geometry before performing this operation"
                )
            elif "not support" in issue_lower:
                recovery["recovery_actions"].append(
                    "Use an object type that supports this operation"
                )
            else:
                recovery["recovery_actions"].append(f"Address issue: {issue}")

        for warning in warnings:
            recovery["recovery_actions"].append(f"Warning to consider: {warning}")

        recovery["recovery_code_template"] = _generate_recovery_code(validation_result)

        return {"success": True, "data": recovery, "error": None}
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def _generate_recovery_code(validation_result: Dict[str, Any]) -> str:
    """
    Generate Python recovery code based on validation result.

    Args:
        validation_result: The validation result

    Returns:
        Python code string for recovery
    """
    object_name = validation_result.get("object_name", "Unknown")
    issues = validation_result.get("issues", [])

    lines = [
        "# Recovery code for validation failure",
        f"# Object: {object_name}",
        "",
        "import FreeCAD as App",
        "",
        "doc = App.ActiveDocument",
        "if doc is None:",
        '    raise RuntimeError("No active document")',
        "",
    ]

    for issue in issues:
        issue_lower = issue.lower()
        if "not found" in issue_lower:
            lines.extend(
                [
                    f"# Verify object exists",
                    f"obj = doc.getObject('{object_name}')",
                    f"if obj is None:",
                    f'    raise ValueError("Object {object_name} not found in document")',
                    "",
                ]
            )
        elif "read-only" in issue_lower:
            lines.extend(
                [
                    f"# Check if object is read-only",
                    f"obj = doc.getObject('{object_name}')",
                    f"if obj and hasattr(obj, 'isReadOnly'):",
                    f"    if obj.isReadOnly():",
                    f'        print("Object is read-only, cannot modify")',
                    "",
                ]
            )
        elif "empty shape" in issue_lower:
            lines.extend(
                [
                    f"# Check shape validity and rebuild if needed",
                    f"obj = doc.getObject('{object_name}')",
                    f"if obj and hasattr(obj, 'Shape'):",
                    f"    if obj.Shape.isNull():",
                    f'        print("Shape is empty, rebuild required")',
                    "",
                ]
            )

    lines.append("# After addressing issues, retry the operation")

    return "\n".join(lines)


def handle_safe_retry(operation: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute operation with additional safety checks.

    Args:
        operation: The operation to retry
        parameters: Parameters for the operation

    Returns:
        dict with success status and operation result
    """
    try:
        if not operation:
            return {
                "success": False,
                "error": "No operation specified",
                "data": None,
            }

        doc = App.ActiveDocument
        if doc is None:
            return {
                "success": False,
                "error": "No active document",
                "data": None,
            }

        object_name = parameters.get("object_name")
        if object_name:
            validation = handle_validate_operation(object_name, operation)
            if validation.get("success"):
                result = validation["data"]
                if not result["is_valid"]:
                    return {
                        "success": False,
                        "error": f"Operation validation failed: {'; '.join(result['issues'])}",
                        "data": {
                            "validation_result": result,
                            "operation": operation,
                            "retry_attempted": False,
                        },
                    }

        record = {
            "operation": operation,
            "parameters": parameters,
            "status": "unknown",
            "error": None,
        }

        try:
            result_data = None
            if operation == "undo":
                result_data = handle_undo()
            elif operation == "redo":
                result_data = handle_redo()
            else:
                record["status"] = "unknown_operation"
                return {
                    "success": False,
                    "error": f"Unknown operation: {operation}",
                    "data": {
                        "operation": operation,
                        "retry_attempted": True,
                        "result": None,
                    },
                }

            if result_data:
                if result_data.get("success"):
                    record["status"] = "success"
                    OPERATION_HISTORY.append(record)
                    return {
                        "success": True,
                        "data": {
                            "operation": operation,
                            "retry_attempted": True,
                            "result": result_data.get("data"),
                        },
                        "error": None,
                    }
                else:
                    record["status"] = "failed"
                    record["error"] = result_data.get("error")
                    ERROR_HISTORY.append(record)
                    return {
                        "success": False,
                        "error": result_data.get("error"),
                        "data": {
                            "operation": operation,
                            "retry_attempted": True,
                            "result": result_data.get("data"),
                        },
                    }

        except Exception as op_error:
            record["status"] = "exception"
            record["error"] = str(op_error)
            ERROR_HISTORY.append(record)
            return {
                "success": False,
                "error": str(op_error),
                "data": {
                    "operation": operation,
                    "retry_attempted": True,
                    "exception_raised": True,
                },
            }

        return {
            "success": False,
            "error": "Operation did not return a result",
            "data": {
                "operation": operation,
                "retry_attempted": True,
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def _record_operation(operation: str, status: str, details: Optional[Dict] = None):
    """
    Record an operation in the history.

    Args:
        operation: The operation name
        status: The operation status
        details: Additional details about the operation
    """
    record = {
        "operation": operation,
        "status": status,
    }
    if details:
        record.update(details)

    OPERATION_HISTORY.append(record)

    if status == "failed":
        ERROR_HISTORY.append(record)


def _record_error(error_type: str, error_message: str, context: Optional[Dict] = None):
    """
    Record an error in the history.

    Args:
        error_type: The type of error
        error_message: The error message
        context: Additional context about the error
    """
    record = {
        "error_type": error_type,
        "error_message": error_message,
    }
    if context:
        record.update(context)

    ERROR_HISTORY.append(record)


__all__ = [
    "handle_parse_error",
    "handle_get_error_category",
    "handle_extract_traceback_info",
    "handle_analyze_error_context",
    "handle_get_recovery_suggestions",
    "handle_validate_operation",
    "handle_get_common_errors",
    "handle_get_operation_history",
    "handle_get_last_error",
    "handle_clear_error_history",
    "handle_suggest_undo_strategy",
    "handle_recover_from_validation_error",
    "handle_safe_retry",
    "ERROR_CATEGORIES",
]
