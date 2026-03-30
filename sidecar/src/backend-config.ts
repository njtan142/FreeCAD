/**
 * Backend Configuration
 *
 * Loads and manages backend-specific configuration from environment variables.
 */

import { BackendConfig } from './types';

export function getBackendConfig(backendName: string): BackendConfig {
  switch (backendName) {
    case 'opencode':
      return getOpenCodeConfig();
    case 'minimax':
      return getMiniMaxConfig();
    case 'gemini':
      return getGeminiConfig();
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

function getMiniMaxConfig(): BackendConfig {
  return {
    baseUrl: process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1',
    apiKey: process.env.MINIMAX_API_KEY,
    model: process.env.MINIMAX_MODEL || 'MiniMax-M2.7',
    temperature: process.env.MINIMAX_TEMPERATURE ? parseFloat(process.env.MINIMAX_TEMPERATURE) : undefined,
    maxTokens: process.env.MINIMAX_MAX_TOKENS ? parseInt(process.env.MINIMAX_MAX_TOKENS, 10) : undefined,
  };
}

function getGeminiConfig(): BackendConfig {
  return {
    baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    temperature: process.env.GEMINI_TEMPERATURE ? parseFloat(process.env.GEMINI_TEMPERATURE) : undefined,
    maxTokens: process.env.GEMINI_MAX_TOKENS ? parseInt(process.env.GEMINI_MAX_TOKENS, 10) : undefined,
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
    console.warn('[BackendConfig] Failed to load opencode config from home directory:', err instanceof Error ? err.message : err);
  }

  try {
    const fs = require('fs');
    if (fs.existsSync(localConfigPath)) {
      const fileContent = fs.readFileSync(localConfigPath, 'utf-8');
      const fileConfig = JSON.parse(fileContent);
      Object.assign(config, fileConfig);
    }
  } catch (err) {
    console.warn('[BackendConfig] Failed to load local opencode config:', err instanceof Error ? err.message : err);
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

  if (backendName === 'minimax') {
    if (!config.apiKey && !process.env.MINIMAX_API_KEY) {
      errors.push('MiniMax backend requires MINIMAX_API_KEY environment variable');
    }
  }

  if (backendName === 'gemini') {
    if (!config.apiKey && !process.env.GEMINI_API_KEY) {
      errors.push('Gemini backend requires GEMINI_API_KEY environment variable');
    }
  }

  return errors;
}
