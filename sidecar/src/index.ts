/**
 * FreeCAD LLM Sidecar - Main Entry Point
 *
 * This sidecar bridges Claude Agent SDK with FreeCAD's Python execution environment.
 * It runs two WebSocket servers:
 * - Dock widget server (port 8765): Receives chat messages from FreeCAD's LLM dock widget
 * - FreeCAD bridge client (port 8766): Sends Python code to FreeCAD's Python bridge
 * 
 * Authentication:
 * - Uses Claude Code CLI credentials if available (no API key needed)
 * - Falls back to ANTHROPIC_API_KEY if Claude Code not logged in
 */

import { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { DockServer } from './dock-server';
import { FreeCADBridge } from './freecad-bridge';
import { createAgentTools, setCurrentSessionId } from './agent-tools';
import { createSession, loadSession, listSessions } from './session-manager';
import { getContextInjectionPrompt, createContextMessage } from './context-injector';
import { ContextInjectionConfig } from './types';
import { execSync } from 'child_process';

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: {
    resume?: string;
    session?: string;
    listSessions: boolean;
    noContextInjection: boolean;
  } = {
    listSessions: false,
    noContextInjection: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--resume' && args[i + 1]) {
      parsed.resume = args[++i];
    } else if (arg === '--session' && args[i + 1]) {
      parsed.session = args[++i];
    } else if (arg === '--list-sessions') {
      parsed.listSessions = true;
    } else if (arg === '--no-context-injection') {
      parsed.noContextInjection = true;
    }
  }

  return parsed;
}

// Check if Claude Code CLI is available and logged in
function isClaudeCodeAvailable(): boolean {
  try {
    execSync('claude --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Configuration via environment variables
const config = {
  dockServerPort: parseInt(process.env.DOCK_SERVER_PORT || '8765', 10),
  freeCADBridgePort: parseInt(process.env.FREECAD_BRIDGE_PORT || '8766', 10),
  freeCADBridgeHost: process.env.FREECAD_BRIDGE_HOST || 'localhost',
  claudeApiKey: process.env.ANTHROPIC_API_KEY || '',
  useClaudeCodeCLI: process.env.USE_CLAUDE_CODE_CLI === 'true' || false,
  contextInjection: {
    queryBeforeOperations: true,
    includeSelectedObjects: true,
    includeDocumentInfo: true,
    maxContextLength: 4000,
  } as ContextInjectionConfig,
};

async function main() {
  const cliArgs = parseArgs();

  // Handle --list-sessions
  if (cliArgs.listSessions) {
    console.log('[Sidecar] Saved Sessions:\n');
    const sessions = listSessions(20);
    if (sessions.length === 0) {
      console.log('No saved sessions found.');
    } else {
      for (const session of sessions) {
        const date = new Date(session.updatedAt).toLocaleString();
        console.log(`- ${session.name} (ID: ${session.id})`);
        console.log(`  Messages: ${session.messageCount}, Updated: ${date}`);
        if (session.documentPath) {
          console.log(`  Document: ${session.documentPath}`);
        }
        console.log();
      }
    }
    process.exit(0);
  }

  console.log('[Sidecar] Starting FreeCAD LLM Sidecar...');
  console.log(`[Sidecar] Configuration:`);
  console.log(`  - Dock Server Port: ${config.dockServerPort}`);
  console.log(`  - FreeCAD Bridge: ${config.freeCADBridgeHost}:${config.freeCADBridgePort}`);

  // Disable context injection if requested
  if (cliArgs.noContextInjection) {
    config.contextInjection.queryBeforeOperations = false;
    console.log('[Sidecar] Context injection: disabled');
  }

  // Check auth method
  const hasClaudeCode = isClaudeCodeAvailable();
  const hasApiKey = !!config.claudeApiKey;
  
  if (!hasClaudeCode && !hasApiKey) {
    console.warn('[Sidecar] Warning: No authentication available.');
    console.warn('[Sidecar] Either:');
    console.warn('[Sidecar]   1. Install Claude Code CLI and log in (USE_CLAUDE_CODE_CLI=true)');
    console.warn('[Sidecar]   2. Set ANTHROPIC_API_KEY environment variable');
  } else if (hasClaudeCode) {
    console.log('[Sidecar] Using Claude Code CLI authentication (no API key needed)');
    if (config.useClaudeCodeCLI) {
      console.log('[Sidecar] Note: Set USE_CLAUDE_CODE_CLI=false to use API key instead');
    }
  } else {
    console.log('[Sidecar] Using ANTHROPIC_API_KEY authentication');
  }

  // Initialize FreeCAD bridge (WebSocket client to Python bridge)
  const freeCADBridge = new FreeCADBridge({
    host: config.freeCADBridgeHost,
    port: config.freeCADBridgePort,
  });

  // Handle session loading from CLI
  if (cliArgs.resume) {
    const session = loadSession(cliArgs.resume);
    if (session) {
      setCurrentSessionId(session.id);
      console.log(`[Sidecar] Resumed session: ${session.name} (${session.id})`);
    } else {
      console.warn(`[Sidecar] Session not found: ${cliArgs.resume}`);
    }
  } else if (cliArgs.session) {
    const session = createSession(cliArgs.session);
    setCurrentSessionId(session.id);
    console.log(`[Sidecar] Created new session: ${session.name} (${session.id})`);
  }

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
    contextInjection: config.contextInjection,
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
export { config, DockServer, FreeCADBridge, createAgentTools, createSdkMcpServer, parseArgs };

// Run if executed directly
main().catch((error) => {
  console.error('[Sidecar] Fatal error:', error);
  process.exit(1);
});
