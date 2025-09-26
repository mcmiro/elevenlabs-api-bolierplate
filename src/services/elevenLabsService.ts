import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

interface RawAgentData {
  agent_id?: string;
  agentId?: string;
  id?: string;
  name?: string;
  [key: string]: unknown;
}

interface AgentsResponse {
  agents?: RawAgentData[];
  [key: string]: unknown;
}

export class ElevenLabsService {
  private client: ElevenLabsClient;
  private ws: WebSocket | null = null;
  private onMessage?: (message: string) => void;
  private onAudio?: (audioData: ArrayBuffer) => void;
  private onError?: (error: Error) => void;
  private onConnectionStateChange?: (
    state: 'connecting' | 'connected' | 'disconnected'
  ) => void;
  private conversationId?: string;
  private apiKey: string;
  private conversationMode: 'text' | 'audio' | null = null;
  private heartbeatInterval?: number;
  private lastPingTime: number = 0;
  private connectionTimeout?: number;
  private conversationInitiated: boolean = false;

  constructor(apiKey: string) {
    if (!apiKey || !apiKey.startsWith('sk_')) {
      throw new Error('API key must start with "sk_" and be valid');
    }
    this.apiKey = apiKey;
    this.client = new ElevenLabsClient({ apiKey });
  }

  async getAgents(): Promise<
    Array<{ agentId: string; name: string; [key: string]: unknown }>
  > {
    try {
      const response = await fetch(
        'https://api.elevenlabs.io/v1/convai/agents',
        {
          method: 'GET',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

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
    callbacks: {
      onMessage?: (message: string) => void;
      onAudio?: (audioData: ArrayBuffer) => void;
      onError?: (error: Error) => void;
      onConnectionStateChange?: (
        state: 'connecting' | 'connected' | 'disconnected'
      ) => void;
    }
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
        console.log('WebSocket connected');
        this.onConnectionStateChange?.('connected');
        this.startHeartbeat();

        // Send conversation initiation immediately upon connection (Official SDK pattern)
        console.log('🚀 Sending conversation initiation on WebSocket open');
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

        console.log('📤 Sending init event:', JSON.stringify(initEvent));
        console.log('⏰ Send Time:', new Date().toISOString());
        this.ws!.send(JSON.stringify(initEvent));
        console.log(
          '✅ Conversation initiation sent - waiting for confirmation...'
        );
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
        console.log('🚨 WebSocket DISCONNECTED!');
        console.log('📊 Close Code:', event.code);
        console.log('📝 Close Reason:', event.reason);
        console.log('🔍 Conversation State:', {
          conversationId: this.conversationId,
          conversationMode: this.conversationMode,
          conversationInitiated: this.conversationInitiated,
        });
        console.log('⏰ Disconnect Time:', new Date().toISOString());

        this.stopHeartbeat();
        this.onConnectionStateChange?.('disconnected');
        this.conversationId = undefined;
        this.conversationMode = null;
        this.conversationInitiated = false;

        // Handle different close codes
        if (event.code !== 1000 && event.code !== 1001) {
          console.error('❌ Unexpected WebSocket close code:', event.code);
          if (event.code === 1002) {
            console.error(
              '🔍 Code 1002 = Protocol Error - ElevenLabs rejected our message format'
            );
          }
          this.onError?.(
            new Error(`Connection closed unexpectedly (code: ${event.code})`)
          );
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.stopHeartbeat();
        this.onError?.(new Error('WebSocket connection error'));
        this.onConnectionStateChange?.('disconnected');
      };
    } catch (error) {
      console.error('Failed to connect to agent:', error);
      this.onError?.(error as Error);
      this.onConnectionStateChange?.('disconnected');
      throw error;
    }
  }

  private handleMessage(message: Record<string, unknown>): void {
    console.log('📨 Received WebSocket message:', message);

    switch (message.type) {
      case 'conversation_initiation_metadata': {
        const event = message.conversation_initiation_metadata_event as {
          conversation_id: string;
        };
        this.conversationId = event.conversation_id;
        this.conversationInitiated = true;
        console.log('✅ Conversation initiated with ID:', this.conversationId);
        break;
      }
      case 'agent_response': {
        console.log('🤖 Processing agent_response event');
        const event = message.agent_response_event as {
          agent_response?: string;
          response?: string;
        };
        const responseText = event.agent_response || event.response;
        if (responseText && this.onMessage) {
          console.log('✅ Calling onMessage with response:', responseText);
          this.onMessage(responseText);
        } else {
          console.warn(
            '⚠️ No response text found in agent_response event:',
            event
          );
        }
        break;
      }
      case 'llm_response': {
        console.log('🧠 Processing llm_response event');
        const event = message.llm_response_event as { response?: string };
        if (event.response && this.onMessage) {
          console.log(
            '✅ Calling onMessage with LLM response:',
            event.response
          );
          this.onMessage(event.response);
        } else {
          console.warn(
            '⚠️ No response text found in llm_response event:',
            event
          );
        }
        break;
      }
      case 'audio': {
        console.log('🔊 Processing audio event');
        console.log('🔍 Raw audio message:', JSON.stringify(message, null, 2));

        const event = message.audio_event as {
          audio?: string;
          audio_base_64?: string;
        };

        const audioData = event?.audio_base_64 || event?.audio;
        if (audioData && this.onAudio) {
          try {
            console.log('✅ Processing audio data, length:', audioData.length);
            console.log(
              '🔍 Audio data preview:',
              audioData.substring(0, 50) + '...'
            );
            const audioBuffer = this.base64ToArrayBuffer(audioData);
            console.log(
              '🔊 Decoded audio buffer size:',
              audioBuffer.byteLength,
              'bytes'
            );
            this.onAudio(audioBuffer);
          } catch (error) {
            console.error('❌ Error processing audio:', error);
          }
        } else {
          console.warn('⚠️ No audio data found in audio event:', event);
          console.warn(
            '🔍 Available event keys:',
            event ? Object.keys(event) : 'no event'
          );
        }
        break;
      }
      case 'ping': {
        // Handle WebSocket ping messages (keepalive) - respond with pong
        console.log('🏓 Received ping message from server, sending pong');
        console.log('🔍 Full ping message:', JSON.stringify(message));
        const event = message.ping_event as { event_id?: string };
        const eventId = event?.event_id;
        console.log('🔍 Extracted event_id:', eventId);

        this.lastPingTime = Date.now(); // Update last ping time when we receive a ping
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const pongResponse = {
            type: 'pong',
            event_id: eventId || 'unknown',
          };
          console.log('🏓 Sending pong response:', pongResponse);
          console.log('⏰ Pong Send Time:', new Date().toISOString());
          this.ws.send(JSON.stringify(pongResponse));
          console.log('✅ Pong sent successfully');
        }
        break;
      }
      case 'pong': {
        // Handle pong response (not expected from server, but included for completeness)
        console.log('🏓 Received pong message');
        this.lastPingTime = Date.now();
        break;
      }
      default:
        console.log('❓ Unhandled message type:', message.type);
        console.log('📋 Full message:', message);
    }
  }

  async sendTextMessage(message: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    console.log('📤 Sending text message:', message);

    // Since conversation is initiated on connection, we can send messages directly
    if (this.conversationMode === 'audio') {
      console.warn(
        '⚠️ Attempting to send text in audio mode - this may not work as expected'
      );
    }

    if (!this.conversationId) {
      console.log(
        '� Conversation ID not yet available, sending message anyway'
      );
    } else {
      console.log('💬 Using existing conversation ID:', this.conversationId);
    }

    const textMessage = { type: 'message', message };
    console.log('📤 Sending text message payload:', textMessage);
    this.ws.send(JSON.stringify(textMessage));
    console.log('✅ Text message sent successfully');
  }

  async sendAudioChunk(audioData: ArrayBuffer): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(
        '⚠️ WebSocket not connected when trying to send audio chunk'
      );
      throw new Error('WebSocket not connected');
    }

    // Wait for conversation initiation to complete
    if (!this.conversationInitiated || !this.conversationId) {
      console.warn('⚠️ Conversation not yet initiated, skipping audio chunk');
      console.log(
        'Debug - conversationInitiated:',
        this.conversationInitiated,
        'conversationId:',
        this.conversationId
      );
      return; // Skip this chunk instead of throwing an error
    }

    // Set conversation mode to audio when first audio chunk is sent
    if (this.conversationMode !== 'audio') {
      console.log('🎤 Switching to AUDIO conversation mode');
      this.conversationMode = 'audio';
    }

    // Double-check WebSocket state before sending
    if (this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket connection lost during audio chunk send');
      throw new Error('Connection lost during audio transmission');
    }

    const base64Audio = this.arrayBufferToBase64(audioData);
    console.log(
      `🎤 Sending audio chunk: ${audioData.byteLength} bytes -> ${base64Audio.length} base64 chars`
    );

    try {
      // Use the exact format from the official ElevenLabs SDK - NO type field
      const audioEvent = {
        user_audio_chunk: base64Audio,
      };

      console.log(
        '📤 Sending audio event:',
        JSON.stringify(audioEvent).substring(0, 100) + '...'
      );
      console.log('⏰ Audio Send Time:', new Date().toISOString());
      console.log('🔍 WS ReadyState before send:', this.ws.readyState);

      // Check if WebSocket is still open right before sending
      if (this.ws.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket closed between checks!');
        throw new Error('WebSocket closed during audio send preparation');
      }

      this.ws.send(JSON.stringify(audioEvent));
      console.log('✅ Audio chunk sent successfully');

      // Check WebSocket state immediately after send
      if (this.ws.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket closed immediately after send!');
      }
    } catch (error) {
      console.error('❌ Failed to send audio chunk:', error);
      console.error('🔍 WebSocket state after error:', this.ws?.readyState);
      throw new Error('Failed to send audio data');
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
    console.log('🔌 Disconnected and reset conversation state');
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConversationId(): string | undefined {
    return this.conversationId;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat

    console.log(
      '🫀 Starting heartbeat mechanism (passive - responding to server pings)'
    );
    this.lastPingTime = Date.now();

    // Don't send our own pings - just respond to server pings
    // But monitor if we haven't received any pings in a while
    this.heartbeatInterval = window.setInterval(() => {
      const now = Date.now();
      if (now - this.lastPingTime > 120000) {
        // 2 minutes without any pings
        console.warn(
          '⚠️ No ping received in 2 minutes, connection may be stale'
        );
        // Don't close connection, just log warning
      }
    }, 60000); // Check every minute

    console.log('✅ Heartbeat mechanism ready - will respond to server pings');
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      console.log('🫀 Stopping heartbeat mechanism');
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
