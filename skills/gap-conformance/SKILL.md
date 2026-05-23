---
name: gap-conformance
description: Validate (and optionally normalize) an agent definition against the GitAgent Protocol (Open GAP) v0.1.0 — checking required manifest fields, skill frontmatter, the knowledge index, and the compliance schema, and flagging GitClaw-runtime field-name divergences.
metadata:
  category: review
  version: "1.0.0"
---

# GAP Conformance

## When to Use
Before delivering a build, and whenever the user wants the `agent/` directory to be a portable,
spec-valid GitAgent.

## Mandatory checks (GAP v0.1.0)
1. `agent.yaml` has `name` (kebab-case), `version` (semver), `description`; `spec_version`
   recommended.
2. `SOUL.md` exists with ≥1 non-empty paragraph.
3. Every skill in `skills:` exists under `skills/` and its `SKILL.md` has valid frontmatter
   (`name` + `description`).
4. Every referenced tool/sub-agent exists.
5. If a `compliance` block is present: `risk_tier` is set; for `high`/`critical` tiers,
   `supervision.human_in_the_loop ∈ {always, conditional}`, `recordkeeping.audit_logging: true`,
   and `model_risk.validation_cadence` is quarterly-or-more-frequent. Framework rules: `finra` ⇒
   `communications.fair_balanced` + `no_misleading` true; `federal_reserve` ⇒ `model_risk`
   present with `ongoing_monitoring: true`.

## Known base-template ↔ GAP field-name divergences
The base template targets the **GitClaw runtime**, which reads slightly different field names
than strict GAP. To normalize to portable GAP form:

| GitClaw runtime (template) | GAP v0.1.0 |
|---|---|
| `compliance.risk_level` | `compliance.risk_tier` |
| `compliance.human_in_the_loop: <bool>` | `compliance.supervision.human_in_the_loop: always\|conditional\|advisory\|none` |
| `compliance.recordkeeping.retention_days: <n>` | `recordkeeping.retention_period: "<n>y"` |
| `compliance.review.{cadence,approvers}` | `supervision.{review_cadence, designated_supervisor}` |
| `compliance.data_classification` | `data_governance.data_classification` |
| `knowledge/index.yaml` → `entries:` | `index.yaml` → `documents:` |
| `tools: [cli, read, write, memory]` (built-ins) | kebab-case names backed by `tools/<name>.yaml` |
| *(none)* | add `AGENTS.md`, `memory/runtime/` |

> ⚠️ If you rename `entries:`→`documents:` or `risk_level:`→`risk_tier:`, you must also update the
> api-server readers (`agent.ts`, `dashboard.ts`, `wiki.ts`) and the generated API client, or the
> dashboard's compliance/knowledge views break. Decide with the user whether to stay
> GitClaw-native or go portable-GAP.

## Output Format
A conformance report: PASS/FAIL per check, plus a list of any divergences with the exact fix.
If `gapman` is available, run `gapman validate --compliance` and include its output.
