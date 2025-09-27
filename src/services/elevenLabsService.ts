import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import type {
  Agent,
  AgentResponseCorrectionEvent,
  AgentResponseEvent,
  AgentsResponse,
  AudioEvent,
  ConnectionState,
  ConversationInitiationEvent,
  ConversationMode,
  LLMResponseEvent,
  PingEvent,
  RawAgentData,
  ServiceCallbacks,
  UserTranscriptEvent,
  WebSocketMessage,
} from '../models';

export class ElevenLabsService {
  private client: ElevenLabsClient;
  private ws: WebSocket | null = null;
  private onMessage?: (message: string) => void;
  private onAudio?: (audioData: ArrayBuffer) => void;
  private onError?: (error: Error) => void;
  private onConnectionStateChange?: (state: ConnectionState) => void;
  private conversationId?: string;
  private apiKey: string;
  private conversationMode: ConversationMode = null;
  private heartbeatInterval?: number;
  private lastPingTime: number = 0;
  private connectionTimeout?: number;
  private conversationInitiated: boolean = false;

  constructor(apiKey: string) {
    if (!apiKey || !apiKey.startsWith('sk_')) {
      throw new Error('API key must start with "sk_" and be valid');
    }
    this.apiKey = apiKey;
    this.lastPingTime = Date.now();
    this.client = new ElevenLabsClient({ apiKey });
  }

  async getAgents(): Promise<Agent[]> {
    try {
      const apiBaseUrl = import.meta.env.VITE_ELEVEN_LABS_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}convai/agents`, {
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

      // Ensure the response is an array and map it to the expected format
      if (Array.isArray(data)) {
        return data.map((agent: RawAgentData) => ({
          agentId: agent.agent_id || agent.agentId || agent.id || 'unknown',
          name: agent.name || 'Unnamed Agent',
          ...agent,
        }));
      } else if (data.agents && Array.isArray(data.agents)) {
        return (data as AgentsResponse).agents!.map((agent: RawAgentData) => ({
          agentId: agent.agent_id || agent.agentId || agent.id || 'unknown',
          name: agent.name || 'Unnamed Agent',
          ...agent,
        }));
      } else {
        throw new Error('Unexpected response format: agents data not found');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  }

  async connectToAgent(
    agentId: string,
    callbacks: ServiceCallbacks
  ): Promise<void> {
    this.onMessage = callbacks.onMessage;
    this.onAudio = callbacks.onAudio;
    this.onError = callbacks.onError;
    this.onConnectionStateChange = callbacks.onConnectionStateChange;

    try {
      this.onConnectionStateChange?.('connecting');
      const response =
        await this.client.conversationalAi.conversations.getSignedUrl({
          agentId,
        });
      this.ws = new WebSocket(response.signedUrl + '&source=js_sdk');

      this.ws.onopen = () => {
        this.onConnectionStateChange?.('connected');
        this.startHeartbeat();

        // Send conversation initiation immediately upon connection (Official SDK pattern)
        const initEvent = {
          type: 'conversation_initiation_client_data',
          custom_llm_extra_body: {},
          conversation_config_override: {
            tts: {
              speed: 1, // Normal speaking speed (0.7-1.2 range)
            },
          },
          dynamic_variables: {},
        };

        this.ws!.send(JSON.stringify(initEvent));
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
        this.onConnectionStateChange?.('disconnected');
        this.conversationId = undefined;
        this.conversationMode = null;
        this.conversationInitiated = false;

        // Handle different close codes
        if (event.code !== 1000 && event.code !== 1001) {
          this.onError?.(
            new Error(`Connection closed unexpectedly (code: ${event.code})`)
          );
        }
      };

      this.ws.onerror = (error) => {
        this.stopHeartbeat();
        this.onError?.(new Error(`WebSocket connection error ${error}`));
        this.onConnectionStateChange?.('disconnected');
      };
    } catch (error) {
      this.onError?.(error as Error);
      this.onConnectionStateChange?.('disconnected');
      throw error;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'conversation_initiation_metadata': {
        const event =
          message.conversation_initiation_metadata_event as ConversationInitiationEvent;
        this.conversationId = event.conversation_id;
        this.conversationInitiated = true;
        break;
      }
      case 'agent_response': {
        const event = message.agent_response_event as AgentResponseEvent;
        const responseText = event.agent_response || event.response;
        if (responseText && this.onMessage) {
          this.onMessage(responseText);
        }
        break;
      }
      case 'llm_response': {
        const event = message.llm_response_event as LLMResponseEvent;
        if (event.response && this.onMessage) {
          this.onMessage(event.response);
        }
        break;
      }
      case 'audio': {
        const event = message.audio_event as AudioEvent;

        const audioData = event?.audio_base_64 || event?.audio;
        if (audioData && this.onAudio) {
          try {
            const audioBuffer = this.base64ToArrayBuffer(audioData);
            const duration = audioBuffer.byteLength / 2 / 16000; // 16-bit samples at 16kHz

            console.log(
              `🎵 Received audio chunk: ${
                audioBuffer.byteLength
              } bytes (${duration.toFixed(2)}s at 16kHz) - Event ID: ${
                event.event_id || 'none'
              }`
            );

            // Pass to audio queue for proper sequential playback (following official SDK pattern)
            this.onAudio(audioBuffer);
          } catch (error) {
            console.error('❌ Error processing audio chunk:', error);
          }
        }
        break;
      }
      case 'ping': {
        // Handle WebSocket ping messages (keepalive) - respond with pong
        const event = message.ping_event as PingEvent;
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
      case 'user_transcript': {
        // Handle user speech recognition feedback (official SDK pattern)
        const event = message.user_transcript_event as UserTranscriptEvent;
        if (event?.user_transcript && this.onMessage) {
          const transcript = event.user_transcript.trim();
          if (transcript) {
            console.log('🎤 User transcript:', transcript);
            // Could emit this as a different event type if needed
          }
        }
        break;
      }
      case 'agent_response_correction': {
        // Handle agent response corrections (official SDK pattern)
        const event =
          message.agent_response_correction_event as AgentResponseCorrectionEvent;
        if (event?.corrected && this.onMessage) {
          this.onMessage(event.corrected);
        }
        break;
      }
      default:
        // Log unknown message types for debugging
        console.log('🔍 Unknown message type:', message.type, message);
    }
  }

  async sendTextMessage(message: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const textMessage = { type: 'message', message };
    this.ws.send(JSON.stringify(textMessage));
  }

  async sendAudioChunk(audioData: ArrayBuffer): Promise<void> {
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
      throw new Error('Failed to send audio data', error as Error);
    }
  }

  disconnect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.stopHeartbeat();
    this.ws = null;
    this.conversationId = undefined;
    this.conversationMode = null;
    this.conversationInitiated = false;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConversationId(): string | undefined {
    return this.conversationId;
  }

  getLastPingTime(): number {
    return this.lastPingTime;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPingTime = Date.now();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = undefined;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
