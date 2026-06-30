# demo-saas-app

`demo-saas-app` is a small monitored SaaS product that exists to feed realistic release and product signals into the Release Intelligence Dashboard. It includes a React/Vite frontend, an Express backend, Sentry hooks, PostHog frontend analytics, and a GitHub Actions release workflow.

The fictional product is **AcmeOps**, an operations dashboard with demo actions for signups, checkout, feature usage, warnings, and intentional errors.

## How It Connects

Configure this repository's GitHub webhook to send `workflow_run` events to:

```text
https://release-intelligence-dashboard.vercel.app/webhooks/github
```

Use the same webhook secret configured in the Release Intelligence Dashboard as `GITHUB_WEBHOOK_SECRET`. When the GitHub Actions workflow completes, the dashboard can ingest the run, correlate release metadata, and fetch related Sentry/PostHog/GCP signals.

## Setup

```bash
npm run install:all
cp .env.example client/.env
cp .env.example server/.env
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend runs on `http://localhost:4000`.

## Environment Variables

Frontend variables go in `client/.env`:

```text
VITE_API_BASE_URL=http://localhost:4000
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_SENTRY_DSN=
```

Backend variables go in `server/.env`:

```text
PORT=4000
SENTRY_DSN=
NODE_ENV=development
```

Leave Sentry/PostHog values blank for local UI demos without external telemetry. Add real DSNs/keys when you want events to appear in those services.

## Trigger Telemetry

Open the app and use the action buttons:

- **Track signup** calls `POST /api/signup`, updates dashboard counters, and sends `demo_signup` to PostHog.
- **Track checkout** calls `POST /api/checkout`, updates revenue/conversion metrics, and sends `demo_checkout`.
- **Track feature used** calls `POST /api/feature-used`, updates usage metrics, and sends `demo_feature_used`.
- **Trigger warning** calls `POST /api/warning` and writes a backend warning log.
- **Trigger frontend error** captures an intentional frontend error in Sentry.
- **Trigger backend error** calls `POST /api/error`, which captures an intentional backend error in Sentry and returns JSON.

## GitHub Actions

The release workflow lives at `.github/workflows/release-demo.yml`.

It runs on pushes to `main` and can also be started manually from the GitHub Actions tab with `workflow_dispatch`. The `Release Demo` job installs dependencies, builds the frontend, and runs a backend syntax/health check.

## Expected Dashboard Signals

After a workflow completes and the webhook is configured, the Release Intelligence Dashboard should be able to show:

- GitHub workflow run status, branch, SHA, duration, and conclusion.
- Sentry frontend/backend errors triggered during the demo window.
- PostHog product events such as signup, checkout, and feature usage.
- Backend warning/error logs now, with GCP Logging available later when deployed to Cloud Run.

## Useful Commands

```bash
npm run install:all
npm run dev
npm run build
npm run check
npm start
```
