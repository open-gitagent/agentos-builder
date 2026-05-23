import { Router } from "express";
import { getModel } from "@mariozechner/pi-ai";
import type { GCMessage } from "gitclaw";
import { AGENT_DIR } from "../lib/agent-dir";

const router = Router();

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
    console.log(`[GitClaw] Patched ${ANTHROPIC_MODELS.length} Anthropic model(s) to use Replit proxy: ${baseUrl}`);
  }
}

function sseWrite(res: any, event: string, data: object): boolean {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    return false;
  }
}

function toolNameToEventType(toolName: string): string {
  switch (toolName) {
    case "read":
      return "file_fetch";
    case "write":
      return "file_write";
    case "memory":
      return "memory_update";
    case "cli":
      return "tool_use";
    case "task_tracker":
      return "skill_loading";
    case "skill_learner":
      return "skill_loading";
    default:
      return "tool_use";
  }
}

function extractFileFromArgs(args: Record<string, any>): string {
  return args.file_path || args.path || args.file || "";
}

router.post("/agent/chat", async (req, res): Promise<void> => {
  try {
    bridgeReplitEnv();

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(503).json({
        error: "Anthropic AI integration is not configured. Please add the Anthropic integration in your Replit project settings.",
      });
      return;
    }

    const { messages, sessionId, page, pageData } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
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

    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage.content;

    // Pass the current page as lightweight context. Add per-journey guidance
    // here if a page benefits from a more specific framing.
    let contextSuffix = "";
    if (page) {
      contextSuffix = `The user is on the "${page}" page. Tailor your answer to that context.`;
    }

    if (pageData) {
      contextSuffix += `\n\nCurrently visible data on the page:\n${JSON.stringify(pageData, null, 2)}`;
    }

    sseWrite(res, "system_read", {
      file: "agent/agent.yaml",
      action: "Loading agent via GitClaw...",
    });

    try {
      const { query } = await import("gitclaw");

      const stream = query({
        prompt: userContent,
        dir: AGENT_DIR,
        model: "anthropic:claude-sonnet-4-6",
        sessionId: sessionId || undefined,
        abortController,
        maxTurns: 10,
        constraints: { maxTokens: 8192 },
        systemPromptSuffix: contextSuffix || undefined,
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
            const eventType = toolNameToEventType(tu.toolName);
            const filePath = extractFileFromArgs(tu.args);

            sseWrite(res, eventType, {
              file: filePath || undefined,
              skill: tu.toolName,
              action: `${tu.toolName}(${filePath || JSON.stringify(tu.args).substring(0, 80)})`,
              tool: tu.toolName,
              args: tu.args,
            });
            break;
          }

          case "tool_result": {
            const tr = msg as Extract<GCMessage, { type: "tool_result" }>;
            const eventType = tr.toolName === "memory" ? "memory_update" : "tool_result";
            const preview = tr.content ? tr.content.substring(0, 300) : "";

            sseWrite(res, eventType, {
              tool: tr.toolName,
              status: tr.isError ? "error" : "loaded",
              content: preview,
              file: tr.toolName === "memory" ? "agent/memory/MEMORY.md" : undefined,
              action: tr.isError ? `Error: ${preview}` : `Loaded ${tr.toolName} result`,
            });
            break;
          }

          case "system": {
            const sys = msg as Extract<GCMessage, { type: "system" }>;
            if (sys.subtype === "error") {
              sseWrite(res, "error", { error: sys.content });
            } else {
              sseWrite(res, "system_read", {
                action: sys.content,
                file: `system:${sys.subtype}`,
              });
            }
            break;
          }

          case "assistant": {
            const asst = msg as Extract<GCMessage, { type: "assistant" }>;
            if (asst.content && asst.stopReason !== "toolUse") {
              sseWrite(res, "done", {
                finished: true,
                usage: asst.usage,
                model: asst.model,
              });
            }
            break;
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[GitClaw] Stream error:", errorMessage);

      if (errorMessage.includes("authentication") || errorMessage.includes("API key") || errorMessage.includes("401")) {
        sseWrite(res, "error", {
          error: "Anthropic API key is invalid or expired. Please check your Anthropic integration settings.",
        });
      } else if (errorMessage.includes("UNSUPPORTED_MODEL") || errorMessage.includes("model")) {
        sseWrite(res, "error", {
          error: `Model not available: ${errorMessage}`,
        });
      } else {
        sseWrite(res, "error", {
          error: `Agent error: ${errorMessage}`,
        });
      }
    }

    if (!res.writableEnded) {
      sseWrite(res, "done", { finished: true });
      res.end();
    }
  } catch (error: unknown) {
    console.error("Chat endpoint error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to AI service";
    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    } else {
      sseWrite(res, "error", { error: errorMessage });
      res.end();
    }
  }
});

export default router;
