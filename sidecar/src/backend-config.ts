/**
 * Backend Configuration
 *
 * Loads and manages backend-specific configuration from environment variables.
 */

import { BackendConfig } from './agent-backend';

export function getBackendConfig(backendName: string): BackendConfig {
  switch (backendName) {
    case 'opencode':
      return getOpenCodeConfig();
    case 'claude':
    default:
      return getClaudeConfig();
  }
}

function getClaudeConfig(): BackendConfig {
  return {
    sessionDir: process.env.CLAUDE_SESSION_DIR || process.cwd(),
    dangerouslySkipPermissions: process.env.CLAUDE_DANGEROUSLY_SKIP_PERMISSIONS !== 'false',
  };
}

function getOpenCodeConfig(): BackendConfig {
  const baseUrl = process.env.OPENAI_BASE_URL ||
    process.env.ANTHROPIC_BASE_URL ||
    process.env.GOOGLE_BASE_URL ||
    'https://api.openai.com/v1';

  const apiKey = process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GOOGLE_API_KEY;

  let model = process.env.OPENAI_MODEL ||
    process.env.ANTHROPIC_MODEL ||
    process.env.GOOGLE_MODEL;

  if (!model) {
    if (baseUrl.includes('openai')) {
      model = 'gpt-4';
    } else if (baseUrl.includes('anthropic')) {
      model = 'claude-3-5-sonnet-20241022';
    } else if (baseUrl.includes('google')) {
      model = 'gemini-2.0-flash';
    }
  }

  return {
    baseUrl,
    apiKey,
    model,
    temperature: process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : undefined,
    maxTokens: process.env.OPENAI_MAX_TOKENS ? parseInt(process.env.OPENAI_MAX_TOKENS, 10) : undefined,
  };
}

export function loadOpenCodeConfig(): Record<string, string> {
  const config: Record<string, string> = {};

  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const opencodeConfigPath = `${homeDir}/.opencode/config`;
  const localConfigPath = './opencode.config.json';

  try {
    const fs = require('fs');
    if (fs.existsSync(opencodeConfigPath)) {
      const fileContent = fs.readFileSync(opencodeConfigPath, 'utf-8');
      const fileConfig = JSON.parse(fileContent);
      Object.assign(config, fileConfig);
    }
  } catch (err) {
    // Config file doesn't exist or is invalid, ignore
  }

  try {
    const fs = require('fs');
    if (fs.existsSync(localConfigPath)) {
      const fileContent = fs.readFileSync(localConfigPath, 'utf-8');
      const fileConfig = JSON.parse(fileContent);
      Object.assign(config, fileConfig);
    }
  } catch (err) {
    // Config file doesn't exist or is invalid, ignore
  }

  return config;
}

export function validateBackendConfig(backendName: string, config: BackendConfig): string[] {
  const errors: string[] = [];

  if (backendName === 'opencode') {
    if (!config.apiKey && !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GOOGLE_API_KEY) {
      errors.push('OpenCode backend requires an API key. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY');
    }
  }

  return errors;
}
