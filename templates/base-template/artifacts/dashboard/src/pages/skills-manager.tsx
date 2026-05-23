import { useState, useEffect } from "react";
import { Wrench, Plus, Search, FileCode2, Terminal, X, Clock, Shield, BarChart3, FileSearch, TrendingUp, DollarSign, Building2, Landmark, Scale, Globe, Lock, Briefcase, Users, ArrowLeftRight, CalendarCheck, GitCompareArrows, Droplets, FileText, Database, FileOutput, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useListAgentSkills } from "@workspace/api-client-react";
import { ProviderIcon, skillModels } from "@/components/provider-icons";

interface SkillItem {
  name: string;
  description: string;
  status: string;
  lastUsed?: string;
  steps?: string[];
  inputs?: string[];
  outputs?: string[];
}

interface SkillDetail {
  name: string;
  description: string;
  content: string;
  scripts: { name: string; content: string }[];
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const skillIcons: Record<string, typeof Wrench> = {
  "example-skill": FileCode2,
  "data-validation": Shield,
  "record-matching": GitCompareArrows,
  "anomaly-detection": FileSearch,
  "report-generation": BarChart3,
  "policy-check": Shield,
  "summarization": FileText,
  "classification": ListOrdered,
  "entity-extraction": FileSearch,
  "data-enrichment": Database,
  "trend-analysis": TrendingUp,
  "deduplication": ArrowLeftRight,
  "research": Globe,
  "quality-scoring": BarChart3,
  "translation": Globe,
  "redaction": Lock,
  "routing": ArrowLeftRight,
  "lookup": FileSearch,
  "cross-check": GitCompareArrows,
  "notification": CalendarCheck,
  "risk-scoring": Scale,
};

export default function SkillsManager() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [skillDetail, setSkillDetail] = useState<SkillDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: skills } = useListAgentSkills();

  useEffect(() => {
    if (!selectedSkill) return;
    const controller = new AbortController();
    setLoadingDetail(true);
    setSkillDetail(null);
    fetch(`/api/agent/skills/${selectedSkill}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => { if (!controller.signal.aborted) { setSkillDetail(data); setLoadingDetail(false); } })
      .catch(() => { if (!controller.signal.aborted) setLoadingDetail(false); });
    return () => controller.abort();
  }, [selectedSkill]);

  const skillList = ((skills || []) as SkillItem[]).filter(s =>
    !searchQuery || s.name.includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skills Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure and manage the agent's skill library — {skillList.length} skills available</p>
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Skill
        </button>
      </div>

      <div className="px-8 py-3 border-b border-border">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skillList.map((skill) => {
            const Icon = skillIcons[skill.name] || FileCode2;
            const modelInfo = skillModels[skill.name] || { provider: "anthropic" as const, model: "Claude Sonnet 4.6" };
            return (
              <div
                key={skill.name}
                onClick={() => setSelectedSkill(skill.name)}
                className="bg-card rounded-xl p-5 border border-border hover:border-primary/30 hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col h-full group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted border border-border">
                    <Icon className="w-4.5 h-4.5 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ProviderIcon provider={modelInfo.provider} className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-medium text-muted-foreground">{modelInfo.model}</span>
                  </div>
                </div>

                <h3 className="font-mono font-bold text-foreground text-sm mb-1.5">{skill.name}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-3 flex-1">{skill.description}</p>

                {skill.steps && skill.steps.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-1.5">
                      <ListOrdered className="w-3 h-3 text-primary" />
                      <span className="text-[9px] font-semibold text-primary uppercase tracking-wide">Steps</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skill.steps.slice(0, 4).map((step, i) => (
                        <span key={i} className="text-[9px] bg-primary/5 text-primary/80 px-1.5 py-0.5 rounded font-medium">
                          {i + 1}. {step.length > 25 ? step.substring(0, 25) + "…" : step}
                        </span>
                      ))}
                      {skill.steps.length > 4 && (
                        <span className="text-[9px] text-muted-foreground px-1 py-0.5">+{skill.steps.length - 4} more</span>
                      )}
                    </div>
                  </div>
                )}

                {skill.inputs && skill.inputs.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Database className="w-3 h-3 text-blue-500" />
                      <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-wide">Inputs</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skill.inputs.slice(0, 3).map((input, i) => (
                        <span key={i} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">
                          {input.split("/").pop()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {skill.outputs && skill.outputs.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1 mb-1">
                      <FileOutput className="w-3 h-3 text-emerald-500" />
                      <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wide">Outputs</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skill.outputs.slice(0, 2).map((output, i) => (
                        <span key={i} className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
                          {output.length > 30 ? output.substring(0, 30) + "…" : output}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-2 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {skill.lastUsed ? timeAgo(skill.lastUsed) : "Never"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedSkill && (
        <>
          <div className="fixed inset-0 bg-foreground/10 z-40" onClick={() => { setSelectedSkill(null); setSkillDetail(null); }} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-card border-l border-border shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Terminal className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-mono font-bold text-lg text-foreground">{selectedSkill}</h2>
                  <p className="text-xs text-muted-foreground">Skill Definition</p>
                </div>
              </div>
              <button onClick={() => { setSelectedSkill(null); setSkillDetail(null); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetail ? (
                <div className="text-muted-foreground text-center py-8">Loading...</div>
              ) : skillDetail ? (
                <div className="space-y-6">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{skillDetail.content}</ReactMarkdown>
                  </div>
                  {skillDetail.scripts.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-primary" />Scripts ({skillDetail.scripts.length})
                      </h3>
                      {skillDetail.scripts.map(script => (
                        <div key={script.name} className="border border-border rounded-xl overflow-hidden">
                          <div className="bg-muted px-4 py-2 text-xs font-mono text-foreground border-b border-border flex items-center gap-2">
                            <FileCode2 className="w-3.5 h-3.5 text-primary" />{script.name}
                          </div>
                          <SyntaxHighlighter language="python" style={oneLight} customStyle={{ margin: 0, padding: '1rem', fontSize: '12px' }} showLineNumbers>
                            {script.content}
                          </SyntaxHighlighter>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
