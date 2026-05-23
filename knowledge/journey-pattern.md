# The Universal Journey Pattern

Every journey page is the same skeleton, assembled from reusable components. You change content
and wiring, not the components.

## On the page (`pages/<journey>.tsx`)
1. `useAgentPipeline(journeyId)` — run-state machine. `startPipeline()` POSTs
   `/api/journey/prepare`, which returns timeline **events** + **steps**; the hook animates them,
   then enters the `analyzing` phase.
2. `<JourneyHeaderActions>` — title, cadence/SLA badges, Run/Pause, What-if scenarios, Evidence,
   Hand-off, and an Audit drawer (reads `journey-config.ts`).
3. `<PendingActionsStrip>` — items needing human attention (gated by `useSampleData()`).
4. Domain content — your metrics/tables/charts.
5. `<AgentPipelineContent>` — renders the live event timeline + `<AiConclusion>`, which streams
   real Claude output as `[SECTION]{json}[CONTENT]…[/SECTION]` blocks and renders cards.
6. `<JourneyChatPanel>` — always-on chat rail scoped to the journey.

## The four-point wiring (keep in sync)
- **route** — `dashboard/src/App.tsx`
- **nav** — `dashboard/src/components/layout.tsx` (+ add the path to `JOURNEY_PATHS`)
- **config** — `dashboard/src/lib/journey-config.ts` (cadence, SLA, scenarios, calendar, …)
- **server maps** — `api-server/src/routes/journey-analyze.ts`: `JOURNEY_SKILL_MAP`,
  `JOURNEY_DATA_MAP`, `JOURNEY_SECTIONS`, optional `JOURNEY_GATES` / `JOURNEY_DELTAS` /
  `FILE_TO_TOOL`.

## Reusable building blocks (do not rebuild)
`agent-pipeline.tsx` (`useAgentPipeline`, `AgentPipelineContent`), `ai-conclusion.tsx`,
`journey-shell.tsx`, `journey-chat-panel.tsx`, `journey-event-timeline.tsx`, `tool-call-card.tsx`,
`pending-actions-strip.tsx`, `sample-data-context.tsx`, plus `lib/{journey-events, journey-config,
journey-rail-bus, read-files, runner-machine, tool-registry}.ts`.

## Integration "systems"
Tool-call events carry a generic `system` (erp/database/api/warehouse/messaging/internal) defined
in `lib/journey-events.ts`, branded in `lib/tool-registry.ts`, and mirrored in the backend type in
`journey-analyze.ts`. Keep those three in sync if you extend the set.

## Start from the example
`example-journey` (page, route, nav, config, server maps, `example-skill`, and the data under
`agent/knowledge/journey-data/example-journey/`) is a complete worked instance. Copy it to add a
real journey; delete it once your own journeys exist.
