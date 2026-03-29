/**
 * FreeCAD Bridge - WebSocket Client
 *
 * Connects to FreeCAD's Python WebSocket bridge to execute Python code
 * in the running FreeCAD session.
 */
export interface FreeCADBridgeConfig {
    host: string;
    port: number;
}
export interface ExecuteResult {
    output: string;
    success: boolean;
    error?: string;
}
export declare class FreeCADBridge {
    private ws;
    private config;
    private connectionPromise;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private pendingRequests;
    private busyUntilResolved;
    constructor(config: FreeCADBridgeConfig);
    isConnected(): boolean;
    connect(): Promise<void>;
    private attemptReconnect;
    private handleMessage;
    onMessage?: (message: any) => void;
    executePython(code: string, timeoutMs?: number): Promise<ExecuteResult>;
    disconnect(): Promise<void>;
    getStatus(): 'connected' | 'connecting' | 'disconnected';
    getDocumentInfo(): Promise<{
        name: string;
        label: string;
        modified: boolean;
        objectCount: number;
    } | null>;
    getSelectedObjects(): Promise<Array<{
        name: string;
        label: string;
        type: string;
    }>>;
}
//# sourceMappingURL=freecad-bridge.d.ts.map