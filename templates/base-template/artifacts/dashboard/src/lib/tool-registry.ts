import {
  Database, Boxes, Plug, Server, MessageSquare, Warehouse, type LucideIcon
} from "lucide-react";
import type { SourceSystem } from "./journey-events";

export interface SystemBranding {
  label: string;
  icon: LucideIcon;
  accent: string;
  bg: string;
  border: string;
  badge: string;
  logoUrl?: string;
  tooltip?: string;
}

// Visual branding for each integration "system" shown in tool-call cards.
// Add / rename entries to match your domain's connectors (keep keys in sync
// with the SourceSystem union in lib/journey-events.ts).
export const SYSTEM_REGISTRY: Record<SourceSystem, SystemBranding> = {
  erp: {
    label: "ERP System",
    icon: Boxes,
    accent: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    tooltip: "ERP / system of record — your core business application",
  },
  database: {
    label: "Database",
    icon: Database,
    accent: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    tooltip: "Operational database — transactional records",
  },
  api: {
    label: "External API",
    icon: Plug,
    accent: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    tooltip: "Third-party API integration",
  },
  warehouse: {
    label: "Data Warehouse",
    icon: Warehouse,
    accent: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    tooltip: "Analytical data warehouse / lake",
  },
  messaging: {
    label: "Messaging",
    icon: MessageSquare,
    accent: "text-fuchsia-700",
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    badge: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    tooltip: "Team messaging used for agent run notifications and approvals",
  },
  internal: {
    label: "Internal Service",
    icon: Server,
    accent: "text-stone-700",
    bg: "bg-stone-50",
    border: "border-stone-200",
    badge: "bg-stone-100 text-stone-700 border-stone-200",
    tooltip: "Internal microservice — your own compute / data services",
  },
};

export function formatToolCall(system: string, verb: string, args: Record<string, unknown>): string {
  const argStr = Object.entries(args)
    .map(([k, v]) => `${k}=${typeof v === "string" ? `"${v}"` : v}`)
    .join(", ");
  return `${system}.${verb}(${argStr})`;
}
