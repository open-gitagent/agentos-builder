# GitAgent Protocol (Open GAP) v0.1.0 — summary

"Clone a repo, get an agent." A framework-agnostic, git-native standard for defining an AI agent
as a folder of plain files, portable across Claude Code, OpenAI, CrewAI, LangChain, Lyzr, GitClaw,
etc. Reference CLI: `gapman`. Site: https://gitagent.sh · Spec:
`open-gitagent/gitagent-protocol → spec/SPECIFICATION.md`.

## The file contract
- **Required:** `agent.yaml` (`name` kebab-case, `version` semver, `description`; recommend
  `spec_version: "0.1.0"`) and `SOUL.md` (identity, ≥1 paragraph).
- **Behavioral:** `RULES.md` (hard constraints; *appends* to parent on inheritance),
  `DUTIES.md` (segregation of duties), `AGENTS.md` (framework-agnostic fallback for Cursor/Copilot).
- **Standard directories (optional):**
  - `skills/<name>/SKILL.md` — the **Agent Skills** open standard. Frontmatter REQUIRED:
    `name` (kebab, ≤64) + `description` (≤1024). gitagent extras go under `metadata:`.
    Progressive disclosure: metadata → full skill (<5k tokens) → resources.
  - `tools/<name>.yaml` — MCP-compatible tool defs (input/output schema, implementation, annotations).
  - `workflows/` — **SkillsFlow**: YAML with `inputs` + `steps` (`id`, `action`/`skill`/`tool`,
    `depends_on`, `inputs`, `outputs`, `conditions`); `${{ }}` templating. Markdown narrative form allowed.
  - `knowledge/index.yaml` — `documents:` entries with `path`, `tags`, `priority`, `always_load`.
  - `memory/` — `MEMORY.md` (≤200 lines) + `runtime/` (live state) + `archive/`; optional `memory.yaml`.
  - `hooks/hooks.yaml` — `on_session_start` / `pre_tool_use` / `post_response` / `on_error`;
    scripts get JSON on stdin, return `{action: allow|block|modify, modifications, audit}`.
  - `config/` (`default.yaml` + `<env>.yaml`, deep-merged), `compliance/`
    (`regulatory-map.yaml`, `validation-schedule.yaml`, `audit-log.schema.json`),
    `agents/` (recursive sub-agents — full dir or `<name>.md`), `examples/`, `.gitagent/` (gitignored).

## Manifest (key optional fields)
`author`, `license`, `model.{preferred,fallback,constraints}`, `extends` (single-parent deep-merge),
`dependencies` (mount other agents), `skills`, `tools`, `agents`, `delegation.mode`
(`auto|explicit|router`), `runtime.{max_turns,temperature,timeout}`, `a2a`, `tags`, `metadata`,
and `compliance`.

## Compliance model (v0.1.0)
`compliance.risk_tier: low|standard|high|critical`; `frameworks: [finra, federal_reserve, sec, …]`;
`supervision.{designated_supervisor, review_cadence, human_in_the_loop: always|conditional|advisory|none,
escalation_triggers, override_capability, kill_switch}`; `recordkeeping.{audit_logging, log_format,
retention_period, immutable}`; `model_risk`, `data_governance`, `communications`, `vendor_management`,
`segregation_of_duties` (roles/conflicts/assignments/handoffs/enforcement: strict|advisory),
`financial_governance`. Validation: high/critical ⇒ HITL ∈ {always,conditional} + audit logging +
quarterly-or-tighter model validation; `finra` ⇒ fair_balanced + no_misleading; `federal_reserve`
⇒ model_risk with ongoing_monitoring.

## CLI & adapters
`gapman init|validate [--compliance]|info|export --format <fmt>|import|install|audit|skills …`.
Export adapters include: claude-code, openai, crewai, lyzr, gitclaw, opencode, gemini, cursor,
copilot, codex, github, git.

## Where the base template diverges (it targets the GitClaw runtime)
`risk_level`→`risk_tier`, top-level `human_in_the_loop:<bool>`→`supervision.human_in_the_loop:<enum>`,
`retention_days`→`recordkeeping.retention_period`, `review`→`supervision`, top-level
`data_classification`→`data_governance.data_classification`, `knowledge/index.yaml: entries:`→`documents:`,
and `tools: [cli,read,write,memory]` (GitClaw built-ins) vs `tools/<name>.yaml`. Use the
`gap-conformance` skill to normalize — but update the api-server readers + generated client too.
