import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CONNECTION_STATES,
  createMessage,
  MESSAGE_SENDERS,
} from '../models/index.js';
import { ElevenLabsService } from '../services/elevenLabsService.js';
import { useAudioManager } from './useAudioManager.js';

export const useElevenLabsChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [error, setError] = useState('');
  const [flowStep, setFlowStep] = useState('intro');

  const elevenLabsServiceRef = useRef(null);
  const audioManager = useAudioManager();

  const initializeService = useCallback(async () => {
    const apiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY;

    if (!apiKey?.trim()) {
      setError(
        'API key not found. Please add VITE_ELEVEN_LABS_API_KEY to your .env file'
      );
      return;
    }

    try {
      setError('');
      const service = new ElevenLabsService(apiKey);
      elevenLabsServiceRef.current = service;

      // Load agents
      const agentList = await service.getAgents();

      if (agentList.length > 0 && !selectedAgentId) {
        setSelectedAgentId(agentList[0].agentId);
      }
    } catch (err) {
      setError('Failed to initialize service. Please check your API key.');
      console.error('Service initialization failed:', err);
    }
  }, [selectedAgentId]);

  // Initialize service on hook mount
  useEffect(() => {
    initializeService();
  }, [initializeService]);

  const connectToAgent = useCallback(async () => {
    const apiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY;

    if (!elevenLabsServiceRef.current || !selectedAgentId) {
      setError('Please select an agent');
      return;
    }

    if (!apiKey) {
      setError('API key not found in environment variables');
      return;
    }

    try {
      setError('');

      await elevenLabsServiceRef.current.connectToAgent(selectedAgentId, {
        onMessage: (message) => {
          const newMessage = createMessage(
            Date.now().toString(),
            message,
            MESSAGE_SENDERS.AGENT,
            new Date()
          );
          setMessages((prev) => [...prev, newMessage]);
        },
        onAudio: async (audioData) => {
          try {
            await audioManager.playAudio(audioData);
          } catch (err) {
            console.error('useElevenLabsChat: Failed to play audio:', err);
          }
        },
        onError: () => {
          setIsConnected(false);
        },
        onUserTranscript: (transcript) => {
          const userMessage = createMessage(
            Date.now().toString(),
            transcript,
            MESSAGE_SENDERS.USER,
            new Date()
          );
          setMessages((prev) => [...prev, userMessage]);
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          setIsConnected(state === CONNECTION_STATES.CONNECTED);

          // Only set up audio chunk handler when connected, and auto-start recording
          if (state === CONNECTION_STATES.CONNECTED) {
            const chunkHandler = (chunk) => {
              try {
                if (!elevenLabsServiceRef.current?.isConnected()) {
                  return;
                }
                elevenLabsServiceRef.current?.sendAudioChunk(chunk);
              } catch (error) {
                setError(
                  `Failed to send audio: ${
                    error instanceof Error ? error.message : 'Unknown error'
                  }`
                );
              }
            };

            audioManager.onAudioChunk = chunkHandler;

            // Automatically start recording after connection
            audioManager
              .startRecording()
              .then(() => {
                setError('');
              })
              .catch((err) => {
                console.warn('Could not auto-start recording:', err);
                setError(
                  'Could not start microphone automatically. Click the mic button to start recording.'
                );
              });
          } else {
            // Clear audio handler and stop recording when disconnected
            audioManager.onAudioChunk = undefined;
            audioManager.stopRecording();
          }
        },
      });
    } catch (err) {
      setError('Failed to connect to agent');
      console.error('Connection failed:', err);
    }
  }, [selectedAgentId, audioManager]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !elevenLabsServiceRef.current?.isConnected()) {
      return;
    }

    const userMessage = createMessage(
      Date.now().toString(),
      inputText,
      MESSAGE_SENDERS.USER,
      new Date()
    );

    setMessages((prev) => [...prev, userMessage]);

    try {
      await elevenLabsServiceRef.current.sendTextMessage(inputText);
      setInputText('');
    } catch (err) {
      console.error('useElevenLabsChat: Failed to send message:', err);
      setError('Failed to send message');
    }
  }, [inputText]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const disconnect = useCallback(() => {
    elevenLabsServiceRef.current?.disconnect();
    audioManager.stopRecording();
    audioManager.stopAudio();
    setIsConnected(false);
    setConnectionState(CONNECTION_STATES.DISCONNECTED);
    // Keep conversation history visible and stay on chat screen
  }, [audioManager]);

  const startNewConversation = useCallback(async () => {
    // Reset the conversation state
    setMessages([]);
    setInputText('');
    setError('');

    // Disconnect if currently connected
    if (isConnected) {
      disconnect();
      // Wait a moment for disconnect to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Reconnect to start fresh conversation
    await connectToAgent();
  }, [isConnected, disconnect, connectToAgent]);

  const toggleRecording = useCallback(async () => {
    if (!isConnected) {
      console.warn('useElevenLabsChat: Cannot record - not connected to agent');
      setError('Please connect to an agent first');
      return;
    }

    try {
      if (audioManager.isRecording) {
        audioManager.stopRecording();
      } else {
        // Verify that the audio chunk handler is set up
        if (!audioManager.onAudioChunk) {
          audioManager.onAudioChunk = (chunk) => {
            try {
              elevenLabsServiceRef.current?.sendAudioChunk(chunk);
            } catch (error) {
              console.error(
                '❌ useElevenLabsChat: Failed to send audio chunk:',
                error
              );
            }
          };
        }

        await audioManager.startRecording();
        // Clear any previous errors when recording starts successfully
        setError('');
      }
    } catch (err) {
      const errorMessage =
        'Failed to access microphone. Please check permissions.';
      setError(errorMessage);
      console.error('useElevenLabsChat: Microphone error:', err);
    }
  }, [isConnected, audioManager]);

  const handleLetDoIt = useCallback(() => {
    setFlowStep('terms');
  }, []);

  const handleAcceptTerms = useCallback(async () => {
    setFlowStep('chat');
    // Initialize the service and connect automatically
    await connectToAgent();
  }, [connectToAgent]);

  const handleCancelTerms = useCallback(() => {
    setFlowStep('intro');
  }, []);

  return {
    // State
    messages,
    inputText,
    isConnected,
    connectionState,
    selectedAgentId,
    error,
    flowStep,

    // Actions
    setInputText,
    setSelectedAgentId,
    sendMessage,
    connectToAgent,
    disconnect,
    startNewConversation,
    toggleRecording,
    handleLetDoIt,
    handleAcceptTerms,
    handleCancelTerms,

    // Utilities
    handleKeyPress,

    // Audio manager instance
    audioManager,
  };
};
