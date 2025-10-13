import { Mic, MicOff, Send } from 'lucide-react';
import React, { useRef } from 'react';
import { cn } from '../../lib/utils';
import type { Message } from '../../models';
import AIAnimation from '../ui/ai-animation';
import { Button } from '../ui/button';

interface ChatScreenProps {
  messages: Message[];
  inputText: string;
  isConnected: boolean;
  connectionState: string;
  setInputText: (text: string) => void;
  sendMessage: () => void;
  resetToIntro: () => void;
  startNewConversation: () => void;
  toggleRecording: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  audioManager: {
    isRecording: boolean;
    isPlaying: boolean;
  };
  isMobile?: boolean;
  onMobileClose?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  inputText,
  isConnected,
  connectionState,
  setInputText,
  sendMessage,
  resetToIntro,
  startNewConversation,
  toggleRecording,
  handleKeyPress,
  audioManager,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full border border-black flex flex-col h-screen md:h-full relative">
      <div className="p-5 text-center border-b border-black">
        <div className="flex items-center justify-center gap-2.5">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              connectionState === 'connecting' &&
                'bg-[var(--orange)] animate-pulse',
              connectionState === 'connected' && 'bg-[var(--sea-green)]',
              connectionState !== 'connecting' &&
                connectionState !== 'connected' &&
                'bg-[var(--red-global)]'
            )}
          ></div>
          <span className="font-semibold text-gray-800 capitalize">
            {connectionState === 'connected' ? 'Connected' : connectionState}
          </span>
        </div>
      </div>

      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 w-[120px] h-[120px] flex justify-center items-center">
        <AIAnimation
          size={'120px'}
          animationDuration={15}
          onClick={isConnected ? resetToIntro : startNewConversation}
          onClickTitle={
            isConnected
              ? 'Click to disconnect and return to start'
              : 'Click to start new conversation'
          }
          isRecording={audioManager.isRecording}
          isPlaying={audioManager.isPlaying}
        >
          <div className="flex flex-col items-center justify-center h-full w-full">
            {isConnected ? (
              <span className="text-xs font-semibold uppercase tracking-wider opacity-90 transition-opacity duration-300">
                Stop
              </span>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wider opacity-90 transition-opacity duration-300">
                Start New
              </span>
            )}
          </div>
        </AIAnimation>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 scrollbar-none">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex flex-col max-w-[70%]',
              message.sender === 'user'
                ? 'self-end items-end'
                : 'self-start items-start'
            )}
          >
            <div
              className={cn(
                'px-4 py-3 rounded-2xl break-words leading-6',
                message.sender === 'user'
                  ? 'bg-black/40 text-white rounded-br-sm'
                  : 'bg-transparent text-gray-800 border border-black rounded-bl-sm'
              )}
            >
              {message.text}
            </div>
            <div className="text-xs text-gray-500 mt-1 px-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-black">
        <div className="w-full flex items-end h-15">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Send a message"
            disabled={!isConnected}
            className={cn(
              'flex-1 bg-transparent p-3 px-4 resize-none font-inherit text-xl leading-8 outline-none h-full border-0 border-r border-black',
              !isConnected && 'bg-transparent text-gray-700 cursor-not-allowed'
            )}
            rows={1}
          />
          <Button
            onClick={toggleRecording}
            variant="default"
            disabled={!isConnected}
            className={cn(
              'cursor-pointer transition-all duration-200 aspect-square h-full bg-black text-white flex items-center justify-center border-r border-black rounded-none hover:bg-black/80',
              audioManager.isRecording && 'bg-accent hover:bg-accent/80',
              !isConnected && 'bg-black/30 cursor-not-allowed'
            )}
            title={
              audioManager.isRecording ? 'Stop Recording' : 'Start Recording'
            }
          >
            {!isConnected ? (
              <MicOff className="!w-6 !h-6" />
            ) : audioManager.isRecording ? (
              <Mic className="!w-6 !h-6" />
            ) : (
              <MicOff className="!w-6 !h-6" />
            )}
          </Button>
          <Button
            onClick={sendMessage}
            disabled={!isConnected || !inputText.trim()}
            variant="default"
            className={cn(
              'font-semibold text-lg border-none cursor-pointer transition-all duration-200 aspect-square h-15 bg-black text-white flex items-center justify-center rounded-none hover:bg-black/60',
              (!isConnected || !inputText.trim()) &&
                'bg-black/30 cursor-not-allowed'
            )}
          >
            <Send className="!w-6 !h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};
