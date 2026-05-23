import { useEffect, useState } from "react";
import { Lock, ShieldCheck, ShieldX, Users, MessageSquare, CheckCircle2, XCircle, AlertTriangle, Clock, UserCog, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalGateEvent } from "@/lib/journey-events";

interface DecisionMeta {
  firstApprover?: { name: string; role?: string; ts: string; comment?: string };
  secondApprover?: { name: string; role?: string; ts: string; comment?: string };
}

interface Props {
  event: ApprovalGateEvent;
  onDecide: (decision: "approved" | "rejected", comment: string, decidedBy: string, meta?: DecisionMeta) => void;
  currentUser?: string;
}

function formatRemaining(ms: number): { text: string; tone: "ok" | "warning" | "critical" } {
  if (ms <= 0) return { text: "SLA breached", tone: "critical" };
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const s = Math.floor((ms % 60000) / 1000);
  const text = h > 0 ? `${h}h ${m}m left` : m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s left` : `${s}s left`;
  const tone = totalMin < 5 ? "critical" : totalMin < 30 ? "warning" : "ok";
  return { text, tone };
}

export function ApprovalGateCard({ event, onDecide, currentUser = "owner@example.com" }: Props) {
  const [comment, setComment] = useState("");
  const [now, setNow] = useState(Date.now());
  // Dual-control: capture distinct first + second approvers with names + timestamps
  const [firstApprover, setFirstApprover] = useState<{ name: string; role?: string; ts: string; comment?: string } | null>(null);
  const [secondName, setSecondName] = useState<string>("");
  const isDecided = event.status === "approved" || event.status === "rejected";

  useEffect(() => {
    if (isDecided || !event.slaMinutes) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isDecided, event.slaMinutes]);

  const triggeredAt = event.triggeredAt ? new Date(event.triggeredAt).getTime() : new Date(event.ts).getTime();
  const slaDeadline = event.slaMinutes ? triggeredAt + event.slaMinutes * 60000 : null;
  const sla = slaDeadline ? formatRemaining(slaDeadline - now) : null;

  const firstRole = event.approverRoles?.[0];
  const secondRole = event.approverRoles?.[1];
  const firstSuggested = event.approvers[0] ?? currentUser;
  const secondSuggested = event.approvers[1] ?? "";

  const handleFirstSign = (decision: "approved" | "rejected") => {
    if (decision === "rejected") {
      // First approver may reject outright — no second sign needed
      onDecide("rejected", comment, currentUser, {
        firstApprover: { name: currentUser, role: firstRole, ts: new Date().toISOString(), comment: comment || undefined },
      });
      return;
    }
    if (!event.dualControl) {
      onDecide("approved", comment, currentUser, {
        firstApprover: { name: currentUser, role: firstRole, ts: new Date().toISOString(), comment: comment || undefined },
      });
      return;
    }
    setFirstApprover({ name: currentUser, role: firstRole, ts: new Date().toISOString(), comment: comment || undefined });
    setComment("");
  };

  const handleSecondSign = (decision: "approved" | "rejected") => {
    if (!firstApprover) return;
    const second = { name: secondName.trim() || secondSuggested || "second-approver@lyzr.ai", role: secondRole, ts: new Date().toISOString(), comment: comment || undefined };
    if (second.name === firstApprover.name) {
      // Block — second approver must be distinct
      return;
    }
    onDecide(decision, [firstApprover.comment, second.comment].filter(Boolean).join(" · "), `${firstApprover.name} + ${second.name}`, {
      firstApprover,
      secondApprover: second,
    });
  };

  const sameSignerWarning = firstApprover && secondName.trim() && secondName.trim() === firstApprover.name;

  return (
    <div className={cn(
      "rounded-xl border-2 p-4",
      isDecided && event.status === "approved" ? "border-emerald-300 bg-emerald-50/40" :
      isDecided && event.status === "rejected" ? "border-red-300 bg-red-50/40" :
      "border-amber-300 bg-amber-50/40"
    )}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              Approval Gate
            </span>
            {event.dualControl && (
              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 border border-violet-200 flex items-center gap-1">
                <Users className="w-2.5 h-2.5" /> Dual control
              </span>
            )}
            {event.threshold && (
              <span className="text-[9px] text-amber-800 font-medium">{event.threshold}</span>
            )}
            {sla && !isDecided && (
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex items-center gap-1 border ml-auto",
                sla.tone === "critical" ? "bg-red-100 text-red-800 border-red-200" :
                sla.tone === "warning" ? "bg-amber-100 text-amber-800 border-amber-200" :
                "bg-emerald-50 text-emerald-700 border-emerald-200"
              )}>
                <Clock className="w-2.5 h-2.5" /> SLA · {sla.text}
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-foreground mt-1.5">{event.title}</h4>
          {event.insertAfterStep && (
            <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-900 bg-white/60 border border-amber-200 rounded-full px-1.5 py-0.5">
              <GitBranch className="w-2.5 h-2.5" />
              Stage-bound · after {event.insertAfterStepTitle ?? event.insertAfterStep}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{event.rationale}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {(event.approverRoles ?? event.approvers).map((role, i) => (
              <span key={`${role}-${i}`} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/60 border border-amber-200 text-amber-900 flex items-center gap-1">
                <UserCog className="w-2.5 h-2.5" />
                {role}
                {event.approverRoles && event.approvers[i] && (
                  <span className="text-muted-foreground font-normal">· {event.approvers[i]}</span>
                )}
              </span>
            ))}
          </div>

          {isDecided ? (
            <div className="mt-3 space-y-1">
              <div className={cn(
                "flex items-center gap-2 text-xs font-medium",
                event.status === "approved" ? "text-emerald-700" : "text-red-700"
              )}>
                {event.status === "approved" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{event.status === "approved" ? "Approved" : "Rejected"} by {event.decidedBy}</span>
              </div>
              {event.firstApprover && (
                <p className="text-[10px] text-muted-foreground">
                  1st: <span className="font-medium text-foreground">{event.firstApprover.name}</span>
                  {event.firstApprover.role && <span> ({event.firstApprover.role})</span>}
                  {" · "}{new Date(event.firstApprover.ts).toLocaleTimeString()}
                  {event.firstApprover.comment && <span className="italic"> — "{event.firstApprover.comment}"</span>}
                </p>
              )}
              {event.secondApprover && (
                <p className="text-[10px] text-muted-foreground">
                  2nd: <span className="font-medium text-foreground">{event.secondApprover.name}</span>
                  {event.secondApprover.role && <span> ({event.secondApprover.role})</span>}
                  {" · "}{new Date(event.secondApprover.ts).toLocaleTimeString()}
                  {event.secondApprover.comment && <span className="italic"> — "{event.secondApprover.comment}"</span>}
                </p>
              )}
              {event.comment && !event.firstApprover && (
                <p className="text-[10px] text-muted-foreground italic">"{event.comment}"</p>
              )}
            </div>
          ) : firstApprover ? (
            <>
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1st sign: <span className="font-semibold">{firstApprover.name}</span>{firstApprover.role && ` (${firstApprover.role})`} · {new Date(firstApprover.ts).toLocaleTimeString()}</span>
              </div>
              <label className="block mt-2 text-[10px] font-medium text-violet-800">
                2nd approver{secondRole ? ` (${secondRole})` : ""} — must be distinct
              </label>
              <input
                value={secondName}
                onChange={(e) => setSecondName(e.target.value)}
                placeholder={secondSuggested || "name@lyzr.ai"}
                className="mt-1 w-full text-xs px-2.5 py-1.5 rounded-md border border-violet-200 bg-white/70 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Counter-sign comment (optional)..."
                className="mt-2 w-full text-xs px-2.5 py-1.5 rounded-md border border-violet-200 bg-white/70 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-400 resize-none"
                rows={2}
              />
              {sameSignerWarning && (
                <p className="mt-1 text-[10px] text-red-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Same as 1st approver — pick a different person.</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => handleSecondSign("approved")}
                  disabled={!!sameSignerWarning}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3 h-3" /> Counter-sign & approve
                </button>
                <button
                  onClick={() => handleSecondSign("rejected")}
                  disabled={!!sameSignerWarning}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <ShieldX className="w-3 h-3" /> Counter-sign & reject
                </button>
                <button
                  onClick={() => { setFirstApprover(null); setSecondName(""); setComment(""); }}
                  className="px-2 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Reset
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-[10px] text-muted-foreground">Signing as <span className="font-medium text-foreground">{currentUser}</span>{firstRole && ` (${firstRole})`}</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment (optional)..."
                className="mt-1 w-full text-xs px-2.5 py-1.5 rounded-md border border-amber-200 bg-white/60 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                rows={2}
              />
              {event.dualControl && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-violet-700 bg-violet-50 border border-violet-200 rounded-md px-2 py-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Dual control required — a distinct second approver must counter-sign before this gate can complete.
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleFirstSign("approved")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3 h-3" /> {event.dualControl ? "Sign as 1st approver" : "Approve"}
                </button>
                <button
                  onClick={() => handleFirstSign("rejected")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 flex items-center gap-1.5"
                >
                  <ShieldX className="w-3 h-3" /> Reject
                </button>
                {comment.trim() && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Comment will be logged
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
