import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

// Global error handlers: Intercept unhandled exceptions & promise rejections
// to prevent unexpected white-screens in production.
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Nirai Global UnhandledRejection]', event.reason);
  // Prevent white-screen by preventing default if needed, error boundary/toasts will handle UI
});

window.addEventListener('error', (event) => {
  console.error('[Nirai Global WindowError]', event.error || event.message);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary level="full" name="application-root">
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>
);

// Lazy-load privacy-preserving Sentry error monitoring when idle
if (typeof window !== 'undefined') {
  const scheduleSentry = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
  scheduleSentry(() => {
    import('./services/sentry').then(({ initSentry }) => initSentry());
  });
}
