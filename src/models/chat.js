/**
 * Chat and message-related constants and utilities
 */

// Connection states
export const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
};

// Conversation modes
export const CONVERSATION_MODES = {
  TEXT: 'text',
  AUDIO: 'audio',
  NULL: null,
};

// Message sender types
export const MESSAGE_SENDERS = {
  USER: 'user',
  AGENT: 'agent',
};

// Utility functions for creating messages
export const createMessage = (id, text, sender, timestamp = new Date()) => ({
  id,
  text,
  sender,
  timestamp,
});

export const isValidConnectionState = (state) => {
  return Object.values(CONNECTION_STATES).includes(state);
};

export const isValidConversationMode = (mode) => {
  return Object.values(CONVERSATION_MODES).includes(mode);
};

export const isValidMessageSender = (sender) => {
  return Object.values(MESSAGE_SENDERS).includes(sender);
};
