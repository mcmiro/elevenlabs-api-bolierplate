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
        console.log('WebSocket disconnected', event.code);
        this.onConnectionStateChange?.('disconnected');
        this.conversationId = undefined;
        this.conversationMode = null;
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
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
    console.log('Received message:', message);

    switch (message.type) {
      case 'conversation_initiation_metadata': {
        const event = message.conversation_initiation_metadata_event as {
          conversation_id: string;
        };
        this.conversationId = event.conversation_id;
        console.log('Conversation started:', this.conversationId);
        break;
      }
      case 'agent_response': {
        const event = message.agent_response_event as {
          agent_response?: string;
          response?: string;
        };
        const responseText = event.agent_response || event.response;
        if (responseText && this.onMessage) {
          console.log('Processing agent response:', responseText);
          this.onMessage(responseText);
        }
        break;
      }
      case 'llm_response': {
        const event = message.llm_response_event as { response?: string };
        if (event.response && this.onMessage) {
          console.log('Processing LLM response:', event.response);
          this.onMessage(event.response);
        }
        break;
      }
      case 'audio': {
        const event = message.audio_event as {
          audio?: string;
          audio_base_64?: string;
        };
        const audioData = event.audio || event.audio_base_64;
        if (audioData && this.onAudio) {
          try {
            console.log('Processing audio data, length:', audioData.length);
            const audioBuffer = this.base64ToArrayBuffer(audioData);
            this.onAudio(audioBuffer);
          } catch (error) {
            console.error('Error processing audio:', error);
          }
        }
        break;
      }
      case 'ping': {
        // Handle WebSocket ping messages (keepalive)
        // These are normal and don't need processing
        break;
      }
      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  async sendTextMessage(message: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    if (!this.conversationId) {
      if (this.conversationMode === 'audio') {
        throw new Error(
          'Cannot send text in audio mode - disconnect and reconnect'
        );
      }
      console.log('Starting TEXT conversation');
      this.conversationMode = 'text';
      this.ws.send(
        JSON.stringify({
          type: 'conversation_initiation_client_data',
          custom_llm_extra_body: {},
          conversation_config_override: {},
          dynamic_variables: {},
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.ws.send(JSON.stringify({ type: 'message', message }));
  }

  async sendAudioChunk(audioData: ArrayBuffer): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    if (!this.conversationId) {
      if (this.conversationMode === 'text') {
        throw new Error(
          'Cannot send audio in text mode - disconnect and reconnect'
        );
      }
      console.log('Starting AUDIO conversation');
      this.conversationMode = 'audio';
      this.ws.send(
        JSON.stringify({
          type: 'conversation_initiation_client_data',
          custom_llm_extra_body: {},
          conversation_config_override: {},
          dynamic_variables: {},
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const base64Audio = this.arrayBufferToBase64(audioData);
    this.ws.send(
      JSON.stringify({
        type: 'audio',
        audio_event: { audio: base64Audio },
      })
    );
  }

  disconnect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.ws = null;
    this.conversationId = undefined;
    this.conversationMode = null;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConversationId(): string | undefined {
    return this.conversationId;
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
