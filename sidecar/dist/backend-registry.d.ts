/**
 * Backend Registry
 *
 * Central registry for managing multiple agent backends.
 * Provides backend selection and lifecycle management.
 */
import { AgentBackend } from './agent-backend';
export declare class BackendRegistry {
    private backends;
    private currentBackend;
    register(backend: AgentBackend): void;
    get(name: string): AgentBackend | undefined;
    setCurrent(name: string): boolean;
    getCurrent(): AgentBackend | null;
    listBackends(): Array<{
        name: string;
        description: string;
    }>;
    has(name: string): boolean;
}
export declare const backendRegistry: BackendRegistry;
//# sourceMappingURL=backend-registry.d.ts.map