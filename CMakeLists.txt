# As of February 2025 we require CMake 3.22.0
cmake_minimum_required(VERSION 3.22.0 FATAL_ERROR)


# As of cMake 3.27, find_package() will look for both case-sensitive and all-uppercase versions
# of the package. This seems to affect FLANN as included by Pixi
if(POLICY CMP0144)
    cmake_policy(SET CMP0144 NEW)
endif()

# FindPythonInterp and FindPythonLibs modules are deprecated, but are still in use by
# all versions of Shiboken2. This policy must be kept at OLD until Shiboken2 is no longer
# supported
if(POLICY CMP0148)
    cmake_policy(SET CMP0148 OLD)
endif()

# The exec_program command was deprecated in cMake 3.0, and policy CMP0153 was added in cMake
# 3.28 to control whether this gives a warning (the OLD behavior) or a fatal error (NEW)
if(POLICY CMP0153)
    cmake_policy(SET CMP0153 NEW)
endif()

# Suppress 'FindBoost module is removed' warning. Will use BoostConfig.cmake instead
if(POLICY CMP0167)
    cmake_policy(SET CMP0167 NEW)
endif()

# As of cMake 3.31 add_custom_command() rejects invalid arguments
if(POLICY CMP0175)
    cmake_policy(SET CMP0175 NEW)
endif()

# Added in cMake 3.31, enforce normalization of all DESTINATION paths given to install()
if(POLICY CMP0177)
    cmake_policy(SET CMP0177 NEW)
endif()


option(FREECAD_USE_CCACHE "Auto detect and use ccache during compilation" ON)

if(FREECAD_USE_CCACHE)
    find_program(CCACHE_PROGRAM ccache)  #This check should occur before project()
    if(CCACHE_PROGRAM)
        message(STATUS "Using ccache found at: " ${CCACHE_PROGRAM})
        set(CMAKE_C_COMPILER_LAUNCHER "${CCACHE_PROGRAM}")
        set(CMAKE_CXX_COMPILER_LAUNCHER "${CCACHE_PROGRAM}")
    endif()
endif()

project(FreeCAD)

# Sanitizer support
option(FREECAD_USE_SANITIZER_ASAN "Enable AddressSanitizer ie. (ASan)" OFF) 
if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    option(FREECAD_USE_SANITIZER_LSAN "Enable LeakSanitizer (LSan)" OFF)
    option(FREECAD_USE_SANITIZER_TSAN "Enable ThreadSanitizer (TSan)" OFF)
    option(FREECAD_USE_SANITIZER_UBSAN "Enable UndefinedBehaviorSanitizer (UBSan)" OFF)
    option(FREECAD_USE_SANITIZER_MSAN "Enable MemorySanitizer (MSan)" OFF)
endif()

mark_as_advanced(
    FREECAD_USE_SANITIZER_ASAN
    FREECAD_USE_SANITIZER_LSAN
    FREECAD_USE_SANITIZER_TSAN
    FREECAD_USE_SANITIZER_UBSAN
    FREECAD_USE_SANITIZER_MSAN
)

set(PACKAGE_VERSION_MAJOR "1")
set(PACKAGE_VERSION_MINOR "2")
set(PACKAGE_VERSION_PATCH "0") # number of patch release (e.g. "4" for the 0.18.4 release)
set(PACKAGE_VERSION_SUFFIX "dev") # either "dev" for development snapshot or "" (empty string)
set(PACKAGE_BUILD_VERSION "0") # used when the same FreeCAD version will be re-released (for example using an updated LibPack)
string(TIMESTAMP PACKAGE_COPYRIGHT_YEAR "%Y")

set(PACKAGE_VERSION "${PACKAGE_VERSION_MAJOR}.${PACKAGE_VERSION_MINOR}.${PACKAGE_VERSION_PATCH}")
set(PACKAGE_STRING "${PROJECT_NAME} ${PACKAGE_VERSION}")

# include local modules
include(CheckCXXCompilerFlag)
include(AddFileDependencies)
include(cMake/FreeCadMacros.cmake)
# include helper functions/macros
add_subdirectory(cMake/FreeCAD_Helpers)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cMake")

CompilerChecksAndSetups()
ConfigureCMakeVariables()
InitializeFreeCADBuildOptions()
CheckInterModuleDependencies()
FreeCADLibpackChecks()
SetupDoxygen()
SetupLibFmt()
SetupSanitizers()
SetupYamlCpp()
SetupZipIos()
# Auto-detect conda environment path
if(NOT CONDA_ENV_PATH)
    if(DEFINED ENV{CONDA_PREFIX})
        set(CONDA_ENV_PATH "$ENV{CONDA_PREFIX}")
    elseif(DEFINED ENV{CONDA_EXE})
        get_filename_component(CONDA_ENV_PATH "$ENV{CONDA_EXE}" DIRECTORY)
        get_filename_component(CONDA_ENV_PATH "${CONDA_ENV_PATH}/.." ABSOLUTE)
    else()
        # Fallback: try to find via Python
        execute_process(COMMAND python -c "import sys; print(sys.prefix)" OUTPUT_VARIABLE CONDA_ENV_PATH OUTPUT_STRIP_TRAILING_WHITESPACE)
    endif()
endif()

# Help find ICU from conda installation
if(NOT ICU_ROOT)
    set(ICU_ROOT "${CONDA_ENV_PATH}/Library")
endif()
if(NOT ICU_UC_LIBRARY AND EXISTS "${CONDA_ENV_PATH}/Library/lib/icuuc.lib")
    set(ICU_UC_LIBRARY "${CONDA_ENV_PATH}/Library/lib/icuuc.lib")
endif()
if(NOT ICU_I18N_LIBRARY AND EXISTS "${CONDA_ENV_PATH}/Library/lib/icuin.lib")
    set(ICU_I18N_LIBRARY "${CONDA_ENV_PATH}/Library/lib/icuin.lib")
endif()
find_package(ICU REQUIRED COMPONENTS uc i18n)
if(NOT FREECAD_LIBPACK_USE OR FREECAD_LIBPACK_CHECKFILE_CLBUNDLER OR FREECAD_LIBPACK_CHECKFILE_VERSION)
    SetupPython()
    SetupPCL()
    # Help find pybind11 from conda/pip installation
    if(NOT pybind11_DIR)
        set(pybind11_DIR "${CONDA_ENV_PATH}/Lib/site-packages/pybind11/share/cmake/pybind11")
    endif()
    SetupPybind11()
    # Help find XercesC from conda installation
    if(NOT XercesC_INCLUDE_DIR AND EXISTS "${CONDA_ENV_PATH}/Library/include")
        set(XercesC_INCLUDE_DIR "${CONDA_ENV_PATH}/Library/include")
    endif()
    if(NOT XercesC_LIBRARY)
        find_library(XercesC_LIBRARY NAMES xerces-c_3 xerces-c
            HINTS "${CONDA_ENV_PATH}/Library/lib"
            NO_DEFAULT_PATH)
    endif()
    SetupXercesC()
    find_package(ZLIB REQUIRED)
    find_package(PyCXX REQUIRED)
    SetupOpenCasCade()
    if(BUILD_GUI)
        # Do this before the check for SMESH because it depends on vtk
        # that may have its own OpenGL check but possibly fails and leaves
        # OPENGL_gl_LIBRARY empty that results into linker errors
        SetupOpenGL()
    endif(BUILD_GUI)
    # Help find VTK from conda installation
    if(NOT VTK_DIR AND EXISTS "${CONDA_ENV_PATH}/Library/lib/cmake/vtk-9.3")
        set(VTK_DIR "${CONDA_ENV_PATH}/Library/lib/cmake/vtk-9.3")
    endif()
    if(NOT VTK_DIR AND EXISTS "${CONDA_ENV_PATH}/Library/lib/cmake/vtk-9.2")
        set(VTK_DIR "${CONDA_ENV_PATH}/Library/lib/cmake/vtk-9.2")
    endif()
    if(NOT VTK_DIR)
        file(GLOB _vtk_dirs "${CONDA_ENV_PATH}/Library/lib/cmake/vtk-*")
        if(_vtk_dirs)
            list(GET _vtk_dirs 0 VTK_DIR)
        endif()
    endif()
    SetupSalomeSMESH()
    if (BUILD_FEM_NETGEN)
        set(NETGEN_DEFINITIONS -DNO_PARALLEL_THREADS -DOCCGEOMETRY)
        if (NOT FREECAD_USE_EXTERNAL_SMESH)
            find_package(NETGEN REQUIRED)
        endif()
    endif()
    # not needed at the moment
    #find_package(OpenCV REQUIRED)
    SetupSwig()
    SetupEigen()
    # This file is included directly due to some cMake macros that are defined within.
    # If these macro definitions are embedded within another macro, it causes problems.
    include(cMake/FreeCAD_Helpers/SetupQt.cmake)
    SetupFreetype()

    if(BUILD_GUI)
        SetupCoin3D()
        SetupPivy()
        SetupSpaceball()
        SetupShibokenAndPyside()
        SetupMatplotlib()
    endif(BUILD_GUI)

    # SetupCoin3D can overwrite find_package(Boost) output so keep this after.
    SetupBoost()

    if(BUILD_BIM)
        SetupLark()
    endif()
endif()

if(BUILD_VR)
    find_package(Rift)
endif(BUILD_VR)

SetLibraryVersions()
SetGlobalCompilerAndLinkerSettings()

add_subdirectory(src)
add_subdirectory(data)

BuildAndInstallDesignerPlugin()

CreatePackagingTargets()

if(MSVC AND FREECAD_LIBPACK_USE AND LIBPACK_FOUND)
    CopyLibpackDirectories()
endif()

if (ENABLE_DEVELOPER_TESTS)
    include(CTest)
    enable_testing()
    add_subdirectory(tests)
endif()

PrintFinalReport()

message("\n=================================================\n"
        "Now run 'cmake --build ${CMAKE_BINARY_DIR}' to build ${PROJECT_NAME}\n"
        "=================================================\n")
