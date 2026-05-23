# The Observe Section: Architecture & Replication Guide

> **Reference deep-dive.** Start with [`CLAUDE.md`](./CLAUDE.md) for the build playbook. The
> examples below come from the original CFO build and are **illustrative** — the Observe patterns
> are domain-agnostic. Note: the Audit Trail is now wired to the live `GET /api/audit/events`
> endpoint (with seed data as a fallback); Decision Inbox and Agent Runs still use sample data.

This document explains how the **Observe** section of an AgenticOS is built — the Decision Inbox, Agent Runs, Compliance & Guardrails, and Audit Trail — what each piece does, how it works technically, and honest answers about what's real vs. what's UI demonstration.

---

## Table of Contents

1. [What is the Observe Section?](#1-what-is-the-observe-section)
2. [The Four Observe Pages](#2-the-four-observe-pages)
3. [Decision Inbox — Deep Dive](#3-decision-inbox--deep-dive)
4. [Agent Runs — Deep Dive](#4-agent-runs--deep-dive)
5. [Compliance & Guardrails — Deep Dive](#5-compliance--guardrails--deep-dive)
6. [Audit Trail — Deep Dive](#6-audit-trail--deep-dive)
7. [What's Real vs. What's UI Demo](#7-whats-real-vs-whats-ui-demo)
8. [How Traces Could Be Made Real](#8-how-traces-could-be-made-real)
9. [Do We Even Need Audit Trail?](#9-do-we-even-need-audit-trail)
10. [Replicating the Observe Section for Other AgenticOS Products](#10-replicating-the-observe-section-for-other-agenticos-products)

---

## 1. What is the Observe Section?

The Observe section is the **governance and transparency layer** of an AgenticOS. While the journey pages (Build section) are where the agent _does work_, the Observe section is where humans _verify, approve, and audit_ that work.

It answers four questions:
- **Decision Inbox**: "What does the agent need my approval for?"
- **Agent Runs**: "What did the agent actually do, step by step?"
- **Compliance & Guardrails**: "What safety checks are in place?"
- **Audit Trail**: "What happened, when, and who did it?"

In the sidebar, these appear under the **OBSERVE** header:

```
OBSERVE
  Decision Inbox      (Inbox icon)
  Agent Runs          (Search icon)
  Compliance & Guardrails  (Shield icon)
  Audit Trail         (ClipboardList icon)
```

---

## 2. The Four Observe Pages

### At a Glance

| Page | Purpose | Data Source | Real Backend? |
|------|---------|-------------|---------------|
| Decision Inbox | Human-in-the-loop approval center | Hardcoded `DECISIONS` array | No — static demo data |
| Agent Runs | Execution history with trace inspection | Hardcoded `RUNS` array | No — static demo data |
| Compliance & Guardrails | Safety check dashboard | Page not yet built (sidebar link exists) | No |
| Audit Trail | Chronological event log | Hardcoded `EVENTS` array | No — static demo data |

All three existing pages use the `useSampleData()` hook — when the user toggles "Sample Data" off, they show an empty state. When toggled on, they render rich demonstration data. The Compliance & Guardrails page exists in the sidebar navigation but the page file hasn't been created yet.

---

## 3. Decision Inbox — Deep Dive

**File**: `artifacts/dashboard/src/pages/decision-inbox.tsx` (642 lines)

### What It Is

The Decision Inbox is the **human-in-the-loop review center**. When an agent makes a decision that exceeds a threshold, triggers a compliance rule, or requires human judgment, it lands here for approval.

This is arguably the most important page in an AgenticOS. It's the answer to "Can I trust the agent?" — because the agent doesn't act unilaterally on high-stakes decisions.

### How the UI is Built

The page has two views, routed via wouter:

#### List View (`/decision-inbox`)

```
+----------------------------------------------------------+
| Decision Inbox                                            |
| Human-in-the-loop review center for agent decisions       |
+----------------------------------------------------------+
| [4 Pending] [2 Approved] [1 Rejected] [2 Flagged]       |  <- Metric cards
+----------------------------------------------------------+
| Filters: [Pending] [Approved] [Rejected] [All]           |
+----------------------------------------------------------+
| DI-001 | CRITICAL | Monthly Close -> Step 4              |
| Post adjusting journal entry - Y52.3M IC elimination     |
| Agent: Monthly Close Orchestrator                        |
| Checks: [PASS] [PASS] [PASS]                            |  <- Mini shields
+----------------------------------------------------------+
| DI-002 | CRITICAL | Monthly Close -> Step 3              |
| Approve Y156M accrual journal entries                    |
| Agent: Monthly Close Orchestrator                        |
| Checks: [FLAGGED] [PASS] [PASS]                         |  <- Red shield
+----------------------------------------------------------+
```

**Components**:
- **Metric cards** (4 across): Pending, Approved, Rejected, Flagged counts. Pending shows a "X Critical" sub-label.
- **Filter tabs**: All / Pending / Approved / Rejected
- **Decision cards**: Each shows priority badge (Critical/High/Medium/Low), journey context, agent name, amount, and a row of mini compliance shield icons (green/red/amber).

#### Detail View (`/decision-inbox/:id`)

```
+----------------------------------------------------------+
| <- Back to Inbox / DI-001                                 |
| [CRITICAL] Monthly Close -> Step 4 · 2 hours ago         |
| Post adjusting journal entry - Y52.3M IC elimination     |
| Agent: Monthly Close Orchestrator                        |
|                              [Approve] [Reject] [Info]   |
+----------------------------------------------------------+
| THE DECISION                                             |
| Post adjusting journal entry for intercompany...         |
| Amount: Y52,300,000  Entity: Tokyo HQ <-> London Branch |
| Triggered By: Automated close pipeline run - Step 4      |
|                                                          |
| SUPPORTING EVIDENCE                                      |
| > Source: IC Reconciliation output - matched position... |
| > Matching IC balance confirmed: Y52,300,000 both sides |
| > Exchange rate: GBP/JPY 191.24 (BOJ fixing)           |
| > Previous month: similar elimination of Y48.7M         |
+----------------------------------------------------------+
| DECISION TRACING - COMPLIANCE CHECKS                     |
|                                                          |
|  [Agent Decision] ---> [Threshold & Auth]  PASS  --+     |
|                   ---> [Audit Trail]       PASS  --+--> [Output]
|                   ---> [Regulatory]        PASS  --+     |
|                                                          |
|  (SVG flow diagram with bezier curves, colored edges)    |
+----------------------------------------------------------+
| Expandable compliance check cards with evidence:         |
| [Shield] Threshold & Authorization         [PASS]   [>]  |
| [Shield] Audit Trail Completeness          [PASS]   [>]  |
| [Shield] Regulatory Compliance             [PASS]   [>]  |
+----------------------------------------------------------+
```

**The SVG Decision Tracing Visualization**: This is a custom-drawn SVG flow diagram. It shows:
- A brown "Agent Decision" box on the left
- Bezier curves fanning out to each compliance check node in the middle
- Each check node is colored by verdict (green=pass, red=flagged, amber=warning)
- Bezier curves converging from checks into an "Output" box on the right
- The curves use cubic bezier paths (`C` in SVG path) for a professional look

**Compliance Check Cards**: Below the SVG, expandable cards for each check show:
- Check name (e.g., "Threshold & Authorization")
- Verdict badge (PASS / FLAGGED / WARNING)
- Detail text (e.g., "Amount Y52.3M is within Controller auto-approve threshold of Y100M")
- Expandable evidence section with policy references

**Override Section**: When a check is flagged, a red warning box appears at the bottom requiring a text justification to "Approve with Override". The buttons become:
- "Approve with Override" (amber, disabled until justification is entered)
- "Reject" (red)

### Data Model

```typescript
interface DecisionItem {
  id: string;                    // "DI-001"
  title: string;                 // Short description
  description: string;           // Longer description
  journey: string;               // "Monthly Close"
  journeyStep?: string;          // "Step 4 (Consolidation)"
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "approved" | "rejected" | "escalated";
  agent: string;                 // "Monthly Close Orchestrator"
  requestedAt: string;           // "2 hours ago"
  amount?: string;               // "Y52,300,000"
  entity?: string;               // "Tokyo HQ <-> London Branch"
  what: string;                  // Full description of the decision
  evidence: string[];            // Supporting evidence bullets
  skillUsed: string;             // "close-orchestration"
  triggeredBy: string;           // "Automated close pipeline run"
  complianceChecks: ComplianceCheck[];
}

interface ComplianceCheck {
  name: string;                  // "Threshold & Authorization"
  verdict: "pass" | "flagged" | "warning";
  detail: string;                // What happened
  evidence?: string;             // Policy reference / source doc
}
```

### Sample Decisions (Currently Hardcoded)

The page has 8 decisions across different journeys:

| ID | Journey | Priority | Status | Amount | Checks |
|----|---------|----------|--------|--------|--------|
| DI-001 | Monthly Close (Consolidation) | Critical | Pending | Y52.3M | 3 pass |
| DI-002 | Monthly Close (Journals) | Critical | Pending | Y156M | 1 flagged, 2 pass |
| DI-003 | Financial Reconciliation | Critical | Pending | Y47.2M | 3 pass |
| DI-004 | IFRS 9 ECL | High | Pending | Y3.8B | 1 warning, 2 pass |
| DI-005 | Regulatory Returns | High | Approved | N/A | 3 pass |
| DI-006 | Regulatory Capital | Medium | Approved | N/A | 3 pass |
| DI-007 | Accounts Payable | Medium | Rejected | Y8.4M | 1 flagged, 2 pass |
| DI-008 | Monthly Close (Variance) | Low | Approved | N/A | 3 pass |

---

## 4. Agent Runs — Deep Dive

**File**: `artifacts/dashboard/src/pages/agent-runs.tsx` (598 lines)

### What It Is

Agent Runs provides **full execution transparency** — every run of every agent, with micro-level tracing of what happened at each step. This is the answer to "Show me exactly what the agent did and why."

### The Concept of Agent Runs

An **Agent Run** represents a single execution of an agent — whether triggered by a schedule, a user, or another agent. Each run captures:

- **Metadata**: Run ID, journey, agent name, status, start time, duration
- **Economics**: Tokens consumed (in/out), credit cost in dollars
- **Quality**: Confidence score (0-1), number of files processed
- **Safety**: Array of safety checks with verdicts
- **Trace**: Ordered array of every step the agent took

### How the UI is Built

#### Runs List View

```
+----------------------------------------------------------+
| Agent Runs                                                |
| Full execution history with micro-level tracing           |
+----------------------------------------------------------+
| [5 Runs Today] [82.4K Tokens] [$0.21 Cost]              |
| [2 Safety Flags] [80% Success]                           |
+----------------------------------------------------------+
| Filters: [All] [Completed] [Running] [Failed]            |
+----------------------------------------------------------+
| Run ID                | Journey        | Status  | Conf  |
|--------------------  -|----------------|---------|-------|
| run_2026-03-31_0842.. | Fin. Recon     | [Done]  | 94%   |
| run_2026-03-31_0838.. | Monthly Close  | [Live]  | 91%   |
| run_2026-03-31_0815.. | Accounts Pay.  | [Done]  | 96%   |
| run_2026-03-31_0730.. | Daily Liq.     | [Done]  | 92%   |
| run_2026-03-31_0600.. | Reg. Capital   | [Fail]  | 88%   |
| run_2026-03-30_1800.. | IFRS 9 ECL     | [Done]  | 91%   |
+----------------------------------------------------------+
```

A full-width table with columns: Run ID, Journey, Status, Confidence, Duration, Tokens, Cost, Safety. Clicking a row opens the detail panel.

#### Run Detail Panel (Slide-Over)

```
+----------------------------------------------------------+
| [X] Run: run_2026-03-31_084222_a7f                       |
| Journey: Financial Reconciliation                         |
| Agent: Financial Reconciliation Agent                     |
| Trigger: User — CFO Office                             |
| Model: Claude Sonnet 4                                    |
+----------------------------------------------------------+
| Duration: 47s  | Tokens: 12,450->3,200  | Cost: $0.048  |
| Files: 6       | Confidence: 94%                         |
+----------------------------------------------------------+
| SAFETY CHECKS                                            |
| [Shield-green] PII Redaction          PASS                |
| [Shield-green] Data Boundary          PASS                |
| [Shield-green] Bias Check             PASS                |
| [Shield-green] Hallucination Guard    PASS                |
| [Shield-green] Authorization          PASS                |
+----------------------------------------------------------+
| EXECUTION TRACE                                           |
|                                                           |
| [FileText] Skill Loaded — financial-reconciliation       |
|            08:42:22.100                                   |
|                                                           |
| [Database] Data Ingestion — GL Trial Balance             |
|            1.2s · GL_trial_balance.csv · 4,328 rows      |
|            [expandable: shows input/output]               |
|                                                           |
| [Database] Data Ingestion — Bank Statements              |
|            0.8s · bank_statements.csv · 2,841 rows       |
|                                                           |
| [Brain]    LLM Call #1 — Initial Analysis                |
|            7.2s · 8,200->2,100 tok · Claude Sonnet 4     |
|            [expandable: shows full prompt & response]     |
|                                                           |
| [Cpu]      Tool Call — reconciliation_matcher            |
|            3.2s · deterministic matching engine           |
|            [expandable: shows JSON input/output]          |
|                                                           |
| [Brain]    LLM Call #2 — Exception Classification        |
|            4.8s · 4,250->1,100 tok                       |
|                                                           |
| [Zap]      Output Generated                              |
|            reconciliation_report_march_2026.json          |
|                                                           |
| [Activity] Confidence Updated                            |
|            0.93 -> 0.94 (Bayesian update)                |
+----------------------------------------------------------+
```

### Trace Step Types

Each step in the trace has a `type` that determines its icon and color:

| Type | Icon | Color | What It Represents |
|------|------|-------|-------------------|
| `skill_load` | FileText | Gray | Loading a skill's SKILL.md |
| `data_ingestion` | Database | Blue | Parsing a CSV/JSON data file |
| `llm_call` | Brain | Violet | Calling Claude with a prompt |
| `tool_call` | Cpu | Amber | Running a deterministic function |
| `output` | Zap | Green | Final output generated |
| `confidence` | Activity | Brown/primary | Bayesian confidence update |

### Expandable Trace Cards

Each trace step is a `TraceStepCard` component that:
- Shows the step label, detail, duration, timestamp, and token count in a compact row
- Expands on click to show full Input and Output in monospace pre-formatted blocks
- Shows the file path and row count for data ingestion steps
- Shows the model name and temperature for LLM calls

### Safety Checks

Every run has an array of safety checks. Currently demonstrated:

| Check | What It Validates |
|-------|-------------------|
| PII Redaction | No personally identifiable information in output |
| Data Boundary | All processing within VPC, no external API calls |
| Bias Check | Consistent results across entities/segments |
| Hallucination Guard | All cited figures traced to source documents |
| Authorization | Agent operated within configured skill boundaries |
| Threshold Check | Amounts within auto-approve thresholds |
| Input Validation | Data files have required schema/columns |
| Duplicate Detection | Duplicate records flagged |
| Model Risk | Model validation recency check |

### Data Model

```typescript
interface AgentRun {
  id: string;                    // "run_2026-03-31_084222_a7f"
  journey: string;               // "Financial Reconciliation"
  agent: string;                 // "Financial Reconciliation Agent"
  status: "completed" | "running" | "failed" | "queued";
  startedAt: string;             // "Today 08:42:22 SGT"
  duration: string;              // "47s"
  tokensIn: number;              // 12450
  tokensOut: number;             // 3200
  creditCost: string;            // "$0.048"
  filesProcessed: number;        // 6
  confidence: number;            // 0.94
  trigger: string;               // "User — CFO Office" or "Scheduled — Daily 08:30"
  model: string;                 // "Claude Sonnet 4"
  safetyChecks: SafetyCheck[];
  trace: TraceStep[];
}

interface TraceStep {
  id: string;
  label: string;                 // "LLM Call #1 — Initial Analysis"
  type: "skill_load" | "data_ingestion" | "llm_call" | "tool_call" | "output" | "confidence";
  timestamp: string;             // "08:42:27.000"
  duration?: string;             // "7.2s"
  detail: string;
  input?: string;                // Full prompt or function input
  output?: string;               // Full response or function output
  tokens?: { in: number; out: number };
  model?: string;
  file?: string;                 // File path for data_ingestion steps
  rows?: number;                 // Row count for data files
}

interface SafetyCheck {
  name: string;
  verdict: "pass" | "warning" | "fail";
  detail: string;
}
```

### Sample Runs (Currently Hardcoded)

| Run | Journey | Status | Duration | Tokens | Cost | Confidence |
|-----|---------|--------|----------|--------|------|------------|
| run_..._a7f | Financial Reconciliation | Completed | 47s | 15.6K | $0.048 | 94% |
| run_..._b2c | Monthly Close | Running | -- | 10.6K | $0.031 | 91% |
| run_..._c4d | Accounts Payable | Completed | 8.1s | 8.1K | $0.024 | 96% |
| run_..._d5e | Daily Liquidity | Completed | 11.8s | 13K | $0.039 | 92% |
| run_..._e6f | Regulatory Capital | Failed | 3.2s | 1.8K | $0.006 | 88% |
| run_..._f7g | IFRS 9 ECL | Completed | 18.4s | 19.9K | $0.060 | 91% |

The failed run (Regulatory Capital) shows a realistic failure mode: the trading book CSV was missing required columns (VaR_10d, stressed_VaR), caught at the data validation step before the LLM was even called.

---

## 5. Compliance & Guardrails — Deep Dive

### Current Implementation: Multi-Layered

Compliance is NOT a single feature — it's a cross-cutting concern implemented at four levels:

#### Layer 1: Hard Rules (RULES.md)

The `agent/RULES.md` file is the primary guardrail. It's part of the agent's system prompt via GitClaw, so the LLM sees these constraints on every single turn:

```markdown
## MUST ALWAYS
- Source every financial figure to a specific dataset
- Flag any variance exceeding 5% as requiring attention
- Flag any variance exceeding 15% as requiring immediate escalation
- Apply materiality thresholds (>$50K or >5% of line item)

## MUST NEVER
- Fabricate or estimate numbers without labeling
- Provide tax advice or legal opinions
- Override compliance holds or audit flags

## ESCALATION
- Any transaction >$1M requires human approval
- Any regulatory filing requires CFO sign-off
- Board materials require dual review (CFO + Controller)
```

**Is this a skill?** No. RULES.md is loaded into the system prompt by GitClaw on every interaction. It's always active. Skills are loaded on demand. This is an always-on constraint layer.

#### Layer 2: Agent Configuration (agent.yaml)

The `compliance` block in `agent.yaml` sets the agent's compliance posture:

```yaml
compliance:
  risk_level: high
  human_in_the_loop: true
  data_classification: confidential
  regulatory_frameworks: [SOX, SEC, GAAP]
  recordkeeping:
    audit_logging: true
    retention_days: 2555  # 7 years
  review:
    cadence: quarterly
    approvers: ["cfo", "internal-audit"]
```

This is metadata — it tells the system (and the agent) what compliance posture to operate under. GitClaw reads this and incorporates it into the agent's context.

#### Layer 3: Compliance Skills

These are specialized skills the agent can load when needed:

- `regulatory-filing/` — Pre-filing checklists, includes a `check_compliance.py` script
- `internal-controls-testing/` — SOX 404/COSO framework compliance
- `regulatory-capital-computation/` — Basel III capital ratio compliance

These ARE skills — loaded on demand when the agent's task requires compliance checking. They contain domain-specific methodologies and validation logic.

#### Layer 4: Compliance Data Files

Static YAML files that define the compliance landscape:

- `agent/compliance/regulatory-map.yaml` — Status of each regulatory framework and its requirements
- `agent/compliance/validation-schedule.yaml` — Cadence of compliance activities
- `agent/knowledge/regulatory-guidelines.md` — Reference document for legal requirements

#### Layer 5: Server API

The server has a compliance endpoint (`GET /api/agent/compliance`) that aggregates data from agent.yaml, regulatory-map.yaml, and validation-schedule.yaml to serve to the frontend dashboard.

### The Compliance & Guardrails Page

The sidebar links to `/compliance-guardrails` but **the page file doesn't exist yet**. It would logically show:
- Active guardrails from RULES.md
- Safety check statistics from Agent Runs
- Regulatory framework compliance status
- Validation schedule status

### Are Guardrails Skills or Layers?

**Both**. The architecture is:

| What | Type | When Active |
|------|------|-------------|
| RULES.md | System prompt layer | Every interaction |
| agent.yaml compliance block | Configuration | Always (metadata) |
| Compliance skills | On-demand skills | When task requires |
| Safety checks in Agent Runs | Runtime checks | During/after each run |
| Decision Inbox escalation | UI workflow | When thresholds exceeded |

The first two are **layers** — always present, not optional. The last three are **features** — activated by context.

---

## 6. Audit Trail — Deep Dive

**File**: `artifacts/dashboard/src/pages/audit-trail.tsx` (98 lines)

### What It Is

A chronological timeline of everything that happened in the system. Every agent action, every human decision, every system event, every guardrail trigger.

### How the UI is Built

Simple vertical timeline layout:
- A 2px vertical line runs down the left side
- Each event has a colored circular icon (positioned on the line) and a card to its right
- Events are color-coded by type

```
| [Bot icon - brown]  Agent  · CFO Office Agent · Fin. Recon
|   Started reconciliation analysis
|   Loaded 6 data files — 4,328 transactions ingested
|   Today 08:42:15                                    AE-1247
|
| [Bot icon - brown]  Agent  · CFO Office Agent · Fin. Recon
|   Auto-matched 4,105 transactions
|   94.85% match rate — 223 exceptions surfaced
|   Today 08:42:18                                    AE-1246
|
| [Alert icon - amber]  Guardrail  · System · Fin. Recon
|   Flagged 8 genuine errors
|   Y47.2M exposure — routed to Decision Inbox
|   Today 08:42:22                                    AE-1245
|
| [User icon - blue]  User  · cfo@lyzr.ai · Monthly Close
|   Approved FX hedge rollover
|   GBP/JPY forward — GBP 45M — via Decision Inbox
|   Yesterday 18:15                                   AE-1239
```

### Event Types

| Type | Icon | Color | What It Represents |
|------|------|-------|-------------------|
| `agent_action` | Bot | Brown (primary) | Something the agent did |
| `user_decision` | User | Blue | Human approval/decision |
| `system_event` | FileText | Gray | System/infrastructure event |
| `guardrail_trigger` | AlertTriangle | Amber | Compliance rule activated |

### Data Model

```typescript
interface AuditEvent {
  id: string;           // "AE-1247"
  timestamp: string;    // "Today 08:42:15"
  type: EventType;      // "agent_action" | "user_decision" | "system_event" | "guardrail_trigger"
  actor: string;        // "CFO Office Agent" or "cfo@lyzr.ai" or "System"
  action: string;       // Short summary
  details: string;      // Detailed description with specific numbers
  journey?: string;     // Which journey this relates to
  entity?: string;      // Which entity (e.g., "London Branch")
}
```

### Features

- "Export Log" button in header (static — no handler attached yet)
- `SampleDataBadge` when viewing demo data
- `NoDataState` when sample data is off

---

## 7. What's Real vs. What's UI Demo

This is the honest assessment:

### What's Real (Backed by GitClaw)

| Feature | Reality |
|---------|---------|
| Agent chat (Agent Console) | Real — calls GitClaw `query()`, streams real LLM responses |
| Journey analysis | Real — calls GitClaw `query()` with structured output format |
| Tool calling (read, write, memory, cli) | Real — GitClaw executes tools, streams events |
| RULES.md enforcement | Real — always in system prompt, LLM respects constraints |
| Skills loading | Real — GitClaw loads skills on demand via `read` tool |
| Knowledge base indexing | Real — `index.yaml` drives on-demand file loading |
| Pipeline visualization (Agent Console) | Real — shows actual tool calls from GitClaw stream |

### What's UI Demo (Hardcoded Data)

| Feature | Reality |
|---------|---------|
| Decision Inbox items | Hardcoded `DECISIONS` array — no backend creates these |
| Agent Runs list | Hardcoded `RUNS` array — not recorded from real runs |
| Trace steps | Hardcoded — shows what traces _would_ look like |
| Safety checks | Hardcoded verdicts — no actual PII/hallucination checking runs |
| Audit Trail events | Hardcoded `EVENTS` array — not logged from real activity |
| Compliance check verdicts | Hardcoded pass/flagged — no actual policy engine evaluates |
| Confidence scores | Hardcoded — no Bayesian update actually happens |
| Token counts & costs | Hardcoded — real usage data from GitClaw isn't captured |

### The Gap

The frontend is fully built and demonstrates the _product experience_ convincingly. But the backend doesn't currently:
- Persist agent run metadata
- Record trace steps from GitClaw events
- Run safety checks (PII detection, hallucination guarding, etc.)
- Create Decision Inbox items from threshold violations
- Log audit events from agent/user actions
- Calculate or update confidence scores

---

## 8. How Traces Could Be Made Real

The architecture already supports this. Here's what it would take:

### Step 1: Capture GitClaw Events as Traces

The `agent-chat.ts` and `journey-analyze.ts` routes already iterate over GitClaw's stream events. Today they forward events to the frontend via SSE. To make traces real, you'd also persist each event:

```typescript
for await (const msg of stream) {
  // Existing: forward to frontend
  sseWrite(res, eventType, data);
  
  // New: persist to trace log
  traceSteps.push({
    type: mapGitClawEventToTraceType(msg.type),
    label: msg.toolName || msg.content,
    timestamp: new Date().toISOString(),
    duration: calculateDuration(lastTimestamp),
    tokens: msg.type === "assistant" ? msg.usage : undefined,
  });
}

// After stream completes, save the run
await saveAgentRun({
  id: generateRunId(),
  journey,
  agent: agentName,
  status: errorOccurred ? "failed" : "completed",
  trace: traceSteps,
  tokensIn: totalUsage.inputTokens,
  tokensOut: totalUsage.outputTokens,
});
```

### Step 2: Map GitClaw Events to Trace Types

| GitClaw Event | Trace Type |
|---------------|------------|
| `tool_use` where toolName=`read` | `data_ingestion` (if reading data) or `skill_load` (if reading SKILL.md) |
| `tool_use` where toolName=`cli` | `tool_call` |
| `tool_use` where toolName=`write` | `output` |
| `tool_use` where toolName=`memory` | `confidence` (or separate type) |
| `delta` (text) | Not a trace step — this is the final output |
| `assistant` | Marks end of an LLM call — create an `llm_call` trace step |

### Step 3: Generate Decision Inbox Items

When the agent's response or tool results trigger a threshold (from RULES.md), create a Decision Inbox item:

```typescript
if (amount > THRESHOLD && requiresApproval) {
  await createDecisionItem({
    journey,
    agent: agentName,
    priority: amount > CFO_THRESHOLD ? "critical" : "high",
    amount: formatCurrency(amount),
    complianceChecks: runComplianceChecks(decision),
  });
}
```

### Step 4: Log Audit Events

Every significant action (agent run start/complete, user approval, guardrail trigger) creates an audit event:

```typescript
await logAuditEvent({
  type: "agent_action",
  actor: agentName,
  action: "Completed reconciliation analysis",
  details: `Processed ${fileCount} files, ${matchRate}% match rate`,
  journey: journeyName,
});
```

### Storage Options

- **Database (Drizzle + PostgreSQL)**: The project already has `lib/db/` with Drizzle ORM. Add tables for `agent_runs`, `trace_steps`, `decisions`, `audit_events`.
- **File-based**: Write JSON files to `agent/runs/` — simpler, GitClaw can read them, but doesn't scale.
- **In-memory**: For demo purposes, keep a Map in the server process. Lost on restart but simple.

---

## 9. Do We Even Need Audit Trail?

### The Argument For

In regulated industries (finance, healthcare, legal), audit trails are not optional — they're legally required. SOX, GDPR, MiFID II, and similar frameworks mandate that every action on financial data be logged, timestamped, and attributable.

For an AgenticOS targeting enterprise buyers, the Audit Trail is a **trust signal**. It says: "Everything the AI does is logged and inspectable." This is table stakes for enterprise sales.

### The Argument Against

The current Audit Trail is essentially a flattened, less-detailed version of Agent Runs. If you have Agent Runs with full traces, do you need a separate chronological log?

The answer depends on the audience:
- **Technical users** (engineers, risk analysts) want Agent Runs — full traces, token counts, input/output
- **Non-technical users** (CFO, compliance officer) want the Audit Trail — simple timeline, plain language, "who did what when"

### Recommendation

**Keep it, but make it a derived view.** Don't maintain two separate data stores. The Audit Trail should be a simplified, filtered view of the same underlying event stream that powers Agent Runs. Every trace step and every Decision Inbox action automatically becomes an audit event.

The Audit Trail adds value by:
1. Flattening the hierarchy (no expandable traces — just a stream)
2. Including human actions alongside agent actions
3. Being exportable (for auditors who need a PDF/CSV)
4. Being filterable by entity, journey, actor type, and time range

### What to Cut

If you need to simplify, merge Audit Trail _into_ Agent Runs as a tab or view mode. Don't build it as a standalone page that duplicates data.

---

## 10. Replicating the Observe Section for Other AgenticOS Products

### What Stays the Same (Copy Directly)

1. **Decision Inbox layout** — List view with metric cards, detail view with SVG tracing, compliance check cards, override flow. 100% reusable.

2. **Agent Runs layout** — Table with status/confidence/tokens/cost columns, slide-over detail with safety checks and trace steps. 100% reusable.

3. **Trace step rendering** — `TraceStepCard` component with expandable input/output. 100% reusable.

4. **Safety check rendering** — Shield icons with pass/warning/fail verdicts. 100% reusable.

5. **Audit Trail layout** — Timeline with typed events. 100% reusable.

6. **Data models** — `DecisionItem`, `AgentRun`, `TraceStep`, `SafetyCheck`, `AuditEvent` interfaces. 100% reusable.

### What Changes Per Domain

1. **Decision content** — Different decisions, thresholds, amounts, entities
2. **Compliance check names** — "SOX Compliance" becomes "HIPAA Compliance" for Healthcare OS, "GDPR Compliance" for EU-focused products
3. **Journey references** — Decision items reference domain journeys
4. **Agent names** — "Monthly Close Orchestrator" becomes "Contract Review Agent"
5. **Safety check names** — "PII Redaction" stays universal; "Model Risk" may not apply everywhere
6. **Trace details** — File names, column names, tool names change per domain
7. **Thresholds** — "$1M requires CFO approval" changes per domain/company

### Example: Legal OS Observe Section

```
Decision Inbox items:
  - "Approve contract amendment — $2.4M vendor agreement" (Contract Review)
  - "Review IP filing — 3 patents pending clearance" (IP Portfolio)
  - "Approve regulatory response — FTC inquiry" (Compliance)

Agent Runs:
  - Contract Review Agent: analyzed 47 clauses, flagged 3 non-standard terms
  - Compliance Monitor Agent: scanned 12 regulatory changes, 2 impact firm
  
Safety Checks:
  - Privilege Check: No privileged communications exposed
  - Jurisdiction Validation: Correct governing law applied
  - Conflict of Interest: No conflicting representations detected

Audit Trail:
  - Agent reviewed vendor contract (Contract-Review)
  - System flagged non-standard indemnity clause (Guardrail)
  - User approved contract with noted exception (User Decision)
```

### Sidebar Structure (Universal)

```
OBSERVE
  Decision Inbox          # Human-in-the-loop approvals
  Agent Runs              # Execution history + traces
  Compliance & Guardrails # Safety dashboard
  Audit Trail             # Chronological event log
```

This sidebar structure is universal across all AgenticOS products. The icon choices (Inbox, Search, Shield, ClipboardList) work for any domain.

---

## Appendix: File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `artifacts/dashboard/src/pages/decision-inbox.tsx` | 642 | Decision Inbox (list + detail views) |
| `artifacts/dashboard/src/pages/agent-runs.tsx` | 598 | Agent Runs (table + slide-over trace) |
| `artifacts/dashboard/src/pages/audit-trail.tsx` | 98 | Audit Trail (timeline) |
| `artifacts/dashboard/src/components/layout.tsx` | 164 | Sidebar with OBSERVE section |
| `agent/RULES.md` | 24 | Hard guardrail constraints |
| `agent/agent.yaml` | 46 | Agent compliance configuration |
| `agent/compliance/regulatory-map.yaml` | — | Regulatory framework status |
| `agent/compliance/validation-schedule.yaml` | — | Compliance activity schedule |
| `artifacts/api-server/src/routes/agent.ts` | — | `/api/agent/compliance` endpoint |
