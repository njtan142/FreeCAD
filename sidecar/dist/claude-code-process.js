"use strict";
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
exports.ClaudeCodeSession = void 0;
exports.createClaudeCodeSession = createClaudeCodeSession;
const child_process_1 = require("child_process");
const events_1 = require("events");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ClaudeCodeSession extends events_1.EventEmitter {
    process = null;
    tools;
    config;
    sessionId;
    mcpConfigPath;
    isRunning = false;
    constructor(tools, config = {}) {
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
    generateSessionId() {
        return `freecad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    createMcpConfig() {
        const toolCommands = this.tools.reduce((acc, tool) => {
            acc[`freecad_${tool.name}`] = {
                command: 'npx',
                args: ['ts-node', path.join(__dirname, 'mcp-tool-wrapper.ts'), tool.name],
            };
            return acc;
        }, {});
        const config = {
            mcpServers: toolCommands,
        };
        const configPath = path.join(this.config.sessionDir, '.freecad-mcp.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('[ClaudeCode] MCP config written to:', configPath);
        return configPath;
    }
    getSessionId() {
        return this.sessionId;
    }
    async start() {
        console.log('[ClaudeCode] Starting session:', this.sessionId);
        return Promise.resolve();
    }
    async sendMessage(content) {
        return new Promise((resolve, reject) => {
            const args = [
                '-p',
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
            const proc = (0, child_process_1.spawn)('claude', args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env },
            });
            let stdoutBuffer = '';
            let stderrBuffer = '';
            proc.stdout?.on('data', (data) => {
                stdoutBuffer += data.toString();
            });
            proc.stderr?.on('data', (data) => {
                stderrBuffer += data.toString();
            });
            proc.on('close', (code) => {
                console.log('[ClaudeCode] Process exited with code:', code);
                if (code === 0) {
                    resolve(stdoutBuffer);
                }
                else {
                    console.error('[ClaudeCode] stderr:', stderrBuffer);
                    reject(new Error(`Claude exited with code ${code}`));
                }
            });
            proc.on('error', (err) => {
                reject(err);
            });
            const input = JSON.stringify({ type: 'user', content }) + '\n';
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
    async stop() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
        this.isRunning = false;
        return Promise.resolve();
    }
    isConnected() {
        return this.isRunning;
    }
}
exports.ClaudeCodeSession = ClaudeCodeSession;
function createClaudeCodeSession(tools, config) {
    return new ClaudeCodeSession(tools, config);
}
//# sourceMappingURL=claude-code-process.js.map