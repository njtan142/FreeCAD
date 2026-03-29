"use strict";
/**
 * FreeCAD Bridge - WebSocket Client
 *
 * Connects to FreeCAD's Python WebSocket bridge to execute Python code
 * in the running FreeCAD session.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreeCADBridge = void 0;
const ws_1 = __importDefault(require("ws"));
class FreeCADBridge {
    ws = null;
    config;
    connectionPromise = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 3;
    reconnectDelay = 1000;
    pendingRequests = new Map();
    busyUntilResolved = null;
    constructor(config) {
        this.config = config;
    }
    isConnected() {
        return this.ws !== null && this.ws.readyState === ws_1.default.OPEN;
    }
    async connect() {
        if (this.isConnected()) {
            return Promise.resolve();
        }
        if (this.connectionPromise) {
            return this.connectionPromise;
        }
        this.connectionPromise = new Promise((resolve, reject) => {
            const url = `ws://${this.config.host}:${this.config.port}`;
            console.log(`[FreeCADBridge] Connecting to ${url}...`);
            this.ws = new ws_1.default(url);
            this.ws.on('open', () => {
                console.log('[FreeCADBridge] Connected to FreeCAD Python bridge');
                this.reconnectAttempts = 0;
                resolve();
            });
            this.ws.on('error', (error) => {
                console.error('[FreeCADBridge] Connection error:', error);
                this.connectionPromise = null;
                this.ws = null;
                reject(error);
            });
            this.ws.on('close', () => {
                console.log('[FreeCADBridge] Connection closed');
                this.ws = null;
                this.connectionPromise = null;
                this.attemptReconnect();
            });
            this.ws.on('message', (data) => {
                this.handleMessage(data);
            });
        });
        return this.connectionPromise;
    }
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * this.reconnectAttempts;
            console.log(`[FreeCADBridge] Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
                this.connect().catch((err) => {
                    console.warn('[FreeCADBridge] Reconnect failed:', err.message);
                });
            }, delay);
        }
        else {
            console.warn('[FreeCADBridge] Max reconnect attempts reached');
        }
    }
    handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            console.log('[FreeCADBridge] Received:', message);
            // Handle response for pending request by ID
            console.log('[FreeCADBridge] Checking pending request, message.id:', message.id);
            console.log('[FreeCADBridge] pendingRequests keys:', Array.from(this.pendingRequests.keys()));
            if (message.id && this.pendingRequests.has(message.id)) {
                console.log('[FreeCADBridge] Found matching pending request!');
                const pending = this.pendingRequests.get(message.id);
                clearTimeout(pending.timeout);
                this.pendingRequests.delete(message.id);
                console.log('[FreeCADBridge] Message type field:', message.type);
                console.log('[FreeCADBridge] Message has success:', message.success !== undefined);
                if (message.type === 'result' || message.type === 'response' || message.success !== undefined) {
                    const output = message.stdout || message.output || message.result || '';
                    console.log('[FreeCADBridge] Resolving with success, output length:', output.length);
                    pending.resolve({
                        output: output,
                        success: message.success !== false,
                        error: message.error,
                    });
                }
                else if (message.type === 'error') {
                    console.log('[FreeCADBridge] Resolving with error');
                    pending.resolve({
                        output: '',
                        success: false,
                        error: message.error || 'Unknown error',
                    });
                }
            }
            else {
                console.log('[FreeCADBridge] No matching pending request found!');
            }
        }
        catch (error) {
            console.error('[FreeCADBridge] Failed to parse message:', error);
        }
    }
    onMessage;
    async executePython(code, timeoutMs = 120000) {
        console.log('[FreeCADBridge] executePython called, connected:', this.isConnected());
        if (!this.isConnected()) {
            await this.connect();
        }
        // Wait for any in-flight request to finish before sending a new one.
        // This prevents piling up requests when FreeCAD is busy with heavy geometry.
        if (this.busyUntilResolved) {
            console.log('[FreeCADBridge] Waiting for previous request to complete...');
            try {
                await this.busyUntilResolved;
            }
            catch {
                // Previous request failed/timed out — proceed anyway
            }
        }
        const executionPromise = new Promise((resolve, reject) => {
            console.log('[FreeCADBridge] Promise created, waiting for response...');
            if (!this.ws) {
                reject(new Error('Not connected to FreeCAD bridge'));
                return;
            }
            const requestId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('Execution timeout'));
            }, timeoutMs);
            // Store pending request in Map
            this.pendingRequests.set(requestId, { resolve, reject, timeout });
            // Send execution request with unique ID
            const request = {
                type: 'execute',
                code: code,
                id: requestId,
            };
            console.log('[FreeCADBridge] Sending request with id:', requestId);
            console.log('[FreeCADBridge] Executing Python code...');
            this.ws.send(JSON.stringify(request));
        });
        // Track this as the in-flight request so subsequent calls wait
        this.busyUntilResolved = executionPromise.then(() => { }, () => { });
        return executionPromise;
    }
    async disconnect() {
        return new Promise((resolve) => {
            if (!this.ws) {
                resolve();
                return;
            }
            console.log('[FreeCADBridge] Disconnecting...');
            this.ws.close();
            const timeout = setTimeout(() => {
                this.ws = null;
                resolve();
            }, 2000);
            this.ws.on('close', () => {
                clearTimeout(timeout);
                this.ws = null;
                console.log('[FreeCADBridge] Disconnected');
                resolve();
            });
        });
    }
    getStatus() {
        if (this.isConnected()) {
            return 'connected';
        }
        if (this.connectionPromise) {
            return 'connecting';
        }
        return 'disconnected';
    }
    async getDocumentInfo() {
        const code = `
import json
doc = App.ActiveDocument
if doc:
    result = {
        "name": doc.Name,
        "label": doc.Label,
        "modified": doc.Modified,
        "objectCount": len(doc.Objects)
    }
else:
    result = None
json.dumps(result)
`;
        const response = await this.executePython(code);
        if (response.success && response.output) {
            try {
                return JSON.parse(response.output.trim());
            }
            catch {
                return null;
            }
        }
        return null;
    }
    async getSelectedObjects() {
        const code = `
import json
selection = []
for obj in Gui.Selection.getSelection():
    selection.append({
        "name": obj.Name,
        "label": obj.Label,
        "type": obj.TypeId
    })
json.dumps(selection)
`;
        const response = await this.executePython(code);
        if (response.success && response.output) {
            try {
                return JSON.parse(response.output.trim());
            }
            catch {
                return [];
            }
        }
        return [];
    }
}
exports.FreeCADBridge = FreeCADBridge;
//# sourceMappingURL=freecad-bridge.js.map