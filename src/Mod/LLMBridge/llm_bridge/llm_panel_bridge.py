# SPDX-License-Identifier: LGPL-2.1-or-later
# Python bridge module for the LLM dock widget.
# Provides a simple API for the C++ dock widget to communicate with the sidecar.

import threading
from typing import Optional, Callable, List, Any

import FreeCAD as App

from .sidecar_client import SidecarClient, SidecarClientSync

# Global instance of the sidecar client
_sidecar_client: Optional[SidecarClientSync] = None
_response_callbacks: List[Callable[[str], None]] = []
_connection_callbacks: List[Callable[[bool, str], None]] = []
_initialized = False

# Global reference to the LLMDockWidget wrapper (set during setupPythonBridge)
_llm_dock_widget: Optional[Any] = None


def initialize() -> bool:
    """
    Initialize the panel bridge and attempt to connect to the sidecar.

    Returns:
        True if initialization successful, False otherwise.
    """
    global _sidecar_client, _initialized

    if _initialized:
        return True

    try:
        _sidecar_client = SidecarClientSync()

        # Set up callbacks
        _sidecar_client.set_response_callback(_on_response)
        _sidecar_client.set_connection_callback(_on_connection_change)

        # Attempt to connect (non-blocking - just try)
        # The actual connection will be attempted in the background
        _try_connect_background()

        _initialized = True
        App.Console.PrintMessage("LLMPanelBridge: Initialized\n")
        return True

    except Exception as e:
        App.Console.PrintError(f"LLMPanelBridge: Initialization failed - {e}\n")
        return False


def shutdown():
    """Shutdown the panel bridge and disconnect from the sidecar."""
    global _sidecar_client, _initialized

    if _sidecar_client:
        try:
            _sidecar_client.disconnect()
        except Exception:
            pass
        _sidecar_client = None

    _response_callbacks = []
    _connection_callbacks = []
    _initialized = False
    App.Console.PrintMessage("LLMPanelBridge: Shutdown\n")


def send_message(text: str) -> bool:
    """
    Send a message to the sidecar.

    Args:
        text: The message text to send.

    Returns:
        True if message was sent successfully, False otherwise.
    """
    global _sidecar_client

    if not _initialized or _sidecar_client is None:
        App.Console.PrintWarning("LLMPanelBridge: Not initialized\n")
        return False

    if not _sidecar_client.is_connected:
        App.Console.PrintWarning("LLMPanelBridge: Not connected to sidecar\n")
        return False

    return _sidecar_client.send_message(text)


def register_callback(callback: Callable[[str], None]):
    """
    Register a callback for receiving LLM responses.

    Args:
        callback: Function to call with response text.
    """
    global _response_callbacks

    if callback not in _response_callbacks:
        _response_callbacks.append(callback)


def register_dock_widget(dock_widget_wrapper: Any):
    """
    Register the LLMDockWidget wrapper for direct callback access.

    Args:
        dock_widget_wrapper: Python wrapper object for the dock widget.
    """
    global _llm_dock_widget
    _llm_dock_widget = dock_widget_wrapper
    App.Console.PrintMessage(
        f"LLMPanelBridge: Registered dock widget: {dock_widget_wrapper}\n"
    )


def unregister_callback(callback: Callable[[str], None]):
    """
    Unregister a response callback.

    Args:
        callback: The callback to remove.
    """
    global _response_callbacks

    if _response_callbacks and callback in _response_callbacks:
        _response_callbacks.remove(callback)


def register_connection_callback(callback: Callable[[bool, str], None]):
    """
    Register a callback for connection status changes.

    Args:
        callback: Function to call with (connected, status_message).
    """
    global _connection_callbacks

    if callback not in _connection_callbacks:
        _connection_callbacks.append(callback)


def unregister_connection_callback(callback: Callable[[bool, str], None]):
    """
    Unregister a connection status callback.

    Args:
        callback: The callback to remove.
    """
    global _connection_callbacks

    if _connection_callbacks and callback in _connection_callbacks:
        _connection_callbacks.remove(callback)


def is_connected() -> bool:
    """Check if connected to the sidecar."""
    global _sidecar_client

    if _sidecar_client is None:
        return False

    return _sidecar_client.is_connected


def is_initialized() -> bool:
    """Check if the bridge is initialized."""
    return _initialized


def _on_response(response: str):
    """Internal callback for handling responses from the sidecar."""
    App.Console.PrintMessage(
        f"LLMPanelBridge: _on_response called with FULL response:\n{response}\n---END---\n"
    )
    try:
        import json

        parsed = json.loads(response)
        App.Console.PrintMessage(
            f"LLMPanelBridge: parsed message type={parsed.get('type', 'N/A')} is_error={parsed.get('is_error', 'N/A')}\n"
        )
    except:
        App.Console.PrintMessage("LLMPanelBridge: response is not JSON\n")

    if _response_callbacks:
        for callback in _response_callbacks:
            try:
                callback(response)
            except Exception as e:
                App.Console.PrintError(
                    f"LLMPanelBridge: Response callback error - {e}\n"
                )

    # Call the C++ response_callback if registered with FreeCADGui
    App.Console.PrintMessage("LLMPanelBridge: About to call C++ callback section\n")
    try:
        import FreeCADGui

        App.Console.PrintMessage(f"LLMPanelBridge: FreeCADGui module: {FreeCADGui}\n")

        if hasattr(FreeCADGui, "response_callback"):
            App.Console.PrintMessage(
                "LLMPanelBridge: FreeCADGui.response_callback exists, type: "
                f"{type(FreeCADGui.response_callback)}\n"
            )
            App.Console.PrintMessage(
                "LLMPanelBridge: Calling FreeCADGui.response_callback\n"
            )
            FreeCADGui.response_callback(response)
            App.Console.PrintMessage(
                "LLMPanelBridge: FreeCADGui.response_callback completed\n"
            )
        else:
            App.Console.PrintMessage(
                "LLMPanelBridge: FreeCADGui.response_callback not found\n"
            )
            # List all attributes of FreeCADGui to help debug
            attrs = [a for a in dir(FreeCADGui) if not a.startswith("_")]
            App.Console.PrintMessage(
                f"LLMPanelBridge: FreeCADGui attributes (first 20): {attrs[:20]}\n"
            )
    except Exception as e:
        import traceback

        App.Console.PrintError(f"LLMPanelBridge: C++ callback error - {e}\n")
        App.Console.PrintError(f"LLMPanelBridge: Traceback: {traceback.format_exc()}\n")


def _on_connection_change(connected: bool, status_message: str):
    """Internal callback for handling connection status changes."""
    if _connection_callbacks:
        for callback in _connection_callbacks:
            try:
                callback(connected, status_message)
            except Exception as e:
                App.Console.PrintError(
                    f"LLMPanelBridge: Connection callback error - {e}\n"
                )


def _try_connect_background():
    """Attempt to connect to the sidecar in a background thread."""

    def connect_thread():
        global _sidecar_client

        if _sidecar_client:
            try:
                # Try to connect with a timeout
                connected = _sidecar_client.connect()
                if connected:
                    App.Console.PrintMessage("LLMPanelBridge: Connected to sidecar\n")
                else:
                    App.Console.PrintMessage(
                        "LLMPanelBridge: Could not connect to sidecar (not running?)\n"
                    )
            except Exception as e:
                App.Console.PrintError(
                    f"LLMPanelBridge: Background connection failed - {e}\n"
                )

    thread = threading.Thread(
        target=connect_thread, daemon=True, name="LLMBridge-Connect"
    )
    thread.start()


# Auto-initialize on import
try:
    initialize()
except Exception as e:
    App.Console.PrintError(f"LLMPanelBridge: Auto-initialization failed - {e}\n")
