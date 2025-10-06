import { TopBarMessages } from '@/constants/top-bar';
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from '../ui/scroll-based-velocity';

export function TopBar() {
  return (
    <a href="https://thesupply.com" target="_blank" className="cursor-pointer">
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-[#1a201f] h-[44px] text-primary-foreground uppercase text-sm wider">
        <ScrollVelocityContainer>
          <ScrollVelocityRow baseVelocity={3} direction={1}>
            {TopBarMessages &&
              TopBarMessages.length > 0 &&
              TopBarMessages.map((message: string, index: number) => (
                <div className="flex items-center" key={index}>
                  <p>{message}</p>
                  <span className="px-4 text-4xl leading-0 -mt-1">•</span>
                </div>
              ))}
          </ScrollVelocityRow>
        </ScrollVelocityContainer>
      </div>
    </a>
  );
}
