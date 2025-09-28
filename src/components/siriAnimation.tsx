'use client';

//import { useState } from 'react';
import './siriAnimation.css';

// Simple cn utility function to combine class names
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// --- SiriOrb Component ---
interface SiriOrbProps {
  size?: string;
  className?: string;
  colors?: {
    bg?: string;
    c1?: string;
    c2?: string;
    c3?: string;
  };
  animationDuration?: number;
}
const SiriOrb: React.FC<SiriOrbProps> = ({
  size = '192px',
  className,
  colors,
  animationDuration = 20,
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
    ></div>
  );
};

export type SiriAnimationProps = SiriOrbProps & {
  children?: React.ReactNode;
  onClick?: () => void;
  onClickTitle?: string;
  style?: React.CSSProperties;
  isRecording?: boolean;
  isPlaying?: boolean;
  isConnected?: boolean;
};

const SiriAnimation: React.FC<SiriAnimationProps> = ({
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
  // Adjust animation speed based on state
  const getAnimationDuration = () => {
    if (isRecording) return animationDuration * 0.3; // Faster when recording
    if (isPlaying) return animationDuration * 0.5; // Medium speed when playing
    if (isConnected) return animationDuration * 0.8; // Slightly faster when connected
    return animationDuration; // Normal speed when idle
  };

  // Adjust colors based on state
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
      onClick={onClick}
      title={onClickTitle}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <SiriOrb
        size={size}
        animationDuration={getAnimationDuration()}
        colors={getStateColors()}
        className="drop-shadow-2xl"
        {...orbProps}
      />
      <div className="siri-content">{children}</div>
    </div>
  );
};

export default SiriAnimation;
