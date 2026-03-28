# SPDX-License-Identifier: LGPL-2.1-or-later
# Python bridge module for the LLM dock widget.
# Provides a simple API for the C++ dock widget to communicate with the sidecar.

import threading
from typing import Optional, Callable, List

import FreeCAD as App

from .sidecar_client import SidecarClient, SidecarClientSync

# Global instance of the sidecar client
_sidecar_client: Optional[SidecarClientSync] = None
_response_callbacks: List[Callable[[str], None]] = []
_connection_callbacks: List[Callable[[bool, str], None]] = []
_initialized = False


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
    if _response_callbacks:
        for callback in _response_callbacks:
            try:
                callback(response)
            except Exception as e:
                App.Console.PrintError(f"LLMPanelBridge: Response callback error - {e}\n")


def _on_connection_change(connected: bool, status_message: str):
    """Internal callback for handling connection status changes."""
    if _connection_callbacks:
        for callback in _connection_callbacks:
            try:
                callback(connected, status_message)
            except Exception as e:
                App.Console.PrintError(f"LLMPanelBridge: Connection callback error - {e}\n")


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
                    App.Console.PrintMessage("LLMPanelBridge: Could not connect to sidecar (not running?)\n")
            except Exception as e:
                App.Console.PrintError(f"LLMPanelBridge: Background connection failed - {e}\n")
    
    thread = threading.Thread(target=connect_thread, daemon=True, name="LLMBridge-Connect")
    thread.start()


# Auto-initialize on import
try:
    initialize()
except Exception as e:
    App.Console.PrintError(f"LLMPanelBridge: Auto-initialization failed - {e}\n")
