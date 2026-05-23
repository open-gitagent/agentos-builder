// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE JOURNEY — the reference template for a "journey page".
//
// A journey is one end-to-end workflow your agent runs. Copy this file to create
// a new journey (e.g. `contract-review.tsx`), then:
//   1. pick a new id below (must match the server maps + journey-config entry)
//   2. add a <Route> in App.tsx and a nav item in components/layout.tsx
//   3. add a JOURNEY_CONFIG entry in lib/journey-config.ts (cadence, SLA, scenarios…)
//   4. add the journey to the server maps in api-server journey-analyze.ts
//      (JOURNEY_SKILL_MAP, JOURNEY_DATA_MAP, JOURNEY_SECTIONS, prepare events)
//   5. replace the placeholder metrics / pending actions / nudges with your domain
//
// Everything here is assembled from reusable components — you should rarely need
// to touch those. See CLAUDE.md for the full playbook.
// ─────────────────────────────────────────────────────────────────────────────
import { Boxes, ListChecks, FileText } from "lucide-react";
import { JourneyHeaderActions, JourneySlaRail } from "@/components/journey-shell";
import { useAgentPipeline, AgentPipelineContent } from "@/components/agent-pipeline";
import { JourneyChatPanel } from "@/components/journey-chat-panel";
import { PendingActionsStrip, type PendingAction } from "@/components/pending-actions-strip";
import { NoDataState, SampleDataBadge } from "@/components/no-data-state";
import { useSampleData } from "@/components/sample-data-context";

// The journey id — must match the server maps and the journey-config key.
const JOURNEY = "example-journey";

// Items that need a human's attention. Replace with your domain's real actions.
const PENDING_ACTIONS: PendingAction[] = [
  {
    id: "ex-1",
    priority: "warning",
    description: "2 example records need review before this run can be certified",
    subDescription: "Placeholder — replace with your domain's real pending actions",
    cta: "Review",
  },
];

// Contextual prompts shown in the chat rail. Make these specific to your journey.
const CHAT_NUDGES = [
  { label: "What does this journey do?", prompt: "Explain what the Example Journey does and how I would adapt it for my own domain." },
  { label: "Summarize the sample data", prompt: "Summarize the sample dataset loaded for this journey." },
];

// Optional: map section ids (from JOURNEY_SECTIONS on the server) to icons.
const SECTION_ICONS = { overview: Boxes, checks: ListChecks, output: FileText };

// A couple of neutral placeholder metrics so the page reads as a real journey.
const SAMPLE_METRICS = [
  { label: "Records in scope", value: "1,284" },
  { label: "Auto-handled", value: "96.2%" },
  { label: "Needs review", value: "2" },
  { label: "Last run", value: "Today 09:00" },
];

export default function ExampleJourney() {
  const { sampleDataEnabled } = useSampleData();
  const p = useAgentPipeline(JOURNEY);

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <JourneyHeaderActions
        journey={JOURNEY}
        title="Example Journey"
        subtitle="A worked example of the Universal Journey Pattern — duplicate this to build your own."
        runPhase={p.phase}
        onRun={() => p.startPipeline()}
        onPause={p.pausePipeline}
        onRunScenario={p.runScenario}
        activeScenario={p.activeScenario}
        onClearScenario={p.clearScenario}
        runId={p.runId}
      />

      {sampleDataEnabled && <PendingActionsStrip actions={PENDING_ACTIONS} />}

      <JourneySlaRail journey={JOURNEY} />

      {/* Domain-specific content area. When sample data is off, show the empty state. */}
      {sampleDataEnabled ? (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-bold text-foreground">Overview</h2>
            <SampleDataBadge />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SAMPLE_METRICS.map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{m.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Replace this block with your journey's real metrics, tables, and visualizations.
            The agent pipeline and AI conclusion below are wired to real backend endpoints.
          </p>
        </div>
      ) : (
        <NoDataState
          title="No data loaded"
          description="Run the agent to generate output, or enable the Sample Data toggle to preview demonstration content."
        />
      )}

      {/* Real agent run: pipeline timeline + streamed AI conclusion (sections). */}
      <AgentPipelineContent
        phase={p.phase}
        steps={p.steps}
        events={p.events}
        currentStep={p.currentStep}
        currentEventIdx={p.currentEventIdx}
        error={p.error}
        analyzeJourney={JOURNEY}
        onComplete={() => p.setPhase("complete")}
        onApprovalDecide={p.decideApproval}
        haltReason={p.haltReason}
      />

      {/* Always-on chat rail scoped to this journey. */}
      <JourneyChatPanel journeyName="Example Journey" nudges={CHAT_NUDGES} />
    </div>
  );
}

// SECTION_ICONS is exported for reference; AgentPipelineContent renders AiConclusion
// with sensible default icons, so passing them is optional.
export { SECTION_ICONS };
