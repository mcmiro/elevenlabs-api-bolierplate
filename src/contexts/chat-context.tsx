import { createContext, useContext } from 'react';

export type FlowStep = 'intro' | 'terms' | 'chat';

export interface ChatContextType {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  isMobileDialogOpen: boolean;
  setIsMobileDialogOpen: (open: boolean) => void;
  flowStep: FlowStep;
  setFlowStep: (step: FlowStep) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
