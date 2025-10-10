import type { ReactNode } from 'react';
import React, { useState } from 'react';
import { ChatContext } from './chat-context';

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <ChatContext.Provider value={{ isConnected, setIsConnected }}>
      {children}
    </ChatContext.Provider>
  );
};
