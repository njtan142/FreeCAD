# SPDX-License-Identifier: LGPL-2.1-or-later
# Utility for dispatching callables to FreeCAD's main (GUI) thread.

import threading
from concurrent.futures import Future

from PySide.QtCore import QTimer


def run_on_main_thread(func):
    """
    Dispatch a callable to the main (GUI) thread and return a Future
    that resolves when execution completes.

    This uses QTimer.singleShot(0, callback) to marshal the call onto
    the main thread's event loop, which is the standard Qt pattern for
    cross-thread dispatch.

    Args:
        func: A callable taking no arguments.

    Returns:
        A concurrent.futures.Future whose result will be the return
        value of func, or whose exception will be set if func raises.
    """
    future = Future()

    def _execute():
        try:
            result = func()
            future.set_result(result)
        except Exception as e:
            future.set_exception(e)

    # QTimer.singleShot(0, ...) schedules _execute on the main thread's
    # event loop at the next opportunity.
    QTimer.singleShot(0, _execute)

    return future
