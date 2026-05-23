import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Play, Search, AlertCircle, RefreshCw, CheckCircle2, Zap, FileText, FolderOpen, ArrowRight, TrendingUp, PresentationIcon, Shield, DollarSign, Receipt, Scale, Building2, Landmark, ShieldCheck, Globe, ChevronDown, ChevronRight, Terminal, Eye, BookOpen, Database, Cpu, Clock, Hash, X, GitMerge, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useStickToBottom } from "@/lib/use-stick-to-bottom";
import { useChatStream } from "@/hooks/use-chat-stream";
import { cn } from "@/lib/utils";
import { useGetAgentFileContent } from "@workspace/api-client-react";

function FileContentScroll({ content }: { content: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTop = 0;
    const totalScroll = el.scrollHeight - el.clientHeight;
    if (totalScroll <= 0) return;
    const startTime = Date.now();
    const duration = 1200;
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.scrollTop = eased * totalScroll;
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [content]);

  return (
    <div ref={scrollRef} className="max-h-[120px] overflow-hidden rounded-md bg-muted/40 border border-border/50 px-3 py-2">
      <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">{content}</pre>
    </div>
  );
}

function PipelineStepIcon({ type, isActive, isDone }: { type: string; isActive: boolean; isDone: boolean }) {
  if (isActive) return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
  if (isDone) return <CheckCircle2 className="w-3.5 h-3.5 text-primary" />;

  switch (type) {
    case "skill_loading": return <Zap className="w-3.5 h-3.5 text-muted-foreground" />;
    case "file_fetch": return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
    case "file_write": return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
    case "tool_use": return <Cpu className="w-3.5 h-3.5 text-muted-foreground" />;
    case "tool_result": return <Cpu className="w-3.5 h-3.5 text-muted-foreground" />;
    case "memory_update": return <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />;
    default: return <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

function getStepLabel(evt: { type: string; data: string; meta?: Record<string, any> }): string {
  if (evt.type === "tool_use" && evt.meta?.tool) return evt.meta.action || `${evt.meta.tool}(${evt.meta.file || ""})`;
  if (evt.type === "tool_result" && evt.meta?.tool) return `${evt.meta.tool}: ${evt.meta.status === "error" ? "error" : "loaded"}`;
  if (evt.meta?.action) return evt.meta.action;
  if (evt.type === "skill_loading") return `Loading skill: ${evt.data}`;
  if (evt.type === "file_fetch") return `Reading ${evt.data}`;
  if (evt.type === "file_search") return `Searching for ${evt.data}`;
  if (evt.type === "file_write") return `Writing ${evt.data}`;
  if (evt.type === "tool_use") return `Tool: ${evt.data}`;
  if (evt.type === "tool_result") return `Result ready`;
  if (evt.type === "memory_update") return `Updated agent memory`;
  return `${evt.data}`;
}

function AgentPipelineStream({ events, isStreaming }: { events: { type: string; data: string; timestamp: number; meta?: Record<string, any> }[]; isStreaming: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDone = !isStreaming && events.length > 0;

  useStickToBottom({ containerRef, deps: [events, isStreaming], enabled: isStreaming });

  useEffect(() => {
    if (!isDone) return;
    const timer = setTimeout(() => setIsCollapsed(true), 600);
    return () => clearTimeout(timer);
  }, [isDone]);

  const fileSteps = events.filter(e => e.type === "file_fetch");
  const skillSteps = events.filter(e => e.type === "skill_loading");
  const configSteps = events.filter(e => e.type === "system_read");

  if (isDone && isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-border bg-muted/30 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsCollapsed(false)}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            Analyzed {fileSteps.length} data files
            {skillSteps.length > 0 && `, loaded ${skillSteps.length} skill${skillSteps.length > 1 ? "s" : ""}`}
            {configSteps.length > 0 && `, read ${configSteps.length} config files`}
          </span>
          <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-0">
      {isDone && !isCollapsed && (
        <div
          className="flex items-center gap-1.5 mb-2 cursor-pointer hover:opacity-70 transition-opacity"
          onClick={() => setIsCollapsed(true)}
        >
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
            {events.length} steps completed
          </span>
        </div>
      )}

      <div ref={containerRef} className="space-y-0">
        {events.map((evt, idx) => {
          const isLatest = idx === events.length - 1;
          const isActive = isLatest && isStreaming;
          const stepDone = !isActive;
          const hasPreview = !!evt.meta?.preview;
          const showExpanded = isActive && hasPreview;
          const isLast = idx === events.length - 1;

          return (
            <motion.div
              key={`${evt.timestamp}-${idx}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 relative">
                {!isLast && (
                  <div className="absolute left-[7px] top-[22px] bottom-0 w-px bg-border" />
                )}

                <div className="flex-shrink-0 mt-1 relative z-10 bg-card rounded-full">
                  <PipelineStepIcon type={evt.type} isActive={isActive} isDone={stepDone} />
                </div>

                <div className="flex-1 min-w-0 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs leading-tight",
                      isActive ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {getStepLabel(evt)}
                    </span>
                    {evt.type === "file_fetch" && stepDone && (
                      <span className="text-[9px] text-primary/60 font-mono">{evt.data}</span>
                    )}
                  </div>

                  <AnimatePresence>
                    {showExpanded && evt.meta?.preview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-1.5 overflow-hidden"
                      >
                        <FileContentScroll content={evt.meta.preview} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const ALL_SKILLS = [
  { name: "example-skill", active: true },
  { name: "data-validation", active: true },
  { name: "record-matching", active: true },
  { name: "anomaly-detection", active: true },
  { name: "report-generation", active: true },
  { name: "summarization", active: true },
  { name: "classification", active: true },
  { name: "entity-extraction", active: true },
  { name: "trend-analysis", active: true },
  { name: "deduplication", active: true },
  { name: "policy-check", active: true },
  { name: "cross-check", active: true },
  { name: "quality-scoring", active: true },
  { name: "research", active: false },
  { name: "data-enrichment", active: false },
  { name: "translation", active: false },
  { name: "redaction", active: false },
  { name: "routing", active: false },
  { name: "lookup", active: false },
  { name: "notification", active: false },
  { name: "risk-scoring", active: false },
];

const ALL_DATA_FILES = [
  "example-data.json", "reference-dataset.json", "records-summary.json",
  "metrics-rollup.json", "run-history.json", "throughput-forecast.json",
  "quality-report.json", "source-registry.json", "connector-config.json",
  "queue-status.json", "team-roster.json", "capacity-plan.json",
  "schedule-plan.json", "settings.json", "run-summary.json",
  "transactions.json", "matching-results.json",
  "validation-results.json", "enrichment-results.json",
  "policies.json", "controls-matrix.json", "data-privacy-register.json",
];

function DataFilePreview({ fileName, onClose }: { fileName: string; onClose: () => void }) {
  const isCompliance = ["policies.json", "controls-matrix.json", "data-privacy-register.json"].includes(fileName);
  const filePath = isCompliance
    ? `knowledge/compliance/${fileName}`
    : `knowledge/data/${fileName}`;

  const { data: fileContent, isLoading } = useGetAgentFileContent({ path: filePath });

  let parsed: any = null;
  try {
    if (fileContent?.content) parsed = JSON.parse(fileContent.content);
  } catch {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-[520px] max-h-[70vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{fileName}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : parsed ? (
            <div className="space-y-3">
              {parsed.report && (
                <div className="text-sm font-semibold text-foreground">{parsed.report}</div>
              )}
              {parsed.period && (
                <div className="text-xs text-muted-foreground">{parsed.period}</div>
              )}
              {parsed.summary && (
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-1.5">
                  {Object.entries(parsed.summary).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{key.replace(/_/g, " ")}</span>
                      <span className="font-mono font-medium text-foreground">{typeof val === "number" ? val.toLocaleString() : String(val)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-muted/30 border border-border rounded-lg overflow-hidden">
                <pre className="text-[10px] font-mono text-muted-foreground p-3 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(parsed, null, 2).substring(0, 3000)}
                  {JSON.stringify(parsed, null, 2).length > 3000 ? "\n..." : ""}
                </pre>
              </div>
            </div>
          ) : (
            <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">
              {fileContent?.content || "Unable to load file"}
            </pre>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const COMPLIANCE_RULES = [
  { label: "Batches above 1,000 records require human approval", type: "guardrail" },
  { label: "All outputs subject to Output Safety review", type: "audit" },
  { label: "PII data masked in external-facing outputs", type: "privacy" },
  { label: "Policy A — automated decision disclosure", type: "policy" },
];

function CollapsibleSection({ 
  title, icon: Icon, iconColor, count, initialCount, children, items 
}: { 
  title: string; 
  icon: any; 
  iconColor: string; 
  count: number; 
  initialCount: number;
  children?: React.ReactNode;
  items?: React.ReactNode[];
}) {
  const [expanded, setExpanded] = useState(false);
  const displayItems = items || [];
  const visibleItems = expanded ? displayItems : displayItems.slice(0, initialCount);
  const hasMore = displayItems.length > initialCount;

  return (
    <div>
      <h4 className="text-xs font-medium mb-3 text-foreground flex items-center gap-2">
        <Icon className={cn("w-3.5 h-3.5", iconColor)} /> {title}
        <span className="text-[10px] font-normal text-muted-foreground ml-auto">{count}</span>
      </h4>
      {children || (
        <div className="space-y-1.5">
          {visibleItems}
        </div>
      )}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-md transition-colors"
        >
          {expanded ? (
            <>Show Less <ChevronDown className="w-3 h-3 rotate-180" /></>
          ) : (
            <>Show {displayItems.length - initialCount} More <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}
    </div>
  );
}

export default function AgentConsole() {
  const { messages, isStreaming, activeEvents, activeFiles, sendMessage, stopStream } = useChatStream();
  const [input, setInput] = useState("");
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialQuerySent = useRef(false);

  useEffect(() => {
    if (initialQuerySent.current) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q && q.trim()) {
      initialQuerySent.current = true;
      window.history.replaceState({}, "", window.location.pathname);
      sendMessage(q.trim());
    }
  }, [sendMessage]);

  const quickActions = [
    { icon: TrendingUp, title: "Analyze Run Variance", description: "Compare the latest run against the prior period with root cause analysis", prompt: "Run a variance analysis on the latest example run with root cause identification" },
    { icon: PresentationIcon, title: "Prepare Run Summary", description: "Generate a reviewer-ready summary with key metrics", prompt: "Prepare a run summary with an executive overview" },
    { icon: Shield, title: "Compliance Health Check", description: "Audit policies, guardrails, and access controls", prompt: "Run a comprehensive compliance health check across all policies" },
    { icon: TrendingUp, title: "Throughput Forecast", description: "Project the next 90 days with scenario analysis", prompt: "Forecast the next 90 days of throughput with stress scenarios" },
    { icon: Search, title: "Anomaly Scan", description: "Flag outliers in the latest batch of records", prompt: "Scan for anomalies in the latest batch of records" },
    { icon: Scale, title: "Threshold Check", description: "Calculate threshold headroom and queue impact", prompt: "Check all approval thresholds and project headroom for the next 4 periods" },
    { icon: Building2, title: "Quality Report", description: "Auto-handled, needs-review, and failure metrics", prompt: "Analyze quality metrics and identify improvement opportunities" },
    { icon: BookOpen, title: "Policy Review", description: "Policy A compliance check on the record portfolio", prompt: "Review Policy A compliance for the current period" },
    { icon: GitMerge, title: "Record Matching", description: "Match records against the reference dataset across systems", prompt: "Run a record matching analysis across all connected systems — identify mismatches between the ERP, Database, Warehouse, and API sources" },
  ];

  useStickToBottom({ endRef: messagesEndRef, deps: [messages, activeEvents] });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const handleQuickAction = (action: string) => {
    if (isStreaming) return;
    sendMessage(action);
  };

  const skillItems = ALL_SKILLS.map(skill => (
    <div key={skill.name} className={cn(
      "p-2 rounded-lg border flex items-center justify-between",
      skill.active
        ? "border-primary/20 bg-primary/5"
        : "border-border bg-muted/30 opacity-50"
    )}>
      <span className={cn(
        "text-[11px] font-mono truncate",
        skill.active ? "text-primary" : "text-muted-foreground"
      )}>{skill.name}</span>
      <span className={cn(
        "flex h-2 w-2 rounded-full flex-shrink-0",
        skill.active ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
      )} />
    </div>
  ));

  const dataFileItems = ALL_DATA_FILES.map(file => {
    const isActive = activeFiles.includes(file);
    return (
      <motion.div
        key={file}
        animate={isActive ? { backgroundColor: ["hsl(var(--primary) / 0.08)", "hsl(var(--primary) / 0.04)"] } : {}}
        transition={{ duration: 1, repeat: isActive ? Infinity : 0, repeatType: "reverse" }}
        onClick={() => setPreviewFile(file)}
        className={cn(
          "flex items-center gap-2 text-[11px] px-2 py-1.5 rounded border transition-all cursor-pointer hover:border-primary/30",
          isActive
            ? "text-primary border-primary/20 bg-primary/5 font-medium"
            : "text-muted-foreground border-border/50 bg-muted/20 hover:text-foreground"
        )}
      >
        <FileText className={cn("w-3 h-3 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground/50")} />
        <span className="font-mono truncate">{file}</span>
        {isActive ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto flex-shrink-0">
            <ArrowRight className="w-3 h-3 text-primary" />
          </motion.div>
        ) : (
          <Eye className="w-3 h-3 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground" />
        )}
      </motion.div>
    );
  });

  const complianceItems = COMPLIANCE_RULES.map((rule, i) => (
    <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground py-1">
      <ShieldCheck className="w-3 h-3 text-warning flex-shrink-0 mt-0.5" />
      <span>{rule.label}</span>
    </div>
  ));

  return (
    <div className="flex h-full">
      <AnimatePresence>
        {previewFile && (
          <DataFilePreview fileName={previewFile} onClose={() => setPreviewFile(null)} />
        )}
      </AnimatePresence>
      <div className="flex-1 flex flex-col border-r border-border relative bg-background">
        <div className="h-14 px-6 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Example Agent</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                Online & Ready
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors" title="New Chat">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">How can I help you today?</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-2 mb-8">
                I can analyze run variances, generate summaries, score quality, or monitor throughput. All actions are streamed in real-time.
              </p>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl w-full">
                {quickActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.title}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="text-left p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground leading-tight">{action.title}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{action.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((msg, msgIdx) => {
            const isLastAgent = msg.role === "agent" && msgIdx === messages.length - 1;
            const showPipelineForThis = isLastAgent && activeEvents.length > 0;

            return (
              <div key={msg.id}>
                <div className={cn(
                  "flex gap-4 max-w-4xl mx-auto w-full",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}>
                  {msg.role === "agent" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center border border-primary/20 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[85%] space-y-3",
                    msg.role === "user" ? "" : ""
                  )}>
                    {showPipelineForThis && (
                      <AgentPipelineStream events={activeEvents} isStreaming={isStreaming} />
                    )}

                    {msg.role === "user" ? (
                      <div className="rounded-2xl px-5 py-4 bg-primary text-primary-foreground shadow-sm">
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    ) : (
                      <>
                        {msg.content && (
                          <div className="rounded-2xl px-5 py-4 bg-card border border-border">
                            <div className="prose-agent text-sm">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center mt-1 border border-border">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-card border-t border-border">
          <div className="max-w-4xl mx-auto w-full">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isStreaming ? "Agent is responding..." : "Message Example Agent..."}
                disabled={isStreaming}
                className="w-full bg-background border border-border rounded-xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 disabled:opacity-50 transition-all"
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStream}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
            <div className="text-center mt-2">
              <span className="text-[10px] text-muted-foreground">AI can make mistakes. Verify critical data.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-72 flex-shrink-0 bg-card flex flex-col h-full overflow-hidden border-l border-border">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Context</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <CollapsibleSection
            title="Active Skills"
            icon={Play}
            iconColor="text-primary"
            count={ALL_SKILLS.length}
            initialCount={4}
            items={skillItems}
          />

          <CollapsibleSection
            title="Data Files"
            icon={FolderOpen}
            iconColor="text-accent"
            count={ALL_DATA_FILES.length}
            initialCount={4}
            items={dataFileItems}
          />

          <CollapsibleSection
            title="Compliance Guardrails"
            icon={AlertCircle}
            iconColor="text-warning"
            count={COMPLIANCE_RULES.length}
            initialCount={3}
            items={complianceItems}
          />
        </div>
      </div>
    </div>
  );
}
