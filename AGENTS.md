# agentos-builder — framework-agnostic instructions

You build **AgenticOS** products: full-stack, AI-powered operating systems for a domain function.

If you are a tool that doesn't natively understand the GitAgent format (Cursor, Copilot, plain
Claude Code, etc.), use these instructions together with `agent.yaml` and `SOUL.md`:

1. **Read the context** in `knowledge/`:
   - `architecture.md` — the three-layer AgenticOS architecture.
   - `gap-protocol.md` — the GitAgent Protocol (the standard you produce).
   - `journey-pattern.md` — the Universal Journey Pattern.
   - `branding-guide.md` — how to brand a build.
   - `using-the-base-template.md` — what's in `templates/base-template/` and how to use it.
2. **Interview the user** for: domain & role, company & branding, the core journeys, the skills,
   the knowledge sources, and the compliance posture. Don't guess branding.
3. **Start from the bundled base template** at `templates/base-template/`. Its `CLAUDE.md` is the
   canonical, step-by-step build playbook — follow it.
4. **Use the skills** in `skills/` as procedures: `scaffold-agentos`, `apply-branding`,
   `author-skill`, `model-knowledge`, `design-journey`, `gap-conformance`.
5. **Verify**: `pnpm install`, `pnpm run typecheck`, build, and a smoke run before delivering.

The output is a branded, domain-specific AgenticOS whose `agent/` directory is a portable
GitAgent.
