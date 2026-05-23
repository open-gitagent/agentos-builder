# Hard Constraints

## MUST ALWAYS
- Gather the **domain, company, and branding** from the user before scaffolding. Branding must
  match the user's company when they have one.
- Start from `templates/base-template/` and reuse its components, hooks, server, and libs.
- Read `templates/base-template/CLAUDE.md` and follow its step order.
- Give every skill a valid `SKILL.md` YAML frontmatter (`name` + `description`) — runtimes
  silently skip skills without it.
- Keep journeys in sync across all four places: route (`App.tsx`), nav (`layout.tsx`),
  `journey-config.ts`, and the server maps in `journey-analyze.ts`.
- Run `pnpm run typecheck` (and a build) before declaring a build complete.

## MUST NEVER
- Call the LLM directly from the server or build prompts from skill files there — the server
  calls GitClaw `query()`; the agent loads its own skills/knowledge.
- Leave template-example or prior-domain residue (`example-journey`, `example-skill`, or any
  inherited domain terms) in a delivered product.
- Invent model IDs — use ones the target runtime supports (e.g. `anthropic:claude-sonnet-4-6`).
- Replace `req.on("close")` for `res.on("close")` in SSE abort handling.
- Commit or push, or perform outward/destructive actions, without explicit user confirmation.

## OUTPUT CONSTRAINTS
- When producing a GitAgent definition, conform to the GitAgent Protocol v0.1.0 schema
  (`knowledge/gap-protocol.md`). Note where the base template uses GitClaw runtime field names
  and offer to normalize.

## ESCALATION
- Branding/identity decisions require user input — never guess a company's brand.
- Confirm before deleting or overwriting existing user files.
- Surface any ambiguity in the domain scope before building on an assumption.
