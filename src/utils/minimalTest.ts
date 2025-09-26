/**
 * Minimal test version using exact ElevenLabs SDK patterns
 * This is a simplified version to test the exact conversation flow
 */

const AGENT_ID = 'zqPFQKwPJ8xKOQRxf4L5'; // Replace with your actual agent ID
const API_KEY = 'sk_dc7fbc17f7cec6a3d4c64f7c7b0b4f7a15e6b61e2c30bb95'; // Replace with your actual API key

export class MinimalElevenLabsTest {
  private ws: WebSocket | null = null;
  private conversationId: string | undefined;

  constructor() {}

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${AGENT_ID}&xi-api-key=${API_KEY}`;
      console.log('🔗 Connecting to:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');

        // Send conversation initiation - EXACT format from official SDK
        const initEvent = {
          type: 'conversation_initiation_client_data',
          custom_llm_extra_body: {},
          conversation_config_override: {},
          dynamic_variables: {},
        };

        console.log('📤 Sending init event:', JSON.stringify(initEvent));
        this.ws!.send(JSON.stringify(initEvent));
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📥 Received message:', message);

          switch (message.type) {
            case 'conversation_initiation_metadata':
              console.log('🎯 Got conversation initiation metadata');
              if (
                message.conversation_initiation_metadata_event?.conversation_id
              ) {
                this.conversationId =
                  message.conversation_initiation_metadata_event.conversation_id;
                console.log('✅ Conversation ID:', this.conversationId);

                // Now try sending a simple audio chunk - exact format from SDK
                setTimeout(() => {
                  this.sendTestAudio();
                }, 1000);
              }
              break;

            case 'audio':
              console.log('🔊 Got audio response');
              break;

            case 'ping':
              console.log('🏓 Got ping, sending pong');
              if (message.ping_event?.event_id) {
                const pongEvent = {
                  type: 'pong',
                  event_id: message.ping_event.event_id,
                };
                this.ws!.send(JSON.stringify(pongEvent));
              }
              break;

            default:
              console.log('📝 Other message type:', message.type);
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🚨 WebSocket closed:', event.code, event.reason);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };
    });
  }

  private sendTestAudio(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('❌ WebSocket not ready');
      return;
    }

    // Create a simple test audio chunk - 16kHz 16-bit PCM silence
    const sampleRate = 16000;
    const duration = 0.25; // 250ms
    const samples = Math.floor(sampleRate * duration);
    const audioBuffer = new ArrayBuffer(samples * 2); // 16-bit = 2 bytes per sample
    const audioView = new DataView(audioBuffer);

    // Fill with silence (zeros)
    for (let i = 0; i < samples; i++) {
      audioView.setInt16(i * 2, 0, true); // little-endian
    }

    // Convert to base64
    const bytes = new Uint8Array(audioBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));

    console.log('🎤 Sending test audio chunk:', {
      samples,
      bytes: audioBuffer.byteLength,
      base64Length: base64.length,
    });

    // Send using EXACT format from official SDK - just user_audio_chunk field
    const audioEvent = {
      user_audio_chunk: base64,
    };

    this.ws.send(JSON.stringify(audioEvent));
    console.log('✅ Audio chunk sent');
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Test function
export async function runMinimalTest(): Promise<void> {
  const test = new MinimalElevenLabsTest();

  try {
    await test.connect();
    console.log('✅ Test connection successful');

    // Keep alive for 10 seconds
    setTimeout(() => {
      test.disconnect();
      console.log('🏁 Test completed');
    }, 10000);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
