# Render Deployment Guide (Frontend)

This guide explains how to deploy the GuardianWork frontend portals to Render.

## Architecture

Two web services (Render Blueprint in `render.yaml`):
- `guardwork-public` — public portal (build: `npm run build`)
- `guardwork-staff` — staff portal (build: `npm run build:staff`)

Both use the Node runtime with `NITRO_PRESET=node-server`.

## Prerequisites

- Repository pushed to GitHub.
- Render account with access to the workspace.
- (Optional) GitHub Actions enabled for deploy-on-release.

## 1. Apply the Blueprint

1. Ensure `render.yaml` is committed and pushed.
2. Open: `https://dashboard.render.com/blueprint/new?repo=<YOUR_REPO_URL>`
3. Complete Git OAuth if prompted.
4. Name the Blueprint and click **Apply**.
5. Render creates both services.

## 2. Configure Environment Variables

For each service, set these in the Render Dashboard (Environment tab) or via Blueprint `sync: false`:

| Variable | Example / Notes |
|---|---|
| `VITE_API_BASE_URL` | Backend URL (e.g. `https://guardianwork-backend.onrender.com`) or leave unset for `/api` |
| `VITE_PUBLIC_PORTAL_URL` | Public portal URL |
| `VITE_STAFF_PORTAL_URL` | Staff portal URL |

`NODE_VERSION=22` and `NITRO_PRESET=node-server` are set by the Blueprint.

## 3. Disable Auto-Deploy from Git

In each service's Settings, disable auto-deploy so deploys only happen via the GitHub Actions workflow (on release or manual trigger).

## 4. Configure GitHub Actions Secrets

In the GitHub repository settings, add:

- `RENDER_DEPLOY_HOOK_PUBLIC` — from the public service's Settings → Deploy Hook
- `RENDER_DEPLOY_HOOK_STAFF` — from the staff service's Settings → Deploy Hook

## 5. Deploy

- **Automatic:** publish a GitHub Release.
- **Manual:** Actions → "Deploy to Render" → Run workflow.

The workflow verifies (lint, tests, type-check, build) then triggers both Render deploy hooks.

## 6. Verify

- Render Dashboard → service → Logs: confirm build succeeds and server starts.
- Open the service URL; check browser DevTools → Network for API calls to the backend.
- Confirm CORS allows the frontend origin.

## Local Development

```sh
cp .env.example .env
# edit .env
npm install
npm run dev          # public portal :5137
npm run dev:staff    # staff portal :5138
```
