/**
 * Claude Backend Adapter
 *
 * Implements AgentBackend interface for Claude Code CLI.
 * Refactored from claude-code-process.ts.
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { AgentBackend, BackendConfig, AgentResponse, MessageContext, MCPTool } from '../agent-backend';
import { ToolCall } from '../types';

export class ClaudeBackend implements AgentBackend {
  readonly name = 'claude';
  readonly description = 'Anthropic Claude (via Claude Code CLI)';

  private process: ChildProcess | null = null;
  private config: BackendConfig = {};
  private mcpConfigPath: string = '';
  private sessionId: string = '';

  async initialize(config: BackendConfig): Promise<void> {
    this.config = {
      sessionDir: config.sessionDir || process.cwd(),
      dangerouslySkipPermissions: config.dangerouslySkipPermissions !== false,
      ...config,
    };
    this.sessionId = this.generateSessionId();
    console.log(`[ClaudeBackend] Initialized session: ${this.sessionId}`);
  }

  private generateSessionId(): string {
    return `freecad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createMcpConfig(tools: MCPTool[]): string {
    const toolCommands = tools.reduce((acc, tool) => {
      acc[`freecad_${tool.name}`] = {
        command: 'npx',
        args: ['ts-node', path.join(__dirname, 'mcp-tool-wrapper.ts'), tool.name],
      };
      return acc;
    }, {} as Record<string, { command: string; args: string[] }>);

    const config = {
      mcpServers: toolCommands,
    };

    const configPath = path.join(this.config.sessionDir || process.cwd(), '.freecad-mcp.json');
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
      const args = [
        '-p',
        '--input-format', 'stream-json',
        '--output-format', 'stream-json',
        '--session-id', this.sessionId,
        '--mcp-config', this.mcpConfigPath || this.createMcpConfig(tools),
        '--no-session-persistence',
      ];

      if (this.config.dangerouslySkipPermissions) {
        args.push('--dangerously-skip-permissions');
      }

      console.log('[ClaudeBackend] Spawning claude with session:', this.sessionId);

      const proc = spawn('claude', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      this.process = proc;

      let stdoutBuffer = '';
      let stderrBuffer = '';
      let resolved = false;

      proc.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdoutBuffer += chunk;
        try {
          const lines = chunk.split('\n').filter(l => l.trim());
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === 'content' || parsed.type === 'text') {
                onChunk(parsed.text || '');
              } else if (parsed.type === 'tool_use') {
                // Handle streaming tool use if needed
              }
            } catch {
              // Not JSON, treat as text chunk
              onChunk(chunk);
            }
          }
        } catch {
          onChunk(chunk);
        }
      });

      proc.stderr?.on('data', (data: Buffer) => {
        stderrBuffer += data.toString();
      });

      proc.on('close', (code) => {
        console.log('[ClaudeBackend] Process exited with code:', code);
        if (!resolved) {
          if (code === 0) {
            const response = this.parseResponse(stdoutBuffer);
            resolve(response);
          } else {
            console.error('[ClaudeBackend] stderr:', stderrBuffer);
            resolve({
              content: stdoutBuffer || '',
              error: `Claude exited with code ${code}: ${stderrBuffer}`,
            });
          }
          resolved = true;
        }
      });

      proc.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      const contextMessage = this.buildContextMessage(context);
      const fullMessage = contextMessage ? `${contextMessage}\n\n${message}` : message;
      const input = JSON.stringify({ type: 'user', content: fullMessage }) + '\n';

      proc.stdin?.write(input, () => {
        proc.stdin?.end();
      });

      setTimeout(() => {
        if (!resolved) {
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

        if (parsed.type === 'content' || parsed.type === 'text') {
          content += parsed.text || '';
        } else if (parsed.type === 'tool_use') {
          toolCalls.push({
            id: parsed.id || `call_${Date.now()}`,
            name: parsed.name,
            arguments: parsed.input || {},
          });
        } else if (parsed.result) {
          content += parsed.result;
        }
      } catch {
        content += line;
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
    console.log('[ClaudeBackend] Disconnected');
  }
}
