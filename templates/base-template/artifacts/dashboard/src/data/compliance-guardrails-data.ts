import {
  Landmark,
  ShieldCheck,
  Scale,
  FileText,
  Building2,
  Lock,
  CreditCard,
  Gavel,
  Globe,
  Bot,
  Eye,
  Banknote,
  type LucideIcon,
} from "lucide-react";

export type ComplianceStatus = "clean" | "watch" | "breach";

// Generic "scope" tags. Rename / extend to match where each policy applies in
// your organization. Kept as a small fixed set so the jurisdiction filter stays
// useful as a demonstration.
export type Jurisdiction =
  | "Organization"
  | "Platform"
  | "Workspace"
  | "External"
  | "Global";

// Generic policy domains. These group the policy cards on the page.
export type PolicyDomain =
  | "Data Privacy"
  | "Access Control"
  | "Output Safety"
  | "Approvals"
  | "Audit & Logging"
  | "Reliability"
  | "AI Governance";

export interface TrackedClause {
  ref: string;
  title: string;
  effective: string;
  pendingAmendment?: string;
}

export interface PolicyEntry {
  id: string;
  short: string;
  full: string;
  domain: PolicyDomain;
  jurisdiction: Jurisdiction;
  status: ComplianceStatus;
  sourceUrl: string;
  sourceLabel: string;
  lastRefreshed: string;
  rulesIngested: number;
  rulesChangedLastSync: number;
  description: string;
  clauses: TrackedClause[];
}

// Each entry is a generic policy the platform adheres to. Replace these with
// your own internal policies and standards — the shape is what matters.
export const POLICY_ENTRIES: PolicyEntry[] = [
  // Data Privacy
  {
    id: "data-privacy",
    short: "Data Privacy",
    full: "Data Privacy Policy",
    domain: "Data Privacy",
    jurisdiction: "Organization",
    status: "clean",
    sourceUrl: "https://example.com/policies/data-privacy",
    sourceLabel: "policies/data-privacy",
    lastRefreshed: "6h ago",
    rulesIngested: 184,
    rulesChangedLastSync: 2,
    description: "How personal and sensitive data is collected, processed, and minimized across agent runs.",
    clauses: [
      { ref: "DP-1", title: "Data minimization", effective: "2024-01-01" },
      { ref: "DP-2", title: "Purpose limitation", effective: "2024-01-01" },
      { ref: "DP-3", title: "Subject access handling", effective: "2024-01-01" },
      { ref: "DP-4", title: "Breach notification window", effective: "2024-06-18" },
      { ref: "DP-5", title: "Cross-system transfer rules", effective: "2024-01-01" },
    ],
  },
  {
    id: "pii-redaction",
    short: "PII Redaction",
    full: "PII Redaction Standard",
    domain: "Data Privacy",
    jurisdiction: "Platform",
    status: "watch",
    sourceUrl: "https://example.com/policies/pii-redaction",
    sourceLabel: "policies/pii-redaction",
    lastRefreshed: "6h ago",
    rulesIngested: 42,
    rulesChangedLastSync: 0,
    description: "Detection and masking of personal data in inputs, outputs, and agent traces.",
    clauses: [
      { ref: "PII-1", title: "Detection on ingest", effective: "2024-01-01" },
      { ref: "PII-2", title: "Masking before storage", effective: "2024-01-01" },
      { ref: "PII-3", title: "Redaction in logs", effective: "2024-01-01", pendingAmendment: "Free-text scrubbing v2 under review" },
      { ref: "PII-4", title: "Right to erasure support", effective: "2024-01-01" },
    ],
  },

  // Access Control
  {
    id: "access-control",
    short: "Access Control",
    full: "Access Control Policy",
    domain: "Access Control",
    jurisdiction: "Organization",
    status: "clean",
    sourceUrl: "https://example.com/policies/access-control",
    sourceLabel: "policies/access-control",
    lastRefreshed: "6h ago",
    rulesIngested: 67,
    rulesChangedLastSync: 1,
    description: "Authentication, authorization, and least-privilege access for agents and users.",
    clauses: [
      { ref: "AC-1", title: "Role-based access (RBAC)", effective: "2024-01-01" },
      { ref: "AC-2", title: "Least-privilege defaults", effective: "2024-01-01" },
      { ref: "AC-3", title: "Skill boundary enforcement", effective: "2024-01-01" },
      { ref: "AC-4", title: "Periodic access review", effective: "2025-12-15", pendingAmendment: "Quarterly cadence proposed" },
    ],
  },

  // Output Safety
  {
    id: "output-safety",
    short: "Output Safety",
    full: "Output Safety Policy",
    domain: "Output Safety",
    jurisdiction: "Organization",
    status: "clean",
    sourceUrl: "https://example.com/policies/output-safety",
    sourceLabel: "policies/output-safety",
    lastRefreshed: "5h ago",
    rulesIngested: 312,
    rulesChangedLastSync: 4,
    description: "Grounding, hallucination prevention, and safe content generation for agent output.",
    clauses: [
      { ref: "OS-1", title: "Grounding on retrieved evidence", effective: "2024-01-01" },
      { ref: "OS-2", title: "Hallucination guard", effective: "2024-01-01" },
      { ref: "OS-3", title: "Citation required on assertions", effective: "2024-01-01" },
      { ref: "OS-4", title: "Unsafe content filter", effective: "2024-01-01" },
      { ref: "OS-5", title: "AI-content disclosure", effective: "2025-12-15", pendingAmendment: "Disclosure marker rollout in flight" },
    ],
  },
  {
    id: "grounding",
    short: "Grounding",
    full: "Grounding & Citation Standard",
    domain: "Output Safety",
    jurisdiction: "Global",
    status: "watch",
    sourceUrl: "https://example.com/policies/grounding",
    sourceLabel: "policies/grounding",
    lastRefreshed: "5h ago",
    rulesIngested: 41,
    rulesChangedLastSync: 1,
    description: "Every factual claim must trace to a retrieved source or be quarantined.",
    clauses: [
      { ref: "GR-A", title: "Source attached to claim", effective: "2024-01-01" },
      { ref: "GR-B", title: "Quarantine unsupported claims", effective: "2024-01-01" },
      { ref: "GR-C", title: "Confidence scoring", effective: "2025-01-01", pendingAmendment: "Threshold tuning in progress" },
    ],
  },

  // Approvals
  {
    id: "approval-policy",
    short: "Approval Policy",
    full: "Approval & Threshold Policy",
    domain: "Approvals",
    jurisdiction: "Organization",
    status: "watch",
    sourceUrl: "https://example.com/policies/approvals",
    sourceLabel: "policies/approvals",
    lastRefreshed: "6h ago",
    rulesIngested: 14,
    rulesChangedLastSync: 0,
    description: "Threshold-based approval gates and human-in-the-loop sign-off.",
    clauses: [
      { ref: "AP-1", title: "Reviewer sign-off above threshold", effective: "2024-01-01" },
      { ref: "AP-2", title: "Dual approval for large batches", effective: "2024-01-01" },
      { ref: "AP-3", title: "No self-approval", effective: "2024-01-01" },
      { ref: "AP-4", title: "Override justification capture", effective: "2024-01-01" },
      { ref: "AP-5", title: "Escalation routing", effective: "2024-01-01" },
    ],
  },
  {
    id: "thresholds",
    short: "Thresholds",
    full: "Processing Threshold Standard",
    domain: "Approvals",
    jurisdiction: "Platform",
    status: "watch",
    sourceUrl: "https://example.com/policies/thresholds",
    sourceLabel: "policies/thresholds",
    lastRefreshed: "6h ago",
    rulesIngested: 96,
    rulesChangedLastSync: 3,
    description: "Batch-size and value limits that route work to review when exceeded.",
    clauses: [
      { ref: "TH-1", title: "Auto-approve under 1,000 records", effective: "2024-01-01" },
      { ref: "TH-2", title: "Review queue above threshold", effective: "2024-01-01" },
      { ref: "TH-3", title: "Quality score floor (0.90)", effective: "2024-01-01" },
      { ref: "TH-4", title: "Owner sign-off for high-impact", effective: "2025-01-01", pendingAmendment: "Threshold review Q3 2026" },
    ],
  },

  // Audit & Logging
  {
    id: "audit-logging",
    short: "Audit Logging",
    full: "Audit Logging Policy",
    domain: "Audit & Logging",
    jurisdiction: "Organization",
    status: "clean",
    sourceUrl: "https://example.com/policies/audit-logging",
    sourceLabel: "policies/audit-logging",
    lastRefreshed: "6h ago",
    rulesIngested: 38,
    rulesChangedLastSync: 0,
    description: "Immutable, traceable logging of all agent actions and decisions.",
    clauses: [
      { ref: "AL-1", title: "Append-only action log", effective: "2024-01-01" },
      { ref: "AL-2", title: "Hash-chained entries", effective: "2024-01-01" },
      { ref: "AL-3", title: "Reviewer identity on overrides", effective: "2024-01-01" },
    ],
  },
  {
    id: "retention",
    short: "Data Retention",
    full: "Data Retention Policy",
    domain: "Audit & Logging",
    jurisdiction: "External",
    status: "breach",
    sourceUrl: "https://example.com/policies/retention",
    sourceLabel: "policies/retention",
    lastRefreshed: "6h ago",
    rulesIngested: 22,
    rulesChangedLastSync: 0,
    description: "Storage duration, archival, and deletion of records and traces.",
    clauses: [
      { ref: "RT-1", title: "Quarterly retention sweep", effective: "2024-01-01", pendingAmendment: "Sweep overdue — due in 3 days" },
      { ref: "RT-2", title: "Deletion on expiry", effective: "2024-04-01" },
    ],
  },

  // Reliability
  {
    id: "reliability",
    short: "Reliability",
    full: "Service Reliability Standard",
    domain: "Reliability",
    jurisdiction: "Platform",
    status: "clean",
    sourceUrl: "https://example.com/policies/reliability",
    sourceLabel: "policies/reliability",
    lastRefreshed: "5h ago",
    rulesIngested: 71,
    rulesChangedLastSync: 1,
    description: "Uptime, latency budgets, and graceful degradation targets.",
    clauses: [
      { ref: "RL-1", title: "Uptime target (99%)", effective: "2024-01-01" },
      { ref: "RL-2", title: "Latency budget per step", effective: "2024-01-01" },
      { ref: "RL-3", title: "Graceful degradation", effective: "2024-01-01" },
    ],
  },

  // AI Governance
  {
    id: "ai-governance",
    short: "AI Governance",
    full: "AI Governance Framework",
    domain: "AI Governance",
    jurisdiction: "Global",
    status: "watch",
    sourceUrl: "https://example.com/policies/ai-governance",
    sourceLabel: "policies/ai-governance",
    lastRefreshed: "5h ago",
    rulesIngested: 53,
    rulesChangedLastSync: 2,
    description: "Risk classification, oversight, and documentation for deployed agents.",
    clauses: [
      { ref: "AI-1", title: "Risk-tier classification", effective: "2026-08-02" },
      { ref: "AI-2", title: "Data governance", effective: "2026-08-02" },
      { ref: "AI-3", title: "Human oversight on high-risk steps", effective: "2026-08-02", pendingAmendment: "Oversight guidance expected Q3 2026" },
      { ref: "AI-4", title: "Transparency for generated content", effective: "2026-08-02" },
      { ref: "AI-5", title: "Model documentation", effective: "2025-08-02" },
    ],
  },
  {
    id: "model-risk",
    short: "Model Risk",
    full: "Model Risk Management Standard",
    domain: "AI Governance",
    jurisdiction: "Organization",
    status: "clean",
    sourceUrl: "https://example.com/policies/model-risk",
    sourceLabel: "policies/model-risk",
    lastRefreshed: "7h ago",
    rulesIngested: 18,
    rulesChangedLastSync: 0,
    description: "Lifecycle controls for evaluating and monitoring deployed models.",
    clauses: [
      { ref: "MR-1", title: "Pre-deployment evaluation", effective: "2024-01-26" },
      { ref: "MR-2", title: "Ongoing monitoring", effective: "2024-01-26" },
      { ref: "MR-3", title: "Impact assessment on file", effective: "2024-01-26" },
      { ref: "MR-4", title: "Periodic revalidation", effective: "2024-07-26" },
    ],
  },
];

export const POLICY_DOMAINS: { domain: PolicyDomain; icon: LucideIcon; color: string }[] = [
  { domain: "Data Privacy", icon: Lock, color: "text-accent" },
  { domain: "Access Control", icon: ShieldCheck, color: "text-success" },
  { domain: "Output Safety", icon: Scale, color: "text-accent" },
  { domain: "Approvals", icon: FileText, color: "text-primary" },
  { domain: "Audit & Logging", icon: Eye, color: "text-foreground" },
  { domain: "Reliability", icon: Building2, color: "text-primary" },
  { domain: "AI Governance", icon: Bot, color: "text-warning" },
];

export const ALL_JURISDICTIONS: Jurisdiction[] = [
  "Organization",
  "Platform",
  "Workspace",
  "External",
  "Global",
];

export interface SyncEvent {
  date: string;
  timestamp: string;
  rulesIngested: number;
  rulesChanged: number;
  newAdvisories: number;
  status: "ok" | "retry" | "failed";
  note?: string;
}

// Derived totals — guarantee the hero numbers and the per-card numbers agree.
const TOTAL_RULES_INGESTED = POLICY_ENTRIES.reduce((s, b) => s + b.rulesIngested, 0);
const TOTAL_RULES_CHANGED_LAST_SYNC = POLICY_ENTRIES.reduce(
  (s, b) => s + b.rulesChangedLastSync,
  0,
);

export const SYNC_HISTORY: SyncEvent[] = [
  {
    date: "May 23, 2026",
    timestamp: "04:00 UTC",
    rulesIngested: TOTAL_RULES_INGESTED,
    rulesChanged: TOTAL_RULES_CHANGED_LAST_SYNC,
    newAdvisories: 3,
    status: "ok",
    note: "Today — Output Safety v2 rules ingested, AI Governance oversight guidance draft detected.",
  },
  {
    date: "May 22, 2026",
    timestamp: "04:00 UTC",
    rulesIngested: 985,
    rulesChanged: 28,
    newAdvisories: 1,
    status: "ok",
  },
  {
    date: "May 21, 2026",
    timestamp: "04:00 UTC",
    rulesIngested: 957,
    rulesChanged: 41,
    newAdvisories: 2,
    status: "retry",
    note: "Policy source endpoint 503 on first attempt — retried successfully at 04:08 UTC.",
  },
  {
    date: "May 20, 2026",
    timestamp: "04:00 UTC",
    rulesIngested: 916,
    rulesChanged: 12,
    newAdvisories: 0,
    status: "ok",
  },
  {
    date: "May 19, 2026",
    timestamp: "04:00 UTC",
    rulesIngested: 904,
    rulesChanged: 9,
    newAdvisories: 0,
    status: "ok",
  },
  {
    date: "May 18, 2026",
    timestamp: "04:00 UTC",
    rulesIngested: 895,
    rulesChanged: 33,
    newAdvisories: 2,
    status: "ok",
  },
  {
    date: "May 17, 2026",
    timestamp: "04:00 UTC",
    rulesIngested: 862,
    rulesChanged: 47,
    newAdvisories: 4,
    status: "ok",
    note: "Weekly refresh — Access Control review-cadence guidance v3 picked up.",
  },
];

export const PIPELINE_STAGES = [
  {
    id: "publish",
    title: "Policy sources",
    detail: "Data Privacy · Access Control · Output Safety · Approvals · Audit & Logging · Reliability · AI Governance",
    icon: Globe,
  },
  {
    id: "ingest",
    title: "Policy Intelligence node",
    detail: "Pulls source-of-truth policy text every 24h via signed feeds & internal APIs",
    icon: Banknote,
  },
  {
    id: "diff",
    title: "Diff & classify",
    detail: "LLM + rule engine flags new / amended / withdrawn clauses by domain",
    icon: Scale,
  },
  {
    id: "corpus",
    title: "Update rule corpus",
    detail: "Versioned, citation-anchored knowledge base shared across agents",
    icon: FileText,
  },
  {
    id: "evaluate",
    title: "Re-evaluate guardrails",
    detail: "Active guardrails recomputed; pass/warn/fail rolled up to policies",
    icon: ShieldCheck,
  },
];

export type GuardrailStatus = "passing" | "warning" | "failing";

export type GuardrailCategory =
  | "Data Integrity"
  | "Approval Thresholds"
  | "Reliability"
  | "AI Safety"
  | "Privacy"
  | "Abuse Prevention"
  | "Access"
  | "Audit Trail";

export interface GuardrailRule {
  id: string;
  name: string;
  category: GuardrailCategory;
  description: string;
  status: GuardrailStatus;
  lastChecked: string;
  enforcesBodyId: string;
  enforcesClause: string;
  remediation?: string;
  details?: string;
}

export const GUARDRAILS: GuardrailRule[] = [
  // Data Integrity
  { id: "GR-001", name: "No fabrication of values", category: "Data Integrity", description: "Every value in agent output must trace to a source artifact — synthesized values are blocked at render.", status: "passing", lastChecked: "3 min ago", enforcesBodyId: "output-safety", enforcesClause: "OS-3" },
  { id: "GR-002", name: "Record counts reconcile", category: "Data Integrity", description: "Output record counts must reconcile with input counts within a 1-record tolerance.", status: "passing", lastChecked: "8 min ago", enforcesBodyId: "reliability", enforcesClause: "RL-1" },
  { id: "GR-003", name: "Citation required on every assertion", category: "Data Integrity", description: "Agent assertions must include a source citation (record id, document hash, or source URL).", status: "passing", lastChecked: "3 min ago", enforcesBodyId: "grounding", enforcesClause: "GR-A" },
  { id: "GR-004", name: "Data lineage end-to-end", category: "Data Integrity", description: "Aggregated metrics must carry full lineage from source system to report cell.", status: "warning", lastChecked: "32 min ago", enforcesBodyId: "audit-logging", enforcesClause: "AL-1", remediation: "Lineage break detected on one data feed — re-run lineage capture." },

  // Approval Thresholds
  { id: "GR-005", name: "Reviewer sign-off above batch threshold", category: "Approval Thresholds", description: "Batches above 1,000 records require Reviewer sign-off before processing.", status: "warning", lastChecked: "2h ago", enforcesBodyId: "approval-policy", enforcesClause: "AP-1", details: "1 batch of 1,284 records pending Reviewer approval", remediation: "Route batch DI-001 to the Reviewer queue." },
  { id: "GR-006", name: "Owner sign-off for high-impact", category: "Approval Thresholds", description: "High-impact runs require both Reviewer and Owner sign-off.", status: "passing", lastChecked: "1d ago", enforcesBodyId: "approval-policy", enforcesClause: "AP-2" },
  { id: "GR-007", name: "Four-eyes on sensitive actions", category: "Approval Thresholds", description: "Sensitive actions require a dual approver (no self-approval).", status: "passing", lastChecked: "12 min ago", enforcesBodyId: "approval-policy", enforcesClause: "AP-3" },
  { id: "GR-008", name: "Off-cycle run block", category: "Approval Thresholds", description: "Manual off-cycle runs require Operations + Owner approval and are capped in size.", status: "passing", lastChecked: "1h ago", enforcesBodyId: "thresholds", enforcesClause: "TH-2" },

  // Reliability
  { id: "GR-009", name: "Uptime headroom above target", category: "Reliability", description: "Service uptime must remain above the configured target with headroom for incidents.", status: "warning", lastChecked: "6h ago", enforcesBodyId: "reliability", enforcesClause: "RL-1", details: "Headroom to uptime target: 0.4pp", remediation: "Investigate elevated Data Source latency adding to cycle time." },
  { id: "GR-010", name: "Latency budget per step", category: "Reliability", description: "Each pipeline step must complete within its configured latency budget.", status: "passing", lastChecked: "6h ago", enforcesBodyId: "reliability", enforcesClause: "RL-2" },
  { id: "GR-011", name: "Throughput alert at 90%", category: "Reliability", description: "Throughput must stay above the floor — early warning at 90% of target.", status: "passing", lastChecked: "30 min ago", enforcesBodyId: "reliability", enforcesClause: "RL-3" },
  { id: "GR-012", name: "Quality score floor", category: "Reliability", description: "Auto-handled rate maintained above the configured quality floor.", status: "passing", lastChecked: "5h ago", enforcesBodyId: "thresholds", enforcesClause: "TH-3" },
  { id: "GR-013", name: "Retention sweep on time", category: "Reliability", description: "Quarterly retention sweep completed at least 1 day before the deadline.", status: "failing", lastChecked: "2h ago", enforcesBodyId: "retention", enforcesClause: "RT-1", details: "Sweep not yet started — due in 3 days.", remediation: "Schedule the retention sweep and confirm archival targets." },
  { id: "GR-014", name: "Threshold consistency", category: "Reliability", description: "Threshold transitions must follow defined triggers; manual overrides require documented rationale.", status: "passing", lastChecked: "5h ago", enforcesBodyId: "thresholds", enforcesClause: "TH-4" },

  // AI Safety
  { id: "GR-015", name: "Hallucination guard on agent output", category: "AI Safety", description: "Every assertion is grounded in retrieved evidence; unsupported claims are quarantined.", status: "passing", lastChecked: "3 min ago", enforcesBodyId: "output-safety", enforcesClause: "OS-2" },
  { id: "GR-016", name: "Human-in-the-loop on high-risk steps", category: "AI Safety", description: "All decisions classified as high-risk require explicit reviewer confirmation.", status: "passing", lastChecked: "9 min ago", enforcesBodyId: "ai-governance", enforcesClause: "AI-3" },
  { id: "GR-017", name: "AI-generated content disclosure", category: "AI Safety", description: "Outbound documents drafted by an agent must carry a machine-readable AI-content marker.", status: "warning", lastChecked: "1h ago", enforcesBodyId: "output-safety", enforcesClause: "OS-5", remediation: "Marker missing on 4 documents drafted today — re-render before send." },
  { id: "GR-018", name: "Model risk classification recorded", category: "AI Safety", description: "Each deployed agent has a current risk-tier classification and impact assessment on file.", status: "passing", lastChecked: "1d ago", enforcesBodyId: "model-risk", enforcesClause: "MR-3" },
  { id: "GR-019", name: "Prompt injection defence", category: "AI Safety", description: "Untrusted document content is sandboxed; tool calls extracted from documents require operator confirmation.", status: "passing", lastChecked: "16 min ago", enforcesBodyId: "model-risk", enforcesClause: "MR-2" },

  // Privacy
  { id: "GR-020", name: "PII redaction in agent logs", category: "Privacy", description: "Personal data is redacted from agent traces and analytics by default.", status: "passing", lastChecked: "3 min ago", enforcesBodyId: "pii-redaction", enforcesClause: "PII-3" },
  { id: "GR-021", name: "Subject request turnaround", category: "Privacy", description: "Subject access requests fulfilled within the configured window, with buffer to the policy limit.", status: "passing", lastChecked: "4h ago", enforcesBodyId: "data-privacy", enforcesClause: "DP-3" },
  { id: "GR-022", name: "Cross-system transfer controls", category: "Privacy", description: "Personal-data transfers between systems covered by an approved mechanism.", status: "passing", lastChecked: "1d ago", enforcesBodyId: "data-privacy", enforcesClause: "DP-5" },
  { id: "GR-023", name: "Erasure propagated downstream", category: "Privacy", description: "Erasure requests propagated to all downstream processors within the configured window.", status: "passing", lastChecked: "6h ago", enforcesBodyId: "pii-redaction", enforcesClause: "PII-4" },

  // Abuse Prevention
  { id: "GR-024", name: "Duplicate record detection", category: "Abuse Prevention", description: "Agent flags records matching prior submissions on key fields within a defined window.", status: "passing", lastChecked: "1h ago", enforcesBodyId: "approval-policy", enforcesClause: "AP-1" },
  { id: "GR-025", name: "Connector change cool-down", category: "Abuse Prevention", description: "New connector credentials require a 48h cool-down + verification before first use.", status: "warning", lastChecked: "3h ago", enforcesBodyId: "access-control", enforcesClause: "AC-3", remediation: "2 connector changes from today still inside cool-down window — held." },
  { id: "GR-026", name: "Anomaly pattern detection", category: "Abuse Prevention", description: "Unusual same-session patterns between related entities surfaced for review.", status: "passing", lastChecked: "45 min ago", enforcesBodyId: "output-safety", enforcesClause: "OS-4" },

  // Access
  { id: "GR-027", name: "Least-privilege check on every action", category: "Access", description: "Each tool call is checked against the agent's granted scopes before execution.", status: "passing", lastChecked: "1 min ago", enforcesBodyId: "access-control", enforcesClause: "AC-2" },
  { id: "GR-028", name: "Skill boundary enforcement", category: "Access", description: "Agents may only invoke skills explicitly enabled in their configuration.", status: "passing", lastChecked: "1 min ago", enforcesBodyId: "access-control", enforcesClause: "AC-3" },
  { id: "GR-029", name: "Access review parity", category: "Access", description: "Granted access reconciled against the role catalog at every review cycle.", status: "warning", lastChecked: "2h ago", enforcesBodyId: "access-control", enforcesClause: "AC-4", remediation: "12 grants not yet reconciled with the role catalog — manual review queued." },

  // Audit Trail
  { id: "GR-030", name: "Immutable agent action log", category: "Audit Trail", description: "Every tool call, approval, and override written to append-only ledger with hash chain.", status: "passing", lastChecked: "3 min ago", enforcesBodyId: "audit-logging", enforcesClause: "AL-2" },
  { id: "GR-031", name: "Record retention enforced", category: "Audit Trail", description: "Records and supporting agent traces retained per the retention schedule.", status: "passing", lastChecked: "1d ago", enforcesBodyId: "retention", enforcesClause: "RT-2" },
  { id: "GR-032", name: "Reviewer identity captured on overrides", category: "Audit Trail", description: "Manual overrides on agent recommendations capture reviewer identity + justification.", status: "passing", lastChecked: "22 min ago", enforcesBodyId: "audit-logging", enforcesClause: "AL-3" },
  { id: "GR-033", name: "Policy citation on every guardrail breach", category: "Audit Trail", description: "Breaches and warnings link back to the specific policy clause they enforce.", status: "passing", lastChecked: "3 min ago", enforcesBodyId: "audit-logging", enforcesClause: "AL-1" },
];

export const GUARDRAIL_CATEGORIES: GuardrailCategory[] = [
  "Data Integrity",
  "Approval Thresholds",
  "Reliability",
  "AI Safety",
  "Privacy",
  "Abuse Prevention",
  "Access",
  "Audit Trail",
];

export const POLICY_INTELLIGENCE = {
  lastSync: "04:00 UTC",
  nextSyncIn: "7h 12m",
  policiesMonitored: POLICY_ENTRIES.length,
  rulesIngestedLastSync: SYNC_HISTORY[0].rulesIngested,
  rulesChangedLastSync: SYNC_HISTORY[0].rulesChanged,
  newAdvisoriesLastSync: SYNC_HISTORY[0].newAdvisories,
};

export const GUARDRAIL_TRENDS = {
  passingDelta: +2,
  warningDelta: +1,
  failingDelta: 0,
};
