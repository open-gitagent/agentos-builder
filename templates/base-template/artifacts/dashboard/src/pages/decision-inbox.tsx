import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import {
  CheckCircle2, XCircle, Clock, AlertCircle, AlertTriangle,
  ChevronRight, Shield, ShieldCheck, ShieldAlert, ShieldX,
  Lock, ArrowRight, FileText, Bot, Eye, MessageSquare,
  ThumbsUp, ThumbsDown, Info, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSampleData } from "@/components/sample-data-context";
import { NoDataState } from "@/components/no-data-state";

type DecisionStatus = "pending" | "approved" | "rejected" | "escalated";
type DecisionPriority = "critical" | "high" | "medium" | "low";
type CheckVerdict = "pass" | "flagged" | "warning";

interface ComplianceCheck {
  name: string;
  verdict: CheckVerdict;
  detail: string;
  evidence?: string;
}

interface DecisionItem {
  id: string;
  title: string;
  description: string;
  journey: string;
  journeyStep?: string;
  priority: DecisionPriority;
  status: DecisionStatus;
  agent: string;
  requestedAt: string;
  amount?: string;
  entity?: string;
  what: string;
  evidence: string[];
  skillUsed: string;
  triggeredBy: string;
  complianceChecks: ComplianceCheck[];
}

const DECISIONS: DecisionItem[] = [
  {
    id: "DI-001",
    title: "Approve batch update — 1,284 records",
    description: "Agent recommends applying a validated batch update to 1,284 records identified during the latest example run",
    journey: "Example Journey",
    journeyStep: "Step 2 (Checks)",
    priority: "critical",
    status: "pending",
    agent: "Example Agent",
    requestedAt: "2 hours ago",
    amount: "1,284 records",
    entity: "Records",
    what: "Apply the validated batch update to 1,284 records that passed the automated checks during the latest run. The update aligns the records with the current reference dataset.",
    evidence: [
      "Source: Validation output — 1,284 of 1,300 records matched",
      "All updated records passed the schema and range checks",
      "Reference dataset version: 2026-05-23 (latest)",
      "Previous run: similar batch of 1,232 records applied successfully",
    ],
    skillUsed: "example-skill",
    triggeredBy: "Automated example pipeline run — Step 2",
    complianceChecks: [
      { name: "Threshold & Authorization", verdict: "pass", detail: "Batch size of 1,284 is within the Reviewer auto-approve threshold of 2,000", evidence: "Policy A: Batches below 2,000 records may be approved by a Reviewer. Larger batches require an Owner." },
      { name: "Audit Trail Completeness", verdict: "pass", detail: "Source dataset attached, matched records verified, reference version documented", evidence: "Documents: validation_output.csv (1,284 rows), reference_dataset.json (v2026-05-23)." },
      { name: "Output Safety", verdict: "pass", detail: "No PII detected in the updated fields; output-safety guardrail passed", evidence: "Output-safety check: 0 flagged fields. PII redaction rule applied to all free-text columns." },
    ],
  },
  {
    id: "DI-002",
    title: "Review 2 flagged records",
    description: "2 records fell below the configured quality threshold during the example run and require manual review before sign-off",
    journey: "Example Journey",
    journeyStep: "Step 2 (Checks)",
    priority: "high",
    status: "pending",
    agent: "Example Agent",
    requestedAt: "3 hours ago",
    amount: "2 records",
    entity: "Records",
    what: "2 records were routed to the review queue because their quality score fell below the configured threshold. Both could not be matched to the reference dataset and need an owner decision.",
    evidence: [
      "Auto-handled rate: 96.2% (1,282 of 1,284 records)",
      "Flagged classification: Missing field (1), Out-of-range value (1)",
      "Record A: missing required field from the Data Source connector",
      "Record B: value outside the expected range defined in Policy A",
    ],
    skillUsed: "example-skill",
    triggeredBy: "Automated example pipeline run — Step 2",
    complianceChecks: [
      { name: "Quality Threshold", verdict: "flagged", detail: "2 records scored below the 0.90 quality threshold — owner review required", evidence: "Policy A: Records scoring below 0.90 must be reviewed before sign-off." },
      { name: "Audit Trail Completeness", verdict: "pass", detail: "Both flagged records documented with source references and classification rationale", evidence: "Each record has a source reference, a quality score, and a classification reason." },
      { name: "Output Safety", verdict: "pass", detail: "Flagged records contain no sensitive data; output-safety guardrail passed", evidence: "Output-safety check: 0 flagged fields across both records." },
    ],
  },
];

const priorityColors: Record<DecisionPriority, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-gray-50 text-gray-600 border-gray-200",
};

const checkVerdictConfig: Record<CheckVerdict, { icon: typeof ShieldCheck; color: string; bg: string; label: string }> = {
  pass: { icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "PASS" },
  flagged: { icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "FLAGGED" },
  warning: { icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "WARNING" },
};

function DecisionDetail({ decision }: { decision: DecisionItem }) {
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const hasFlagged = decision.complianceChecks.some(c => c.verdict === "flagged");

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/decision-inbox" className="text-xs text-primary hover:underline">← Back to Inbox</Link>
          <span className="text-xs text-muted-foreground">/ {decision.id}</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", priorityColors[decision.priority])}>
                {decision.priority.toUpperCase()}
              </span>
              <span className="text-[10px] text-muted-foreground">{decision.journey}{decision.journeyStep ? ` → ${decision.journeyStep}` : ""}</span>
              <span className="text-[10px] text-muted-foreground">· {decision.requestedAt}</span>
            </div>
            <h1 className="text-lg font-bold text-foreground">{decision.title}</h1>
            <p className="text-xs text-muted-foreground mt-1">Agent: {decision.agent} · Skill: {decision.skillUsed}</p>
          </div>
          {decision.status === "pending" && !hasFlagged && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" /> Approve
              </button>
              <button className="px-5 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" /> Reject
              </button>
              <button className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Request Info
              </button>
            </div>
          )}
          {decision.status === "approved" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Approved
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">The Decision</h3>
          <p className="text-sm text-foreground leading-relaxed">{decision.what}</p>
          {decision.amount && (
            <div className="mt-3 flex items-center gap-6 pt-3 border-t border-border/50">
              <div><span className="text-[10px] text-muted-foreground uppercase">Amount</span><p className="text-lg font-bold text-foreground">{decision.amount}</p></div>
              {decision.entity && <div><span className="text-[10px] text-muted-foreground uppercase">Entity</span><p className="text-sm font-semibold text-foreground">{decision.entity}</p></div>}
              <div><span className="text-[10px] text-muted-foreground uppercase">Triggered By</span><p className="text-sm text-foreground">{decision.triggeredBy}</p></div>
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-border/50">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Supporting Evidence</span>
            <ul className="mt-1.5 space-y-1">
              {decision.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-4">Decision Tracing — Compliance Checks</h3>

          {(() => {
            const checks = decision.complianceChecks;
            const checkCount = checks.length;
            const nodeW = 160;
            const nodeH = 48;
            const agentW = 130;
            const agentH = 56;
            const outputW = 110;
            const outputH = 56;
            const gap = 8;
            const totalCheckH = checkCount * nodeH + (checkCount - 1) * gap;
            const svgH = Math.max(totalCheckH + 40, agentH + 40);
            const midY = svgH / 2;
            const agentX = 20;
            const agentY = midY - agentH / 2;
            const checkX = agentX + agentW + 80;
            const checksTopY = midY - totalCheckH / 2;
            const outputX = checkX + nodeW + 80;
            const outputY = midY - outputH / 2;
            const svgW = outputX + outputW + 20;

            const verdictEdgeColor = (v: CheckVerdict) =>
              v === "pass" ? "#059669" : v === "flagged" ? "#dc2626" : "#d97706";

            return (
              <div className="mb-4 overflow-x-auto pb-2">
                <svg width={svgW} height={svgH} className="block">
                  <rect x={agentX} y={agentY} width={agentW} height={agentH} rx={8} fill="rgba(103,57,27,0.05)" stroke="rgba(103,57,27,0.3)" strokeWidth={2} />
                  <text x={agentX + agentW / 2} y={agentY + 22} textAnchor="middle" className="fill-primary text-[10px] font-bold">Agent Decision</text>
                  <text x={agentX + agentW / 2} y={agentY + 36} textAnchor="middle" className="fill-muted-foreground text-[8px]">{decision.agent.length > 22 ? decision.agent.slice(0, 22) + "..." : decision.agent}</text>

                  {checks.map((check, idx) => {
                    const vc = checkVerdictConfig[check.verdict];
                    const cy = checksTopY + idx * (nodeH + gap) + nodeH / 2;
                    const agentRightX = agentX + agentW;
                    const agentMidY = midY;
                    const checkLeftX = checkX;
                    const checkRightX = checkX + nodeW;
                    const outputLeftX = outputX;
                    const edgeColor = verdictEdgeColor(check.verdict);

                    const fanCtrlX = agentRightX + 36;
                    const convergeCtrlX = checkRightX + 36;

                    const fillColor = check.verdict === "pass" ? "rgba(236,253,245,0.8)" :
                      check.verdict === "flagged" ? "rgba(254,242,242,0.8)" : "rgba(255,251,235,0.8)";
                    const strokeColor = check.verdict === "pass" ? "#a7f3d0" :
                      check.verdict === "flagged" ? "#fecaca" : "#fde68a";

                    return (
                      <g key={check.name}>
                        <path
                          d={`M ${agentRightX} ${agentMidY} C ${fanCtrlX} ${agentMidY}, ${fanCtrlX} ${cy}, ${checkLeftX} ${cy}`}
                          fill="none" stroke={edgeColor} strokeWidth={2} opacity={0.6}
                        />
                        <circle cx={checkLeftX} cy={cy} r={3} fill={edgeColor} />

                        <rect
                          x={checkX} y={cy - nodeH / 2} width={nodeW} height={nodeH} rx={8}
                          fill={fillColor} stroke={strokeColor} strokeWidth={2}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setExpandedCheck(expandedCheck === check.name ? null : check.name)}
                        />
                        <text x={checkX + nodeW / 2} y={cy - 4} textAnchor="middle" className="fill-foreground text-[10px] font-bold pointer-events-none">{check.name}</text>
                        <text x={checkX + nodeW / 2} y={cy + 12} textAnchor="middle" className={cn("text-[9px] font-semibold pointer-events-none", vc.color === "text-emerald-600" ? "fill-emerald-600" : vc.color === "text-red-600" ? "fill-red-600" : "fill-amber-600")}>{vc.label}</text>

                        <path
                          d={`M ${checkRightX} ${cy} C ${convergeCtrlX} ${cy}, ${convergeCtrlX} ${midY}, ${outputLeftX} ${midY}`}
                          fill="none" stroke={edgeColor} strokeWidth={2} opacity={0.6}
                        />
                        <circle cx={checkRightX} cy={cy} r={3} fill={edgeColor} />
                      </g>
                    );
                  })}

                  <circle cx={agentX + agentW} cy={midY} r={4} fill="hsl(var(--primary))" />
                  <circle cx={outputX} cy={midY} r={4} fill="hsl(var(--muted-foreground))" />

                  <rect x={outputX} y={outputY} width={outputW} height={outputH} rx={8} fill="rgba(0,0,0,0.02)" stroke="hsl(var(--border))" strokeWidth={2} />
                  <text x={outputX + outputW / 2} y={outputY + 24} textAnchor="middle" className="fill-foreground text-[10px] font-bold">Output</text>
                  <text x={outputX + outputW / 2} y={outputY + 38} textAnchor="middle" className="fill-muted-foreground text-[8px]">Ready</text>
                </svg>
              </div>
            );
          })()}

          <div className="space-y-2">
            {decision.complianceChecks.map((check) => {
              const vc = checkVerdictConfig[check.verdict];
              const VIcon = vc.icon;
              const isExpanded = expandedCheck === check.name;
              return (
                <div key={check.name} className={cn("rounded-lg border overflow-hidden", vc.bg)}>
                  <button
                    onClick={() => setExpandedCheck(isExpanded ? null : check.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <VIcon className={cn("w-4 h-4 flex-shrink-0", vc.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{check.name}</p>
                      <p className="text-[10px] text-muted-foreground">{check.detail}</p>
                    </div>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", vc.color, check.verdict === "pass" ? "bg-emerald-100" : check.verdict === "flagged" ? "bg-red-100" : "bg-amber-100")}>{vc.label}</span>
                    <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                  </button>
                  {isExpanded && check.evidence && (
                    <div className="px-4 pb-3 border-t border-border/30 pt-2">
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">Evidence / Policy Reference</span>
                      <p className="text-[10px] text-foreground mt-1 leading-relaxed bg-white/60 rounded-md px-3 py-2 border border-border/30">{check.evidence}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {hasFlagged && decision.status === "pending" && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-800">Compliance check flagged — justification required to approve</span>
            </div>
            <p className="text-xs text-red-700 mb-3">One or more compliance checks have been flagged. If you choose to approve despite the flag, you must provide a written justification which will be permanently logged in the audit trail.</p>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Enter justification for overriding compliance flag..."
              className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-foreground placeholder:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
              rows={3}
            />
            <div className="flex items-center gap-3 mt-3">
              <button
                disabled={!justification.trim()}
                className={cn("px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                  justification.trim() ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <AlertTriangle className="w-4 h-4" /> Approve with Override
              </button>
              <button className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionList() {
  const { sampleDataEnabled } = useSampleData();
  const [filter, setFilter] = useState<DecisionStatus | "all">("pending");
  const [, setLocation] = useLocation();
  const allDecisions = sampleDataEnabled ? DECISIONS : [];
  const filtered = filter === "all" ? allDecisions : allDecisions.filter(d => d.status === filter);
  const pendingCount = allDecisions.filter(d => d.status === "pending").length;
  const approvedCount = allDecisions.filter(d => d.status === "approved").length;
  const rejectedCount = allDecisions.filter(d => d.status === "rejected").length;
  const flaggedCount = allDecisions.filter(d => d.complianceChecks.some(c => c.verdict === "flagged")).length;
  const criticalCount = allDecisions.filter(d => d.priority === "critical" && d.status === "pending").length;

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Decision Inbox</h1>
          
        </div>
        <p className="text-sm text-muted-foreground mt-1">Human-in-the-loop review center for agent decisions</p>
      </div>

      <div className="px-8 py-3 border-b border-border">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border px-4 py-3 text-center">
            <p className="text-xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Pending Decisions</p>
            {criticalCount > 0 && <p className="text-[10px] text-red-600 font-semibold mt-0.5">{criticalCount} Critical</p>}
          </div>
          <div className="bg-card rounded-lg border border-border px-4 py-3 text-center">
            <p className="text-xl font-bold text-emerald-600">{approvedCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Approved This Week</p>
          </div>
          <div className="bg-card rounded-lg border border-border px-4 py-3 text-center">
            <p className="text-xl font-bold text-red-600">{rejectedCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Rejected This Week</p>
          </div>
          <div className="bg-card rounded-lg border border-border px-4 py-3 text-center">
            <p className={cn("text-xl font-bold", flaggedCount > 0 ? "text-amber-600" : "text-muted-foreground")}>{flaggedCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Flagged by Compliance</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-3 border-b border-border flex items-center gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors", filter === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === "pending" && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-4 space-y-2">
        {filtered.length === 0 && !sampleDataEnabled && (
          <NoDataState
            title="No decisions awaiting review"
            description="Agent decisions requiring human approval will appear here. Enable the Sample Data toggle to view demonstration decisions."
          />
        )}
        {filtered.map((item) => {
          const hasFlagged = item.complianceChecks.some(c => c.verdict === "flagged");
          const hasWarning = item.complianceChecks.some(c => c.verdict === "warning");
          const flaggedChecks = item.complianceChecks.filter(c => c.verdict === "flagged");
          const warningChecks = item.complianceChecks.filter(c => c.verdict === "warning");
          const passCount = item.complianceChecks.filter(c => c.verdict === "pass").length;
          const totalChecks = item.complianceChecks.length;

          const cardBg = item.status === "approved" ? "bg-card" :
            hasFlagged ? "bg-red-50/40" :
            item.priority === "critical" ? "bg-red-50/30" :
            hasWarning ? "bg-amber-50/30" :
            item.priority === "high" ? "bg-amber-50/20" : "bg-card";
          const cardBorder = item.status === "approved" ? "border-border" :
            hasFlagged ? "border-red-200" :
            item.priority === "critical" ? "border-red-200/60" :
            hasWarning ? "border-amber-200/60" :
            item.priority === "high" ? "border-amber-200/40" : "border-border";

          return (
            <div
              key={item.id}
              onClick={() => setLocation(`/decision-inbox/${item.id}`)}
              className={cn(
                "rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer group",
                cardBg, cardBorder,
                item.status === "pending" && "border-l-4",
                item.priority === "critical" && item.status === "pending" && "border-l-red-500",
                item.priority === "high" && item.status === "pending" && "border-l-amber-400",
                item.priority === "medium" && item.status === "pending" && "border-l-blue-400",
                item.priority === "low" && item.status === "pending" && "border-l-gray-300",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", priorityColors[item.priority])}>
                      {item.priority.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{item.journey}{item.journeyStep ? ` → ${item.journeyStep}` : ""}</span>
                    {item.entity && <span className="text-[10px] text-muted-foreground">· {item.entity}</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> {item.agent}</span>
                    {item.amount && <span className="font-semibold text-foreground">{item.amount}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {flaggedChecks.map(c => (
                      <span key={c.name} className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                        <ShieldAlert className="w-2.5 h-2.5" /> {c.name}
                      </span>
                    ))}
                    {warningChecks.map(c => (
                      <span key={c.name} className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        <ShieldAlert className="w-2.5 h-2.5" /> {c.name}
                      </span>
                    ))}
                    {passCount > 0 && (
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium",
                        (hasFlagged || hasWarning) ? "text-muted-foreground" : "text-emerald-600"
                      )}>
                        <ShieldCheck className="w-2.5 h-2.5" /> {passCount}/{totalChecks} passed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">{item.requestedAt}</span>
                  {item.status === "pending" ? (
                    <span className={cn("text-[10px] font-medium flex items-center gap-1",
                      item.priority === "critical" ? "text-red-600" : "text-amber-600"
                    )}>
                      {item.priority === "critical" ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {item.priority === "critical" ? "Requires Action" : "Pending"}
                    </span>
                  ) : item.status === "approved" ? (
                    <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</span>
                  ) : (
                    <span className="text-[10px] font-medium text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DecisionInbox() {
  const [matchDetail, params] = useRoute("/decision-inbox/:id");

  if (matchDetail && params?.id) {
    const decision = DECISIONS.find(d => d.id === params.id);
    if (decision) return <DecisionDetail decision={decision} />;
  }

  return <DecisionList />;
}
