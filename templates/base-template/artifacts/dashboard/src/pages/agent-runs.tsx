import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Clock, Loader2, ChevronRight, ChevronDown,
  Shield, ShieldAlert, ShieldCheck, ShieldX, FileText, Cpu, Bot,
  Zap, Eye, X, Database, Brain, ArrowRight, AlertTriangle, Hash,
  Activity, CreditCard, Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSampleData } from "@/components/sample-data-context";
import { NoDataState } from "@/components/no-data-state";

type RunStatus = "completed" | "running" | "failed" | "queued";
type SafetyVerdict = "pass" | "warning" | "fail";

interface TraceStep {
  id: string;
  label: string;
  type: "skill_load" | "data_ingestion" | "llm_call" | "tool_call" | "output" | "confidence";
  timestamp: string;
  duration?: string;
  detail: string;
  input?: string;
  output?: string;
  tokens?: { in: number; out: number };
  model?: string;
  file?: string;
  rows?: number;
}

interface SafetyCheck {
  name: string;
  verdict: SafetyVerdict;
  detail: string;
}

interface AgentRun {
  id: string;
  journey: string;
  agent: string;
  status: RunStatus;
  startedAt: string;
  duration: string;
  tokensIn: number;
  tokensOut: number;
  creditCost: string;
  filesProcessed: number;
  confidence: number;
  trigger: string;
  model: string;
  safetyChecks: SafetyCheck[];
  trace: TraceStep[];
}

const RUNS: AgentRun[] = [
  {
    id: "run_2026-05-23_084222_a7f",
    journey: "Example Journey",
    agent: "Example Agent",
    status: "completed",
    startedAt: "Today 08:42:22 UTC",
    duration: "47s",
    tokensIn: 12450,
    tokensOut: 3200,
    creditCost: "$0.048",
    filesProcessed: 3,
    confidence: 0.94,
    trigger: "User — Operations",
    model: "Claude Sonnet 4.6",
    safetyChecks: [
      { name: "PII Redaction", verdict: "pass", detail: "No PII detected in output. Identifier fields masked." },
      { name: "Data Boundary", verdict: "pass", detail: "All data processed within the configured boundary. No external API calls." },
      { name: "Output Safety", verdict: "pass", detail: "Output consistent across all processed records." },
      { name: "Grounding Check", verdict: "pass", detail: "All cited values traced back to source records." },
      { name: "Authorization", verdict: "pass", detail: "Agent operated within configured skill boundaries." },
    ],
    trace: [
      { id: "s1", label: "Skill Loaded — example-skill", type: "skill_load", timestamp: "08:42:22.100", detail: "Loaded skill definition and prompt templates", file: "skills/example-skill/SKILL.md" },
      { id: "s2", label: "Data Ingestion — Example Data", type: "data_ingestion", timestamp: "08:42:23.450", duration: "1.2s", detail: "Parsed JSON with field auto-detection", file: "example-data.json", rows: 1300, input: "File: example-data.json\nSize: 847 KB\nEncoding: UTF-8", output: "Records parsed: 1,300\nFields: id, name, value, category, status\nMapping: standard_mapping_v2" },
      { id: "s3", label: "Data Ingestion — Reference Dataset", type: "data_ingestion", timestamp: "08:42:24.800", duration: "0.8s", detail: "Loaded the reference dataset", file: "reference-dataset.json", rows: 1284, input: "File: reference-dataset.json\nSize: 412 KB", output: "Records parsed: 1,284\nVersion: 2026-05-23" },
      { id: "s4", label: "Data Ingestion — Org Structure", type: "data_ingestion", timestamp: "08:42:25.200", duration: "0.4s", detail: "Reference org structure", file: "org-structure.md", rows: 84 },
      { id: "s5", label: "LLM Call #1 — Initial Analysis", type: "llm_call", timestamp: "08:42:27.000", duration: "7.2s", detail: "Structured analysis of records with matching logic", tokens: { in: 8200, out: 2100 }, model: "Claude Sonnet 4.6", input: "[System Prompt]\nYou are an example processing specialist...\n\n[User Prompt]\nMatch the following records against the reference dataset...\n\nInput records: 1,300\nReference records: 1,284\nTolerance: 0.02", output: "## Matching Summary\nMatched: 1,282 of 1,300 records (98.6%)\nFlagged: 18 items requiring review\n\n### Flagged Breakdown\n- Missing field: 12 (67%)\n- Out-of-range value: 6 (33%)..." },
      { id: "s6", label: "Tool Call — record_matcher", type: "tool_call", timestamp: "08:42:34.500", duration: "3.2s", detail: "Deterministic matching engine with fuzzy tolerance", input: '{ "input": [...1300 records], "reference": [...1284 records], "tolerance": 0.02, "matching_keys": ["id", "name", "category"] }', output: '{ "matched": 1282, "flagged": 18, "match_rate": 0.986, "missing_field": 12, "out_of_range": 6, "below_threshold": 2 }' },
      { id: "s7", label: "LLM Call #2 — Flag Classification", type: "llm_call", timestamp: "08:42:38.000", duration: "4.8s", detail: "Classify and prioritize 18 flagged records", tokens: { in: 4250, out: 1100 }, model: "Claude Sonnet 4.6", input: "Classify these 18 flagged records into categories...", output: "Classification complete:\n- Missing field: 12 items (auto-resolvable)\n- Out-of-range: 6 items (require correction)\n- Below quality threshold: 2 items (review required)" },
      { id: "s8", label: "Output Generated", type: "output", timestamp: "08:42:43.200", duration: "0.3s", detail: "Final run summary with structured sections", output: "run_summary_2026-05-23.json\n\nSummary: 1,300 records processed\nAuto-handled rate: 96.2%\nFlagged: 18 by type\nProposed updates: 1,284 records\nSections generated: 5" },
      { id: "s9", label: "Confidence Updated", type: "confidence", timestamp: "08:42:43.500", detail: "Bayesian confidence update based on outcome", input: "Previous confidence: 0.93\nOutcome: success\nFormula: 0.93 + 0.1 × (1 - 0.93)", output: "New confidence: 0.94 (rounded from 0.937)" },
    ],
  },
  {
    id: "run_2026-05-23_083815_b2c",
    journey: "Example Journey",
    agent: "Example Agent",
    status: "running",
    startedAt: "Today 08:38:15 UTC",
    duration: "—",
    tokensIn: 8421,
    tokensOut: 2180,
    creditCost: "$0.031",
    filesProcessed: 2,
    confidence: 0.91,
    trigger: "Scheduled — Daily 08:30",
    model: "Claude Sonnet 4.6",
    safetyChecks: [
      { name: "PII Redaction", verdict: "pass", detail: "Free-text fields redacted before processing." },
      { name: "Data Boundary", verdict: "pass", detail: "All processing within the configured boundary." },
      { name: "Threshold Check", verdict: "warning", detail: "Batch of 1,284 records exceeds the 1,000-record threshold — routed to Decision Inbox for approval." },
      { name: "Grounding Check", verdict: "pass", detail: "Values verified against source." },
      { name: "Authorization", verdict: "pass", detail: "Within configured skill boundaries." },
    ],
    trace: [
      { id: "s1", label: "Skill Loaded — example-skill", type: "skill_load", timestamp: "08:38:15.100", detail: "5-step example orchestration", file: "skills/example-skill/SKILL.md" },
      { id: "s2", label: "Data Ingestion — Example Data", type: "data_ingestion", timestamp: "08:38:16.000", duration: "0.5s", detail: "1,300 records loaded", file: "example-data.json", rows: 1300, input: "File: example-data.json\nSize: 324 KB\nFields: id, name, value, category, status" },
      { id: "s3", label: "Data Ingestion — Reference Dataset", type: "data_ingestion", timestamp: "08:38:16.800", duration: "1.1s", detail: "1,284 reference records", file: "reference-dataset.json", rows: 1284, input: "File: reference-dataset.json\nSize: 98 KB\nVersion: 2026-05-23" },
      { id: "s4", label: "LLM Call #1 — Run Status Assessment", type: "llm_call", timestamp: "08:38:19.000", duration: "6.4s", detail: "Analyzing run progress across all stages", tokens: { in: 6200, out: 1800 }, model: "Claude Sonnet 4.6", input: "[System Prompt]\nYou are the Example Agent orchestrator...\n\n[User Prompt]\nAssess run progress for the current example journey across all 5 stages.\nInput records: 1,300.\n\nFor each stage, determine:\n1. Current stage (1-5)\n2. Completion % per stage\n3. Blocking items or dependencies\n4. Estimated completion time", output: "## Run Status Assessment\n\n### Stage Progress Summary\n| Stage | Completion | Blockers |\n|-------|------------|----------|\n| Intake | 100% | none |\n| Validation | 100% | none |\n| Processing | 75% | batch approval pending |\n| Review | 0% | awaiting processing |\n| Output | 0% | awaiting review |\n\n### Critical Path Items\n1. Batch update (1,284 records) — routed to Decision Inbox\n2. 2 records below quality threshold — review required\n\n### Estimated Completion: Today 15:00 UTC" },
      { id: "s5", label: "Tool Call — stage_checker", type: "tool_call", timestamp: "08:38:26.000", duration: "1.8s", detail: "Checking completion of each run stage", input: '{ "stages": [1,2,3,4,5], "run": "2026-05-23" }', output: '{ "overall_progress": 0.55, "stages": { "intake": { "complete": 1, "total": 1 }, "validation": { "complete": 1, "total": 1 }, "processing": { "complete": 0, "total": 1 }, "review": { "complete": 0, "total": 1 }, "output": { "complete": 0, "total": 1 } }, "blocking_items": 2, "estimated_completion": "2026-05-23T15:00:00Z" }' },
    ],
  },
];

const statusConfig: Record<RunStatus, { label: string; color: string; icon: typeof Clock }> = {
  completed: { label: "Completed", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
  running: { label: "Running", color: "text-blue-600 bg-blue-50", icon: Loader2 },
  failed: { label: "Failed", color: "text-red-600 bg-red-50", icon: XCircle },
  queued: { label: "Queued", color: "text-gray-600 bg-gray-50", icon: Clock },
};

const traceTypeIcons: Record<TraceStep["type"], typeof FileText> = {
  skill_load: FileText,
  data_ingestion: Database,
  llm_call: Brain,
  tool_call: Cpu,
  output: Zap,
  confidence: Activity,
};

const safetyVerdictConfig: Record<SafetyVerdict, { icon: typeof ShieldCheck; color: string; bg: string }> = {
  pass: { icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  warning: { icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50" },
  fail: { icon: ShieldX, color: "text-red-600", bg: "bg-red-50" },
};

function TraceStepCard({ step }: { step: TraceStep }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = traceTypeIcons[step.type];

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors text-left">
        <div className={cn("p-1.5 rounded-md",
          step.type === "llm_call" ? "bg-violet-50 text-violet-600" :
          step.type === "tool_call" ? "bg-amber-50 text-amber-600" :
          step.type === "data_ingestion" ? "bg-blue-50 text-blue-600" :
          step.type === "output" ? "bg-emerald-50 text-emerald-600" :
          step.type === "confidence" ? "bg-primary/5 text-primary" :
          "bg-muted text-muted-foreground"
        )}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{step.label}</p>
          <p className="text-[10px] text-muted-foreground">{step.detail}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 text-[10px] text-muted-foreground">
          {step.tokens && <span className="font-mono">{step.tokens.in.toLocaleString()}→{step.tokens.out.toLocaleString()} tok</span>}
          {step.duration && <span className="font-mono">{step.duration}</span>}
          <span className="font-mono">{step.timestamp}</span>
          {(step.input || step.output) && <ChevronRight className={cn("w-3 h-3 transition-transform", expanded && "rotate-90")} />}
        </div>
      </button>
      {expanded && (step.input || step.output || step.file) && (
        <div className="border-t border-border/50 bg-muted/10 px-4 py-3 space-y-3">
          {step.file && (
            <div>
              <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wide">File</span>
              <p className="text-xs font-mono text-foreground mt-0.5">{step.file}{step.rows ? ` — ${step.rows.toLocaleString()} rows` : ""}</p>
            </div>
          )}
          {step.input && (
            <div>
              <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wide">Input</span>
              <pre className="text-[10px] font-mono text-foreground mt-0.5 whitespace-pre-wrap bg-card border border-border rounded-md p-2.5 max-h-40 overflow-y-auto">{step.input}</pre>
            </div>
          )}
          {step.output && (
            <div>
              <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wide">Output</span>
              <pre className="text-[10px] font-mono text-foreground mt-0.5 whitespace-pre-wrap bg-card border border-border rounded-md p-2.5 max-h-40 overflow-y-auto">{step.output}</pre>
            </div>
          )}
          {step.model && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Bot className="w-3 h-3" /> Model: <span className="font-semibold text-foreground">{step.model}</span>
              {step.tokens && <> · Temperature: 0.1</>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentRuns() {
  const { sampleDataEnabled } = useSampleData();
  const [filter, setFilter] = useState<RunStatus | "all">("all");
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);
  const filtered = sampleDataEnabled ? (filter === "all" ? RUNS : RUNS.filter(r => r.status === filter)) : [];

  const activeRuns = sampleDataEnabled ? RUNS : [];
  const todayRuns = activeRuns.filter(r => r.startedAt.startsWith("Today")).length;
  const totalTokens = activeRuns.reduce((a, r) => a + r.tokensIn + r.tokensOut, 0);
  const totalCost = activeRuns.reduce((a, r) => a + parseFloat(r.creditCost.replace("$", "")), 0);
  const safetyFlags = activeRuns.reduce((a, r) => a + r.safetyChecks.filter(s => s.verdict !== "pass").length, 0);

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Agent Runs</h1>
              
            </div>
            <p className="text-sm text-muted-foreground mt-1">Full execution history with micro-level tracing and safety metrics</p>
          </div>
        </div>

        <div className="px-8 py-3 border-b border-border flex items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{todayRuns}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Runs Today</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{(totalTokens / 1000).toFixed(1)}K</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Total Tokens</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">${totalCost.toFixed(2)}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Credit Cost</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className={cn("text-lg font-bold", safetyFlags > 0 ? "text-amber-600" : "text-emerald-600")}>{safetyFlags}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Safety Flags</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">{activeRuns.length > 0 ? Math.round((activeRuns.filter(r => r.status === "completed").length / activeRuns.length) * 100) : 0}%</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Success</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {(["all", "completed", "running", "failed"] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)} className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors", filter === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-8 py-2.5 text-xs font-semibold text-muted-foreground">Run ID</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Journey</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">Confidence</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">Duration</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">Tokens</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">Cost</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground">Safety</th>
                <th className="text-right px-8 py-2.5 text-xs font-semibold text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <NoDataState
                      title="No agent runs recorded"
                      description="Agent runs will appear here after actual agent executions. Enable the Sample Data toggle to view demonstration runs."
                    />
                  </td>
                </tr>
              )}
              {filtered.map((run) => {
                const config = statusConfig[run.status];
                const StatusIcon = config.icon;
                const hasFlags = run.safetyChecks.some(s => s.verdict !== "pass");
                const isSelected = selectedRun?.id === run.id;
                return (
                  <tr
                    key={run.id}
                    onClick={() => setSelectedRun(isSelected ? null : run)}
                    className={cn("border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer", isSelected && "bg-primary/5")}
                  >
                    <td className="px-8 py-3 font-mono text-[10px] font-semibold text-primary">{run.id.split("_").slice(-1)[0]}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-foreground text-xs">{run.journey}</p>
                      <p className="text-[10px] text-muted-foreground">{run.agent}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full", config.color)}>
                        <StatusIcon className={cn("w-3 h-3", run.status === "running" && "animate-spin")} />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{run.confidence.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground text-xs">{run.duration}</td>
                    <td className="px-3 py-3 text-right text-[10px] text-muted-foreground font-mono">{run.tokensIn.toLocaleString()} / {run.tokensOut.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-xs font-medium">{run.creditCost}</td>
                    <td className="px-3 py-3 text-center">
                      {hasFlags ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <ShieldAlert className="w-3 h-3" /> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> Clean
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-3 text-right">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedRun && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm z-20"
              onClick={() => setSelectedRun(null)}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute top-0 right-0 bottom-0 w-[600px] bg-background border-l border-border shadow-2xl z-30 flex flex-col overflow-hidden"
            >
              <div className="px-6 pt-5 pb-3 border-b border-border sticky top-0 bg-background z-10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Execution Trace</h2>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{selectedRun.id}</p>
                  </div>
                  <button onClick={() => setSelectedRun(null)} className="p-1.5 hover:bg-muted rounded-md transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[10px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Agent</span><span className="font-semibold text-foreground">{selectedRun.agent}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Journey</span><span className="font-semibold text-foreground">{selectedRun.journey}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Trigger</span><span className="text-foreground">{selectedRun.trigger}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span className="font-mono text-foreground">{selectedRun.startedAt}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-semibold text-foreground">{selectedRun.duration}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span className="text-foreground">{selectedRun.model}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tokens (in/out)</span><span className="font-mono text-foreground">{selectedRun.tokensIn.toLocaleString()} / {selectedRun.tokensOut.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Credit Cost</span><span className="font-semibold text-foreground">{selectedRun.creditCost}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Confidence</span><span className="font-semibold text-foreground">{selectedRun.confidence.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Files</span><span className="text-foreground">{selectedRun.filesProcessed} processed</span></div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {(() => {
                  const inputStep = selectedRun.trace.find(s => s.input);
                  const outputStep = [...selectedRun.trace].reverse().find(s => s.output);
                  return (inputStep || outputStep) ? (
                    <div className="px-6 py-4 border-b border-border">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5" /> Run Input / Output
                      </h3>
                      <div className="space-y-3">
                        {inputStep?.input && (
                          <div>
                            <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wide">Input</span>
                            <pre className="text-[10px] font-mono text-foreground mt-1 whitespace-pre-wrap bg-slate-950 text-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto border border-slate-800">{inputStep.input}</pre>
                          </div>
                        )}
                        {outputStep?.output && (
                          <div>
                            <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-wide">Output</span>
                            <pre className="text-[10px] font-mono text-foreground mt-1 whitespace-pre-wrap bg-slate-950 text-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto border border-slate-800">{outputStep.output}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}

                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Safety Metrics
                  </h3>
                  <div className="space-y-1.5">
                    {selectedRun.safetyChecks.map((check) => {
                      const vc = safetyVerdictConfig[check.verdict];
                      const VIcon = vc.icon;
                      return (
                        <div key={check.name} className={cn("flex items-start gap-2.5 rounded-lg px-3 py-2", vc.bg)}>
                          <VIcon className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", vc.color)} />
                          <div className="min-w-0">
                            <p className={cn("text-[11px] font-semibold", vc.color)}>{check.name}</p>
                            <p className="text-[10px] text-muted-foreground">{check.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="px-6 py-4 pb-8">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Step-by-Step Trace — {selectedRun.trace.length} steps
                  </h3>
                  <div className="space-y-1.5">
                    {selectedRun.trace.map((step) => (
                      <TraceStepCard key={step.id} step={step} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
