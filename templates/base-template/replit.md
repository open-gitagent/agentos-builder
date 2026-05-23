# AgenticOS Template

## Overview

A production-quality base template for building an "AgenticOS" — a full-stack, AI-powered
operating system for any domain function. It is domain-agnostic: it ships with one worked example
(`example-journey` + `example-skill`) and is meant to be adapted. **To build a domain-specific
system, open the repo in Claude Code and follow `CLAUDE.md`.**

Design system: warm/earthy by default (cream background, deep-brown primary, Playfair Display +
DM Sans), Lucide icons only (no emojis). Branding is centralized — see
`artifacts/dashboard/src/lib/brand.ts` and the `BRAND THEME` block in
`artifacts/dashboard/src/index.css`. No authentication.

## Stack

- pnpm workspace monorepo, Node 24, TypeScript 5.9
- API: Express 5 (thin GitClaw wrapper)
- Frontend: React + Vite + Tailwind + shadcn/ui, wouter, TanStack Query, Framer Motion, Recharts
- AI: GitClaw SDK (`gitclaw`) + `@mariozechner/pi-ai` wrapping Anthropic Claude Sonnet 4 via the
  Replit AI Integrations proxy; real tool calling (read, write, cli, memory)
- Codegen: Orval (React Query hooks + Zod) from `lib/api-spec/openapi.yaml`

## Structure

```
agent/                    # Agent definition (the "brain"): agent.yaml, SOUL/RULES/DUTIES,
                          # skills/, knowledge/, workflows/, compliance/, hooks/, config/, memory/
artifacts/
  api-server/             # Express API (port from $PORT) — thin GitClaw passthrough
  dashboard/              # React + Vite dashboard
  mockup-sandbox/         # Component preview sandbox
lib/                      # api-spec, api-client-react, api-zod, db, integrations-anthropic-ai
```

## How the agent works

The server does NOT call the LLM directly. It calls GitClaw's `query({ dir: AGENT_DIR, prompt, … })`
and forwards the event stream (`delta`, `tool_use`, `tool_result`, `assistant`) to the frontend as
SSE. GitClaw loads `agent/agent.yaml`, `SOUL.md`, `RULES.md`, `DUTIES.md`, the skills (YAML
frontmatter required), and the knowledge index, builds the system prompt + tools, and runs the
agentic loop.

- Agent directory path: `artifacts/api-server/src/lib/agent-dir.ts` (`AGENT_DIR`, override with the
  `AGENT_DIR` env var; default `/home/runner/workspace/agent`).
- Env bridging maps `AI_INTEGRATIONS_ANTHROPIC_API_KEY` → `ANTHROPIC_API_KEY` and patches the pi-ai
  model registry `baseUrl` to the Replit proxy.
- SSE routes abort via `res.on("close")` (not `req.on("close")`).

## Key endpoints

- `POST /api/agent/chat` — free-form agent chat (SSE, GitClaw tool loop)
- `POST /api/journey/prepare` — returns the run plan (timeline events + steps) for a journey
- `POST /api/journey/analyze` — streams the structured `[SECTION]…[/SECTION]` AI conclusion (SSE)
- `POST /api/wiki/chat/stream` — wiki query/ingest/lint (SSE)
- `GET /api/agent/{info,skills,files,file,compliance}`, `GET /api/dashboard/{metrics,insights,activity}`
- `GET/POST /api/audit/events`, `GET /api/audit/runs`

## Important configuration

- Typecheck from the root: `pnpm run typecheck` (composite TS project with references).
- Vite dev proxies `/api` → `localhost:8080`.
- Journey wiring lives in `artifacts/api-server/src/routes/journey-analyze.ts`
  (`JOURNEY_SKILL_MAP`, `JOURNEY_DATA_MAP`, `JOURNEY_SECTIONS`, `JOURNEY_GATES`) and
  `artifacts/dashboard/src/lib/journey-config.ts`.
- Sample-data toggle (`useSampleData()`) switches every page between demo data and an empty state.

See `CLAUDE.md` for the full build playbook and `AGENTIC_OS_BUILD_GUIDE.md` for the deep dive.
