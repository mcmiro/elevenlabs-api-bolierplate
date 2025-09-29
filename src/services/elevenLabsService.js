import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export class ElevenLabsService {
  constructor(apiKey) {
    if (!apiKey || !apiKey.startsWith('sk_')) {
      throw new Error('API key must start with "sk_" and be valid');
    }
    this.apiKey = apiKey;
    this.client = new ElevenLabsClient({ apiKey });
    this.ws = null;
    this.onMessage = null;
    this.onAudio = null;
    this.onError = null;
    this.onConnectionStateChange = null;
    this.onUserTranscript = null;
    this.conversationId = null;
    this.conversationMode = null;
    this.heartbeatInterval = null;
    this.lastPingTime = Date.now();
    this.connectionTimeout = null;
    this.conversationInitiated = false;
  }

  async getAgents() {
    try {
      const apiBaseUrl =
        import.meta.env.VITE_ELEVEN_LABS_API_BASE_URL ||
        'https://api.elevenlabs.io';
      const response = await fetch(`${apiBaseUrl}/convai/agents`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch agents: HTTP ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();

      // Handle different response formats
      let agents = [];
      if (Array.isArray(data)) {
        agents = data;
      } else if (data.agents && Array.isArray(data.agents)) {
        agents = data.agents;
      }

      // Normalize agent data
      return agents.map((agent) => ({
        agentId: agent.agent_id || agent.agentId || agent.id || 'unknown',
        name: agent.name || 'Unnamed Agent',
        ...agent,
      }));
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  }

  async connectToAgent(agentId, callbacks = {}) {
    this.onMessage = callbacks.onMessage || (() => {});
    this.onAudio = callbacks.onAudio || (() => {});
    this.onError = callbacks.onError || (() => {});
    this.onConnectionStateChange =
      callbacks.onConnectionStateChange || (() => {});
    this.onUserTranscript = callbacks.onUserTranscript || (() => {});

    try {
      this.onConnectionStateChange('connecting');
      const response =
        await this.client.conversationalAi.conversations.getSignedUrl({
          agentId,
        });

      this.ws = new WebSocket(response.signedUrl + '&source=js_sdk');

      this.ws.onopen = () => {
        this.onConnectionStateChange('connected');
        this.startHeartbeat();

        // Send conversation initiation immediately upon connection
        const initEvent = {
          type: 'conversation_initiation_client_data',
          custom_llm_extra_body: {},
          conversation_config_override: {
            tts: {
              speed: 1, // Normal speaking speed
            },
          },
          dynamic_variables: {},
        };

        this.ws.send(JSON.stringify(initEvent));
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.onConnectionStateChange('disconnected');
        this.conversationId = null;
        this.conversationMode = null;
        this.conversationInitiated = false;

        // Handle different close codes
        if (event.code !== 1000 && event.code !== 1001) {
          this.onError(
            new Error(`Connection closed unexpectedly (code: ${event.code})`)
          );
        }
      };

      this.ws.onerror = (error) => {
        this.stopHeartbeat();
        this.onError(new Error(`WebSocket connection error ${error}`));
        this.onConnectionStateChange('disconnected');
      };
    } catch (error) {
      this.onError(error);
      this.onConnectionStateChange('disconnected');
      throw error;
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'conversation_initiation_metadata': {
        const event = message.conversation_initiation_metadata_event;
        this.conversationId = event?.conversation_id;
        this.conversationInitiated = true;
        break;
      }
      case 'agent_response': {
        const event = message.agent_response_event;
        const responseText = event?.agent_response || event?.response;
        if (responseText && this.onMessage) {
          this.onMessage(responseText);
        }
        break;
      }
      case 'llm_response': {
        const event = message.llm_response_event;
        if (event?.response && this.onMessage) {
          this.onMessage(event.response);
        }
        break;
      }
      case 'audio': {
        const event = message.audio_event;
        const audioData = event?.audio_base_64 || event?.audio;
        if (audioData && this.onAudio) {
          try {
            const audioBuffer = this.base64ToArrayBuffer(audioData);
            // Pass to audio queue for proper sequential playback (following official SDK pattern)
            this.onAudio(audioBuffer);
          } catch (error) {
            console.error('Error processing audio chunk:', error);
          }
        }
        break;
      }
      case 'ping': {
        // Handle WebSocket ping messages (keepalive) - respond with pong
        const event = message.ping_event;
        const eventId = event?.event_id;

        this.lastPingTime = Date.now(); // Update last ping time when we receive a ping
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const pongResponse = {
            type: 'pong',
            event_id: eventId || 'unknown',
          };
          this.ws.send(JSON.stringify(pongResponse));
        }
        break;
      }
      case 'pong': {
        // Handle pong response (not expected from server, but included for completeness)
        this.lastPingTime = Date.now();
        break;
      }
      case 'agent_response_correction': {
        // Handle agent response corrections (official SDK pattern)
        const event = message.agent_response_correction_event;
        if (event?.corrected && this.onMessage) {
          this.onMessage(event.corrected);
        }
        break;
      }
      case 'user_transcript':
      case 'user_transcription_event': {
        const transcript = message.user_transcription_event?.user_transcript;

        if (transcript && this.onUserTranscript) {
          this.onUserTranscript(transcript);
        }
        break;
      }
      default:
        // Check if this is a user transcript message that we might have missed
        if (
          message.user_transcription_event ||
          message.type === 'user_transcription_event'
        ) {
          const event = message.user_transcription_event;
          if (event?.user_transcript && this.onUserTranscript) {
            this.onUserTranscript(event.user_transcript);
          }
        }
    }
  }

  async sendTextMessage(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    // Wait for conversation initiation to complete
    if (!this.conversationInitiated || !this.conversationId) {
      throw new Error('Conversation not initialized');
    }

    // Set conversation mode to text when sending text message
    if (this.conversationMode !== 'text') {
      this.conversationMode = 'text';
    }

    // Use the correct format for ElevenLabs text messages
    const textMessage = {
      type: 'user_message',
      text: message,
    };

    try {
      this.ws.send(JSON.stringify(textMessage));
    } catch (error) {
      throw new Error('Failed to send text message: ' + error.message);
    }
  }

  async sendAudioChunk(audioData) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    // Wait for conversation initiation to complete
    if (!this.conversationInitiated || !this.conversationId) {
      return; // Skip this chunk instead of throwing an error
    }

    // Set conversation mode to audio when first audio chunk is sent
    if (this.conversationMode !== 'audio') {
      this.conversationMode = 'audio';
    }

    // Check WebSocket state before sending
    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Connection lost during audio transmission');
    }

    const base64Audio = this.arrayBufferToBase64(audioData);

    try {
      // Use the exact format from the official ElevenLabs SDK - NO type field
      const audioEvent = {
        user_audio_chunk: base64Audio,
      };

      // Check if WebSocket is still open right before sending
      if (this.ws.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket closed during audio send preparation');
      }

      this.ws.send(JSON.stringify(audioEvent));
    } catch (error) {
      throw new Error('Failed to send audio data: ' + error.message);
    }
  }

  disconnect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.stopHeartbeat();
    this.ws = null;
    this.conversationId = null;
    this.conversationMode = null;
    this.conversationInitiated = false;
  }

  isConnected() {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConversationId() {
    return this.conversationId;
  }

  getLastPingTime() {
    return this.lastPingTime;
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.lastPingTime = Date.now();
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  arrayBufferToBase64(buffer) {
    const uint8Array = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
