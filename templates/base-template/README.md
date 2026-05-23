# AgenticOS Template

A production-grade **base template** for building an "AgenticOS" — a full-stack, AI-powered
operating system for a domain function (Finance, Legal, Sales, Ops, …). It pairs a real agent
runtime (GitClaw + Claude) with a polished dashboard: a Command Center, **Journey** pages where
the agent runs end-to-end workflows live, plus **Build** and **Observe** (governance) sections.

This repo is domain-agnostic. It ships with **one worked example** (`example-journey` +
`example-skill`) and is meant to be adapted to your domain.

## Build your own AgenticOS

**Open this repo in Claude Code and read [`CLAUDE.md`](./CLAUDE.md).** It is a step-by-step
playbook: Claude Code interviews you about your domain, company, and branding, then scaffolds the
agent identity, skills, knowledge, journeys, and dashboard for you.

## Architecture (three layers)

```
React dashboard  ──/api/agent/chat, /api/journey/*──►  Express server (thin GitClaw wrapper)
(artifacts/dashboard)                                  (artifacts/api-server)
                                                              │ query({ dir: agent/, ... })
                                                              ▼
                                              GitClaw runtime → Anthropic Claude
                                                              ▲
                                         agent/  (agent.yaml, SOUL/RULES/DUTIES, skills/, knowledge/)
```

The server never calls the LLM directly — it calls GitClaw's `query()` and streams the events
back over SSE. The `agent/` directory is the "brain"; the dashboard is the experience.

## Quickstart

```bash
pnpm install                 # pnpm workspace monorepo, Node 24
pnpm run typecheck           # composite typecheck across all packages

# API server — needs PORT + the Anthropic integration env vars
PORT=8080 \
AI_INTEGRATIONS_ANTHROPIC_API_KEY=… \
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=… \
  pnpm --filter @workspace/api-server dev

# Dashboard (Vite dev server proxies /api → :8080)
pnpm --filter @workspace/dashboard dev
```

Then open the dashboard, go to **Example Journey**, click **Run Agent**, and watch the pipeline
run and the AI conclusion stream.

## Layout

| Path | What it is |
|------|------------|
| `agent/` | The agent definition (the brain) — identity, skills, knowledge. Replace per domain. |
| `artifacts/api-server/` | Express server — thin GitClaw passthrough. Mostly reusable. |
| `artifacts/dashboard/` | React + Vite dashboard. Reusable components; replace page content. |
| `artifacts/mockup-sandbox/` | Dev-only component preview. |
| `lib/` | Shared packages: OpenAPI spec + generated client/zod, DB, Anthropic integration. |

## Docs
- [`CLAUDE.md`](./CLAUDE.md) — **start here**: the build playbook for Claude Code.
- [`AGENTIC_OS_BUILD_GUIDE.md`](./AGENTIC_OS_BUILD_GUIDE.md) — architecture & journey pattern, in depth.
- [`OBSERVE_SECTION_GUIDE.md`](./OBSERVE_SECTION_GUIDE.md) — the governance (Observe) section.

Powered by Lyzr AgenticOS.
