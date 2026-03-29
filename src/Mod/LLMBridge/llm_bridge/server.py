# SPDX-License-Identifier: LGPL-2.1-or-later
# WebSocket server for the LLM Bridge.
# Runs an asyncio event loop in a background thread, accepts WebSocket
# connections, dispatches code execution to FreeCAD's main thread, and
# returns results.

import asyncio
import json
import threading

import FreeCAD as App

from .executor import execute_code
from .main_thread import run_on_main_thread
from . import query_handlers  # noqa: F401 - Import for availability via WebSocket
from . import file_handlers  # noqa: F401 - Import for availability via WebSocket
from . import property_handlers  # noqa: F401 - Import for availability via WebSocket
from . import feature_handlers  # noqa: F401 - Import for availability via WebSocket
from . import boolean_handlers  # noqa: F401 - Import for availability via WebSocket

# Default port for FreeCAD Python execution bridge
DEFAULT_PORT = 8766


class BridgeServer:
    """
    WebSocket server that accepts code execution requests and runs them
    in FreeCAD's main thread.
    """

    def __init__(self, host="127.0.0.1", port=None):
        self.host = host
        self.port = port or self._get_configured_port()
        self._loop = None
        self._server = None
        self._thread = None
        self._stop_event = threading.Event()

    def _get_configured_port(self):
        """Read port from FreeCAD preferences, default to DEFAULT_PORT."""
        try:
            grp = App.ParamGet(
                "User parameter:BaseApp/Preferences/Mod/LLMBridge"
            )
            return grp.GetInt("Port", DEFAULT_PORT)
        except Exception:
            return DEFAULT_PORT

    def start(self):
        """Start the WebSocket server in a background daemon thread."""
        try:
            import websockets  # noqa: F401
        except ImportError:
            raise ImportError(
                "The 'websockets' library is required. "
                "Install it with: pip install websockets"
            )

        self._thread = threading.Thread(
            target=self._run_loop, daemon=True, name="LLMBridge-WS"
        )
        self._thread.start()

    def stop(self):
        """Stop the WebSocket server and its event loop."""
        self._stop_event.set()
        if self._loop is not None and self._loop.is_running():
            self._loop.call_soon_threadsafe(self._loop.stop)
        if self._thread is not None:
            self._thread.join(timeout=5)

    def _run_loop(self):
        """Entry point for the background thread. Runs the asyncio loop."""
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)

        try:
            self._loop.run_until_complete(self._serve())
        except Exception as e:
            App.Console.PrintError(
                "LLMBridge: Server loop error - {}\n".format(e)
            )
        finally:
            self._loop.close()

    async def _serve(self):
        """Start the WebSocket server and run until stopped."""
        import websockets

        self._server = await websockets.serve(
            self._handle_connection, self.host, self.port
        )

        # Wait until stop is requested
        while not self._stop_event.is_set():
            await asyncio.sleep(0.5)

        self._server.close()
        await self._server.wait_closed()

    async def _handle_connection(self, websocket, path=None):
        """Handle a single WebSocket client connection."""
        App.Console.PrintMessage("LLMBridge: Client connected\n")
        try:
            async for raw_message in websocket:
                response = await self._process_message(raw_message)
                await websocket.send(json.dumps(response))
        except Exception as e:
            App.Console.PrintError(
                "LLMBridge: Connection error - {}\n".format(e)
            )
        finally:
            App.Console.PrintMessage("LLMBridge: Client disconnected\n")

    async def _process_message(self, raw_message):
        """Parse a JSON message and dispatch code execution."""
        try:
            message = json.loads(raw_message)
        except json.JSONDecodeError as e:
            return {
                "id": None,
                "success": False,
                "error": "Invalid JSON: {}".format(e),
                "stdout": "",
                "stderr": "",
            }

        msg_type = message.get("type")
        msg_id = message.get("id")
        code = message.get("code", "")

        if msg_type != "execute":
            return {
                "id": msg_id,
                "success": False,
                "error": "Unknown message type: {}".format(msg_type),
                "stdout": "",
                "stderr": "",
            }

        if not code:
            return {
                "id": msg_id,
                "success": False,
                "error": "No code provided",
                "stdout": "",
                "stderr": "",
            }

        # Dispatch code to the main GUI thread (required for Part ops
        # and document recompute) and wait from a thread-pool thread so
        # we don't block the asyncio event loop.
        try:
            loop = asyncio.get_running_loop()
            future = run_on_main_thread(lambda: execute_code(code))
            result = await loop.run_in_executor(
                None, lambda: future.result(timeout=300)
            )
            result["id"] = msg_id
            return result
        except Exception as e:
            return {
                "id": msg_id,
                "success": False,
                "error": "Execution error: {}".format(e),
                "stdout": "",
                "stderr": "",
            }
