import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import {
  Network,
  FileText,
  Search,
  Sparkles,
  RefreshCw,
  Activity,
  Send,
  Loader2,
  X,
  Eye,
  PenLine,
  FilePlus,
  BookOpen,
  Database,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface WikiNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  type: "entity" | "concept" | "synthesis";
  category: string;
  inbound: number;
  size: number;
}

interface WikiEdge {
  source: string | WikiNode;
  target: string | WikiNode;
}

interface WikiPage {
  slug: string;
  title: string;
  type: string;
  category: string;
  updated: string;
  sources: string[];
  tags: string[];
  body: string;
  filePath: string;
}

interface ActivityEvent {
  id: string;
  ts: number;
  kind: "read" | "write_update" | "write_new" | "system" | "preview";
  file?: string;
  title?: string;
  preview?: string;
}

const TYPE_COLORS: Record<string, string> = {
  entity: "hsl(25, 55%, 32%)",
  concept: "hsl(15, 38%, 48%)",
  synthesis: "hsl(38, 50%, 45%)",
};

const HIGHLIGHT_UPDATED = "hsl(22, 70%, 45%)";
const HIGHLIGHT_UPDATED_STROKE = "hsl(20, 75%, 28%)";
const HIGHLIGHT_NEW = "hsl(95, 28%, 38%)";
const HIGHLIGHT_NEW_STROKE = "hsl(95, 40%, 22%)";

const SUGGESTED_QUERIES = [
  "How healthy is our throughput vs the configured targets?",
  "Explain the latest run's quality overlay",
  "Which records are still unmatched?",
  "Summarise our top data quality risks",
];

export default function LLMWiki() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<WikiNode, WikiEdge> | null>(null);
  const referencedSlugsRef = useRef<Set<string>>(new Set());
  const writeCountRef = useRef<number>(0);

  const [graph, setGraph] = useState<{ nodes: WikiNode[]; edges: WikiEdge[] }>({ nodes: [], edges: [] });
  const [stats, setStats] = useState({ total: 0, entities: 0, concepts: 0, synthesis: 0, totalLinks: 0 });
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [referencedSlugs, setReferencedSlugs] = useState<Set<string>>(new Set());
  const [newSlugs, setNewSlugs] = useState<Set<string>>(new Set());
  const [updatedSlugs, setUpdatedSlugs] = useState<Set<string>>(new Set());

  const [question, setQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const loadGraph = useCallback(async () => {
    try {
      const [graphRes, pagesRes] = await Promise.all([
        fetch(`${import.meta.env.BASE_URL}api/wiki/graph`),
        fetch(`${import.meta.env.BASE_URL}api/wiki/pages`),
      ]);
      if (graphRes.ok) {
        const g = await graphRes.json();
        setGraph(g);
      }
      if (pagesRes.ok) {
        const p = await pagesRes.json();
        setStats(p.stats);
      }
    } catch (e) {
      console.error("Failed to load wiki graph", e);
    }
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graph.nodes.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });
    svg.call(zoom);

    const nodes: WikiNode[] = graph.nodes.map(n => ({ ...n }));
    const edges: WikiEdge[] = graph.edges.map(e => ({ ...e }));

    const NODE_SCALE = 0.6;
    const nodeRadius = (d: any) => Math.max(4, d.size * NODE_SCALE);
    const simulation = d3
      .forceSimulation<WikiNode>(nodes)
      .force("link", d3.forceLink<WikiNode, WikiEdge>(edges).id((d: any) => d.id).distance(80).strength(0.6))
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<WikiNode>().radius((d: any) => nodeRadius(d) + 4));
    simulationRef.current = simulation;

    const link = g.append("g")
      .attr("stroke", "hsl(25, 30%, 55%)")
      .attr("stroke-opacity", 0.35)
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke-width", 1);

    const node = g.append("g")
      .selectAll<SVGGElement, WikiNode>("g")
      .data(nodes, (d: any) => d.id)
      .join("g")
      .attr("data-slug", (d: any) => d.id)
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, WikiNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on("click", async (_event, d: any) => {
        try {
          const r = await fetch(`${import.meta.env.BASE_URL}api/wiki/page/${d.id}`);
          if (r.ok) {
            const page = await r.json();
            setSelectedPage(page);
          }
        } catch {}
      });

    node.append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d: any) => TYPE_COLORS[d.type] || "hsl(25, 40%, 50%)")
      .attr("stroke", "hsl(36, 33%, 94%)")
      .attr("stroke-width", 1.5);

    node.append("text")
      .text((d: any) => d.title)
      .attr("x", 0)
      .attr("y", (d: any) => nodeRadius(d) + 9)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("font-family", "DM Sans, sans-serif")
      .attr("fill", "hsl(25, 25%, 25%)")
      .attr("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graph]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    svg.selectAll<SVGGElement, WikiNode>("g[data-slug]").each(function (d: any) {
      const grp = d3.select(this);
      const ref = referencedSlugs.has(d.id);
      const isNew = newSlugs.has(d.id);
      const isUpdated = updatedSlugs.has(d.id);
      const anyActivity = referencedSlugs.size + newSlugs.size + updatedSlugs.size > 0;

      const baseColor = TYPE_COLORS[d.type] || "hsl(25, 40%, 50%)";
      let fill = baseColor;
      let stroke = "hsl(36, 33%, 94%)";
      let strokeW = 2;
      let opacity = 1;

      if (anyActivity) {
        if (isNew) {
          fill = HIGHLIGHT_NEW;
          stroke = HIGHLIGHT_NEW_STROKE;
          strokeW = 3;
        } else if (isUpdated) {
          fill = HIGHLIGHT_UPDATED;
          stroke = HIGHLIGHT_UPDATED_STROKE;
          strokeW = 3;
        } else if (ref) {
          stroke = "hsl(25, 62%, 25%)";
          strokeW = 3;
        } else {
          opacity = 0.3;
        }
      }

      grp.select("circle")
        .transition().duration(220)
        .attr("fill", fill)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeW)
        .attr("opacity", opacity);
      grp.select("text")
        .transition().duration(220)
        .attr("opacity", opacity);
    });
  }, [referencedSlugs, newSlugs, updatedSlugs]);

  const pushActivity = useCallback((evt: Omit<ActivityEvent, "id" | "ts">) => {
    setActivity(prev => [...prev, { ...evt, id: `${Date.now()}-${prev.length}`, ts: Date.now() }]);
  }, []);

  const fileToSlug = (file: string): string | null => {
    const m = file.match(/wiki\/(?:entities|concepts|synthesis)\/([a-z0-9-]+)\.md$/);
    return m ? m[1] : null;
  };

  const runStream = useCallback(async (mode: "query" | "lint", q: string) => {
    if (isStreaming) return;
    setIsStreaming(true);
    setActivity([]);
    setStreamedAnswer("");
    setCurrentQuestion(mode === "lint" ? "Health-check the wiki" : q);
    referencedSlugsRef.current = new Set();
    writeCountRef.current = 0;
    setReferencedSlugs(new Set());
    setNewSlugs(new Set());
    setUpdatedSlugs(new Set());

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/wiki/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, mode }),
        signal: ctrl.signal,
      });
      if (!res.body) throw new Error("no stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const knownSlugs = new Set(graph.nodes.map(n => n.id));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const lines = block.split("\n");
          let event = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue;
          let payload: any = {};
          try { payload = JSON.parse(data); } catch { continue; }

          if (event === "delta" && payload.text) {
            setStreamedAnswer(prev => prev + payload.text);
          } else if (event === "wiki_read") {
            const slug = fileToSlug(payload.file || "");
            if (slug && knownSlugs.has(slug)) {
              referencedSlugsRef.current.add(slug);
              setReferencedSlugs(new Set(referencedSlugsRef.current));
              const node = graph.nodes.find(n => n.id === slug);
              pushActivity({
                kind: "read",
                file: payload.file,
                title: node?.title || slug,
                preview: `Retrieved ${node?.type || "page"} from wiki`,
              });
            } else if (payload.file) {
              pushActivity({
                kind: "read",
                file: payload.file,
                title: payload.file.split("/").pop() || payload.file,
                preview: "Retrieved supporting file",
              });
            }
          } else if (event === "wiki_write") {
            const slug = fileToSlug(payload.file || "");
            if (slug) {
              writeCountRef.current++;
              if (knownSlugs.has(slug)) {
                setUpdatedSlugs(prev => new Set(prev).add(slug));
                pushActivity({
                  kind: "write_update",
                  file: payload.file,
                  title: slug,
                  preview: "Updated existing wiki page (merged new info, refreshed metadata)",
                });
              } else {
                setNewSlugs(prev => new Set(prev).add(slug));
                pushActivity({
                  kind: "write_new",
                  file: payload.file,
                  title: slug,
                  preview: "Created NEW wiki page with frontmatter, content, cross-links",
                });
              }
            }
          } else if (event === "tool_result" && payload.preview) {
            const last = activity[activity.length - 1];
            if (last && last.kind === "read") {
              setActivity(prev => prev.map((a, i) => i === prev.length - 1 ? { ...a, preview: payload.preview.slice(0, 180) } : a));
            }
          } else if (event === "system_read" && payload.action) {
            pushActivity({ kind: "system", title: payload.action, file: payload.file });
          } else if (event === "error") {
            pushActivity({ kind: "system", title: `Error: ${payload.error}` });
          } else if (event === "done") {
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        pushActivity({ kind: "system", title: `Error: ${e.message}` });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      // Refresh graph in case new pages were created
      if (writeCountRef.current > 0) {
        setTimeout(loadGraph, 500);
      }
    }
  }, [isStreaming, graph.nodes, loadGraph, pushActivity]);

  const handleSend = () => {
    const q = question.trim();
    if (!q || isStreaming) return;
    setQuestion("");
    runStream("query", q);
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleClear = () => {
    setActivity([]);
    setStreamedAnswer("");
    setCurrentQuestion("");
    setReferencedSlugs(new Set());
    setNewSlugs(new Set());
    setUpdatedSlugs(new Set());
    referencedSlugsRef.current = new Set();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border px-6 py-4 bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Network className="w-6 h-6 text-primary" />
              LLM Wiki
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Compiled domain knowledge — entities, concepts, and synthesis pages maintained by the agent
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadGraph}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-refresh-graph"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={() => runStream("lint", "Run wiki lint")}
              disabled={isStreaming}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              data-testid="button-lint-wiki"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Health Check
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-0 overflow-hidden">
        {/* LEFT: Graph */}
        <div className="relative border-r border-border bg-card/50 overflow-hidden">
          <div className="absolute top-3 left-3 z-10 bg-card/95 backdrop-blur border border-border rounded-lg px-3 py-2 shadow-sm">
            <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">
              Wiki stats
            </div>
            <div className="text-sm font-semibold text-foreground">
              {stats.total} pages · {stats.totalLinks} links
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS.entity }} />
                <span className="text-muted-foreground">Entity ({stats.entities})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS.concept }} />
                <span className="text-muted-foreground">Concept ({stats.concepts})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS.synthesis }} />
                <span className="text-muted-foreground">Synthesis ({stats.synthesis})</span>
              </div>
            </div>
            {(referencedSlugs.size + newSlugs.size + updatedSlugs.size > 0) && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border text-[10px]">
                {referencedSlugs.size > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full ring-2 ring-primary" />
                    <span className="text-muted-foreground">Referenced ({referencedSlugs.size})</span>
                  </div>
                )}
                {updatedSlugs.size > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: HIGHLIGHT_UPDATED }} />
                    <span className="text-muted-foreground">Updated ({updatedSlugs.size})</span>
                  </div>
                )}
                {newSlugs.size > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: HIGHLIGHT_NEW }} />
                    <span className="text-muted-foreground">New ({newSlugs.size})</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div ref={containerRef} className="w-full h-full">
            <svg ref={svgRef} className="w-full h-full" />
          </div>

          {selectedPage && (
            <div className="absolute top-4 right-4 bottom-4 w-[420px] bg-card border border-border rounded-lg shadow-xl flex flex-col z-20 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded"
                    style={{ background: TYPE_COLORS[selectedPage.type] + "22", color: TYPE_COLORS[selectedPage.type] }}
                  >
                    {selectedPage.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    {selectedPage.filePath}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPage(null)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                  data-testid="button-close-page"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-4 py-3 border-b border-border">
                <h2 className="font-serif text-lg font-bold text-foreground leading-tight">{selectedPage.title}</h2>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                  <span>Updated {selectedPage.updated}</span>
                  <span>·</span>
                  <span>{selectedPage.sources.length} source{selectedPage.sources.length !== 1 ? "s" : ""}</span>
                </div>
                {selectedPage.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedPage.tags.map(t => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 prose prose-sm max-w-none text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedPage.body}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Wiki Agent */}
        <div className="flex flex-col bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm text-foreground leading-tight">Wiki Agent</h2>
                <p className="text-[10px] text-muted-foreground">LLM-powered synthesis across the knowledge graph</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {!currentQuestion && activity.length === 0 && (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Ask a question and the agent will read relevant wiki pages, highlight them on the graph, and stream its synthesis. Substantive answers are filed back to the wiki as new synthesis pages.
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">Try asking</div>
                  {SUGGESTED_QUERIES.map(q => (
                    <button
                      key={q}
                      onClick={() => runStream("query", q)}
                      className="w-full text-left text-xs px-3 py-2 rounded-md border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-foreground"
                      data-testid={`suggested-${q.slice(0, 20)}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentQuestion && (
              <div className="rounded-md bg-primary/8 border border-primary/15 px-3 py-2">
                <div className="text-[9px] uppercase tracking-widest font-bold text-primary mb-1">You asked</div>
                <div className="text-xs text-foreground">{currentQuestion}</div>
              </div>
            )}

            {(activity.length > 0 || isStreaming) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">
                    Agent activity
                  </span>
                  {isStreaming && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                </div>
                <div className="space-y-1.5">
                  {activity.map(evt => (
                    <ActivityRow key={evt.id} evt={evt} />
                  ))}
                  {isStreaming && (
                    <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-muted-foreground">
                      <CircleDot className="w-3 h-3 text-primary animate-pulse" />
                      Synthesising response...
                    </div>
                  )}
                </div>
              </div>
            )}

            {streamedAnswer && (
              <div className="border-t border-border pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">
                    Agent answer
                  </span>
                </div>
                <div className="prose prose-sm max-w-none text-foreground text-[13px] leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="my-1.5">{renderWithWikiLinks(children)}</p>,
                      li: ({ children }) => <li>{renderWithWikiLinks(children)}</li>,
                    }}
                  >
                    {streamedAnswer}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 space-y-2">
            <div className="relative">
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                disabled={isStreaming}
                placeholder="Ask the wiki agent..."
                className="w-full text-sm px-3 py-2 pr-10 rounded-md border border-border bg-background focus:outline-none focus:border-primary/40 disabled:opacity-50"
                data-testid="input-wiki-question"
              />
              {isStreaming ? (
                <button
                  onClick={handleStop}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-destructive hover:bg-destructive/10"
                  data-testid="button-stop"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!question.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded text-primary hover:bg-primary/10 disabled:opacity-30"
                  data-testid="button-send"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                disabled={isStreaming}
                className="flex-1 text-[11px] px-2 py-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
                data-testid="button-clear-chat"
              >
                Clear chat
              </button>
              <button
                onClick={() => runStream("lint", "Run wiki lint")}
                disabled={isStreaming}
                className="flex-1 text-[11px] px-2 py-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
                data-testid="button-lint-from-chat"
              >
                Health check
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ evt }: { evt: ActivityEvent }) {
  let Icon = Eye;
  let iconClass = "text-muted-foreground";
  let label = "Reading";
  let labelBg = "bg-muted/40 text-muted-foreground";

  let iconStyle: React.CSSProperties = {};
  let badgeStyle: React.CSSProperties = {};

  if (evt.kind === "read") {
    Icon = Eye;
    iconClass = "text-primary";
    label = "Reading";
    labelBg = "bg-primary/10 text-primary";
  } else if (evt.kind === "write_update") {
    Icon = PenLine;
    iconClass = "";
    label = "Updating";
    labelBg = "";
    iconStyle = { color: "hsl(28, 65%, 42%)" };
    badgeStyle = { backgroundColor: "hsl(32, 55%, 88%)", color: "hsl(25, 60%, 30%)" };
  } else if (evt.kind === "write_new") {
    Icon = FilePlus;
    iconClass = "";
    label = "Creating";
    labelBg = "";
    iconStyle = { color: "hsl(155, 35%, 32%)" };
    badgeStyle = { backgroundColor: "hsl(140, 25%, 86%)", color: "hsl(155, 45%, 22%)" };
  } else if (evt.kind === "system") {
    Icon = Database;
    iconClass = "text-muted-foreground";
    label = "System";
  }

  return (
    <div className="flex items-start gap-2 px-2.5 py-2 rounded-md border border-border bg-background">
      <Icon className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", iconClass)} style={iconStyle} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn("text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded", labelBg)}
            style={badgeStyle}
          >
            {label}
          </span>
          <span className="text-[12px] font-medium text-foreground truncate">{evt.title}</span>
        </div>
        {evt.file && (
          <div className="text-[9px] text-muted-foreground font-mono truncate mt-0.5">{evt.file}</div>
        )}
        {evt.preview && (
          <div className="text-[10px] text-muted-foreground/80 mt-1 leading-snug line-clamp-2">{evt.preview}</div>
        )}
      </div>
    </div>
  );
}

function renderWithWikiLinks(children: any): any {
  if (typeof children === "string") {
    const parts = children.split(/(\[\[[a-z0-9-]+\]\])/g);
    return parts.map((part, i) => {
      const m = part.match(/^\[\[([a-z0-9-]+)\]\]$/);
      if (m) {
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 text-[11px] rounded bg-primary/10 text-primary border border-primary/20 font-mono"
          >
            <FileText className="w-2.5 h-2.5" />
            {m[1]}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }
  if (Array.isArray(children)) {
    return children.map((c, i) => <span key={i}>{renderWithWikiLinks(c)}</span>);
  }
  return children;
}
