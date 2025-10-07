import { ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
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
        <div className="md:col-span-2 order-1 md:order-2 flex flex-col justify-end relative">
          <div className="absolute top-8 right-8">
            <Logo />
          </div>
          <div className="mt-16 md:mt-0">
            <div className="flex flex-col space-y-2 mb-8 p-8">
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
            <div className="flex h-[90px] text-xl tracking-wider">
              <div className="bg-[var(--dark-grey)] hover:bg-[var(--muted-grey)] hover:w-7/12 transition-all duration-300 w-6/12">
                <a
                  href="https://thesupply.com"
                  className="flex justify-between items-center w-full h-full p-8 text-[var(--cream)]"
                >
                  <span>Learn more</span>
                  <ArrowDown />
                </a>
              </div>
              <div className="bg-[var(--salmon)] transition-all duration-300 w-6/12 hover:w-7/12">
                <a
                  href="https://thesupply.com"
                  className="flex justify-between items-center w-full h-full p-8 text-[var(--dark-grey)]"
                >
                  <span>Talk to a real human</span>
                  <ArrowUp />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
