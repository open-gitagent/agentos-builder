---
name: publish-ui
description: Build and publish an AgenticOS dashboard UI to Vercel via the Vercel REST API, returning a live URL. Use after a successful build to ship the front-end as a preview or production deployment.
metadata:
  category: deploy
  version: "1.0.0"
  uses_tools: vercel-deploy
---

# Publish UI (Vercel)

Ships the built dashboard (a Vite static SPA) to Vercel using the Vercel **REST API** — no
interactive CLI required. Backed by the `vercel-deploy` tool (`tools/vercel-deploy.yaml`).

## When to Use
After the build passes and the user wants the UI live — either a throwaway **preview** link or a
**production** deploy.

## Prerequisites
- `VERCEL_TOKEN` env var — a Vercel access token **with deploy scope** (full access, and a team
  role of Member/Owner). A read-only / restricted token returns `403 forbidden` on file upload
  ("You don't have permission to create the resource"); the tool detects this and tells the user
  to issue a properly-scoped token.
- Team scope is **auto-resolved** from the token's account `defaultTeamId` (required for Vercel
  "northstar" team accounts). Override with `VERCEL_TEAM_ID` or `--team` for a different team.
- A successful dashboard build producing static output at `artifacts/dashboard/dist/public`.

## Methodology
1. **Build the UI.** From the target AgenticOS repo root:
   `pnpm --filter @workspace/dashboard build` → outputs `artifacts/dashboard/dist/public`.
2. **Deploy via the tool.** Invoke `vercel-deploy` with:
   - `build_dir`: `artifacts/dashboard/dist/public`
   - `project_name`: a slug, e.g. `<company>-agenticos`
   - `prod`: `true` for production, omit/`false` for a preview
   - `team_id`: optional
   The tool walks the build dir, uploads each file to `POST /v2/files` (deduped by SHA-1), then
   creates the deployment with `POST /v13/deployments` (SPA fallback routing included).
3. **Report the URL.** Return the live `url` (and inspector URL) to the user. Confirm before a
   `prod` deploy — publishing is an outward action.

## Important caveat — this deploys the FRONTEND only
The dashboard calls `/api/*`, which is served by the **api-server** (Express + GitClaw). A static
Vercel deployment has no backend, so the live UI will render but agent/chat/journey calls will
fail until the API is reachable. Options:
- Host the `api-server` separately (Replit, Render, Fly, a VM, or Vercel serverless functions) and
  point the dashboard at it (set the API base URL / a Vercel rewrite from `/api/*` to the API host).
- Or use this for a UI-only preview and wire the backend before going production.

## Access note — Deployment Protection (401)
If the deployed URL returns `HTTP 401 "Authentication Required"`, that's Vercel **Deployment
Protection** (preview/prod deployments are SSO-gated by default on many teams) — the deploy
itself succeeded. To make it publicly reachable: Vercel → Project → Settings → Deployment
Protection (disable, or set "Only Preview"), or use a Protection Bypass token. Confirm the
deployment reached `readyState: READY` via `GET /v13/deployments/<id>?teamId=<team>`.

## Output Format
Report the deployment URL, its `readyState`, whether it's preview or production, any Deployment
Protection (401) note, and the frontend-only caveat with the chosen backend plan.
Example: `Deployed (preview, READY): https://acme-agenticos-xxxx.vercel.app`.
