import { ArrowDown, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useChatContext } from '../../contexts/chat-context';

export default function ChatLinks() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { isConnected } = useChatContext();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isConnected]);

  return (
    <div
      className={` justify-end h-[60px] md:h-[90px] md:text-xl tracking-wider fixed bottom-0 right-0 md:relative z-40 ${
        isConnected ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div
        className={`overflow-hidden transition-all duration-500 h-full ${
          isScrolled ? 'w-[60px]' : 'w-full'
        }`}
      >
        <div
          className={`flex w-screen md:w-full transition-all duration-500 h-full ${
            isScrolled ? '-ml-[calc(100vw-60px)]' : 'ml-0'
          }`}
        >
          <div className="bg-[var(--dark-grey)] hover:bg-[var(--muted-grey)] hover:w-7/12 transition-all duration-300 w-6/12">
            <a
              href="https://thesupply.com"
              className="flex justify-between items-center w-full h-full p-4 md:p-8 text-[var(--cream)]"
            >
              <span>Learn more</span>
              <ArrowDown />
            </a>
          </div>
          <div className="bg-[var(--salmon)] transition-all duration-300 w-6/12 hover:w-7/12">
            <a
              href="https://thesupply.com"
              className="hidden md:flex justify-between items-center w-full h-full p-8 text-[var(--dark-grey)]"
            >
              <span>Talk to a real human</span>
              <ArrowUp />
            </a>
            <a
              href="https://thesupply.com"
              className="flex md:hidden justify-between items-center w-full h-full p-4 md:p-8 text-[var(--dark-grey)]"
            >
              <span>Talk to us</span>
              <ArrowUp />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
