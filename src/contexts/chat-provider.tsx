import type { ReactNode } from 'react';
import React, { useState } from 'react';
import { ChatContext, type FlowStep } from './chat-context';

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('intro');

  return (
    <ChatContext.Provider
      value={{
        isConnected,
        setIsConnected,
        isMobileDialogOpen,
        setIsMobileDialogOpen,
        flowStep,
        setFlowStep,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
