## Status: PLANNED (Cycle 24)

# Cycle 24: Spreadsheet Workbench Tools (BOM & Parametric Tables)

## Overview

Add tools for FreeCAD's Spreadsheet workbench, enabling LLM-powered CAD operations to:
- Create and manage spreadsheets within CAD documents
- Perform cell-level operations (read/write, expressions, formatting)
- Generate Bills of Materials (BOM) from CAD model data
- Create parametric lookup tables linked to model properties

These tools form a coherent unit focused on **manufacturing/engineering workflow fundamentals** that connect CAD models to downstream processes (planning, costing, ordering).

## Prerequisites

- `src/Mod/LLMBridge/llm_bridge/__init__.py` - Existing module structure
- `sidecar/src/agent-tools.ts` - Existing tool definitions
- `sidecar/src/result-formatters.ts` - Existing result formatters
- FreeCAD Spreadsheet module (`Spreadsheet::Sheet` type)

## Tasks

### 1. Create spreadsheet_handlers.py (Python)

**File**: `src/Mod/LLMBridge/llm_bridge/spreadsheet_handlers.py` (create new)

Handlers for spreadsheet operations:

#### Spreadsheet Lifecycle
- `handle_create_spreadsheet(name)` — Create a new spreadsheet in the document
- `handle_delete_spreadsheet(name)` — Delete a spreadsheet
- `handle_rename_spreadsheet(old_name, new_name)` — Rename a spreadsheet
- `handle_list_spreadsheets()` — List all spreadsheets in the document
- `handle_get_spreadsheet_info(name)` — Get spreadsheet metadata (rows, columns, used range)

#### Cell Operations
- `handle_set_cell(spreadsheet_name, address, value)` — Set cell value (string, number, or expression)
- `handle_get_cell(spreadsheet_name, address)` — Get cell value at address
- `handle_set_cell_expression(spreadsheet_name, address, expression)` — Set cell formula/expression
- `handle_get_cell_expression(spreadsheet_name, address)` — Get cell formula
- `handle_clear_cell(spreadsheet_name, address)` — Clear a cell
- `handle_clear_range(spreadsheet_name, start_address, end_address)` — Clear a range of cells

#### Alias Operations
- `handle_set_alias(spreadsheet_name, address, alias_name)` — Set cell alias for parametric access
- `handle_get_alias(spreadsheet_name, alias_name)` — Get cell value by alias
- `handle_remove_alias(spreadsheet_name, alias_name)` — Remove a cell alias
- `handle_list_aliases(spreadsheet_name)` — List all aliases in a spreadsheet

#### BOM Generation
- `handle_generate_bom(options)` — Generate Bill of Materials from document objects
  - Options: include_hidden, group_by_type, include_properties, output_format
- `handle_get_object_bom_data(object_names, properties)` — Extract structured data from objects for BOM
- `handle_export_bom_to_spreadsheet(bom_data, spreadsheet_name, start_address)` — Write BOM data to spreadsheet

#### Parametric Tables
- `handle_create_parametric_table(spreadsheet_name, headers, data)` — Create a parametric lookup table
- `handle_update_parametric_table(spreadsheet_name, row_key, updates)` — Update a row in a parametric table
- `handle_lookup_value(spreadsheet_name, column_key, lookup_value)` — Lookup value in table by key

#### Spreadsheet Formatting (Basic)
- `handle_set_column_width(spreadsheet_name, column, width)` — Set column width
- `handle_set_row_height(spreadsheet_name, row, height)` — Set row height
- `handle_set_cell_background(spreadsheet_name, address, color)` — Set cell background color

**Acceptance Criteria**:
- [ ] All handlers return JSON with success/error structure
- [ ] Cell addresses support both A1 and $A$1 notation
- [ ] Expressions are properly prefixed with = when needed
- [ ] BOM generation works with Part, PartDesign, and Draft objects

### 2. Add Tool Definitions to agent-tools.ts

**File**: `sidecar/src/agent-tools.ts` (modify)

Add spreadsheet tools after existing tools in `createAgentTools()`:

```typescript
// Spreadsheet lifecycle tools
createSpreadsheetTool(freeCADBridge),
deleteSpreadsheetTool(freeCADBridge),
renameSpreadsheetTool(freeCADBridge),
listSpreadsheetsTool(freeCADBridge),
getSpreadsheetInfoTool(freeCADBridge),

// Cell operation tools
setCellTool(freeCADBridge),
getCellTool(freeCADBridge),
setCellExpressionTool(freeCADBridge),
getCellExpressionTool(freeCADBridge),
clearCellTool(freeCADBridge),
clearRangeTool(freeCADBridge),

// Alias tools
setAliasTool(freeCADBridge),
getAliasTool(freeCADBridge),
removeAliasTool(freeCADBridge),
listAliasesTool(freeCADBridge),

// BOM tools
generateBomTool(freeCADBridge),
getObjectBomDataTool(freeCADBridge),
exportBomToSpreadsheetTool(freeCADBridge),

// Parametric table tools
createParametricTableTool(freeCADBridge),
updateParametricTableTool(freeCADBridge),
lookupValueTool(freeCADBridge),

// Formatting tools
setColumnWidthTool(freeCADBridge),
setRowHeightTool(freeCADBridge),
setCellBackgroundTool(freeCADBridge),
```

### 3. Add Result Formatters

**File**: `sidecar/src/result-formatters.ts` (modify)

Add formatters:
```typescript
formatSpreadsheetCreate(data)
formatSpreadsheetDelete(data)
formatSpreadsheetInfo(data)
formatCellValue(data)
formatCellExpression(data)
formatAliasList(data)
formatBomGeneration(data)
formatBomData(data)
formatParametricTable(data)
formatTableLookup(data)
formatColumnWidth(data)
formatRowHeight(data)
formatCellBackground(data)
```

### 4. Update __init__.py Exports

**File**: `src/Mod/LLMBridge/llm_bridge/__init__.py` (modify)

Add exports for new handlers to `__all__`:
```python
# From spreadsheet_handlers.py
'handle_create_spreadsheet',
'handle_delete_spreadsheet',
'handle_rename_spreadsheet',
'handle_list_spreadsheets',
'handle_get_spreadsheet_info',
'handle_set_cell',
'handle_get_cell',
'handle_set_cell_expression',
'handle_get_cell_expression',
'handle_clear_cell',
'handle_clear_range',
'handle_set_alias',
'handle_get_alias',
'handle_remove_alias',
'handle_list_aliases',
'handle_generate_bom',
'handle_get_object_bom_data',
'handle_export_bom_to_spreadsheet',
'handle_create_parametric_table',
'handle_update_parametric_table',
'handle_lookup_value',
'handle_set_column_width',
'handle_set_row_height',
'handle_set_cell_background',
```

## Files to Create/Modify

### New Files:
1. `src/Mod/LLMBridge/llm_bridge/spreadsheet_handlers.py` - Spreadsheet operation handlers (~500 lines)

### Modified Files:
1. `src/Mod/LLMBridge/llm_bridge/__init__.py` - Add exports for 23 new handlers
2. `sidecar/src/agent-tools.ts` - Add 23 new tools
3. `sidecar/src/result-formatters.ts` - Add 12 new formatters

## Test Scenarios

1. **Spreadsheet Lifecycle**:
   - Create a spreadsheet, verify it appears in document
   - Rename spreadsheet, verify name change
   - Delete spreadsheet, verify removal

2. **Cell Operations**:
   - Set cell value, get cell value, verify round-trip
   - Set cell expression (=A1+B1), verify formula stored
   - Clear cell, verify empty

3. **Alias Operations**:
   - Set alias on cell, use alias in PartDesign feature dimension
   - Get value by alias, verify correct
   - Remove alias, verify unlink

4. **BOM Generation**:
   - Create 3 boxes with different dimensions, generate BOM
   - Verify BOM includes name, type, dimensions, volume
   - Export BOM to spreadsheet, verify data layout

5. **Parametric Tables**:
   - Create lookup table with material properties
   - Lookup value by material name
   - Update table row, verify change

6. **Integration with other tools**:
   - Create spreadsheet, set cell with expression referencing Part object
   - Change Part dimension, verify spreadsheet updates on recompute

## Acceptance Criteria

- [ ] spreadsheet_handlers.py created with 23 handlers
- [ ] All handlers properly export from __init__.py
- [ ] 23 new tools added to agent-tools.ts with Zod schema validation
- [ ] 12 new result formatters added
- [ ] All tools integrated in createAgentTools()
- [ ] End-to-end test scenarios pass

## Definition of Done

- [ ] spreadsheet_handlers.py created with 23 handlers
- [ ] All handlers exported in __init__.py
- [ ] 23 new tools added to agent-tools.ts
- [ ] 12 new result formatters added
- [ ] All tools integrated in createAgentTools()
- [ ] End-to-end test scenarios pass
- [ ] Plan marked COMPLETED and moved to PROJECT.md progress

## Next Step After This

After spreadsheet tools are complete, potential next cycles:
- BIM workbench tools (architecture-specific operations)
- Advanced error handling and recovery tools
- Gemini CLI integration (alternative backend)
