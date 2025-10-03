import type {
  Agent,
  AgentResponseCorrectionEvent,
  AgentResponseEvent,
  AudioEvent,
  ConnectionState,
  ConversationInitiationEvent,
  ConversationMode,
  LLMResponseEvent,
  PingEvent,
  ServiceCallbacks,
  UserTranscriptEvent,
  WebSocketMessage,
} from '../models';

export class ElevenLabsService {
  private ws: WebSocket | null = null;
  private onMessage?: (message: string) => void;
  private onAudio?: (audioData: ArrayBuffer) => void;
  private onError?: (error: Error) => void;
  private onConnectionStateChange?: (state: ConnectionState) => void;
  private onUserTranscript?: (transcript: string) => void;
  private conversationId?: string;
  private backendUrl: string;
  private conversationMode: ConversationMode = null;
  private heartbeatInterval?: number;
  private lastPingTime: number = 0;
  private connectionTimeout?: number;
  private conversationInitiated: boolean = false;

  constructor() {
    this.backendUrl =
      import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    this.lastPingTime = Date.now();
  }

  async getAgents(): Promise<Agent[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/agents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch agents: HTTP ${response.status}: ${errorText}`
        );
      }

      const agents = await response.json();

      // The backend already normalizes the response format
      return agents;
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw new Error(
        `Failed to fetch agents: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
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
    this.onUserTranscript = callbacks.onUserTranscript;

    try {
      this.onConnectionStateChange?.('connecting');

      // Get signed URL from our backend
      const response = await fetch(
        `${this.backendUrl}/api/agents/${agentId}/connect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get connection URL: ${errorText}`);
      }

      const { signedUrl } = await response.json();
      this.ws = new WebSocket(signedUrl);

      this.ws.onopen = () => {
        this.onConnectionStateChange?.('connected');
        this.startHeartbeat();

        // Send conversation initiation message
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const initEvent = {
              type: 'conversation_initiation_client_data',
            };
            this.ws!.send(JSON.stringify(initEvent));
          }
        }, 100);
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

        // Handle different close codes with more detailed error reporting
        if (event.code !== 1000 && event.code !== 1001) {
          let errorMessage = `Connection closed unexpectedly (code: ${event.code})`;

          // Provide more specific error messages based on close codes
          switch (event.code) {
            case 1002:
              errorMessage = 'Protocol error - invalid WebSocket frame';
              break;
            case 1003:
              errorMessage = 'Data type error - unsupported data received';
              break;
            case 1006:
              errorMessage =
                'Connection lost abnormally - possible network issue';
              break;
            case 1007:
              errorMessage = 'Invalid data format - check message encoding';
              break;
            case 1008:
              errorMessage =
                'Policy violation - message violated server policy';
              break;
            case 1009:
              errorMessage = 'Message too large - reduce audio chunk size';
              break;
            case 1011:
              errorMessage = 'Server error - internal server problem';
              break;
            case 1012:
              errorMessage = 'Service restart - server is restarting';
              break;
            case 1013:
              errorMessage = 'Try again later - server temporarily unavailable';
              break;
            case 1015:
              errorMessage = 'TLS handshake failure - security issue';
              break;
            default:
              if (event.reason) {
                errorMessage += `: ${event.reason}`;
              }
          }

          console.error('WebSocket closed:', errorMessage);
          this.onError?.(new Error(errorMessage));
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
        const event = message.ping_event as PingEvent;
        const eventId = event?.event_id;

        this.lastPingTime = Date.now(); // Update last ping time when we receive a ping

        // Reset connection timeout since we received a ping
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = window.setTimeout(() => {
            const timeSinceLastPing = Date.now() - this.lastPingTime;
            if (timeSinceLastPing > 60000) {
              console.warn(
                'Connection timeout - no ping received for 60 seconds'
              );
              this.onError?.(new Error('Connection timeout'));
              this.disconnect();
            }
          }, 60000);
        }

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
        const event =
          message.agent_response_correction_event as AgentResponseCorrectionEvent;
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
          const event = message.user_transcription_event as UserTranscriptEvent;
          if (event?.user_transcript && this.onUserTranscript) {
            this.onUserTranscript(event.user_transcript);
          }
        }
    }
  }

  async sendTextMessage(message: string): Promise<void> {
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

    // Use the correct format for ElevenLabs text messages (following official SDK pattern)
    const textMessage = {
      type: 'user_message',
      text: message,
    };

    try {
      this.ws.send(JSON.stringify(textMessage));
    } catch (error) {
      throw new Error('Failed to send text message', error as Error);
    }
  }

  async sendAudioChunk(audioData: ArrayBuffer): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return; // Skip chunk if not connected
    }

    // Wait for conversation initiation to complete
    if (!this.conversationInitiated || !this.conversationId) {
      return; // Skip this chunk
    }

    // Set conversation mode to audio when first audio chunk is sent
    if (this.conversationMode !== 'audio') {
      this.conversationMode = 'audio';
    }

    // Check WebSocket state before sending
    if (this.ws.readyState !== WebSocket.OPEN) {
      return; // Skip chunk if connection lost
    }

    const base64Audio = this.arrayBufferToBase64(audioData);

    try {
      const audioEvent = {
        user_audio_chunk: base64Audio,
      };

      // Final check if WebSocket is still open
      if (this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      this.ws.send(JSON.stringify(audioEvent));
    } catch {
      // Silently handle audio send errors to prevent breaking the stream
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

    // Set up ping interval - send ping every 30 seconds
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const pingEvent = {
          type: 'ping',
          event_id: `ping_${Date.now()}`,
        };
        this.ws.send(JSON.stringify(pingEvent));
      }
    }, 30000);

    // Set up connection timeout - if no ping received in 60 seconds, consider connection dead
    this.connectionTimeout = window.setTimeout(() => {
      const timeSinceLastPing = Date.now() - this.lastPingTime;
      if (timeSinceLastPing > 60000) {
        console.warn('Connection timeout - no ping received for 60 seconds');
        this.onError?.(new Error('Connection timeout'));
        this.disconnect();
      }
    }, 60000);
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
