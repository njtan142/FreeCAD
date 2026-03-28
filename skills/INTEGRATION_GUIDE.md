# FreeCAD LLM Integration Guide

## Overview

This guide covers the setup, configuration, and troubleshooting for the FreeCAD LLM integration. The integration embeds an LLM-powered chat panel directly inside FreeCAD that can execute Python commands in the live FreeCAD session.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FreeCAD Qt GUI                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              LLM Assistant Dock Widget                    │  │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐  │  │
│  │  │   Chat Display  │    │      Input Field            │  │  │
│  │  │   (User/Assistant│    │  [Type request...] [Send]   │  │  │
│  │  │    System msgs)  │    │                             │  │  │
│  │  └─────────────────┘    └─────────────────────────────┘  │  │
│  │         │                                                 │  │
│  │         │ WebSocket (port 8765)                           │  │
│  └─────────┼─────────────────────────────────────────────────┘  │
│            │                                                    │
│  ┌─────────▼────────────────────────────────────────────────┐  │
│  │         LLMBridge Python Module                          │  │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐  │  │
│  │  │ Panel Bridge    │    │  WebSocket Server (8766)    │  │  │
│  │  │ (sidecar_client)│    │  (Python execution bridge)  │  │  │
│  │  └─────────────────┘    └─────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │
           │ WebSocket (port 8766)
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js Sidecar                               │
│  ┌─────────────────┐    ┌─────────────────────────────────┐    │
│  │ Dock Server     │    │  FreeCAD Bridge Client          │    │
│  │ (port 8765)     │    │  (connects to port 8766)        │    │
│  └────────┬────────┘    └─────────────────────────────────┘    │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Claude Agent SDK                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  Custom Tools:                                  │    │   │
│  │  │  - execute_freecad_python(code)                 │    │   │
│  │  │  - query_model_state(query)                     │    │   │
│  │  │  - export_model(filePath, format)               │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           │
           │ HTTPS API
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Anthropic API (Claude)                       │
└─────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Port | Description |
|-----------|------|-------------|
| Dock Server | 8765 | WebSocket server accepting connections from FreeCAD dock widget |
| FreeCAD Bridge | 8766 | WebSocket server inside FreeCAD for Python code execution |
| Claude Agent SDK | N/A | AI agent that processes requests and calls tools |

## Prerequisites

### Required Software

1. **FreeCAD** (built from source or installed)
   - Python 3.8+ enabled
   - LLMBridge module (`src/Mod/LLMBridge/`)

2. **Node.js 18+**
   - Download from: https://nodejs.org/
   - Verify: `node --version`

3. **Python Dependencies**
   - `websockets` library for FreeCAD Python
   - Install: `pip install websockets`

4. **Anthropic API Key**
   - Get your key from: https://console.anthropic.com/

## Quick Start

### Windows

1. **Configure API Key**
   ```cmd
   cd C:\path\to\FreeCAD\sidecar
   copy .env.example .env
   ```
   Edit `.env` and set your `ANTHROPIC_API_KEY`

2. **Run the Startup Script**
   ```cmd
   C:\path\to\FreeCAD\scripts\start-llm-integration.bat
   ```

3. **Use the LLM Assistant**
   - Wait for FreeCAD to load
   - The LLM Assistant dock widget should appear automatically
   - If not, enable via: View > Panels > LLM Assistant
   - Type your request (e.g., "Create a cube with 10mm sides")

### Linux/Mac

1. **Configure API Key**
   ```bash
   cd /path/to/FreeCAD/sidecar
   cp .env.example .env
   # Edit .env and set your ANTHROPIC_API_KEY
   ```

2. **Make Script Executable**
   ```bash
   chmod +x /path/to/FreeCAD/scripts/start-llm-integration.sh
   ```

3. **Run the Startup Script**
   ```bash
   /path/to/FreeCAD/scripts/start-llm-integration.sh
   ```

4. **Use the LLM Assistant**
   - Wait for FreeCAD to load
   - The LLM Assistant dock widget should appear automatically
   - If not, enable via: View > Panels > LLM Assistant
   - Type your request (e.g., "Create a cube with 10mm sides")

## Manual Setup

If you prefer to start components manually:

### Step 1: Install Sidecar Dependencies

```bash
cd sidecar
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### Step 3: Start FreeCAD

```bash
# From source build
./build/bin/FreeCAD

# Or system installation
FreeCAD
```

### Step 4: Start the Sidecar

```bash
cd sidecar
npm start
```

### Step 5: Verify Connection

In FreeCAD, open the Python console (View > Panels > Python Console) and check for:
```
LLMBridge: WebSocket server started on localhost:8766
LLMBridge: Panel bridge initialized
LLMPanelBridge: Initialized
```

## Configuration

### Environment Variables (sidecar/.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | (required) | Your Anthropic API key |
| `DOCK_SERVER_PORT` | 8765 | Port for dock widget WebSocket server |
| `FREECAD_BRIDGE_PORT` | 8766 | Port for FreeCAD Python bridge |
| `FREECAD_HOST` | localhost | Hostname for FreeCAD bridge connection |

### FreeCAD Preferences

The LLMBridge module reads preferences from:
- `User parameter:BaseApp/Preferences/Mod/LLMBridge`
- Key: `Port` (default: 9876, but overridden to 8766 in code)

## Usage Examples

### Creating Basic Shapes

**Cube/Box:**
```
Create a cube with 10mm sides
```

**Cylinder:**
```
Create a cylinder with radius 5mm and height 20mm
```

**Sphere:**
```
Create a sphere with radius 15mm
```

### Querying Model State

```
What objects are in the current document?
```

```
Show me the current document info
```

### Exporting Models

```
Export the model to C:\models\part.step
```

```
Save as STL to /home/user/models/part.stl
```

## Troubleshooting

### Dock Widget Not Visible

**Symptoms:** The LLM Assistant panel doesn't appear in FreeCAD.

**Solutions:**
1. Enable via menu: View > Panels > LLM Assistant
2. Reset window layout: View > Reset Window Layout
3. Check Python console for initialization errors

### Sidecar Won't Start

**Symptoms:** `npm start` fails with errors.

**Solutions:**
1. Check Node.js version: `node --version` (must be 18+)
2. Install dependencies: `npm install`
3. Check for port conflicts:
   ```bash
   # Windows
   netstat -ano | findstr :8765
   
   # Linux/Mac
   lsof -i :8765
   ```

### Connection Failed

**Symptoms:** "Not connected to sidecar" or "Could not connect to sidecar"

**Solutions:**
1. Verify sidecar is running (check terminal output)
2. Check firewall settings allow localhost connections
3. Verify ports 8765 and 8766 are not blocked
4. Check FreeCAD Python console for errors
5. Ensure `websockets` library is installed:
   ```bash
   pip install websockets
   ```

### API Key Errors

**Symptoms:** "Claude API key not configured" or authentication errors.

**Solutions:**
1. Verify `.env` file exists in `sidecar/` directory
2. Check `ANTHROPIC_API_KEY` is set correctly (no extra spaces)
3. Restart the sidecar after changing `.env`
4. Verify API key is valid at https://console.anthropic.com/

### Python Execution Errors

**Symptoms:** Code execution fails or returns errors.

**Solutions:**
1. Check FreeCAD Python console for detailed error messages
2. Verify the Python code is valid FreeCAD API syntax
3. Ensure an active document exists in FreeCAD
4. Check that required workbenches are loaded

### WebSocket Connection Drops

**Symptoms:** Connection works initially but drops after some time.

**Solutions:**
1. The sidecar has automatic reconnection (up to 3 attempts)
2. Restart the sidecar if reconnection fails
3. Check for network interruptions or firewall rules
4. Verify FreeCAD is still running

## Log Locations

### FreeCAD Console Output

View > Panels > Python Console shows:
- LLMBridge server startup messages
- Panel bridge initialization
- Connection status changes
- Python execution results

### Sidecar Console Output

The terminal running `npm start` shows:
- Dock server startup
- FreeCAD bridge connection attempts
- Claude Agent SDK messages
- Tool execution logs

## Development

### Building from Source

1. **Build FreeCAD:**
   ```bash
   # Follow FreeCAD build instructions for your platform
   cmake -B build -S .
   cmake --build build
   ```

2. **Build Sidecar:**
   ```bash
   cd sidecar
   npm run build
   ```

### Running in Development Mode

```bash
# Sidecar with auto-reload
cd sidecar
npm run dev
```

### Testing Connections

Test FreeCAD bridge directly:
```python
# In FreeCAD Python console
from llm_bridge.server import BridgeServer
# Server should already be running on port 8766
```

Test sidecar connection:
```bash
# In a new terminal, test WebSocket connection
wscat -c ws://localhost:8765
```

## Known Limitations

1. **Single Document:** Currently works best with a single active document
2. **Long-running Operations:** Python code that blocks the main thread may cause timeouts
3. **Complex Geometry:** Very complex operations may exceed API context limits
4. **Network Requirements:** Requires internet connection for Claude API access

## Security Considerations

1. **API Key:** Never commit your `.env` file with the API key
2. **Local Only:** WebSocket servers bind to localhost only (not exposed externally)
3. **Code Execution:** LLM-generated code executes with full FreeCAD access
4. **File Paths:** Export tool validates file paths to prevent path traversal

## Getting Help

- Check the [PROJECT.md](PROJECT.md) for architecture details
- Review [CURRENT_PLAN.md](CURRENT_PLAN.md) for current development status
- Report issues on the project repository
