# SPDX-License-Identifier: LGPL-2.1-or-later

SET(LLMBridge_SRCS
    Init.py
    InitGui.py
)

SET(LLMBridge_Package_SRCS
    llm_bridge/__init__.py
    llm_bridge/server.py
    llm_bridge/executor.py
    llm_bridge/main_thread.py
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
