import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';
import App from './App.jsx';
import './styles.css';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0,
    release: import.meta.env.VITE_APP_VERSION || 'demo-saas-app-local'
  });
}

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: true,
    autocapture: true
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div className="fatal">AcmeOps hit a demo error.</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
