/**
 * Context Injector - Automatic Model State Injection
 *
 * Automatically queries FreeCAD model state and injects context
 * before Claude processes user messages.
 */

import { FreeCADBridge } from './freecad-bridge';
import { ContextInjection, ContextInjectionConfig } from './types';

/**
 * Default configuration for context injection
 */
const DEFAULT_CONFIG: ContextInjectionConfig = {
  queryBeforeOperations: true,
  includeSelectedObjects: true,
  includeDocumentInfo: true,
  maxContextLength: 4000, // Approximate token limit awareness
};

/**
 * Build context injection prompt from current FreeCAD state
 */
export async function buildContextPrompt(
  freeCADBridge: FreeCADBridge,
  config: ContextInjectionConfig = DEFAULT_CONFIG
): Promise<string> {
  const contextParts: string[] = [];

  try {
    // Get document info
    if (config.includeDocumentInfo) {
      const docInfo = await getDocumentInfo(freeCADBridge);
      if (docInfo) {
        contextParts.push(`## Current Document Context\n\n${docInfo}`);
      }
    }

    // Get selected objects
    if (config.includeSelectedObjects) {
      const selection = await getSelection(freeCADBridge);
      if (selection) {
        contextParts.push(`## Selected Objects\n\n${selection}`);
      }
    }

    // Combine all context parts
    if (contextParts.length === 0) {
      return '';
    }

    const fullContext = contextParts.join('\n\n');

    // Truncate if exceeds max length
    if (fullContext.length > config.maxContextLength) {
      return fullContext.substring(0, config.maxContextLength - 200) +
        '\n\n[... context truncated due to length ...]';
    }

    return fullContext;
  } catch (error) {
    console.warn('[ContextInjector] Failed to build context:', error);
    return '';
  }
}

/**
 * Get document information as formatted string
 */
async function getDocumentInfo(freeCADBridge: FreeCADBridge): Promise<string | null> {
  try {
    const code = `
from llm_bridge.query_handlers import handle_get_document_info
import json
result = handle_get_document_info()
print(json.dumps(result))
`.trim();

    const result = await freeCADBridge.executePython(code);
    const parsed = JSON.parse(result.output || '{}');

    if (!parsed.success || !parsed.data) {
      return null;
    }

    const data = parsed.data;
    const lines: string[] = [];
    lines.push(`- **Document**: ${data.label || data.name} (${data.name})`);
    lines.push(`- **Objects**: ${data.objectCount || 0}`);
    lines.push(`- **Modified**: ${data.modified ? 'Yes' : 'No'}`);
    if (data.filePath) {
      lines.push(`- **File**: ${data.filePath}`);
    } else {
      lines.push(`- **File**: (Not saved)`);
    }

    return lines.join('\n');
  } catch (error) {
    console.warn('[ContextInjector] Failed to get document info:', error);
    return null;
  }
}

/**
 * Get selected objects as formatted string
 */
async function getSelection(freeCADBridge: FreeCADBridge): Promise<string | null> {
  try {
    const code = `
from llm_bridge.query_handlers import handle_selection
import json
result = handle_selection()
print(json.dumps(result))
`.trim();

    const result = await freeCADBridge.executePython(code);
    const parsed = JSON.parse(result.output || '{}');

    if (!parsed.success) {
      return null;
    }

    const data = parsed.data;
    if (!data.selected || data.selected.length === 0) {
      return '- (No objects selected)';
    }

    const lines: string[] = [];
    lines.push(`- **Selection Count**: ${data.count || data.selected.length}`);
    lines.push('');
    lines.push('Selected:');

    for (const obj of data.selected) {
      const typeShort = obj.type?.split('.')?.[1] || obj.type || 'Unknown';
      lines.push(`  - ${obj.label || obj.name} (${typeShort})`);
    }

    return lines.join('\n');
  } catch (error) {
    console.warn('[ContextInjector] Failed to get selection:', error);
    return null;
  }
}

/**
 * Determine if context should be injected based on last message
 */
export function shouldInjectContext(lastMessage?: { role: string; content: string }): boolean {
  if (!lastMessage) {
    return true; // Always inject on first message
  }

  // Don't inject context for system messages
  if (lastMessage.role === 'system') {
    return false;
  }

  // Don't inject context for meta-commands about sessions
  const metaKeywords = ['save session', 'load session', 'list sessions', 'delete session'];
  const contentLower = lastMessage.content.toLowerCase();
  if (metaKeywords.some(keyword => contentLower.includes(keyword))) {
    return false;
  }

  return true;
}

/**
 * Get context injection prompt for the current state
 * This is the main entry point for context injection
 */
export async function getContextInjectionPrompt(
  freeCADBridge: FreeCADBridge,
  config: ContextInjectionConfig = DEFAULT_CONFIG
): Promise<string> {
  if (!config.queryBeforeOperations) {
    return '';
  }

  if (!freeCADBridge.isConnected()) {
    // Return a warning message so Claude knows the context may be stale
    return '[WARNING] FreeCAD bridge is not connected. CAD context is unavailable. The model state cannot be queried. Please ensure FreeCAD is running and the bridge is connected.';
  }

  return buildContextPrompt(freeCADBridge, config);
}

/**
 * Create a system message prefix with context
 */
export function createContextMessage(context: string): string {
  if (!context) {
    return '';
  }

  return `[CAD Context Active]\n\n${context}\n\n[End Context]\n`;
}
