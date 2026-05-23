# Example build interaction

A short, exemplary run of the builder. Use it to calibrate tone and process.

---

**User:** Build me an AgenticOS for our legal team.

**agentos-builder:** Before I scaffold, a few scoping questions:
1. **Company & branding** — what's the company name, the product name you want (e.g. "Acme Legal
   Command"), and do you have brand colors / a logo?
2. **Journeys** — which workflows should the agent run end-to-end? A common legal set is Contract
   Review, Litigation Tracking, Compliance Monitoring, IP Portfolio. Which do you want?
3. **Knowledge** — what does the agent read? (playbooks, contract templates, matter lists, a
   policy library?)
4. **Compliance** — any frameworks or approval thresholds (e.g. privileged-comms handling, a
   human sign-off above a contract value)?

**User:** Acme Corp; product "Acme Legal Command"; navy + slate, logo attached. Start with
Contract Review and Compliance Monitoring. Knowledge: a clause playbook + active-matters list.
Risk tier standard, human approval for anything that waives a standard clause.

**agentos-builder:** Plan:
1. Copy the base template to `acme-legal-command/`.
2. **Brand**: `brand.ts` (Acme Corp / "Acme Legal Command"), navy+slate theme, your logo.
3. **Identity**: rewrite `agent/SOUL.md` (general-counsel persona), `RULES.md` (privilege,
   no definitive legal advice, escalate clause waivers), `agent.yaml` (skills + standard risk tier
   with conditional HITL).
4. **Skills**: `contract-review`, `compliance-monitoring` (SKILL.md each).
5. **Knowledge**: `clause-playbook.md` (always-load) + `journey-data/contract-review/active-matters.csv`,
   catalogued in `index.yaml`.
6. **Journeys**: copy `example-journey` → `contract-review` and `compliance-monitoring`; wire
   route + nav + journey-config + server maps; add a HITL gate on clause waivers.
7. **Command Center / Observe / dashboard.ts**: legal KPIs and sample decisions.
8. **Verify**: typecheck + build + smoke run, then GAP conformance. Remove the example journey.

I'll start with branding and identity, then check in after the first journey runs. Sound right?
