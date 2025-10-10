import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initViewportHeight } from './utils/viewport.ts';

// Initialize viewport height fix for iOS
initViewportHeight();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
