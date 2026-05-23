import { useEffect, useState } from "react";
import { Bot, User, FileText, AlertTriangle, Download, Loader2, ShieldCheck, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSampleData } from "@/components/sample-data-context";
import { NoDataState } from "@/components/no-data-state";

type EventType = "agent_action" | "user_decision" | "system_event" | "guardrail_trigger" | "tool_call" | "approval_gate" | "notification";

interface AuditEvent {
  id: string;
  timestamp: string;
  type: EventType;
  actor: string;
  action: string;
  details: string;
  journey?: string;
  entity?: string;
}

const SEED_EVENTS: AuditEvent[] = [
  { id: "AE-1247", timestamp: "Today 08:42:15", type: "agent_action", actor: "Example Agent", action: "Started example run", details: "Loaded 3 data files (example-data.json, reference-dataset.json, org-structure.md) — 1,300 records ingested", journey: "Example Journey", entity: "Records" },
  { id: "AE-1246", timestamp: "Today 08:42:18", type: "agent_action", actor: "Example Agent", action: "Auto-handled 1,282 records", details: "96.2% auto-handled rate achieved — 18 items surfaced for review", journey: "Example Journey" },
  { id: "AE-1245", timestamp: "Today 08:42:22", type: "guardrail_trigger", actor: "System", action: "Flagged 2 records below quality threshold", details: "2 records scored below the 0.90 quality threshold — routed to Decision Inbox for manual review", journey: "Example Journey" },
  { id: "AE-1244", timestamp: "Today 08:38:04", type: "agent_action", actor: "Example Agent", action: "Started validation run", details: "Step 2 of 5 — loaded example-data.json, reference-dataset.json", journey: "Example Journey", entity: "Records" },
  { id: "AE-1243", timestamp: "Today 08:38:12", type: "guardrail_trigger", actor: "System", action: "Approval gate triggered", details: "Batch of 1,284 records exceeds the 1,000-record auto-approve threshold — Reviewer approval required per Policy A", journey: "Example Journey" },
  { id: "AE-1242", timestamp: "Today 08:15:00", type: "agent_action", actor: "Example Agent", action: "Processed 1,247 records", details: "94.6% match rate against the reference dataset — 3 potential duplicates detected", journey: "Example Journey" },
  { id: "AE-1241", timestamp: "Today 07:30:00", type: "agent_action", actor: "Example Agent", action: "Computed run metrics", details: "Uptime: 99.2% — Quality: 92.4% — 3 data files processed", journey: "Example Journey" },
  { id: "AE-1240", timestamp: "Today 06:00:00", type: "system_event", actor: "System", action: "Scheduled run failed", details: "Error: Unable to parse example-data.json row 47 — malformed field. Run terminated after 3.2s", journey: "Example Journey" },
  { id: "AE-1239", timestamp: "Yesterday 18:15", type: "user_decision", actor: "owner@example.com", action: "Approved batch update", details: "Batch update of 1,284 records — approved via Decision Inbox", journey: "Example Journey", entity: "Records" },
  { id: "AE-1238", timestamp: "Yesterday 18:00", type: "agent_action", actor: "Example Agent", action: "Completed output-safety check", details: "0 violations across 1,232 records — PII redaction applied to all free-text fields", journey: "Example Journey" },
  { id: "AE-1237", timestamp: "Yesterday 16:30", type: "agent_action", actor: "Example Agent", action: "Generated run summary", details: "10 metrics analyzed — 3 exceed the 15% variance threshold — draft summary generated for review", journey: "Example Journey" },
  { id: "AE-1236", timestamp: "Yesterday 14:05", type: "user_decision", actor: "owner@example.com", action: "Released run summary", details: "Run summary for the latest example journey — output package approved", journey: "Example Journey" },
];

const typeConfig: Record<EventType, { label: string; color: string; icon: typeof Bot }> = {
  agent_action: { label: "Agent", color: "bg-primary/10 text-primary", icon: Bot },
  user_decision: { label: "User", color: "bg-blue-50 text-blue-700", icon: User },
  system_event: { label: "System", color: "bg-gray-50 text-gray-600", icon: FileText },
  guardrail_trigger: { label: "Guardrail", color: "bg-amber-50 text-amber-700", icon: AlertTriangle },
  tool_call: { label: "Tool", color: "bg-sky-50 text-sky-700", icon: FileText },
  approval_gate: { label: "Gate", color: "bg-amber-50 text-amber-700", icon: ShieldCheck },
  notification: { label: "Notify", color: "bg-fuchsia-50 text-fuchsia-700", icon: Bell },
};

function formatTs(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return sameDay ? `Today ${time}` : `${d.toLocaleDateString()} ${time}`;
}

export default function AuditTrail() {
  const { sampleDataEnabled } = useSampleData();
  const [liveEntries, setLiveEntries] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/audit/events?limit=200")
        .then(r => r.json())
        .then(d => {
          if (cancelled) return;
          const mapped: AuditEvent[] = (d.events || []).map((e: { id: string; ts: string; type: EventType; actor: string; action: string; details: string; journey?: string; entity?: string }) => ({
            id: e.id,
            timestamp: formatTs(e.ts),
            type: e.type,
            actor: e.actor,
            action: e.action,
            details: e.details,
            journey: e.journey,
            entity: e.entity,
          }));
          setLiveEntries(mapped);
          setLoading(false);
        })
        .catch(e => { if (!cancelled) { setErr(String(e)); setLoading(false); } });
    };
    load();
    const t = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const events: AuditEvent[] = sampleDataEnabled
    ? [...liveEntries, ...SEED_EVENTS]
    : liveEntries;

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Audit Trail</h1>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live · {liveEntries.length} runtime events
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Complete chronological record of all agent actions, user decisions, and system events</p>
        </div>
        <button className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" /> Export Log
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {err && <div className="text-xs text-red-600 mb-3">{err}</div>}
        {events.length === 0 ? (
          <NoDataState
            title="No audit events recorded"
            description="Agent actions, user decisions, and system events will appear here as they occur. Run any journey agent or enable Sample Data to view events."
          />
        ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-6 bottom-0 w-[2px] bg-border" />
          <div className="space-y-4">
            {events.map((event) => {
              const config = typeConfig[event.type] ?? typeConfig.system_event;
              const EventIcon = config.icon;
              return (
                <div key={event.id} className="relative flex gap-4 pl-10">
                  <div className={cn("absolute left-0 w-10 h-10 rounded-full flex items-center justify-center z-10", config.color)}>
                    <EventIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", config.color)}>{config.label}</span>
                      <span className="text-[10px] text-muted-foreground">{event.actor}</span>
                      {event.journey && <span className="text-[10px] text-muted-foreground">· {event.journey}</span>}
                      {event.entity && <span className="text-[10px] text-muted-foreground">· {event.entity}</span>}
                      <span className="text-[10px] text-muted-foreground ml-auto font-mono">{event.id}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{event.action}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{event.details}</p>
                    <div className="mt-2 text-[10px] text-muted-foreground">{event.timestamp}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
