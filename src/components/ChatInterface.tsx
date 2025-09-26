import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioManager } from '../hooks/useAudioManager';
import { ElevenLabsService } from '../services/elevenLabsService';
import { testApiKeyManually, testSignedUrlManually } from '../utils/debugApi';
import './ChatInterface.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface Agent {
  agentId: string;
  name: string;
  [key: string]: unknown;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [error, setError] = useState<string>('');

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

    const manualTest = await testApiKeyManually(apiKey);
    if (!manualTest.success) {
      setError(`API key validation failed: ${manualTest.error}`);
      return;
    }

    try {
      setError('');
      const service = new ElevenLabsService(apiKey);
      elevenLabsServiceRef.current = service;

      // Load agents
      const agentList = await service.getAgents();
      setAgents(
        agentList.map((agent) => ({
          ...agent,
          agentId: agent.agentId,
          name: agent.name || 'Unnamed Agent',
        }))
      );

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

      // Test the signed URL manually first
      console.log('Testing signed URL with raw fetch...');
      const signedUrlTest = await testSignedUrlManually(
        apiKey,
        selectedAgentId
      );
      if (!signedUrlTest.success) {
        setError(`Signed URL test failed: ${signedUrlTest.error}`);
        return;
      }

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
            console.error('Failed to play audio:', err);
          }
        },
        onError: (error: Error) => {
          setError(`Connection error: ${error.message}`);
          setIsConnected(false);
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          setIsConnected(state === 'connected');

          // Only set up audio chunk handler when connected
          if (state === 'connected') {
            console.log('Setting up audio chunk handler');
            audioManager.onAudioChunk = (chunk: ArrayBuffer) => {
              elevenLabsServiceRef.current?.sendAudioChunk(chunk);
            };
          } else {
            // Clear audio handler when disconnected
            audioManager.onAudioChunk = undefined;
          }
        },
      });
    } catch (err) {
      setError('Failed to connect to agent');
      console.error('Connection failed:', err);
    }
  };

  const sendMessage = () => {
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
      elevenLabsServiceRef.current.sendTextMessage(inputText);
      setInputText('');
    } catch (err) {
      setError('Failed to send message');
      console.error('Failed to send message:', err);
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
    setMessages([]);
  };

  const toggleRecording = async () => {
    if (!isConnected) {
      setError('Please connect to an agent first');
      return;
    }

    try {
      if (audioManager.isRecording) {
        audioManager.stopRecording();
      } else {
        await audioManager.startRecording();
      }
    } catch (err) {
      setError('Failed to access microphone');
      console.error('Microphone error:', err);
    }
  };

  if (!import.meta.env.VITE_ELEVEN_LABS_API_KEY) {
    return (
      <div className="chat-setup">
        <div className="setup-container">
          <h1>Eleven Labs Chat</h1>
          <div className="error">
            <h3>⚠️ API Key Required</h3>
            <p>
              Please create a <code>.env</code> file in your project root with:
            </p>
            <pre>VITE_ELEVEN_LABS_API_KEY=your_api_key_here</pre>
            <p>
              Get your API key from{' '}
              <a
                href="https://elevenlabs.io/app/settings/api-keys"
                target="_blank"
              >
                Eleven Labs Settings
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="chat-title">
          <h1>Eleven Labs Chat</h1>
          <div className={`connection-status ${connectionState}`}>
            {connectionState}
          </div>
        </div>

        <div className="agent-selector">
          <label htmlFor="agent-select">Agent:</label>
          <select
            id="agent-select"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={isConnected}
          >
            {agents.length === 0 ? (
              <option>Loading agents...</option>
            ) : (
              agents.map((agent) => (
                <option key={agent.agentId} value={agent.agentId}>
                  {agent.name}
                </option>
              ))
            )}
          </select>

          {!isConnected ? (
            <button
              onClick={connectToAgent}
              className="connect-button"
              disabled={agents.length === 0}
            >
              Connect
            </button>
          ) : (
            <button onClick={disconnect} className="disconnect-button">
              Disconnect
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

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

      <div className="chat-input-container">
        <div className="audio-controls">
          <button
            onClick={toggleRecording}
            className={`audio-button ${
              audioManager.isRecording ? 'recording' : ''
            }`}
            disabled={!isConnected}
            title={
              audioManager.isRecording ? 'Stop Recording' : 'Start Recording'
            }
          >
            🎤
          </button>
          {audioManager.isPlaying && (
            <>
              <div className="audio-playing">🔊 Playing...</div>
              <button
                onClick={() => audioManager.stopAudio()}
                className="audio-stop-button"
                title="Stop Audio"
              >
                ⏹️
              </button>
            </>
          )}
        </div>

        <div className="text-input-container">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            disabled={!isConnected}
            className="message-input"
            rows={1}
          />
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
  );
};
