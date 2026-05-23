import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Network,
  Boxes,
  Bot,
  Wrench,
  BookOpen,
  Puzzle,
  Workflow,
  Inbox,
  Search,
  Shield,
  Scale,
  ClipboardList,
  LayoutGrid,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSampleData } from "@/components/sample-data-context";
import { BRAND } from "@/lib/brand";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: typeof Home;
}

interface NavSection {
  header?: string;
  items: NavItem[];
}

// The sidebar navigation. Add a nav item per journey under "Agent Journeys".
const nav: NavSection[] = [
  {
    items: [
      { label: "Home", path: "/", icon: Home },
      { label: "Compliance & Governance", path: "/compliance-governance", icon: Scale },
      { label: "LLM Wiki", path: "/wiki", icon: Network },
    ],
  },
  {
    header: "Agent Journeys",
    items: [
      { label: "Example Journey", path: "/example-journey", icon: Boxes },
    ],
  },
  {
    header: "Build",
    items: [
      { label: "Agent Studio", path: "/agent-studio", icon: Bot },
      { label: "Skills Manager", path: "/skills-manager", icon: Wrench },
      { label: "Knowledge Base", path: "/knowledge-base", icon: BookOpen },
      { label: "Integrations", path: "/integrations", icon: Puzzle },
      { label: "Skill Flows", path: "/skill-flows", icon: Workflow },
    ],
  },
  {
    header: "Observe",
    items: [
      { label: "Decision Inbox", path: "/decision-inbox", icon: Inbox },
      { label: "Agent Metrics", path: "/agent-matrix", icon: LayoutGrid },
      { label: "Agent Runs", path: "/agent-runs", icon: Search },
      { label: "Compliance & Guardrails", path: "/compliance-guardrails", icon: Shield },
      { label: "Audit Trail", path: "/audit-trail", icon: ClipboardList },
    ],
  },
];

// Paths that render a docked journey chat rail (reserves right-edge space).
const JOURNEY_PATHS = ["/example-journey"];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { sampleDataEnabled, setSampleDataEnabled } = useSampleData();

  const isJourney = JOURNEY_PATHS.some((p) => location === p || location.startsWith(`${p}/`));

  return (
    <div className="flex h-full bg-background overflow-hidden selection:bg-primary/30 selection:text-primary-foreground">
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col relative z-20">
        <div className="h-20 flex items-center px-5 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={BRAND.logoSrc} alt={BRAND.productName} className="w-12 h-12 rounded-lg object-contain" />
            <div>
              <h1 className="font-serif font-bold text-sm leading-tight text-foreground tracking-tight">{BRAND.productName}</h1>
              <p className="text-[9px] text-accent font-semibold tracking-widest font-sans">{BRAND.productTagline}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-3">
          {nav.map((section, sIdx) => (
            <div key={sIdx} className={cn(sIdx > 0 && "mt-1")}>
              {section.header && (
                <div className="px-3 pt-3 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{section.header}</span>
                </div>
              )}
              {!section.header && sIdx > 0 && <div className="h-px bg-border my-2 mx-2" />}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 group",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 transition-colors flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">Sample Data</span>
            <button
              onClick={() => setSampleDataEnabled(!sampleDataEnabled)}
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors duration-200",
                sampleDataEnabled ? "bg-primary" : "bg-muted-foreground/30"
              )}
              title={sampleDataEnabled ? "Showing sample data -- click to show only actual data" : "Showing actual data only -- click to show sample data"}
            >
              <span className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                sampleDataEnabled && "translate-x-4"
              )} />
            </button>
          </div>
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-muted/50 border border-border">
            <CircleDot className="w-4 h-4 text-success animate-pulse flex-shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-medium text-foreground">Agent Active</span>
              <span className="text-[10px] text-muted-foreground">{BRAND.poweredBy}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 relative flex flex-col h-full overflow-hidden bg-background">
        <div
          className={cn("flex-1 overflow-y-auto w-full")}
          style={{
            overflowAnchor: "none",
            paddingRight: isJourney ? "var(--journey-rail-width, 360px)" : undefined,
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
