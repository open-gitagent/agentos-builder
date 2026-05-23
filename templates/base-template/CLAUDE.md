# AgenticOS Template — Build Guide for Claude Code

> **You (Claude Code) are reading this because someone wants to build an AgenticOS for
> their domain on top of this template.** This file is your playbook. Read it fully, then
> follow the **Build Playbook** below. Start by interviewing the user (see Step 0) — do not
> start editing until you know their domain, company, and branding.

An **AgenticOS** is a full-stack product that gives a domain expert (a CFO, General Counsel,
VP Sales, Head of Ops, …) an AI-powered operating system for their function. It is **not a
chatbot**. It is:

- a **Command Center** dashboard with domain KPIs and insights,
- a set of **Journey pages** — each a major workflow the agent runs end-to-end,
- a real **agent** (powered by the GitClaw runtime) that reads domain knowledge, loads skills,
  and calls tools, streaming its work live,
- **Build** pages (author skills/knowledge/flows) and **Observe** pages (approvals, run traces,
  audit trail) for governance.

This repository is that product with the domain content stripped out and replaced by a single
worked example. Your job is to refill it for a new domain.

---

## 1. Architecture (how it actually works)

Three layers. **The server is a thin passthrough** — it does NOT call the LLM directly or build
prompts from skill files. It calls GitClaw's `query()` and streams the events back as SSE.

```
Frontend (React + Vite)            artifacts/dashboard/
   │  POST /api/agent/chat (SSE), /api/journey/{prepare,analyze}
   ▼
Server (Express, thin wrapper)     artifacts/api-server/
   │  query({ dir: AGENT_DIR, prompt, model, ... })   ← the only AI call
   ▼
GitClaw runtime (the agent engine)  (npm: gitclaw)
   │  loads agent.yaml + SOUL/RULES/DUTIES + skills + knowledge index,
   │  builds the system prompt + tools (read/write/cli/memory), runs the
   │  agentic loop, calls Claude, streams delta/tool_use/tool_result events
   ▼
Agent definition (flat files)      agent/
   │
   ▼
Anthropic Claude  (via the Replit AI proxy — see env bridging)
```

Key facts:
- The AI model is `anthropic:claude-sonnet-4-6` (pi-ai registry id). Env bridging maps Replit's
  `AI_INTEGRATIONS_ANTHROPIC_*` vars to what GitClaw/pi-ai expect.
- Every SSE route uses `res.on("close")` to abort (NOT `req.on("close")`).
- The agent directory path is centralized in `artifacts/api-server/src/lib/agent-dir.ts`
  (`AGENT_DIR`, overridable via the `AGENT_DIR` env var; defaults to `/home/runner/workspace/agent`).

---

## 2. Repo map — what to KEEP vs what to REPLACE

```
agent/                         ← THE BRAIN. Replace its CONTENT per domain (Step 3–5).
  agent.yaml                   manifest (name, model, tools, skills list, compliance)
  SOUL.md / RULES.md / DUTIES.md   identity / guardrails / responsibilities (templates)
  skills/example-skill/        ONE example skill (SKILL.md + scripts/) — copy per capability
  knowledge/                   index.yaml + org-structure.md + example-data.json
    journey-data/example-journey/   sample.csv, records.csv (per-journey datasets)
  workflows/ compliance/ hooks/ config/ memory/ examples/ agents/   generic placeholders
  .gitagent/                   GitClaw runtime state (leave it; resets itself)

artifacts/
  api-server/                  KEEP. Thin GitClaw wrapper. Edit only the journey maps + dashboard data.
    src/routes/                agent.ts, agent-chat.ts, journey-analyze.ts, wiki.ts, audit.ts,
                               dashboard.ts, file-extract.ts, health.ts
    src/lib/agent-dir.ts       centralized AGENT_DIR path
  dashboard/                   KEEP the components/hooks/shell. Replace page CONTENT per domain.
    src/lib/brand.ts           ← BRANDING config (Step 1)
    src/pages/example-journey.tsx   ← the journey template to copy
    src/components/             reusable: agent-pipeline, ai-conclusion, journey-shell,
                               journey-chat-panel, journey-event-timeline, tool-call-card,
                               pending-actions-strip, sample-data-context, layout, no-data-state
    src/lib/                   journey-config, journey-events, tool-registry, read-files, ...
    src/index.css              theme tokens (BRAND THEME block)
  mockup-sandbox/              dev-only component preview (leave)

lib/                           KEEP. api-spec (OpenAPI+Orval), api-client-react, api-zod, db, integrations-anthropic-ai
```

**Reusable groundwork you should NOT rewrite** (only reuse): everything in
`dashboard/src/components/` and `dashboard/src/lib/` except where a config asks you to add an
entry, the whole `api-server` plumbing (routes are generic — you only edit the small maps), and
all of `lib/`.

---

## 3. The Universal Journey Pattern

Every journey page is assembled from the same parts (see `pages/example-journey.tsx`):

1. `useAgentPipeline(journeyId)` — run-state machine. `startPipeline()` → `POST /api/journey/prepare`
   returns timeline events + steps; the hook animates them, then enters the `analyzing` phase.
2. `<JourneyHeaderActions>` — title, cadence/SLA badges, Run/Pause, What-if scenarios, Evidence,
   Hand-off, Audit drawer (reads `journey-config.ts`).
3. `<PendingActionsStrip>` — items needing human attention (gated by `useSampleData()`).
4. Domain content — your metrics/tables/charts.
5. `<AgentPipelineContent>` — renders the live event timeline + `<AiConclusion>`, which streams
   real Claude output as `[SECTION]{json}[CONTENT]…[/SECTION]` blocks and renders them as cards.
6. `<JourneyChatPanel>` — always-on chat rail scoped to the journey.

The **server side** of a journey is four small maps in `api-server/src/routes/journey-analyze.ts`:
`JOURNEY_SKILL_MAP` (journey→skill), `JOURNEY_DATA_MAP` (journey→data dir), `JOURNEY_SECTIONS`
(the `[SECTION]`s the AI must output), `JOURNEY_GATES` (optional human approval gates), plus
`JOURNEY_DELTAS` and `FILE_TO_TOOL` for the timeline visuals.

---

## 4. BUILD PLAYBOOK — follow these steps in order

### Step 0 — Interview the user (do this first, before editing anything)
Ask, then confirm back, the following. **Branding must match the user's company if they have one.**
- **Domain & role**: who is this OS for? (e.g. "General Counsel's office", "RevOps", "Hospital ops")
- **Company / product name & branding**: company name, product name (e.g. "Legal Command"), brand
  colors (or a logo file), tone. If they don't have a company, keep neutral defaults.
- **Journeys**: the 3–8 core workflows the agent should run (names + a one-line goal each).
- **Skills**: the capabilities behind those journeys (often one skill per journey + cross-cutting ones).
- **Knowledge**: what data/policies the agent reads (file types, example schemas, what's always-loaded).
- **Compliance/guardrails**: frameworks, thresholds, what needs human approval.
- **Integrations**: the source systems the agent pulls from (map to the generic system vocabulary).

Use the AskUserQuestion tool for the high-leverage choices. Don't guess branding.

### Step 1 — Apply branding
- Edit `artifacts/dashboard/src/lib/brand.ts` (`productName`, `productTagline`, `companyName`,
  `logoSrc`, `poweredBy`). These flow into the sidebar, titles, and copy.
- Replace the logo at `artifacts/dashboard/public/logo.webp`.
- Tune the theme in `artifacts/dashboard/src/index.css` inside the `/* === BRAND THEME (edit me) === */`
  block (palette HSL vars + fonts). Update `<title>` in `artifacts/dashboard/index.html`.

### Step 2 — Define the agent identity (`agent/`)
Rewrite `SOUL.md` (persona/voice/values), `RULES.md` (MUST ALWAYS / MUST NEVER / ESCALATION), and
`DUTIES.md` (responsibilities) for the domain. Update `agent.yaml`: `name`, `description`, the
`skills:` list, and the `compliance` block (frameworks, human_in_the_loop). Keep the `model`,
`tools`, and `runtime` blocks unless asked.

### Step 3 — Add skills
For each capability, copy `agent/skills/example-skill/` to `agent/skills/<skill-id>/` and write its
`SKILL.md`. **Every SKILL.md MUST begin with YAML frontmatter** (`name:` + `description:`) or GitClaw
silently skips it. Document When-to-Use, Data Requirements, Methodology, Output Format. Add optional
`scripts/` for deterministic computation. List the skill in `agent.yaml`.

### Step 4 — Add knowledge
Put data files under `agent/knowledge/` (small always-load docs like `org-structure.md`) and
per-journey datasets under `agent/knowledge/journey-data/<journey>/`. Catalog everything in
`agent/knowledge/index.yaml` with `tags` + `always_load` (small/critical files only). Keep large
data `always_load: false`.

### Step 5 — Scaffold each journey
For each journey `X`:
1. Copy `dashboard/src/pages/example-journey.tsx` → `pages/X.tsx`; set `const JOURNEY = "X"`, swap
   the placeholder metrics/pending-actions/nudges for the domain.
2. Add `<Route path="/X" component={X} />` in `dashboard/src/App.tsx`.
3. Add a nav item under "Agent Journeys" in `dashboard/src/components/layout.tsx` (and add `/X` to
   `JOURNEY_PATHS` there so the chat rail reserves space).
4. Add a `JOURNEY_CONFIG["X"]` entry in `dashboard/src/lib/journey-config.ts` (cadence, SLA,
   scenarios, calendar, evidence pack, hand-off roles).
5. In `api-server/src/routes/journey-analyze.ts` add `X` to `JOURNEY_SKILL_MAP`, `JOURNEY_DATA_MAP`,
   `JOURNEY_SECTIONS` (the sections the AI outputs), and optionally `JOURNEY_GATES`, `JOURNEY_DELTAS`,
   plus `FILE_TO_TOOL` entries for the journey's data files.

### Step 6 — Command Center, Observe & Build content
Update `pages/command-center.tsx` + `components/home-metrics.tsx` (KPIs, journey cards, insights).
Update the Observe pages' sample data (`decision-inbox.tsx`, `agent-runs.tsx`, `audit-trail.tsx`,
`compliance-*.tsx`) and Build pages as needed. Update the backend `dashboard.ts` handlers to return
your domain's KPIs/insights/activity (keep the response shapes).

### Step 7 — Run & verify
See **§6 Running & verifying**. Boot the server + dashboard, run the journey end-to-end (Run Agent →
pipeline → streamed AI conclusion), use the Agent Console chat, and `pnpm run typecheck` at the root.

---

## 5. The example you're starting from
- Journey: **`example-journey`** (`pages/example-journey.tsx`, route `/example-journey`).
- Skill: **`example-skill`** (`agent/skills/example-skill/`).
- Data: `agent/knowledge/journey-data/example-journey/{sample.csv,records.csv}` + `example-data.json`.
- Sections: `overview`, `checks`, `output` (in `JOURNEY_SECTIONS["example-journey"]`).
- Generic integration systems: `erp | database | api | warehouse | messaging | internal`
  (defined in `dashboard/src/lib/journey-events.ts` + branded in `lib/tool-registry.ts`; the backend
  type is in `journey-analyze.ts`). Keep these three in sync if you change the set.

Duplicate these to add real journeys/skills; delete `example-*` once you have your own.

---

## 6. Running & verifying

```bash
pnpm install                       # from repo root (pnpm workspace, Node 24)
pnpm run typecheck                 # composite typecheck across all packages — must be clean

# API server (needs PORT + the Anthropic integration env vars)
PORT=8080 AI_INTEGRATIONS_ANTHROPIC_API_KEY=… AI_INTEGRATIONS_ANTHROPIC_BASE_URL=… \
  pnpm --filter @workspace/api-server dev
# Dashboard (Vite proxies /api → :8080)
pnpm --filter @workspace/dashboard dev
```

Smoke test: Home renders; open **Example Journey** → **Run Agent** → the pipeline advances and the
AI Conclusion streams `[SECTION]` cards; the **Agent Console** chat streams a reply; Build + Observe
pages render. If running on Replit, the `.replit` config runs the `api-server` artifact and serves
the built `dashboard`.

---

## 7. Conventions & pitfalls
- **Skill frontmatter is mandatory** — no `name:`/`description:` YAML → GitClaw skips the skill.
- **Keep the server a thin passthrough** — don't build prompts from skill files in the server; let
  GitClaw load them. The journey-analyze route pre-loads data into the prompt on purpose (so the
  structured `[SECTION]` output is single-shot); chat/wiki use the full agentic tool loop.
- **Abort with `res.on("close")`**, never `req.on("close")`.
- **Path**: use `AGENT_DIR` from `api-server/src/lib/agent-dir.ts`; set the `AGENT_DIR` env var if
  the agent directory isn't at the default location.
- **Typecheck from the root** (`pnpm run typecheck`) — it's a composite TS project with references.
- **Three-place sync** for journeys (route + nav + journey-config + server maps) and for the
  `SourceSystem` set (frontend type, tool-registry, backend type).
- **No emojis in UI** — Lucide icons only (existing convention).

---

## 8. Reference docs
- `AGENTIC_OS_BUILD_GUIDE.md` — deeper narrative on the architecture & journey pattern.
- `OBSERVE_SECTION_GUIDE.md` — how the Decision Inbox / Agent Runs / Audit Trail work.
- `README.md` — quickstart.
