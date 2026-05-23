import { useState, useEffect } from "react";
import {
  Play, Pause, Calendar, Sparkles, FolderOpen, UserCog, X, Loader2,
  CheckCircle2, ClipboardList, ShieldAlert, ChevronRight, FileText, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getJourneyConfig, type CalendarItem } from "@/lib/journey-config";
import type { RunnerPhase } from "@/lib/journey-events";

interface ScenarioInfo { id: string; label: string; delta: string }
interface Props {
  journey: string;
  title: string;
  subtitle?: string;
  runPhase: RunnerPhase | "idle" | "pipeline" | "analyzing" | "complete";
  runLabel?: string;
  onRun: () => void;
  onPause?: () => void;
  onRunScenario?: (scenario: ScenarioInfo) => void;
  activeScenario?: ScenarioInfo | null;
  onClearScenario?: () => void;
  runId?: string | null;
}

const calColors: Record<CalendarItem["status"], string> = {
  ok: "border-border bg-card text-foreground",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  critical: "border-red-300 bg-red-50 text-red-900",
};

export function JourneyHeaderActions({ journey, title, subtitle, runPhase, runLabel = "Run Agent", onRun, onPause, onRunScenario, activeScenario, onClearScenario, runId }: Props) {
  const cfg = getJourneyConfig(journey);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const isRunning = runPhase === "pipeline" || runPhase === "analyzing" || runPhase === "awaiting_approval" || runPhase === "paused";
  const isHalted = runPhase === "halted";

  return (
    <>
      {activeScenario && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-xs text-violet-900">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-semibold">What-if scenario active:</span>
          <span>{activeScenario.label}</span>
          <span className="font-mono text-[10px] bg-white/60 border border-violet-200 rounded px-1.5 py-0.5">{activeScenario.delta}</span>
          <span className="text-violet-700/80 italic">— sandbox · no source-system writes</span>
          {onClearScenario && (
            <button onClick={onClearScenario} className="ml-auto text-[11px] underline hover:no-underline">Clear</button>
          )}
        </div>
      )}
      <div className="flex flex-col 2xl:flex-row 2xl:items-start 2xl:justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              {cfg.cadence}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              SLA · {cfg.sla}
            </span>
            {cfg.dualControl && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                Dual control
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isHalted && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Halted
            </span>
          )}
          <button
            onClick={onRun}
            disabled={isRunning}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors",
              isHalted ? "bg-red-600 text-white hover:bg-red-700" :
              !isRunning ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground"
            )}
          >
            {runPhase === "idle" ? <><Play className="w-3.5 h-3.5" /> {runLabel}</> :
             runPhase === "complete" ? <><Play className="w-3.5 h-3.5" /> Re-run</> :
             runPhase === "halted" ? <><Play className="w-3.5 h-3.5" /> Re-run after halt</> :
             runPhase === "awaiting_approval" ? <><Pause className="w-3.5 h-3.5" /> Awaiting approval</> :
             runPhase === "paused" ? <><Pause className="w-3.5 h-3.5" /> Paused</> :
             <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</>}
          </button>
          {isRunning && onPause && (
            <button onClick={onPause} className="px-2.5 py-2 rounded-lg text-xs font-medium border border-border bg-card text-foreground hover:bg-muted/40 flex items-center gap-1.5">
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          )}
          <CtaButton icon={Calendar} label="Schedule" onClick={() => setScheduleOpen(true)} />
          <CtaButton icon={Sparkles} label="What-if" onClick={() => setScenarioOpen(true)} />
          <CtaButton icon={FolderOpen} label="Evidence Pack" onClick={() => setEvidenceOpen(true)} />
          <CtaButton icon={UserCog} label="Hand off" onClick={() => setHandoffOpen(true)} />
          <CtaButton icon={ClipboardList} label="Audit" onClick={() => setAuditOpen(true)} />
        </div>
      </div>

      <Drawer open={scheduleOpen} onClose={() => setScheduleOpen(false)} title={`Schedule — ${cfg.title}`}>
        <p className="text-xs text-muted-foreground">Cadence: <span className="text-foreground font-medium">{cfg.cadence}</span></p>
        <p className="text-xs text-muted-foreground">SLA: <span className="text-foreground font-medium">{cfg.sla}</span></p>
        <div className="mt-4 space-y-2">
          {cfg.calendar.map(c => (
            <div key={c.label} className={cn("rounded-lg border px-3 py-2 flex items-center justify-between", calColors[c.status])}>
              <div>
                <p className="text-xs font-semibold">{c.label}</p>
                {c.detail && <p className="text-[10px] opacity-80 mt-0.5">{c.detail}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono">{c.due}</p>
                <p className="text-[9px] opacity-70">T+{c.daysOut}d</p>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90">Edit cadence</button>
      </Drawer>

      <Drawer open={scenarioOpen} onClose={() => setScenarioOpen(false)} title={`What-if scenarios — ${cfg.title}`}>
        <p className="text-xs text-muted-foreground mb-3">Run any scenario against the current state without writing back to source systems.</p>
        <div className="space-y-2">
          {cfg.scenarios.map(s => (
            <div key={s.id} className="rounded-lg border border-border bg-card px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">{s.label}</p>
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">{s.delta}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{s.description}</p>
              <button
                onClick={() => {
                  if (!onRunScenario) return;
                  onRunScenario({ id: s.id, label: s.label, delta: s.delta });
                  setScenarioOpen(false);
                }}
                disabled={!onRunScenario || isRunning}
                className="mt-2 text-[10px] font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Run scenario
              </button>
            </div>
          ))}
          {cfg.scenarios.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No preset scenarios — use the chat panel to define one ad-hoc.</p>
          )}
        </div>
      </Drawer>

      <Drawer open={evidenceOpen} onClose={() => setEvidenceOpen(false)} title={`Evidence Pack — ${cfg.title}`}>
        <p className="text-xs text-muted-foreground mb-3">Auto-assembled audit-ready bundle for this run. Hashes are journaled in the audit log.</p>
        <div className="space-y-1.5">
          {cfg.evidencePack.map(e => (
            <div key={e.name} className="rounded-lg border border-border bg-card px-3 py-2 flex items-center gap-3">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{e.name}</p>
                <p className="text-[10px] text-muted-foreground">{e.source} · {e.type.toUpperCase()}</p>
              </div>
              <button className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                <Download className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 flex items-center justify-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Download full pack
        </button>
      </Drawer>

      <Drawer open={handoffOpen} onClose={() => setHandoffOpen(false)} title={`Hand off — ${cfg.title}`}>
        <p className="text-xs text-muted-foreground mb-3">Route this run to a human owner. Conversation context, evidence pack, and decisions are forwarded.</p>
        <div className="space-y-1.5">
          {cfg.handoffRoles.map(r => (
            <button key={r} className="w-full rounded-lg border border-border bg-card hover:bg-muted/40 px-3 py-2.5 flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <UserCog className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground">{r}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Drawer>

      <AuditDrawer open={auditOpen} onClose={() => setAuditOpen(false)} journey={journey} title={cfg.title} runId={runId ?? undefined} />
    </>
  );
}

function CtaButton({ icon: Icon, label, onClick }: { icon: typeof Calendar; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-2 rounded-lg text-xs font-medium border border-border bg-card text-foreground hover:bg-muted/40 flex items-center gap-1.5 transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

interface DrawerProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode }
function Drawer({ open, onClose, title, children }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-[440px] max-w-full bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

interface AuditEntry {
  id: string;
  ts: string;
  type: string;
  actor: string;
  action: string;
  details: string;
  journey?: string;
  runId?: string;
  eventId?: string;
}

function evidenceHash(id: string, ts: string): string {
  let h = 0;
  const s = `${id}::${ts}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return `0x${(h >>> 0).toString(16).padStart(8, "0")}${id.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase().padStart(6, "0")}`;
}

function AuditDrawer({ open, onClose, journey, title, runId }: { open: boolean; onClose: () => void; journey: string; title: string; runId?: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [scope, setScope] = useState<"run" | "journey">(runId ? "run" : "journey");

  useEffect(() => { if (runId) setScope("run"); else setScope("journey"); }, [runId]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    const qs = scope === "run" && runId
      ? `runId=${encodeURIComponent(runId)}&limit=200`
      : `journey=${encodeURIComponent(journey)}&limit=200`;
    fetch(`/api/audit/events?${qs}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setEntries(d.events || []); setLoading(false); } })
      .catch(e => { if (!cancelled) { setErr(String(e)); setLoading(false); } });
    const timer = setInterval(() => {
      fetch(`/api/audit/events?${qs}`)
        .then(r => r.json())
        .then(d => { if (!cancelled) setEntries(d.events || []); })
        .catch(() => undefined);
    }, 4000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [open, journey, runId, scope]);

  return (
    <Drawer open={open} onClose={onClose} title={`Audit — ${title}`}>
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Scope:</span>
        <button
          onClick={() => setScope("run")}
          disabled={!runId}
          className={cn(
            "text-[10px] font-medium px-2 py-1 rounded border",
            scope === "run" && runId ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border",
            !runId && "opacity-50 cursor-not-allowed"
          )}
        >
          Current run {runId ? `(${runId.slice(-8)})` : "(none yet)"}
        </button>
        <button
          onClick={() => setScope("journey")}
          className={cn(
            "text-[10px] font-medium px-2 py-1 rounded border",
            scope === "journey" ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border"
          )}
        >
          All runs (this journey)
        </button>
      </div>
      {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading audit events…</div>}
      {err && <p className="text-xs text-red-600">{err}</p>}
      {!loading && entries.length === 0 && !err && (
        <p className="text-xs text-muted-foreground italic">No audit events for this journey yet. Run the agent to populate.</p>
      )}
      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id} className="rounded-lg border border-border bg-card px-3 py-2">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">{e.type}</span>
              <span className="text-[10px] text-muted-foreground">{e.actor}</span>
              <span className="text-[10px] text-muted-foreground ml-auto font-mono">{e.id}</span>
            </div>
            <p className="text-xs font-medium text-foreground">{e.action}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{e.details}</p>
            {(e.runId || e.eventId) && (
              <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                {e.runId && <span>run: {e.runId.slice(-10)}</span>}
                {e.runId && e.eventId && <span> · </span>}
                {e.eventId && <span>event: {e.eventId}</span>}
              </p>
            )}
            <div className="flex items-center justify-between gap-2 mt-1.5">
              <p className="text-[9px] text-muted-foreground font-mono">{new Date(e.ts).toLocaleString()}</p>
              <p className="text-[9px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5" title="Evidence hash placeholder — full chain-of-custody is journaled separately">
                evidence: {evidenceHash(e.id, e.ts)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">Showing latest {Math.min(entries.length, 200)} of up to 200 events</p>
        <a href="/audit-trail" className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1">
          Open full audit trail <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </Drawer>
  );
}

export function JourneySlaRail({ journey }: { journey: string }) {
  const cfg = getJourneyConfig(journey);
  if (cfg.calendar.length === 0) return null;
  return (
    <div className="bg-card rounded-xl border border-border px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Calendar & SLA</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">SLA: {cfg.sla}</span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(cfg.calendar.length, 5)}, minmax(0, 1fr))` }}>
        {cfg.calendar.slice(0, 5).map(c => (
          <div key={c.label} className={cn("rounded-md border px-2.5 py-1.5", calColors[c.status])}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold truncate">{c.label}</p>
              {c.status === "critical" && <ShieldAlert className="w-3 h-3 flex-shrink-0" />}
              {c.status === "warning" && <ShieldAlert className="w-3 h-3 flex-shrink-0 opacity-70" />}
              {c.status === "ok" && <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-emerald-600" />}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-[9px] opacity-70 font-mono">{c.due}</p>
              <p className="text-[9px] opacity-70">T+{c.daysOut}d</p>
            </div>
            {c.detail && <p className="text-[9px] opacity-80 mt-0.5 line-clamp-1">{c.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
