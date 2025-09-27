/**
 * Chat and message-related types
 */

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export type ConversationMode = 'text' | 'audio' | null;
