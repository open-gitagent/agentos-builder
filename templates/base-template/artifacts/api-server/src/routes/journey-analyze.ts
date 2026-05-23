import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import { getModel } from "@mariozechner/pi-ai";
import type { GCMessage } from "gitclaw";
import { appendAudit, parseAuditType } from "../lib/audit-log";
import { AGENT_DIR, JOURNEY_DATA_DIR, SKILLS_DIR } from "../lib/agent-dir";

const router = Router();

// Generic "source systems" the agent can pull from. Rename / extend these to
// match the integrations your domain uses; keep them in sync with the frontend
// SourceSystem type (lib/journey-events.ts) and SYSTEM_REGISTRY (lib/tool-registry.ts).
type SourceSystem =
  | "erp" | "database" | "api" | "warehouse" | "messaging" | "internal";

interface ToolCallTemplate {
  system: SourceSystem;
  verb: string;
  args: Record<string, string | number>;
}

// Maps a data file name → the "tool call" shown in the timeline when the agent
// reads it. Add an entry per data file; unknown files fall back to loadFile().
const FILE_TO_TOOL: Record<string, ToolCallTemplate> = {
  "sample.csv": { system: "warehouse", verb: "querySample", args: { dataset: "sample", limit: 1000 } },
  "records.csv": { system: "database", verb: "fetchRecords", args: { table: "records" } },
};

function toolCallForFile(name: string): ToolCallTemplate {
  const lower = name.toLowerCase();
  if (FILE_TO_TOOL[lower]) return FILE_TO_TOOL[lower];
  for (const key of Object.keys(FILE_TO_TOOL)) {
    if (lower.includes(key.replace(".csv", ""))) return FILE_TO_TOOL[key];
  }
  return { system: "internal", verb: "loadFile", args: { name } };
}

interface ApprovalGateTemplate {
  gateId: string;
  title: string;
  rationale: string;
  threshold?: string;
  approvers: string[];
  approverRoles?: string[];
  slaMinutes?: number;
  dualControl: boolean;
  insertAfterStep?: string;
}

// Human-in-the-loop approval gates per journey. The example shows a single gate
// inserted after the "checks" section. Set to [] for journeys with no gates.
const JOURNEY_GATES: Record<string, ApprovalGateTemplate[]> = {
  "example-journey": [
    {
      gateId: "example-approval",
      title: "Reviewer sign-off before finalizing",
      rationale: "This run flagged items above the example threshold. A reviewer must approve before the output is certified — this demonstrates the human-in-the-loop gate.",
      threshold: "Example threshold",
      approvers: ["Reviewer"],
      approverRoles: ["Reviewer"],
      slaMinutes: 60,
      dualControl: false,
      insertAfterStep: "checks",
    },
  ],
};

const ANTHROPIC_MODELS = [
  "claude-sonnet-4-6",
  "claude-sonnet-4-6-20250627",
  "claude-sonnet-4-5",
  "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5",
  "claude-3-5-haiku-latest",
];

let _envBridged = false;

function bridgeReplitEnv(): void {
  if (_envBridged) return;
  _envBridged = true;

  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;

  if (apiKey) {
    process.env.ANTHROPIC_API_KEY = apiKey;
  }

  if (baseUrl) {
    for (const modelId of ANTHROPIC_MODELS) {
      const model = getModel("anthropic", modelId as never) as unknown as Record<string, unknown> | undefined;
      if (model) {
        model.baseUrl = baseUrl;
      }
    }
  }
}

// journey id → skill directory under agent/skills/
const JOURNEY_SKILL_MAP: Record<string, string> = {
  "example-journey": "example-skill",
};

// journey id → data directory under agent/knowledge/journey-data/
const JOURNEY_DATA_MAP: Record<string, string> = {
  "example-journey": "example-journey",
};

// A representative metric movement surfaced as a "delta" event on each run.
const JOURNEY_DELTAS: Record<string, { metric: string; before: number | string; after: number | string; unit?: string; direction: "up" | "down" | "flat"; rationale?: string }> = {
  "example-journey": { metric: "Records needing review", before: 8, after: 2, unit: "", direction: "down", rationale: "Automated checks cleared most items" },
};

// The structured sections the AI conclusion renders. Keep ids in sync with any
// SECTION_ICONS map on the journey page. Add a journey → sections entry per journey.
const JOURNEY_SECTIONS: Record<string, { id: string; title: string; step: string }[]> = {
  "example-journey": [
    { id: "overview", title: "Step 1 — Overview", step: "Summarize the inputs in scope" },
    { id: "checks", title: "Step 2 — Checks", step: "Validate records and flag items needing review" },
    { id: "output", title: "Step 3 — Output", step: "Produce the result and recommended next steps" },
  ],
};

function readSkill(skillName: string): string {
  try {
    return fs.readFileSync(path.join(SKILLS_DIR, skillName, "SKILL.md"), "utf-8").slice(0, 2000);
  } catch {
    return "";
  }
}

router.post("/journey/prepare", async (req, res) => {
  const { journey } = req.body as { journey: string };
  if (!journey) {
    res.status(400).json({ error: "journey is required" });
    return;
  }

  const events: Array<Record<string, unknown>> = [];
  // Legacy shape kept for back-compat with any older client code paths.
  const steps: { id: string; label: string; detail: string; type: "config" | "skill" | "file" }[] = [];
  const now = () => new Date().toISOString();
  let seq = 1;
  const eid = (prefix: string) => `${prefix}-${Date.now()}-${seq++}`;

  // 1. Agent load (skill_invocation as the bootstrap)
  events.push({
    id: eid("evt"),
    ts: now(),
    type: "skill_invocation",
    skill: "agent.bootstrap",
    label: "Loading agent via GitClaw",
    detail: "agent.yaml, SOUL.md, RULES.md, DUTIES.md",
    status: "pending",
    durationMs: 320,
  });
  steps.push({ id: "config", label: "Loading agent via GitClaw", detail: "agent.yaml, SOUL.md, RULES.md, DUTIES.md", type: "config" });

  // 2. Primary skill invocation
  const skillName = JOURNEY_SKILL_MAP[journey] || "";
  let skillContent = "";
  if (skillName) {
    skillContent = readSkill(skillName);
    events.push({
      id: eid("evt"),
      ts: now(),
      type: "skill_invocation",
      skill: skillName,
      label: `Skill loaded: ${skillName}`,
      detail: skillContent ? `${skillContent.split("\n").length} lines · honours human_in_the_loop` : "Skill not found",
      status: "pending",
      durationMs: 220,
    });
    steps.push({ id: "skill", label: `Skill available: ${skillName}`, detail: `${skillContent.split("\n").length} lines`, type: "skill" });
  }

  // 3. Tool-call events for each data file the agent will read
  const dataDir = JOURNEY_DATA_MAP[journey] || "";
  const dataFileEntries: { name: string; content: string; rows: number }[] = [];
  if (dataDir) {
    const fullDir = path.join(JOURNEY_DATA_DIR, dataDir);
    try {
      const files = fs.readdirSync(fullDir).filter(f => f.endsWith(".csv") || f.endsWith(".json"));
      for (const file of files.slice(0, 12)) {
        try {
          const content = fs.readFileSync(path.join(fullDir, file), "utf-8");
          const lines = content.split("\n").filter(l => l.trim());
          dataFileEntries.push({ name: file, content: content.slice(0, 50000), rows: lines.length });
          const tpl = toolCallForFile(file);
          events.push({
            id: eid("tc"),
            ts: now(),
            type: "tool_call",
            system: tpl.system,
            verb: tpl.verb,
            args: tpl.args,
            latencyMs: 80 + Math.floor(Math.random() * 280),
            rowCount: lines.length,
            fileName: file,
            rawPreview: content.slice(0, 200),
            status: "pending",
          });
          steps.push({ id: `file-${file}`, label: `Knowledge: ${file}`, detail: `${lines.length} rows`, type: "file" });
        } catch {}
      }
    } catch {}
  }

  // 4. Approval gate (if journey has HITL) — sorted by section position so
  // multi-stage gates flow in journey order.
  const gates = JOURNEY_GATES[journey] || [];
  const sectionList = JOURNEY_SECTIONS[journey] || [];
  const sectionIndex = new Map(sectionList.map((s, i) => [s.id, i] as const));
  const sectionTitleById = new Map(sectionList.map(s => [s.id, s.title] as const));
  const sortedGates = [...gates].sort((a, b) => {
    const ai = a.insertAfterStep ? sectionIndex.get(a.insertAfterStep) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    const bi = b.insertAfterStep ? sectionIndex.get(b.insertAfterStep) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
  for (const gate of sortedGates) {
    let insertAfterStep = gate.insertAfterStep;
    let insertAfterStepTitle: string | undefined;
    if (insertAfterStep) {
      if (!sectionIndex.has(insertAfterStep)) {
        console.warn(
          `[journey-analyze] Gate '${gate.gateId}' on '${journey}' references unknown insertAfterStep='${insertAfterStep}'. Falling back to end-of-pipeline placement.`
        );
        insertAfterStep = undefined;
      } else {
        insertAfterStepTitle = sectionTitleById.get(insertAfterStep);
      }
    }
    events.push({
      id: eid("gate"),
      ts: now(),
      type: "approval_gate",
      gateId: gate.gateId,
      title: gate.title,
      rationale: gate.rationale,
      threshold: gate.threshold,
      approvers: gate.approvers,
      approverRoles: gate.approverRoles,
      slaMinutes: gate.slaMinutes,
      dualControl: gate.dualControl,
      insertAfterStep,
      insertAfterStepTitle,
      status: "pending",
    });
  }

  // 5. Delta event — surface a representative metric movement so the typed
  // taxonomy is exercised end-to-end on every prepared run.
  const deltaSpec = JOURNEY_DELTAS[journey] ?? {
    metric: "Run readiness",
    before: dataFileEntries.length,
    after: dataFileEntries.length,
    unit: " files",
    direction: "flat" as const,
    rationale: "No source-file change vs. prior run",
  };
  events.push({
    id: eid("delta"),
    ts: now(),
    type: "delta",
    metric: deltaSpec.metric,
    before: deltaSpec.before,
    after: deltaSpec.after,
    unit: deltaSpec.unit,
    direction: deltaSpec.direction,
    rationale: deltaSpec.rationale,
    status: "pending",
  });

  // 6. Notification (post-decision)
  events.push({
    id: eid("note"),
    ts: now(),
    type: "notification",
    channel: "slack",
    recipient: "#agent-runs",
    subject: `${journey.replace(/-/g, " ")} run summary ready`,
    status: "pending",
    durationMs: 150,
  });

  const sections = JOURNEY_SECTIONS[journey] || [];

  // Audit log breadcrumb that the run was prepared
  appendAudit({
    type: "agent_action",
    actor: "Agent",
    action: `Prepared ${journey.replace(/-/g, " ")} run`,
    details: `Skill: ${skillName || "n/a"} · ${dataFileEntries.length} data files · ${gates.length} approval gate(s)`,
    journey,
  });

  res.json({
    journey,
    events,
    steps,
    skill: skillName ? { name: skillName, loaded: !!skillContent } : null,
    dataFiles: dataFileEntries.map(f => ({ name: f.name, rows: f.rows })),
    sections: sections.map(s => ({ id: s.id, title: s.title })),
  });
});

// Audit-log seam used by the runner when an approval gate is decided.
router.post("/journey/audit", (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (!body || typeof body.action !== "string") {
    res.status(400).json({ error: "action required" });
    return;
  }
  const entry = appendAudit({
    type: parseAuditType(body.type),
    actor: String(body.actor ?? "Agent"),
    action: String(body.action),
    details: String(body.details ?? ""),
    journey: body.journey ? String(body.journey) : undefined,
    runId: body.runId ? String(body.runId) : undefined,
    eventId: body.eventId ? String(body.eventId) : undefined,
    entity: body.entity ? String(body.entity) : undefined,
    meta: (body.meta as Record<string, unknown>) ?? undefined,
  });
  res.json({ entry });
});

const MAX_PER_FILE_CHARS = 100_000;
const MAX_TOTAL_UPLOAD_CHARS = 400_000;

router.post("/journey/analyze", async (req, res) => {
  const { journey, resultsSummary, uploadedFiles } = req.body as {
    journey: string;
    resultsSummary: string;
    uploadedFiles?: { name: string; content: string }[];
  };

  if (!journey) {
    res.status(400).json({ error: "journey is required" });
    return;
  }

  bridgeReplitEnv();

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: "AI integration not available" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const rawFiles = (uploadedFiles || []).slice(0, 15);
  const validFiles: { name: string; content: string }[] = [];
  let totalChars = 0;
  for (const f of rawFiles) {
    if (!f.name || typeof f.content !== "string" || !f.content.trim()) continue;
    const content = f.content.slice(0, MAX_PER_FILE_CHARS);
    if (totalChars + content.length > MAX_TOTAL_UPLOAD_CHARS) break;
    validFiles.push({ name: f.name.slice(0, 200), content });
    totalChars += content.length;
  }

  const hasUserFiles = validFiles.length > 0;

  if (hasUserFiles) {
    console.log(`[Journey Analyze] ${journey}: ${validFiles.length} user files received (${(totalChars / 1024).toFixed(1)}KB total): ${validFiles.map(f => f.name).join(", ")}`);
  } else {
    console.log(`[Journey Analyze] ${journey}: No user files, using agent knowledge base`);
  }

  const sections = JOURNEY_SECTIONS[journey] || [];
  const sectionList = sections.map((s, i) => `${i + 1}. [${s.id}] ${s.title} — ${s.step}`).join("\n");

  let userFilesBlock = "";
  if (hasUserFiles) {
    userFilesBlock = validFiles
      .map(f => `=== FILE: ${f.name} ===\n${f.content}`)
      .join("\n\n");
  }

  let knowledgeBlock = "";
  if (!hasUserFiles) {
    const dataDir = JOURNEY_DATA_MAP[journey] || "";
    const dataParts: string[] = [];
    if (dataDir) {
      const fullDir = path.join(JOURNEY_DATA_DIR, dataDir);
      try {
        const files = fs.readdirSync(fullDir).filter(f => f.endsWith(".csv") || f.endsWith(".json"));
        for (const file of files.slice(0, 12)) {
          try {
            const content = fs.readFileSync(path.join(fullDir, file), "utf-8").slice(0, 30000);
            dataParts.push(`=== FILE: ${file} ===\n${content}`);
          } catch {}
        }
      } catch {}
    }
    const skillName = JOURNEY_SKILL_MAP[journey] || "";
    const skillContent = skillName ? readSkill(skillName) : "";
    if (skillContent) {
      dataParts.unshift(`=== SKILL: ${skillName} ===\n${skillContent}`);
    }
    knowledgeBlock = dataParts.join("\n\n");
    console.log(`[Journey Analyze] ${journey}: Pre-loaded ${dataParts.length} knowledge files (${(knowledgeBlock.length / 1024).toFixed(1)}KB)`);
  }

  const journeyLabel = journey.replace(/-/g, " ");

  const formatRules = `OUTPUT FORMAT — STRICT RULES:
Structure your entire response into exactly ${sections.length} sections using this EXACT format for EACH section:

[SECTION]
{"id":"section-id","title":"Section Title","step":"Brief step description","status":"healthy","metrics":[{"label":"Metric Name","value":"Value","status":"good"},{"label":"Another","value":"Value","status":"warning"}]}
[CONTENT]
Your detailed markdown analysis here...
[/SECTION]

IMPORTANT FORMAT RULES:
- The JSON after [SECTION] must be valid JSON on a SINGLE line
- Each section must have exactly 4-6 metrics in the metrics array
- status field for the section: "healthy" (all good), "warning" (some concerns), or "critical" (major issues)
- Each metric status: "good", "warning", or "critical"
- Metric values MUST be short (max 15 characters)
- Content between [CONTENT] and [/SECTION] is markdown
- Do NOT include any text outside of [SECTION]...[/SECTION] blocks
- Do NOT use # or ## headers inside [CONTENT]
- START your response immediately with [SECTION] — no preamble`;

  let promptText: string;
  if (hasUserFiles) {
    promptText = `Run a comprehensive "${journeyLabel}" analysis using the documents below. Analyze the data and produce the structured output immediately.

UPLOADED DOCUMENTS:
${userFilesBlock}

Generate your analysis structured into exactly ${sections.length} sections:
${sectionList}

${formatRules}`;
  } else {
    promptText = `Run a comprehensive "${journeyLabel}" analysis using the knowledge data provided below. Analyze this data and produce the structured output immediately — do NOT use tools to read files, all data is already provided.

${resultsSummary ? `Context from the pipeline: ${resultsSummary}\n` : ""}KNOWLEDGE DATA:
${knowledgeBlock}

Generate your analysis structured into exactly ${sections.length} sections:
${sectionList}

${formatRules}`;
  }

  let closed = false;
  res.on("close", () => { closed = true; });

  try {
    const { query } = await import("gitclaw");

    const abortController = new AbortController();
    res.on("close", () => abortController.abort());

    const stream = query({
      prompt: promptText,
      dir: AGENT_DIR,
      model: "anthropic:claude-sonnet-4-6",
      maxTurns: 3,
      constraints: { maxTokens: 16384 },
      abortController,
      systemPromptSuffix: `The user is running a ${journeyLabel} journey analysis. All knowledge data and skill instructions have been pre-loaded into the prompt — do NOT use read or other file tools. Produce your entire structured output with [SECTION]...[/SECTION] blocks immediately in a single response.`,
    });

    let lastAssistantHadText = false;
    let turnCount = 0;
    let totalTextChars = 0;

    console.log(`[Journey Analyze] Starting stream for ${journey}...`);

    for await (const msg of stream) {
      if (closed) break;

      switch (msg.type) {
        case "delta": {
          const delta = msg as Extract<GCMessage, { type: "delta" }>;
          if (delta.deltaType === "text") {
            lastAssistantHadText = true;
            totalTextChars += (delta.content || "").length;
            res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
          }
          break;
        }
        case "assistant": {
          turnCount++;
          console.log(`[Journey Analyze] ${journey}: Turn ${turnCount} complete (hadText=${lastAssistantHadText}, totalChars=${totalTextChars})`);
          if (lastAssistantHadText) {
            lastAssistantHadText = false;
          }
          break;
        }
        case "system": {
          const sys = msg as Extract<GCMessage, { type: "system" }>;
          if (sys.subtype === "error" && !closed) {
            res.write(`data: ${JSON.stringify({ error: sys.content })}\n\n`);
            res.end();
            closed = true;
          }
          break;
        }
      }
    }

    console.log(`[Journey Analyze] ${journey}: Stream complete — ${turnCount} turns, ${totalTextChars} chars streamed`);

    if (!closed && !res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    if (closed || error?.name === "AbortError") return;
    console.error("Journey analyze error:", error);
    if (!closed) {
      res.write(`data: ${JSON.stringify({ error: error.message || "Analysis failed" })}\n\n`);
      res.end();
    }
  }
});

export default router;
