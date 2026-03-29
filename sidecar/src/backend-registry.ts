/**
 * Backend Registry
 *
 * Central registry for managing multiple agent backends.
 * Provides backend selection and lifecycle management.
 */

import { AgentBackend } from './agent-backend';

export class BackendRegistry {
  private backends: Map<string, AgentBackend> = new Map();
  private currentBackend: AgentBackend | null = null;

  register(backend: AgentBackend): void {
    this.backends.set(backend.name, backend);
    console.log(`[BackendRegistry] Registered backend: ${backend.name}`);
  }

  get(name: string): AgentBackend | undefined {
    return this.backends.get(name);
  }

  setCurrent(name: string): boolean {
    const backend = this.backends.get(name);
    if (backend) {
      this.currentBackend = backend;
      console.log(`[BackendRegistry] Current backend set to: ${name}`);
      return true;
    }
    console.warn(`[BackendRegistry] Backend not found: ${name}`);
    return false;
  }

  getCurrent(): AgentBackend | null {
    return this.currentBackend;
  }

  listBackends(): Array<{ name: string; description: string }> {
    return Array.from(this.backends.values()).map((backend) => ({
      name: backend.name,
      description: backend.description,
    }));
  }

  has(name: string): boolean {
    return this.backends.has(name);
  }
}

export const backendRegistry = new BackendRegistry();
