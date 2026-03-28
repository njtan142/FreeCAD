# SPDX-License-Identifier: LGPL-2.1-or-later
# LLMBridge module - GUI initialization
# Auto-starts the WebSocket bridge server when FreeCAD GUI loads.

import atexit

import FreeCAD as App
import FreeCADGui as Gui


def start_llm_bridge():
    """Start the LLM WebSocket bridge server."""
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


# Start the bridge server
start_llm_bridge()
atexit.register(stop_llm_bridge)
