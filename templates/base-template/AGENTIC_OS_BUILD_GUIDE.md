# Building an AgenticOS: Complete Architecture & Replication Guide

> **This is the in-depth reference.** For the actionable, step-by-step build playbook, start with
> [`CLAUDE.md`](./CLAUDE.md). This template ships domain-agnostic with one worked example
> (`example-journey` + `example-skill`); the original build was a CFO's office, so finance examples
> below are **illustrative** of the patterns — substitute your own domain.

This document explains exactly how an AgenticOS is built — the architecture, the product experience, and every decision — so you can replicate it for any domain (Legal, HR, Sales, Supply Chain, etc.).

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [The Three Layers](#2-the-three-layers)
3. [Layer 1: The Agent Directory](#3-layer-1-the-agent-directory)
4. [Layer 2: The Server (Thin Wrapper)](#4-layer-2-the-server-thin-wrapper)
5. [Layer 3: The Frontend (Dashboard)](#5-layer-3-the-frontend-dashboard)
6. [The Monorepo Structure](#6-the-monorepo-structure)
7. [GitClaw: How the Agent Engine Works](#7-gitclaw-how-the-agent-engine-works)
8. [Journey Pages: The Core Product Pattern](#8-journey-pages-the-core-product-pattern)
9. [The Agent Console: Free-Form Chat](#9-the-agent-console-free-form-chat)
10. [The Command Center: Home Page](#10-the-command-center-home-page)
11. [SSE Streaming Pipeline](#11-sse-streaming-pipeline)
12. [Knowledge Base Design](#12-knowledge-base-design)
13. [Skills Design](#13-skills-design)
14. [Branding & Design System](#14-branding--design-system)
15. [Step-by-Step: Building a New AgenticOS](#15-step-by-step-building-a-new-agenticos)
16. [What to Change vs. What to Keep](#16-what-to-change-vs-what-to-keep)
17. [Common Pitfalls](#17-common-pitfalls)

---

## 1. System Overview

An AgenticOS is a full-stack product that gives a domain expert (CFO, General Counsel, VP Sales, etc.) an AI-powered operating system for their function. It is not a chatbot. It is:

- A **dashboard** with domain-specific KPIs and real-time insights
- A set of **journey pages** — each representing a major workflow (e.g., Monthly Close, Contract Review, Pipeline Forecasting)
- An **AI agent** that reads domain knowledge, uses specialized skills, and calls tools to produce structured analysis
- A **streaming pipeline** that shows the user what the agent is doing in real time (reading files, loading skills, executing tools)

The architecture has three layers:

```
Frontend (React + Vite)              <-- What the user sees
    |
    | POST /api/agent/chat (SSE)
    v
Server (Express, thin wrapper)       <-- Just calls query() and forwards events
    |
    | query({ dir: "agent-dir/", prompt: "..." })
    v
GitClaw SDK                          <-- The actual agent engine
    |
    | Reads agent.yaml, SOUL.md, RULES.md
    | Builds system prompt + tools
    | Calls Claude API
    | Executes tool calls (read, write, cli, memory)
    | Loops until done
    |
    v
Agent Directory (flat files)         <-- The agent's brain
    skills/, knowledge/, SOUL.md, RULES.md, agent.yaml
```

The critical insight: **the server never calls Claude directly**. The server never reads SKILL.md files. The server calls `query()` and receives a stream of events. GitClaw is the thing that calls Claude, reads files, executes tools, and manages the agentic loop.

---

## 2. The Three Layers

### Layer 1: Agent Directory (the brain)
A folder of flat files that define who the agent is, what it knows, and what it can do. This is the only layer that changes between domains. For CFO OS, this is `agent/`. For Legal OS, it would be `legal-agent/`.

### Layer 2: Server (the passthrough)
An Express server that receives requests from the frontend, calls GitClaw's `query()`, and streams events back via SSE. This layer is ~95% identical across all AgenticOS products. The only things that change are the journey-to-skill mappings and the journey section definitions.

### Layer 3: Frontend (the experience)
A React + Vite dashboard with a sidebar, command center, journey pages, agent console, and management pages. The layout and component patterns are reusable. The domain-specific content (KPIs, journey names, sample data, chat nudges) changes per product.

---

## 3. Layer 1: The Agent Directory

This is the most important layer. It defines the agent's identity, knowledge, and capabilities.

### Directory Structure

```
{domain}-agent/
  agent.yaml          # Manifest: name, model, tools, compliance settings
  SOUL.md             # Personality, communication style, values
  RULES.md            # Hard constraints: must-always, must-never, escalation
  DUTIES.md            # Daily/weekly/monthly responsibilities
  memory/
    MEMORY.md          # Persistent memory across sessions (GitClaw manages this)
  skills/
    {skill-name}/
      SKILL.md         # Instructions for this skill (YAML frontmatter required)
      scripts/         # Optional automation scripts
  knowledge/
    index.yaml         # Catalog of all knowledge files with tags + priority
    org-structure.md   # Always-loaded context (small, critical)
    accounting-policies.md
    financial-data/    # Large data files (loaded on demand via tags)
      q1-actuals.json
      budget-vs-actuals.json
      ...
    journey-data/      # Data organized by journey
      monthly-close/
        trial-balance.csv
        close-checklist.csv
      regulatory-capital/
        capital-adequacy.csv
        rwa-breakdown.csv
```

### agent.yaml — The Manifest

```yaml
spec_version: "0.1.0"
name: cfo-office-agent
version: 1.0.0
description: >
  CFO's Office AgenticOS — an enterprise AI agent that serves as the
  intelligent operating system for the Chief Financial Officer's office.

model:
  preferred: "anthropic:claude-sonnet-4-6-20250627"
  fallback:
    - "anthropic:claude-sonnet-4-20250514"
  constraints:
    temperature: 0.3
    max_tokens: 4096

tools: [cli, read, write, memory]

skills:
  - variance-analysis
  - board-deck-generation
  - vendor-risk-scoring
  # ... listed skills appear in the agent's skill menu

runtime:
  max_turns: 30
  timeout: 120

compliance:
  risk_level: high
  human_in_the_loop: true
  regulatory_frameworks: [SOX, SEC, GAAP]
```

Key decisions:
- `tools: [cli, read, write, memory]` — these are GitClaw's built-in tools. The agent uses `read` to load knowledge files on demand, `write` to save outputs, `memory` to persist findings across sessions, and `cli` to run scripts.
- `temperature: 0.3` — low temperature for financial accuracy. Adjust per domain.
- `max_turns: 30` — how many tool-call loops before the agent stops.

### SOUL.md — The Personality

This defines WHO the agent is. Example structure:

```markdown
# Identity
You are the CFO's Office AI — a senior financial strategist...

## Personality
- Authoritative but accessible
- Numbers-first: every claim backed by data
- Proactively insightful: surface anomalies before asked
- Compliance-aware

## Communication Style
- Open with the most important finding
- Use precise domain language
- Present variance as absolute + percentage
- Close with a clear recommendation

## Values
- Accuracy over speed
- Transparency in methodology
- Prudence when uncertain
```

### RULES.md — Hard Constraints

```markdown
## MUST ALWAYS
- Source every figure to a specific dataset
- Flag variances exceeding 5% of budget
- Include reporting period and currency in all outputs

## MUST NEVER
- Fabricate numbers without labeling as estimates
- Provide legal/tax advice
- Override compliance holds

## ESCALATION
- Transactions >$1M require human approval
- Regulatory filings require CFO sign-off
```

### knowledge/index.yaml — The Knowledge Catalog

This is how GitClaw knows what data exists and when to load it:

```yaml
entries:
  - path: org-structure.md
    tags: [organization, departments, reporting]
    priority: high
    always_load: true          # Small file, always in context

  - path: financial-data/q1-actuals.json
    tags: [q1, actuals, revenue, expenses, pnl]
    priority: high
    always_load: false          # Large file, loaded on demand via tags

  - path: journey-data/monthly-close/trial-balance.csv
    tags: [monthly-close, trial-balance, gl, ledger]
    priority: high
    always_load: false
```

The `always_load: true` files go into the system prompt every time. The `always_load: false` files are only loaded when the agent decides it needs them (based on tag matching). This keeps token usage efficient.

### Skills — Specialized Capabilities

Each skill is a directory with a `SKILL.md` file:

```
skills/variance-analysis/
  SKILL.md
```

The SKILL.md **must** have YAML frontmatter (GitClaw silently skips skills without it):

```markdown
---
name: variance-analysis
description: Analyze budget vs actuals, identify material variances, generate commentary
---

# Variance Analysis

## When to Use
When the user asks about budget performance, spending variances, or cost overruns.

## Methodology
1. Load budget-vs-actuals.json from knowledge base
2. Calculate variance % for each line item
3. Flag material items (>5% or >$50K)
4. Generate root cause analysis
5. Produce executive summary with recommendations
```

GitClaw presents the agent with a menu of available skills. The agent decides which skill to load based on the user's question. When it loads a skill, it reads the SKILL.md to get instructions.

---

## 4. Layer 2: The Server (Thin Wrapper)

The server has two main streaming endpoints:

### POST /api/agent/chat — Free-Form Chat

This is the general-purpose chat endpoint used by the Agent Console and Journey Chat Panels.

```typescript
router.post("/agent/chat", async (req, res) => {
  bridgeReplitEnv();  // Map platform env vars to what GitClaw expects

  const { messages, sessionId, page } = req.body;

  // Set up SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });

  const abortController = new AbortController();
  res.on("close", () => abortController.abort());  // CRITICAL: res.on, NOT req.on

  // Build context suffix based on which page the user is on
  let contextSuffix = "";
  if (page === "monthly-close") {
    contextSuffix = "The user is on the Monthly Close journey page...";
  }

  // Call GitClaw — this is the ONLY thing the server does
  const { query } = await import("gitclaw");
  const stream = query({
    prompt: userMessage,
    dir: "/path/to/agent-directory",
    model: "anthropic:claude-sonnet-4-6",
    sessionId,
    abortController,
    maxTurns: 10,
    constraints: { maxTokens: 8192 },
    systemPromptSuffix: contextSuffix,
  });

  // Forward GitClaw events as SSE
  for await (const msg of stream) {
    if (abortController.signal.aborted) break;
    switch (msg.type) {
      case "delta":
        sseWrite(res, "delta", { text: msg.content });
        break;
      case "tool_use":
        sseWrite(res, toolNameToEventType(msg.toolName), { ... });
        break;
      case "tool_result":
        sseWrite(res, "tool_result", { ... });
        break;
      case "assistant":
        sseWrite(res, "done", { finished: true, usage: msg.usage });
        break;
    }
  }
});
```

### POST /api/journey/analyze — Structured Journey Analysis

This endpoint produces structured output with `[SECTION]...[/SECTION]` blocks that the frontend parses into rich cards.

Key differences from the chat endpoint:
- Higher `maxTurns` (12) and `maxTokens` (16384) for complex multi-step analysis
- Strict output format instructions in the prompt
- Section definitions per journey (e.g., Monthly Close has 6 steps, Regulatory Capital has 6 steps)
- Supports uploaded files as primary data source

### POST /api/journey/prepare — Pipeline Preparation

Non-streaming endpoint that returns the list of steps the agent will take, the relevant skill, and available data files. This powers the "pipeline animation" in the UI.

### Other Endpoints (mostly static data)

- `GET /api/dashboard/metrics` — Reads JSON knowledge files and returns aggregated KPIs
- `GET /api/dashboard/insights` — Returns critical alerts
- `GET /api/agent/info` — Returns agent config (SOUL, RULES, agent.yaml)
- `GET /api/agent/skills` — Lists all skills
- `GET /api/agent/files` — File tree of the agent directory

These are simple file-reading endpoints. They don't call GitClaw.

### Environment Bridging

On platforms like Replit, the Anthropic API key comes through platform integration variables. GitClaw expects standard env vars. The bridge function maps them:

```typescript
function bridgeReplitEnv(): void {
  process.env.ANTHROPIC_API_KEY = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  // Also patch the model registry base URL for proxy routing
  for (const modelId of ANTHROPIC_MODELS) {
    const model = getModel("anthropic", modelId);
    if (model) model.baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  }
}
```

---

## 5. Layer 3: The Frontend (Dashboard)

### Page Categories

The frontend has four categories of pages:

#### 1. Command Center (Home)
- Welcome message + AI search bar
- Journey cards grid (2-column)
- Agent Insights (prioritized findings)
- Actions Required (pending approvals)
- Aggregate metrics dashboard

#### 2. Journey Pages (8 in CFO OS)
Each journey page follows the **Universal Journey Pattern** (see Section 8).

#### 3. Agent Console
Full-screen chat interface with streaming pipeline visualization (see Section 9).

#### 4. Management Pages
- Agent Studio — view agent config
- Skills Manager — browse and inspect skills
- Knowledge Base — view indexed knowledge files
- Integrations — third-party connections
- Audit Trail — agent activity log
- File System — browse agent directory

### Tech Stack
- React 19 + Vite 7
- Tailwind CSS 4
- Framer Motion for animations
- Recharts for data visualization
- Wouter for routing
- Lucide React for icons (no emojis)
- ReactMarkdown + remark-gfm for rendering agent output

---

## 6. The Monorepo Structure

```
project-root/
  pnpm-workspace.yaml       # Workspace definition + shared dependency catalog
  package.json               # Root scripts (build, typecheck)
  
  artifacts/                 # Deployable applications
    api-server/              # Express backend
      src/
        index.ts             # Entry point, binds to PORT
        app.ts               # Express app setup, CORS, routes
        routes/
          agent-chat.ts      # GitClaw chat streaming
          journey-analyze.ts # GitClaw journey analysis streaming
          dashboard.ts       # Static data endpoints
          agent-info.ts      # Agent config endpoints
          health.ts
    
    {domain}-dashboard/      # React + Vite frontend
      src/
        App.tsx              # Router
        pages/               # One file per page
        components/          # Shared components
        hooks/               # Custom hooks (use-chat-stream, etc.)
        lib/                 # Utilities
    
    mockup-sandbox/          # Dev-only UI prototyping server
  
  {domain}-agent/            # Agent directory (the brain)
    agent.yaml
    SOUL.md
    RULES.md
    skills/
    knowledge/
    memory/
  
  lib/                       # Shared internal packages
    api-spec/                # OpenAPI spec + code generation
    api-client-react/        # Generated React Query hooks
    api-zod/                 # Generated Zod schemas
    db/                      # Database schema (Drizzle ORM)
    integrations/            # Third-party integration wrappers
```

Each workspace package has its own `package.json` and `tsconfig.json`. Dependencies shared across packages are version-locked via the `catalog:` protocol in `pnpm-workspace.yaml`.

---

## 7. GitClaw: How the Agent Engine Works

GitClaw is an open-source agentic framework. When your server calls `query()`, here is exactly what happens:

```
1. loadAgent(dir)
   - Reads agent.yaml → gets name, model, tools, compliance
   - Reads SOUL.md → personality and communication style  
   - Reads RULES.md → hard constraints
   - Reads DUTIES.md → responsibilities
   - Scans skills/ → builds skill menu (name + description from frontmatter)
   - Reads knowledge/index.yaml → identifies always_load files
   - Reads always_load files → adds to system prompt
   - Reads memory/MEMORY.md → adds to context

2. Build system prompt
   = SOUL.md + RULES.md + DUTIES.md + always_load knowledge + skill menu + memory

3. Create tools
   - read(file_path) → reads any file in the agent directory
   - write(file_path, content) → writes files
   - memory(action, content) → read/append to MEMORY.md
   - cli(command) → execute shell commands
   - task_tracker → manage tasks
   - skill_learner → create new skills

4. Call Claude API
   - System prompt + tools + user message
   - Claude responds with either text or tool calls

5. The agentic loop (up to maxTurns iterations)
   - If Claude returns tool calls → execute them → send results back → repeat
   - If Claude returns text → done
   
6. Stream events back to your server
   - delta → text chunks as they stream
   - tool_use → agent is calling a tool (name + args)
   - tool_result → tool returned results
   - assistant → turn complete
   - system → status messages or errors
```

### Event Types from GitClaw

| GitClaw Event | Frontend Event | What It Means |
|---|---|---|
| `delta` (text) | `delta` | Streaming text content |
| `tool_use` (read) | `file_fetch` | Agent is reading a file |
| `tool_use` (write) | `file_write` | Agent is writing a file |
| `tool_use` (memory) | `memory_update` | Agent is using memory |
| `tool_use` (cli) | `tool_use` | Agent is running a command |
| `tool_use` (task_tracker) | `skill_loading` | Agent is managing tasks |
| `tool_result` | `tool_result` | Tool returned data |
| `assistant` | `done` | Turn complete |
| `system` (error) | `error` | Something went wrong |

---

## 8. Journey Pages: The Core Product Pattern

Every journey page follows the same structural pattern. This is the heart of the product experience.

### Universal Journey Page Layout

```
+--------------------------------------------------+
| Journey Title              [Run Agent Button]     |
| Live context subtitle                             |
+--------------------------------------------------+
| PENDING ACTIONS STRIP                             |
| Critical: "Controller approval needed for ¥156M" |
| Warning: "Frankfurt blocking consolidation"       |
| Info: "Variance commentary draft ready"           |
+--------------------------------------------------+
|                                                   |
| DOMAIN-SPECIFIC METRICS                           |
| (gauges, pipeline blocks, sparklines, tables)     |
|                                                   |
+--------------------------------------------------+
|                                                   |
| MAIN CONTENT AREA                                 |
| (entity status table, approval gates,             |
|  dependency diagrams, staged data)                |
|                                                   |
+--------------------------------------------------+
| AGENT PIPELINE (collapsible)                      |
| Step 1: Loading agent config      [done]          |
| Step 2: Loading skill             [done]          |
| Step 3: Reading trial-balance.csv [done]          |
| Step 4: Running 6-step analysis   [analyzing...]  |
+--------------------------------------------------+
| AI CONCLUSION (structured sections)               |
| Section 1: Pre-Close Data Collection              |
|   Metrics: 4 green, 1 warning                     |
|   Detailed markdown analysis...                   |
| Section 2: Automated Reconciliations              |
|   ...                                             |
+--------------------------------------------------+
| DATA SOURCES (collapsible)                        |
| Upload files or load sample data                  |
+--------------------------------------------------+
|                                                   |
| JOURNEY CHAT PANEL (bottom-docked, expandable)    |
| Nudges: "Why is Frankfurt blocking?"              |
|         "Are we on track for Day 5?"              |
+--------------------------------------------------+
```

### Components That Power Journey Pages

1. **`<PendingActionsStrip>`** — Full-width banner showing critical/warning/info items needing human attention. Each item has a CTA button.

2. **`<AgentPipelineButton>`** — "Run Agent" button in the top-right. Triggers the prepare + analyze flow.

3. **`<AgentPipelineContent>`** — Collapsible section showing the agent's preparation steps (config loaded, skill loaded, files read) with animated progress indicators.

4. **`<AiConclusion>`** — The structured output renderer. Parses `[SECTION]...[/SECTION]` blocks from the streaming response and renders them as rich cards with:
   - Section header with status badge (healthy/warning/critical)
   - 4-6 metrics per section with colored indicators
   - Expandable markdown details
   - Real-time streaming animation (shows "Analyzing..." for in-progress sections)

5. **`<JourneyChatPanel>`** — Bottom-docked chat panel with domain-specific nudges. Uses the same `agent/chat` endpoint with page context.

6. **`<NoDataState>` / `<SampleDataBadge>`** — Handles the empty state when no data is loaded, with toggle for sample data.

### Journey-Specific Content (What Changes Per Journey)

For each journey, you define:

```typescript
// 1. Chat nudges — contextual questions
const CHAT_NUDGES = [
  { label: "Why is Frankfurt blocking?", prompt: "Why is Frankfurt blocking consolidation?" },
  { label: "Are we on track?", prompt: "Will we meet the Day 5 close target?" },
];

// 2. Pending actions — items needing human attention  
const PENDING_ACTIONS = [
  { id: "accruals", priority: "critical", description: "Controller approval required..." },
];

// 3. Domain-specific metrics and visualizations
// (custom per journey — gauges, pipeline blocks, tables, etc.)

// 4. Main content area
// (entity tables, approval gates, dependency diagrams, etc.)
```

### On the Server Side

For each journey, you define:

```typescript
// 1. Which skill maps to this journey
const JOURNEY_SKILL_MAP = {
  "monthly-close": "monthly-financial-close",
  "regulatory-capital": "regulatory-capital-computation",
};

// 2. Which data directory contains journey-specific files
const JOURNEY_DATA_MAP = {
  "monthly-close": "monthly-close",
  "regulatory-capital": "regulatory-capital",
};

// 3. The structured analysis sections
const JOURNEY_SECTIONS = {
  "monthly-close": [
    { id: "pre-close", title: "Step 1 - Pre-Close Data Collection", step: "Readiness Assessment" },
    { id: "reconciliations", title: "Step 2 - Automated Reconciliations", step: "Matching" },
    // ...
  ],
};
```

---

## 9. The Agent Console: Free-Form Chat

The Agent Console is a full-screen chat interface where users can ask anything.

### Layout

```
+---------------------------+--------------------+
|                           |  CONTEXT PANEL     |
|   CHAT MESSAGES           |  (right sidebar)   |
|                           |                    |
|   User: What's our Q1...  |  Active Files:     |
|                           |  - q1-actuals.json |
|   Agent Pipeline:         |  - budget.json     |
|   [file_fetch] Reading... |                    |
|   [skill_loading] ...     |  Quick Actions:    |
|   [memory_update] ...     |  - Variance Report |
|                           |  - Cash Position   |
|   Agent: Based on Q1...   |                    |
|                           |                    |
+---------------------------+--------------------+
| [input] Message CFO Agent...  [Send] / [Stop]  |
+---------------------------+--------------------+
```

### Key Components

1. **`<AgentPipelineStream>`** — Shows real-time tool calls as the agent works. Each step shows an icon (file, database, terminal, etc.), the tool name, and the file/action. Animated with Framer Motion.

2. **Stop Button** — When streaming, the send button becomes a red stop button (Square icon). Calls `abortController.abort()` which triggers `res.on("close")` server-side, cleanly stopping the GitClaw loop.

3. **Context Panel** — Right sidebar showing active files being referenced and quick action buttons.

### The Chat Hook (`useChatStream`)

```typescript
export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeEvents, setActiveEvents] = useState<ChatEvent[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    // 1. Add user message to state
    // 2. Create AbortController
    // 3. POST to /api/agent/chat with SSE
    // 4. Read stream chunks, parse SSE events
    // 5. Update messages (delta), events (tool_use), files (file_fetch)
  }, [messages]);

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, activeEvents, activeFiles, sendMessage, stopStream };
}
```

---

## 10. The Command Center: Home Page

The command center is the "at a glance" view. It has:

1. **Welcome Header** — Personalized greeting + AI search bar
2. **Journey Cards Grid** — 2-column grid of journey entry points with icons and descriptions
3. **Agent Insights** — Prioritized findings from across the system, severity-coded
4. **Actions Required** — Pending items needing human decision
5. **Aggregate Metrics** — Dashboard-level visualizations (gauges, charts, trends)

The AI search bar on the home page redirects to the Agent Console with the query pre-filled.

---

## 11. SSE Streaming Pipeline

### Server to Frontend Flow

```
GitClaw stream → Server maps events → SSE write → Network → 
Frontend fetch reader → Parse chunks → Split by \n\n → 
Parse event: and data: lines → JSON.parse → State updates → UI render
```

### SSE Format

```
event: delta
data: {"text":"Based on the Q1 actuals..."}

event: file_fetch  
data: {"file":"knowledge/financial-data/q1-actuals.json","action":"read(q1-actuals.json)"}

event: done
data: {"finished":true,"usage":{"inputTokens":2340,"outputTokens":891}}
```

### Frontend Parsing

```typescript
const reader = response.body.getReader();
const decoder = new TextDecoder("utf-8");
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const parts = buffer.split("\n\n");
  buffer = parts.pop() || "";  // Keep incomplete chunk in buffer
  
  for (const part of parts) {
    // Parse event: and data: lines
    // Route to appropriate state updater
  }
}
```

### Abort Flow

```
User clicks Stop → abortController.abort() 
  → fetch throws AbortError (frontend catches gracefully)
  → SSE connection closes
  → res.on("close") fires on server
  → server's abortController.abort()
  → GitClaw stops the agentic loop
```

---

## 12. Knowledge Base Design

### Principles

1. **Small files load always, large files load on demand.** The `always_load: true` files (org structure, policies) are tiny and provide essential context. The large data files (JSON, CSV) are loaded only when the agent needs them.

2. **Tag everything.** Tags in `index.yaml` let the agent find relevant files by topic. Use specific, overlapping tags: `[q1, actuals, revenue, expenses, pnl, income-statement]`.

3. **Organize by domain concept, not by format.** Don't put all CSVs together. Put all monthly-close data in `journey-data/monthly-close/`, all capital data in `journey-data/regulatory-capital/`.

4. **Use real data structures.** JSON files should have clear schemas. CSV files should have headers. The agent reads these raw — make them self-documenting.

### File Types

- **Markdown (.md)** — Policies, procedures, org charts. Good for always-load context.
- **JSON (.json)** — Structured data (financials, vendor registries, compliance matrices). Best for data the agent needs to analyze.
- **CSV (.csv)** — Tabular data (trial balances, transaction logs, reconciliation items). Good for journey-specific datasets.
- **YAML (.yaml)** — Configuration and mapping files.

---

## 13. Skills Design

### What Makes a Good Skill

A skill should represent a **complete workflow** that the agent can execute. It's not a single function — it's a playbook.

Example: `variance-analysis` skill doesn't just calculate variances. It:
1. Loads budget and actuals data
2. Calculates variance % for every line item
3. Identifies material items (>5% or >$50K)
4. Classifies root causes
5. Generates executive summary
6. Produces actionable recommendations

### Skill File Structure

```markdown
---
name: variance-analysis
description: Analyze budget vs actuals, identify material variances, generate root cause commentary
---

# Variance Analysis

## When to Use
[Clear trigger conditions]

## Data Requirements
[Which knowledge files to load]

## Methodology
[Step-by-step process]

## Output Format
[What the final output should look like]

## Thresholds
[Domain-specific thresholds and rules]
```

### How Many Skills

CFO OS has 26 skills. A good starting point is:
- One skill per journey (8 skills)
- One skill per major cross-cutting capability (variance analysis, board deck, vendor risk)
- Specialized skills for complex sub-domains (IFRS 9, regulatory capital, FX hedging)

Start with 8-12 skills (one per journey) and add more as you discover gaps.

---

## 14. Branding & Design System

### Current CFO OS Branding

- **Background:** `hsl(36, 33%, 94%)` — warm cream
- **Primary color:** `hsl(25, 62%, 25%)` — deep brown
- **Fonts:** Playfair Display (headings) + DM Sans (body)
- **Icons:** Lucide React only — no emojis anywhere
- **Logo:** Lyzr logo

### Adapting for New Domains

The branding system is in the Tailwind CSS theme. Change these variables:
- `--background` — page background
- `--primary` — buttons, links, accents
- `--card` — card surfaces
- Font imports in `index.html`

For different domains, adjust the warmth/coolness:
- Legal OS: Navy/slate palette (trust, authority)
- Sales OS: Blue/teal palette (energy, growth)  
- HR OS: Purple/warm palette (people, culture)

---

## 15. Step-by-Step: Building a New AgenticOS

### Phase 1: Agent Directory (Week 1)

1. Create `{domain}-agent/` directory
2. Write `agent.yaml` with domain-appropriate model settings and compliance
3. Write `SOUL.md` — who is this agent? What persona?
4. Write `RULES.md` — what must it always/never do?
5. Write `DUTIES.md` — daily/weekly/monthly responsibilities
6. Create `knowledge/index.yaml` with your data catalog
7. Add 2-3 always-load markdown files (org structure, policies)
8. Add domain data as JSON/CSV files
9. Create 8-12 skills (one per journey)
10. Create `memory/MEMORY.md` (empty, GitClaw will populate)

### Phase 2: Server (Week 1)

1. Copy the api-server artifact
2. Update `agent-chat.ts` — change `CFO_AGENT_DIR` path, update page context mappings
3. Update `journey-analyze.ts` — define new `JOURNEY_SKILL_MAP`, `JOURNEY_DATA_MAP`, `JOURNEY_SECTIONS`
4. Update `dashboard.ts` — read your domain's knowledge files for KPIs
5. Update `agent-info.ts` — point to new agent directory

### Phase 3: Frontend (Weeks 2-3)

1. Copy the dashboard artifact, rename
2. Update branding (colors, fonts, logo)
3. Update sidebar navigation with new journey names
4. Build command center with domain-specific metrics
5. Build journey pages following the Universal Journey Pattern:
   - Define CHAT_NUDGES, PENDING_ACTIONS, metrics, main content
   - Wire up `useAgentPipeline(journeyName)`
   - Add `<AgentPipelineButton>`, `<AgentPipelineContent>`, `<AiConclusion>`
   - Add `<JourneyChatPanel>` with nudges
6. The Agent Console, Skills Manager, Knowledge Base, and management pages are almost entirely reusable

### Phase 4: Data & Testing (Week 3)

1. Populate knowledge files with realistic sample data
2. Test each journey end-to-end (prepare -> analyze -> structured output)
3. Test the agent console with domain questions
4. Verify skills load correctly (check YAML frontmatter)
5. Verify knowledge files are indexed (check index.yaml tags)

---

## 16. What to Change vs. What to Keep

### Keep Identical (copy as-is)

- GitClaw integration pattern (query → stream → SSE)
- `bridgeReplitEnv()` function
- SSE event mapping (`toolNameToEventType`)
- `useChatStream` hook
- `<AgentPipelineStream>` component
- `<AiConclusion>` component (section parser)
- `<AgentPipelineButton>` + `<AgentPipelineContent>`
- `<PendingActionsStrip>` component
- `<JourneyChatPanel>` component
- Agent Console page layout
- Skills Manager page
- Knowledge Base page
- File System page
- Monorepo structure and shared packages

### Change Per Domain

- Agent directory content (SOUL, RULES, skills, knowledge)
- Journey names and routes
- Journey section definitions (JOURNEY_SECTIONS)
- Journey-to-skill mapping (JOURNEY_SKILL_MAP)
- Journey-to-data mapping (JOURNEY_DATA_MAP)
- Page context suffixes in agent-chat.ts
- Command center metrics and insights
- Journey page domain-specific content (KPIs, tables, visualizations)
- Chat nudges per journey
- Pending actions per journey
- Branding (colors, fonts, logo)
- Sample data

---

## 17. Common Pitfalls

### Architecture Mistakes

1. **Server reads files and calls Claude directly.** Wrong. The server calls `query()` and GitClaw handles everything. If your server is reading SKILL.md files or constructing prompts manually, you're bypassing GitClaw.

2. **Using `req.on("close")` instead of `res.on("close")`.** The request `close` event fires immediately when the POST body is consumed. The response `close` event fires when the client disconnects. Always use `res.on("close")`.

3. **Forgetting YAML frontmatter on skills.** GitClaw silently skips skills without `---\nname: ...\ndescription: ...\n---` at the top of SKILL.md. Always verify.

4. **Hardcoding ports.** Always read from `process.env.PORT`. The platform assigns unique ports per artifact.

### Knowledge Design Mistakes

5. **Loading everything always.** Don't set `always_load: true` on large data files. This wastes tokens. Let the agent load them on demand via tags.

6. **Poor tagging.** If a file about Q1 revenue isn't tagged with `[revenue, q1, actuals]`, the agent won't find it. Be generous with tags.

7. **Missing index.yaml entries.** Every knowledge file must be in index.yaml or the agent won't know it exists.

### Frontend Mistakes

8. **Not handling the stop/abort flow.** The abort must propagate from frontend (AbortController) through fetch (AbortError) through SSE connection close through `res.on("close")` to GitClaw's abort controller. Every link in this chain matters.

9. **Parsing SSE incorrectly.** SSE events are separated by `\n\n`. Each event has `event: {type}\n` and `data: {json}\n`. Keep a buffer for incomplete chunks.

10. **Not showing the agent pipeline.** Users need to see what the agent is doing. The pipeline visualization (loading config, reading files, running analysis) builds trust and transparency.

---

## Example: Adapting for Legal OS

```
legal-agent/
  agent.yaml          # name: legal-office-agent, tools: [cli, read, write, memory]
  SOUL.md              # "You are the General Counsel's AI — a senior legal strategist..."
  RULES.md             # "MUST NEVER: provide legal advice as definitive..."
  knowledge/
    index.yaml
    firm-policies.md   # always_load: true
    jurisdiction-map.md
    legal-data/
      active-matters.json
      contract-registry.json
      compliance-calendar.json
    journey-data/
      contract-review/
        pending-contracts.csv
      litigation-management/
        active-cases.csv
  skills/
    contract-review/SKILL.md
    litigation-management/SKILL.md
    compliance-monitoring/SKILL.md
    ip-portfolio/SKILL.md
    regulatory-change/SKILL.md

Journey pages:
  /contract-review        # Contract lifecycle management
  /litigation-management  # Case tracking and strategy
  /compliance-monitoring  # Regulatory compliance dashboard
  /ip-portfolio           # Patent and trademark management
  /regulatory-change      # Legal/regulatory change impact analysis
  /board-governance       # Corporate governance and board materials
  /vendor-contracts       # Third-party agreement management
  /policy-management      # Internal policy review and updates
```

The server and frontend patterns remain identical. Only the content changes.
