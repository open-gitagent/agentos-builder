import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, Sparkles, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStickToBottom } from "@/lib/use-stick-to-bottom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MetricDef {
  label: string;
  value: string;
  status: "good" | "warning" | "critical";
}

interface ParsedSection {
  id: string;
  title: string;
  step: string;
  status: "healthy" | "warning" | "critical";
  metrics: MetricDef[];
  details: string;
  isComplete: boolean;
}

interface AiConclusionProps {
  journey: string;
  resultsSummary?: string;
  isVisible?: boolean;
  uploadedFiles?: { name: string; content: string }[];
  files?: { name: string; content: string }[];
  onComplete?: () => void;
  sectionIcons?: Record<string, React.ComponentType<{ className?: string }>>;
}

function parseSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const parts = text.split("[SECTION]\n");

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const contentSplit = part.split("\n[CONTENT]\n");
    if (contentSplit.length < 2) {
      const altSplit = part.split("[CONTENT]\n");
      if (altSplit.length < 2) continue;
      contentSplit[0] = altSplit[0].trim();
      contentSplit[1] = altSplit.slice(1).join("[CONTENT]\n");
    }

    const headerLine = contentSplit[0].trim();
    const rest = contentSplit.slice(1).join("\n[CONTENT]\n");
    const endSplit = rest.split("\n[/SECTION]");
    const body = endSplit[0];
    const isComplete = endSplit.length > 1;

    try {
      const header = JSON.parse(headerLine);
      sections.push({
        id: header.id || `section-${i}`,
        title: header.title || `Section ${i}`,
        step: header.step || "",
        status: header.status || "healthy",
        metrics: (header.metrics || []).map((m: any) => ({
          label: m.label || "",
          value: m.value || "",
          status: m.status || "good",
        })),
        details: body.trim(),
        isComplete,
      });
    } catch {
      const jsonMatch = part.match(/\{[\s\S]*?\}\s*\n/);
      if (jsonMatch) {
        try {
          const header = JSON.parse(jsonMatch[0].trim());
          const afterJson = part.slice(part.indexOf(jsonMatch[0]) + jsonMatch[0].length);
          const contentStart = afterJson.indexOf("[CONTENT]");
          if (contentStart >= 0) {
            const bodyStart = afterJson.slice(contentStart + "[CONTENT]".length).replace(/^\n/, "");
            const endIdx = bodyStart.indexOf("\n[/SECTION]");
            const bodyText = endIdx >= 0 ? bodyStart.slice(0, endIdx) : bodyStart;
            sections.push({
              id: header.id || `section-${i}`,
              title: header.title || `Section ${i}`,
              step: header.step || "",
              status: header.status || "healthy",
              metrics: (header.metrics || []).map((m: any) => ({
                label: m.label || "",
                value: m.value || "",
                status: m.status || "good",
              })),
              details: bodyText.trim(),
              isComplete: endIdx >= 0,
            });
          }
        } catch {}
      }
    }
  }
  return sections;
}

function MetricCard({ label, value, status }: MetricDef) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide truncate">{label}</span>
      <span className={cn(
        "text-xs font-semibold font-mono leading-tight break-words",
        status === "good" ? "text-foreground" :
        status === "warning" ? "text-amber-600" :
        "text-destructive"
      )}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: "healthy" | "warning" | "critical" }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
      status === "healthy" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
      status === "warning" ? "bg-amber-50 text-amber-700 border border-amber-200" :
      "bg-red-50 text-red-700 border border-red-200"
    )}>
      {status === "healthy" ? <CheckCircle2 className="w-3 h-3" /> :
       status === "warning" ? <AlertTriangle className="w-3 h-3" /> :
       <AlertCircle className="w-3 h-3" />}
      {status}
    </span>
  );
}

function SectionCard({
  section,
  icon: Icon,
  isStreaming,
  delay,
}: {
  section: ParsedSection;
  icon?: React.ComponentType<{ className?: string }>;
  isStreaming: boolean;
  delay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = Icon || FileText;

  useEffect(() => {
    if (isStreaming && !section.isComplete) {
      setExpanded(true);
    }
  }, [isStreaming, section.isComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: "easeOut" }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div
        className="px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg flex-shrink-0 mt-0.5",
            section.status === "warning" ? "bg-amber-50 text-amber-600" :
            section.status === "critical" ? "bg-red-50 text-red-600" :
            "bg-emerald-50 text-emerald-600"
          )}>
            <IconComponent className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <StatusBadge status={section.status} />
              {isStreaming && !section.isComplete && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  analyzing
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{section.step}</p>

            {section.metrics.length > 0 && (
              <div className={cn(
                "grid gap-x-4 gap-y-2 mt-3",
                section.metrics.length <= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-6"
              )}>
                {section.metrics.map(m => (
                  <MetricCard key={m.label} {...m} />
                ))}
              </div>
            )}
          </div>

          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-1">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && section.details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-0 border-t border-border/50">
              <div className="prose-agent text-xs mt-3 [&_table]:text-[10px] [&_th]:text-[10px] [&_td]:text-[10px] [&_th]:px-2 [&_td]:px-2 [&_th]:py-1.5 [&_td]:py-1.5 [&_table]:w-full [&_tr]:border-b [&_tr]:border-border/30 [&_p]:text-muted-foreground [&_p]:mb-2 [&_strong]:text-foreground [&_ul]:space-y-1 [&_ol]:space-y-1 [&_li]:text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.details}</ReactMarkdown>
                {isStreaming && !section.isComplete && (
                  <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5 rounded-sm" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AiConclusion({ journey, resultsSummary, isVisible, uploadedFiles, files, onComplete, sectionIcons }: AiConclusionProps) {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const resolvedFiles = files || uploadedFiles || [];
  const resolvedVisible = isVisible !== undefined ? isVisible : true;

  const sections = useMemo(() => parseSections(content), [content]);
  const streamBottomRef = useRef<HTMLDivElement>(null);

  useStickToBottom({ endRef: streamBottomRef, deps: [content], enabled: isStreaming });

  const handleStreamEnd = useCallback(() => {
    setIsStreaming(false);
    onCompleteRef.current?.();
  }, []);

  const startAnalysis = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setContent("");
    setError(null);
    setIsStreaming(true);
    setHasStarted(true);

    try {
      const response = await fetch("/api/journey/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ journey, resultsSummary: resultsSummary || "", uploadedFiles: resolvedFiles }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Analysis request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) {
              handleStreamEnd();
              return;
            }
            if (data.error) {
              setError(data.error);
              handleStreamEnd();
              return;
            }
            if (data.content) {
              setContent(prev => prev + data.content);
            }
          } catch {}
        }
      }
      handleStreamEnd();
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Analysis failed");
      handleStreamEnd();
    }
  }, [journey, resultsSummary, resolvedFiles, handleStreamEnd]);

  useEffect(() => {
    if (!resolvedVisible || hasStarted) return;
    const timer = setTimeout(startAnalysis, 800);
    return () => clearTimeout(timer);
  }, [resolvedVisible, hasStarted, startAnalysis]);

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  if (!resolvedVisible) return null;

  const fileCount = uploadedFiles?.length || 0;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-card rounded-xl border border-primary/20 overflow-hidden shadow-sm"
      >
        <div className="px-5 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Agent Analysis</h3>
                <p className="text-[10px] text-muted-foreground">
                  {isStreaming
                    ? fileCount > 0
                      ? `Agent is analysing ${fileCount} document${fileCount > 1 ? "s" : ""}...`
                      : "Agent is analysing your results..."
                    : error
                      ? "Analysis encountered an issue"
                      : sections.length > 0
                        ? `${sections.length} section${sections.length > 1 ? "s" : ""} generated`
                        : "Ready"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isStreaming && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
                  <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  <span className="text-[10px] font-medium text-primary">Streaming</span>
                </div>
              )}
              {!isStreaming && hasStarted && (
                <button
                  onClick={() => { setHasStarted(false); setTimeout(startAnalysis, 100); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="px-5 py-4">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Could not complete analysis</p>
                <p className="text-xs mt-1">{error}</p>
                <button
                  onClick={() => { setHasStarted(false); setTimeout(startAnalysis, 100); }}
                  className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {!error && sections.length === 0 && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
              <Bot className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs">Initializing agent analysis...</span>
            </div>
          </div>
        )}
      </motion.div>

      {sections.map((section, idx) => (
        <SectionCard
          key={section.id}
          section={section}
          icon={sectionIcons?.[section.id]}
          isStreaming={isStreaming}
          delay={idx}
        />
      ))}
      <div ref={streamBottomRef} />
    </div>
  );
}
