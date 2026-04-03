"use strict";
/**
 * OpenCode Backend Adapter
 *
 * Implements AgentBackend interface for OpenCode CLI.
 * OpenCode supports multiple LLM providers (OpenAI, Anthropic, Google, local).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenCodeBackend = void 0;
const child_process_1 = require("child_process");
const tool_translator_1 = require("../tool-translator");
class OpenCodeBackend {
    name = 'opencode';
    description = 'Multi-LLM backend (OpenAI, Anthropic, Google, local)';
    process = null;
    config = {};
    toolTranslator = new tool_translator_1.OpenCodeToolTranslator();
    async initialize(config) {
        this.config = {
            ...config,
        };
        console.log('[OpenCodeBackend] Initialized with config:', {
            baseUrl: this.config.baseUrl,
            model: this.config.model,
        });
    }
    async sendMessage(message, context, tools, onChunk) {
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
            const isWindows = process.platform === 'win32';
            const proc = (0, child_process_1.spawn)(isWindows ? 'npx' : 'opencode', isWindows ? ['opencode', ...args] : args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                env,
                shell: isWindows,
            });
            this.process = proc;
            let stdoutBuffer = '';
            let stderrBuffer = '';
            let resolved = false;
            proc.stdout?.on('data', (data) => {
                const chunk = data.toString();
                stdoutBuffer += chunk;
                onChunk(chunk);
            });
            proc.stderr?.on('data', (data) => {
                stderrBuffer += data.toString();
            });
            proc.on('close', (code) => {
                console.log('[OpenCodeBackend] Process exited with code:', code);
                if (!resolved) {
                    if (code === 0) {
                        const response = this.parseResponse(stdoutBuffer);
                        resolve(response);
                    }
                    else {
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
    buildArgs() {
        const args = [];
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
    buildContextMessage(context) {
        const parts = [];
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
    parseResponse(stdout) {
        const toolCalls = [];
        let content = '';
        const lines = stdout.split('\n').filter(l => l.trim());
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.type === 'content' || parsed.type === 'text') {
                    content += parsed.text || '';
                }
                else if (parsed.type === 'function_call' || parsed.type === 'tool_call') {
                    const tc = this.toolTranslator.fromBackendFormat(parsed);
                    toolCalls.push(...tc);
                }
                else if (parsed.result || parsed.response) {
                    content += parsed.result || parsed.response;
                }
            }
            catch {
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
    async healthCheck() {
        return new Promise((resolve) => {
            try {
                const proc = (0, child_process_1.spawn)('opencode', ['--version'], { stdio: 'pipe' });
                proc.on('close', (code) => {
                    resolve(code === 0);
                });
                proc.on('error', () => {
                    resolve(false);
                });
            }
            catch {
                resolve(false);
            }
        });
    }
    async disconnect() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
        console.log('[OpenCodeBackend] Disconnected');
    }
}
exports.OpenCodeBackend = OpenCodeBackend;
//# sourceMappingURL=opencode-backend.js.map