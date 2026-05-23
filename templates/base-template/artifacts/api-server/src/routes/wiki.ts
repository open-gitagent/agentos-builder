import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import { getModel } from "@mariozechner/pi-ai";
import type { GCMessage } from "gitclaw";
import { AGENT_DIR } from "../lib/agent-dir";

const router = Router();

const WIKI_DIR = path.join(AGENT_DIR, "memory", "wiki");

const FOLDER_TO_TYPE = {
  entities: "entity",
  concepts: "concept",
  synthesis: "synthesis",
} as const;

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,80}$/;

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
  if (apiKey) process.env.ANTHROPIC_API_KEY = apiKey;
  if (baseUrl) {
    for (const modelId of ANTHROPIC_MODELS) {
      const model = getModel("anthropic", modelId as never) as unknown as Record<string, unknown> | undefined;
      if (model) model.baseUrl = baseUrl;
    }
  }
}

interface WikiPageMeta {
  slug: string;
  title: string;
  type: "entity" | "concept" | "synthesis";
  category: string;
  updated: string;
  sources: string[];
  tags: string[];
  filePath: string;
  inboundLinks: number;
  outboundLinks: string[];
}

function parseFrontmatter(content: string): { fm: Record<string, any>; body: string } {
  if (!content.startsWith("---")) return { fm: {}, body: content };
  const end = content.indexOf("\n---", 3);
  if (end < 0) return { fm: {}, body: content };
  const fmRaw = content.slice(3, end).trim();
  const body = content.slice(end + 4).replace(/^\n/, "");
  const fm: Record<string, any> = {};
  let currentKey = "";
  for (const line of fmRaw.split("\n")) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (m) {
      currentKey = m[1];
      const val = m[2].trim();
      if (val.startsWith("[")) {
        fm[currentKey] = val
          .slice(1, -1)
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);
      } else if (val) {
        fm[currentKey] = val;
      } else {
        fm[currentKey] = [];
      }
    } else {
      const itemMatch = line.match(/^\s*-\s+(.+)$/);
      if (itemMatch && currentKey && Array.isArray(fm[currentKey])) {
        fm[currentKey].push(itemMatch[1].trim());
      }
    }
  }
  return { fm, body };
}

function extractWikiLinks(body: string): string[] {
  const matches = body.matchAll(/\[\[([a-z0-9-]+)\]\]/g);
  const links = new Set<string>();
  for (const m of matches) links.add(m[1]);
  return Array.from(links);
}

function loadAllPages(): WikiPageMeta[] {
  const pages: WikiPageMeta[] = [];
  const folders: { name: string; type: WikiPageMeta["type"] }[] = [
    { name: "entities", type: "entity" },
    { name: "concepts", type: "concept" },
    { name: "synthesis", type: "synthesis" },
  ];

  for (const folder of folders) {
    const dir = path.join(WIKI_DIR, folder.name);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const slug = file.replace(/\.md$/, "");
      if (!SLUG_REGEX.test(slug)) continue;
      const content = fs.readFileSync(path.join(dir, file), "utf-8");
      const { fm, body } = parseFrontmatter(content);
      const outbound = extractWikiLinks(body);
      pages.push({
        slug,
        title: fm.title || slug,
        type: folder.type,
        category: fm.category || "",
        updated: fm.updated || "",
        sources: Array.isArray(fm.sources) ? fm.sources : [],
        tags: Array.isArray(fm.tags) ? fm.tags : [],
        filePath: `agent/memory/wiki/${folder.name}/${file}`,
        inboundLinks: 0,
        outboundLinks: outbound,
      });
    }
  }

  for (const page of pages) {
    for (const target of page.outboundLinks) {
      const targetPage = pages.find(p => p.slug === target);
      if (targetPage) targetPage.inboundLinks++;
    }
  }

  return pages;
}

router.get("/wiki/pages", (_req, res) => {
  try {
    const pages = loadAllPages();
    res.json({
      pages: pages.map(p => ({
        slug: p.slug,
        title: p.title,
        type: p.type,
        category: p.category,
        updated: p.updated,
        sources: p.sources,
        tags: p.tags,
        inboundLinks: p.inboundLinks,
        outboundLinks: p.outboundLinks.length,
      })),
      stats: {
        total: pages.length,
        entities: pages.filter(p => p.type === "entity").length,
        concepts: pages.filter(p => p.type === "concept").length,
        synthesis: pages.filter(p => p.type === "synthesis").length,
        totalLinks: pages.reduce((sum, p) => sum + p.outboundLinks.length, 0),
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/wiki/page/:slug", (req, res) => {
  try {
    const slug = req.params.slug;
    if (!SLUG_REGEX.test(slug)) {
      res.status(400).json({ error: "Invalid slug" });
      return;
    }
    const folders: (keyof typeof FOLDER_TO_TYPE)[] = ["entities", "concepts", "synthesis"];
    for (const folder of folders) {
      const fp = path.join(WIKI_DIR, folder, `${slug}.md`);
      const resolved = path.resolve(fp);
      if (!resolved.startsWith(path.resolve(WIKI_DIR) + path.sep)) continue;
      if (fs.existsSync(fp)) {
        const content = fs.readFileSync(fp, "utf-8");
        const { fm, body } = parseFrontmatter(content);
        res.json({
          slug,
          title: fm.title || slug,
          type: FOLDER_TO_TYPE[folder],
          category: fm.category || "",
          updated: fm.updated || "",
          sources: Array.isArray(fm.sources) ? fm.sources : [],
          tags: Array.isArray(fm.tags) ? fm.tags : [],
          body,
          filePath: `agent/memory/wiki/${folder}/${slug}.md`,
        });
        return;
      }
    }
    res.status(404).json({ error: "Page not found" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/wiki/graph", (_req, res) => {
  try {
    const pages = loadAllPages();
    const slugSet = new Set(pages.map(p => p.slug));
    const nodes = pages.map(p => ({
      id: p.slug,
      title: p.title,
      type: p.type,
      category: p.category,
      inbound: p.inboundLinks,
      size: 8 + Math.min(p.inboundLinks * 3, 20),
    }));
    const edges: { source: string; target: string }[] = [];
    for (const page of pages) {
      for (const target of page.outboundLinks) {
        if (slugSet.has(target)) {
          edges.push({ source: page.slug, target });
        }
      }
    }
    res.json({ nodes, edges });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/wiki/log", (_req, res) => {
  try {
    const fp = path.join(WIKI_DIR, "log.md");
    const content = fs.existsSync(fp) ? fs.readFileSync(fp, "utf-8") : "";
    res.json({ log: content });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

function sseWrite(res: any, event: string, data: object): boolean {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    return false;
  }
}

router.post("/wiki/chat/stream", async (req, res): Promise<void> => {
  try {
    bridgeReplitEnv();
    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(503).json({ error: "Anthropic AI integration is not configured." });
      return;
    }

    const { question, mode } = req.body as { question?: string; mode?: "query" | "ingest" | "lint" };
    const safeMode: "query" | "ingest" | "lint" = mode === "ingest" || mode === "lint" ? mode : "query";
    if (!question && safeMode !== "lint") {
      res.status(400).json({ error: "question is required" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Transfer-Encoding": "chunked",
    });
    res.flushHeaders();

    const abortController = new AbortController();
    res.on("close", () => abortController.abort());

    const { query } = await import("gitclaw");

    let prompt: string;
    if (safeMode === "lint") {
      prompt = `Use the wiki-lint skill to health-check the wiki at memory/wiki/. Read the index, scan all pages, and produce a lint report with sections: ORPHANS, BROKEN LINKS, MISSING BACKLINKS, STALE, CONTRADICTIONS, GAPS. Be concise.`;
    } else if (safeMode === "ingest") {
      prompt = `Use the wiki-ingest skill to ingest the following information into the wiki. Read memory/wiki/index.md first, identify entities and concepts, then create or update pages and update the index. Source: ${question}`;
    } else {
      prompt = `Use the wiki-query skill to answer this question: ${question}\n\nRead memory/wiki/index.md first, then read the most relevant 2-5 pages, then synthesise an answer with [[wiki-link]] citations.`;
    }

    sseWrite(res, "system_read", {
      file: "agent/agent.yaml",
      action: "Loading wiki agent...",
    });

    try {
      const stream = query({
        prompt,
        dir: AGENT_DIR,
        model: "anthropic:claude-sonnet-4-6",
        abortController,
        maxTurns: 10,
        constraints: { maxTokens: 8192 },
        systemPromptSuffix: `You are the Wiki Agent. The wiki lives at memory/wiki/ with subfolders entities/, concepts/, synthesis/, plus index.md and log.md. Always read index.md first to find pages. Cite using [[slug]] format. Stream your reasoning and answer text.`,
      });

      for await (const msg of stream) {
        if (abortController.signal.aborted) break;

        switch (msg.type) {
          case "delta": {
            const delta = msg as Extract<GCMessage, { type: "delta" }>;
            if (delta.deltaType === "text") {
              sseWrite(res, "delta", { text: delta.content });
            }
            break;
          }
          case "tool_use": {
            const tu = msg as Extract<GCMessage, { type: "tool_use" }>;
            const filePath = tu.args?.file_path || tu.args?.path || "";
            let evt = "tool_use";
            if (tu.toolName === "read") evt = "wiki_read";
            else if (tu.toolName === "write") {
              evt = filePath.includes("/wiki/") ? "wiki_write" : "tool_use";
            }
            sseWrite(res, evt, {
              tool: tu.toolName,
              file: filePath,
              args: tu.args,
            });
            break;
          }
          case "tool_result": {
            const tr = msg as Extract<GCMessage, { type: "tool_result" }>;
            sseWrite(res, "tool_result", {
              tool: tr.toolName,
              status: tr.isError ? "error" : "ok",
              preview: (tr.content || "").slice(0, 240),
            });
            break;
          }
          case "system": {
            const sys = msg as Extract<GCMessage, { type: "system" }>;
            if (sys.subtype === "error") {
              sseWrite(res, "error", { error: sys.content });
            }
            break;
          }
        }
      }
    } catch (err: any) {
      sseWrite(res, "error", { error: err?.message || "stream error" });
    }

    if (!res.writableEnded) {
      sseWrite(res, "done", { finished: true });
      res.end();
    }
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error?.message || "Internal error" });
    }
  }
});

export default router;
