#!/bin/bash
# FreeCAD LLM Integration Startup Script (Linux/Mac)
# This script starts both FreeCAD and the Node.js sidecar

set -e

echo "============================================"
echo "FreeCAD LLM Integration Startup"
echo "============================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js found: $(node --version)"
echo ""

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed or not in PATH"
    exit 1
fi

echo "[OK] npm found: $(npm --version)"
echo ""

# Check for sidecar dependencies
if [ ! -d "$PROJECT_DIR/sidecar/node_modules" ]; then
    echo "[INFO] Installing sidecar dependencies..."
    cd "$PROJECT_DIR/sidecar"
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install sidecar dependencies"
        exit 1
    fi
    echo "[OK] Dependencies installed"
    echo ""
fi

# Check for .env file
if [ ! -f "$PROJECT_DIR/sidecar/.env" ]; then
    echo "[WARNING] sidecar/.env file not found"
    echo "Please copy sidecar/.env.example to sidecar/.env and set your ANTHROPIC_API_KEY"
    echo ""
    read -p "Would you like to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    echo ""
fi

# Check for FreeCAD executable
FREECAD_EXE=""

# Try common installation locations
if command -v FreeCAD &> /dev/null; then
    FREECAD_EXE=$(which FreeCAD)
elif [ -f "$PROJECT_DIR/bin/FreeCAD" ]; then
    FREECAD_EXE="$PROJECT_DIR/bin/FreeCAD"
elif [ -f "$PROJECT_DIR/build/bin/FreeCAD" ]; then
    FREECAD_EXE="$PROJECT_DIR/build/bin/FreeCAD"
elif [ -f "/usr/bin/FreeCAD" ]; then
    FREECAD_EXE="/usr/bin/FreeCAD"
elif [ -f "/usr/local/bin/FreeCAD" ]; then
    FREECAD_EXE="/usr/local/bin/FreeCAD"
fi

if [ -z "$FREECAD_EXE" ]; then
    echo "[WARNING] FreeCAD executable not found in standard locations"
    echo "Please ensure FreeCAD is installed or built from source"
    echo ""
    echo "Starting sidecar only..."
    START_SIDECAR_ONLY=true
else
    echo "[OK] FreeCAD found: $FREECAD_EXE"
    echo ""
    
    # Start FreeCAD
    echo "[INFO] Starting FreeCAD..."
    "$FREECAD_EXE" &
    FREECAD_PID=$!
    echo "[OK] FreeCAD started (PID: $FREECAD_PID)"
    echo ""
fi

# Start the sidecar
echo "[INFO] Starting Node.js sidecar..."
cd "$PROJECT_DIR/sidecar"
npm start &
SIDECAR_PID=$!
echo "[OK] Sidecar started (PID: $SIDECAR_PID)"
echo ""

echo "============================================"
echo "Startup Complete"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Wait for FreeCAD to fully load"
echo "2. The LLM Assistant dock widget should appear automatically"
echo "3. If not, enable it via View > Panels > LLM Assistant"
echo "4. Type your request in the chat input"
echo ""
echo "To stop the sidecar, press Ctrl+C in this terminal"
echo "============================================"
echo ""

# Wait for background processes
wait
