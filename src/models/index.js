/**
 * Central export file for all models
 */

// Re-export all constants and utilities from model modules
export * from './agent.js';
export * from './audio.js';
export * from './chat.js';
export * from './service.js';
export * from './websocket.js';

// Environment configuration utilities
export const getEnvironmentVariable = (key, defaultValue = null) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }

  // Fallback for Node.js environments
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.process &&
    globalThis.process.env
  ) {
    return globalThis.process.env[key] || defaultValue;
  }

  return defaultValue;
};

export const getElevenLabsConfig = () => {
  return {
    apiKey: getEnvironmentVariable('VITE_ELEVEN_LABS_API_KEY'),
    baseUrl: getEnvironmentVariable(
      'VITE_ELEVEN_LABS_API_BASE_URL',
      'https://api.elevenlabs.io'
    ),
  };
};

export const validateEnvironmentConfig = () => {
  const config = getElevenLabsConfig();

  if (!config.apiKey) {
    throw new Error('VITE_ELEVEN_LABS_API_KEY is required');
  }

  return config;
};
