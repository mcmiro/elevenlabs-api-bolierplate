import React, { useCallback, useEffect, useRef, useState } from 'react';
import micMuteIcon from '../assets/mic-mute.svg';
import micIcon from '../assets/mic.svg';
import { useAudioManager } from '../hooks/useAudioManager';
import type { ConnectionState, Message } from '../models';
import { ElevenLabsService } from '../services/elevenLabsService';
import './ChatInterface.css';
import SiriAnimation from './siriAnimation';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [error, setError] = useState<string>('');

  // New state for the multi-step flow
  const [flowStep, setFlowStep] = useState<'intro' | 'terms' | 'chat'>('intro');

  const elevenLabsServiceRef = useRef<ElevenLabsService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioManager = useAudioManager();

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Initialize service on component mount
  useEffect(() => {
    initializeService();
  }, [initializeService]);

  const connectToAgent = async () => {
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
        onMessage: (message: string) => {
          const newMessage: Message = {
            id: Date.now().toString(),
            text: message,
            sender: 'agent',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, newMessage]);
        },
        onAudio: async (audioData: ArrayBuffer) => {
          try {
            await audioManager.playAudio(audioData);
          } catch (err) {
            console.error('ChatInterface: Failed to play audio:', err);
          }
        },
        onError: () => {
          setIsConnected(false);
        },
        onUserTranscript: (transcript: string) => {
          const userMessage: Message = {
            id: Date.now().toString(),
            text: transcript,
            sender: 'user',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, userMessage]);
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          setIsConnected(state === 'connected');

          // Only set up audio chunk handler when connected, and auto-start recording
          if (state === 'connected') {
            const chunkHandler = (chunk: ArrayBuffer) => {
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
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !elevenLabsServiceRef.current?.isConnected()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      await elevenLabsServiceRef.current.sendTextMessage(inputText);
      setInputText('');
    } catch (err) {
      console.error('ChatInterface: Failed to send message:', err);
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const disconnect = () => {
    elevenLabsServiceRef.current?.disconnect();
    audioManager.stopRecording();
    audioManager.stopAudio();
    setIsConnected(false);
    setConnectionState('disconnected');
    // Keep conversation history visible and stay on chat screen
    // Don't reset flow step - stay on 'connected' screen
  };

  const startNewConversation = async () => {
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
  };

  const toggleRecording = async () => {
    if (!isConnected) {
      console.warn('ChatInterface: Cannot record - not connected to agent');
      setError('Please connect to an agent first');
      return;
    }

    try {
      if (audioManager.isRecording) {
        audioManager.stopRecording();
      } else {
        // Verify that the audio chunk handler is set up
        if (!audioManager.onAudioChunk) {
          audioManager.onAudioChunk = (chunk: ArrayBuffer) => {
            try {
              elevenLabsServiceRef.current?.sendAudioChunk(chunk);
            } catch (error) {
              console.error(
                '❌ ChatInterface: Failed to send audio chunk:',
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
      console.error('ChatInterface: Microphone error:', err);
    }
  };

  const handleLetDoIt = () => {
    setFlowStep('terms');
  };

  const handleAcceptTerms = async () => {
    setFlowStep('chat');
    // Initialize the service and connect automatically
    await connectToAgent();
  };

  const handleCancelTerms = () => {
    setFlowStep('intro');
  };

  // First screen: Introduction
  if (flowStep === 'intro') {
    return (
      <div className="flow-screen intro-screen">
        <div className="flow-container">
          <div className="intro-icon" onClick={handleLetDoIt}>
            <SiriAnimation
              size={'80px'}
              animationDuration={12}
              isConnected={false}
              isRecording={false}
              isPlaying={false}
            />
          </div>
          <h2 className="cursor-pointer" onClick={handleLetDoIt}>
            Lets do it
          </h2>
        </div>
      </div>
    );
  }

  // Second screen: Terms and Conditions
  if (flowStep === 'terms') {
    return (
      <div className="flow-screen terms-screen">
        <div className="flow-container">
          <h2>Terms and conditions</h2>
          <div className="terms-container">
            <div className="terms-content">
              <p>
                By clicking "Agree," and each time I interact with this AI
                agent, I consent to the recording, storage, and sharing of my
                communications with third-party service providers, and as
                described in the Privacy Policy. If you do not wish to have your
                conversations recorded, please refrain from using this service.
              </p>
            </div>
            <div className="terms-buttons">
              <button
                onClick={handleCancelTerms}
                className="flow-button secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptTerms}
                className="flow-button primary"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Third screen: Chat interface with connected state
  return (
    <div className="chat-interface connected-state">
      <div className="connected-header">
        <div className="connection-indicator">
          <div className={`status-dot ${connectionState}`}></div>
          <span className="connection-text">
            {connectionState === 'connected' ? 'Connected' : connectionState}
          </span>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="audio-visual">
        <SiriAnimation
          size={'120px'}
          animationDuration={15}
          onClick={isConnected ? disconnect : startNewConversation}
          onClickTitle={
            isConnected
              ? 'Click to disconnect'
              : 'Click to start new conversation'
          }
          isRecording={audioManager.isRecording}
          isPlaying={audioManager.isPlaying}
          isConnected={isConnected}
        >
          <div className="siri-overlay-content">
            {isConnected ? (
              <span className="action-text">Stop</span>
            ) : (
              <span className="action-text">Start New</span>
            )}
          </div>
        </SiriAnimation>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">{message.text}</div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="conversation-controls">
        <div className="voice-interface">
          <div className="text-input-container">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Send a message"
              disabled={!isConnected}
              className="message-input"
              rows={1}
            />
            <button
              onClick={toggleRecording}
              className={`voice-button ${
                audioManager.isRecording ? 'recording' : ''
              }`}
              disabled={!isConnected}
              title={
                audioManager.isRecording ? 'Stop Recording' : 'Start Recording'
              }
            >
              <img
                src={
                  !isConnected
                    ? micMuteIcon
                    : audioManager.isRecording
                    ? micIcon
                    : micMuteIcon
                }
                alt={
                  isConnected
                    ? audioManager.isRecording
                      ? 'Stop Recording'
                      : 'Start Recording'
                    : 'Microphone not available'
                }
                width="20"
                height="20"
              />
            </button>
            <button
              onClick={sendMessage}
              disabled={!isConnected || !inputText.trim()}
              className="send-button"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
