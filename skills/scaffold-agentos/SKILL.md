---
name: scaffold-agentos
description: Stand up a new AgenticOS for a domain by starting from the bundled base template, setting the agent identity (agent.yaml/SOUL/RULES/DUTIES), and removing the example content once real journeys/skills exist.
metadata:
  category: build
  version: "1.0.0"
---

# Scaffold an AgenticOS

## When to Use
At the start of a build, after you've interviewed the user for domain, company, branding,
journeys, skills, and knowledge.

## Prerequisites
- A copy of the base template to work in. The canonical source is `templates/base-template/`.
  Copy it to the user's target location first (keep this builder pristine):
  `cp -R templates/base-template/ <target>/` (exclude `node_modules`, `dist`, `.git`).

## Methodology
1. **Read** `templates/base-template/CLAUDE.md` — it is the canonical step order. This skill
   orchestrates Steps 1–7 there.
2. **Branding** (`apply-branding` skill): set `src/lib/brand.ts`, the theme block in
   `index.css`, the logo, and `index.html` title.
3. **Identity** in `agent/`: rewrite `SOUL.md`, `RULES.md`, `DUTIES.md`, and `agent.yaml`
   (`name`, `description`, `skills:` list, `compliance`). Keep `model`/`tools`/`runtime` unless
   the user needs otherwise.
4. **Skills** (`author-skill`): add one skill per capability under `agent/skills/`.
5. **Knowledge** (`model-knowledge`): add data + `agent/knowledge/index.yaml`.
6. **Journeys** (`design-journey`): add each journey (page + route + nav + journey-config +
   server maps).
7. **Command Center / Observe / dashboard.ts**: replace placeholder data with the domain's.
8. **Remove the example** once real content exists: delete `example-journey` (page, route, nav,
   config, server-map entries) and `agent/skills/example-skill` + its journey-data. Run
   `gap-conformance` and `pnpm run typecheck`.

## Output Format
A working tree where: the sidebar shows the domain's journeys, `agent/` describes the domain
agent, and `pnpm run typecheck` + a build pass. Report the list of journeys/skills created and
the verification result.

## Guardrails
- Reuse the template's shared components/hooks/server — never rebuild them.
- Keep the server a thin GitClaw passthrough.
- Don't leave `example-*` or any prior-domain residue in a delivered product.
