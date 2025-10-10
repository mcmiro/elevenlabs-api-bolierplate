import { createContext, useContext } from 'react';

export interface ChatContextType {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
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
