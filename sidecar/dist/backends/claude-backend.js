"use strict";
/**
 * Claude Backend Adapter
 *
 * Implements AgentBackend interface for Claude Code CLI.
 * Refactored from claude-code-process.ts.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeBackend = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ClaudeBackend {
    name = 'claude';
    description = 'Anthropic Claude (via Claude Code CLI)';
    process = null;
    config = {};
    mcpConfigPath = '';
    sessionId = '';
    async initialize(config) {
        this.config = {
            sessionDir: config.sessionDir || process.cwd(),
            dangerouslySkipPermissions: config.dangerouslySkipPermissions !== false,
            ...config,
        };
        this.sessionId = this.generateSessionId();
        console.log(`[ClaudeBackend] Initialized session: ${this.sessionId}`);
    }
    generateSessionId() {
        return `freecad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    createMcpConfig(tools) {
        const toolCommands = tools.reduce((acc, tool) => {
            acc[`freecad_${tool.name}`] = {
                command: 'npx',
                args: ['ts-node', path.join(__dirname, 'mcp-tool-wrapper.ts'), tool.name],
            };
            return acc;
        }, {});
        const config = {
            mcpServers: toolCommands,
        };
        const configPath = path.join(this.config.sessionDir || process.cwd(), '.freecad-mcp.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('[ClaudeBackend] MCP config written to:', configPath);
        return configPath;
    }
    async sendMessage(message, context, tools, onChunk) {
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
            const proc = (0, child_process_1.spawn)('claude', args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env },
            });
            this.process = proc;
            let stdoutBuffer = '';
            let stderrBuffer = '';
            let resolved = false;
            proc.stdout?.on('data', (data) => {
                const chunk = data.toString();
                stdoutBuffer += chunk;
                try {
                    const lines = chunk.split('\n').filter(l => l.trim());
                    for (const line of lines) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.type === 'content' || parsed.type === 'text') {
                                onChunk(parsed.text || '');
                            }
                            else if (parsed.type === 'tool_use') {
                                // Handle streaming tool use if needed
                            }
                        }
                        catch {
                            // Not JSON, treat as text chunk
                            onChunk(chunk);
                        }
                    }
                }
                catch {
                    onChunk(chunk);
                }
            });
            proc.stderr?.on('data', (data) => {
                stderrBuffer += data.toString();
            });
            proc.on('close', (code) => {
                console.log('[ClaudeBackend] Process exited with code:', code);
                if (!resolved) {
                    if (code === 0) {
                        const response = this.parseResponse(stdoutBuffer);
                        resolve(response);
                    }
                    else {
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
        const lines = stdout.split('\n').filter(l => l.trim());
        let content = '';
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.type === 'content' || parsed.type === 'text') {
                    content += parsed.text || '';
                }
                else if (parsed.type === 'tool_use') {
                    toolCalls.push({
                        id: parsed.id || `call_${Date.now()}`,
                        name: parsed.name,
                        arguments: parsed.input || {},
                    });
                }
                else if (parsed.result) {
                    content += parsed.result;
                }
            }
            catch {
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
                const proc = (0, child_process_1.spawn)('claude', ['--version'], { stdio: 'pipe' });
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
        this.sessionId = '';
        console.log('[ClaudeBackend] Disconnected');
    }
}
exports.ClaudeBackend = ClaudeBackend;
//# sourceMappingURL=claude-backend.js.map