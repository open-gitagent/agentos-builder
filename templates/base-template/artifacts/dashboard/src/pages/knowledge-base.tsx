import { useState, useRef } from "react";
import {
  BookOpen, FolderTree, FileText, FileSpreadsheet, Settings, ChevronRight,
  Search, Database, Upload, Eye, X, Download, Trash2, Plus, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileNode {
  name: string;
  type: "file" | "directory";
  size?: string;
  description?: string;
  children?: FileNode[];
  content?: string;
}

const KNOWLEDGE_TREE: FileNode[] = [
  {
    name: "agent-config",
    type: "directory",
    description: "Core agent configuration and governance",
    children: [
      { name: "agent.yaml", type: "file", size: "2.1 KB", description: "Model settings, temperature, tools", content: "agent:\n  name: example-agent\n  model: claude-sonnet-4.6\n  temperature: 0.2\n  max_tokens: 8192\n  tools:\n    - file_search\n    - file_fetch\n    - code_interpreter\n  skills:\n    - example-skill\n    - data-validation\n    - record-matching\n    - report-generation\n    - policy-check\n    - quality-scoring\n  memory:\n    type: persistent\n    file: memory/MEMORY.md\n  compliance:\n    policy_a: true\n    dual_approval: true\n    audit_trail: true" },
      { name: "SOUL.md", type: "file", size: "4.8 KB", description: "Agent personality and behavioral principles", content: "# SOUL — Example Agent\n\n## Identity\nYou are the Example Agent for the organization.\n\n## Core Principles\n1. **Precision First** — Data requires absolute accuracy. Never approximate.\n2. **Compliance Aware** — All outputs must comply with the Data Privacy, Access Control, and Output Safety policies.\n3. **Transparent Reasoning** — Show your work. Explain methodology before presenting conclusions.\n4. **Conservative Bias** — When uncertain, err on the side of caution.\n5. **Context Sensitive** — Respect differences across workspaces, regions, and teams.\n\n## Communication Style\n- Professional, concise, data-driven\n- Use structured formats (tables, bullet points) for data\n- Always cite data sources and methodologies\n- Flag assumptions and limitations explicitly" },
      { name: "RULES.md", type: "file", size: "3.2 KB", description: "Policy compliance and governance rules", content: "# RULES — Operational Guardrails\n\n## Data Controls\n- NEVER modify source data files\n- All batch updates require dual approval above 1,000 records\n- Quality differences below the 0.90 threshold must be escalated\n- Reference data uses the latest published version\n\n## Data Handling\n- PII must be masked in all outputs\n- Sensitive data cannot leave the secure environment\n- All file operations logged to the audit trail\n\n## Compliance\n- Policy A controls enforced\n- Output safety checks run before every step\n- Access controlled per the least-privilege standard" },
    ]
  },
  {
    name: "journey-data",
    type: "directory",
    description: "Pre-loaded datasets for each journey",
    children: [
      { name: "intake", type: "directory", children: [
        { name: "intake-schedules.csv", type: "file", size: "12 KB", content: "Source,Field,Description,Count,Period,Type\nSource A,F100,Primary records,245000,2026-05,Recurring\nSource A,F200,Reference records,89000,2026-05,Recurring\nSource B,F100,Primary records,1200000,2026-05,Recurring\nSource B,F300,Lookup records,34000,2026-05,Recurring\nSource C,F100,Primary records,567000,2026-05,Recurring" },
        { name: "field-catalog.csv", type: "file", size: "45 KB", content: "Field_Code,Field_Name,Type,Unit,Source,Active\n1000,Identifier,Key,id,ALL,Y\n1100,Category,Attribute,enum,Source C,Y\n1200,Value,Numeric,count,Source B,Y\n1300,Status,Attribute,enum,ALL,Y\n2000,Owner,Attribute,id,Source B,Y\n2100,Region,Attribute,enum,ALL,Y\n3000,Created,Timestamp,iso,Source A,Y\n4000,Score,Numeric,float,Source B,Y\n5000,Notes,Text,string,ALL,Y" },
        { name: "merge-rules.csv", type: "file", size: "28 KB", content: "Pair,Left_Source,Right_Source,Count,Unit,Status\nM-001,Source A,Source B,45000,records,Matched\nM-002,Source B,Source C,12000,records,Matched\nM-003,Source A,Source D,8900,records,Difference\nM-004,Source C,Source E,2300,records,Matched" },
      ]},
      { name: "validation", type: "directory", children: [
        { name: "record-baseline.csv", type: "file", size: "156 KB", content: "Field,Source,In_Count,Out_Count,Net_Count,Period\n1000,Source A,89000,0,89000,2026-05\n1200,Source B,4500000,0,4500000,2026-05\n2000,Source B,0,3800000,-3800000,2026-05\n4000,Source B,0,234000,-234000,2026-05\n5000,Source A,45000,0,45000,2026-05" },
        { name: "source-feed.csv", type: "file", size: "89 KB", content: "Date,Reference,Description,In,Out,Balance,Source\n2026-05-01,REC-001,Opening Batch,0,0,89234,Source A\n2026-05-05,REC-002,Daily Load,12000,0,77234,Source A\n2026-05-10,REC-003,Increment,0,890,78124,Source A\n2026-05-15,REC-004,Batch Update,4500,0,73624,Source A" },
        { name: "queue-detail.csv", type: "file", size: "67 KB", content: "Owner,Record,Count,Date,Due_Date,Status,Batch\nSource A,REC-04812,24500,2026-05-15,2026-05-22,Open,B-4421\nSource B,REC-08834,156200,2026-05-18,2026-05-25,Open,B-4389\nSource C,REC-0331,8900,2026-05-22,2026-05-29,Open,B-4401" },
        { name: "age-buckets.csv", type: "file", size: "34 KB", content: "Owner,Record,Count,Issue_Date,Due_Date,Days_Outstanding,Bucket\nTeam_A,REC-8001,450000,2026-04-15,2026-05-15,16,1-30\nTeam_B,REC-8002,1200000,2026-03-20,2026-04-20,39,31-60\nTeam_C,REC-8003,89000,2026-05-01,2026-05-31,0,Current" },
        { name: "source-balances.csv", type: "file", size: "23 KB", content: "Source_From,Source_To,Count,Type,Matched\nSource A,Source B,45000,Link,Yes\nSource B,Source C,12000,Service,Yes\nSource A,Source D,8900,Lookup,No" },
        { name: "throughput-detail.csv", type: "file", size: "41 KB", content: "Owner,Batch,Submitted,Processed,Pending,Period\nTeam_A,C-001,890000,890000,0,2026-Q2\nTeam_B,C-002,2300000,1800000,500000,2026-Q2\nTeam_C,C-003,450000,150000,300000,2026-Q2" },
      ]},
      { name: "matching", type: "directory", children: [
        { name: "match-keys.csv", type: "file", size: "18 KB", content: "Key,Type,Count,Tier,Window,Fuzzy\nIdentifier,Exact,4200000,1,n/a,No\nName,Fuzzy,890000,1,3d,Yes\nCategory,Exact,450000,2,n/a,No\nValue,Range,340000,2,5%,Yes" },
        { name: "match-breakdown.csv", type: "file", size: "52 KB", content: "Category,Approach,Count,Weight,Weighted\nSource A - Primary,Exact,12000000,0.65,7800000\nSource B - Primary,Exact,4500000,0.35,1575000\nSource C - Lookup,Fuzzy,890000,1.00,890000\nSource D - Lookup,Range,0,0,1200000" },
      ]},
      { name: "enrichment", type: "directory", children: [
        { name: "record-set.csv", type: "file", size: "234 KB", content: "Record_ID,Owner,Count,Stage,Score_12m,Conf,Volume,Result\nR-001,Team_A,45000,1,0.012,0.45,45000,243\nR-002,Team_B,12000,2,0.089,0.55,12000,587\nR-003,Team_C,890,3,1.000,0.65,890,578\nR-004,Team_D,2300,1,0.025,0.40,2300,23" },
        { name: "score-curves.csv", type: "file", size: "15 KB", content: "Tier,Step_1,Step_2,Step_3,Step_4,Step_5,Cumulative\nA,0.001,0.003,0.006,0.010,0.015,0.035\nB,0.005,0.012,0.022,0.035,0.050,0.124\nC,0.012,0.028,0.048,0.072,0.100,0.260\nD,0.025,0.058,0.098,0.145,0.200,0.526" },
      ]},
      { name: "monitoring", type: "directory", children: [
        { name: "metrics-portfolio.csv", type: "file", size: "67 KB", content: "Metric,Type,Level,Count,Adjust,Adjusted\nUptime,Health,1,2100000,0.00,2100000\nQuality,Health,1,890000,0.00,890000\nLatency,Service,2A,450000,0.15,382500" },
        { name: "throughput-forecast.csv", type: "file", size: "89 KB", content: "Date,Inflow,Outflow,Net,Cumulative\n2026-06-01,45000,38000,7000,7000\n2026-06-02,23000,56000,-33000,-26000\n2026-06-03,67000,42000,25000,-1000" },
        { name: "source-register.csv", type: "file", size: "12 KB" },
        { name: "connector-config.csv", type: "file", size: "8 KB" },
        { name: "queue-profile.csv", type: "file", size: "15 KB" },
        { name: "rate-limits.csv", type: "file", size: "4 KB" },
        { name: "runoff-rates.csv", type: "file", size: "6 KB" },
        { name: "internal-limits.csv", type: "file", size: "3 KB" },
      ]},
      { name: "reporting", type: "directory", children: [
        { name: "org-structure.csv", type: "file", size: "8 KB", content: "Unit,Owner,Role,Region,Rollup\nHQ,Operations,Owner,Global,Parent\nTeam A,Operations,Reviewer,Global,Child\nTeam B,Platform,Reviewer,Global,Child\nTeam C,Operations,Reviewer,Global,Child" },
        { name: "report-calendar.csv", type: "file", size: "5 KB", content: "Report,Owner,Deadline,Format,Frequency\nRun Summary,Operations,Day 1,JSON,Daily\nMetrics Rollup,Platform,Day 1,JSON,Weekly\nDetail Report,Operations,Day 5,CSV,Monthly\nQuality Report,Operations,Day 1,JSON,Daily" },
        { name: "rollup-bridge.csv", type: "file", size: "34 KB" },
        { name: "validation-rules.csv", type: "file", size: "28 KB", content: "Rule_ID,Template,Type,Description,Severity\nVR-001,Summary,Cross-check,Out_Count = In_Count,Error\nVR-002,Summary,Cross-check,Quality >= 0.90,Error\nVR-003,Rollup,Validation,Count >= 0,Warning\nVR-004,Detail,Cross-check,Score in range,Error" },
      ]},
    ]
  },
  {
    name: "skills",
    type: "directory",
    description: "Skill definitions with methodology and scripts",
    children: [
      { name: "example-skill/SKILL.md", type: "file", size: "8.4 KB", content: "# Skill: Example Skill\n\n## Purpose\nOrchestrate the end-to-end example workflow across all sources.\n\n## Methodology\n1. Pre-run data validation\n2. Record matching against the reference dataset\n3. Field normalization\n4. Enrichment\n5. Quality scoring\n6. Variance analysis vs prior period\n7. Run summary generation\n\n## Required Data\n- field-catalog.csv\n- intake-schedules.csv\n- merge-rules.csv\n\n## Controls\n- Dual approval for batches > 1,000 records\n- Auto-handle tolerance: 0.90 quality score\n- Reference source: latest published version" },
      { name: "data-validation/SKILL.md", type: "file", size: "6.2 KB", content: "# Skill: Data Validation\n\n## Purpose\nValidate records across 7 checks: schema, range, completeness, duplicate, reference, freshness, quality.\n\n## Methodology\n1. Extract data from both sides\n2. Apply matching rules (exact, fuzzy, aggregate)\n3. Classify exceptions (timing, missing, format, error)\n4. Generate correction proposals\n5. Route for approval\n\n## Matching Rules\n- Exact match: Identifier + value\n- Fuzzy match: Value +/- 1%, date +/- 3 days\n- Aggregate match: Multiple items summing to the source total" },
      { name: "record-matching/SKILL.md", type: "file", size: "7.1 KB" },
      { name: "report-generation/SKILL.md", type: "file", size: "9.3 KB" },
      { name: "policy-check/SKILL.md", type: "file", size: "5.8 KB" },
      { name: "quality-scoring/SKILL.md", type: "file", size: "6.5 KB" },
    ]
  },
];

function getFullPath(node: FileNode, parents: string[] = []): string {
  return [...parents, node.name].join("/");
}

function flattenFiles(nodes: FileNode[], parents: string[] = []): { path: string; node: FileNode }[] {
  const result: { path: string; node: FileNode }[] = [];
  for (const n of nodes) {
    const path = getFullPath(n, parents);
    if (n.type === "file") result.push({ path, node: n });
    if (n.children) result.push(...flattenFiles(n.children, [...parents, n.name]));
  }
  return result;
}

interface TreeNodeProps {
  node: FileNode;
  depth?: number;
  selectedFile: string | null;
  onSelectFile: (path: string, node: FileNode) => void;
  parentPath?: string[];
}

function TreeNode({ node, depth = 0, selectedFile, onSelectFile, parentPath = [] }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = node.type === "directory";
  const hasChildren = isDir && node.children && node.children.length > 0;
  const fullPath = getFullPath(node, parentPath);
  const isSelected = selectedFile === fullPath;

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else {
      onSelectFile(fullPath, node);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors cursor-pointer",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0", expanded && "rotate-90")} />
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}
        {isDir ? (
          expanded ? <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" /> : <FolderTree className="w-4 h-4 text-amber-500 flex-shrink-0" />
        ) : node.name.endsWith(".csv") ? (
          <FileSpreadsheet className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        ) : node.name.endsWith(".md") ? (
          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
        ) : node.name.endsWith(".yaml") ? (
          <Settings className="w-4 h-4 text-purple-500 flex-shrink-0" />
        ) : (
          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className={cn("text-sm truncate", isDir ? "font-semibold text-foreground" : "font-mono text-foreground/80")}>{node.name}</span>
        {node.size && <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">{node.size}</span>}
      </div>
      {expanded && node.children && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode
              key={`${child.name}-${i}`}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              parentPath={[...parentPath, node.name]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeBase() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; content: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalFiles = KNOWLEDGE_TREE.reduce(function count(acc: number, n: FileNode): number {
    if (n.type === "file") return acc + 1;
    return (n.children || []).reduce(count, acc);
  }, 0);

  const handleSelectFile = (path: string, node: FileNode) => {
    setSelectedFile(path);
    setSelectedNode(node);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const text = await file.text();
      setUploadedFiles(prev => [...prev, {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        content: text,
      }]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const viewUploadedFile = (file: { name: string; size: string; content: string }) => {
    setSelectedFile(`uploads/${file.name}`);
    setSelectedNode({ name: file.name, type: "file", size: file.size, content: file.content });
  };

  const removeUploadedFile = (name: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== name));
    if (selectedFile === `uploads/${name}`) {
      setSelectedFile(null);
      setSelectedNode(null);
    }
  };

  const getFileLanguage = (name: string): string => {
    if (name.endsWith(".yaml") || name.endsWith(".yml")) return "yaml";
    if (name.endsWith(".csv")) return "csv";
    if (name.endsWith(".md")) return "markdown";
    if (name.endsWith(".json")) return "json";
    return "text";
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">Agent configuration, data sources, and skill definitions -- {totalFiles + uploadedFiles.length} files</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv,.json,.xlsx,.yaml,.yml,.md,.txt,.pdf" multiple onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload Data
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-[340px] border-r border-border flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-3 gap-2 mb-3 px-1">
              <div className="bg-card rounded-lg border border-border p-2.5 text-center">
                <Settings className="w-3.5 h-3.5 text-purple-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">3</p>
                <p className="text-[9px] text-muted-foreground">Config</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-2.5 text-center">
                <Database className="w-3.5 h-3.5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">28</p>
                <p className="text-[9px] text-muted-foreground">Data</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-2.5 text-center">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">6</p>
                <p className="text-[9px] text-muted-foreground">Skills</p>
              </div>
            </div>

            {KNOWLEDGE_TREE.map((node, i) => (
              <TreeNode
                key={`${node.name}-${i}`}
                node={node}
                selectedFile={selectedFile}
                onSelectFile={handleSelectFile}
              />
            ))}

            {uploadedFiles.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-2 mb-1">Uploaded Files</p>
                {uploadedFiles.map(file => (
                  <div
                    key={file.name}
                    className={cn(
                      "flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer",
                      selectedFile === `uploads/${file.name}` ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                    )}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-mono text-foreground/80 truncate flex-1" onClick={() => viewUploadedFile(file)}>{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">{file.size}</span>
                    <button onClick={() => removeUploadedFile(file.name)} className="p-0.5 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {selectedNode ? (
            <>
              <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {selectedNode.name.endsWith(".csv") ? (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : selectedNode.name.endsWith(".md") ? (
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  ) : selectedNode.name.endsWith(".yaml") ? (
                    <Settings className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-sm font-mono font-medium text-foreground truncate">{selectedFile}</span>
                  {selectedNode.size && <span className="text-[10px] text-muted-foreground flex-shrink-0">{selectedNode.size}</span>}
                  {selectedNode.description && <span className="text-[10px] text-muted-foreground flex-shrink-0">-- {selectedNode.description}</span>}
                </div>
                <button onClick={() => { setSelectedFile(null); setSelectedNode(null); }} className="p-1 hover:bg-muted rounded-md">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                {selectedNode.content ? (
                  <div className="bg-card min-h-full">
                    <pre className="p-5 text-[12px] font-mono text-foreground leading-relaxed whitespace-pre-wrap">{selectedNode.content}</pre>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Eye className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm">Content preview not available for this file</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Upload or load the actual data to view contents</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FolderTree className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium">Select a file to view its contents</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Click any file in the tree to preview it here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
