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
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ClaudeBackend {
    name = 'claude';
    description = 'Anthropic Claude (via Claude Code CLI)';
    process = null;
    config = {};
    sessionId = '';
    mcpConfigPath = '';
    async initialize(config) {
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
    generateSessionId() {
        return (0, crypto_1.randomUUID)();
    }
    createMcpConfig() {
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
    async sendMessage(message, context, tools, onChunk) {
        return new Promise((resolve, reject) => {
            const messageSessionId = (0, crypto_1.randomUUID)();
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
                }
                else {
                    console.log(`  ${key}: (not set)`);
                }
            }
            // For Claude Code CLI auth: remove ANTHROPIC_API_KEY if set
            // so Claude CLI uses OAuth instead of API key authentication
            const env = { ...process.env };
            delete env.ANTHROPIC_API_KEY;
            const proc = (0, child_process_1.spawn)('claude', args, {
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
            proc.stdout?.on('data', (data) => {
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
                                    }
                                    else if (block.type === 'tool_use') {
                                        console.log('[ClaudeBackend] tool_use:', block.name);
                                    }
                                }
                            }
                            else if (parsed.type === 'content_block_delta') {
                                if (parsed.delta?.text) {
                                    onChunk(parsed.delta.text);
                                }
                            }
                            else if (parsed.type === 'content' || parsed.type === 'text') {
                                onChunk(parsed.text || '');
                            }
                            else if (parsed.type === 'result') {
                                console.log('[ClaudeBackend] result:', (parsed.result || '').substring(0, 200));
                            }
                        }
                        catch (e) {
                            console.log('[ClaudeBackend] JSON parse error, raw output:', line.substring(0, 300));
                        }
                    }
                }
                catch (e) {
                    console.log('[ClaudeBackend] stdout parse error:', e instanceof Error ? e.message : String(e));
                }
            });
            proc.stderr?.on('data', (data) => {
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
                    }
                    else {
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
            const parts = [];
            if (contextMessage)
                parts.push(contextMessage);
            if (historyBlock)
                parts.push(historyBlock);
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
    buildConversationHistory(context) {
        if (!context.conversationHistory || context.conversationHistory.length === 0) {
            return '';
        }
        const history = context.conversationHistory.slice(0, -1);
        if (history.length === 0)
            return '';
        const lines = ['[Conversation History]'];
        for (const msg of history) {
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            lines.push(`${role}: ${msg.content}`);
        }
        lines.push('[End History]');
        return lines.join('\n');
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
                if (parsed.type === 'assistant' && parsed.message?.content) {
                    for (const block of parsed.message.content) {
                        if (block.type === 'text') {
                            content += block.text;
                        }
                        else if (block.type === 'tool_use') {
                            toolCalls.push({
                                id: block.id || `call_${Date.now()}`,
                                name: block.name,
                                arguments: block.input || {},
                            });
                        }
                    }
                }
                else if (parsed.type === 'result') {
                    if (parsed.result && !content) {
                        content = parsed.result;
                    }
                }
            }
            catch {
                // skip non-JSON lines
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
        // Clean up MCP config
        if (this.mcpConfigPath && fs.existsSync(this.mcpConfigPath)) {
            try {
                fs.unlinkSync(this.mcpConfigPath);
            }
            catch { /* ignore */ }
        }
        console.log('[ClaudeBackend] Disconnected');
    }
}
exports.ClaudeBackend = ClaudeBackend;
//# sourceMappingURL=claude-backend.js.map