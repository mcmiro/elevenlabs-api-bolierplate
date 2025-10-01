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
      {/*<div class="ticker-inline"><div class="ticker-inline"><div class="dot">•</div><div class="ticker-inline"><p>we need frontend developers 🧑🏼‍💻</p></div></div><div class="ticker-inline"><div class="dot">•</div><div class="ticker-inline"><p>1.10.2025</p></div></div><div class="ticker-inline"><div class="dot">•</div><div class="ticker-inline"><p>16:10</p></div></div><div class="ticker-inline"><div class="dot">•</div><div class="ticker-inline"><p>join our network, say hi 📨</p></div></div><div class="ticker-inline"><div class="dot">•</div><div class="ticker-inline"><p><b>looking for sr product designers 📝</b></p></div></div><div class="ticker-inline"><div class="dot">•</div><div class="ticker-inline"><p>hiring for a good cause? let's talk! we'd love to support</p></div></div><div class="ticker-inline"><div class="dot">•</div><div class="ticker-inline"><p><b>need design engineers </b></p></div></div><div class="ticker-inline"><div class="dot">•</div><div class="ticker-inline"><p>upgraded salary tool, coming soon</p></div></div><div class="ticker-inline"><div class="dot">•</div><div class="ticker-inline"><p>what event will you be at in 2025 🥃</p></div></div><div class="ticker-inline"><div class="dot">•</div><div class="ticker-inline"><p>live a little, hit the toggle button 🔅</p></div></div><div class="ticker-inline"><div class="dot">•</div><div class="ticker-inline"><p>its almost 2025 wow</p></div></div></div>*/}
      <div className="grid grid-cols-3 justify-end pt-[var(--top-bar)]">
        <ChatInterface />
        <div className="col-span-2 flex flex-col justify-end p-8 relative">
          <div className="absolute top-2 right-2">
            <Logo />
          </div>
          {/*<Typography as="h1" size="h1" className="font-whyte">
            Try out<br></br>
            our AI talk bot. <br></br>
            She's <span className="text-accent">friendly and</span>
            <br></br>
            <span className="text-accent">right to the point.</span>
            <br></br>
            Save some
            <br></br>
            emails in your box.
          </Typography>*/}
          <Typography as="h1" size="h1" className="font-whyte">
            Try out<br></br>
            our AI talk bot. <br></br>
            She's
          </Typography>
          <AnimatedText />
          <Typography as="h1" size="h1" className="font-whyte">
            Save some
            <br></br>
            emails in your box.
          </Typography>
        </div>
      </div>
    </header>
  );
}
