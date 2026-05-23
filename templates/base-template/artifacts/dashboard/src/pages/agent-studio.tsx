import { useState, useRef } from "react";
import {
  Bot, Plus, Settings, Play, MoreVertical, Cpu, FileText, Shield, Zap,
  CheckCircle2, Clock, AlertCircle, X, Trash2, Save, TerminalSquare,
  ChevronRight, Activity, Pause, Power
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  model: string;
  status: "active" | "draft" | "paused";
  skills: string[];
  lastRun?: string;
  runsToday: number;
  avgLatency: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface TestRun {
  id: string;
  timestamp: string;
  input: string;
  output: string;
  duration: string;
  status: "success" | "error";
  tokensUsed: number;
}

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

const ALL_SKILLS = [
  "example-skill",
  "data-validation",
  "record-matching",
  "anomaly-detection",
  "report-generation",
  "policy-check",
  "summarization",
  "classification",
  "trend-analysis",
  "deduplication",
  "quality-scoring",
  "data-extraction",
];

const INITIAL_AGENTS: AgentConfig[] = [
  {
    id: "main-agent",
    name: "Example Agent",
    description: "Primary agent for the example journey -- intake, validation, matching, reporting, and review",
    model: "Claude Sonnet 4.6",
    status: "active",
    skills: ["example-skill", "data-validation", "record-matching", "report-generation", "policy-check", "quality-scoring"],
    lastRun: "3 minutes ago",
    runsToday: 47,
    avgLatency: "12.4s",
    temperature: 0.2,
    maxTokens: 8192,
    systemPrompt: "You are the Example Agent. Process records with precision and provide actionable output.",
  },
  {
    id: "intake-agent",
    name: "Intake Agent",
    description: "Record intake, deduplication, schema validation, and routing",
    model: "Claude Sonnet 4.6",
    status: "active",
    skills: ["anomaly-detection", "deduplication"],
    lastRun: "18 minutes ago",
    runsToday: 23,
    avgLatency: "8.1s",
    temperature: 0.1,
    maxTokens: 4096,
    systemPrompt: "You are the Intake Agent. Validate incoming records, detect anomalies, and route them efficiently.",
  },
  {
    id: "summary-agent",
    name: "Summary Agent",
    description: "Trend analysis, summary generation, and run report preparation",
    model: "Claude Sonnet 4.6",
    status: "active",
    skills: ["trend-analysis", "summarization"],
    lastRun: "1 hour ago",
    runsToday: 8,
    avgLatency: "15.2s",
    temperature: 0.3,
    maxTokens: 8192,
    systemPrompt: "You are the Summary Agent. Analyze trends and generate clear, reviewer-ready summaries.",
  },
  {
    id: "compliance-agent",
    name: "Compliance Monitor",
    description: "Continuous monitoring of policy thresholds, guardrail enforcement, and audit trail generation",
    model: "Claude Sonnet 4.6",
    status: "draft",
    skills: ["policy-check"],
    runsToday: 0,
    avgLatency: "--",
    temperature: 0.0,
    maxTokens: 4096,
    systemPrompt: "You are the Compliance Monitor Agent. Enforce policy guardrails and generate audit trails.",
  },
];

const MOCK_TEST_RUNS: Record<string, TestRun[]> = {
  "main-agent": [
    { id: "tr1", timestamp: "Today 09:42:18", input: "Run a pre-check for the latest example batch", output: "Pre-checks passed. 3 reference lookups resolved. All record balances verified.", duration: "11.2s", status: "success", tokensUsed: 3421 },
    { id: "tr2", timestamp: "Today 09:38:04", input: "Match records against the reference dataset", output: "Matching complete. 2 timing differences (45 records), 1 unmatched item.", duration: "14.8s", status: "success", tokensUsed: 4102 },
    { id: "tr3", timestamp: "Today 09:15:31", input: "Compute the quality score for the latest run", output: "Error: Missing quality fields for records 28-31. Cannot compute the score.", duration: "3.2s", status: "error", tokensUsed: 890 },
  ],
  "intake-agent": [
    { id: "tr1", timestamp: "Today 09:20:45", input: "Scan the latest batch for duplicate records", output: "3 potential duplicates detected: REC-04812 matches REC-04810 (98% similarity), REC-8834 flagged.", duration: "7.4s", status: "success", tokensUsed: 2180 },
    { id: "tr2", timestamp: "Today 08:55:12", input: "Score the quality of source A records", output: "Quality score: 88/100 (Good). Field completeness: 100%. Values within expected range.", duration: "5.1s", status: "success", tokensUsed: 1540 },
  ],
};

const MOCK_LOGS: Record<string, LogEntry[]> = {
  "main-agent": [
    { timestamp: "09:42:18.102", level: "info", message: "[main-agent] Session started | model=claude-sonnet-4.6 | temperature=0.2" },
    { timestamp: "09:42:18.340", level: "info", message: "[main-agent] Skill loaded: example-skill (8.4 KB)" },
    { timestamp: "09:42:18.512", level: "info", message: "[main-agent] Reading knowledge file: example-data.json (45 KB, 312 records)" },
    { timestamp: "09:42:19.001", level: "info", message: "[main-agent] Reading knowledge file: reference-dataset.json (12 KB, 48 records)" },
    { timestamp: "09:42:19.890", level: "info", message: "[main-agent] API call: messages.create | tokens_in=2,140 | tokens_out=1,281" },
    { timestamp: "09:42:29.102", level: "info", message: "[main-agent] Response completed | duration=11.2s | total_tokens=3,421" },
    { timestamp: "09:42:29.340", level: "info", message: "[main-agent] Memory updated: MEMORY.md (+1 interaction)" },
    { timestamp: "09:38:04.200", level: "info", message: "[main-agent] Session started | model=claude-sonnet-4.6 | temperature=0.2" },
    { timestamp: "09:38:04.510", level: "info", message: "[main-agent] Skill loaded: record-matching (6.2 KB)" },
    { timestamp: "09:38:05.100", level: "info", message: "[main-agent] Reading knowledge file: records-summary.json (89 KB, 1,247 records)" },
    { timestamp: "09:38:05.800", level: "warn", message: "[main-agent] Large file detected, using chunked processing" },
    { timestamp: "09:38:18.400", level: "info", message: "[main-agent] Response completed | duration=14.8s | total_tokens=4,102" },
    { timestamp: "09:15:31.000", level: "info", message: "[main-agent] Session started | model=claude-sonnet-4.6 | temperature=0.2" },
    { timestamp: "09:15:31.200", level: "info", message: "[main-agent] Skill loaded: quality-scoring (7.1 KB)" },
    { timestamp: "09:15:31.500", level: "error", message: "[main-agent] Missing required data: example-data.json field quality_score not found" },
    { timestamp: "09:15:34.200", level: "error", message: "[main-agent] Execution failed | duration=3.2s | error=MISSING_DATA" },
  ],
  "intake-agent": [
    { timestamp: "09:20:45.100", level: "info", message: "[intake-agent] Session started | model=claude-sonnet-4.6 | temperature=0.1" },
    { timestamp: "09:20:45.300", level: "info", message: "[intake-agent] Skill loaded: anomaly-detection" },
    { timestamp: "09:20:46.200", level: "info", message: "[intake-agent] Processing batch: 47 records" },
    { timestamp: "09:20:50.100", level: "warn", message: "[intake-agent] Potential duplicate: REC-04812 <-> REC-04810 (similarity: 98.2%)" },
    { timestamp: "09:20:52.500", level: "info", message: "[intake-agent] Response completed | duration=7.4s | total_tokens=2,180" },
  ],
};

const statusConfig = {
  active: { label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  draft: { label: "Draft", color: "bg-gray-50 text-gray-600 border-gray-200", icon: Clock },
  paused: { label: "Paused", color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle },
};

const logLevelColors = {
  info: "text-muted-foreground",
  warn: "text-amber-600",
  error: "text-red-600",
};

type PanelMode = null | "new" | "configure" | "test-runs" | "logs";

export default function AgentStudio() {
  const [agents, setAgents] = useState<AgentConfig[]>(INITIAL_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [editDraft, setEditDraft] = useState<Partial<AgentConfig>>({});
  const [testRunning, setTestRunning] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState<TestRun | null>(null);

  const openPanel = (mode: PanelMode, agentId?: string) => {
    if (mode === "new") {
      setEditDraft({
        id: `agent-${Date.now()}`,
        name: "",
        description: "",
        model: "Claude Sonnet 4.6",
        status: "draft",
        skills: [],
        runsToday: 0,
        avgLatency: "--",
        temperature: 0.2,
        maxTokens: 4096,
        systemPrompt: "",
      });
      setSelectedAgent(null);
    } else if (agentId) {
      const agent = agents.find(a => a.id === agentId);
      if (agent) setEditDraft({ ...agent });
      setSelectedAgent(agentId);
    }
    setPanelMode(mode);
    setTestOutput(null);
    setTestInput("");
  };

  const closePanel = () => {
    setPanelMode(null);
    setEditDraft({});
  };

  const saveAgent = () => {
    if (!editDraft.name?.trim()) return;
    if (panelMode === "new") {
      const newAgent: AgentConfig = {
        id: editDraft.id || `agent-${Date.now()}`,
        name: editDraft.name || "Untitled Agent",
        description: editDraft.description || "",
        model: editDraft.model || "Claude Sonnet 4.6",
        status: "draft",
        skills: editDraft.skills || [],
        runsToday: 0,
        avgLatency: "--",
        temperature: editDraft.temperature ?? 0.2,
        maxTokens: editDraft.maxTokens ?? 4096,
        systemPrompt: editDraft.systemPrompt || "",
      };
      setAgents(prev => [...prev, newAgent]);
    } else if (panelMode === "configure" && selectedAgent) {
      setAgents(prev => prev.map(a =>
        a.id === selectedAgent ? { ...a, ...editDraft } as AgentConfig : a
      ));
    }
    closePanel();
  };

  const toggleSkill = (skill: string) => {
    setEditDraft(prev => {
      const skills = prev.skills || [];
      return {
        ...prev,
        skills: skills.includes(skill) ? skills.filter(s => s !== skill) : [...skills, skill],
      };
    });
  };

  const runTestExecution = () => {
    if (!testInput.trim() || testRunning) return;
    setTestRunning(true);
    setTestOutput(null);
    setTimeout(() => {
      const isError = Math.random() < 0.15;
      setTestOutput({
        id: `test-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        input: testInput,
        output: isError
          ? "Error: Unable to process request. Missing required data source for this operation."
          : `Analysis complete. Processed ${Math.floor(Math.random() * 500 + 100)} records. Key findings: ${Math.floor(Math.random() * 5 + 1)} items flagged for review. All compliance checks passed.`,
        duration: `${(Math.random() * 15 + 3).toFixed(1)}s`,
        status: isError ? "error" : "success",
        tokensUsed: Math.floor(Math.random() * 4000 + 1000),
      });
      setTestRunning(false);
      setTestInput("");
    }, 2000 + Math.random() * 2000);
  };

  const toggleAgentStatus = (agentId: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== agentId) return a;
      const next = a.status === "active" ? "paused" : "active";
      return { ...a, status: next };
    }));
  };

  const currentAgent = selectedAgent ? agents.find(a => a.id === selectedAgent) : null;
  const testRuns = selectedAgent ? MOCK_TEST_RUNS[selectedAgent] || [] : [];
  const logs = selectedAgent ? MOCK_LOGS[selectedAgent] || [] : [];

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-border">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agent Studio</h1>
            <p className="text-sm text-muted-foreground mt-1">Create, configure, and manage AI agents for your workflows</p>
          </div>
          <button
            onClick={() => openPanel("new")}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Agent
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const status = statusConfig[agent.status];
              const StatusIcon = status.icon;
              const isSelected = selectedAgent === agent.id && panelMode !== null;
              return (
                <div
                  key={agent.id}
                  className={cn(
                    "bg-card rounded-xl border border-border p-5 transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-primary border-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{agent.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", status.color)}>
                            <StatusIcon className="w-3 h-3 inline mr-1" />{status.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Cpu className="w-3 h-3" />{agent.model}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleAgentStatus(agent.id); }}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      title={agent.status === "active" ? "Pause agent" : "Activate agent"}
                    >
                      {agent.status === "active" ? <Pause className="w-4 h-4 text-muted-foreground" /> : <Power className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{agent.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {agent.runsToday} runs today</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {agent.avgLatency} avg</span>
                    {agent.lastRun && <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {agent.lastRun}</span>}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {agent.skills.slice(0, 3).map(s => (
                      <span key={s} className="text-[9px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                    {agent.skills.length > 3 && (
                      <span className="text-[9px] text-muted-foreground px-1 py-0.5">+{agent.skills.length - 3} more</span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border flex items-center gap-2">
                    <button
                      onClick={() => openPanel("configure", agent.id)}
                      className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" /> Configure
                    </button>
                    <button
                      onClick={() => openPanel("test-runs", agent.id)}
                      className="text-xs px-3 py-1.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Test Runs
                    </button>
                    <button
                      onClick={() => openPanel("logs", agent.id)}
                      className="text-xs px-3 py-1.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 flex items-center gap-1"
                    >
                      <TerminalSquare className="w-3 h-3" /> View Logs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {panelMode !== null && (
        <div className="w-[420px] border-l border-border bg-background flex flex-col flex-shrink-0">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              {panelMode === "new" && <Plus className="w-4 h-4 text-primary" />}
              {panelMode === "configure" && <Settings className="w-4 h-4 text-primary" />}
              {panelMode === "test-runs" && <Play className="w-4 h-4 text-primary" />}
              {panelMode === "logs" && <TerminalSquare className="w-4 h-4 text-primary" />}
              <h3 className="text-sm font-semibold text-foreground">
                {panelMode === "new" ? "Create New Agent" :
                 panelMode === "configure" ? `Configure ${currentAgent?.name || ""}` :
                 panelMode === "test-runs" ? `Test Runs — ${currentAgent?.name || ""}` :
                 `Logs — ${currentAgent?.name || ""}`}
              </h3>
            </div>
            <button onClick={closePanel} className="p-1 hover:bg-muted rounded-md">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {(panelMode === "new" || panelMode === "configure") && (
              <div className="p-5 space-y-5">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Agent Name</label>
                  <input
                    value={editDraft.name || ""}
                    onChange={(e) => setEditDraft(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g. Records Agent"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Description</label>
                  <textarea
                    value={editDraft.description || ""}
                    onChange={(e) => setEditDraft(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none h-16"
                    placeholder="What does this agent do?"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Model</label>
                  <select
                    value={editDraft.model || "Claude Sonnet 4.6"}
                    onChange={(e) => setEditDraft(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option>Claude Sonnet 4.6</option>
                    <option>Claude Opus 4</option>
                    <option>Claude Haiku 4</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Temperature</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={editDraft.temperature ?? 0.2}
                      onChange={(e) => setEditDraft(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Max Tokens</label>
                    <input
                      type="number"
                      step="1024"
                      min="1024"
                      max="32768"
                      value={editDraft.maxTokens ?? 4096}
                      onChange={(e) => setEditDraft(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">System Prompt</label>
                  <textarea
                    value={editDraft.systemPrompt || ""}
                    onChange={(e) => setEditDraft(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    className="w-full text-sm font-mono px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none h-24"
                    placeholder="System instructions for the agent..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Skills</label>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {ALL_SKILLS.map(skill => (
                      <label key={skill} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(editDraft.skills || []).includes(skill)}
                          onChange={() => toggleSkill(skill)}
                          className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span className="text-xs font-mono text-foreground">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={saveAgent}
                  disabled={!editDraft.name?.trim()}
                  className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {panelMode === "new" ? "Create Agent" : "Save Changes"}
                </button>
              </div>
            )}

            {panelMode === "test-runs" && (
              <div className="p-5 space-y-4">
                <div className="bg-muted/30 rounded-xl border border-border p-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Run a Test</label>
                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Enter a prompt to test this agent..."
                    className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none h-16 mb-2"
                    disabled={testRunning}
                  />
                  <button
                    onClick={runTestExecution}
                    disabled={!testInput.trim() || testRunning}
                    className="w-full px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {testRunning ? (
                      <><Activity className="w-3.5 h-3.5 animate-pulse" /> Running...</>
                    ) : (
                      <><Play className="w-3.5 h-3.5" /> Execute Test Run</>
                    )}
                  </button>
                </div>

                {testOutput && (
                  <div className={cn("rounded-xl border-2 p-4", testOutput.status === "success" ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30")}>
                    <div className="flex items-center gap-2 mb-2">
                      {testOutput.status === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                      <span className="text-xs font-semibold text-foreground">Test Result</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{testOutput.duration} | {testOutput.tokensUsed} tokens</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{testOutput.output}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Previous Runs</h4>
                  <div className="space-y-2">
                    {testRuns.map(run => (
                      <div key={run.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          {run.status === "success" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-red-500" />}
                          <span className="text-[10px] text-muted-foreground">{run.timestamp}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{run.duration} | {run.tokensUsed} tokens</span>
                        </div>
                        <p className="text-[11px] text-foreground font-medium mb-1">{run.input}</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{run.output}</p>
                      </div>
                    ))}
                    {testRuns.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No test runs recorded yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {panelMode === "logs" && (
              <div className="p-4">
                <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center gap-2">
                    <TerminalSquare className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-mono text-gray-400">{currentAgent?.id || "agent"}.log</span>
                    <span className="text-[9px] text-gray-500 ml-auto">{logs.length} entries</span>
                  </div>
                  <div className="p-3 max-h-[calc(100vh-200px)] overflow-y-auto font-mono text-[11px] space-y-0.5">
                    {logs.map((entry, i) => (
                      <div key={i} className="flex gap-2 leading-relaxed">
                        <span className="text-gray-500 flex-shrink-0">{entry.timestamp}</span>
                        <span className={cn("flex-shrink-0 uppercase font-bold w-10",
                          entry.level === "info" ? "text-blue-400" :
                          entry.level === "warn" ? "text-amber-400" : "text-red-400"
                        )}>{entry.level}</span>
                        <span className={cn(
                          entry.level === "error" ? "text-red-300" :
                          entry.level === "warn" ? "text-amber-300" : "text-gray-300"
                        )}>{entry.message}</span>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No logs available</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
