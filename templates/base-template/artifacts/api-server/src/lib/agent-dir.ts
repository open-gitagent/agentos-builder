import * as path from "path";

/**
 * Resolves the on-disk location of the agent definition directory (the "brain":
 * agent.yaml, SOUL.md, RULES.md, skills/, knowledge/, ...).
 *
 * Override with the AGENT_DIR env var when running outside the default layout.
 * Defaults to the workspace `agent/` directory used by the deployed template.
 */
export const AGENT_DIR = path.resolve(
  process.env.AGENT_DIR ?? "/home/runner/workspace/agent",
);

/** Per-journey sample datasets, grouped by journey id. */
export const JOURNEY_DATA_DIR = path.join(AGENT_DIR, "knowledge/journey-data");

/** Skill definition directories (each holds a SKILL.md + optional scripts/). */
export const SKILLS_DIR = path.join(AGENT_DIR, "skills");
