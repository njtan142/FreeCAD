# SPDX-License-Identifier: LGPL-2.1-or-later
# WebSocket client for connecting to the Node.js sidecar.
# This is a stub implementation - actual connection logic will be
# implemented when the Node.js sidecar is built.

import asyncio
import json
import threading
import uuid
from typing import Optional, Callable, List, Dict, Any

import FreeCAD as App

# Default port for the dock widget WebSocket server (sidecar)
DEFAULT_SIDECAR_PORT = 8765
DEFAULT_SIDECAR_HOST = "127.0.0.1"


class SidecarClient:
    """
    Async WebSocket client that connects to the Node.js sidecar.
    
    This client handles:
    - Connecting to the sidecar WebSocket server
    - Sending user messages with conversation history
    - Receiving LLM responses
    - Managing connection state
    """

    def __init__(self, host: str = DEFAULT_SIDECAR_HOST, port: int = DEFAULT_SIDECAR_PORT):
        self.host = host
        self.port = port
        self._websocket = None
        self._connected = False
        self._conversation_id = str(uuid.uuid4())
        self._history: List[Dict[str, str]] = []
        self._response_callback: Optional[Callable] = None
        self._connection_callback: Optional[Callable] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    @property
    def is_connected(self) -> bool:
        """Check if connected to the sidecar."""
        return self._connected and self._websocket is not None

    @property
    def conversation_id(self) -> str:
        """Get the current conversation ID."""
        return self._conversation_id

    def set_response_callback(self, callback: Callable[[str], None]):
        """Set callback for receiving LLM responses."""
        self._response_callback = callback

    def set_connection_callback(self, callback: Callable[[bool, str], None]):
        """Set callback for connection status changes."""
        self._connection_callback = callback

    async def connect(self) -> bool:
        """
        Connect to the Node.js sidecar.
        
        Returns:
            True if connection successful, False otherwise.
        """
        try:
            import websockets
        except ImportError:
            App.Console.PrintError(
                "SidecarClient: 'websockets' library not installed. "
                "Install with: pip install websockets\n"
            )
            self._notify_connection(False, "websockets library not installed")
            return False

        try:
            uri = f"ws://{self.host}:{self.port}"
            self._websocket = await websockets.connect(uri)
            self._connected = True
            
            # Start listening for messages
            self._loop = asyncio.get_running_loop()
            asyncio.create_task(self._listen_for_messages())
            
            App.Console.PrintMessage(f"SidecarClient: Connected to sidecar at {uri}\n")
            self._notify_connection(True, f"Connected to sidecar at {uri}")
            return True
        except Exception as e:
            App.Console.PrintError(f"SidecarClient: Connection failed - {e}\n")
            self._notify_connection(False, f"Connection failed: {e}")
            return False

    async def disconnect(self):
        """Disconnect from the sidecar."""
        if self._websocket:
            try:
                await self._websocket.close()
            except Exception:
                pass
            finally:
                self._websocket = None
        
        self._connected = False
        App.Console.PrintMessage("SidecarClient: Disconnected from sidecar\n")
        self._notify_connection(False, "Disconnected from sidecar")

    async def send_message(self, message: str) -> bool:
        """
        Send a user message to the sidecar.
        
        Args:
            message: The user's message text.
            
        Returns:
            True if message sent successfully, False otherwise.
        """
        if not self.is_connected:
            App.Console.PrintWarning("SidecarClient: Not connected to sidecar\n")
            return False

        # Add user message to history
        self._history.append({"role": "user", "content": message})

        # Build request payload
        request = {
            "type": "chat",
            "message": message,
            "conversation_id": self._conversation_id,
            "history": self._history.copy()
        }

        try:
            await self._websocket.send(json.dumps(request))
            return True
        except Exception as e:
            App.Console.PrintError(f"SidecarClient: Send failed - {e}\n")
            return False

    async def _listen_for_messages(self):
        """Listen for incoming messages from the sidecar."""
        try:
            async for raw_message in self._websocket:
                await self._process_response(raw_message)
        except websockets.exceptions.ConnectionClosed:
            App.Console.PrintMessage("SidecarClient: Connection closed by server\n")
            self._connected = False
            self._notify_connection(False, "Connection closed by server")
        except Exception as e:
            App.Console.PrintError(f"SidecarClient: Listen error - {e}\n")
            self._connected = False
            self._notify_connection(False, f"Listen error: {e}")

    async def _process_response(self, raw_message: str):
        """Process a response message from the sidecar."""
        try:
            response = json.loads(raw_message)
            
            msg_type = response.get("type", "response")
            content = response.get("content", "")
            success = response.get("success", True)
            
            # Add assistant response to history
            if msg_type == "response":
                self._history.append({"role": "assistant", "content": content})
            
            # Notify callback
            if self._response_callback:
                # Run callback in the event loop
                self._loop.call_soon_threadsafe(
                    self._response_callback,
                    content if success else f"Error: {content}"
                )
                
        except json.JSONDecodeError as e:
            App.Console.PrintError(f"SidecarClient: Invalid JSON response - {e}\n")
        except Exception as e:
            App.Console.PrintError(f"SidecarClient: Response processing error - {e}\n")

    def _notify_connection(self, connected: bool, status_message: str):
        """Notify connection status change."""
        if self._connection_callback:
            try:
                self._loop.call_soon_threadsafe(
                    self._connection_callback,
                    connected,
                    status_message
                )
            except Exception:
                pass

    def clear_history(self):
        """Clear conversation history."""
        self._history.clear()
        self._conversation_id = str(uuid.uuid4())


# Synchronous wrapper for use in C++ called code
class SidecarClientSync:
    """
    Synchronous wrapper around SidecarClient for easier integration.
    """

    def __init__(self, host: str = DEFAULT_SIDECAR_HOST, port: int = DEFAULT_SIDECAR_PORT):
        self._client = SidecarClient(host, port)
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None

    @property
    def is_connected(self) -> bool:
        return self._client.is_connected

    def connect(self) -> bool:
        """Attempt to connect to the sidecar (blocking)."""
        try:
            import threading
            import asyncio
            
            # Create a new event loop for the connection
            self._loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._loop)
            
            # Run connection in the loop
            future = asyncio.run_coroutine_threadsafe(
                self._client.connect(),
                self._loop
            )
            return future.result(timeout=5.0)
        except Exception as e:
            App.Console.PrintError(f"SidecarClientSync: Connection failed - {e}\n")
            return False

    def disconnect(self):
        """Disconnect from the sidecar."""
        if self._loop and self._loop.is_running():
            future = asyncio.run_coroutine_threadsafe(
                self._client.disconnect(),
                self._loop
            )
            try:
                future.result(timeout=5.0)
            except Exception as e:
                App.Console.PrintError(f"SidecarClientSync: Disconnect failed - {e}\n")

    def send_message(self, message: str) -> bool:
        """Send a message to the sidecar (blocking)."""
        if not self._loop or not self._loop.is_running():
            return False
            
        future = asyncio.run_coroutine_threadsafe(
            self._client.send_message(message),
            self._loop
        )
        try:
            return future.result(timeout=10.0)
        except Exception as e:
            App.Console.PrintError(f"SidecarClientSync: Send failed - {e}\n")
            return False

    def set_response_callback(self, callback: Callable[[str], None]):
        self._client.set_response_callback(callback)

    def set_connection_callback(self, callback: Callable[[bool, str], None]):
        self._client.set_connection_callback(callback)
