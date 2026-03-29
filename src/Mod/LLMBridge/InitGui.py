# SPDX-License-Identifier: LGPL-2.1-or-later
# LLMBridge module - GUI initialization
# Auto-starts the WebSocket bridge server when FreeCAD GUI loads.

import atexit
import threading
import traceback

import FreeCAD as App
import FreeCADGui as Gui


def start_llm_bridge():
    """Start the LLM WebSocket bridge server in a background thread."""
    def _start_server():
        try:
            from llm_bridge.server import BridgeServer

            server = BridgeServer()
            server.start()

            # Store reference so it can be stopped on shutdown
            App.__llm_bridge_server = server

            App.Console.PrintMessage(
                "LLMBridge: WebSocket server started on localhost:{}\n".format(
                    server.port
                )
            )
        except ImportError as e:
            App.Console.PrintError(
                "LLMBridge: Failed to start - {}. "
                "Make sure the 'websockets' package is installed: "
                "pip install websockets\n".format(e)
            )
        except Exception as e:
            App.Console.PrintError("LLMBridge: Failed to start - {}\n".format(e))
            traceback.print_exc()

    # Run in background thread so it doesn't block the GUI
    import threading as _threading
    thread = _threading.Thread(target=_start_server, daemon=True, name="LLMBridge-Init")
    thread.start()


def stop_llm_bridge():
    """Stop the LLM WebSocket bridge server on shutdown."""
    server = getattr(App, "__llm_bridge_server", None)
    if server is not None:
        try:
            server.stop()
            App.Console.PrintMessage("LLMBridge: WebSocket server stopped\n")
        except Exception as e:
            App.Console.PrintError(
                "LLMBridge: Error stopping server - {}\n".format(e)
            )


def initialize_panel_bridge():
    """Initialize the LLM panel bridge for the dock widget."""
    try:
        # Import to trigger auto-initialization
        from llm_bridge import llm_panel_bridge  # noqa: F401

        App.Console.PrintMessage("LLMBridge: Panel bridge initialized\n")
    except ImportError as e:
        App.Console.PrintError(
            "LLMBridge: Panel bridge initialization failed - {}. "
            "The LLM dock widget may not function properly.\n".format(e)
        )
        traceback.print_exc()
    except Exception as e:
        App.Console.PrintError("LLMBridge: Panel bridge error - {}\n".format(e))
        traceback.print_exc()


# Main initialization with error handling
try:
    start_llm_bridge()
    atexit.register(stop_llm_bridge)

    App.Console.PrintMessage("LLMBridge: Module loaded\n")
except Exception as e:
    App.Console.PrintError(f"LLMBridge: Initialization error - {e}\n")
    traceback.print_exc()
