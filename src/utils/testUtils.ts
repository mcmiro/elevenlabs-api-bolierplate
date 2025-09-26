import { ElevenLabsService } from '../services/elevenLabsService';

/**
 * Utility functions for testing Eleven Labs API connectivity
 */

export const testAPIConnection = async (
  apiKey: string
): Promise<{
  success: boolean;
  error?: string;
  agents?: unknown[];
}> => {
  try {
    const service = new ElevenLabsService(apiKey);
    const agents = await service.getAgents();

    return {
      success: true,
      agents,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const testAgentConnection = async (
  apiKey: string,
  agentId: string
): Promise<{
  success: boolean;
  error?: string;
  conversationId?: string;
}> => {
  return new Promise((resolve) => {
    const service = new ElevenLabsService(apiKey);
    let timeoutId: number | undefined = undefined;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      service.disconnect();
    };

    // Set timeout for connection test
    timeoutId = window.setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        error: 'Connection timeout',
      });
    }, 10000);

    service
      .connectToAgent(agentId, {
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            const conversationId = service.getConversationId();
            cleanup();
            resolve({
              success: true,
              conversationId,
            });
          } else if (state === 'disconnected') {
            cleanup();
            resolve({
              success: false,
              error: 'Failed to connect to agent',
            });
          }
        },
        onError: (error) => {
          cleanup();
          resolve({
            success: false,
            error: error.message,
          });
        },
      })
      .catch((error) => {
        cleanup();
        resolve({
          success: false,
          error: error.message,
        });
      });
  });
};

export const validateEnvironment = (): {
  hasWebSocket: boolean;
  hasMediaDevices: boolean;
  hasAudioContext: boolean;
  warnings: string[];
} => {
  const warnings: string[] = [];

  const hasWebSocket = typeof WebSocket !== 'undefined';
  if (!hasWebSocket) {
    warnings.push('WebSocket is not supported in this browser');
  }

  const hasMediaDevices = !!(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );
  if (!hasMediaDevices) {
    warnings.push('Media devices (microphone) access is not available');
  }

  const hasAudioContext = !!(
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  );
  if (!hasAudioContext) {
    warnings.push('Web Audio API is not supported');
  }

  return {
    hasWebSocket,
    hasMediaDevices,
    hasAudioContext,
    warnings,
  };
};

// Usage examples:
/*
// Test API key and get agents
const apiTest = await testAPIConnection('your-api-key');
if (apiTest.success) {
  console.log('API connected, available agents:', apiTest.agents);
} else {
  console.error('API connection failed:', apiTest.error);
}

// Test connection to specific agent
const agentTest = await testAgentConnection('your-api-key', 'agent-id');
if (agentTest.success) {
  console.log('Agent connected, conversation ID:', agentTest.conversationId);
} else {
  console.error('Agent connection failed:', agentTest.error);
}

// Validate browser environment
const envCheck = validateEnvironment();
if (envCheck.warnings.length > 0) {
  console.warn('Environment warnings:', envCheck.warnings);
}
*/
