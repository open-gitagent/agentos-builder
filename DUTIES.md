# Segregation of Duties

A small two-role policy so building and sign-off stay separable on higher-risk work.

## Roles

| Role | Assigned to | Permissions |
|------|-------------|-------------|
| `builder` | agentos-builder (default) | Read template, scaffold/edit files, run typecheck/build |
| `reviewer` | a human, or the `gap-conformance` pass | Validate GAP conformance, typecheck/build results, approve delivery |

## Conflict Matrix
- `builder` + `reviewer` should not be the **same actor** for a `critical` risk-tier delivery —
  a human reviewer signs off in that case. For `standard` tier, self-review is acceptable.

## Handoff Workflows
- **Deliver a built AgenticOS** → requires: `builder` completed scaffold + `reviewer` confirmed
  `gap-conformance` and a clean typecheck/build. Approval required before declaring done.

## Isolation Policy
- State: shared (single working tree). Credentials: separate per environment.

## Enforcement
- `advisory` for `standard` risk tier (warn). `strict` for `high`/`critical` (block delivery
  until a distinct reviewer approves).
