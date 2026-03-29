# SPDX-License-Identifier: LGPL-2.1-or-later
# Utility for dispatching callables to FreeCAD's main (GUI) thread.
#
# Uses a queue + QTimer polling pattern. The QTimer must be created on the
# main thread (call ``init_dispatcher()`` from InitGui.py) so that its
# timeout signal fires on the main thread's event loop.

from concurrent.futures import Future
from queue import Queue, Empty

try:
    from PySide.QtCore import QTimer, QObject
except ImportError:
    from PySide6.QtCore import QTimer, QObject

import FreeCAD as App

_pending_queue: Queue = Queue()
_dispatcher = None


class _MainThreadDispatcher(QObject):
    """QObject living on the main thread that drains the pending-work queue."""

    def __init__(self):
        super().__init__()
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._process_queue)
        self._timer.start(50)  # poll every 50 ms

    def _process_queue(self):
        # Drain all items that are ready right now
        while True:
            try:
                func, future = _pending_queue.get_nowait()
            except Empty:
                break
            try:
                result = func()
                future.set_result(result)
            except Exception as exc:
                future.set_exception(exc)


def init_dispatcher():
    """
    Create the dispatcher on the **current** thread (must be the main/GUI
    thread).  Safe to call more than once.
    """
    global _dispatcher
    if _dispatcher is not None:
        return
    _dispatcher = _MainThreadDispatcher()
    App.Console.PrintMessage("LLMBridge: Main-thread dispatcher initialized\n")


def run_on_main_thread(func):
    """
    Schedule *func* (no-arg callable) on the main thread and return a
    ``concurrent.futures.Future`` that resolves with the return value.

    The caller can block on ``future.result(timeout=...)`` from any thread.
    """
    future = Future()
    _pending_queue.put((func, future))
    return future
