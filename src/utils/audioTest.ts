import { useAudioManager } from '../hooks/useAudioManager';
import { ElevenLabsService } from '../services/elevenLabsService';

// Test utility to verify audio conversation functionality
export const testAudioConversation = async (
  apiKey: string,
  agentId: string
) => {
  console.log('🧪 Testing Eleven Labs Audio Conversation...');

  try {
    // Test 1: Verify API key and agents
    console.log('📋 Step 1: Testing API key and agents...');
    const service = new ElevenLabsService(apiKey);
    const agents = await service.getAgents();
    console.log(`✅ Found ${agents.length} agents`);

    // Test 2: Connect to agent
    console.log('🔗 Step 2: Connecting to agent...');
    let connected = false;
    let conversationStarted = false;
    let audioReceived = false;

    await service.connectToAgent(agentId, {
      onMessage: (message: string) => {
        console.log('📝 Received message:', message);
      },
      onAudio: (audioData: ArrayBuffer) => {
        console.log('🔊 Received audio:', audioData.byteLength, 'bytes');
        audioReceived = true;
      },
      onError: (error: Error) => {
        console.error('❌ Connection error:', error);
      },
      onConnectionStateChange: (state) => {
        console.log('🔄 Connection state:', state);
        connected = state === 'connected';
        if (connected) {
          console.log('✅ Connected to agent successfully');
        }
      },
    });

    // Test 3: Wait for connection
    for (let i = 0; i < 50; i++) {
      if (connected) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!connected) {
      throw new Error('Failed to connect to agent');
    }

    // Test 4: Send a test audio message (silence)
    console.log('🎤 Step 3: Sending test audio data...');
    const testAudioData = new ArrayBuffer(1600); // 100ms of 16kHz mono silence
    const int16View = new Int16Array(testAudioData);
    // Fill with small amounts of noise to simulate actual audio
    for (let i = 0; i < int16View.length; i++) {
      int16View[i] = Math.random() * 1000 - 500; // Small random noise
    }

    await service.sendAudioChunk(testAudioData);
    conversationStarted = true;
    console.log('✅ Test audio chunk sent successfully');

    // Test 5: Wait for response
    console.log('⏳ Step 4: Waiting for agent response...');
    for (let i = 0; i < 100; i++) {
      if (audioReceived) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    service.disconnect();

    return {
      success: true,
      results: {
        apiKeyValid: true,
        agentsFound: agents.length,
        connectionSuccessful: connected,
        conversationStarted,
        audioReceived,
      },
    };
  } catch (error) {
    console.error('🔥 Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Test audio manager functionality (should be called from a React component)
export const createAudioManagerTest = () => {
  console.log(
    '🧪 Audio Manager test utility created - call from a React component'
  );

  return async (audioManager: ReturnType<typeof useAudioManager>) => {
    console.log('🧪 Testing Audio Manager...');

    try {
      console.log('🎤 Testing microphone access...');
      await audioManager.startRecording();
      console.log('✅ Recording started successfully');

      // Record for 2 seconds
      let chunkCount = 0;
      audioManager.onAudioChunk = (chunk: ArrayBuffer) => {
        chunkCount++;
        console.log(`📦 Audio chunk ${chunkCount}: ${chunk.byteLength} bytes`);
      };

      await new Promise((resolve) => setTimeout(resolve, 2000));

      audioManager.stopRecording();
      console.log(`✅ Recording stopped. Received ${chunkCount} audio chunks`);

      return {
        success: true,
        chunksReceived: chunkCount,
      };
    } catch (error) {
      console.error('🔥 Audio manager test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
};
