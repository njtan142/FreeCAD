/**
 * FreeCAD LLM Sidecar - Main Entry Point
 *
 * This sidecar bridges Claude Agent SDK with FreeCAD's Python execution environment.
 * It runs two WebSocket servers:
 * - Dock widget server (port 8765): Receives chat messages from FreeCAD's LLM dock widget
 * - FreeCAD bridge client (port 8766): Sends Python code to FreeCAD's Python bridge
 */

import { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { DockServer } from './dock-server';
import { FreeCADBridge } from './freecad-bridge';
import { createAgentTools } from './agent-tools';

// Configuration via environment variables
const config = {
  dockServerPort: parseInt(process.env.DOCK_SERVER_PORT || '8765', 10),
  freeCADBridgePort: parseInt(process.env.FREECAD_BRIDGE_PORT || '8766', 10),
  freeCADBridgeHost: process.env.FREECAD_BRIDGE_HOST || 'localhost',
  claudeApiKey: process.env.ANTHROPIC_API_KEY || '',
};

async function main() {
  console.log('[Sidecar] Starting FreeCAD LLM Sidecar...');
  console.log(`[Sidecar] Configuration:`);
  console.log(`  - Dock Server Port: ${config.dockServerPort}`);
  console.log(`  - FreeCAD Bridge: ${config.freeCADBridgeHost}:${config.freeCADBridgePort}`);

  if (!config.claudeApiKey) {
    console.warn('[Sidecar] Warning: ANTHROPIC_API_KEY not set. Claude Agent SDK will not be able to connect.');
  }

  // Initialize FreeCAD bridge (WebSocket client to Python bridge)
  const freeCADBridge = new FreeCADBridge({
    host: config.freeCADBridgeHost,
    port: config.freeCADBridgePort,
  });

  // Create agent tools with FreeCAD bridge integration
  const tools = createAgentTools(freeCADBridge);

  // Create MCP server with custom FreeCAD tools
  const mcpServer = createSdkMcpServer({
    name: 'freecad-tools',
    version: '1.0.0',
    tools: tools,
  });

  // Initialize dock widget server (WebSocket server for FreeCAD GUI)
  const dockServer = new DockServer({
    port: config.dockServerPort,
    freeCADBridge,
    claudeApiKey: config.claudeApiKey,
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('[Sidecar] Shutting down...');
    await dockServer.stop();
    await freeCADBridge.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('[Sidecar] Shutting down...');
    await dockServer.stop();
    await freeCADBridge.disconnect();
    process.exit(0);
  });

  // Start services
  try {
    await dockServer.start();
    console.log(`[Sidecar] Dock widget server listening on port ${config.dockServerPort}`);
    console.log(`[Sidecar] MCP server 'freecad-tools' registered with ${tools.length} tools`);

    // Attempt to connect to FreeCAD bridge (non-blocking)
    freeCADBridge.connect().catch((err) => {
      console.warn(`[Sidecar] Could not connect to FreeCAD bridge: ${err.message}`);
      console.warn('[Sidecar] Will retry on next message send attempt');
    });
  } catch (error) {
    console.error('[Sidecar] Failed to start:', error);
    process.exit(1);
  }

  console.log('[Sidecar] Ready to accept connections from FreeCAD dock widget');
  console.log('[Sidecar] Available tools:');
  tools.forEach((tool) => {
    console.log(`  - ${tool.name}`);
  });
}

// Export for testing and programmatic use
export { config, DockServer, FreeCADBridge, createAgentTools, createSdkMcpServer };

// Run if executed directly
main().catch((error) => {
  console.error('[Sidecar] Fatal error:', error);
  process.exit(1);
});
