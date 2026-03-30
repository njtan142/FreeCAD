import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { createAgentTools } from './agent-tools';
import { FreeCADBridge } from './freecad-bridge';

type AgentTools = ReturnType<typeof createAgentTools>;

export interface ClaudeCodeConfig {
  sessionDir?: string;
  dangerouslySkipPermissions?: boolean;
}

export class ClaudeCodeSession extends EventEmitter {
  private process: ChildProcess | null = null;
  private tools: AgentTools;
  private config: ClaudeCodeConfig;
  private sessionId: string;
  private mcpConfigPath: string;
  private isRunning = false;

  constructor(tools: AgentTools, config: ClaudeCodeConfig = {}) {
    super();
    this.tools = tools;
    this.config = {
      sessionDir: process.cwd(),
      dangerouslySkipPermissions: true,
      ...config,
    };
    this.sessionId = this.generateSessionId();
    this.mcpConfigPath = this.createMcpConfig();
  }

  private generateSessionId(): string {
    return randomUUID();
  }

  private createMcpConfig(): string {
    const toolCommands = this.tools.reduce((acc, tool) => {
      acc[`freecad_${tool.name}`] = {
        command: 'npx',
        args: ['ts-node', path.join(__dirname, 'mcp-tool-wrapper.ts'), tool.name],
      };
      return acc;
    }, {} as Record<string, { command: string; args: string[] }>);

    const config = {
      mcpServers: toolCommands,
    };

    const configPath = path.join(this.config.sessionDir!, '.freecad-mcp.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('[ClaudeCode] MCP config written to:', configPath);
    return configPath;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async start(): Promise<void> {
    console.log('[ClaudeCode] Starting session:', this.sessionId);
    return Promise.resolve();
  }

  async sendMessage(content: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        '-p',
        '--verbose',
        '--input-format', 'stream-json',
        '--output-format', 'stream-json',
        '--session-id', this.sessionId,
        '--mcp-config', this.mcpConfigPath,
        '--no-session-persistence',
      ];

      if (this.config.dangerouslySkipPermissions) {
        args.push('--dangerously-skip-permissions');
      }

      console.log('[ClaudeCode] Spawning claude with session:', this.sessionId);

      const proc = spawn('claude', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      let stdoutBuffer = '';
      let stderrBuffer = '';

      proc.stdout?.on('data', (data: Buffer) => {
        stdoutBuffer += data.toString();
      });

      proc.stderr?.on('data', (data: Buffer) => {
        stderrBuffer += data.toString();
      });

      proc.on('close', (code) => {
        console.log('[ClaudeCode] Process exited with code:', code);
        if (code === 0) {
          resolve(stdoutBuffer);
        } else {
          console.error('[ClaudeCode] stderr:', stderrBuffer);
          reject(new Error(`Claude exited with code ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });

      const input = JSON.stringify({
        type: 'user',
        message: { role: 'user', content },
        parent_tool_use_id: null,
        session_id: this.sessionId,
      }) + '\n';
      proc.stdin?.write(input, () => {
        proc.stdin?.end();
      });

      setTimeout(() => {
        if (!proc.killed) {
          proc.kill();
          reject(new Error('Request timeout'));
        }
      }, 120000);
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.isRunning = false;
    return Promise.resolve();
  }

  isConnected(): boolean {
    return this.isRunning;
  }
}

export function createClaudeCodeSession(tools: AgentTools, config?: ClaudeCodeConfig): ClaudeCodeSession {
  return new ClaudeCodeSession(tools, config);
}
