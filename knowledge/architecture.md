# AgenticOS Architecture (three layers)

An AgenticOS is a full-stack product, not a chatbot. Three layers, with a **thin server** that
never calls the LLM directly — it calls the GitClaw runtime and streams the events back.

```
Frontend (React + Vite)            artifacts/dashboard/
   │  POST /api/agent/chat (SSE), /api/journey/{prepare,analyze} (SSE)
   ▼
Server (Express, thin wrapper)     artifacts/api-server/
   │  query({ dir: AGENT_DIR, prompt, model, ... })   ← the ONLY AI call
   ▼
GitClaw runtime (the agent engine)  (npm: gitclaw)
   │  loads agent.yaml + SOUL/RULES/DUTIES + skills + knowledge index,
   │  builds the system prompt + tools (read/write/cli/memory), runs the agentic
   │  loop, calls Claude, streams delta / tool_use / tool_result / assistant events
   ▼
Agent definition (flat files)      agent/
   ▼
Anthropic Claude (via the Replit AI proxy — env bridging)
```

## Non-negotiables
- **Server is a passthrough.** It does not build prompts from skill files; GitClaw loads the
  agent's own skills/knowledge. The only domain-specific server code is small maps in
  `journey-analyze.ts`.
- **Model**: `anthropic:claude-sonnet-4-6` (pi-ai registry id). Env bridging maps Replit's
  `AI_INTEGRATIONS_ANTHROPIC_*` vars to what GitClaw/pi-ai expect.
- **Abort with `res.on("close")`**, never `req.on("close")` (request close fires after the body
  is read).
- **Agent dir path** is centralized in `api-server/src/lib/agent-dir.ts` (`AGENT_DIR`,
  overridable via the `AGENT_DIR` env var; default `/home/runner/workspace/agent`).

## Two AI flows
- **Chat** (`/api/agent/chat`) — full GitClaw agentic tool loop; the agent decides what to read.
- **Journey analyze** (`/api/journey/analyze`) — pre-loads the journey's skill + data into the
  prompt and asks for a single-shot structured `[SECTION]{json}[CONTENT]…[/SECTION]` output that
  the `AiConclusion` component parses into cards.

## Monorepo
pnpm workspace (Node 24). `artifacts/{dashboard,api-server,mockup-sandbox}` + `lib/` (OpenAPI
spec + generated React-Query/Zod client, db, Anthropic integration) + the `agent/` brain.
Typecheck from the root: `pnpm run typecheck` (composite TS project).
