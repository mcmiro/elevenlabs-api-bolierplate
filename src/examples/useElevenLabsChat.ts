import { useAudioManager } from '../hooks/useAudioManager';
import { ElevenLabsService } from '../services/elevenLabsService';

// Example of how to use the ElevenLabsService programmatically
export const useElevenLabsChat = () => {
  const audioManager = useAudioManager();

  const createChatSession = async (apiKey: string, agentId: string) => {
    // Initialize service
    const service = new ElevenLabsService(apiKey);

    // Set up audio chunk handler
    audioManager.onAudioChunk = (chunk: ArrayBuffer) => {
      service.sendAudioChunk(chunk);
    };

    // Connect to agent with callbacks
    await service.connectToAgent(agentId, {
      onMessage: (message: string) => {
        console.log('Agent response:', message);
        // Handle agent text response
      },
      onAudio: async (audioData: ArrayBuffer) => {
        // Play agent audio response
        await audioManager.playAudio(audioData);
      },
      onError: (error: Error) => {
        console.error('Chat error:', error);
      },
      onConnectionStateChange: (state) => {
        console.log('Connection state:', state);
      },
    });

    return {
      service,
      audioManager,
      sendMessage: (text: string) => service.sendTextMessage(text),
      startRecording: audioManager.startRecording,
      stopRecording: audioManager.stopRecording,
      disconnect: () => service.disconnect(),
    };
  };

  return { createChatSession, audioManager };
};

// Example usage:
/*
const { createChatSession } = useElevenLabsChat();

const chat = await createChatSession('your-api-key', 'agent-id');

// Send a text message
chat.sendMessage('Hello, how can you help me today?');

// Start voice recording
await chat.startRecording();
// ... user speaks ...
chat.stopRecording();

// Disconnect when done
chat.disconnect();
*/
