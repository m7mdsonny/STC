import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Ensure root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure index.html has a <div id="root"></div> element.');
}

// Error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent default to avoid console errors in production
  event.preventDefault();
});

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
