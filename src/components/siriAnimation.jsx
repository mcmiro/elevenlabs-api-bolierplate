'use client';

import './siriAnimation.css';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const SiriOrb = ({
  size = '192px',
  className,
  colors,
  animationDuration = 20,
  onClick,
  onClickTitle,
}) => {
  const defaultColors = {
    bg: 'transparent',
    c1: 'oklch(75% 0.15 350)',
    c2: 'oklch(80% 0.12 200)',
    c3: 'oklch(78% 0.14 280)',
  };

  const finalColors = { ...defaultColors, ...colors };
  const sizeValue = parseInt(size.replace('px', ''), 10);

  const blurAmount = Math.max(sizeValue * 0.08, 8);
  const contrastAmount = Math.max(sizeValue * 0.003, 1.8);

  return (
    <div
      className={cn('siri-orb', className)}
      onClick={onClick}
      title={onClickTitle}
      style={{
        width: size,
        height: size,
        '--bg': finalColors.bg,
        '--c1': finalColors.c1,
        '--c2': finalColors.c2,
        '--c3': finalColors.c3,
        '--animation-duration': `${animationDuration}s`,
        '--blur-amount': `${blurAmount}px`,
        '--contrast-amount': contrastAmount,
        cursor: onClick ? 'pointer' : 'default',
      }}
    ></div>
  );
};

const SiriAnimation = ({
  size = '192px',
  animationDuration = 20,
  children,
  onClick,
  onClickTitle,
  style,
  isRecording = false,
  isPlaying = false,
  isConnected = false,
  className,
  ...orbProps
}) => {
  const getAnimationDuration = () => {
    if (isRecording) return animationDuration * 0.3; // Faster when recording
    if (isPlaying) return animationDuration * 0.5; // Medium speed when playing
    if (isConnected) return animationDuration * 0.8; // Slightly faster when connected
    return animationDuration; // Normal speed when idle
  };

  const getStateColors = () => {
    if (isRecording) {
      return {
        c1: 'oklch(75% 0.25 0)', // Bright red/orange when recording
        c2: 'oklch(80% 0.22 30)',
        c3: 'oklch(78% 0.24 15)',
      };
    }
    if (isPlaying) {
      return {
        c1: 'oklch(75% 0.20 120)', // Green tones when playing
        c2: 'oklch(80% 0.18 140)',
        c3: 'oklch(78% 0.19 130)',
      };
    }
    if (isConnected) {
      return {
        c1: 'oklch(75% 0.18 240)', // Blue tones when connected
        c2: 'oklch(80% 0.15 260)',
        c3: 'oklch(78% 0.16 250)',
      };
    }
    return orbProps.colors || {};
  };

  return (
    <div
      className={cn('siri-animation-container', className)}
      style={{
        ...style,
      }}
    >
      <SiriOrb
        size={size}
        animationDuration={getAnimationDuration()}
        colors={getStateColors()}
        onClick={onClick}
        onClickTitle={onClickTitle}
        {...orbProps}
      />
      <div className="siri-content">{children}</div>
    </div>
  );
};

export default SiriAnimation;
