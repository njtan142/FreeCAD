/**
 * Backend Configuration
 *
 * Loads and manages backend-specific configuration from environment variables.
 */
import { BackendConfig } from './types';
export declare function getBackendConfig(backendName: string): BackendConfig;
export declare function loadOpenCodeConfig(): Record<string, string>;
export declare function validateBackendConfig(backendName: string, config: BackendConfig): string[];
//# sourceMappingURL=backend-config.d.ts.map