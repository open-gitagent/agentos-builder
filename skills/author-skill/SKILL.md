---
name: author-skill
description: Author a new agent skill for the domain by copying the example skill, writing a SKILL.md with valid Agent-Skills frontmatter, and (optionally) adding a deterministic script — then registering it in agent.yaml.
metadata:
  category: build
  version: "1.0.0"
---

# Author a Skill

## When to Use
For each capability the agent needs (often one skill per journey, plus cross-cutting ones).

## Methodology
1. **Copy** `agent/skills/example-skill/` → `agent/skills/<skill-id>/` (kebab-case id).
2. **Frontmatter (REQUIRED).** `SKILL.md` must start with YAML frontmatter:
   ```
   ---
   name: <skill-id>          # kebab-case, ≤64 chars, matches the directory
   description: <one line>   # ≤1024 chars; this is what the agent routes on
   ---
   ```
   Runtimes (GitClaw and GAP) silently skip a skill with no/invalid frontmatter.
3. **Body.** Keep the section headings the template uses so the agent reasons consistently:
   `## When to Use`, `## Data Requirements`, `## Methodology`, `## Output Format`. Write the real
   procedure for the domain.
4. **Scripts (optional).** Put deterministic computation in `scripts/` and call it from the
   methodology. Keep scripts small and well-commented.
5. **Register.** Add the skill id under `skills:` in `agent/agent.yaml`.

## GAP / Agent Skills notes
- Skills follow the Agent Skills open standard. gitagent-specific extras (author, version,
  category, risk_tier) go under a `metadata:` map in the frontmatter to stay portable.
- Progressive disclosure: keep the full skill under ~5000 tokens; push detail into
  `references/` or `scripts/`.

## Output Format
A new `agent/skills/<id>/SKILL.md` (+ optional `scripts/`) registered in `agent.yaml`. Confirm
the frontmatter is valid and the id is listed.
