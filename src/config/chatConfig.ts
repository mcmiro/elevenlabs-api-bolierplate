// Configuration options for the Eleven Labs Chat Interface

export interface ChatConfig {
  // Audio settings
  audio: {
    sampleRate: number;
    channelCount: number;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    recordingInterval: number; // milliseconds
  };

  // UI settings
  ui: {
    theme: 'light' | 'dark';
    showTimestamps: boolean;
    autoScroll: boolean;
    maxMessages: number;
    showTypingIndicator: boolean;
  };

  // API settings
  api: {
    baseUrl: string;
    timeout: number; // milliseconds
    retryAttempts: number;
  };
}

export const defaultConfig: ChatConfig = {
  audio: {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    recordingInterval: 100,
  },
  ui: {
    theme: 'light',
    showTimestamps: true,
    autoScroll: true,
    maxMessages: 100,
    showTypingIndicator: true,
  },
  api: {
    baseUrl: 'wss://api.elevenlabs.io',
    timeout: 30000,
    retryAttempts: 3,
  },
};

// Agent configuration options
export interface AgentConfig {
  agentId: string;
  name?: string;
  language?: string;
  voice?: {
    voiceId: string;
    stability: number;
    similarityBoost: number;
    style: number;
  };
  conversation?: {
    maxDurationSeconds: number;
    textOnly: boolean;
  };
}

// Conversation initialization data
export interface ConversationConfig {
  customLlmExtraBody?: Record<string, unknown>;
  conversationConfigOverride?: Record<string, unknown>;
  dynamicVariables?: Record<string, unknown>;
}
