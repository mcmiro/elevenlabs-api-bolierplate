import React from 'react';
import { useChatContext } from '../../contexts/chat-context';
import { IntroAIAnimation } from '../ui/intro-ai-animation';

export const MobileAIButton: React.FC = () => {
  const { flowStep } = useChatContext();

  // Only show when in intro state
  if (flowStep !== 'intro') {
    return null;
  }

  return (
    <div className="md:hidden p-10 w-full text-center">
      <IntroAIAnimation size="90px" className=" mx-auto" isMobile={true} />
      <h2 className="text-gray-800 text-2xl mt-4 font-whyte">Lets do it</h2>
    </div>
  );
};
