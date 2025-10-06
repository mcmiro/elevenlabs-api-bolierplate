import { ChatInterface } from '../chat';
import Logo from '../ui/logo';
import Typography from '../ui/typography';
import AnimatedText from './animated-text';
import { TopBar } from './top-bar';

export default function index() {
  return (
    <header className="relative">
      <div className="absolute top-0 w-full z-50">
        <TopBar />
      </div>
      <div className="flex flex-col md:grid md:grid-cols-3 justify-end pt-[var(--top-bar)] w-full">
        <div className="w-full md:order-1 order-2 h-full md:h-available">
          <ChatInterface />
        </div>
        <div className="md:col-span-2 order-1 md:order-2 flex flex-col justify-end p-8 relative">
          <div className="absolute top-2 right-2">
            <Logo />
          </div>
          <div className="mt-16 md:mt-0">
            <Typography as="h1" size="h1" className="font-whyte">
              Try out<br></br>
              our AI talk bot. <br></br>
              It’s
            </Typography>
            <AnimatedText />
            <Typography as="h1" size="h1" className="font-whyte -mt-1 lg:mt-0">
              We all need
              <br></br>
              less emails.
            </Typography>
          </div>
        </div>
      </div>
    </header>
  );
}
