import { ArrowLeft } from 'lucide-react';
import { useChatContext } from '../../contexts/chat-context';
import { ChatProvider } from '../../contexts/chat-provider';
import { ChatInterface } from '../chat';
import { MobileAIButton } from '../chat/mobile-ai-button';
import { MobileChatDialog } from '../chat/mobile-chat-dialog';
import { IntroAIAnimation } from '../ui/intro-ai-animation';
import Logo from '../ui/logo';
import Typography from '../ui/typography';
import AnimatedText from './animated-text';
import ChatLinks from './chat-links';
import { TopBar } from './top-bar';

const HeroContent = () => {
  const { flowStep } = useChatContext();

  return (
    <>
      <header className="relative">
        <div className="absolute top-0 w-full z-50">
          <TopBar />
        </div>
        <div className="flex flex-col md:grid md:grid-cols-3 justify-end pt-[var(--top-bar)] w-full">
          {/* Desktop Chat Interface - hidden on mobile, show when not in intro */}
          <div className="hidden md:block w-full md:order-1 order-2 min-h-[calc(var(--viewport-height)-var(--top-bar))] md:h-available">
            {flowStep === 'intro' ? (
              <div className="flex justify-center items-center h-full p-5 border-r border-black">
                <div className="p-10 w-full text-center">
                  <IntroAIAnimation size="80px" className="pb-7" />
                  <h2 className="text-gray-800 text-2xl mb-7 font-whyte">
                    Lets do it
                  </h2>
                </div>
              </div>
            ) : (
              <ChatInterface />
            )}
          </div>
          <div className="md:col-span-2 order-1 md:order-2 flex flex-col justify-start md:justify-end relative ">
            <div className="absolute top-8 left-4 md:!left-auto md:right-8">
              <Logo />
            </div>
            <div className="mt-16 md:mt-0">
              <div className="flex flex-col space-y-2 mb-16 md:mb-8 p-8 pb-4 md:pb-8">
                <ArrowLeft className="h-10 w-10 mb-4" />
                <Typography as="h1" size="h1" className="font-whyte">
                  Try our AI talk bot.
                </Typography>
                <div className="flex gap-2 md:gap-4">
                  <Typography as="h1" size="h1" className="font-whyte">
                    It's
                  </Typography>
                  <AnimatedText />
                </div>
                <Typography
                  as="h1"
                  size="h1"
                  className="font-whyte -mt-1 lg:mt-0"
                >
                  We all need
                  <br></br>
                  less emails.
                </Typography>
                <MobileAIButton />
              </div>
              <ChatLinks />
            </div>
          </div>
        </div>
      </header>
      <MobileChatDialog />
    </>
  );
};

export default function Index() {
  return (
    <ChatProvider>
      <HeroContent />
    </ChatProvider>
  );
}
