## Review: File Operations Tools

### Verdict: NEEDS_FIXES

### Summary:
The implementation matches the plan well with all 5 file operation tools implemented. However, there are security concerns with string interpolation in Python code generation and a potential issue with mesh cleanup in export operations.

### Issues:

1. **[sidecar/src/agent-tools.ts:668-670, 731, 795, 914]** - **Security: String interpolation for Python code generation**: File paths and parameters are interpolated directly into Python code strings using template literals. While `validateFilePath` checks for some dangerous characters, this approach is vulnerable to injection attacks. For example, a path like `C:/files"; import os; os.system("malicious")#" could potentially execute arbitrary code.

2. **[src/Mod/LLMBridge/llm_bridge/file_handlers.py:224-227, 239-242]** - **Bug: Mesh object cleanup may fail**: In `handle_export_to_format`, when exporting to STL/OBJ, a temporary mesh object is created and removed. However, if `Mesh.export()` throws an exception, the `doc.removeObject(mesh.Name)` line is never reached, leaving orphan objects in the document. Should use try-finally.

3. **[src/Mod/LLMBridge/llm_bridge/file_handlers.py:203]** - **Edge case: Extension comparison is case-sensitive**: The code compares `current_ext` (lowercase) against `expected_ext` (mixed case like `.step`, `.stl`), which will always mismatch. This causes files to get double extensions like `part.stl.stl`.

4. **[sidecar/src/file-utils.ts:93]** - **Path validation too restrictive**: The check for `..` blocks legitimate paths like `C:/../folder/file.FCStd` (though unusual) but also blocks Windows UNC paths or paths with `..` that resolve safely. Should use `path.normalize()` and check if result escapes intended directory.

5. **[src/Mod/LLMBridge/llm_bridge/file_handlers.py:31-38]** - **Missing validation**: `handle_save_document` accepts format parameter but only validates against FCStd/FCBak. The plan mentioned support for exporting to other formats via save, which might confuse users expecting STEP/STL export via `save_document` instead of `export_to_format`.

### Suggested Fixes:

1. **Fix string interpolation**: Use parameterized approach instead of string interpolation. Pass parameters through WebSocket as JSON payload rather than embedding in code string. Example:
   ```typescript
   const code = `
   from llm_bridge.file_handlers import handle_save_document
   import json
   params = json.loads('${JSON.stringify({ filePath, format })}')
   result = handle_save_document(file_path=params.filePath, format=params.format)
   print(json.dumps(result))
   `.trim();
   ```

2. **Add try-finally for mesh cleanup**:
   ```python
   mesh = None
   try:
       mesh = App.activeDocument().addObject("Mesh::Feature", "ExportMesh")
       mesh.Mesh = Part.makeMeshFromBrepShapes(shapes)
       Mesh.export([mesh], export_path)
   finally:
       if mesh:
           doc.removeObject(mesh.Name)
   ```

3. **Fix extension comparison**: Normalize both extensions to same case:
   ```python
   if current_ext.lower() != expected_ext.lower():
   ```

4. **Improve path validation**: Replace simple `..` check with:
   ```typescript
   const normalized = path.normalize(filePath);
   if (normalized.includes('..')) {
     return { isValid: false, error: 'Path resolves outside allowed directory' };
   }
   ```

5. **Clarify tool separation**: Update tool descriptions to clearly distinguish `save_document` (native formats only) from `export_to_format` (all CAD formats).

## Re-review After Fixes

### Verdict: PASS

### Verification:
- [x] Issue 1 fixed: String interpolation replaced with JSON parameterized approach in `save_document`, `open_document`, `export_to_format`, and `create_new_document` tools. Parameters are now passed via `json.loads()` with `JSON.stringify()`, preventing code injection attacks.
- [x] Issue 2 fixed: Mesh cleanup in `handle_export_to_format` now uses try-finally blocks for both STL and OBJ export paths. The `mesh` variable is initialized to `None` and properly cleaned up in the finally block even if `Mesh.export()` throws an exception.
- [x] Issue 3 fixed: Extension comparison now uses `.lower()` on both sides (`current_ext.lower() != expected_ext.lower()`), ensuring case-insensitive comparison and preventing double extensions.
- [x] Issue 4 fixed: Path validation now uses `path.normalize()` before checking for `..`, properly handling edge cases where `..` appears in legitimate paths that don't actually escape the intended directory.
- [x] Issue 5 fixed: Tool descriptions updated with clear NOTES distinguishing `save_document` (native FreeCAD formats only: FCStd, FCBak) from `export_to_format` (exchange formats: STEP, IGES, STL, OBJ, DXF). Both tools now explicitly reference each other for clarity.

### New Issues (if any):
- None. All fixes are correct and complete.
