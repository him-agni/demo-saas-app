import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';

const PORT = process.env.PORT || 4000;
const app = express();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    release: process.env.RELEASE_VERSION || 'demo-saas-app-local'
  });
}

app.use(cors());
app.use(express.json());

let metrics = {
  accounts: 128,
  mrr: 28400,
  featureEvents: 842,
  conversionRate: 18
};

let activity = [
  { label: 'Release baseline loaded', detail: 'Demo app is ready for monitored events', severity: 'info' },
  { label: 'API health check passed', detail: 'Backend responded with healthy status', severity: 'info' }
];

app.get('/health', asyncHandler(async (_req, res) => {
  console.log('[health] demo-saas-app healthy');
  res.json({
    ok: true,
    service: 'demo-saas-app',
    timestamp: new Date().toISOString()
  });
}));

app.get('/api/metrics', asyncHandler(async (_req, res) => {
  console.log('[metrics] dashboard metrics requested');
  res.json({ metrics, activity });
}));

app.post('/api/signup', asyncHandler(async (_req, res) => {
  metrics = {
    ...metrics,
    accounts: metrics.accounts + 1,
    conversionRate: Math.min(99, metrics.conversionRate + 1)
  };
  addActivity('Signup tracked', 'Created a demo account event', 'info');
  console.log('[signup] demo signup tracked', metrics);
  res.json({ message: 'Signup tracked successfully', metrics, activity });
}));

app.post('/api/checkout', asyncHandler(async (_req, res) => {
  metrics = {
    ...metrics,
    mrr: metrics.mrr + 249,
    conversionRate: Math.min(99, metrics.conversionRate + 1)
  };
  addActivity('Checkout tracked', 'Recorded a demo paid conversion', 'info');
  console.log('[checkout] demo checkout tracked', metrics);
  res.json({ message: 'Checkout tracked successfully', metrics, activity });
}));

app.post('/api/feature-used', asyncHandler(async (_req, res) => {
  metrics = {
    ...metrics,
    featureEvents: metrics.featureEvents + 1
  };
  addActivity('Feature usage tracked', 'Logged dashboard automation usage', 'info');
  console.log('[feature-used] demo feature event tracked', metrics);
  res.json({ message: 'Feature usage tracked successfully', metrics, activity });
}));

app.post('/api/warning', asyncHandler(async (_req, res) => {
  const warning = 'Intentional AcmeOps backend demo warning';
  console.warn('[warning]', warning);
  Sentry.captureMessage(warning, 'warning');
  addActivity('Backend warning emitted', 'Console warning created for log monitoring', 'warning');
  res.json({ message: 'Backend warning emitted', metrics, activity });
}));

app.post('/api/error', asyncHandler(async () => {
  const error = new Error('Intentional AcmeOps backend demo error');
  error.statusCode = 500;
  throw error;
}));

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  console.error('[error]', err.message);
  Sentry.captureException(err);
  addActivity('Backend error captured', err.message, 'error');
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal demo error captured' : err.message,
    requestId: cryptoRandomId()
  });
});

app.listen(PORT, () => {
  console.log(`demo-saas-app API listening on http://localhost:${PORT}`);
});

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function addActivity(label, detail, severity) {
  activity = [{ label, detail, severity }, ...activity].slice(0, 6);
}

function cryptoRandomId() {
  return `demo_${Math.random().toString(36).slice(2, 10)}`;
}
