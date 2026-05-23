import { useState } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ArrowRight,
  ClipboardCheck,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Eye,
  ChevronDown,
  ChevronRight,
  Send,
  Mic,
  Plus,
  Boxes,
  ListChecks,
  Shield,
  BarChart3,
  Workflow,
  FileText,
  Sparkles
} from "lucide-react";
import { useGetDashboardInsights } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import HomeMetrics from "@/components/home-metrics";
import { useSampleData } from "@/components/sample-data-context";
import { BRAND } from "@/lib/brand";

interface DashboardInsight {
  id: string;
  severity: string;
  headline: string;
  summary: string;
  category: string;
  actionLabel?: string;
}

interface PendingAction {
  id: string;
  type: string;
  title: string;
  description: string;
  amount?: string;
  urgency: string;
  requester: string;
  dueDate: string;
  category: string;
}

const pendingActions: PendingAction[] = [
  {
    id: "pa1",
    type: "approval",
    title: "Run Summary — Final Sign-Off",
    description: "Output package from the latest example run is ready for owner review. Includes summary commentary and updated metrics.",
    amount: undefined,
    urgency: "high",
    requester: "Operations Team",
    dueDate: "May 24, 2026",
    category: "Reporting"
  },
  {
    id: "pa2",
    type: "approval",
    title: "Connector Renewal — Data Source",
    description: "Annual renewal for the Data Source connector. Agent flagged an 18% usage increase vs. last period. Alternatives scored.",
    amount: "Plan B",
    urgency: "high",
    requester: "Platform",
    dueDate: "May 25, 2026",
    category: "Integrations"
  },
  {
    id: "pa3",
    type: "review",
    title: "Quality Exception Report",
    description: "The example agent flagged 2 records that scored below the configured quality threshold. Requires owner review before escalation.",
    amount: "2 items",
    urgency: "critical",
    requester: "Agent: example-skill",
    dueDate: "May 23, 2026",
    category: "Compliance"
  },
  {
    id: "pa4",
    type: "approval",
    title: "Capacity Reallocation",
    description: "Request to reallocate processing capacity from deferred tasks to the accelerated example journey pipeline.",
    amount: "+12 units",
    urgency: "medium",
    requester: "Operations",
    dueDate: "May 28, 2026",
    category: "Planning"
  },
  {
    id: "pa5",
    type: "review",
    title: "Threshold Adjustment",
    description: "Throughput dipped below the configured minimum. Agent recommends raising the review threshold based on a 90-day projection.",
    amount: undefined,
    urgency: "medium",
    requester: "Agent: example-skill",
    dueDate: "May 26, 2026",
    category: "Operations"
  }
];

export default function CommandCenter() {
  const { sampleDataEnabled } = useSampleData();
  const { data: insights = [] } = useGetDashboardInsights() as { data: DashboardInsight[] | undefined };
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(new Set());
  const [showAllActions, setShowAllActions] = useState(false);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const visibleActions = sampleDataEnabled ? pendingActions.filter(a => !dismissedActions.has(a.id)) : [];
  const displayedActions = showAllActions ? visibleActions : visibleActions.slice(0, 3);
  const hasMoreActions = visibleActions.length > 3 && !showAllActions;
  const displayedInsights = showAllInsights ? insights : insights.slice(0, 3);
  const hasMoreInsights = insights.length > 3 && !showAllInsights;

  const handleQuerySubmit = () => {
    if (!query.trim()) return;
    setLocation(`/console?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-4">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center pt-16 pb-8"
      >
        <img src={BRAND.logoSrc} alt={BRAND.productName} className="w-20 h-20 object-contain mb-3" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          <span className="text-[hsl(25,62%,25%)]">Welcome back</span>
        </h1>
        <div className="flex items-center gap-2 justify-center mt-1">
          <p className="text-sm text-muted-foreground">{BRAND.productName} — autonomous agent operations</p>
        </div>

        <div className="mt-5 w-full max-w-2xl">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Plus className="w-4 h-4 text-muted-foreground/40" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuerySubmit()}
              placeholder="How can I help?"
              className="w-full bg-white/80 backdrop-blur-2xl border border-white/90 rounded-2xl pl-11 pr-24 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(25,62%,25%)]/20 focus:border-[hsl(25,62%,25%)]/30 placeholder:text-muted-foreground/40 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)]"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button className="p-2 rounded-lg text-muted-foreground/30 hover:text-[hsl(25,62%,25%)] hover:bg-[hsl(25,62%,25%)]/5 transition-colors">
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={handleQuerySubmit}
                disabled={!query.trim()}
                className="p-2.5 rounded-xl bg-[hsl(25,62%,25%)] text-white hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-6 mb-2 w-full">
            <Sparkles className="w-3.5 h-3.5 text-[hsl(25,62%,25%)]" />
            <h2 className="text-xs font-semibold text-foreground tracking-wide uppercase">Agent Journeys</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            {[
              { label: "Example Journey", desc: "End-to-end reference workflow — intake, checks, output & sign-off", path: "/example-journey", icon: Boxes },
              { label: "Validation Run", desc: "Record matching, exception identification & quality analysis", path: "/example-journey", icon: ListChecks },
              { label: "Guardrail Review", desc: "Policy A checks, access control & output-safety assessment", path: "/example-journey", icon: Shield },
              { label: "Metrics Rollup", desc: "Throughput, outcome distribution & trend analysis", path: "/example-journey", icon: BarChart3 },
              { label: "Pipeline Monitor", desc: "Stage progress, SLA tracking & live position monitoring", path: "/example-journey", icon: Workflow },
              { label: "Report Builder", desc: "Output package preparation, formatting & validation", path: "/example-journey", icon: FileText },
            ].map((card, idx) => (
              <div key={card.path} className="relative">
                {idx === 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-2.5 z-10 flex items-center"
                  >
                    <div className="bg-[hsl(25,62%,25%)] text-white text-[10px] font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap leading-relaxed">
                      Start here — run the reference workflow,<br />flag items for review & generate<br />your run readiness summary
                    </div>
                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-[hsl(25,62%,25%)] flex-shrink-0" />
                  </motion.div>
                )}
                <Link href={card.path}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className={cn(
                      "group flex items-center gap-3.5 px-4 py-3.5 rounded-xl border bg-white/60 backdrop-blur-sm hover:bg-white hover:border-[hsl(25,62%,25%)]/20 hover:shadow-[0_2px_12px_rgba(103,57,27,0.08)] transition-all cursor-pointer",
                      idx === 0 ? "border-[hsl(25,62%,25%)]/25 ring-1 ring-[hsl(25,62%,25%)]/10" : "border-border/30"
                    )}
                  >
                    <div className="p-2 rounded-lg bg-[hsl(25,62%,25%)]/8 text-[hsl(25,62%,25%)] group-hover:bg-[hsl(25,62%,25%)]/12 transition-colors flex-shrink-0">
                      <card.icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-foreground group-hover:text-[hsl(25,62%,25%)] transition-colors">{card.label}</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{card.desc}</p>


                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-[hsl(25,62%,25%)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </motion.div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Info className="w-3.5 h-3.5 text-[hsl(25,62%,25%)]" />
            <h2 className="text-xs font-semibold text-foreground">Agent Insights</h2>
            <span className="text-[9px] font-medium bg-[hsl(25,62%,25%)]/10 text-[hsl(25,62%,25%)] px-1.5 py-0.5 rounded-full">{insights.length}</span>
          </div>
          <div className="rounded-2xl border border-border/30 bg-white/40 backdrop-blur-sm p-1">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-0"
          >
            {displayedInsights.map((insight, idx) => (
              <motion.div 
                key={insight.id}
                variants={itemVariants}
                className={cn(
                  "flex items-start gap-2.5 py-2.5 px-2 transition-colors hover:bg-white/50 rounded-xl group",
                  idx !== 0 && "border-t border-border/20"
                )}
              >
                <div className={cn(
                  "p-1 rounded-md mt-0.5 flex-shrink-0",
                  insight.severity === 'critical' ? "text-destructive" :
                  insight.severity === 'warning' ? "text-warning" :
                  insight.severity === 'positive' ? "text-success" :
                  "text-[hsl(25,62%,25%)]"
                )}>
                  {insight.severity === 'critical' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                   insight.severity === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                   insight.severity === 'positive' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                   <Info className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground leading-snug">
                    <span className="font-semibold">{insight.headline}</span>
                    <span className="text-muted-foreground"> — {insight.summary}</span>
                  </p>
                  <Link 
                    href="/console"
                    className="inline-flex items-center text-[10px] font-medium text-[hsl(25,62%,25%)] hover:text-[hsl(25,62%,25%)]/80 transition-colors mt-0.5 opacity-0 group-hover:opacity-100"
                  >
                    {insight.actionLabel || "Investigate"}
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {hasMoreInsights && (
            <button
              onClick={() => setShowAllInsights(true)}
              className="w-full py-1.5 text-[10px] font-medium text-[hsl(25,62%,25%)] hover:text-[hsl(25,62%,25%)]/80 transition-all flex items-center justify-center gap-1"
            >
              Show all {insights.length} insights
              <ChevronDown className="w-3 h-3" />
            </button>
          )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-2.5">
          {visibleActions.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <ClipboardCheck className="w-3.5 h-3.5 text-[hsl(25,62%,25%)]" />
                  Actions Required
                  <span className="text-[9px] font-medium bg-[hsl(25,62%,25%)]/10 text-[hsl(25,62%,25%)] px-1.5 py-0.5 rounded-full">{visibleActions.length}</span>
                </h2>
              </div>

              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {displayedActions.map((action) => (
                  <motion.div
                    key={action.id}
                    variants={itemVariants}
                    className={cn(
                      "bg-white/70 backdrop-blur-2xl rounded-2xl p-3 border transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)]",
                      action.urgency === 'critical' ? "border-destructive/20" :
                      action.urgency === 'high' ? "border-warning/20" :
                      "border-white/90"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "p-1.5 rounded-lg mt-0.5 flex-shrink-0",
                        action.urgency === 'critical' ? "bg-destructive/10 text-destructive" :
                        action.urgency === 'high' ? "bg-warning/10 text-warning" :
                        "bg-[hsl(25,62%,25%)]/10 text-[hsl(25,62%,25%)]"
                      )}>
                        {action.type === 'approval' ? <ThumbsUp className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-[12px] leading-tight">{action.title}</h3>
                          <span className={cn(
                            "text-[7px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full flex-shrink-0",
                            action.urgency === 'critical' ? "bg-destructive/10 text-destructive" :
                            action.urgency === 'high' ? "bg-warning/10 text-warning" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {action.urgency}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold">{action.category}</span>
                          <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {action.dueDate}
                          </span>
                          {action.amount && (
                            <span className="text-[8px] font-mono font-semibold text-foreground bg-muted/50 px-1 py-0.5 rounded">{action.amount}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{action.description}</p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 mt-2 ml-8">
                      {action.type === 'approval' ? (
                        <>
                          <button
                            onClick={() => setDismissedActions(prev => new Set(prev).add(action.id))}
                            className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors flex items-center gap-1"
                          >
                            <ThumbsUp className="w-2.5 h-2.5" /> Approve
                          </button>
                          <button
                            onClick={() => setDismissedActions(prev => new Set(prev).add(action.id))}
                            className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center gap-1"
                          >
                            <ThumbsDown className="w-2.5 h-2.5" /> Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDismissedActions(prev => new Set(prev).add(action.id))}
                          className="px-2 py-0.5 text-[10px] font-medium rounded-lg bg-[hsl(25,62%,25%)]/10 text-[hsl(25,62%,25%)] hover:bg-[hsl(25,62%,25%)]/20 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-2.5 h-2.5" /> Review
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {hasMoreActions && (
                <button
                  onClick={() => setShowAllActions(true)}
                  className="w-full py-1.5 text-[10px] font-medium text-[hsl(25,62%,25%)] hover:text-[hsl(25,62%,25%)]/80 bg-white/50 backdrop-blur-sm hover:bg-white/70 rounded-xl border border-white/80 transition-all flex items-center justify-center gap-1"
                >
                  Show {visibleActions.length - 3} more
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <HomeMetrics />
    </div>
  );
}
