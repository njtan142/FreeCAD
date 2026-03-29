/**
 * OpenCode Backend Adapter
 *
 * Implements AgentBackend interface for OpenCode CLI.
 * OpenCode supports multiple LLM providers (OpenAI, Anthropic, Google, local).
 */

import { spawn, ChildProcess } from 'child_process';
import { AgentBackend, BackendConfig, AgentResponse, MessageContext, MCPTool } from '../agent-backend';
import { ToolCall } from '../types';
import { OpenCodeToolTranslator } from '../tool-translator';

export class OpenCodeBackend implements AgentBackend {
  readonly name = 'opencode';
  readonly description = 'Multi-LLM backend (OpenAI, Anthropic, Google, local)';

  private process: ChildProcess | null = null;
  private config: BackendConfig = {};
  private toolTranslator = new OpenCodeToolTranslator();

  async initialize(config: BackendConfig): Promise<void> {
    this.config = {
      ...config,
    };
    console.log('[OpenCodeBackend] Initialized with config:', {
      baseUrl: this.config.baseUrl,
      model: this.config.model,
    });
  }

  async sendMessage(
    message: string,
    context: MessageContext,
    tools: MCPTool[],
    onChunk: (chunk: string) => void
  ): Promise<AgentResponse> {
    const translatedTools = this.toolTranslator.toBackendFormat(tools);
    const contextMessage = this.buildContextMessage(context);
    const fullMessage = contextMessage ? `${contextMessage}\n\n${message}` : message;

    return new Promise((resolve, reject) => {
      const args = this.buildArgs();

      console.log('[OpenCodeBackend] Spawning opencode with args:', args);

      const env = { ...process.env };
      if (this.config.apiKey) {
        env.OPENAI_API_KEY = this.config.apiKey;
      }

      const proc = spawn('opencode', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
      });

      this.process = proc;

      let stdoutBuffer = '';
      let stderrBuffer = '';
      let resolved = false;

      proc.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdoutBuffer += chunk;
        onChunk(chunk);
      });

      proc.stderr?.on('data', (data: Buffer) => {
        stderrBuffer += data.toString();
      });

      proc.on('close', (code) => {
        console.log('[OpenCodeBackend] Process exited with code:', code);
        if (!resolved) {
          if (code === 0) {
            const response = this.parseResponse(stdoutBuffer);
            resolve(response);
          } else {
            resolve({
              content: stdoutBuffer,
              error: `OpenCode exited with code ${code}: ${stderrBuffer}`,
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

      const input = JSON.stringify({
        message: fullMessage,
        tools: translatedTools,
      }) + '\n';

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

  private buildArgs(): string[] {
    const args: string[] = [];

    if (this.config.model) {
      args.push('--model', this.config.model);
    }

    if (this.config.baseUrl) {
      args.push('--base-url', this.config.baseUrl);
    }

    if (this.config.temperature !== undefined) {
      args.push('--temperature', String(this.config.temperature));
    }

    if (this.config.maxTokens) {
      args.push('--max-tokens', String(this.config.maxTokens));
    }

    return args;
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
    let content = '';

    const lines = stdout.split('\n').filter(l => l.trim());

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);

        if (parsed.type === 'content' || parsed.type === 'text') {
          content += parsed.text || '';
        } else if (parsed.type === 'function_call' || parsed.type === 'tool_call') {
          const tc = this.toolTranslator.fromBackendFormat(parsed);
          toolCalls.push(...tc);
        } else if (parsed.result || parsed.response) {
          content += parsed.result || parsed.response;
        }
      } catch {
        if (line.startsWith('{') || line.startsWith('[')) {
          continue;
        }
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
        const proc = spawn('opencode', ['--version'], { stdio: 'pipe' });
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
    console.log('[OpenCodeBackend] Disconnected');
  }
}
