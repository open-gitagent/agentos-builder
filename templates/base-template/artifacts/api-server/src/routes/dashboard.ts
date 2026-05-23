import { Router } from "express";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD DATA — neutral, static placeholder data for the home dashboard.
//
// These handlers return demonstration content with the response shape the
// frontend (command-center.tsx + the generated api client) expects. Replace the
// hardcoded arrays below with real queries against your own data sources once
// you adapt this template to a specific domain.
// ─────────────────────────────────────────────────────────────────────────────

router.get("/dashboard/metrics", (_req, res) => {
  const metrics = [
    {
      id: "records-processed",
      label: "Records Processed",
      value: "1,284",
      change: "+4.2%",
      changeType: "positive",
      trend: "up",
      detail: "vs 1,232 last period",
    },
    {
      id: "auto-handled",
      label: "Auto-Handled Rate",
      value: "96.2%",
      change: "+1.1pp",
      changeType: "positive",
      trend: "up",
      detail: "vs 95.1% last period",
    },
    {
      id: "avg-cycle-time",
      label: "Avg Cycle Time",
      value: "3.4h",
      change: "-12%",
      changeType: "positive",
      trend: "down",
      detail: "vs 3.9h last period",
    },
    {
      id: "items-needing-review",
      label: "Items Needing Review",
      value: "2/10",
      change: "2 flagged",
      changeType: "warning",
      trend: "stable",
      detail: "2 items below quality threshold",
    },
  ];

  res.json(metrics);
});

router.get("/dashboard/insights", (_req, res) => {
  const insights = [
    {
      id: "throughput-up",
      severity: "positive",
      headline: "Throughput up 4.2% this period",
      summary:
        "The example agent processed 1,284 records this period, up from 1,232. Auto-handling held above the 95% target with no degradation in quality scores.",
      category: "Operations",
      actionLabel: "View Details",
    },
    {
      id: "items-need-review",
      severity: "warning",
      headline: "2 items need review before sign-off",
      summary:
        "Two records fell below the configured quality threshold during the latest run and were routed to the review queue. Both are pending an owner decision.",
      category: "Quality",
      actionLabel: "Review Items",
    },
    {
      id: "policy-a-check",
      severity: "info",
      headline: "Policy A guardrail passed on all runs",
      summary:
        "Every run this period passed the Policy A guardrail and the output-safety check. No overrides were required and no exceptions were logged.",
      category: "Compliance",
      actionLabel: "View Guardrails",
    },
    {
      id: "data-source-latency",
      severity: "warning",
      headline: "Data Source response time elevated",
      summary:
        "The primary Data Source connector averaged 820ms this period, above the 500ms baseline. This added roughly 6 minutes to the end-to-end cycle but did not cause failures.",
      category: "Operations",
      actionLabel: "Investigate",
    },
    {
      id: "review-backlog-clear",
      severity: "positive",
      headline: "Review backlog cleared on schedule",
      summary:
        "All items routed to review in the prior period were resolved within SLA. Average time-to-decision was 1.2 hours against a 4-hour target.",
      category: "Quality",
      actionLabel: "View Details",
    },
  ];

  res.json(insights);
});

router.get("/dashboard/activity", (_req, res) => {
  const activities = [
    { id: "a1", timestamp: "2026-05-23T08:00:00Z", skill: "example-skill", action: "Completed example run — 1,284 records processed, 2 flagged for review", status: "completed" },
    { id: "a2", timestamp: "2026-05-23T07:45:00Z", skill: "example-skill", action: "Routed 2 records below quality threshold to the review queue", status: "escalated" },
    { id: "a3", timestamp: "2026-05-23T07:30:00Z", skill: "example-skill", action: "Refreshed reference data from the Data Source connector", status: "completed" },
    { id: "a4", timestamp: "2026-05-23T07:15:00Z", skill: "example-skill", action: "Generated run summary for the latest example journey", status: "completed" },
    { id: "a5", timestamp: "2026-05-23T07:00:00Z", skill: "example-skill", action: "Started scheduled example journey run", status: "in_progress" },
    { id: "a6", timestamp: "2026-05-22T18:00:00Z", skill: "example-skill", action: "Output-safety guardrail check: 0 violations across 1,232 records", status: "monitoring" },
    { id: "a7", timestamp: "2026-05-22T16:30:00Z", skill: "example-skill", action: "Data Source latency exceeded baseline — flagged for monitoring", status: "flagged" },
    { id: "a8", timestamp: "2026-05-22T14:00:00Z", skill: "example-skill", action: "Review backlog cleared — all prior items resolved within SLA", status: "resolved" },
    { id: "a9", timestamp: "2026-05-22T10:00:00Z", skill: "example-skill", action: "Completed example run — auto-handling held above 95% target", status: "completed" },
    { id: "a10", timestamp: "2026-05-21T16:00:00Z", skill: "example-skill", action: "Policy A guardrail updated to v2 — applied to all subsequent runs", status: "alert" },
  ];

  res.json(activities);
});

export default router;
