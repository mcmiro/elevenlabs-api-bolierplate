import React, { useEffect, useRef } from 'react';
import micMuteIcon from '../assets/mic-mute.svg';
import micIcon from '../assets/mic.svg';
import { useElevenLabsChat } from '../hooks/use-eleven-labs-chat';
import './chat-interface.css';
import SiriAnimation from './siri-animation';

export const ChatInterface: React.FC = () => {
  const {
    messages,
    inputText,
    isConnected,
    connectionState,
    error,
    flowStep,
    setInputText,
    sendMessage,
    disconnect,
    startNewConversation,
    toggleRecording,
    handleLetDoIt,
    handleAcceptTerms,
    handleCancelTerms,
    handleKeyPress,
    audioManager,
  } = useElevenLabsChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
