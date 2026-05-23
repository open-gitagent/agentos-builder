// Transport: this runner uses JSON request/response (POST /journey/prepare for
// the run plan + POST /journey/audit for per-event breadcrumbs + polled GET
// /api/audit/runs and /api/journey/runs/:runId for the audit drawer). SSE is
// intentionally deferred — the prepared plan is short, the audit drawer
// already polls at 4s, and a full streaming contract would not change UX
// today. Migrating to SSE is a single seam (replace `runPipeline`'s setTimeout
// loop with an EventSource consumer) once the backend serves a stream.
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, CheckCircle2, Play, Pause, Settings, BookOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStickToBottom } from "@/lib/use-stick-to-bottom";
import { AiConclusion } from "./ai-conclusion";
import { JourneyEventTimeline, isAwaitingApproval } from "./journey-event-timeline";
import type { JourneyEvent, RunnerPhase, ApprovalGateEvent } from "@/lib/journey-events";

interface PipelineStep {
  id: string;
  label: string;
  detail: string;
  type: "config" | "skill" | "file";
}

type Phase = RunnerPhase;

export function useAgentPipeline(journey: string) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentEventIdx, setCurrentEventIdx] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<{ id: string; label: string; delta: string } | null>(null);
  const [haltReason, setHaltReason] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const runIdRef = useRef<string | null>(null);
  runIdRef.current = runId;
  const abortRef = useRef<AbortController | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventsRef = useRef<JourneyEvent[]>([]);
  const idxRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;
  eventsRef.current = events;

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const audit = useCallback((entry: { type?: string; actor?: string; action: string; details?: string; eventId?: string }) => {
    fetch("/api/journey/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor: "Agent", ...entry, journey, runId: runIdRef.current ?? undefined }),
    }).catch(() => undefined);
  }, [journey]);

  const advanceFrom = useCallback((startIdx: number) => {
    const tick = (i: number) => {
      if (phaseRef.current === "paused" || phaseRef.current === "halted") return;
      const evts = eventsRef.current;
      if (i >= evts.length) {
        setCurrentEventIdx(evts.length);
        idxRef.current = evts.length;
        setPhase("analyzing");
        return;
      }
      const evt = evts[i];
      idxRef.current = i;
      // Mark as running, then ok after latency
      setEvents(prev => prev.map((e, j) => j === i ? { ...e, status: "running" as const } : e));
      setCurrentEventIdx(i);

      // Per-event audit: log the start of every runtime event into the in-memory run log
      if (evt.type !== "audit_event") {
        const summary =
          evt.type === "tool_call" ? `${(evt as { system: string; verb: string }).system} · ${(evt as { verb: string }).verb}` :
          evt.type === "skill_invocation" ? (evt as { skill: string; label: string }).label :
          evt.type === "notification" ? `${(evt as { channel: string }).channel} → ${(evt as { recipient: string }).recipient}` :
          evt.type === "approval_gate" ? (evt as ApprovalGateEvent).title :
          evt.type;
        audit({
          type: evt.type === "tool_call" ? "tool_call" :
                evt.type === "skill_invocation" ? "skill_invocation" :
                evt.type === "notification" ? "notification" :
                evt.type === "approval_gate" ? "approval_gate" :
                evt.type === "delta" ? "delta" : "agent_action",
          actor: "Agent",
          action: `event:${evt.type} → ${summary}`,
          details: `event ${i + 1}/${evts.length}`,
          eventId: evt.id,
        });
      }

      if (evt.type === "approval_gate") {
        setEvents(prev => prev.map((e, j) => j === i ? { ...e, status: "awaiting" as const } : e));
        setPhase("awaiting_approval");
        audit({ type: "guardrail_trigger", actor: "System", action: `Approval gate awaiting: ${(evt as ApprovalGateEvent).title}`, details: (evt as ApprovalGateEvent).rationale, eventId: evt.id });
        return;
      }

      const baseDelay = evt.type === "tool_call" ? Math.max(180, (evt as { latencyMs: number }).latencyMs) :
                        evt.type === "skill_invocation" ? 360 :
                        evt.type === "notification" ? 240 : 200;
      advanceTimer.current = setTimeout(() => {
        setEvents(prev => prev.map((e, j) => j === i ? { ...e, status: "ok" as const } : e));
        if (evt.type !== "audit_event") {
          audit({ type: "system_event", actor: "System", action: `event:${evt.type} ok`, details: `event ${i + 1}/${evts.length} completed`, eventId: evt.id });
        }
        const legacyDone = evts.slice(0, i + 1).filter(e => e.type === "skill_invocation" || e.type === "tool_call").length;
        setCurrentStep(legacyDone);
        idxRef.current = i + 1;
        if (i + 1 >= evts.length) {
          audit({ type: "run_lifecycle", actor: "System", action: "run completed", details: `${evts.length} events` });
        }
        tick(i + 1);
      }, baseDelay);
    };
    tick(startIdx);
  }, [audit]);

  const startPipeline = useCallback(async (scenario?: { id: string; label: string; delta: string } | null) => {
    if (phase === "pipeline" || phase === "analyzing" || phase === "awaiting_approval" || phase === "paused") return;
    setPhase("pipeline");
    setSteps([]);
    setEvents([]);
    setCurrentStep(0);
    setCurrentEventIdx(-1);
    setError(null);
    setHaltReason(null);
    setActiveScenario(scenario ?? null);
    idxRef.current = 0;
    // Generate a per-run identifier and propagate via runIdRef so every audit
    // POST in this run is scoped under it.
    const newRunId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setRunId(newRunId);
    runIdRef.current = newRunId;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/journey/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ journey, scenario: scenario?.id ?? null }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Prepare failed (${res.status})`);
      const data = await res.json();
      const evts: JourneyEvent[] = data.events || [];
      const lsteps: PipelineStep[] = data.steps || [];
      if (evts.length === 0) throw new Error("No pipeline events returned");
      // Inject a synthetic audit_event at the top of the timeline so the
      // event mix always includes audit_event in the visible stream.
      const startAudit: JourneyEvent = {
        id: `ae-${Date.now()}-start`,
        ts: new Date().toISOString(),
        type: "audit_event",
        actor: "user@example.com",
        action: scenario ? `Started what-if scenario: ${scenario.label}` : `Started ${journey.replace(/-/g, " ")} run`,
        details: scenario ? `Scenario tag · ${scenario.delta} · ${evts.length} events scheduled (sandbox — no source-system writes)` : `${evts.length} events scheduled`,
        journey,
        status: "ok",
      };
      const enriched = [startAudit, ...evts];
      setSteps(lsteps);
      setEvents(enriched);
      eventsRef.current = enriched;
      audit({
        type: "run_lifecycle",
        action: scenario ? `run started (scenario: ${scenario.label})` : `run started`,
        details: scenario ? `Scenario ${scenario.id} · ${scenario.delta} · ${evts.length} events` : `${evts.length} events scheduled`,
      });
      if (scenario) {
        audit({ type: "scenario_run", action: `Started what-if scenario: ${scenario.label}`, details: `Scenario ${scenario.id} · ${scenario.delta}` });
      }
      advanceTimer.current = setTimeout(() => advanceFrom(0), 250);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e.name === "AbortError") return;
      setError(e.message || "Pipeline failed");
      setPhase("idle");
    }
  }, [phase, journey, advanceFrom, audit]);

  const pausePipeline = useCallback(() => {
    if (phase === "pipeline") {
      setPhase("paused");
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      audit({ type: "user_decision", actor: "user@example.com", action: "Paused run", details: `At event ${currentEventIdx + 1}/${events.length}` });
    } else if (phase === "paused") {
      setPhase("pipeline");
      const resumeIdx = Math.max(0, idxRef.current);
      advanceFrom(resumeIdx);
      audit({ type: "user_decision", actor: "user@example.com", action: "Resumed run", details: `From event ${resumeIdx + 1}/${events.length}` });
    }
  }, [phase, currentEventIdx, events.length, advanceFrom, audit]);

  const decideApproval = useCallback((gateId: string, decision: "approved" | "rejected", comment: string, decidedBy: string, meta?: { firstApprover?: ApprovalGateEvent["firstApprover"]; secondApprover?: ApprovalGateEvent["secondApprover"] }) => {
    const i = currentEventIdx;
    setEvents(prev => prev.map((e, j) => {
      if (j !== i || e.type !== "approval_gate") return e;
      return { ...e, status: decision, decision, decidedBy, comment, firstApprover: meta?.firstApprover, secondApprover: meta?.secondApprover } as ApprovalGateEvent;
    }));
    const evt = events[i] as ApprovalGateEvent | undefined;
    const dualSummary = meta?.firstApprover && meta?.secondApprover
      ? ` · 1st=${meta.firstApprover.name}${meta.firstApprover.role ? ` (${meta.firstApprover.role})` : ""} · 2nd=${meta.secondApprover.name}${meta.secondApprover.role ? ` (${meta.secondApprover.role})` : ""}`
      : meta?.firstApprover
        ? ` · signer=${meta.firstApprover.name}${meta.firstApprover.role ? ` (${meta.firstApprover.role})` : ""}`
        : "";
    audit({
      type: "user_decision",
      actor: decidedBy,
      action: `${decision === "approved" ? "Approved" : "Rejected"} gate: ${evt?.title || gateId}`,
      details: (comment || (decision === "approved" ? "No comment" : "Rejected without comment")) + dualSummary,
      eventId: evt?.id,
    });
    if (decision === "rejected") {
      const reason = `Gate "${evt?.title || gateId}" rejected by ${decidedBy}${comment ? ` — ${comment}` : ""}`;
      setHaltReason(reason);
      audit({ type: "run_lifecycle", actor: decidedBy, action: "run halted (rejected at gate)", details: reason, eventId: evt?.id });
    }
    // Inject an audit_event into the visible timeline so the gate decision is durable in the stream
    const decisionEvent: JourneyEvent = {
      id: `ae-${Date.now()}-gate-${gateId}`,
      ts: new Date().toISOString(),
      type: "audit_event",
      actor: decidedBy,
      action: `${decision === "approved" ? "Approved" : "Rejected"} gate: ${evt?.title || gateId}`,
      details: comment || (decision === "approved" ? "No comment" : "Rejected without comment"),
      journey,
      status: decision === "approved" ? "ok" : "failed",
    };
    setEvents(prev => {
      const next = [...prev.slice(0, i + 1), decisionEvent, ...prev.slice(i + 1)];
      eventsRef.current = next;
      return next;
    });
    // Always advance currentEventIdx past the inserted decision audit_event so
    // it is durably visible in the timeline (including on reject/halt).
    setCurrentEventIdx(i + 1);
    idxRef.current = i + 2;
    if (decision === "rejected") {
      setPhase("halted");
      return;
    }
    setPhase("pipeline");
    advanceTimer.current = setTimeout(() => advanceFrom(i + 2), 200);
  }, [currentEventIdx, events, advanceFrom, audit, journey]);

  const runScenario = useCallback((scenario: { id: string; label: string; delta: string }) => {
    if (phase === "pipeline" || phase === "analyzing" || phase === "awaiting_approval" || phase === "paused") return;
    void startPipeline(scenario);
  }, [phase, startPipeline]);

  const clearScenario = useCallback(() => setActiveScenario(null), []);

  return {
    phase, setPhase, steps, events, currentStep, currentEventIdx, error,
    startPipeline, pausePipeline, decideApproval, runScenario,
    activeScenario, clearScenario, runId, haltReason,
    awaitingApproval: isAwaitingApproval(events, currentEventIdx),
  };
}

const stepIcon = (type: PipelineStep["type"]) => {
  switch (type) {
    case "config": return Settings;
    case "skill": return BookOpen;
    case "file": return FileText;
  }
};

export function AgentPipelineButton({
  phase,
  onClick,
  label = "Run Agent",
}: {
  phase: Phase | "idle" | "pipeline" | "analyzing" | "complete";
  onClick: () => void;
  label?: string;
}) {
  const isBusy = phase === "pipeline" || phase === "analyzing" || phase === "awaiting_approval" || phase === "paused";
  return (
    <button
      onClick={onClick}
      disabled={isBusy}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
        !isBusy ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground"
      )}
    >
      {phase === "idle" || phase === "complete" ? <><Play className="w-4 h-4" /> {label}</> :
       phase === "pipeline" ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> :
       phase === "analyzing" ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> :
       phase === "awaiting_approval" ? <><Pause className="w-4 h-4" /> Awaiting approval</> :
       phase === "paused" ? <><Pause className="w-4 h-4" /> Paused</> :
       <><CheckCircle2 className="w-4 h-4" /> Complete</>}
    </button>
  );
}

interface ContentProps {
  phase: Phase | "idle" | "pipeline" | "analyzing" | "complete";
  steps: PipelineStep[];
  events?: JourneyEvent[];
  currentStep: number;
  currentEventIdx?: number;
  error: string | null;
  analyzeJourney: string;
  uploadedFiles?: { name: string; content: string }[];
  onComplete: () => void;
  onApprovalDecide?: (gateId: string, decision: "approved" | "rejected", comment: string, decidedBy: string, meta?: { firstApprover?: ApprovalGateEvent["firstApprover"]; secondApprover?: ApprovalGateEvent["secondApprover"] }) => void;
  haltReason?: string | null;
}

export function AgentPipelineContent({
  phase, steps, events = [], currentStep, currentEventIdx = -1,
  error, analyzeJourney, uploadedFiles, onComplete, onApprovalDecide, haltReason,
}: ContentProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isStreaming = phase === "pipeline" || phase === "analyzing" || phase === "awaiting_approval";
  useStickToBottom({ endRef: bottomRef, deps: [phase, currentStep, currentEventIdx], enabled: isStreaming });

  const showLegacy = events.length === 0 && steps.length > 0;
  const showTyped = events.length > 0;
  // Keep the AI conclusion mounted after the analysis stream finishes so the
  // rendered output stays on the page. AiConclusion sets `hasStarted` once it
  // begins streaming and only renders its body when started — so mounting it
  // during the "complete" phase is a no-op until something has actually run.
  const showAnalyzing = phase === "analyzing" || phase === "complete";

  return (
    <>
      {error && (<div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</div>)}

      {phase === "halted" && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Run halted
          </div>
          {haltReason && <p className="text-xs text-red-700/90 mt-1">Reason: {haltReason}</p>}
          <p className="text-[11px] text-red-700/70 mt-1">Re-run to retry from the beginning.</p>
        </div>
      )}

      {showTyped && (
        <JourneyEventTimeline
          events={events}
          currentIndex={currentEventIdx}
          onApprovalDecide={(gateId, decision, comment, decidedBy, meta) => onApprovalDecide?.(gateId, decision, comment, decidedBy, meta)}
        />
      )}

      {showLegacy && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Agent Pipeline</h3>
          <div className="space-y-1.5">
            {steps.map((step, i) => {
              const isDone = i < currentStep;
              const isActive = i === currentStep && phase === "pipeline";
              const StepIcon = stepIcon(step.type);
              return (
                <div key={step.id} className={cn("flex items-center gap-3 py-1.5 px-3 rounded-lg text-sm transition-all", isActive && "bg-primary/5")}>
                  {isActive ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> :
                   isDone ? <CheckCircle2 className="w-4 h-4 text-primary" /> :
                   <StepIcon className="w-4 h-4 text-muted-foreground" />}
                  <span className={cn("flex-1", isDone || isActive ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
                  {step.detail && <span className="text-[10px] text-muted-foreground">{step.detail}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAnalyzing && (
        <AiConclusion journey={analyzeJourney} files={uploadedFiles} onComplete={onComplete} />
      )}
      <div ref={bottomRef} />
    </>
  );
}

export type { Phase as AgentPhase };
