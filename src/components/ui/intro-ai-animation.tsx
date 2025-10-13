import React from 'react';
import { useChatContext } from '../../contexts/chat-context';
import AIAnimation from '../ui/ai-animation';

interface IntroAIAnimationProps {
  size?: string;
  className?: string;
  isMobile?: boolean;
}

export const IntroAIAnimation: React.FC<IntroAIAnimationProps> = ({
  size = '80px',
  className = '',
  isMobile = false,
}) => {
  const { flowStep, setFlowStep, setIsMobileDialogOpen } = useChatContext();

  const handleClick = () => {
    if (flowStep === 'intro') {
      if (isMobile) {
        setIsMobileDialogOpen(true);
      }
      setFlowStep('terms');
    }
  };

  // Only show when in intro state
  if (flowStep !== 'intro') {
    return null;
  }

  return (
    <div
      className={`flex justify-center items-center cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <AIAnimation
        size={size}
        animationDuration={12}
        isRecording={false}
        isPlaying={false}
      />
    </div>
  );
};
