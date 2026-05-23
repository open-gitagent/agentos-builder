---
name: model-knowledge
description: Model the agent's knowledge base for the domain — add reference docs and per-journey datasets under agent/knowledge/ and catalog them in index.yaml with tags, priority, and always_load.
metadata:
  category: build
  version: "1.0.0"
---

# Model Knowledge

## When to Use
After identity, when wiring the data the agent reads.

## Methodology
1. **Always-load context.** Small, critical docs go at `agent/knowledge/` (e.g. an
   `org-structure.md`, policies/guidelines). These are loaded every session.
2. **Per-journey datasets.** Put a journey's data under
   `agent/knowledge/journey-data/<journey>/` (CSV/JSON). The server reads these in
   `journey/prepare` and `journey/analyze`.
3. **Reference data.** Larger datasets the agent loads on demand go under `agent/knowledge/`
   with `always_load: false`.
4. **Catalog in `index.yaml`.** Add an entry per file with `tags` (generous, overlapping),
   `priority`, and `always_load`. Only set `always_load: true` for small, essential files.

## index.yaml shape (this template / GitClaw runtime)
```yaml
entries:
  - path: org-structure.md
    tags: [organization, structure]
    priority: high
    always_load: true
  - path: journey-data/<journey>/data.csv
    tags: [<journey>, dataset]
    priority: high
    always_load: false
```
> The strict GitAgent Protocol uses the key `documents:` instead of `entries:`. The base
> template uses `entries:` for the GitClaw runtime — run `gap-conformance` if you need the
> portable form.

## Output Format
A populated `agent/knowledge/` tree with every file catalogued in `index.yaml`. Confirm tags and
`always_load` choices are sensible (large files on demand).
