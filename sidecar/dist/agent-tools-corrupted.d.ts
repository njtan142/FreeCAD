/**
 * Agent Tools - Custom Tools for Claude Agent SDK
 *
 * Defines custom tools that allow Claude to interact with FreeCAD
 * through the WebSocket bridge.
 */
import { FreeCADBridge } from './freecad-bridge';
/**
 * Set the current session ID
 */
export declare function setCurrentSessionId(sessionId: string | null): void;
/**
 * Get the current session ID
 */
export declare function getCurrentSessionId(): string | null;
/**
 * Creates custom tools for the Claude Agent SDK
 */
export declare function createAgentTools(freeCADBridge: FreeCADBridge): any[];
//# sourceMappingURL=agent-tools-corrupted.d.ts.map