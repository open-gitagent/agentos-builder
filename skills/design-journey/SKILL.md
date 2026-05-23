---
name: design-journey
description: Add a journey to an AgenticOS by copying the example journey page and keeping all four wiring points in sync — the route, the sidebar nav, journey-config, and the server-side journey maps and sections.
metadata:
  category: build
  version: "1.0.0"
---

# Design a Journey

A *journey* is one end-to-end workflow the agent runs. Each is assembled from reusable
components — you rarely touch those. The work is content + wiring.

## When to Use
For each core workflow the domain expert performs (e.g. "Contract Review", "Pipeline Forecast").

## Methodology
For a journey with id `X` (kebab-case):
1. **Page.** Copy `dashboard/src/pages/example-journey.tsx` → `pages/X.tsx`; set
   `const JOURNEY = "X"`; replace the placeholder metrics, pending actions, and chat nudges with
   the domain's. It already wires `useAgentPipeline`, `AgentPipelineContent`, `AiConclusion`,
   and `JourneyChatPanel`.
2. **Route.** Add `<Route path="/X" component={X} />` in `dashboard/src/App.tsx`.
3. **Nav.** Add an item under "Agent Journeys" in `dashboard/src/components/layout.tsx`, and add
   `/X` to `JOURNEY_PATHS` (so the chat rail reserves space).
4. **Config.** Add `JOURNEY_CONFIG["X"]` in `dashboard/src/lib/journey-config.ts` (cadence, SLA,
   scenarios, calendar, evidence pack, hand-off roles).
5. **Server maps** in `api-server/src/routes/journey-analyze.ts`: add `X` to `JOURNEY_SKILL_MAP`
   (journey→skill), `JOURNEY_DATA_MAP` (journey→data dir), `JOURNEY_SECTIONS` (the `[SECTION]`s
   the AI must output), and optionally `JOURNEY_GATES` (HITL approval gates), `JOURNEY_DELTAS`,
   and `FILE_TO_TOOL` entries for the journey's data files.

## The four-point sync (do not skip)
route (`App.tsx`) · nav (`layout.tsx`) · `journey-config.ts` · server maps (`journey-analyze.ts`).
A journey that's missing any one will render broken or fail to run.

## Output Format
A working journey: it appears in the sidebar, "Run Agent" advances the pipeline, and the AI
conclusion streams sections. Confirm all four wiring points and a passing typecheck.
