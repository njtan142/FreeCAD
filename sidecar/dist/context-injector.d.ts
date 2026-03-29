/**
 * Context Injector - Automatic Model State Injection
 *
 * Automatically queries FreeCAD model state and injects context
 * before Claude processes user messages.
 */
import { FreeCADBridge } from './freecad-bridge';
import { ContextInjectionConfig } from './types';
/**
 * Build context injection prompt from current FreeCAD state
 */
export declare function buildContextPrompt(freeCADBridge: FreeCADBridge, config?: ContextInjectionConfig): Promise<string>;
/**
 * Determine if context should be injected based on last message
 */
export declare function shouldInjectContext(lastMessage?: {
    role: string;
    content: string;
}): boolean;
/**
 * Get context injection prompt for the current state
 * This is the main entry point for context injection
 */
export declare function getContextInjectionPrompt(freeCADBridge: FreeCADBridge, config?: ContextInjectionConfig): Promise<string>;
/**
 * Create a system message prefix with context
 */
export declare function createContextMessage(context: string): string;
//# sourceMappingURL=context-injector.d.ts.map