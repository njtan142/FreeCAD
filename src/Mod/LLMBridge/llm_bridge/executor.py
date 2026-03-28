# SPDX-License-Identifier: LGPL-2.1-or-later
# Python code executor for the LLM Bridge.
# Safely runs code in FreeCAD's interpreter context with output capture.

import io
import sys
import traceback


# Shared namespace for executed code, pre-populated with common FreeCAD modules.
_exec_namespace = {}


def _ensure_namespace():
    """Lazily populate the execution namespace with FreeCAD modules."""
    if _exec_namespace:
        return
    try:
        import FreeCAD

        _exec_namespace["FreeCAD"] = FreeCAD
        _exec_namespace["App"] = FreeCAD
    except ImportError:
        pass
    try:
        import FreeCADGui

        _exec_namespace["FreeCADGui"] = FreeCADGui
        _exec_namespace["Gui"] = FreeCADGui
    except ImportError:
        pass
    try:
        import Part

        _exec_namespace["Part"] = Part
    except ImportError:
        pass
    try:
        import Draft

        _exec_namespace["Draft"] = Draft
    except ImportError:
        pass
    try:
        import Sketcher

        _exec_namespace["Sketcher"] = Sketcher
    except ImportError:
        pass


def execute_code(code):
    """
    Execute Python code in FreeCAD's interpreter context.

    Captures stdout and stderr during execution. Returns a dict with:
        - success (bool)
        - result (str): repr of the last expression value, or None
        - stdout (str): captured stdout
        - stderr (str): captured stderr
        - error (str): error message if success is False
        - traceback (str): full traceback if success is False

    Args:
        code: Python source code string to execute.

    Returns:
        dict with execution results.
    """
    _ensure_namespace()

    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()

    old_stdout = sys.stdout
    old_stderr = sys.stderr

    try:
        sys.stdout = stdout_capture
        sys.stderr = stderr_capture

        # Try to detect if the last statement is an expression whose value
        # we should capture. We compile as 'exec' for the full code, but
        # also try 'eval' on the last line to get a return value.
        result_value = None
        try:
            # First try: compile and exec the entire block
            compiled = compile(code, "<llm_bridge>", "exec")
            exec(compiled, _exec_namespace)
        except SyntaxError:
            raise
        else:
            # Try to evaluate the last line as an expression for a result
            lines = code.strip().splitlines()
            if lines:
                last_line = lines[-1].strip()
                if last_line and not last_line.startswith(
                    ("import ", "from ", "del ", "class ", "def ", "if ",
                     "for ", "while ", "with ", "try ", "except ", "finally ",
                     "raise ", "return ", "yield ", "pass", "break",
                     "continue", "assert ", "#")
                ):
                    try:
                        result_value = eval(last_line, _exec_namespace)
                    except Exception:
                        pass

        return {
            "success": True,
            "result": repr(result_value) if result_value is not None else "None",
            "stdout": stdout_capture.getvalue(),
            "stderr": stderr_capture.getvalue(),
        }

    except Exception as e:
        tb = traceback.format_exc()
        return {
            "success": False,
            "error": str(e),
            "traceback": tb,
            "stdout": stdout_capture.getvalue(),
            "stderr": stderr_capture.getvalue(),
        }

    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr
