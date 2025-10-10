import { ArrowLeft } fro            <div className="mt-16 md:mt-0">
              <div className="flex flex-col space-y-2 mb-16 md:mb-8 p-8 pb-4 md:pb-8">
                <ArrowLeft className="h-10 w-10 mb-4" />
                <Typography as="h1" size="h1" className="font-whyte">
                  Try out<br></br>
                  our AI talk bot. <br></br>
                  It's
                </Typography>
                <AnimatedText />
                <Typography
                  as="h1"
                  size="h1"
                  className="font-whyte -mt-1 lg:mt-0"
                >
                  We all need
                  <br></br>
                  less emails.
                </Typography>
              </div>mport { ChatProvider } from '../../contexts/chat-provider';
import { ChatInterface } from '../chat';
import Logo from '../ui/logo';
import Typography from '../ui/typography';
import AnimatedText from './animated-text';
import ChatLinks from './chat-links';
import { TopBar } from './top-bar';

export default function Index() {
  return (
    <ChatProvider>
      <header className="relative">
        <div className="absolute top-0 w-full z-50">
          <TopBar />
        </div>
        <div className="flex flex-col md:grid md:grid-cols-3 justify-end pt-[var(--top-bar)] w-full">
          <div className="w-full md:order-1 order-2 min-h-[calc(var(--viewport-height)-var(--top-bar))] md:h-available">
            <ChatInterface />
          </div>
          <div className="md:col-span-2 order-1 md:order-2 flex flex-col justify-end relative min-h-[calc(var(--viewport-height)-var(--top-bar))]">
            <div className="absolute top-8 left-4 md:!left-auto md:right-8">
              <Logo />
            </div>
            <div className="mt-16 md:mt-0">
              <div className="flex flex-col space-y-2 mb-16 md:mb-8 p-8">
                <ArrowLeft className="h-10 w-10 mb-4" />
                <Typography as="h1" size="h1" className="font-whyte">
                  Try out<br></br>
                  our AI talk bot. <br></br>
                  It’s
                </Typography>
                <AnimatedText />
                <Typography
                  as="h1"
                  size="h1"
                  className="font-whyte -mt-1 lg:mt-0"
                >
                  We all need
                  <br></br>
                  less emails.
                </Typography>
              </div>
              <ChatLinks />
            </div>
          </div>
        </div>
      </header>
    </ChatProvider>
  );
}
