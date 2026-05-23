import { useMemo, useState } from "react";
import {
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Users,
  Target,
  Activity,
  ArrowDownRight,
  Filter,
  Download,
  GitMerge,
  CalendarDays,
  ShieldCheck,
  Banknote,
  Send,
  Receipt,
  BarChart3,
  Sparkles,
  CircleDot,
  ChevronDown,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSampleData } from "@/components/sample-data-context";
import { NoDataState } from "@/components/no-data-state";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar as RBar,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

type JourneyId =
  | "validation"
  | "intake"
  | "matching"
  | "enrichment"
  | "monitoring"
  | "reporting"
  | "deduplication"
  | "summarization";

interface JourneyPerf {
  id: JourneyId;
  name: string;
  icon: typeof GitMerge;
  runs7d: number;
  successRate: number;
  autonomyRate: number;
  avgCycleMinutes: number;
  avgCycleBaseline: number;
  humanInterventions: number;
  lastRunStatus: "success" | "partial" | "failed";
  businessOutcomes: { label: string; value: string }[];
  successes: string[];
  failures: { title: string; root: string; impact: string }[];
}

const JOURNEYS: JourneyPerf[] = [
  {
    id: "validation",
    name: "Validation Run",
    icon: GitMerge,
    runs7d: 38,
    successRate: 94.7,
    autonomyRate: 89.5,
    avgCycleMinutes: 14,
    avgCycleBaseline: 240,
    humanInterventions: 4,
    lastRunStatus: "success",
    businessOutcomes: [
      { label: "Records validated", value: "162,840" },
      { label: "Auto-handled rate", value: "94.85%" },
      { label: "Genuine errors found", value: "47" },
      { label: "Items surfaced", value: "284" },
    ],
    successes: [
      "Validated 162,840 records across 6 source systems with 94.85% auto-handled",
      "Surfaced 47 genuine errors (separated from 1,876 timing differences)",
      "Cleared a record mismatch in source A worth 19 items",
      "Eliminated 22 hours of manual review work per cycle",
    ],
    failures: [
      {
        title: "Timestamp cutoff mismatch (3 occurrences)",
        root: "Source system used T+1 cutoff vs reference T+0 — match logic flagged false positives",
        impact: "8 items routed to Decision Inbox; resolved in 18 min by the Operations team",
      },
    ],
  },
  {
    id: "intake",
    name: "Intake Run",
    icon: CalendarDays,
    runs7d: 12,
    successRate: 91.7,
    autonomyRate: 75.0,
    avgCycleMinutes: 86,
    avgCycleBaseline: 1440,
    humanInterventions: 9,
    lastRunStatus: "partial",
    businessOutcomes: [
      { label: "Days saved on cycle", value: "3.2" },
      { label: "Records proposed", value: "184" },
      { label: "Updates applied", value: "2,100" },
      { label: "Approval gates", value: "12" },
    ],
    successes: [
      "Compressed the intake cycle from Day-8 to Day-5 (3.2 days saved)",
      "Proposed 184 record updates; 172 accepted as-is by the Reviewer",
      "Applied 2,100 reference updates across sources A / B / C",
      "Generated draft notes for 14 record groups",
    ],
    failures: [
      {
        title: "Large batch requires Reviewer approval",
        root: "12 record updates exceeded the 1,000-record auto-apply threshold per Policy A",
        impact: "Halted at Day-3 awaiting human review; resumed in 45 min after approval",
      },
      {
        title: "Source B record classification ambiguous",
        root: "New record type not yet mapped in the taxonomy",
        impact: "1 record deferred to next cycle; mapped to taxonomy backlog",
      },
    ],
  },
  {
    id: "matching",
    name: "Record Matching",
    icon: ShieldCheck,
    runs7d: 7,
    successRate: 85.7,
    autonomyRate: 71.4,
    avgCycleMinutes: 42,
    avgCycleBaseline: 480,
    humanInterventions: 3,
    lastRunStatus: "failed",
    businessOutcomes: [
      { label: "Match rate", value: "94.2%" },
      { label: "Records matched", value: "894,000" },
      { label: "Headroom", value: "+380 bps" },
    ],
    successes: [
      "Matched 894,000 records across 4 sources in 42 minutes",
      "Validated the match rate at 94.2% (above the 90% target)",
      "Detected and corrected 2 mapping misclassifications",
    ],
    failures: [
      {
        title: "example-data.json parse error",
        root: "Malformed field at row 47 — source feed schema drift",
        impact: "Run terminated after 3.2s; re-ran successfully after manual file fix at 07:15",
      },
    ],
  },
  {
    id: "enrichment",
    name: "Data Enrichment",
    icon: Activity,
    runs7d: 4,
    successRate: 100.0,
    autonomyRate: 50.0,
    avgCycleMinutes: 95,
    avgCycleBaseline: 720,
    humanInterventions: 2,
    lastRunStatus: "success",
    businessOutcomes: [
      { label: "Records enriched", value: "82,300" },
      { label: "Fields added", value: "12" },
      { label: "Overlay proposed", value: "3,800" },
    ],
    successes: [
      "Enriched 82,300 records across the active set",
      "Identified 12 field transitions with rationale",
      "Drafted a 3,800-record overlay narrative for review",
    ],
    failures: [],
  },
  {
    id: "monitoring",
    name: "Pipeline Monitoring",
    icon: Banknote,
    runs7d: 35,
    successRate: 100.0,
    autonomyRate: 97.1,
    avgCycleMinutes: 6,
    avgCycleBaseline: 90,
    humanInterventions: 1,
    lastRunStatus: "success",
    businessOutcomes: [
      { label: "Uptime (latest)", value: "99.2%" },
      { label: "Quality (latest)", value: "92%" },
      { label: "Days under threshold", value: "0" },
    ],
    successes: [
      "Computed health metrics daily for 35 consecutive business days — zero misses",
      "Maintained uptime average 99.2% (well above the 99% target)",
      "Auto-escalated 1 stress scenario when headroom dropped below 110%",
    ],
    failures: [],
  },
  {
    id: "reporting",
    name: "Report Builder",
    icon: Send,
    runs7d: 9,
    successRate: 88.9,
    autonomyRate: 66.7,
    avgCycleMinutes: 28,
    avgCycleBaseline: 360,
    humanInterventions: 3,
    lastRunStatus: "success",
    businessOutcomes: [
      { label: "Reports prepared", value: "9" },
      { label: "Cells populated", value: "14,820" },
      { label: "Validations passed", value: "98.4%" },
    ],
    successes: [
      "Prepared 9 reports (summary, rollup, detail) on schedule",
      "Auto-populated 14,820 cells with full traceability to source data",
      "Passed 98.4% of validation rules on the first attempt",
    ],
    failures: [
      {
        title: "Report cross-validation breach",
        root: "Totals didn't tie to the enrichment output (+240-record variance)",
        impact: "Held for review; reconciled to timing of the overlay posting; resubmitted next day",
      },
    ],
  },
  {
    id: "deduplication",
    name: "Deduplication",
    icon: Receipt,
    runs7d: 84,
    successRate: 96.4,
    autonomyRate: 92.9,
    avgCycleMinutes: 4,
    avgCycleBaseline: 35,
    humanInterventions: 6,
    lastRunStatus: "success",
    businessOutcomes: [
      { label: "Records processed", value: "8,724" },
      { label: "Match rate", value: "94.6%" },
      { label: "Duplicates blocked", value: "23" },
      { label: "Items resolved", value: "486" },
    ],
    successes: [
      "Processed 8,724 records with a 94.6% straight-through match",
      "Blocked 23 duplicate records before they were applied",
      "Resolved 486 items via prioritised scheduling",
    ],
    failures: [
      {
        title: "Source record gaps (6 records)",
        root: "New records onboarded without a required field on file",
        impact: "Routed to the Operations team for record completion; 4-hour avg resolution",
      },
    ],
  },
  {
    id: "summarization",
    name: "Summarization",
    icon: BarChart3,
    runs7d: 6,
    successRate: 100.0,
    autonomyRate: 83.3,
    avgCycleMinutes: 18,
    avgCycleBaseline: 180,
    humanInterventions: 1,
    lastRunStatus: "success",
    businessOutcomes: [
      { label: "Groups analysed", value: "60" },
      { label: "Notable changes", value: "11" },
      { label: "Summaries drafted", value: "11" },
    ],
    successes: [
      "Analysed 60 record groups and isolated 11 notable changes (>15% threshold)",
      "Drafted reviewer-ready summaries for all 11 changes with driver attribution",
      "Linked drivers back to source records for click-through audit",
    ],
    failures: [],
  },
];

const SHORT_NAME: Record<JourneyId, string> = {
  "validation": "Validate",
  "intake": "Intake",
  "matching": "Match",
  "enrichment": "Enrich",
  "monitoring": "Monitor",
  "reporting": "Report",
  "deduplication": "Dedupe",
  "summarization": "Summarize",
};

const RUNS_TIMESERIES: { day: string; runs: number; success: number; failed: number }[] = [
  { day: "Mon", runs: 28, success: 26, failed: 2 },
  { day: "Tue", runs: 31, success: 30, failed: 1 },
  { day: "Wed", runs: 26, success: 25, failed: 1 },
  { day: "Thu", runs: 33, success: 31, failed: 2 },
  { day: "Fri", runs: 29, success: 28, failed: 1 },
  { day: "Sat", runs: 22, success: 22, failed: 0 },
  { day: "Sun", runs: 26, success: 25, failed: 1 },
];

interface AgentRun {
  id: string;
  journeyId: JourneyId;
  status: "success" | "partial" | "failed";
  timestamp: string;
  duration: string;
  summary: string;
  outputs: { label: string; value: string }[];
}

const RECENT_RUNS: AgentRun[] = [
  {
    id: "run-2814",
    journeyId: "monitoring",
    status: "success",
    timestamp: "Today · 06:02",
    duration: "5m 48s",
    summary: "Computed health metrics for end-of-day positions; auto-published the dashboard and a team messaging briefing.",
    outputs: [
      { label: "Uptime", value: "99.2%" },
      { label: "Quality", value: "92%" },
      { label: "Cells", value: "1,820" },
    ],
  },
  {
    id: "run-2813",
    journeyId: "deduplication",
    status: "success",
    timestamp: "Today · 05:48",
    duration: "3m 41s",
    summary: "Processed the overnight record batch from the Database; blocked 4 duplicate submissions and queued 2 high-priority items for early processing.",
    outputs: [
      { label: "Records", value: "1,247" },
      { label: "Duplicates blocked", value: "4" },
      { label: "Items resolved", value: "94" },
    ],
  },
  {
    id: "run-2812",
    journeyId: "matching",
    status: "failed",
    timestamp: "Today · 05:31",
    duration: "0m 03s",
    summary: "Halted on example-data.json parse error (malformed field at row 47). Re-ran successfully at 07:15 after a manual schema fix.",
    outputs: [
      { label: "Stage", value: "Ingestion" },
      { label: "Recovery", value: "Manual" },
    ],
  },
  {
    id: "run-2811",
    journeyId: "validation",
    status: "partial",
    timestamp: "Today · 04:15",
    duration: "16m 22s",
    summary: "Validated overnight records across 6 source systems; 8 timing items routed to the Operations team for review.",
    outputs: [
      { label: "Records", value: "23,840" },
      { label: "Auto-handled", value: "94.6%" },
      { label: "To inbox", value: "8" },
    ],
  },
  {
    id: "run-2810",
    journeyId: "intake",
    status: "success",
    timestamp: "Yesterday · 22:14",
    duration: "1h 24m",
    summary: "Applied 38 record updates and 410 reference changes; drafted notes for 6 record groups pending Reviewer review.",
    outputs: [
      { label: "Updates", value: "38 applied" },
      { label: "Reference changes", value: "410" },
      { label: "Note drafts", value: "6" },
    ],
  },
  {
    id: "run-2809",
    journeyId: "summarization",
    status: "success",
    timestamp: "Yesterday · 18:02",
    duration: "17m 56s",
    summary: "Analysed 60 record groups vs prior period; isolated 4 notable changes and drafted reviewer-ready summaries with driver attribution.",
    outputs: [
      { label: "Groups analysed", value: "60" },
      { label: "Notable changes", value: "4" },
      { label: "Summaries", value: "4 drafts" },
    ],
  },
  {
    id: "run-2808",
    journeyId: "reporting",
    status: "success",
    timestamp: "Yesterday · 14:45",
    duration: "27m 12s",
    summary: "Prepared the rollup report; passed 98.6% of validation rules on the first attempt and queued for Reviewer sign-off.",
    outputs: [
      { label: "Cells populated", value: "1,640" },
      { label: "Validations", value: "98.6%" },
      { label: "Status", value: "Awaiting sign-off" },
    ],
  },
  {
    id: "run-2807",
    journeyId: "enrichment",
    status: "success",
    timestamp: "2 days ago · 09:22",
    duration: "1h 38m",
    summary: "Re-enriched the active record set and identified 12 field transitions; drafted a 3,800-record overlay narrative.",
    outputs: [
      { label: "Records enriched", value: "82,300" },
      { label: "Transitions", value: "12" },
      { label: "Overlay", value: "3,800" },
    ],
  },
];

// Theme palette
const C = {
  primary: "hsl(25, 62%, 25%)",
  primarySoft: "hsl(25, 50%, 45%)",
  accent: "hsl(38, 50%, 45%)",
  warm: "hsl(15, 38%, 48%)",
  success: "hsl(155, 35%, 32%)",
  warn: "hsl(22, 70%, 45%)",
  fail: "hsl(0, 50%, 40%)",
  muted: "hsl(36, 22%, 78%)",
  text: "hsl(25, 25%, 25%)",
};

const STATUS_STYLE: Record<JourneyPerf["lastRunStatus"], { dot: string; label: string; chip: string }> = {
  success: { dot: "bg-[hsl(155,35%,32%)]", label: "Success", chip: "bg-[hsl(140,25%,90%)] text-[hsl(155,45%,22%)]" },
  partial: { dot: "bg-[hsl(22,70%,45%)]", label: "Partial", chip: "bg-[hsl(32,55%,90%)] text-[hsl(25,60%,30%)]" },
  failed: { dot: "bg-[hsl(0,55%,38%)]", label: "Failed", chip: "bg-[hsl(0,40%,92%)] text-[hsl(0,55%,32%)]" },
};

export default function AgentMatrix() {
  const { sampleDataEnabled } = useSampleData();
  const [openId, setOpenId] = useState<JourneyId | null>(JOURNEYS[0].id);

  const kpis = useMemo(() => {
    const totalRuns = JOURNEYS.reduce((s, j) => s + j.runs7d, 0);
    const weightedSuccess = JOURNEYS.reduce((s, j) => s + j.successRate * j.runs7d, 0) / totalRuns;
    const weightedAutonomy = JOURNEYS.reduce((s, j) => s + j.autonomyRate * j.runs7d, 0) / totalRuns;
    const totalInterventions = JOURNEYS.reduce((s, j) => s + j.humanInterventions, 0);
    const totalBaselineMin = JOURNEYS.reduce((s, j) => s + j.avgCycleBaseline * j.runs7d, 0);
    const totalActualMin = JOURNEYS.reduce((s, j) => s + j.avgCycleMinutes * j.runs7d, 0);
    const hoursSaved = Math.round((totalBaselineMin - totalActualMin) / 60);
    return { totalRuns, weightedSuccess, weightedAutonomy, totalInterventions, hoursSaved };
  }, []);

  if (!sampleDataEnabled) {
    return (
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <NoDataState
            title="No agent runs to analyse"
            description="The Matrix surfaces business outcomes across every journey. Enable the Sample Data toggle to view a representative week of runs."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header />

      <div className="flex-1 overflow-y-auto">
        {/* KPI strip */}
        <div className="px-8 pt-6 pb-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiTile icon={Activity} label="Agent runs (7d)" value={kpis.totalRuns.toString()} sublabel="across 8 journeys" tone="primary" />
          <KpiTile icon={CheckCircle2} label="Success rate" value={`${kpis.weightedSuccess.toFixed(1)}%`} sublabel={`${(100 - kpis.weightedSuccess).toFixed(1)}% needed follow-up`} tone="success" />
          <KpiTile icon={Sparkles} label="Autonomy" value={`${kpis.weightedAutonomy.toFixed(1)}%`} sublabel="completed without escalation" tone="primary" />
          <KpiTile icon={Users} label="Human interventions" value={kpis.totalInterventions.toString()} sublabel="approvals & exceptions" tone="warn" />
          <KpiTile icon={Clock} label="Hours saved (7d)" value={kpis.hoursSaved.toLocaleString()} sublabel="vs pre-agent baseline" tone="success" />
        </div>

        {/* Charts row */}
        <div className="px-8 pb-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <ChartCard title="Daily run volume" subtitle="Last 7 days · successful vs needed-attention runs" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={RUNS_TIMESERIES} margin={{ top: 12, right: 12, left: -18, bottom: 0 }} barCategoryGap="22%">
                <CartesianGrid strokeDasharray="2 4" stroke={C.muted} vertical={false} />
                <XAxis dataKey="day" stroke={C.text} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke={C.text} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(36, 33%, 90%)", opacity: 0.5 }}
                  contentStyle={{ background: "hsl(36, 33%, 96%)", border: "1px solid hsl(36, 22%, 78%)", borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: C.text, fontWeight: 600 }}
                />
                <RBar dataKey="success" stackId="r" fill={C.primary} name="Successful" radius={[0, 0, 0, 0]} />
                <RBar dataKey="failed" stackId="r" fill={C.warn} name="Needed attention" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Autonomy by journey" subtitle="% completed without escalation">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart
                data={[...JOURNEYS].sort((a, b) => b.autonomyRate - a.autonomyRate).map(j => ({
                  name: SHORT_NAME[j.id],
                  full: j.name,
                  value: j.autonomyRate,
                }))}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" stroke={C.text} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ background: "hsl(36, 33%, 96%)", border: "1px solid hsl(36, 22%, 78%)", borderRadius: 6, fontSize: 12 }}
                  labelFormatter={() => ""}
                  formatter={(v: number, _n, p: any) => [`${v.toFixed(1)}%`, p.payload.full]}
                />
                <RBar dataKey="value" radius={[0, 4, 4, 0]}>
                  {JOURNEYS.map((j, i) => (
                    <Cell key={i} fill={j.autonomyRate >= 90 ? C.success : j.autonomyRate >= 75 ? C.primarySoft : C.warn} />
                  ))}
                </RBar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Performance matrix */}
        <div className="px-8 pb-6">
          <SectionHeader
            title="Use-case performance matrix"
            subtitle="Click any row to expand business analysis — successes, failures, and root causes"
            right={
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Filter className="w-3.5 h-3.5" />
                  Last 7 days
                </button>
                <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            }
          />

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_0.7fr_0.95fr_0.95fr_1fr_0.85fr_0.4fr] gap-3 px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-b border-border bg-muted/20">
              <div>Journey</div>
              <div className="text-right">Runs</div>
              <div className="text-right">Success</div>
              <div className="text-right">Autonomy</div>
              <div className="text-right">Cycle time</div>
              <div className="text-right">Last run</div>
              <div></div>
            </div>
            {JOURNEYS.map(j => {
              const Icon = j.icon;
              const isOpen = openId === j.id;
              const status = STATUS_STYLE[j.lastRunStatus];
              const speedup = Math.round(j.avgCycleBaseline / j.avgCycleMinutes);
              return (
                <div key={j.id} className={cn("border-b border-border last:border-b-0", isOpen && "bg-primary/5")}>
                  <button
                    onClick={() => setOpenId(isOpen ? null : j.id)}
                    className={cn(
                      "w-full grid grid-cols-[2fr_0.7fr_0.95fr_0.95fr_1fr_0.85fr_0.4fr] gap-3 px-4 py-3 text-left items-center transition-colors",
                      !isOpen && "hover:bg-muted/30"
                    )}
                    aria-expanded={isOpen}
                    data-testid={`row-journey-${j.id}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-md border flex items-center justify-center flex-shrink-0",
                        isOpen ? "bg-primary/10 border-primary/25" : "bg-muted/40 border-border"
                      )}>
                        <Icon className={cn("w-4 h-4", isOpen ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{j.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{j.businessOutcomes[0]?.label}: {j.businessOutcomes[0]?.value}</div>
                      </div>
                    </div>
                    <div className="text-sm font-mono text-foreground text-right tabular-nums">{j.runs7d}</div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-semibold text-foreground tabular-nums">{j.successRate.toFixed(1)}%</div>
                      <Bar value={j.successRate} color={C.success} />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-semibold text-foreground tabular-nums">{j.autonomyRate.toFixed(1)}%</div>
                      <Bar value={j.autonomyRate} color={C.primary} />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-semibold text-foreground tabular-nums">{formatMinutes(j.avgCycleMinutes)}</div>
                      <div className="text-[10px] font-medium flex items-center justify-end gap-0.5" style={{ color: C.success }}>
                        <ArrowDownRight className="w-2.5 h-2.5" />
                        {speedup}× faster
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded", status.chip)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                        {status.label}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180 text-primary")} />
                    </div>
                  </button>

                  {isOpen && <ExpandedJourney journey={j} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent agent runs timeline */}
        <div className="px-8 pb-6">
          <SectionHeader
            title="Recent agent runs"
            subtitle="Chronological log of every agent execution with business outputs"
            right={
              <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Filter className="w-3.5 h-3.5" />
                All journeys
              </button>
            }
          />
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {RECENT_RUNS.map((r, i) => {
              const j = JOURNEYS.find(x => x.id === r.journeyId)!;
              const Icon = j.icon;
              const status = STATUS_STYLE[r.status];
              const isLast = i === RECENT_RUNS.length - 1;
              return (
                <div key={r.id} className={cn("flex gap-3 px-4 py-3", !isLast && "border-b border-border")}>
                  <div className="flex flex-col items-center pt-0.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full", status.dot)} />
                    {!isLast && <div className="w-px flex-1 mt-1" style={{ background: "hsl(36, 22%, 82%)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-6 h-6 rounded-md bg-muted/40 border border-border flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{j.name}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">{r.id}</span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded", status.chip)}>
                        {status.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {r.timestamp} · {r.duration}
                      </span>
                    </div>
                    <div className="text-xs text-foreground mt-1.5 leading-relaxed">{r.summary}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {r.outputs.map((o, k) => (
                        <div key={k} className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-muted/40 border border-border">
                          <span className="uppercase font-bold tracking-widest text-[9px] text-muted-foreground/80">{o.label}</span>
                          <span className="font-mono font-semibold text-foreground">{o.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cross-journey insights */}
        <div className="px-8 pb-8">
          <SectionHeader title="Cross-journey insights" subtitle="Patterns observed across all use cases this week" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InsightCard
              icon={Target}
              tone="success"
              title="Highest-leverage journey"
              body="Pipeline Monitoring ran 35× this week with 100% success and 97% autonomy — the most reliable agent-led process in the portfolio."
            />
            <InsightCard
              icon={AlertTriangle}
              tone="warn"
              title="Top failure mode"
              body="Source-system schema drift caused 4 of 7 escalations. Consider adding a schema-validation pre-check ahead of every ingestion run."
            />
            <InsightCard
              icon={DollarSign}
              tone="primary"
              title="Largest impact"
              body="Deduplication blocked 23 duplicate records and resolved 486 items — net 509 records protected from incorrect processing."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpandedJourney({ journey }: { journey: JourneyPerf }) {
  const j = journey;
  const successPct = j.successRate;
  return (
    <div className="px-4 pb-5 pt-2 border-t border-primary/10 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Outcome chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        {j.businessOutcomes.map(o => (
          <div key={o.label} className="bg-card border border-border rounded-lg px-3 py-2.5">
            <div className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/70">{o.label}</div>
            <div className="text-lg font-serif font-bold text-foreground mt-0.5">{o.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_180px] gap-3">
        {/* Successes */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.success }} />
              <h3 className="font-serif font-bold text-xs text-foreground">What worked</h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{j.successes.length}</span>
          </div>
          <div className="p-3 space-y-2">
            {j.successes.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-1 flex-shrink-0" style={{ color: C.success }} />
                <div className="text-xs text-foreground leading-relaxed">{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Failures */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: C.warn }} />
              <h3 className="font-serif font-bold text-xs text-foreground">Where it fell short</h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{j.failures.length}</span>
          </div>
          <div className="p-3 space-y-2">
            {j.failures.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.success }} />
                Clean run — no failures or escalations.
              </div>
            ) : (
              j.failures.map((f, i) => (
                <div key={i} className="border rounded-md p-2.5" style={{ borderColor: "hsl(32, 55%, 80%)", background: "hsl(32, 55%, 96%)" }}>
                  <div className="flex items-start gap-1.5">
                    <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: C.warn }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="text-xs font-semibold text-foreground">{f.title}</div>
                      <div className="text-[10px] leading-snug">
                        <span className="uppercase font-bold tracking-widest text-muted-foreground/70">Root cause</span>{" · "}
                        <span className="text-foreground">{f.root}</span>
                      </div>
                      <div className="text-[10px] leading-snug">
                        <span className="uppercase font-bold tracking-widest text-muted-foreground/70">Impact</span>{" · "}
                        <span className="text-foreground">{f.impact}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mini gauge */}
        <div className="bg-card border border-border rounded-lg p-3 flex flex-col">
          <div className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/70">Success rate</div>
          <div className="flex-1 flex items-center justify-center -my-2">
            <ResponsiveContainer width="100%" height={130}>
              <RadialBarChart innerRadius="70%" outerRadius="95%" data={[{ value: successPct }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={6} fill={successPct >= 95 ? C.success : successPct >= 85 ? C.accent : C.warn} background={{ fill: "hsl(36, 22%, 88%)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-3">
            <div className="font-serif text-2xl font-bold text-foreground leading-none">{successPct.toFixed(1)}%</div>
            <div className="text-[10px] text-muted-foreground mt-1">{j.runs7d} runs · {j.humanInterventions} escalations</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-border bg-card">
      <div>
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-primary" />
          <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Agent Metrics</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Business-facing traceability — outcomes, autonomy, escalations and impact across every agent journey
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground bg-muted/30">
          <CircleDot className="w-3 h-3 text-success animate-pulse" />
          Live
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  icon: Icon, label, value, sublabel, tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  sublabel: string;
  tone: "primary" | "success" | "warn";
}) {
  const toneClass =
    tone === "success" ? "bg-[hsl(140,25%,90%)] text-[hsl(155,45%,22%)] border-[hsl(140,25%,75%)]"
    : tone === "warn" ? "bg-[hsl(32,55%,90%)] text-[hsl(25,60%,30%)] border-[hsl(32,55%,75%)]"
    : "bg-primary/10 text-primary border-primary/20";
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">{label}</div>
        <div className={cn("w-7 h-7 rounded-md border flex items-center justify-center", toneClass)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="font-serif text-2xl font-bold text-foreground mt-1.5 leading-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, className, children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-4", className)}>
      <div className="mb-2">
        <div className="text-sm font-serif font-bold text-foreground">{title}</div>
        {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="font-serif font-bold text-base text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="ml-auto w-16 h-1 rounded-full bg-muted/50 overflow-hidden mt-1">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function InsightCard({
  icon: Icon, tone, title, body,
}: { icon: typeof Activity; tone: "primary" | "success" | "warn"; title: string; body: string }) {
  const ring =
    tone === "success" ? "border-[hsl(140,25%,75%)] bg-[hsl(140,25%,96%)]"
    : tone === "warn" ? "border-[hsl(32,55%,75%)] bg-[hsl(32,55%,96%)]"
    : "border-primary/20 bg-primary/5";
  const iconBg =
    tone === "success" ? "bg-[hsl(140,25%,86%)] text-[hsl(155,45%,22%)]"
    : tone === "warn" ? "bg-[hsl(32,55%,86%)] text-[hsl(25,60%,30%)]"
    : "bg-primary/15 text-primary";
  return (
    <div className={cn("rounded-xl border p-4", ring)}>
      <div className="flex items-start gap-2.5">
        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-serif font-bold text-sm text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed mt-1">{body}</div>
        </div>
      </div>
    </div>
  );
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}
