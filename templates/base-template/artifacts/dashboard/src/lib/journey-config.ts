export interface CalendarItem {
  label: string;
  due: string;
  daysOut: number;
  status: "ok" | "warning" | "critical";
  detail?: string;
}

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  delta: string;
}

export interface EvidencePackItem {
  name: string;
  source: string;
  type: "csv" | "pdf" | "json" | "xml" | "xbrl";
}

export interface JourneyConfig {
  id: string;
  title: string;
  cadence: string;
  sla: string;
  approvers: string[];
  dualControl: boolean;
  calendar: CalendarItem[];
  scenarios: ScenarioPreset[];
  evidencePack: EvidencePackItem[];
  handoffRoles: string[];
}

// One entry per journey. Copy the "example-journey" block to add your own, and
// keep the key in sync with the route, nav item, and the server-side maps.
export const JOURNEY_CONFIG: Record<string, JourneyConfig> = {
  "example-journey": {
    id: "example-journey",
    title: "Example Journey",
    cadence: "On demand",
    sla: "Same session",
    approvers: ["Owner", "Reviewer"],
    dualControl: false,
    calendar: [
      { label: "Step 1 — Intake", due: "Today", daysOut: 0, status: "ok" },
      { label: "Step 2 — Checks", due: "Today", daysOut: 0, status: "warning", detail: "2 items need review" },
      { label: "Step 3 — Output", due: "Today", daysOut: 0, status: "ok" },
    ],
    scenarios: [
      { id: "scenario-a", label: "Scenario A", description: "An example what-if scenario", delta: "+12% volume" },
      { id: "scenario-b", label: "Scenario B", description: "Another example what-if scenario", delta: "−1 day SLA" },
    ],
    evidencePack: [
      { name: "Sample Dataset", source: "Knowledge", type: "csv" },
      { name: "Run Summary", source: "Internal", type: "json" },
    ],
    handoffRoles: ["Owner", "Reviewer", "Auditor"],
  },
};

export function getJourneyConfig(id: string): JourneyConfig {
  return JOURNEY_CONFIG[id] ?? {
    id,
    title: id,
    cadence: "Ad-hoc",
    sla: "—",
    approvers: ["Owner"],
    dualControl: false,
    calendar: [],
    scenarios: [],
    evidencePack: [],
    handoffRoles: ["Owner"],
  };
}
