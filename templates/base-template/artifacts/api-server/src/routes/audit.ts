import { Router } from "express";
import { listAudit, appendAudit, parseAuditType, listRuns } from "../lib/audit-log";

const router = Router();

router.get("/audit/events", (req, res) => {
  const { journey, runId, limit } = req.query;
  const lim = limit ? Math.min(1000, parseInt(String(limit), 10) || 200) : 200;
  const entries = listAudit({
    limit: lim,
    journey: journey ? String(journey) : undefined,
    runId: runId ? String(runId) : undefined,
  });
  res.json({ events: entries });
});

router.post("/audit/events", (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (!body || typeof body.actor !== "string" || typeof body.action !== "string") {
    res.status(400).json({ error: "actor and action required" });
    return;
  }
  const entry = appendAudit({
    type: parseAuditType(body.type),
    actor: String(body.actor),
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

router.get("/audit/runs", (req, res) => {
  const { journey } = req.query;
  res.json({ runs: listRuns(journey ? String(journey) : undefined) });
});

router.get("/journey/runs/:runId", (req, res) => {
  const runId = req.params.runId;
  const entries = listAudit({ limit: 1000, runId });
  if (entries.length === 0) {
    res.status(404).json({ error: `Run ${runId} not found` });
    return;
  }
  const sorted = [...entries].sort((a, b) => a.ts.localeCompare(b.ts));
  const journey = sorted[0].journey;
  const startedAt = sorted[0].ts;
  const lastAt = sorted[sorted.length - 1].ts;
  const lifecycle = sorted.filter(e => e.type === "run_lifecycle");
  let status = "running";
  for (const l of lifecycle) {
    if (l.action.includes("complete")) status = "complete";
    else if (l.action.includes("halted") || l.action.includes("rejected")) status = "halted";
  }
  res.json({
    runId,
    journey,
    startedAt,
    lastAt,
    status,
    eventCount: entries.length,
    events: sorted,
  });
});

export default router;
