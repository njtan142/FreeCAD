# SPDX-License-Identifier: LGPL-2.1-or-later

SET(LLMBridge_SRCS
    Init.py
    InitGui.py
)

SET(LLMBridge_Package_SRCS
    llm_bridge/__init__.py
    llm_bridge/executor.py
    llm_bridge/main_thread.py
    llm_bridge/server.py
    llm_bridge/sidecar_client.py
    llm_bridge/llm_panel_bridge.py
    llm_bridge/query_handlers.py
    llm_bridge/file_handlers.py
    llm_bridge/property_handlers.py
    llm_bridge/sketcher_handlers.py
    llm_bridge/feature_handlers.py
    llm_bridge/boolean_handlers.py
    llm_bridge/assembly_handlers.py
    llm_bridge/draft_handlers.py
    llm_bridge/pattern_handlers.py
    llm_bridge/techdraw_handlers.py
    llm_bridge/surface_handlers.py
    llm_bridge/kinematic_handlers.py
)

SET(LLMBridge_All_SRCS
    ${LLMBridge_SRCS}
    ${LLMBridge_Package_SRCS}
)

SOURCE_GROUP("" FILES ${LLMBridge_SRCS})

ADD_CUSTOM_TARGET(LLMBridge ALL
    SOURCES ${LLMBridge_All_SRCS}
)

fc_copy_sources(LLMBridge "${CMAKE_BINARY_DIR}/Mod/LLMBridge" ${LLMBridge_All_SRCS})

INSTALL(
    FILES
        ${LLMBridge_SRCS}
    DESTINATION Mod/LLMBridge
)
INSTALL(
    FILES
        ${LLMBridge_Package_SRCS}
    DESTINATION Mod/LLMBridge/llm_bridge
)
