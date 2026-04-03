/**
 * Claude Backend Adapter
 *
 * Implements AgentBackend interface for Claude Code CLI.
 * Refactored from claude-code-process.ts.
 */

import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { AgentBackend, BackendConfig, AgentResponse, MessageContext, MCPTool } from '../agent-backend';
import { ToolCall } from '../types';

export class ClaudeBackend implements AgentBackend {
  readonly name = 'claude';
  readonly description = 'Anthropic Claude (via Claude Code CLI)';

  private process: ChildProcess | null = null;
  private config: BackendConfig = {};
  private sessionId: string = '';
  private mcpConfigPath: string = '';

  async initialize(config: BackendConfig): Promise<void> {
    this.config = {
      sessionDir: config.sessionDir || process.cwd(),
      dangerouslySkipPermissions: config.dangerouslySkipPermissions !== false,
      ...config,
    };
    this.sessionId = this.generateSessionId();
    this.mcpConfigPath = this.createMcpConfig();
    console.log(`[ClaudeBackend] Initialized session: ${this.sessionId}`);
    console.log(`[ClaudeBackend] MCP config: ${this.mcpConfigPath}`);
  }

  private generateSessionId(): string {
    return randomUUID();
  }

  private createMcpConfig(): string {
    // Use compiled JS for MCP server (ts-node has stdin issues)
    // __dirname is src/backends when running via ts-node, so go up two levels
    const sidecarDir = path.resolve(__dirname, '..', '..');
    const mcpServerScript = path.resolve(sidecarDir, 'dist', 'mcp-stdio-server.js');
    console.log('[ClaudeBackend] MCP server script:', mcpServerScript);
    console.log('[ClaudeBackend] MCP server exists:', fs.existsSync(mcpServerScript));

    const config = {
      mcpServers: {
        'freecad': {
          command: 'node',
          args: [mcpServerScript],
          cwd: sidecarDir,
          env: {
            FREECAD_PROXY_PORT: '8767',
          },
        },
      },
    };

    const configDir = this.config.sessionDir || process.cwd();
    const configPath = path.join(configDir, '.freecad-mcp-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('[ClaudeBackend] MCP config written to:', configPath);
    return configPath;
  }

  async sendMessage(
    message: string,
    context: MessageContext,
    tools: MCPTool[],
    onChunk: (chunk: string) => void
  ): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
      const messageSessionId = randomUUID();
      const systemPrompt = `You are a FreeCAD CAD assistant. You help users create, modify, and query 3D models in FreeCAD.

IMPORTANT: You have MCP tools from the "freecad" server to interact with FreeCAD directly. ALWAYS use these MCP tools. NEVER use Bash, Read, Grep, Write, Glob, Edit, Agent, or other file/code tools.

Your primary tool is "execute_freecad_python" — it runs Python code directly inside FreeCAD's live interpreter with full access to all FreeCAD APIs:
- FreeCAD (App), FreeCADGui (Gui)
- Part, PartDesign, Sketcher, Draft, Arch, Path, TechDraw, FEM, Mesh, Spreadsheet
- All workbenches and modules

Use execute_freecad_python for ALL CAD operations: creating geometry, modifying objects, boolean operations, assemblies, BIM elements, sketches, etc.

Other helper tools: query_model_state, list_objects, get_object_properties, get_selection, undo, redo, save_document.

When creating objects, always call doc.recompute() after modifications. Use print(json.dumps(...)) to return structured results.`;

      const args = [
        '-p',
        '--verbose',
        '--output-format', 'stream-json',
        '--model', 'claude-sonnet-4-6',
        '--permission-mode', 'auto',
        '--mcp-config', this.mcpConfigPath,
        '--append-system-prompt', systemPrompt,
        '--disallowed-tools', 'Bash,Read,Edit,Write,Grep,Glob,Agent,WebFetch,WebSearch',
      ];

      if (this.config.dangerouslySkipPermissions) {
        args.push('--dangerously-skip-permissions');
      }

      console.log('[ClaudeBackend] Spawning claude with args:', args.join(' '));
      console.log('[ClaudeBackend] Platform:', process.platform);
      console.log('[ClaudeBackend] Working directory:', process.cwd());
      console.log('[ClaudeBackend] Shell:', process.platform === 'win32' ? 'powershell.exe' : 'bash');
      console.log('[ClaudeBackend] Environment variables (filtered):');
      const envKeys = ['ANTHROPIC_API_KEY', 'HOME', 'USERPROFILE', 'CLAUDE_SESSION_DIR', 'PATH'];
      for (const key of envKeys) {
        const value = process.env[key];
        if (value) {
          console.log(`  ${key}: ${key === 'ANTHROPIC_API_KEY' ? '***' : value.substring(0, 100)}`);
        } else {
          console.log(`  ${key}: (not set)`);
        }
      }

      // For Claude Code CLI auth: remove ANTHROPIC_API_KEY if set
      // so Claude CLI uses OAuth instead of API key authentication
      const env = { ...process.env };
      delete env.ANTHROPIC_API_KEY;

      const proc = spawn('claude', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
        cwd: process.cwd(),
      });

      console.log('[ClaudeBackend] Subprocess spawned with PID:', proc.pid);
      console.log('[ClaudeBackend] ANTHROPIC_API_KEY removed from env for OAuth auth');

      this.process = proc;

      let stdoutBuffer = '';
      let stderrBuffer = '';
      let resolved = false;

      proc.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdoutBuffer += chunk;
        console.log('[ClaudeBackend] stdout chunk received, length:', chunk.length);
        try {
          const lines = chunk.split('\n').filter(l => l.trim());
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              console.log('[ClaudeBackend] stream event:', parsed.type, parsed.subtype || '', parsed.tool_name || '');
              if (parsed.type === 'assistant' && parsed.message?.content) {
                for (const block of parsed.message.content) {
                  if (block.type === 'text') {
                    console.log('[ClaudeBackend] text:', block.text.substring(0, 200));
                    onChunk(block.text);
                  } else if (block.type === 'tool_use') {
                    console.log('[ClaudeBackend] tool_use:', block.name);
                  }
                }
              } else if (parsed.type === 'content_block_delta') {
                if (parsed.delta?.text) {
                  onChunk(parsed.delta.text);
                }
              } else if (parsed.type === 'content' || parsed.type === 'text') {
                onChunk(parsed.text || '');
              } else if (parsed.type === 'result') {
                console.log('[ClaudeBackend] result:', (parsed.result || '').substring(0, 200));
              }
            } catch (e) {
              console.log('[ClaudeBackend] JSON parse error, raw output:', line.substring(0, 300));
            }
          }
        } catch (e) {
          console.log('[ClaudeBackend] stdout parse error:', e instanceof Error ? e.message : String(e));
        }
      });

      proc.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        stderrBuffer += text;
        console.log('[ClaudeBackend] stderr chunk received, length:', text.length);
        console.log('[ClaudeBackend] stderr content:', text);
      });

      proc.on('close', (code) => {
        console.log('[ClaudeBackend] Process exited with code:', code);
        console.log('[ClaudeBackend] stdout buffer length:', stdoutBuffer.length);
        console.log('[ClaudeBackend] stderr buffer length:', stderrBuffer.length);
        console.log('[ClaudeBackend] First 500 chars of stdout:', stdoutBuffer.substring(0, 500));
        console.log('[ClaudeBackend] First 500 chars of stderr:', stderrBuffer.substring(0, 500));
        if (!resolved) {
          if (code === 0) {
            const response = this.parseResponse(stdoutBuffer);
            resolve(response);
          } else {
            console.error('[ClaudeBackend] Full stderr:', stderrBuffer);
            console.error('[ClaudeBackend] Full stdout:', stdoutBuffer);
            resolve({
              content: stdoutBuffer || '',
              error: `Claude exited with code ${code}: ${stderrBuffer}`,
            });
          }
          resolved = true;
        }
      });

      proc.on('error', (err) => {
        console.error('[ClaudeBackend] Process error:', err.message);
        console.error('[ClaudeBackend] Error stack:', err.stack);
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      const contextMessage = this.buildContextMessage(context);
      const historyBlock = this.buildConversationHistory(context);
      const parts: string[] = [];
      if (contextMessage) parts.push(contextMessage);
      if (historyBlock) parts.push(historyBlock);
      parts.push(message);
      const fullMessage = parts.join('\n\n');

      console.log('[ClaudeBackend] Prompt length:', fullMessage.length, 'chars');
      console.log('[ClaudeBackend] Prompt preview:', fullMessage.substring(0, 300));

      // With -p (print mode), just pipe the message via stdin as plain text
      console.log('[ClaudeBackend] Writing to stdin, message length:', fullMessage.length);
      proc.stdin?.write(fullMessage, () => {
        console.log('[ClaudeBackend] Stdin write complete, closing stdin');
        proc.stdin?.end();
      });

      proc.stdin?.on('error', (err) => {
        console.error('[ClaudeBackend] stdin error:', err.message);
      });

      setTimeout(() => {
        if (!resolved) {
          console.log('[ClaudeBackend] Request timeout after 120s, killing process');
          proc.kill();
          resolved = true;
          resolve({
            content: stdoutBuffer,
            error: 'Request timeout (120s)',
          });
        }
      }, 120000);
    });
  }

  private buildConversationHistory(context: MessageContext): string {
    if (!context.conversationHistory || context.conversationHistory.length === 0) {
      return '';
    }

    const history = context.conversationHistory.slice(0, -1);
    if (history.length === 0) return '';

    const lines = ['[Conversation History]'];
    for (const msg of history) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      lines.push(`${role}: ${msg.content}`);
    }
    lines.push('[End History]');
    return lines.join('\n');
  }

  private buildContextMessage(context: MessageContext): string {
    const parts: string[] = [];

    if (context.documentInfo) {
      parts.push(`Document: ${context.documentInfo.label} (${context.documentInfo.name})`);
      parts.push(`Modified: ${context.documentInfo.modified}`);
      parts.push(`Objects: ${context.documentInfo.objectCount}`);
    }

    if (context.selectedObjects && context.selectedObjects.length > 0) {
      parts.push('\nSelected Objects:');
      for (const obj of context.selectedObjects) {
        parts.push(`- ${obj.label} (${obj.type})`);
      }
    }

    return parts.join('\n');
  }

  private parseResponse(stdout: string): AgentResponse {
    const toolCalls: ToolCall[] = [];
    const lines = stdout.split('\n').filter(l => l.trim());
    let content = '';

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);

        if (parsed.type === 'assistant' && parsed.message?.content) {
          for (const block of parsed.message.content) {
            if (block.type === 'text') {
              content += block.text;
            } else if (block.type === 'tool_use') {
              toolCalls.push({
                id: block.id || `call_${Date.now()}`,
                name: block.name,
                arguments: block.input || {},
              });
            }
          }
        } else if (parsed.type === 'result') {
          if (parsed.result && !content) {
            content = parsed.result;
          }
        }
      } catch {
        // skip non-JSON lines
      }
    }

    return {
      content: content.trim(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  async healthCheck(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const proc = spawn('claude', ['--version'], { stdio: 'pipe' });
        proc.on('close', (code) => {
          resolve(code === 0);
        });
        proc.on('error', () => {
          resolve(false);
        });
      } catch {
        resolve(false);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.sessionId = '';
    // Clean up MCP config
    if (this.mcpConfigPath && fs.existsSync(this.mcpConfigPath)) {
      try { fs.unlinkSync(this.mcpConfigPath); } catch { /* ignore */ }
    }
    console.log('[ClaudeBackend] Disconnected');
  }
}
