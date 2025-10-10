// Utility to fix iOS viewport height issues
export const setViewportHeight = () => {
  // Calculate the viewport height and set a CSS custom property
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);

  // Also set a fallback for browsers that support dvh
  if (CSS.supports('height', '100dvh')) {
    document.documentElement.style.setProperty('--viewport-height', '100dvh');
  } else {
    document.documentElement.style.setProperty(
      '--viewport-height',
      `calc(var(--vh) * 100)`
    );
  }
};

// Set up viewport height calculation
export const initViewportHeight = () => {
  // Set initial value
  setViewportHeight();

  // Update on resize and orientation change
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    // Delay the calculation to ensure the viewport has updated
    setTimeout(setViewportHeight, 100);
  });

  // Also listen for visual viewport changes (for virtual keyboards on mobile)
  if ('visualViewport' in window) {
    window.visualViewport?.addEventListener('resize', setViewportHeight);
  }
};
