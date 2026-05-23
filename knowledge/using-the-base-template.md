# Using the bundled base template

The base template lives at **`templates/base-template/`** — a clean, domain-agnostic AgenticOS.
**Its `CLAUDE.md` is the canonical, always-current build playbook** — read it first; this doc is
just the map.

## Repo map (keep vs replace)
```
agent/                         ← THE BRAIN. Replace its CONTENT per domain.
  agent.yaml, SOUL/RULES/DUTIES
  skills/example-skill/        one example skill (+ scripts) — copy per capability
  knowledge/ (index.yaml, org-structure.md, example-data.json, journey-data/example-journey/)
  workflows/ compliance/ hooks/ config/ memory/ examples/ agents/ .gitagent/
artifacts/
  api-server/                  KEEP — thin GitClaw wrapper. Edit only the journey maps + dashboard data.
    src/lib/agent-dir.ts        centralized AGENT_DIR
    src/routes/                agent, agent-chat, journey-analyze, wiki, audit, dashboard, file-extract, health
  dashboard/                   KEEP components/hooks/shell; replace page CONTENT.
    src/lib/brand.ts            ← branding
    src/pages/example-journey.tsx  ← the journey template to copy
    src/components/             reusable journey/observe components (do not rebuild)
    src/index.css               theme (BRAND THEME block)
  mockup-sandbox/              dev-only preview
lib/                           KEEP — api-spec (OpenAPI+Orval), api-client-react, api-zod, db, integrations-anthropic-ai
CLAUDE.md                      ← canonical build playbook
```

## Build order (mirrors CLAUDE.md)
0. **Interview** the user (domain, company & branding, journeys, skills, knowledge, compliance).
1. **Brand** → `apply-branding` (brand.ts, theme, logo, title).
2. **Identity** → `scaffold-agentos` (agent.yaml + SOUL/RULES/DUTIES).
3. **Skills** → `author-skill` (one per capability; SKILL.md frontmatter required).
4. **Knowledge** → `model-knowledge` (data + `index.yaml`).
5. **Journeys** → `design-journey` (copy `example-journey`; sync route + nav + config + server maps).
6. **Command Center / Observe / `dashboard.ts`** → replace placeholder data.
7. **Verify** → `pnpm run typecheck` + build + smoke run; then `gap-conformance`.
8. **Remove the example** (`example-journey`, `example-skill`) once real content exists.

## How to consume the template
Copy it out so this builder stays pristine:
`cp -R templates/base-template/ <target-dir>/` (skip `node_modules`, `dist`, `.git`), then build
inside `<target-dir>/`. Install with **pnpm ≥ 9.5** (the workspace uses the `catalog:` protocol).

## Verification commands
```
pnpm install
pnpm run typecheck                 # composite, must be clean
pnpm --filter @workspace/dashboard build
pnpm --filter @workspace/api-server build
# boot: PORT + AI_INTEGRATIONS_ANTHROPIC_* envs; dashboard Vite proxies /api → :8080
```
