# agentos-builder

A **GitAgent** (Open GAP v0.1.0) that builds production-grade **AgenticOS** products from a
bundled base template. *Clone this repo, point Claude Code (or any GAP runtime) at it, and it
turns a domain brief into a full-stack AgenticOS.*

```
Domain brief  ──►  agentos-builder  ──►  branded, domain-specific AgenticOS
                   (this agent)          (built on templates/base-template/)
```

## What's inside

| Path | What it is |
|------|------------|
| `agent.yaml` | GAP manifest (skills, model, compliance). |
| `SOUL.md` / `RULES.md` / `DUTIES.md` / `AGENTS.md` | Identity, guardrails, SoD, fallback instructions. |
| `skills/` | The build procedures: `scaffold-agentos`, `apply-branding`, `author-skill`, `model-knowledge`, `design-journey`, `gap-conformance`. |
| `knowledge/` | All the context: architecture, the GitAgent Protocol, the journey pattern, branding, and a template guide. |
| `workflows/build-agentos.yaml` | A SkillsFlow that runs the build end-to-end. |
| `templates/base-template/` | **The base template, bundled.** A clean, domain-agnostic AgenticOS (its own `CLAUDE.md` is the canonical build playbook). |
| `examples/` | A worked build interaction. |

## How to use it

1. Open this repo in Claude Code (or run it through a GAP runtime / `gapman`).
2. It will interview you for your domain, company & branding, journeys, skills, and knowledge.
3. It scaffolds a new AgenticOS in `templates/base-template/` (copy it out first if you want to
   keep this builder pristine), following `templates/base-template/CLAUDE.md`.
4. It typechecks, builds, and smoke-tests before declaring done.

## Standards
- Built to the **GitAgent Protocol (Open GAP) v0.1.0** — https://gitagent.sh
- The bundled template runs on the **GitClaw** runtime; `agent/` is a portable GitAgent.

Powered by Lyzr AgenticOS.
