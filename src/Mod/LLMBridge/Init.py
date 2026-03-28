# SPDX-License-Identifier: LGPL-2.1-or-later
# LLMBridge module - Non-GUI initialization

import FreeCAD as App

ParGrp = App.ParamGet("System parameter:Modules").GetGroup("LLMBridge")
ParGrp.SetString("WorkBenchName", "LLMBridge")
ParGrp.SetString("WorkBenchModule", "LLMBridge.py")
