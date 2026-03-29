"use strict";
/**
 * Backend Registry
 *
 * Central registry for managing multiple agent backends.
 * Provides backend selection and lifecycle management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.backendRegistry = exports.BackendRegistry = void 0;
class BackendRegistry {
    backends = new Map();
    currentBackend = null;
    register(backend) {
        this.backends.set(backend.name, backend);
        console.log(`[BackendRegistry] Registered backend: ${backend.name}`);
    }
    get(name) {
        return this.backends.get(name);
    }
    setCurrent(name) {
        const backend = this.backends.get(name);
        if (backend) {
            this.currentBackend = backend;
            console.log(`[BackendRegistry] Current backend set to: ${name}`);
            return true;
        }
        console.warn(`[BackendRegistry] Backend not found: ${name}`);
        return false;
    }
    getCurrent() {
        return this.currentBackend;
    }
    listBackends() {
        return Array.from(this.backends.values()).map((backend) => ({
            name: backend.name,
            description: backend.description,
        }));
    }
    has(name) {
        return this.backends.has(name);
    }
}
exports.BackendRegistry = BackendRegistry;
exports.backendRegistry = new BackendRegistry();
//# sourceMappingURL=backend-registry.js.map