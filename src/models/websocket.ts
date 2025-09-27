/**
 * WebSocket event types and message interfaces for ElevenLabs service
 */

export interface ConversationInitiationEvent {
  conversation_id: string;
}

export interface AgentResponseEvent {
  agent_response?: string;
  response?: string;
}

export interface LLMResponseEvent {
  response?: string;
}

export interface AudioEvent {
  audio?: string;
  audio_base_64?: string;
  event_id?: string;
}

export interface PingEvent {
  event_id?: string;
}

export interface UserTranscriptEvent {
  user_transcript?: string;
}

export interface AgentResponseCorrectionEvent {
  original?: string;
  corrected?: string;
}

export interface WebSocketMessage {
  type: string;
  conversation_initiation_metadata_event?: ConversationInitiationEvent;
  agent_response_event?: AgentResponseEvent;
  llm_response_event?: LLMResponseEvent;
  audio_event?: AudioEvent;
  ping_event?: PingEvent;
  user_transcription_event?: UserTranscriptEvent;
  agent_response_correction_event?: AgentResponseCorrectionEvent;
  [key: string]: unknown;
}
