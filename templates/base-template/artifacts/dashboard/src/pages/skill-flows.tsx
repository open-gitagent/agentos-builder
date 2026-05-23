import { useState, useCallback, useRef } from "react";
import { useStepRunner } from "@/lib/runner-machine";
import {
  Workflow, CalendarCheck, GitCompareArrows, Shield, BarChart3,
  Droplets, FileText, ChevronRight, Play, Database, Settings, Cpu,
  Brain, Plus, GripVertical, Lock, Trash2, ChevronDown, X,
  ArrowRight, CheckCircle2, AlertTriangle, Zap, Save, Eye, Clock,
  Loader2, History, AlertCircle, Layers, Pause
} from "lucide-react";
import { cn } from "@/lib/utils";

type StepType = "skill" | "approval_gate" | "transform" | "notification";

interface FlowStep {
  id: string;
  label: string;
  skill?: string;
  type: StepType;
  promptTemplate?: string;
  status?: "idle" | "running" | "done" | "failed";
  outputPreview?: string;
}

interface RunHistoryEntry {
  id: string;
  timestamp: string;
  duration: string;
  status: "success" | "partial" | "failed";
  stepsCompleted: number;
  stepsTotal: number;
  triggeredBy: string;
}

interface SkillFlow {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  approvalGates: number;
  lastRun?: string;
  status: "active" | "draft";
  icon: typeof CalendarCheck;
  history?: RunHistoryEntry[];
}

const AVAILABLE_SKILLS = [
  { id: "data-validation", label: "Data Validation", icon: GitCompareArrows },
  { id: "example-skill", label: "Example Skill", icon: CalendarCheck },
  { id: "record-matching", label: "Record Matching", icon: Shield },
  { id: "quality-scoring", label: "Quality Scoring", icon: BarChart3 },
  { id: "monitoring", label: "Pipeline Monitoring", icon: Droplets },
  { id: "policy-check", label: "Policy Check", icon: FileText },
  { id: "trend-analysis", label: "Trend Analysis", icon: BarChart3 },
  { id: "deduplication", label: "Deduplication", icon: FileText },
  { id: "data-extraction", label: "Data Extraction", icon: Database },
  { id: "report-generation", label: "Report Generation", icon: FileText },
  { id: "notification-dispatch", label: "Notification Dispatch", icon: Zap },
];

const INITIAL_FLOWS: SkillFlow[] = [
  {
    id: "validation-suite",
    name: "Validation Suite",
    description: "End-to-end validation across all 7 checks, exception classification, and correction proposals",
    steps: [
      { id: "s1", label: "Schema Verification", skill: "data-validation", type: "skill", promptTemplate: "Verify all records against the schema for {source}", status: "done" },
      { id: "s2", label: "Range Validation", skill: "data-validation", type: "skill", promptTemplate: "Validate record values against expected ranges", status: "done" },
      { id: "s3", label: "Completeness Check", skill: "data-validation", type: "skill", promptTemplate: "Check required fields against the reference dataset", status: "done" },
      { id: "s4", label: "Reference Check", skill: "data-validation", type: "skill", promptTemplate: "Verify records against the reference source", status: "done" },
      { id: "s5", label: "Cross-source Matching", skill: "record-matching", type: "skill", promptTemplate: "Match positions across sources", status: "done" },
      { id: "s6", label: "Exception Classification", skill: "data-validation", type: "skill", promptTemplate: "Classify all exceptions: timing, missing, format, error", status: "done" },
      { id: "gate1", label: "Reviewer Review", type: "approval_gate", promptTemplate: "Review exceptions above the 1,000-record threshold", status: "idle" },
      { id: "s7", label: "Correction Posting", skill: "data-validation", type: "skill", promptTemplate: "Generate and apply approved corrections" },
    ],
    approvalGates: 1,
    lastRun: "Today 08:42",
    status: "active",
    icon: GitCompareArrows,
    history: [
      { id: "h1", timestamp: "Today 08:42", duration: "4m 12s", status: "partial", stepsCompleted: 6, stepsTotal: 8, triggeredBy: "Scheduled" },
      { id: "h2", timestamp: "Yesterday 08:30", duration: "5m 48s", status: "success", stepsCompleted: 8, stepsTotal: 8, triggeredBy: "Manual" },
      { id: "h3", timestamp: "May 21 08:30", duration: "2m 01s", status: "failed", stepsCompleted: 3, stepsTotal: 8, triggeredBy: "Scheduled" },
      { id: "h4", timestamp: "May 20 08:30", duration: "5m 22s", status: "success", stepsCompleted: 8, stepsTotal: 8, triggeredBy: "Scheduled" },
    ],
  },
  {
    id: "example-pipeline",
    name: "Example Pipeline",
    description: "Full 6-step orchestration from intake through run summary generation",
    steps: [
      { id: "s1", label: "Pre-Run Data Collection", skill: "data-extraction", type: "skill", promptTemplate: "Extract all source data and feeds for {period}", status: "done" },
      { id: "s2", label: "Source Validation", skill: "data-validation", type: "skill", promptTemplate: "Run validation across all 6 sources", status: "done" },
      { id: "s3", label: "Record Matching", skill: "record-matching", type: "skill", promptTemplate: "Match records against the reference dataset", status: "done" },
      { id: "gate1", label: "Reviewer Approval", type: "approval_gate", promptTemplate: "Approve batches above 1,000 records" },
      { id: "s4", label: "Field Normalization", skill: "example-skill", type: "skill", promptTemplate: "Normalize record fields to the standard schema" },
      { id: "s5", label: "Deduplication & Merge", skill: "deduplication", type: "skill", promptTemplate: "Deduplicate records and merge matched pairs" },
      { id: "s6", label: "Trend Analysis", skill: "trend-analysis", type: "skill", promptTemplate: "Analyze current vs prior period, generate notes" },
      { id: "gate2", label: "Owner Sign-off", type: "approval_gate", promptTemplate: "Owner reviews the notes and the consolidated output" },
      { id: "s7", label: "Run Summary Generation", skill: "report-generation", type: "skill", promptTemplate: "Generate the run summary, metrics, and notes" },
    ],
    approvalGates: 2,
    lastRun: "Yesterday 16:00",
    status: "active",
    icon: CalendarCheck,
    history: [
      { id: "h1", timestamp: "Yesterday 16:00", duration: "8m 34s", status: "success", stepsCompleted: 9, stepsTotal: 9, triggeredBy: "Manual" },
      { id: "h2", timestamp: "May 21 16:00", duration: "9m 12s", status: "success", stepsCompleted: 9, stepsTotal: 9, triggeredBy: "Scheduled" },
    ],
  },
  {
    id: "reporting-ops",
    name: "Reporting Operations",
    description: "Metrics rollup, throughput cross-check, and quality analysis",
    steps: [
      { id: "s1", label: "Metrics Data Extract", skill: "data-extraction", type: "skill", promptTemplate: "Extract metrics from the Database and Warehouse" },
      { id: "s2", label: "Throughput Cross-check", skill: "data-validation", type: "skill", promptTemplate: "Cross-check processed records against submitted records" },
      { id: "s3", label: "Quality Roll-forward", skill: "quality-scoring", type: "skill", promptTemplate: "Calculate quality score movements period-over-period" },
      { id: "gate1", label: "Reviewer Review", type: "approval_gate", promptTemplate: "Review metrics above the change threshold" },
      { id: "s4", label: "Report Generation", skill: "report-generation", type: "skill", promptTemplate: "Generate the metrics rollup report for owners" },
    ],
    approvalGates: 1,
    lastRun: "2 days ago",
    status: "active",
    icon: BarChart3,
    history: [
      { id: "h1", timestamp: "May 21 10:15", duration: "3m 45s", status: "success", stepsCompleted: 5, stepsTotal: 5, triggeredBy: "Manual" },
    ],
  },
];

const stepTypeConfig: Record<StepType, { color: string; bg: string; border: string; icon: typeof Settings; label: string }> = {
  skill: { color: "text-primary", bg: "bg-primary/5", border: "border-primary/30", icon: Cpu, label: "Skill" },
  approval_gate: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-300", icon: Lock, label: "Gate" },
  transform: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Cpu, label: "Transform" },
  notification: { color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", icon: Zap, label: "Notify" },
};

function FlowStepsPipeline({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="py-5 -mx-1 overflow-x-auto">
      <div className="flex items-stretch gap-2 min-w-min px-1">
        {steps.map((step, idx) => {
          const config = stepTypeConfig[step.type];
          const StepIcon = config.icon;
          const isDone = step.status === "done";
          const isRunning = step.status === "running";
          const isFailed = step.status === "failed";
          const isGate = step.type === "approval_gate";

          const stateRing =
            isDone ? "ring-2 ring-primary/40" :
            isRunning ? "ring-2 ring-blue-400" :
            isFailed ? "ring-2 ring-red-400" : "";

          const StatusBadge = () => (
            <span className={cn(
              "absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center border-2 border-card",
              isDone ? "bg-primary text-white" :
              isRunning ? "bg-blue-500 text-white" :
              isFailed ? "bg-red-500 text-white" :
              isGate ? "bg-amber-400 text-white" :
              "bg-muted text-muted-foreground"
            )}>
              {isDone ? <CheckCircle2 className="w-3 h-3" /> :
               isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> :
               isFailed ? <AlertCircle className="w-3 h-3" /> :
               isGate ? <Lock className="w-2.5 h-2.5" /> :
               <span className="text-[9px] font-bold">{idx + 1}</span>}
            </span>
          );

          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <div className={cn(
                "relative w-[150px] rounded-xl border-2 px-3 py-2.5 bg-card transition-all",
                config.border,
                isRunning && "shadow-md shadow-blue-100",
                stateRing,
              )}>
                <StatusBadge />
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={cn("text-[8px] font-bold uppercase tracking-widest", config.color)}>
                    {config.label}
                  </span>
                  <span className="text-[8px] text-muted-foreground/60 font-mono">#{idx + 1}</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0", config.bg, config.color)}>
                    <StepIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2">{step.label}</p>
                    {step.skill && (
                      <p className="text-[9px] text-muted-foreground font-mono truncate mt-0.5">{step.skill}</p>
                    )}
                  </div>
                </div>
                {step.promptTemplate && (
                  <p className="text-[9px] text-muted-foreground/80 italic mt-1.5 line-clamp-1 border-t border-border/40 pt-1">
                    {step.promptTemplate}
                  </p>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div className="flex flex-col items-center px-0.5">
                  <ArrowRight className={cn(
                    "w-4 h-4",
                    isDone ? "text-primary" : "text-muted-foreground/40"
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-muted-foreground/70 mt-3 px-1 italic">
        Lyzr SuperFlow · deterministic chain of skills with approval gates between agent steps
      </p>
    </div>
  );
}

function FlowBuilder({ onSave, onClose }: { onSave: (name: string, desc: string, steps: FlowStep[]) => void; onClose: () => void }) {
  const [flowName, setFlowName] = useState("New Flow");
  const [flowDesc, setFlowDesc] = useState("");
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  const addStep = (skillId: string, label: string) => {
    setSteps(prev => [...prev, {
      id: `step-${Date.now()}`,
      label,
      skill: skillId,
      type: "skill",
      promptTemplate: `Run ${label} for {entity} using {period} data`,
    }]);
    setShowSkillPicker(false);
    setSaved(false);
  };

  const addApprovalGate = () => {
    setSteps(prev => [...prev, {
      id: `gate-${Date.now()}`,
      label: "Approval Gate",
      type: "approval_gate",
      promptTemplate: "Review and approve outputs from previous step",
    }]);
    setSaved(false);
  };

  const removeStep = (stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId));
    setSaved(false);
  };

  const handleSave = () => {
    if (!flowName.trim() || steps.length === 0) return;
    onSave(flowName, flowDesc, steps);
    setSaved(true);
  };

  return (
    <div className="bg-card rounded-xl border-2 border-primary/20 overflow-visible">
      <div className="px-5 py-4 bg-primary/5 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg"><Plus className="w-5 h-5 text-primary" /></div>
            <div>
              <input
                value={flowName}
                onChange={(e) => { setFlowName(e.target.value); setSaved(false); }}
                className="text-sm font-bold text-foreground bg-transparent border-none focus:outline-none focus:ring-0"
                placeholder="Flow Name"
              />
              <input
                value={flowDesc}
                onChange={(e) => { setFlowDesc(e.target.value); setSaved(false); }}
                className="block text-[11px] text-muted-foreground bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                placeholder="Flow description..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold border",
              saved ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"
            )}>{saved ? "SAVED" : "DRAFT"}</span>
            <button
              onClick={handleSave}
              disabled={!flowName.trim() || steps.length === 0}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-40 flex items-center gap-1"
            >
              <Save className="w-3 h-3" /> Save Flow
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        {steps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Workflow className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">No steps yet. Add skills to build your flow.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {steps.map((step, idx) => {
              const config = stepTypeConfig[step.type];
              const StepIcon = config.icon;
              return (
                <div key={step.id} className="flex items-center gap-2">
                  {idx > 0 && (
                    <div className="flex flex-col items-center w-6 -my-1">
                      <div className="w-px h-3 bg-border" />
                      <ArrowRight className="w-3 h-3 text-border rotate-90" />
                    </div>
                  )}
                  <div className={cn("flex-1 flex items-center gap-3 rounded-lg border-2 px-3 py-2.5", config.border, config.bg)}>
                    <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab flex-shrink-0" />
                    <StepIcon className={cn("w-4 h-4 flex-shrink-0", config.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{step.label}</p>
                      {step.skill && <p className="text-[9px] text-muted-foreground font-mono">{step.skill}</p>}
                      {step.promptTemplate && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{step.promptTemplate}</p>}
                    </div>
                    <button onClick={() => removeStep(step.id)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-border/50 relative">
          <div className="relative">
            <button
              onClick={() => setShowSkillPicker(!showSkillPicker)}
              className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Skill Step
            </button>
            {showSkillPicker && (
              <div className="absolute bottom-full left-0 mb-1 bg-card rounded-lg border border-border shadow-xl z-50 w-64 max-h-64 overflow-y-auto">
                {AVAILABLE_SKILLS.map(skill => {
                  const SkillIcon = skill.icon;
                  return (
                    <button
                      key={skill.id}
                      onClick={() => addStep(skill.id, skill.label)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors text-xs"
                    >
                      <SkillIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="font-medium text-foreground">{skill.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={addApprovalGate} className="px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1">
            <Lock className="w-3 h-3" /> Add Approval Gate
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SkillFlows() {
  const [flows, setFlows] = useState<SkillFlow[]>(INITIAL_FLOWS);
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [runningFlow, setRunningFlow] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [editingFlow, setEditingFlow] = useState<string | null>(null);

  const auditEmit = useCallback((entry: { type?: string; actor?: string; action: string; details?: string; journey?: string }) => {
    fetch("/api/journey/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "agent_action", actor: "Skill Flow Runner", ...entry }),
    }).catch(() => undefined);
  }, []);

  const runningFlowRef = useRef<string | null>(null);
  runningFlowRef.current = runningFlow;

  const runner = useStepRunner<FlowStep>({
    delayFor: () => 600 + Math.random() * 600,
    label: "skill flow",
    journey: runningFlow ?? undefined,
    audit: auditEmit,
    onStepStart: (_s, i) => {
      const fid = runningFlowRef.current;
      if (!fid) return;
      setFlows(prev => prev.map(f => f.id !== fid ? f : {
        ...f,
        steps: f.steps.map((s, j) => j === i ? { ...s, status: "running" as const } : j < i ? { ...s, status: "done" as const } : s),
      }));
    },
    onStepDone: (_s, i) => {
      const fid = runningFlowRef.current;
      if (!fid) return;
      setFlows(prev => prev.map(f => f.id !== fid ? f : {
        ...f,
        steps: f.steps.map((s, j) => j === i ? { ...s, status: "done" as const } : s),
      }));
    },
    onComplete: () => {
      const fid = runningFlowRef.current;
      if (!fid) return;
      setFlows(prev => prev.map(f => {
        if (f.id !== fid) return f;
        const total = f.steps.length;
        return {
          ...f,
          steps: f.steps.map(s => ({ ...s, status: "done" as const })),
          lastRun: "Just now",
          history: [
            { id: `h-${Date.now()}`, timestamp: "Just now", duration: `${(total * 0.8).toFixed(0)}s`, status: "success" as const, stepsCompleted: total, stepsTotal: total, triggeredBy: "Manual" },
            ...(f.history || []),
          ],
        };
      }));
      setRunningFlow(null);
    },
  });
  const runnerPhase = runner.phase;
  const pausedFlow = runnerPhase === "paused" ? runningFlow : null;

  const handleSaveNewFlow = (name: string, desc: string, steps: FlowStep[]) => {
    const newFlow: SkillFlow = {
      id: `flow-${Date.now()}`,
      name,
      description: desc,
      steps,
      approvalGates: steps.filter(s => s.type === "approval_gate").length,
      status: "draft",
      icon: Workflow,
      history: [],
    };
    setFlows(prev => [...prev, newFlow]);
    setShowBuilder(false);
  };

  const runFlow = useCallback((flowId: string) => {
    if (runningFlow) return;
    const flow = flows.find(f => f.id === flowId);
    if (!flow) return;
    setRunningFlow(flowId);
    setExpandedFlow(flowId);
    setFlows(prev => prev.map(f => f.id !== flowId ? f : { ...f, steps: f.steps.map(s => ({ ...s, status: "idle" as const })) }));
    runner.start(flow.steps);
  }, [runningFlow, flows, runner]);

  const togglePauseFlow = useCallback(() => {
    if (!runningFlow) return;
    runner.pause();
  }, [runningFlow, runner]);

  const startEditFlow = (flowId: string) => {
    setEditingFlow(flowId);
    setExpandedFlow(flowId);
  };

  const saveEditedFlow = (flowId: string, steps: FlowStep[]) => {
    setFlows(prev => prev.map(f => {
      if (f.id !== flowId) return f;
      return {
        ...f,
        steps,
        approvalGates: steps.filter(s => s.type === "approval_gate").length,
      };
    }));
    setEditingFlow(null);
  };

  const totalSteps = flows.reduce((a, f) => a + f.steps.length, 0);
  const totalGates = flows.reduce((a, f) => a + f.approvalGates, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skill Flows</h1>
          <p className="text-sm text-muted-foreground mt-1">Orchestrate skills into deterministic pipelines with approval gates</p>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
            showBuilder ? "bg-muted text-foreground" : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {showBuilder ? <><X className="w-4 h-4" /> Close Builder</> : <><Plus className="w-4 h-4" /> Create New Flow</>}
        </button>
      </div>

      <div className="px-8 py-3 border-b border-border">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{flows.length} Flows</span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{totalSteps} Total Steps</span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">{totalGates} Approval Gates</span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground">{flows.filter(f => f.status === "active").length} Active</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {showBuilder && <FlowBuilder onSave={handleSaveNewFlow} onClose={() => setShowBuilder(false)} />}

        {flows.map((flow) => {
          const isExpanded = expandedFlow === flow.id;
          const FlowIcon = flow.icon;
          const completedSteps = flow.steps.filter(s => s.status === "done").length;
          const isRunning = runningFlow === flow.id;
          const isEditing = editingFlow === flow.id;
          const isShowingHistory = showHistory === flow.id;
          const skillCount = flow.steps.filter(s => s.type === "skill").length;

          return (
            <div key={flow.id} className={cn(
              "bg-card rounded-xl border transition-all",
              isExpanded ? "border-primary/30 shadow-sm" : "border-border hover:border-border/80",
              isRunning && "border-blue-300 shadow-blue-50"
            )}>
              <button
                onClick={() => { setExpandedFlow(isExpanded ? null : flow.id); setShowHistory(null); setEditingFlow(null); }}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors text-left"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border",
                  flow.status === "active" ? "bg-primary/8 border-primary/20 text-primary" : "bg-muted/50 border-border text-muted-foreground"
                )}>
                  <FlowIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-foreground">{flow.name}</h3>
                    <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full border",
                      flow.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"
                    )}>{flow.status === "active" ? "Active" : "Draft"}</span>
                    {isRunning && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> Running
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{flow.description}</p>
                </div>
                <div className="flex items-center gap-5 flex-shrink-0">
                  <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Cpu className="w-3 h-3" />
                      <span className="font-medium">{skillCount} skills</span>
                    </div>
                    {flow.approvalGates > 0 && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <Lock className="w-3 h-3" />
                        <span className="font-medium">{flow.approvalGates} gate{flow.approvalGates > 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                  {completedSteps > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedSteps / flow.steps.length) * 100}%` }} />
                      </div>
                      <span className="font-mono text-[9px] text-muted-foreground">{completedSteps}/{flow.steps.length}</span>
                    </div>
                  )}
                  {flow.lastRun && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {flow.lastRun}
                    </span>
                  )}
                  <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border/50 px-5 pb-4">
                  {isEditing ? (
                    <EditFlowInline flow={flow} onSave={(steps) => saveEditedFlow(flow.id, steps)} onCancel={() => setEditingFlow(null)} />
                  ) : (
                    <FlowStepsPipeline steps={flow.steps} />
                  )}

                  <div className="flex items-center gap-1 mt-1 pt-3 border-t border-border/30">
                    <button
                      onClick={(e) => { e.stopPropagation(); runFlow(flow.id); }}
                      disabled={isRunning}
                      className={cn("text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
                        isRunning ? "bg-blue-50 text-blue-400" : "bg-primary/10 text-primary hover:bg-primary/15"
                      )}
                    >
                      {isRunning && pausedFlow !== flow.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Running...</> :
                       pausedFlow === flow.id ? <><Play className="w-3 h-3" /> Paused</> :
                       <><Play className="w-3 h-3" /> Run Flow</>}
                    </button>
                    {isRunning && (
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePauseFlow(); }}
                        className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                      >
                        {pausedFlow === flow.id ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditFlow(flow.id); }}
                      disabled={isRunning}
                      className="text-xs text-muted-foreground font-medium hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted/50"
                    >
                      <Settings className="w-3 h-3" /> Edit Flow
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowHistory(isShowingHistory ? null : flow.id); }}
                      className={cn("text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
                        isShowingHistory ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <History className="w-3 h-3" /> Run History
                    </button>
                  </div>

                  {isShowingHistory && (
                    <div className="mt-3 bg-muted/20 rounded-lg border border-border p-3">
                      <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-primary" /> Run History
                      </h4>
                      {(flow.history || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No runs recorded yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {(flow.history || []).map(run => (
                            <div key={run.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border/50">
                              {run.status === "success" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> :
                               run.status === "partial" ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /> :
                               <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-medium text-foreground">{run.timestamp}</span>
                                  <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
                                    run.status === "success" ? "bg-emerald-50 text-emerald-600" :
                                    run.status === "partial" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                  )}>{run.status === "success" ? "Complete" : run.status === "partial" ? "Partial" : "Failed"}</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-muted-foreground">{run.stepsCompleted}/{run.stepsTotal} steps</span>
                              <span className="text-[10px] text-muted-foreground">{run.duration}</span>
                              <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{run.triggeredBy}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditFlowInline({ flow, onSave, onCancel }: { flow: SkillFlow; onSave: (steps: FlowStep[]) => void; onCancel: () => void }) {
  const [steps, setSteps] = useState<FlowStep[]>(flow.steps.map(s => ({ ...s })));
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  const addStep = (skillId: string, label: string) => {
    setSteps(prev => [...prev, {
      id: `step-${Date.now()}`,
      label,
      skill: skillId,
      type: "skill" as const,
      promptTemplate: `Run ${label} for {entity} using {period} data`,
    }]);
    setShowSkillPicker(false);
  };

  const addGate = () => {
    setSteps(prev => [...prev, {
      id: `gate-${Date.now()}`,
      label: "Approval Gate",
      type: "approval_gate" as const,
      promptTemplate: "Review and approve outputs from previous step",
    }]);
  };

  const removeStep = (stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId));
  };

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-primary" /> Editing Flow
        </h4>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="text-xs px-2.5 py-1 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">Cancel</button>
          <button onClick={() => onSave(steps)} className="text-xs px-2.5 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {steps.map((step, idx) => {
          const config = stepTypeConfig[step.type];
          const StepIcon = config.icon;
          return (
            <div key={step.id} className="flex items-center gap-2">
              {idx > 0 && (
                <div className="flex flex-col items-center w-6 -my-1">
                  <div className="w-px h-3 bg-border" />
                  <ArrowRight className="w-3 h-3 text-border rotate-90" />
                </div>
              )}
              <div className={cn("flex-1 flex items-center gap-3 rounded-lg border-2 px-3 py-2", config.border, config.bg)}>
                <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab flex-shrink-0" />
                <StepIcon className={cn("w-3.5 h-3.5 flex-shrink-0", config.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground">{step.label}</p>
                  {step.skill && <p className="text-[8px] text-muted-foreground font-mono">{step.skill}</p>}
                </div>
                <button onClick={() => removeStep(step.id)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 relative">
        <div className="relative">
          <button onClick={() => setShowSkillPicker(!showSkillPicker)} className="px-2.5 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-medium flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Skill Step
          </button>
          {showSkillPicker && (
            <div className="absolute bottom-full left-0 mb-1 bg-card rounded-lg border border-border shadow-xl z-50 w-56 max-h-52 overflow-y-auto">
              {AVAILABLE_SKILLS.map(skill => {
                const SkillIcon = skill.icon;
                return (
                  <button key={skill.id} onClick={() => addStep(skill.id, skill.label)} className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50 text-[10px]">
                    <SkillIcon className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="font-medium text-foreground">{skill.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={addGate} className="px-2.5 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-medium border border-amber-200 flex items-center gap-1">
          <Lock className="w-3 h-3" /> Add Gate
        </button>
      </div>
    </div>
  );
}
