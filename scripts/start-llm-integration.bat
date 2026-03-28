@echo off
REM FreeCAD LLM Integration Startup Script (Windows)
REM This script starts both FreeCAD and the Node.js sidecar

setlocal EnableDelayedExpansion

echo ============================================
echo FreeCAD LLM Integration Startup
echo ============================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)

echo [OK] Node.js found: 
node --version
echo.

REM Check for sidecar dependencies
if not exist "%PROJECT_DIR%\sidecar\node_modules" (
    echo [INFO] Installing sidecar dependencies...
    cd /d "%PROJECT_DIR%\sidecar"
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install sidecar dependencies
        exit /b 1
    )
    echo [OK] Dependencies installed
    echo.
)

REM Check for .env file
if not exist "%PROJECT_DIR%\sidecar\.env" (
    echo [WARNING] sidecar\.env file not found
    echo Please copy sidecar\.env.example to sidecar\.env and set your ANTHROPIC_API_KEY
    echo.
    echo Would you like to continue anyway? (Y/N)
    set /p CONTINUE="> "
    if /i not "!CONTINUE!"=="Y" (
        exit /b 1
    )
    echo.
)

REM Check for FreeCAD executable
REM Adjust this path if FreeCAD is installed in a different location
set FREECAD_EXE=
if exist "C:\Program Files\FreeCAD\bin\FreeCAD.exe" (
    set FREECAD_EXE=C:\Program Files\FreeCAD\bin\FreeCAD.exe
) else if exist "%PROJECT_DIR%\bin\FreeCAD.exe" (
    set FREECAD_EXE=%PROJECT_DIR%\bin\FreeCAD.exe
) else if exist "%PROJECT_DIR%\build\bin\FreeCAD.exe" (
    set FREECAD_EXE=%PROJECT_DIR%\build\bin\FreeCAD.exe
)

if "%FREECAD_EXE%"=="" (
    echo [WARNING] FreeCAD executable not found in standard locations
    echo Please ensure FreeCAD is installed or built from source
    echo.
    echo Starting sidecar only...
    goto :START_SIDECAR
)

echo [OK] FreeCAD found: %FREECAD_EXE%
echo.

REM Start FreeCAD
echo [INFO] Starting FreeCAD...
start "" "%FREECAD_EXE%"
echo [OK] FreeCAD started
echo.

:START_SIDECAR
REM Start the sidecar
echo [INFO] Starting Node.js sidecar...
cd /d "%PROJECT_DIR%\sidecar"
start "FreeCAD LLM Sidecar" cmd /k "npm start"
echo [OK] Sidecar started in new window
echo.

echo ============================================
echo Startup Complete
echo ============================================
echo.
echo Next steps:
echo 1. Wait for FreeCAD to fully load
echo 2. The LLM Assistant dock widget should appear automatically
echo 3. If not, enable it via View ^> Panels ^> LLM Assistant
echo 4. Type your request in the chat input
echo.
echo To stop the sidecar, close the "FreeCAD LLM Sidecar" window
echo ============================================
echo.
pause
