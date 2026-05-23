// Lightweight in-process event bus that lets a journey page push live tool-call
// telemetry into the right-rail JourneyChatPanel — without each panel having to
// know which feature pages exist.
//
// The Multi-Filing Studio (taxonomy refresh + return generation SSE streams)
// publishes ToolEvent records here; the panel subscribes and renders them in
// the same tool-call UI that GitClaw chat uses.

export type JourneyRailToolEventKind =
  | "skill_loading"
  | "tool_use"
  | "tool_result"
  | "file_fetch"
  | "file_write"
  | "memory_update";

export interface JourneyRailToolEvent {
  kind: JourneyRailToolEventKind;
  source: string;
  label: string;
  detail: string;
  status: "running" | "done" | "error";
  ts: number;
}

type Listener = (event: JourneyRailToolEvent) => void;

const listeners = new Set<Listener>();

export function subscribeJourneyRail(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function publishJourneyRail(event: Omit<JourneyRailToolEvent, "ts">): void {
  const full: JourneyRailToolEvent = { ...event, ts: Date.now() };
  for (const l of listeners) {
    try { l(full); } catch { /* one listener's failure must not break others */ }
  }
}
