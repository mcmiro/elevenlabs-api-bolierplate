import React, { useEffect, useRef } from 'react';
import { useChatContext } from '../../contexts/chat-context';
import { useElevenLabsChat } from '../../hooks/use-eleven-labs-chat';
import { ChatScreen } from './chat-screen';
import { TermsAndConditions } from './terms-and-conditions';

interface ChatInterfaceProps {
  isMobile?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isMobile = false,
}) => {
  const {
    messages,
    inputText,
    isConnected,
    connectionState,
    setInputText,
    sendMessage,
    resetToIntro,
    resetToIntroWithClearHistory,
    startNewConversation,
    toggleRecording,
    handleAcceptTerms,
    handleCancelTerms,
    handleKeyPress,
    audioManager,
  } = useElevenLabsChat();

  const { setIsConnected, setIsMobileDialogOpen, flowStep } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update context when connection changes
  useEffect(() => {
    setIsConnected(isConnected);
  }, [isConnected, setIsConnected]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Terms and Conditions screen
  if (flowStep === 'terms') {
    return (
      <TermsAndConditions
        onAccept={handleAcceptTerms}
        onCancel={() => {
          handleCancelTerms();
          if (isMobile) {
            setIsMobileDialogOpen(false);
          }
        }}
      />
    );
  }

  // For mobile, only show empty placeholder if we're in intro with no message history
  // This prevents the flash when closing terms but preserves conversation history
  if (isMobile && flowStep === 'intro' && messages.length === 0) {
    return <div className="h-full w-full" />; // Empty placeholder
  }

  // Chat screen
  return (
    <ChatScreen
      messages={messages}
      inputText={inputText}
      isConnected={isConnected}
      connectionState={connectionState}
      setInputText={setInputText}
      sendMessage={sendMessage}
      resetToIntro={resetToIntro}
      startNewConversation={startNewConversation}
      toggleRecording={toggleRecording}
      handleKeyPress={handleKeyPress}
      audioManager={audioManager}
      isMobile={isMobile}
      onMobileClose={
        isMobile
          ? () => {
              resetToIntro();
              setIsMobileDialogOpen(false);
            }
          : undefined
      }
    />
  );
};
