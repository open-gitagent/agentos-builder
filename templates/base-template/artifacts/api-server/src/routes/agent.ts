import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { AGENT_DIR } from "../lib/agent-dir";

const router = Router();

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function loadYaml(filePath: string): Record<string, unknown> {
  return yaml.parse(readFile(filePath)) as Record<string, unknown>;
}

router.get("/agent/info", (_req, res) => {
  try {
    const agent = loadYaml(path.join(AGENT_DIR, "agent.yaml"));
    const model = agent.model as Record<string, unknown>;
    const compliance = agent.compliance as Record<string, unknown>;
    const soul = readFile(path.join(AGENT_DIR, "SOUL.md"));
    const rules = readFile(path.join(AGENT_DIR, "RULES.md"));
    const duties = readFile(path.join(AGENT_DIR, "DUTIES.md"));

    res.json({
      name: agent.name,
      version: agent.version,
      description: agent.description,
      model: {
        preferred: model.preferred,
        fallback: (model.fallback as string[]) || []
      },
      tools: (agent.tools as string[]) || [],
      skillNames: (agent.skills as string[]) || [],
      compliance: {
        riskLevel: compliance.risk_level,
        humanInTheLoop: compliance.human_in_the_loop,
        dataClassification: compliance.data_classification,
        regulatoryFrameworks: (compliance.regulatory_frameworks as string[]) || []
      },
      soulContent: soul,
      rulesContent: rules,
      dutiesContent: duties
    });
  } catch (e) {
    console.error("Agent info error:", e);
    res.status(500).json({ error: "Failed to load agent info" });
  }
});

router.get("/agent/skills", (_req, res) => {
  try {
    const skillsDir = path.join(AGENT_DIR, "skills");
    const skillNames = fs.readdirSync(skillsDir).filter(d =>
      fs.statSync(path.join(skillsDir, d)).isDirectory()
    );

    const lastUsedDates: Record<string, string> = {
      "variance-analysis": "2026-03-12T08:00:00Z",
      "board-deck-generation": "2026-03-12T07:00:00Z",
      "vendor-risk-scoring": "2026-03-12T07:30:00Z",
      "cash-flow-forecasting": "2026-03-12T07:15:00Z",
      "regulatory-filing": "2026-03-11T18:00:00Z",
      "expense-anomaly-detection": "2026-03-12T07:45:00Z"
    };

    const skills = skillNames.map(name => {
      const skillMd = readFile(path.join(skillsDir, name, "SKILL.md"));
      let description = name.replace(/-/g, " ");

      const frontmatter = skillMd.match(/---\n([\s\S]*?)\n---/);
      if (frontmatter) {
        const parsed = yaml.parse(frontmatter[1]) as Record<string, string>;
        description = parsed.description || description;
      } else {
        const purposeMatch = skillMd.match(/## Purpose\n+(.+)/);
        if (purposeMatch) {
          description = purposeMatch[1].trim().replace(/\.$/, '').substring(0, 120);
        }
      }

      const steps: string[] = [];
      const stepMatches = skillMd.matchAll(/### Step (\d+)[:\s]*(.+)/g);
      for (const m of stepMatches) steps.push(m[2].trim());

      const inputs: string[] = [];
      const filePatterns = [
        /`([^`]+\.(?:csv|json|yaml|xlsx|md))`/g,
        /Load.*?from `([^`]+)`/g,
        /Reading.*?`([^`]+)`/g,
      ];
      for (const pat of filePatterns) {
        const matches = skillMd.matchAll(pat);
        for (const m of matches) {
          const file = (m[1] || "").trim();
          if (file && file.length > 3 && !inputs.includes(file) && !file.includes(" ")) inputs.push(file);
        }
      }

      const outputs: string[] = [];
      const outputPatterns = [/[Gg]enerate[sd]?\s+(?:a\s+|the\s+)?(.+?)(?:\.|$)/gm, /[Oo]utput[s]?\s+(?:a\s+|the\s+)?(.+?)(?:\.|$)/gm];
      for (const pat of outputPatterns) {
        const om = skillMd.matchAll(pat);
        for (const m of om) {
          const out = m[1].trim().substring(0, 60);
          if (out.length > 5 && !outputs.includes(out)) outputs.push(out);
          if (outputs.length >= 5) break;
        }
      }

      return {
        name,
        description,
        status: "active",
        lastUsed: lastUsedDates[name] || new Date().toISOString(),
        steps,
        inputs: inputs.slice(0, 6),
        outputs: outputs.slice(0, 5),
      };
    });

    res.json(skills);
  } catch (e) {
    console.error("Skills list error:", e);
    res.status(500).json({ error: "Failed to load skills" });
  }
});

router.get("/agent/skills/:name", (req, res): void => {
  try {
    const skillDir = path.resolve(AGENT_DIR, "skills", req.params.name);
    if (!skillDir.startsWith(path.join(AGENT_DIR, "skills"))) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    if (!fs.existsSync(skillDir)) {
      res.status(404).json({ error: `Skill '${req.params.name}' not found` });
      return;
    }

    const skillMd = readFile(path.join(skillDir, "SKILL.md"));
    const frontmatter = skillMd.match(/---\n([\s\S]*?)\n---/);
    let description = req.params.name.replace(/-/g, " ");
    if (frontmatter) {
      const parsed = yaml.parse(frontmatter[1]) as Record<string, string>;
      description = parsed.description || description;
    }

    const scriptsDir = path.join(skillDir, "scripts");
    const scripts: { name: string; content: string }[] = [];
    if (fs.existsSync(scriptsDir)) {
      for (const file of fs.readdirSync(scriptsDir)) {
        scripts.push({
          name: file,
          content: readFile(path.join(scriptsDir, file))
        });
      }
    }

    res.json({
      name: req.params.name,
      description,
      content: skillMd,
      scripts
    });
  } catch (e) {
    console.error("Skill detail error:", e);
    res.status(500).json({ error: "Failed to load skill" });
  }
});

interface FileTreeNode {
  name: string;
  path: string;
  type: string;
  children?: FileTreeNode[];
}

function buildFileTree(dirPath: string, basePath: string = ""): FileTreeNode {
  const name = path.basename(dirPath);
  const relativePath = basePath ? `${basePath}/${name}` : name;
  const stat = fs.statSync(dirPath);

  if (!stat.isDirectory()) {
    return { name, path: relativePath, type: "file" };
  }

  const children = fs.readdirSync(dirPath)
    .filter(f => !f.startsWith("."))
    .sort((a, b) => {
      const aIsDir = fs.statSync(path.join(dirPath, a)).isDirectory();
      const bIsDir = fs.statSync(path.join(dirPath, b)).isDirectory();
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    })
    .map(child => buildFileTree(path.join(dirPath, child), relativePath));

  return { name, path: relativePath, type: "directory", children };
}

router.get("/agent/files", (_req, res) => {
  try {
    const tree = buildFileTree(AGENT_DIR);
    res.json(tree);
  } catch (e) {
    console.error("File tree error:", e);
    res.status(500).json({ error: "Failed to load file tree" });
  }
});

router.get("/agent/file", (req, res): void => {
  try {
    const requestedPath = req.query.path as string;
    if (!requestedPath) {
      res.status(400).json({ error: "path query parameter is required" });
      return;
    }
    const filePath = path.resolve(AGENT_DIR, requestedPath);
    if (!filePath.startsWith(AGENT_DIR)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const langMap: Record<string, string> = {
      ".yaml": "yaml", ".yml": "yaml", ".json": "json",
      ".md": "markdown", ".py": "python", ".ts": "typescript",
      ".js": "javascript", ".sh": "bash", ".txt": "text"
    };

    res.json({
      path: requestedPath,
      content: readFile(filePath),
      language: langMap[ext] || "text"
    });
  } catch (e) {
    console.error("File content error:", e);
    res.status(500).json({ error: "Failed to load file" });
  }
});

router.post("/agent/upload", (req, res): void => {
  try {
    const { directory, fileName, content } = req.body as {
      directory: string;
      fileName: string;
      content: string;
    };

    if (!directory || !fileName || !content) {
      res.status(400).json({ error: "directory, fileName, and content are required" });
      return;
    }

    if (fileName.includes("/") || fileName.includes("\\") || fileName.startsWith(".")) {
      res.status(400).json({ error: "Invalid file name" });
      return;
    }

    const targetDir = path.resolve(AGENT_DIR, directory);
    if (!targetDir.startsWith(AGENT_DIR)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, fileName);
    if (!filePath.startsWith(AGENT_DIR)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`[File Upload] Saved: ${directory}/${fileName} (${(content.length / 1024).toFixed(1)}KB)`);
    res.json({ success: true, path: `${directory}/${fileName}` });
  } catch (e) {
    console.error("File upload error:", e);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

router.get("/agent/compliance", (_req, res) => {
  try {
    const regMap = loadYaml(path.join(AGENT_DIR, "compliance/regulatory-map.yaml"));
    const schedule = loadYaml(path.join(AGENT_DIR, "compliance/validation-schedule.yaml"));
    const agent = loadYaml(path.join(AGENT_DIR, "agent.yaml"));
    const agentCompliance = agent.compliance as Record<string, unknown>;
    const recordkeeping = agentCompliance.recordkeeping as Record<string, unknown> | undefined;
    const review = agentCompliance.review as Record<string, unknown> | undefined;
    const frameworks = regMap.frameworks as Array<Record<string, string>>;
    const scheduleItems = schedule.schedule as Array<Record<string, string>>;

    res.json({
      riskLevel: agentCompliance.risk_level,
      humanInTheLoop: agentCompliance.human_in_the_loop,
      dataClassification: agentCompliance.data_classification,
      regulatoryFrameworks: frameworks.map((f) => ({
        name: f.name,
        status: f.status,
        lastValidated: f.last_validated
      })),
      auditLogging: recordkeeping?.audit_logging ?? true,
      retentionDays: recordkeeping?.retention_days ?? 2555,
      reviewCadence: review?.cadence ?? "quarterly",
      approvers: (review?.approvers as string[]) ?? [],
      validationChecks: scheduleItems.map((s) => ({
        name: s.name,
        status: s.status,
        nextDue: s.next_due
      }))
    });
  } catch (e) {
    console.error("Compliance error:", e);
    res.status(500).json({ error: "Failed to load compliance" });
  }
});

export default router;
