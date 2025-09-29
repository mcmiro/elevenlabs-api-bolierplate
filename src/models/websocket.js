/**
 * WebSocket event utilities and message processing for ElevenLabs service
 */

// WebSocket event types
export const WEBSOCKET_EVENT_TYPES = {
  CONVERSATION_INITIATION: 'conversation_initiation_metadata_event',
  AGENT_RESPONSE: 'agent_response_event',
  LLM_RESPONSE: 'llm_response_event',
  AUDIO: 'audio_event',
  PING: 'ping_event',
  USER_TRANSCRIPT: 'user_transcription_event',
  AGENT_RESPONSE_CORRECTION: 'agent_response_correction_event',
};

// Event processors
export const processConversationInitiation = (eventData) => {
  if (!eventData || !eventData.conversation_id) {
    throw new Error('Invalid conversation initiation event');
  }
  return {
    conversationId: eventData.conversation_id,
  };
};

export const processAgentResponse = (eventData) => {
  if (!eventData) {
    return { response: '' };
  }
  return {
    response: eventData.agent_response || eventData.response || '',
  };
};

export const processLLMResponse = (eventData) => {
  if (!eventData) {
    return { response: '' };
  }
  return {
    response: eventData.response || '',
  };
};

export const processAudioEvent = (eventData) => {
  if (!eventData) {
    return { audio: null, eventId: null };
  }
  return {
    audio: eventData.audio || eventData.audio_base_64 || null,
    eventId: eventData.event_id || null,
  };
};

export const processPingEvent = (eventData) => {
  if (!eventData) {
    return { eventId: null };
  }
  return {
    eventId: eventData.event_id || null,
  };
};

export const processUserTranscript = (eventData) => {
  if (!eventData) {
    return { transcript: '' };
  }
  return {
    transcript: eventData.user_transcript || '',
  };
};

export const processAgentResponseCorrection = (eventData) => {
  if (!eventData) {
    return { original: '', corrected: '' };
  }
  return {
    original: eventData.original || '',
    corrected: eventData.corrected || '',
  };
};

// Main message processor
export const processWebSocketMessage = (rawMessage) => {
  if (!rawMessage || typeof rawMessage !== 'object') {
    throw new Error('Invalid WebSocket message');
  }

  const message = {
    type: rawMessage.type || 'unknown',
    ...rawMessage,
  };

  // Process specific event types
  const processors = {
    [WEBSOCKET_EVENT_TYPES.CONVERSATION_INITIATION]: (msg) => ({
      ...msg,
      conversationInitiation: processConversationInitiation(
        msg.conversation_initiation_metadata_event
      ),
    }),
    [WEBSOCKET_EVENT_TYPES.AGENT_RESPONSE]: (msg) => ({
      ...msg,
      agentResponse: processAgentResponse(msg.agent_response_event),
    }),
    [WEBSOCKET_EVENT_TYPES.LLM_RESPONSE]: (msg) => ({
      ...msg,
      llmResponse: processLLMResponse(msg.llm_response_event),
    }),
    [WEBSOCKET_EVENT_TYPES.AUDIO]: (msg) => ({
      ...msg,
      audio: processAudioEvent(msg.audio_event),
    }),
    [WEBSOCKET_EVENT_TYPES.PING]: (msg) => ({
      ...msg,
      ping: processPingEvent(msg.ping_event),
    }),
    [WEBSOCKET_EVENT_TYPES.USER_TRANSCRIPT]: (msg) => ({
      ...msg,
      userTranscript: processUserTranscript(msg.user_transcription_event),
    }),
    [WEBSOCKET_EVENT_TYPES.AGENT_RESPONSE_CORRECTION]: (msg) => ({
      ...msg,
      agentResponseCorrection: processAgentResponseCorrection(
        msg.agent_response_correction_event
      ),
    }),
  };

  const processor = processors[message.type];
  return processor ? processor(message) : message;
};

// Message validation
export const isValidWebSocketMessage = (message) => {
  return (
    message && typeof message === 'object' && typeof message.type === 'string'
  );
};
