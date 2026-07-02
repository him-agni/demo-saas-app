# Release Intelligence Handoff

This demo SaaS app is the monitored application for Release Intelligence demos. It should not expose a release-intelligence API. Instead, it creates real telemetry in GitHub Actions, Sentry, PostHog, and optionally GCP Logs for the Release Intelligence Dashboard to read.

## Demo App Identity

Use these values to identify this app in dashboard integrations:

```text
Project name: AcmeOps Demo SaaS
Project id: demo-saas-app
PostHog app property: acmeops
PostHog monitored_project property: demo-saas-app
GitHub workflow name: Release Demo
Frontend Sentry project: demo-saas-app-frontend
Backend Sentry project: demo-saas-app-backend
```

## GitHub Actions

Track this repository's workflow runs from:

```text
.github/workflows/release-demo.yml
```

Expected workflow display name:

```text
Release Demo
```

The repo webhook should point to the deployed dashboard webhook route, commonly one of:

```text
https://<dashboard-domain>/api/webhooks/github
https://<dashboard-domain>/webhooks/github
```

Enable the `workflow_run` event. The webhook secret must match the dashboard's `GITHUB_WEBHOOK_SECRET`.

Acceptance check:

```text
GitHub webhook Recent Deliveries returns 2xx for workflow_run.
Dashboard timeline shows repo, branch, commit SHA, workflow conclusion, and duration.
```

## PostHog

The demo app can share the existing free-tier PostHog project. Filter demo-app data using event properties:

```text
app = acmeops
monitored_project = demo-saas-app
```

Important event names:

```text
demo_signup
demo_checkout
demo_feature_used
demo_frontend_error
```

Expected manual event properties:

```text
source = demo_button
action = signup | checkout | feature | warning | backend-error
app = acmeops
monitored_project = demo-saas-app
monitored_project_name = AcmeOps Demo SaaS
```

Acceptance check:

```text
Click Track signup, Track checkout, and Track feature used in the demo app.
PostHog Activity should show those events with app=acmeops and monitored_project=demo-saas-app.
Dashboard PostHog queries should filter by monitored_project=demo-saas-app.
```

## Sentry

The demo app should use its own frontend and backend Sentry DSNs. In the dashboard, map both Sentry projects to the single monitored app:

```text
demo-saas-app-frontend
demo-saas-app-backend
```

Useful Sentry release value:

```text
demo-saas-app-local
```

Acceptance check:

```text
Click Trigger frontend error.
Click Trigger backend error.
Confirm both appear in Sentry, then confirm the dashboard counts them for demo-saas-app.
```

## GCP Logs

No GCP credentials are required in this demo app for local demos. GCP credentials belong in the Release Intelligence Dashboard because it reads logs.

If the backend is deployed to Cloud Run later, filter logs by the deployed service name:

```text
demo-saas-app
```

Acceptance check:

```text
Click Trigger warning and Trigger backend error.
If deployed on GCP, Cloud Logging should contain warning/error log entries for the service.
Dashboard GCP queries should filter by the demo app service/resource labels.
```

## End-To-End Demo Script

1. Run the demo app locally or deploy it.
2. Trigger the GitHub `Release Demo` workflow manually.
3. Open the demo app and click:

```text
Track signup
Track checkout
Track feature used
Trigger warning
Trigger frontend error
Trigger backend error
```

4. Confirm source systems received data:

```text
GitHub Actions: workflow_run delivered successfully
PostHog: app=acmeops events exist
Sentry: frontend and backend intentional errors exist
GCP Logs: optional, only if backend is deployed on GCP
```

5. Confirm the Release Intelligence Dashboard shows non-zero values for this project.
