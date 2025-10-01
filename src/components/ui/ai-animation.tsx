import { cn } from '@/lib/utils';

// --- AIAnimation Component ---
interface AIAnimationProps {
  size?: string;
  className?: string;
  colors?: {
    bg?: string;
    c1?: string;
    c2?: string;
    c3?: string;
  };
  animationDuration?: number;
  onClick?: () => void;
  onClickTitle?: string;
  isRecording?: boolean;
  isPlaying?: boolean;
  children?: React.ReactNode;
}

const AIAnimation: React.FC<AIAnimationProps> = ({
  size = '192px',
  className,
  colors,
  animationDuration = 20,
  onClick,
  onClickTitle,
  isRecording,
  isPlaying,
  children,
}) => {
  const defaultColors = {
    bg: 'transparent',
    c1: 'oklch(75% 0.15 350)',
    c2: 'oklch(80% 0.12 200)',
    c3: 'oklch(78% 0.14 280)',
  };

  // Modify colors based on state
  let finalColors = { ...defaultColors, ...colors };

  if (isRecording) {
    finalColors = {
      ...finalColors,
      c1: 'oklch(75% 0.15 10)', // Red tones for recording
      c2: 'oklch(80% 0.12 20)',
      c3: 'oklch(78% 0.14 5)',
    };
  } else if (isPlaying) {
    finalColors = {
      ...finalColors,
      c1: 'oklch(75% 0.15 120)', // Green tones for playing
      c2: 'oklch(80% 0.12 140)',
      c3: 'oklch(78% 0.14 110)',
    };
  }
  // Removed the !isConnected condition to always show the original colors when not recording/playing

  const sizeValue = parseInt(size.replace('px', ''), 10);
  const blurAmount = Math.max(sizeValue * 0.08, 8);
  const contrastAmount = Math.max(sizeValue * 0.003, 1.8);

  return (
    <>
      <style>
        {`
        @property --angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }

        .ai-animation {
          display: grid;
          grid-template-areas: "stack";
          overflow: hidden;
          border-radius: 50%;
          position: relative;
          background: radial-gradient(
            circle,
            rgba(0, 0, 0, 0.08) 0%,   /* darker core for light mode */
            rgba(0, 0, 0, 0.03) 30%,
            transparent 70%
          );
        }

        /* override for dark mode */
        .dark .ai-animation {
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.02) 30%,
            transparent 70%
          );
        }

        .ai-animation::before {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background:
            conic-gradient(
              from calc(var(--angle) * 1.2) at 30% 65%,
              var(--c3) 0deg,
              transparent 45deg 315deg,
              var(--c3) 360deg
            ),
            conic-gradient(
              from calc(var(--angle) * 0.8) at 70% 35%,
              var(--c2) 0deg,
              transparent 60deg 300deg,
              var(--c2) 360deg
            ),
            conic-gradient(
              from calc(var(--angle) * -1.5) at 65% 75%,
              var(--c1) 0deg,
              transparent 90deg 270deg,
              var(--c1) 360deg
            ),
            conic-gradient(
              from calc(var(--angle) * 2.1) at 25% 25%,
              var(--c2) 0deg,
              transparent 30deg 330deg,
              var(--c2) 360deg
            ),
            conic-gradient(
              from calc(var(--angle) * -0.7) at 80% 80%,
              var(--c1) 0deg,
              transparent 45deg 315deg,
              var(--c1) 360deg
            ),
            radial-gradient(
              ellipse 120% 80% at 40% 60%,
              var(--c3) 0%,
              transparent 50%
            );
          filter: blur(var(--blur-amount)) contrast(var(--contrast-amount)) saturate(1.2);
          animation: rotate var(--animation-duration) linear infinite;
          transform: translateZ(0);
          will-change: transform;
        }

        .ai-animation::after {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(
            circle at 45% 55%,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 30%,
            transparent 60%
          );
          mix-blend-mode: overlay;
          z-index: 1;
        }

        .ai-animation-content {
          grid-area: stack;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          position: relative;
        }

        @keyframes rotate {
          from {
            --angle: 0deg;
          }
          to {
            --angle: 360deg;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ai-animation::before {
            animation: none;
          }
        }
        `}
      </style>

      <div
        className={cn(
          'ai-animation cursor-pointer !bg-white/90 relative',
          className
        )}
        style={
          {
            width: size,
            height: size,
            '--bg': finalColors.bg,
            '--c1': finalColors.c1,
            '--c2': finalColors.c2,
            '--c3': finalColors.c3,
            '--animation-duration': `${animationDuration}s`,
            '--blur-amount': `${blurAmount}px`,
            '--contrast-amount': contrastAmount,
          } as React.CSSProperties
        }
        onClick={onClick}
        title={onClickTitle}
      >
        {children && <div className="ai-animation-content">{children}</div>}
      </div>
    </>
  );
};

export default AIAnimation;
