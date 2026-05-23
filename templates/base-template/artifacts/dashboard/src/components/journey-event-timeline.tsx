import { CheckCircle2, Loader2, BookOpen, Bell, ClipboardList, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyEvent, ApprovalGateEvent } from "@/lib/journey-events";
import { ToolCallCard } from "./tool-call-card";
import { ApprovalGateCard } from "./approval-gate-card";

interface Props {
  events: JourneyEvent[];
  currentIndex: number;
  onApprovalDecide: (gateId: string, decision: "approved" | "rejected", comment: string, decidedBy: string, meta?: { firstApprover?: { name: string; role?: string; ts: string; comment?: string }; secondApprover?: { name: string; role?: string; ts: string; comment?: string } }) => void;
}

export function JourneyEventTimeline({ events, currentIndex, onApprovalDecide }: Props) {
  if (events.length === 0) return null;
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Run Timeline</h3>
      <div className="space-y-2">
        {events.map((evt, i) => {
          const visible = i <= currentIndex;
          if (!visible) return null;
          if (evt.type === "tool_call") {
            return <ToolCallCard key={evt.id} event={evt} />;
          }
          if (evt.type === "approval_gate") {
            return (
              <ApprovalGateCard
                key={evt.id}
                event={evt}
                onDecide={(decision, comment, decidedBy, meta) =>
                  onApprovalDecide((evt as ApprovalGateEvent).gateId, decision, comment, decidedBy, meta)
                }
              />
            );
          }
          if (evt.type === "skill_invocation") {
            return (
              <div key={evt.id} className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border bg-primary/10 text-primary border-primary/20">Skill</span>
                    <code className="text-[11px] font-mono text-foreground truncate">{evt.skill}</code>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{evt.detail}</div>
                </div>
                {evt.status === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                 evt.status === "running" ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> :
                 <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
              </div>
            );
          }
          if (evt.type === "notification") {
            return (
              <div key={evt.id} className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200">Notify · {evt.channel}</span>
                    <span className="text-[11px] font-mono text-foreground truncate">{evt.recipient}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{evt.subject}</div>
                </div>
                {evt.status === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                 evt.status === "running" ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> :
                 <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
              </div>
            );
          }
          if (evt.type === "delta") {
            const dir = evt.direction ?? "flat";
            const Icon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;
            const tone = dir === "up" ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                       : dir === "down" ? "border-red-200 bg-red-50 text-red-800"
                       : "border-stone-200 bg-stone-50 text-stone-700";
            return (
              <div key={evt.id} className={cn("rounded-lg border px-3 py-2 flex items-center gap-3", tone)}>
                <div className="w-7 h-7 rounded-md bg-white/70 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border bg-white/70 border-current/20">Delta</span>
                    <span className="text-[11px] font-mono font-medium truncate">{evt.metric}</span>
                  </div>
                  <p className="text-[10px] mt-0.5">
                    <span className="font-mono opacity-70">{evt.before}{evt.unit ?? ""}</span>
                    <span className="mx-1">→</span>
                    <span className="font-mono font-semibold">{evt.after}{evt.unit ?? ""}</span>
                    {evt.rationale && <span className="opacity-80"> · {evt.rationale}</span>}
                  </p>
                </div>
                {evt.status === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                 evt.status === "running" ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> :
                 <div className="w-4 h-4 rounded-full border-2 border-current/30" />}
              </div>
            );
          }
          if (evt.type === "audit_event") {
            return (
              <div key={evt.id} className="rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-2 flex items-center gap-3">
                <ClipboardList className="w-4 h-4 text-stone-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{evt.action}</p>
                  <p className="text-[10px] text-muted-foreground">{evt.actor} · {evt.details}</p>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export function timelineProgressLabel(events: JourneyEvent[], idx: number): string {
  if (events.length === 0) return "";
  if (idx >= events.length) return `${events.length}/${events.length}`;
  return `${Math.max(0, idx)}/${events.length}`;
}

export function isAwaitingApproval(events: JourneyEvent[], idx: number): boolean {
  if (idx < 0 || idx >= events.length) return false;
  const cur = events[idx];
  return cur.type === "approval_gate" && cur.status !== "approved" && cur.status !== "rejected";
}

export function _cn(...xs: (string | false | null | undefined)[]) {
  return cn(...xs);
}
