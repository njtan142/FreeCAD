/**
 * Session Manager - Conversation History Persistence
 *
 * Manages chat session storage and lifecycle. Sessions are stored as JSON files
 * in a platform-specific directory.
 */
import { ChatSession, ChatMessage, SessionSummary } from './types';
/**
 * Get the platform-specific directory for storing sessions
 */
export declare function getSessionDir(): string;
/**
 * Get the full path to a session file
 */
export declare function getSessionFile(sessionId: string): string;
/**
 * Create a new chat session
 */
export declare function createSession(name: string, documentPath?: string): ChatSession;
/**
 * Load a session from disk
 */
export declare function loadSession(sessionId: string): ChatSession | null;
/**
 * Save a session to disk
 */
export declare function saveSession(session: ChatSession): void;
/**
 * Delete a session
 */
export declare function deleteSession(sessionId: string): boolean;
/**
 * List all available sessions (metadata only)
 */
export declare function listSessions(limit?: number): SessionSummary[];
/**
 * Get messages from a session
 */
export declare function getMessages(sessionId: string, limit?: number): ChatMessage[];
/**
 * Update session name
 */
export declare function updateSessionName(sessionId: string, name: string): void;
/**
 * Auto-generate session name from first message if not set
 */
export declare function autoNameSession(sessionId: string): void;
/**
 * Add a message to a session with race condition protection.
 * Uses a per-session queue to serialize writes.
 */
export declare function addMessage(sessionId: string, message: ChatMessage): Promise<void>;
//# sourceMappingURL=session-manager.d.ts.map