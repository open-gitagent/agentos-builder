---
# REQUIRED: GitClaw skips any skill whose SKILL.md lacks `name` and `description`.
name: example-skill
description: A template skill that analyzes a CSV dataset and produces a structured summary. Copy this directory to create your own skills.
---

# Example Skill

<!--
  This is a worked example of a GitClaw skill. Use it as a template:
  1. Copy this directory to skills/<your-skill-name>/.
  2. Update the `name` and `description` in the frontmatter above.
  3. Rewrite the sections below for your domain.
  4. Register the skill name under `skills:` in agent.yaml.
  Keep the section headings (When to Use, Data Requirements, Methodology,
  Output Format) so the agent can reason about the skill consistently.
-->

## When to Use

Use this skill when the user asks the agent to analyze the example dataset and
report a summary — for instance, "summarize the example records" or "what are the
totals by category?". Replace this with the trigger conditions for your domain.

## Data Requirements

This skill reads small, neutral example datasets from the knowledge base:

- `knowledge/journey-data/example-journey/sample.csv` — primary input rows.
- `knowledge/journey-data/example-journey/records.csv` — a second, related dataset.
- `knowledge/example-data.json` — optional reference records (loaded on demand).

Each CSV uses generic columns: `id`, `name`, `category`, `value`, `status`, `date`.
List your own required inputs here so the agent knows what to load.

## Methodology

1. **Load the data.** Read the input CSV(s) from the paths above.
2. **Validate.** Confirm the expected columns are present and values parse cleanly.
3. **Aggregate.** Group rows by `category` and compute count and total `value`.
4. **Flag.** Surface any row whose `status` is not `active` for follow-up.
5. **Summarize.** Produce a short executive summary plus a per-category table.

Replace these steps with the real procedure your skill performs.

## Output Format

Return a brief summary paragraph followed by a Markdown table:

```
Summary: <one or two sentences with the headline finding>.

| Category | Count | Total Value | Notes        |
|----------|-------|-------------|--------------|
| ...      | ...   | ...         | ...          |
```

Always cite the source files used and label any computed estimate as such.
