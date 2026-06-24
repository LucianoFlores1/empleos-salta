import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'motion/react';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      {/* reducedMotion="user" hace que TODAS las animaciones respeten
          la preferencia de movimiento reducido del sistema operativo. */}
      <MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
        <App />
      </MotionConfig>
    </HelmetProvider>
  </StrictMode>,
);
