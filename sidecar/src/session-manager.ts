/**
 * Session Manager - Conversation History Persistence
 *
 * Manages chat session storage and lifecycle. Sessions are stored as JSON files
 * in a platform-specific directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ChatSession, ChatMessage, SessionSummary } from './types';

/**
 * Get the platform-specific directory for storing sessions
 */
export function getSessionDir(): string {
  let sessionDir: string;

  switch (process.platform) {
    case 'win32':
      sessionDir = process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming');
      return path.join(sessionDir, 'FreeCAD-LLM', 'sessions');
    case 'darwin':
      sessionDir = process.env.HOME || '';
      return path.join(sessionDir, 'Library', 'Application Support', 'FreeCAD-LLM', 'sessions');
    case 'linux':
      sessionDir = process.env.XDG_DATA_HOME || path.join(process.env.HOME || '', '.local', 'share');
      return path.join(sessionDir, 'freecad-llm', 'sessions');
    default:
      // Fallback to current directory
      return path.join(process.cwd(), 'sessions');
  }
}

/**
 * Get the full path to a session file
 */
export function getSessionFile(sessionId: string): string {
  return path.join(getSessionDir(), `${sessionId}.json`);
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a session name from the first user message
 */
function generateSessionName(firstMessage: string, maxLength: number = 50): string {
  // Take first line, trim, and truncate
  let name = firstMessage.split('\n')[0].trim();
  if (name.length > maxLength) {
    name = name.substring(0, maxLength - 3) + '...';
  }
  return name || 'Untitled Session';
}

/**
 * Ensure the session directory exists
 */
function ensureSessionDir(): void {
  const dir = getSessionDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Create a new chat session
 */
export function createSession(name: string, documentPath?: string): ChatSession {
  const sessionId = generateSessionId();
  const now = Date.now();

  const session: ChatSession = {
    id: sessionId,
    name: name || 'Untitled Session',
    createdAt: now,
    updatedAt: now,
    messages: [],
    documentPath,
  };

  // Save initial session
  saveSession(session);

  return session;
}

/**
 * Load a session from disk
 */
export function loadSession(sessionId: string): ChatSession | null {
  try {
    const sessionFile = getSessionFile(sessionId);
    if (!fs.existsSync(sessionFile)) {
      return null;
    }

    const data = fs.readFileSync(sessionFile, 'utf-8');
    return JSON.parse(data) as ChatSession;
  } catch (error) {
    console.error(`[SessionManager] Failed to load session ${sessionId}:`, error);
    return null;
  }
}

/**
 * Save a session to disk
 */
export function saveSession(session: ChatSession): void {
  try {
    ensureSessionDir();
    const sessionFile = getSessionFile(session.id);
    session.updatedAt = Date.now();
    fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2), 'utf-8');
  } catch (error) {
    console.error(`[SessionManager] Failed to save session ${session.id}:`, error);
    throw error;
  }
}

/**
 * Delete a session
 */
export function deleteSession(sessionId: string): boolean {
  try {
    const sessionFile = getSessionFile(sessionId);
    if (fs.existsSync(sessionFile)) {
      fs.unlinkSync(sessionFile);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[SessionManager] Failed to delete session ${sessionId}:`, error);
    return false;
  }
}

/**
 * List all available sessions (metadata only)
 */
export function listSessions(limit: number = 10): SessionSummary[] {
  try {
    const sessionDir = getSessionDir();
    if (!fs.existsSync(sessionDir)) {
      return [];
    }

    const files = fs.readdirSync(sessionDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const sessionId = file.replace('.json', '');
        return { sessionId, file };
      });

    // Read session metadata
    const sessions: SessionSummary[] = [];
    for (const { sessionId, file } of files) {
      try {
        const sessionPath = path.join(sessionDir, file);
        const data = fs.readFileSync(sessionPath, 'utf-8');
        const session = JSON.parse(data) as ChatSession;
        sessions.push({
          id: session.id,
          name: session.name,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: session.messages.length,
          documentPath: session.documentPath,
        });
      } catch (error) {
        console.warn(`[SessionManager] Failed to read session ${sessionId}:`, error);
      }
    }

    // Sort by updatedAt descending and limit
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    return sessions.slice(0, limit);
  } catch (error) {
    console.error('[SessionManager] Failed to list sessions:', error);
    return [];
  }
}

/**
 * Get messages from a session
 */
export function getMessages(sessionId: string, limit?: number): ChatMessage[] {
  const session = loadSession(sessionId);
  if (!session) {
    return [];
  }

  if (limit === undefined) {
    return session.messages;
  }

  return session.messages.slice(-limit);
}

/**
 * Update session name
 */
export function updateSessionName(sessionId: string, name: string): void {
  const session = loadSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  session.name = name;
  saveSession(session);
}

/**
 * Auto-generate session name from first message if not set
 */
export function autoNameSession(sessionId: string): void {
  const session = loadSession(sessionId);
  if (!session || session.name !== 'Untitled Session') {
    return;
  }

  const firstUserMessage = session.messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    session.name = generateSessionName(firstUserMessage.content);
    saveSession(session);
  }
}

// ============================================================================
// Race Condition Fix: Message Queue for Concurrent Access
// ============================================================================

/**
 * Message queue to prevent race conditions in concurrent message writes.
 * Maps sessionId -> queue of pending message operations.
 */
const messageQueue = new Map<string, Promise<void>>();

/**
 * Add a message to a session with race condition protection.
 * Uses a per-session queue to serialize writes.
 */
export async function addMessage(sessionId: string, message: ChatMessage): Promise<void> {
  // Get or create the queue for this session
  const existingQueue = messageQueue.get(sessionId) || Promise.resolve();

  // Chain the new operation onto the existing queue
  const newOperation = existingQueue.then(async () => {
    const session = loadSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.messages.push(message);
    saveSession(session);
  }).catch((error) => {
    console.error(`[SessionManager] Failed to add message to session ${sessionId}:`, error);
    throw error;
  });

  // Update the queue reference
  messageQueue.set(sessionId, newOperation);

  // Wait for this operation to complete
  await newOperation;

  // Clean up the queue when empty (optional optimization)
  if (newOperation === messageQueue.get(sessionId)) {
    messageQueue.delete(sessionId);
  }
}
