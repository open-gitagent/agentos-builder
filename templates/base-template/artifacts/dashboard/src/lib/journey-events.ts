// Generic integration "systems" the agent reads from. Rename / extend to match
// your domain; keep in sync with the backend SourceSystem (journey-analyze.ts)
// and SYSTEM_REGISTRY (lib/tool-registry.ts).
export type SourceSystem =
  | "erp"
  | "database"
  | "api"
  | "warehouse"
  | "messaging"
  | "internal";

export type JourneyEventStatus = "pending" | "running" | "ok" | "failed" | "awaiting" | "approved" | "rejected" | "skipped";

export interface BaseEvent {
  id: string;
  ts: string;
  status: JourneyEventStatus;
  durationMs?: number;
}

export interface SkillInvocationEvent extends BaseEvent {
  type: "skill_invocation";
  skill: string;
  label: string;
  detail?: string;
}

export interface ToolCallEvent extends BaseEvent {
  type: "tool_call";
  system: SourceSystem;
  verb: string;
  args: Record<string, string | number | boolean>;
  latencyMs: number;
  rowCount?: number;
  rawPreview?: string;
  fileName?: string;
}

export interface ApprovalGateEvent extends BaseEvent {
  type: "approval_gate";
  gateId: string;
  title: string;
  rationale: string;
  threshold?: string;
  approvers: string[];
  approverRoles?: string[];
  slaMinutes?: number;
  triggeredAt?: string;
  dualControl: boolean;
  insertAfterStep?: string;
  insertAfterStepTitle?: string;
  decision?: "approved" | "rejected";
  decidedBy?: string;
  comment?: string;
  firstApprover?: { name: string; role?: string; ts: string; comment?: string };
  secondApprover?: { name: string; role?: string; ts: string; comment?: string };
}

export interface NotificationEvent extends BaseEvent {
  type: "notification";
  channel: "slack" | "email" | "regulator-portal";
  recipient: string;
  subject: string;
}

export interface AuditEventLog extends BaseEvent {
  type: "audit_event";
  actor: string;
  action: string;
  details: string;
  journey?: string;
}

export interface DeltaEvent extends BaseEvent {
  type: "delta";
  metric: string;
  before: string | number;
  after: string | number;
  unit?: string;
  direction?: "up" | "down" | "flat";
  rationale?: string;
}

export type JourneyEvent =
  | SkillInvocationEvent
  | ToolCallEvent
  | ApprovalGateEvent
  | NotificationEvent
  | AuditEventLog
  | DeltaEvent;

export type RunnerPhase =
  | "idle"
  | "pipeline"
  | "awaiting_approval"
  | "paused"
  | "analyzing"
  | "complete"
  | "halted";
