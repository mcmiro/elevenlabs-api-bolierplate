import { Mic, MicOff, Send } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useElevenLabsChat } from '../../hooks/use-eleven-labs-chat';
import { cn } from '../../lib/utils';
import AIAnimation from '../ui/ai-animation';
import { Button } from '../ui/button';

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
      <div className="flex justify-center items-center h-available p-5 border-r border-black">
        <div className="p-10 w-full text-center">
          <div
            className="flex justify-center items-center pb-7 cursor-pointer"
            onClick={handleLetDoIt}
          >
            <AIAnimation
              size={'80px'}
              animationDuration={12}
              isRecording={false}
              isPlaying={false}
            />
          </div>
          <h2
            className="cursor-pointer text-gray-800 text-2xl mb-7 font-whyte"
            onClick={handleLetDoIt}
          >
            Lets do it
          </h2>
        </div>
      </div>
    );
  }

  // Second screen: Terms and Conditions
  if (flowStep === 'terms') {
    return (
      <div className="flex justify-center items-center h-available p-5 border-r border-black">
        <div className="p-10 w-full text-center">
          <h2 className="text-gray-800 text-2xl mb-7 font-semibold">
            Terms and conditions
          </h2>
          <div className="border border-black">
            <div className="text-left p-4 px-5 leading-7 text-black">
              <p>
                By clicking "Agree," and each time I interact with this AI
                agent, I consent to the recording, storage, and sharing of my
                communications with third-party service providers, and as
                described in the Privacy Policy. If you do not wish to have your
                conversations recorded, please refrain from using this service.
              </p>
            </div>
            <div className="border-t border-black grid grid-cols-2">
              <Button
                onClick={handleCancelTerms}
                variant="ghost"
                className="py-4 px-7 border-none text-base font-semibold cursor-pointer transition-all duration-300 min-w-[120px] bg-transparent text-black hover:bg-black/20 rounded-none h-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAcceptTerms}
                variant="default"
                className="py-4 px-7 border-none text-base font-semibold cursor-pointer transition-all duration-300 min-w-[120px] bg-black text-white hover:bg-black/80 rounded-none h-auto"
              >
                Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Third screen: Chat interface with connected state
  return (
    <div className="w-full border border-black flex flex-col h-available relative">
      <div className="p-5 text-center border-b border-black">
        <div className="flex items-center justify-center gap-2.5">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              connectionState === 'connecting' && 'bg-yellow-500 animate-pulse',
              connectionState === 'connected' && 'bg-green-500',
              connectionState !== 'connecting' &&
                connectionState !== 'connected' &&
                'bg-red-500'
            )}
          ></div>
          <span className="font-semibold text-gray-800 capitalize">
            {connectionState === 'connected' ? 'Connected' : connectionState}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg m-4 text-sm">
          {error}
        </div>
      )}

      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 w-[120px] h-[120px] flex justify-center items-center">
        <AIAnimation
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
