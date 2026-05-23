export const AUDIT_TYPES = [
  "agent_action",
  "user_decision",
  "system_event",
  "guardrail_trigger",
  "tool_call",
  "skill_invocation",
  "approval_gate",
  "notification",
  "delta",
  "scenario_run",
  "run_lifecycle",
] as const;

export type AuditType = typeof AUDIT_TYPES[number];

export function parseAuditType(value: unknown): AuditType {
  if (typeof value === "string" && (AUDIT_TYPES as readonly string[]).includes(value)) {
    return value as AuditType;
  }
  return "agent_action";
}

export interface AuditLogEntry {
  id: string;
  ts: string;
  type: AuditType;
  actor: string;
  action: string;
  details: string;
  journey?: string;
  runId?: string;
  eventId?: string;
  entity?: string;
  meta?: Record<string, unknown>;
}

const MAX_ENTRIES = 1000;
const log: AuditLogEntry[] = [];
let counter = 1;

export function appendAudit(entry: Omit<AuditLogEntry, "id" | "ts"> & { id?: string; ts?: string }): AuditLogEntry {
  const id = entry.id ?? `AE-${String(Date.now()).slice(-6)}-${counter++}`;
  const ts = entry.ts ?? new Date().toISOString();
  const full: AuditLogEntry = { ...entry, id, ts };
  log.unshift(full);
  if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES;
  return full;
}

export interface ListAuditOptions {
  limit?: number;
  journey?: string;
  runId?: string;
}

export function listAudit(opts: ListAuditOptions | number = 200, journey?: string): AuditLogEntry[] {
  const o: ListAuditOptions = typeof opts === "number" ? { limit: opts, journey } : opts;
  const lim = o.limit ?? 200;
  let filtered = log;
  if (o.journey) filtered = filtered.filter(e => e.journey === o.journey);
  if (o.runId) filtered = filtered.filter(e => e.runId === o.runId);
  return filtered.slice(0, lim);
}

export function listRuns(journey?: string): { runId: string; journey?: string; startedAt: string; lastAt: string; eventCount: number; status: string }[] {
  const map = new Map<string, { runId: string; journey?: string; startedAt: string; lastAt: string; eventCount: number; status: string }>();
  for (const e of log) {
    if (!e.runId) continue;
    if (journey && e.journey !== journey) continue;
    const cur = map.get(e.runId);
    if (!cur) {
      map.set(e.runId, { runId: e.runId, journey: e.journey, startedAt: e.ts, lastAt: e.ts, eventCount: 1, status: "running" });
    } else {
      cur.eventCount += 1;
      if (e.ts < cur.startedAt) cur.startedAt = e.ts;
      if (e.ts > cur.lastAt) cur.lastAt = e.ts;
    }
    const r = map.get(e.runId)!;
    if (e.type === "run_lifecycle") {
      if (e.action.includes("complete")) r.status = "complete";
      else if (e.action.includes("halted") || e.action.includes("rejected")) r.status = "halted";
      else if (e.action.includes("started")) r.status = r.status === "running" ? "running" : r.status;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export function clearAudit(): void {
  log.length = 0;
}
