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
 * - OpenCode backend for multi-LLM support (OpenAI, Anthropic, Google, local)
 */
import { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { DockServer } from './dock-server';
import { FreeCADBridge } from './freecad-bridge';
import { createAgentTools } from './agent-tools';
import { ContextInjectionConfig } from './types';
import { backendRegistry } from './backend-registry';
interface ParsedArgs {
    resume?: string;
    session?: string;
    listSessions: boolean;
    listBackends: boolean;
    noContextInjection: boolean;
    backend?: string;
}
declare function parseArgs(): ParsedArgs;
declare const config: {
    dockServerPort: number;
    freeCADBridgePort: number;
    freeCADBridgeHost: string;
    claudeApiKey: string;
    useClaudeCodeCLI: boolean;
    contextInjection: ContextInjectionConfig;
};
export { config, DockServer, FreeCADBridge, createAgentTools, createSdkMcpServer, parseArgs, backendRegistry };
//# sourceMappingURL=index.d.ts.map