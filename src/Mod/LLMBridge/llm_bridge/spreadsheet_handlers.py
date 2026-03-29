# SPDX-License-Identifier: LGPL-2.1-or-later
# Spreadsheet Handlers for FreeCAD Spreadsheet Workbench Operations
#
# Provides handlers for spreadsheet operations:
# - Spreadsheet lifecycle (create, delete, rename, list)
# - Cell operations (get, set, expressions, clear)
# - Alias operations (set, get, remove aliases)
# - BOM generation (bill of materials from CAD objects)
# - Parametric tables (lookup tables linked to model)
# - Formatting (column width, row height, cell background)
# Each handler returns JSON-serializable structures.

import re
import math

import FreeCAD as App


def _get_spreadsheet_by_name(doc, spreadsheet_name):
    """
    Find a spreadsheet object by name or label.

    Args:
        doc: FreeCAD document
        spreadsheet_name: Name or label of the spreadsheet

    Returns:
        tuple: (spreadsheet_object, error_message)
    """
    if doc is None:
        return None, "No active document"

    spreadsheet = doc.getObject(spreadsheet_name)
    if spreadsheet is None:
        spreadsheet = doc.getObjectsByLabel(spreadsheet_name)
        if spreadsheet:
            spreadsheet = spreadsheet[0] if len(spreadsheet) == 1 else None

    if spreadsheet is None:
        return None, f"Spreadsheet '{spreadsheet_name}' not found"

    if not spreadsheet.TypeId == "Spreadsheet::Sheet":
        return None, f"Object '{spreadsheet_name}' is not a spreadsheet"

    return spreadsheet, None


def _parse_cell_address(address):
    """
    Parse a cell address like 'A1', '$A$1', 'B2' into column and row.

    Args:
        address: Cell address string

    Returns:
        tuple: (column_letter, row_number) or (None, None) if invalid
    """
    if address is None:
        return None, None

    address = str(address).strip().upper()
    match = re.match(r"\$?([A-Z]+)\$?(\d+)", address)
    if match:
        return match.group(1), int(match.group(2))
    return None, None


def _column_to_index(column):
    """Convert column letter(s) to 1-based index."""
    result = 0
    for char in column.upper():
        result = result * 26 + (ord(char) - ord("A") + 1)
    return result


def _index_to_column(index):
    """Convert 1-based column index to letter(s)."""
    result = ""
    while index > 0:
        index, remainder = divmod(index - 1, 26)
        result = chr(ord("A") + remainder) + result
    return result


def _format_cell_value(value):
    """Format a cell value for display."""
    if value is None:
        return None
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return str(value)
        return round(value, 6)
    return value


def _get_all_spreadsheets(doc):
    """Get all spreadsheet objects in a document."""
    if doc is None:
        return []
    return [obj for obj in doc.Objects if obj.TypeId == "Spreadsheet::Sheet"]


def _get_used_range(spreadsheet):
    """
    Get the used range of a spreadsheet.

    Returns:
        dict: {"startColumn": int, "startRow": int, "endColumn": int, "endRow": int}
    """
    try:
        return spreadsheet.getContents()
    except Exception:
        return {"startColumn": 1, "startRow": 1, "endColumn": 1, "endRow": 1}


def _get_all_aliases(spreadsheet):
    """Get all aliases in a spreadsheet."""
    aliases = {}
    try:
        for cell_addr in spreadsheet.PropertiesList:
            if cell_addr.startswith("Alias_"):
                alias_name = cell_addr[6:]
                try:
                    address = spreadsheet.getAlias(cell_addr)
                    if address:
                        value = spreadsheet.getCellFromAlias(alias_name)
                        aliases[alias_name] = {
                            "address": address,
                            "value": _format_cell_value(value),
                        }
                except Exception:
                    pass
    except Exception:
        pass
    return aliases


def _extract_object_bom_properties(obj, properties):
    """
    Extract specified properties from an object for BOM.

    Args:
        obj: FreeCAD object
        properties: List of property names to extract

    Returns:
        dict: Property name to value mapping
    """
    result = {}
    for prop_name in properties:
        if hasattr(obj, prop_name):
            try:
                value = getattr(obj, prop_name)
                if hasattr(value, "Value"):
                    result[prop_name] = value.Value
                elif hasattr(value, "x"):
                    result[prop_name] = (value.x, value.y, value.z)
                else:
                    result[prop_name] = value
            except Exception:
                result[prop_name] = None
    return result


def _get_bom_properties_for_object(obj):
    """
    Get standard BOM properties from an object.

    Returns:
        dict: Standard BOM properties
    """
    bom_data = {
        "name": obj.Label if hasattr(obj, "Label") else obj.Name,
        "type": obj.TypeId,
        "label": obj.Label if hasattr(obj, "Label") else obj.Name,
    }

    if hasattr(obj, "Shape") and obj.Shape:
        shape = obj.Shape
        bom_data["volume"] = shape.Volume
        bom_data["surface_area"] = shape.Area
        bb = shape.BoundBox
        if bb.IsValid():
            bom_data["bounding_box"] = {
                "x": bb.XLength,
                "y": bb.YLength,
                "z": bb.ZLength,
            }

    if hasattr(obj, "Placement"):
        pos = obj.Placement.Base
        bom_data["position"] = {"x": pos.x, "y": pos.y, "z": pos.z}

    if hasattr(obj, "Length"):
        bom_data["length"] = obj.Length
    if hasattr(obj, "Width"):
        bom_data["width"] = obj.Width
    if hasattr(obj, "Height"):
        bom_data["height"] = obj.Height
    if hasattr(obj, "Radius"):
        bom_data["radius"] = obj.Radius
    if hasattr(obj, "Diameter"):
        bom_data["diameter"] = obj.Diameter

    if hasattr(obj, "Material"):
        mat = obj.Material
        if mat:
            bom_data["material"] = mat.Name if hasattr(mat, "Name") else str(mat)

    return bom_data


# =============================================================================
# Spreadsheet Lifecycle Handlers
# =============================================================================


def handle_create_spreadsheet(name):
    """
    Create a new spreadsheet in the document.

    Args:
        name: Name for the new spreadsheet

    Returns:
        dict with success status, spreadsheet info, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet = doc.addObject("Spreadsheet::Sheet", name)

        if spreadsheet is None:
            return {
                "success": False,
                "error": "Failed to create spreadsheet",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "objectName": spreadsheet.Name,
                "objectLabel": spreadsheet.Label,
                "objectType": "Spreadsheet",
                "message": f"Created spreadsheet '{spreadsheet.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_delete_spreadsheet(name):
    """
    Delete a spreadsheet from the document.

    Args:
        name: Name or label of the spreadsheet to delete

    Returns:
        dict with success status and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, name)
        if error:
            return {"success": False, "error": error, "data": None}

        spreadsheet_name = spreadsheet.Label
        doc.removeObject(spreadsheet.Name)
        doc.recompute()

        return {
            "success": True,
            "data": {
                "deletedSpreadsheet": spreadsheet_name,
                "message": f"Deleted spreadsheet '{spreadsheet_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_rename_spreadsheet(old_name, new_name):
    """
    Rename a spreadsheet.

    Args:
        old_name: Current name or label of the spreadsheet
        new_name: New name for the spreadsheet

    Returns:
        dict with success status, old name, new name, and message
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, old_name)
        if error:
            return {"success": False, "error": error, "data": None}

        old_label = spreadsheet.Label
        spreadsheet.Label = new_name
        doc.recompute()

        return {
            "success": True,
            "data": {
                "oldName": old_label,
                "newName": spreadsheet.Label,
                "message": f"Renamed spreadsheet from '{old_label}' to '{spreadsheet.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_spreadsheets():
    """
    List all spreadsheets in the active document.

    Returns:
        dict with success status, list of spreadsheets, and count
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheets = _get_all_spreadsheets(doc)
        spreadsheet_list = []

        for ss in spreadsheets:
            used = None
            try:
                used = ss.getContents()
            except Exception:
                pass

            spreadsheet_list.append(
                {"name": ss.Name, "label": ss.Label, "usedRange": used}
            )

        return {
            "success": True,
            "data": {
                "spreadsheets": spreadsheet_list,
                "count": len(spreadsheet_list),
                "message": f"Found {len(spreadsheet_list)} spreadsheet(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_spreadsheet_info(name):
    """
    Get metadata about a spreadsheet.

    Args:
        name: Name or label of the spreadsheet

    Returns:
        dict with success status, spreadsheet metadata
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, name)
        if error:
            return {"success": False, "error": error, "data": None}

        try:
            contents = spreadsheet.getContents()
        except Exception:
            contents = None

        aliases = _get_all_aliases(spreadsheet)

        return {
            "success": True,
            "data": {
                "name": spreadsheet.Name,
                "label": spreadsheet.Label,
                "type": spreadsheet.TypeId,
                "usedRange": contents,
                "aliasCount": len(aliases),
                "aliases": aliases,
                "message": f"Retrieved info for spreadsheet '{spreadsheet.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# =============================================================================
# Cell Operation Handlers
# =============================================================================


def handle_set_cell(spreadsheet_name, address, value):
    """
    Set a cell value.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        address: Cell address like 'A1' or '$A$1'
        value: Value to set (string, number, or expression)

    Returns:
        dict with success status, cell info, before/after values
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        col, row = _parse_cell_address(address)
        if col is None:
            return {
                "success": False,
                "error": f"Invalid cell address: {address}",
                "data": None,
            }

        try:
            before_value = spreadsheet.getCell(address)
        except Exception:
            before_value = None

        try:
            spreadsheet.setCell(address, value)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to set cell: {str(e)}",
                "data": None,
            }

        doc.recompute()

        try:
            after_value = spreadsheet.getCell(address)
        except Exception:
            after_value = value

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "address": address,
                "beforeValue": _format_cell_value(before_value),
                "afterValue": _format_cell_value(after_value),
                "message": f"Set cell {address} to value",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_cell(spreadsheet_name, address):
    """
    Get a cell value.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        address: Cell address like 'A1' or '$A$1'

    Returns:
        dict with success status and cell value
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        col, row = _parse_cell_address(address)
        if col is None:
            return {
                "success": False,
                "error": f"Invalid cell address: {address}",
                "data": None,
            }

        try:
            value = spreadsheet.getCell(address)
            expression = spreadsheet.getExpression(address)

            return {
                "success": True,
                "data": {
                    "spreadsheet": spreadsheet.Label,
                    "address": address,
                    "value": _format_cell_value(value),
                    "expression": expression,
                    "hasExpression": expression is not None,
                    "message": f"Retrieved value from cell {address}",
                },
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get cell: {str(e)}",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_cell_expression(spreadsheet_name, address, expression):
    """
    Set a cell formula/expression.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        address: Cell address like 'A1' or '$A$1'
        expression: Formula/expression to set (e.g., '=A1+B1' or '=Sum(A1:A10)')

    Returns:
        dict with success status, cell info, and expression details
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        col, row = _parse_cell_address(address)
        if col is None:
            return {
                "success": False,
                "error": f"Invalid cell address: {address}",
                "data": None,
            }

        if not expression.startswith("="):
            expression = "=" + expression

        try:
            before_expression = spreadsheet.getExpression(address)
        except Exception:
            before_expression = None

        try:
            before_value = spreadsheet.getCell(address)
        except Exception:
            before_value = None

        try:
            spreadsheet.setExpression(address, expression)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to set expression: {str(e)}",
                "data": None,
            }

        doc.recompute()

        try:
            after_value = spreadsheet.getCell(address)
        except Exception:
            after_value = None

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "address": address,
                "expression": expression,
                "previousExpression": before_expression,
                "beforeValue": _format_cell_value(before_value),
                "afterValue": _format_cell_value(after_value),
                "message": f"Set expression on cell {address}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_cell_expression(spreadsheet_name, address):
    """
    Get a cell's formula/expression.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        address: Cell address like 'A1' or '$A$1'

    Returns:
        dict with success status, cell expression, and computed value
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        col, row = _parse_cell_address(address)
        if col is None:
            return {
                "success": False,
                "error": f"Invalid cell address: {address}",
                "data": None,
            }

        try:
            expression = spreadsheet.getExpression(address)
            value = spreadsheet.getCell(address)

            return {
                "success": True,
                "data": {
                    "spreadsheet": spreadsheet.Label,
                    "address": address,
                    "expression": expression,
                    "computedValue": _format_cell_value(value),
                    "hasExpression": expression is not None,
                    "message": f"Retrieved expression from cell {address}",
                },
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get expression: {str(e)}",
                "data": None,
            }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_clear_cell(spreadsheet_name, address):
    """
    Clear a cell's content.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        address: Cell address like 'A1' or '$A$1'

    Returns:
        dict with success status and cleared cell info
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        col, row = _parse_cell_address(address)
        if col is None:
            return {
                "success": False,
                "error": f"Invalid cell address: {address}",
                "data": None,
            }

        try:
            before_value = spreadsheet.getCell(address)
            before_expression = spreadsheet.getExpression(address)
        except Exception:
            before_value = None
            before_expression = None

        try:
            spreadsheet.clearCell(address)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to clear cell: {str(e)}",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "address": address,
                "clearedValue": _format_cell_value(before_value),
                "clearedExpression": before_expression,
                "message": f"Cleared cell {address}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_clear_range(spreadsheet_name, start_address, end_address):
    """
    Clear a range of cells.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        start_address: Start cell address like 'A1'
        end_address: End cell address like 'D10'

    Returns:
        dict with success status and range info
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        start_col, start_row = _parse_cell_address(start_address)
        end_col, end_row = _parse_cell_address(end_address)

        if start_col is None or end_col is None:
            return {
                "success": False,
                "error": f"Invalid cell addresses: {start_address} - {end_address}",
                "data": None,
            }

        cleared_count = 0
        start_col_idx = _column_to_index(start_col)
        end_col_idx = _column_to_index(end_col)

        for row in range(start_row, end_row + 1):
            for col_idx in range(start_col_idx, end_col_idx + 1):
                col_letter = _index_to_column(col_idx)
                address = f"{col_letter}{row}"
                try:
                    spreadsheet.clearCell(address)
                    cleared_count += 1
                except Exception:
                    pass

        doc.recompute()

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "startAddress": start_address,
                "endAddress": end_address,
                "clearedCount": cleared_count,
                "message": f"Cleared {cleared_count} cell(s) in range {start_address}:{end_address}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# =============================================================================
# Alias Operation Handlers
# =============================================================================


def handle_set_alias(spreadsheet_name, address, alias_name):
    """
    Set an alias on a cell.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        address: Cell address like 'A1' or '$A$1'
        alias_name: Name for the alias

    Returns:
        dict with success status, alias info
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        col, row = _parse_cell_address(address)
        if col is None:
            return {
                "success": False,
                "error": f"Invalid cell address: {address}",
                "data": None,
            }

        try:
            spreadsheet.setAlias(address, alias_name)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to set alias: {str(e)}",
                "data": None,
            }

        doc.recompute()

        try:
            cell_value = spreadsheet.getCell(address)
        except Exception:
            cell_value = None

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "address": address,
                "aliasName": alias_name,
                "cellValue": _format_cell_value(cell_value),
                "message": f"Set alias '{alias_name}' on cell {address}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_alias(spreadsheet_name, alias_name):
    """
    Get a cell value by alias.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        alias_name: Name of the alias to lookup

    Returns:
        dict with success status and cell value
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        try:
            address = spreadsheet.getAlias(f"Alias_{alias_name}")
            if not address:
                address = spreadsheet.getAlias(alias_name)
        except Exception:
            address = None

        if not address:
            return {
                "success": False,
                "error": f"Alias '{alias_name}' not found",
                "data": None,
            }

        try:
            value = spreadsheet.getCellFromAlias(alias_name)
            expression = spreadsheet.getExpression(address)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get alias value: {str(e)}",
                "data": None,
            }

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "aliasName": alias_name,
                "address": address,
                "value": _format_cell_value(value),
                "expression": expression,
                "hasExpression": expression is not None,
                "message": f"Retrieved value for alias '{alias_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_remove_alias(spreadsheet_name, alias_name):
    """
    Remove an alias from a cell.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        alias_name: Name of the alias to remove

    Returns:
        dict with success status and alias info
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        try:
            address = spreadsheet.getAlias(f"Alias_{alias_name}")
            if not address:
                address = spreadsheet.getAlias(alias_name)
        except Exception:
            address = None

        if not address:
            return {
                "success": False,
                "error": f"Alias '{alias_name}' not found",
                "data": None,
            }

        try:
            spreadsheet.removeAlias(alias_name)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to remove alias: {str(e)}",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "removedAlias": alias_name,
                "previousAddress": address,
                "message": f"Removed alias '{alias_name}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_list_aliases(spreadsheet_name):
    """
    List all aliases in a spreadsheet.

    Args:
        spreadsheet_name: Name or label of the spreadsheet

    Returns:
        dict with success status, list of aliases, and count
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        aliases = _get_all_aliases(spreadsheet)

        alias_list = []
        for alias_name, info in aliases.items():
            alias_list.append(
                {
                    "alias": alias_name,
                    "address": info["address"],
                    "value": info["value"],
                }
            )

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "aliases": alias_list,
                "count": len(alias_list),
                "message": f"Found {len(alias_list)} alias(es) in '{spreadsheet.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# =============================================================================
# BOM Generation Handlers
# =============================================================================


def handle_generate_bom(options=None):
    """
    Generate a Bill of Materials from document objects.

    Args:
        options: dict with options:
            - include_hidden: bool (default False)
            - group_by_type: bool (default False)
            - include_properties: list of property names (default standard props)
            - output_format: 'list' or 'dict' (default 'list')

    Returns:
        dict with success status and BOM data
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        options = options or {}
        include_hidden = options.get("include_hidden", False)
        group_by_type = options.get("group_by_type", False)
        include_properties = options.get("include_properties", None)
        output_format = options.get("output_format", "list")

        bom_items = []

        for obj in doc.Objects:
            if not include_hidden and hasattr(obj, "Visibility") and not obj.Visibility:
                continue

            if obj.TypeId == "Spreadsheet::Sheet":
                continue

            if hasattr(obj, "Shape") or hasattr(obj, "Placement"):
                bom_entry = _get_bom_properties_for_object(obj)

                if include_properties:
                    extra_props = _extract_object_bom_properties(
                        obj, include_properties
                    )
                    bom_entry.update(extra_props)

                bom_items.append(bom_entry)

        if group_by_type:
            grouped = {}
            for item in bom_items:
                obj_type = item.get("type", "Unknown")
                if obj_type not in grouped:
                    grouped[obj_type] = []
                grouped[obj_type].append(item)

            bom_data = grouped
            item_count = len(bom_items)
        else:
            bom_data = bom_items
            item_count = len(bom_items)

        return {
            "success": True,
            "data": {
                "bom": bom_data,
                "itemCount": item_count,
                "format": output_format,
                "groupedByType": group_by_type,
                "message": f"Generated BOM with {item_count} item(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_get_object_bom_data(object_names, properties=None):
    """
    Extract structured data from specific objects for BOM.

    Args:
        object_names: List of object names or labels to extract data from
        properties: Optional list of specific properties to extract

    Returns:
        dict with success status and extracted data
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        if isinstance(object_names, str):
            object_names = [object_names]

        extracted_data = []
        errors = []

        for obj_name in object_names:
            obj = doc.getObject(obj_name)
            if obj is None:
                obj = doc.getObjectsByLabel(obj_name)
                obj = obj[0] if obj and len(obj) == 1 else None

            if obj is None:
                errors.append({"object": obj_name, "error": "Not found"})
                continue

            if properties:
                data = _extract_object_bom_properties(obj, properties)
            else:
                data = _get_bom_properties_for_object(obj)

            data["sourceObject"] = obj.Name
            extracted_data.append(data)

        return {
            "success": len(errors) == 0,
            "data": {
                "items": extracted_data,
                "itemCount": len(extracted_data),
                "errors": errors if errors else None,
                "message": f"Extracted data from {len(extracted_data)} object(s)",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_export_bom_to_spreadsheet(bom_data, spreadsheet_name, start_address="A1"):
    """
    Write BOM data to a spreadsheet.

    Args:
        bom_data: BOM data from handle_generate_bom or handle_get_object_bom_data
        spreadsheet_name: Name or label of the target spreadsheet
        start_address: Starting cell address (default 'A1')

    Returns:
        dict with success status, cell range written, and item count
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        if isinstance(bom_data, dict):
            if "bom" in bom_data:
                items = bom_data["bom"]
            elif "items" in bom_data:
                items = bom_data["items"]
            else:
                items = [bom_data]
        elif isinstance(bom_data, list):
            items = bom_data
        else:
            return {"success": False, "error": "Invalid BOM data format", "data": None}

        if not items:
            return {"success": False, "error": "No items to export", "data": None}

        start_col, start_row = _parse_cell_address(start_address)
        if start_col is None:
            return {
                "success": False,
                "error": f"Invalid start address: {start_address}",
                "data": None,
            }

        all_keys = set()
        for item in items:
            all_keys.update(item.keys())

        keys_to_write = [k for k in all_keys if k not in ["sourceObject"]]

        start_col_idx = _column_to_index(start_col)
        current_row = start_row
        current_col = start_col_idx

        for key in keys_to_write:
            address = f"{_index_to_column(current_col)}{current_row}"
            spreadsheet.setCell(address, str(key))
            current_col += 1

        header_end_col = current_col - 1
        current_row += 1

        for item in items:
            current_col = start_col_idx
            for key in keys_to_write:
                value = item.get(key)
                address = f"{_index_to_column(current_col)}{current_row}"

                if value is None:
                    value = ""
                elif isinstance(value, (list, tuple)):
                    value = str(value)
                elif isinstance(value, dict):
                    import json

                    value = json.dumps(value)
                elif hasattr(value, "Value"):
                    value = value.Value
                elif isinstance(value, float):
                    value = round(value, 6)
                else:
                    value = str(value)

                spreadsheet.setCell(address, value)
                current_col += 1

            current_row += 1

        end_row = current_row - 1
        end_col = header_end_col

        doc.recompute()

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "startAddress": f"{_index_to_column(start_col_idx)}{start_row}",
                "endAddress": f"{_index_to_column(end_col)}{end_row}",
                "rowsWritten": current_row - start_row,
                "columnsWritten": len(keys_to_write),
                "itemCount": len(items),
                "message": f"Exported BOM with {len(items)} items to '{spreadsheet.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# =============================================================================
# Parametric Table Handlers
# =============================================================================


def handle_create_parametric_table(spreadsheet_name, headers, data):
    """
    Create a parametric lookup table in a spreadsheet.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        headers: List of column header names
        data: List of rows, each row is a list of values

    Returns:
        dict with success status, table info
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        if not headers or not isinstance(headers, list):
            return {"success": False, "error": "Invalid headers", "data": None}

        if not data or not isinstance(data, list):
            return {"success": False, "error": "Invalid data", "data": None}

        for row in data:
            if not isinstance(row, list) or len(row) != len(headers):
                return {
                    "success": False,
                    "error": "Data row length mismatch with headers",
                    "data": None,
                }

        start_row = 1
        start_col = 1

        for col_idx, header in enumerate(headers):
            address = f"{_index_to_column(start_col + col_idx)}{start_row}"
            spreadsheet.setCell(address, str(header))

        for row_idx, row_data in enumerate(data):
            for col_idx, value in enumerate(row_data):
                address = (
                    f"{_index_to_column(start_col + col_idx)}{start_row + row_idx + 1}"
                )

                if isinstance(value, str) and value.startswith("="):
                    spreadsheet.setExpression(address, value)
                else:
                    spreadsheet.setCell(address, value)

        doc.recompute()

        end_row = start_row + len(data)
        end_col = start_col + len(headers) - 1

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "startAddress": f"{_index_to_column(start_col)}{start_row}",
                "endAddress": f"{_index_to_column(end_col)}{end_row}",
                "rowCount": len(data),
                "columnCount": len(headers),
                "headers": headers,
                "message": f"Created parametric table with {len(data)} rows in '{spreadsheet.Label}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_update_parametric_table(spreadsheet_name, row_key, updates):
    """
    Update a row in a parametric table.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        row_key: Value in the first column to identify the row
        updates: dict of column_header: new_value

    Returns:
        dict with success status, update info
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        if not updates or not isinstance(updates, dict):
            return {"success": False, "error": "Invalid updates format", "data": None}

        try:
            contents = spreadsheet.getContents()
        except Exception:
            return {
                "success": False,
                "error": "Could not read spreadsheet contents",
                "data": None,
            }

        start_row = contents.get("startRow", 1)
        start_col = contents.get("startColumn", 1)
        end_row = contents.get("endRow", 1)
        end_col = contents.get("endColumn", 1)

        headers = []
        for col_idx in range(start_col, end_col + 1):
            address = f"{_index_to_column(col_idx)}{start_row}"
            try:
                header = spreadsheet.getCell(address)
                headers.append(str(header) if header else "")
            except Exception:
                headers.append("")

        if not headers:
            return {
                "success": False,
                "error": "Could not read table headers",
                "data": None,
            }

        update_col_indices = []
        for col_header in updates.keys():
            if col_header in headers:
                update_col_indices.append(headers.index(col_header))
            else:
                for col_idx, h in enumerate(headers):
                    if str(h).lower() == str(col_header).lower():
                        update_col_indices.append(col_idx)
                        break

        target_row = None
        for row in range(start_row + 1, end_row + 1):
            key_address = f"{_index_to_column(start_col)}{row}"
            try:
                key_value = spreadsheet.getCell(key_address)
                if str(key_value) == str(row_key):
                    target_row = row
                    break
            except Exception:
                pass

        if target_row is None:
            return {
                "success": False,
                "error": f"Row with key '{row_key}' not found",
                "data": None,
            }

        updated_cells = []
        for col_idx in update_col_indices:
            col_header = headers[col_idx]
            new_value = updates.get(col_header)
            address = f"{_index_to_column(start_col + col_idx)}{target_row}"

            if isinstance(new_value, str) and new_value.startswith("="):
                spreadsheet.setExpression(address, new_value)
            else:
                spreadsheet.setCell(address, new_value)

            updated_cells.append(
                {"column": col_header, "address": address, "newValue": new_value}
            )

        doc.recompute()

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "rowKey": row_key,
                "targetRow": target_row,
                "updatedCells": updated_cells,
                "message": f"Updated {len(updated_cells)} cell(s) in row '{row_key}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_lookup_value(spreadsheet_name, column_key, lookup_value):
    """
    Lookup a value in a parametric table.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        column_key: Column header to return (the "return column")
        lookup_value: Value to search for in the first column

    Returns:
        dict with success status, lookup result
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        try:
            contents = spreadsheet.getContents()
        except Exception:
            return {
                "success": False,
                "error": "Could not read spreadsheet contents",
                "data": None,
            }

        start_row = contents.get("startRow", 1)
        start_col = contents.get("startColumn", 1)
        end_row = contents.get("endRow", 1)
        end_col = contents.get("endColumn", 1)

        headers = []
        for col_idx in range(start_col, end_col + 1):
            address = f"{_index_to_column(col_idx)}{start_row}"
            try:
                header = spreadsheet.getCell(address)
                headers.append(str(header) if header else "")
            except Exception:
                headers.append("")

        if not headers:
            return {
                "success": False,
                "error": "Could not read table headers",
                "data": None,
            }

        return_col_idx = None
        for col_idx, h in enumerate(headers):
            if str(h).lower() == str(column_key).lower():
                return_col_idx = col_idx
                break

        if return_col_idx is None:
            return {
                "success": False,
                "error": f"Column '{column_key}' not found",
                "data": None,
            }

        target_row = None
        for row in range(start_row + 1, end_row + 1):
            key_address = f"{_index_to_column(start_col)}{row}"
            try:
                key_value = spreadsheet.getCell(key_address)
                if str(key_value).lower() == str(lookup_value).lower():
                    target_row = row
                    break
            except Exception:
                pass

        if target_row is None:
            return {
                "success": False,
                "error": f"Row with key '{lookup_value}' not found",
                "data": None,
            }

        result_address = f"{_index_to_column(start_col + return_col_idx)}{target_row}"
        result_value = spreadsheet.getCell(result_address)
        result_expression = spreadsheet.getExpression(result_address)

        row_data = {}
        for col_idx in range(len(headers)):
            address = f"{_index_to_column(start_col + col_idx)}{target_row}"
            try:
                row_data[headers[col_idx]] = _format_cell_value(
                    spreadsheet.getCell(address)
                )
            except Exception:
                row_data[headers[col_idx]] = None

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "lookupColumn": column_key,
                "lookupValue": lookup_value,
                "foundRow": target_row,
                "resultAddress": result_address,
                "resultValue": _format_cell_value(result_value),
                "resultExpression": result_expression,
                "rowData": row_data,
                "message": f"Found value '{result_value}' for key '{lookup_value}' in column '{column_key}'",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


# =============================================================================
# Formatting Handlers
# =============================================================================


def handle_set_column_width(spreadsheet_name, column, width):
    """
    Set column width.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        column: Column letter (e.g., 'A', 'B', 'AB')
        width: Width in points (standard Excel units)

    Returns:
        dict with success status, column info
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        column = column.upper()
        match = re.match(r"\$?([A-Z]+)", column)
        if not match:
            return {
                "success": False,
                "error": f"Invalid column: {column}",
                "data": None,
            }

        try:
            width_float = float(width)
            if width_float < 0:
                width_float = 0
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid width value: {width}",
                "data": None,
            }

        col_idx = _column_to_index(match.group(1))

        try:
            spreadsheet.setColumnWidth(col_idx, width_float)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to set column width: {str(e)}",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "column": match.group(1),
                "width": width_float,
                "message": f"Set column {match.group(1)} width to {width_float}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_row_height(spreadsheet_name, row, height):
    """
    Set row height.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        row: Row number (1-based)
        height: Height in points

    Returns:
        dict with success status, row info
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        try:
            row_int = int(row)
            if row_int < 1:
                return {
                    "success": False,
                    "error": f"Invalid row number: {row}",
                    "data": None,
                }
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid row value: {row}",
                "data": None,
            }

        try:
            height_float = float(height)
            if height_float < 0:
                height_float = 0
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid height value: {height}",
                "data": None,
            }

        try:
            spreadsheet.setRowHeight(row_int, height_float)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to set row height: {str(e)}",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "row": row_int,
                "height": height_float,
                "message": f"Set row {row_int} height to {height_float}",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


def handle_set_cell_background(spreadsheet_name, address, color):
    """
    Set cell background color.

    Args:
        spreadsheet_name: Name or label of the spreadsheet
        address: Cell address like 'A1' or '$A$1'
        color: Color as hex string (e.g., '#FF0000') or RGB tuple (r, g, b)

    Returns:
        dict with success status, cell info
    """
    try:
        doc = App.ActiveDocument
        if doc is None:
            return {"success": False, "error": "No active document", "data": None}

        spreadsheet, error = _get_spreadsheet_by_name(doc, spreadsheet_name)
        if error:
            return {"success": False, "error": error, "data": None}

        col, row = _parse_cell_address(address)
        if col is None:
            return {
                "success": False,
                "error": f"Invalid cell address: {address}",
                "data": None,
            }

        if isinstance(color, str):
            color = color.strip()
            if color.startswith("#"):
                try:
                    r = int(color[1:3], 16) / 255.0
                    g = int(color[3:5], 16) / 255.0
                    b = int(color[5:7], 16) / 255.0
                    color = (r, g, b)
                except ValueError:
                    return {
                        "success": False,
                        "error": f"Invalid hex color: {color}",
                        "data": None,
                    }
            elif "," in color:
                try:
                    parts = color.replace("(", "").replace(")", "").split(",")
                    color = (
                        float(parts[0]) / 255.0,
                        float(parts[1]) / 255.0,
                        float(parts[2]) / 255.0,
                    )
                except Exception:
                    return {
                        "success": False,
                        "error": f"Invalid RGB color: {color}",
                        "data": None,
                    }
        elif isinstance(color, (list, tuple)) and len(color) == 3:
            color = (
                float(color[0]) / 255.0,
                float(color[1]) / 255.0,
                float(color[2]) / 255.0,
            )
        else:
            return {
                "success": False,
                "error": f"Invalid color format: {color}",
                "data": None,
            }

        try:
            spreadsheet.setCellBackground(address, color)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to set cell background: {str(e)}",
                "data": None,
            }

        doc.recompute()

        return {
            "success": True,
            "data": {
                "spreadsheet": spreadsheet.Label,
                "address": address,
                "color": color,
                "message": f"Set cell {address} background color",
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e), "data": None}


__all__ = [
    "handle_create_spreadsheet",
    "handle_delete_spreadsheet",
    "handle_rename_spreadsheet",
    "handle_list_spreadsheets",
    "handle_get_spreadsheet_info",
    "handle_set_cell",
    "handle_get_cell",
    "handle_set_cell_expression",
    "handle_get_cell_expression",
    "handle_clear_cell",
    "handle_clear_range",
    "handle_set_alias",
    "handle_get_alias",
    "handle_remove_alias",
    "handle_list_aliases",
    "handle_generate_bom",
    "handle_get_object_bom_data",
    "handle_export_bom_to_spreadsheet",
    "handle_create_parametric_table",
    "handle_update_parametric_table",
    "handle_lookup_value",
    "handle_set_column_width",
    "handle_set_row_height",
    "handle_set_cell_background",
]
