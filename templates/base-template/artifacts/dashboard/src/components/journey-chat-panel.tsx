import { useState, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";
import { useStickToBottom } from "@/lib/use-stick-to-bottom";
import { subscribeJourneyRail, type JourneyRailToolEvent } from "@/lib/journey-rail-bus";
import {
  Send,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  FileText,
  PenLine,
  Brain,
  Wrench,
  BookOpen,
  Loader2,
} from "lucide-react";

interface ChatNudge {
  label: string;
  prompt: string;
}

type ToolEntry = {
  icon: typeof Wrench;
  label: string;
  detail: string;
  status: "running" | "done" | "error";
};

type ChatItem =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string; streaming?: boolean }
  | { kind: "tools"; tools: ToolEntry[] };

interface JourneyChatPanelProps {
  journeyName: string;
  nudges: ChatNudge[];
}

const EVENT_ICONS: Record<string, typeof Wrench> = {
  file_fetch: FileText,
  file_write: PenLine,
  memory_update: Brain,
  skill_loading: BookOpen,
  tool_use: Wrench,
};

const RAIL_WIDTH_KEY = "journey-rail-width";
const RAIL_WIDTH_MIN = 300;
const RAIL_WIDTH_MAX = 720;
const RAIL_WIDTH_DEFAULT = 360;

function readStoredWidth(): number {
  if (typeof window === "undefined") return RAIL_WIDTH_DEFAULT;
  const raw = window.localStorage.getItem(RAIL_WIDTH_KEY);
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return RAIL_WIDTH_DEFAULT;
  return Math.max(RAIL_WIDTH_MIN, Math.min(RAIL_WIDTH_MAX, n));
}

export function JourneyChatPanel({ journeyName, nudges }: JourneyChatPanelProps) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [width, setWidth] = useState<number>(readStoredWidth);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(`journey-${journeyName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`);

  useStickToBottom({ containerRef: scrollRef, deps: [items, isStreaming] });

  // Subscribe to in-page agent activity (e.g. Multi-Filing Studio taxonomy
  // refresh + return generation) so live tool-call telemetry surfaces in this
  // rail alongside chat-driven tool calls — single source of truth for the
  // user's "what is the agent doing right now" view.
  useEffect(() => {
    const ICONS: Record<JourneyRailToolEvent["kind"], typeof Wrench> = {
      file_fetch: FileText,
      file_write: PenLine,
      memory_update: Brain,
      skill_loading: BookOpen,
      tool_use: Wrench,
      tool_result: CheckCircle2,
    };
    const unsubscribe = subscribeJourneyRail((evt) => {
      setItems(prev => {
        const out = [...prev];
        const last = out[out.length - 1];
        const entry: ToolEntry = {
          icon: ICONS[evt.kind] ?? Wrench,
          label: evt.label || evt.source,
          detail: evt.detail.slice(0, 140),
          status: evt.status,
        };
        // tool_result completes the most-recent matching running tool in the
        // current tools group rather than appending a new entry.
        if (evt.kind === "tool_result" && last && last.kind === "tools") {
          const tools = [...last.tools];
          for (let i = tools.length - 1; i >= 0; i--) {
            if (tools[i].label === evt.label && tools[i].status === "running") {
              tools[i] = { ...tools[i], status: evt.status, detail: entry.detail || tools[i].detail };
              out[out.length - 1] = { ...last, tools };
              return out;
            }
          }
        }
        if (last && last.kind === "tools") {
          out[out.length - 1] = { ...last, tools: [...last.tools, entry] };
          return out;
        }
        return [...out, { kind: "tools", tools: [entry] }];
      });
    });
    return unsubscribe;
  }, []);

  // Sync width to a CSS variable so the Layout can reserve the matching gutter.
  useEffect(() => {
    document.documentElement.style.setProperty("--journey-rail-width", `${width}px`);
    return () => {
      // On unmount (navigating away from a journey), clear so non-journey pages aren't padded.
      document.documentElement.style.removeProperty("--journey-rail-width");
    };
  }, [width]);

  // Persist width
  useEffect(() => {
    try { window.localStorage.setItem(RAIL_WIDTH_KEY, String(width)); } catch {}
  }, [width]);

  // Drag-to-resize from the left edge
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    const onMove = (ev: MouseEvent) => {
      const next = startWidth + (startX - ev.clientX);
      setWidth(Math.max(RAIL_WIDTH_MIN, Math.min(RAIL_WIDTH_MAX, next)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userText = text.trim();
    const apiHistory = items
      .filter(i => i.kind === "user" || (i.kind === "assistant" && i.text))
      .map(i => ({
        role: i.kind === "user" ? "user" : "assistant",
        content: i.kind === "user" ? i.text : (i as Extract<ChatItem, { kind: "assistant" }>).text,
      }));

    apiHistory.push({
      role: "user",
      content: `[Context: User is on the ${journeyName} journey page] ${userText}`,
    });

    setItems(prev => [...prev, { kind: "user", text: userText }]);
    setInput("");
    setIsStreaming(true);

    let assistantOpen = false;
    let toolsOpen = false;

    const ensureAssistant = () => {
      if (!assistantOpen) {
        setItems(prev => [...prev, { kind: "assistant", text: "", streaming: true }]);
        assistantOpen = true;
        toolsOpen = false;
      }
    };

    const appendAssistant = (chunk: string) => {
      ensureAssistant();
      setItems(prev => {
        const out = [...prev];
        const last = out[out.length - 1];
        if (last && last.kind === "assistant") {
          out[out.length - 1] = { ...last, text: last.text + chunk, streaming: true };
        }
        return out;
      });
    };

    const pushTool = (entry: ToolEntry) => {
      assistantOpen = false;
      setItems(prev => {
        const out = [...prev];
        const last = out[out.length - 1];
        if (toolsOpen && last && last.kind === "tools") {
          out[out.length - 1] = { ...last, tools: [...last.tools, entry] };
          return out;
        }
        return [...out, { kind: "tools", tools: [entry] }];
      });
      toolsOpen = true;
    };

    const completeLastTool = () => {
      setItems(prev => {
        const out = [...prev];
        const last = out[out.length - 1];
        if (last && last.kind === "tools" && last.tools.length) {
          const tools = [...last.tools];
          const idx = tools.length - 1;
          if (tools[idx].status === "running") tools[idx] = { ...tools[idx], status: "done" };
          out[out.length - 1] = { ...last, tools };
        }
        return out;
      });
    };

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: apiHistory,
          sessionId: sessionIdRef.current,
        }),
      });

      if (!response.ok || !response.body) {
        setItems(prev => [...prev, { kind: "assistant", text: "I'm unable to connect right now. Please try again." }]);
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          let evt = "message";
          let dataStr = "";
          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) evt = line.slice(6).trim();
            else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
          }
          if (!dataStr) continue;
          let data: any;
          try { data = JSON.parse(dataStr); } catch { continue; }

          if (evt === "delta" && typeof data.text === "string") {
            appendAssistant(data.text);
          } else if (EVENT_ICONS[evt]) {
            const label = (data.tool || data.skill || evt).toString();
            const detail = (data.action || data.file || "").toString().slice(0, 120) || "running…";
            pushTool({ icon: EVENT_ICONS[evt], label, detail, status: "running" });
          } else if (evt === "tool_result") {
            completeLastTool();
          } else if (evt === "system_read") {
            const detail = (data.action || data.file || "").toString().slice(0, 120);
            pushTool({ icon: BookOpen, label: "system", detail, status: "done" });
          } else if (evt === "error" && data.error) {
            setItems(prev => [...prev, { kind: "assistant", text: `Error: ${data.error}` }]);
          } else if (evt === "done") {
            // mark any open tool as done
            completeLastTool();
          }
        }
      }
    } catch {
      setItems(prev => [...prev, { kind: "assistant", text: "Connection error. Please try again." }]);
    }

    // Finalize: clear streaming flag on the last assistant bubble
    setItems(prev => {
      const out = [...prev];
      const last = out[out.length - 1];
      if (last && last.kind === "assistant") {
        out[out.length - 1] = { ...last, streaming: false };
      }
      return out;
    });
    setIsStreaming(false);
  };

  return (
    <aside
      className="fixed right-0 top-12 bottom-0 bg-card border-l border-border flex flex-col z-10"
      style={{ width: `${width}px` }}
      data-testid="journey-assistant-rail"
    >
      <div
        onMouseDown={startResize}
        onDoubleClick={() => setWidth(RAIL_WIDTH_DEFAULT)}
        title="Drag to resize · double-click to reset"
        className="absolute left-0 top-0 bottom-0 w-1.5 -ml-0.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-20"
        role="separator"
        aria-label="Resize assistant panel"
        aria-orientation="vertical"
      />
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-primary/5">
        <Bot className="w-4 h-4 text-primary" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{journeyName} Assistant</div>
          <div className="text-[10px] text-muted-foreground">Always-on · scoped to this journey</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {items.length === 0 && (
          <div className="space-y-3">
            <div className="text-center py-4">
              <Bot className="w-8 h-8 text-primary/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Ask me anything about {journeyName}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Suggested Questions
              </p>
              {nudges.map((nudge, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(nudge.prompt)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/20 transition-colors text-xs text-foreground leading-relaxed"
                >
                  {nudge.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {items.map((item, i) => {
          if (item.kind === "user") {
            return (
              <div key={i} className="flex flex-row-reverse gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed bg-primary text-white">
                  {item.text}
                </div>
              </div>
            );
          }
          if (item.kind === "tools") {
            return (
              <div key={i} className="flex gap-2">
                <Bot className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div className="max-w-[88%] flex-1 rounded-lg border border-border bg-muted/30 overflow-hidden">
                  <div className="px-2.5 py-1 bg-muted/50 border-b border-border text-[9px] uppercase font-bold tracking-widest text-muted-foreground/70">
                    Calling tools
                  </div>
                  <div className="divide-y divide-border">
                    {item.tools.map((t, k) => {
                      const Icon = t.icon;
                      return (
                        <div key={k} className="flex items-center gap-2 px-2.5 py-1.5">
                          <Icon className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="font-mono text-[10px] text-foreground font-semibold truncate max-w-[90px]">{t.label}</span>
                          <span className="text-[10px] text-muted-foreground truncate flex-1">{t.detail}</span>
                          {t.status === "running" ? (
                            <Loader2 className="w-3 h-3 text-primary animate-spin flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-[hsl(155,35%,32%)] flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }
          // assistant
          return (
            <div key={i} className="flex gap-2">
              <Bot className="w-3.5 h-3.5 text-primary mt-1 flex-shrink-0" />
              <div className="max-w-[90%] rounded-lg px-2.5 py-1.5 text-[11px] leading-snug bg-muted text-foreground">
                {item.text ? (
                  <div className="prose prose-xs prose-stone max-w-none text-[11px] leading-snug prose-p:my-1 prose-p:text-[11px] prose-p:leading-snug prose-headings:my-1.5 prose-headings:font-serif prose-h1:text-[13px] prose-h2:text-[12px] prose-h3:text-[11.5px] prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-li:text-[11px] prose-pre:my-1.5 prose-pre:text-[10px] prose-code:text-[10px] prose-code:bg-card prose-code:px-1 prose-code:py-px prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-strong:text-foreground prose-a:text-primary">
                    <Streamdown>{item.text}</Streamdown>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "120ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "240ms" }} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask a question..."
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isStreaming}
            data-testid="input-journey-chat"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors"
            data-testid="button-journey-chat-send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
