import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  History,
  RefreshCw,
  Satellite,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSampleData } from "@/components/sample-data-context";
import { NoDataState } from "@/components/no-data-state";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ALL_JURISDICTIONS,
  GUARDRAILS,
  GUARDRAIL_CATEGORIES,
  GUARDRAIL_TRENDS,
  POLICY_ENTRIES,
  POLICY_DOMAINS,
  POLICY_INTELLIGENCE,
  SYNC_HISTORY,
  type ComplianceStatus,
  type GuardrailRule,
  type Jurisdiction,
  type PolicyEntry,
  type PolicyDomain,
} from "@/data/compliance-guardrails-data";

const statusBadge: Record<ComplianceStatus, { label: string; className: string; dot: string }> = {
  clean: {
    label: "In sync",
    className: "text-success bg-success/10 border-success/20",
    dot: "bg-success",
  },
  watch: {
    label: "Watch",
    className: "text-warning bg-warning/10 border-warning/20",
    dot: "bg-warning",
  },
  breach: {
    label: "Breach",
    className: "text-destructive bg-destructive/10 border-destructive/20",
    dot: "bg-destructive",
  },
};

const guardrailStatusConfig = {
  passing: { label: "Passing", icon: CheckCircle2, color: "text-success", border: "border-border" },
  warning: { label: "Warning", icon: AlertTriangle, color: "text-warning", border: "border-warning/30" },
  failing: { label: "Failing", icon: XCircle, color: "text-destructive", border: "border-destructive/30" },
} as const;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
};

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export default function ComplianceGuardrails() {
  const { sampleDataEnabled } = useSampleData();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedBodyId, setExpandedBodyId] = useState<string | null>(null);
  const [jurisdictionFilter, setJurisdictionFilter] = useState<Jurisdiction | "All">("All");

  const filteredBodies = useMemo<PolicyEntry[]>(() => {
    if (jurisdictionFilter === "All") return POLICY_ENTRIES;
    return POLICY_ENTRIES.filter((b) => b.jurisdiction === jurisdictionFilter);
  }, [jurisdictionFilter]);

  const bodiesByDomain = useMemo(() => {
    const map = new Map<PolicyDomain, PolicyEntry[]>();
    for (const b of filteredBodies) {
      if (!map.has(b.domain)) map.set(b.domain, []);
      map.get(b.domain)!.push(b);
    }
    return map;
  }, [filteredBodies]);

  const guardrailsByCategory = useMemo(() => {
    return GUARDRAIL_CATEGORIES.map((cat) => ({
      category: cat,
      rules: GUARDRAILS.filter((g) => g.category === cat),
    })).filter((g) => g.rules.length > 0);
  }, []);

  const passingCount = GUARDRAILS.filter((g) => g.status === "passing").length;
  const warningCount = GUARDRAILS.filter((g) => g.status === "warning").length;
  const failingCount = GUARDRAILS.filter((g) => g.status === "failing").length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-8 pt-6 pb-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-30">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Compliance & Guardrails</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live policy rule corpus and the active guardrails enforcing it across every agent run.
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-2"
            data-testid="button-run-checks"
          >
            <RefreshCw className="w-4 h-4" /> Run all checks
          </button>
        </div>
      </div>

      {!sampleDataEnabled ? (
        <div className="px-8 py-6">
          <NoDataState
            title="No compliance data available"
            description="Policy catalog, sync history, and active guardrails will appear here once compliance monitoring is configured. Enable the Sample Data toggle to view demonstration data."
          />
        </div>
      ) : (
        <div className="px-8 py-6 space-y-10 max-w-[1600px] mx-auto">
          <PolicyIntelligenceHero onOpenHistory={() => setHistoryOpen(true)} />

          <PolicyCatalog
            bodiesByDomain={bodiesByDomain}
            jurisdictionFilter={jurisdictionFilter}
            setJurisdictionFilter={setJurisdictionFilter}
            expandedBodyId={expandedBodyId}
            setExpandedBodyId={setExpandedBodyId}
          />

          <ActiveGuardrails
            guardrailsByCategory={guardrailsByCategory}
            passingCount={passingCount}
            warningCount={warningCount}
            failingCount={failingCount}
          />
        </div>
      )}

      <SyncHistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}

/* ---------------- Hero ---------------- */

function PolicyIntelligenceHero({ onOpenHistory }: { onOpenHistory: () => void }) {
  const ri = POLICY_INTELLIGENCE;

  return (
    <section className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Satellite className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Guardrails monitored continuously · checks run on every agent run.
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Rule corpus refreshed daily from {ri.policiesMonitored} policies; pass / warn / fail evaluated before each agent step proceeds.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-[11px] font-semibold text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
            </span>
            Healthy · last sync {ri.lastSync}
          </span>
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background border border-border text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
            data-testid="button-sync-history"
          >
            <History className="w-3 h-3" />
            Sync history
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Catalog ---------------- */

function PolicyCatalog({
  bodiesByDomain,
  jurisdictionFilter,
  setJurisdictionFilter,
  expandedBodyId,
  setExpandedBodyId,
}: {
  bodiesByDomain: Map<PolicyDomain, PolicyEntry[]>;
  jurisdictionFilter: Jurisdiction | "All";
  setJurisdictionFilter: (j: Jurisdiction | "All") => void;
  expandedBodyId: string | null;
  setExpandedBodyId: (id: string | null) => void;
}) {
  const filters: (Jurisdiction | "All")[] = ["All", ...ALL_JURISDICTIONS];

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Policies, standards & frameworks
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Every policy the platform adheres to, grouped by domain. Each card shows the source
            the watcher pulls from and the specific clauses being tracked.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setJurisdictionFilter(f)}
              data-testid={`filter-jurisdiction-${f.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                jurisdictionFilter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {POLICY_DOMAINS.map(({ domain, icon: DomainIcon, color }) => {
          const list = bodiesByDomain.get(domain) ?? [];
          if (list.length === 0) return null;
          return (
            <div key={domain}>
              <div className="sticky top-[88px] z-10 bg-background/95 backdrop-blur py-2 mb-3 flex items-center gap-2 border-b border-border/60">
                <DomainIcon className={cn("w-4 h-4", color)} />
                <h3 className="text-sm font-bold text-foreground">{domain}</h3>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {list.length} {list.length === 1 ? "framework" : "frameworks"}
                </span>
              </div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
              >
                {list.map((body) => (
                  <PolicyCard
                    key={body.id}
                    body={body}
                    expanded={expandedBodyId === body.id}
                    onToggle={() => setExpandedBodyId(expandedBodyId === body.id ? null : body.id)}
                  />
                ))}
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PolicyCard({
  body,
  expanded,
  onToggle,
}: {
  body: PolicyEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const badge = statusBadge[body.status];
  const hasPending = body.clauses.some((c) => c.pendingAmendment);

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "bg-card rounded-xl border transition-all",
        expanded ? "border-primary/40 shadow-sm" : "border-border hover:border-border/80",
      )}
      data-testid={`card-policy-${body.id}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{body.short}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border",
                badge.className,
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", badge.dot)} />
              {badge.label}
            </span>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              {body.jurisdiction}
            </span>
            {hasPending && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                Pending amendment
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{body.full}</div>
          <p className="text-xs text-foreground/80 mt-2 leading-relaxed line-clamp-2">{body.description}</p>

          <div className="mt-3 flex flex-wrap gap-1">
            {body.clauses.slice(0, expanded ? 0 : 4).map((c) => (
              <span
                key={c.ref}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/15"
              >
                {c.ref}
              </span>
            ))}
            {!expanded && body.clauses.length > 4 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{body.clauses.length - 4} more
              </span>
            )}
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 min-w-0">
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  Source: <span className="font-mono text-foreground/80">{body.sourceLabel}</span> · synced {body.lastRefreshed}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-foreground/70 flex-shrink-0 ml-2">
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              {formatNumber(body.rulesIngested)} docs ingested
              {body.rulesChangedLastSync > 0 && (
                <>
                  {" · "}
                  <span className="text-warning font-medium">
                    {formatNumber(body.rulesChangedLastSync)} changed in last sync
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="border-t border-border/60 px-4 py-3 bg-muted/30 space-y-3"
          >
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Tracked clauses
              </div>
              <div className="space-y-1.5">
                {body.clauses.map((c) => (
                  <div key={c.ref} className="flex items-start gap-2 text-xs">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 flex-shrink-0 mt-0.5">
                      {c.ref}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground/90">{c.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Effective {c.effective}
                        {c.pendingAmendment && (
                          <>
                            {" · "}
                            <span className="text-warning font-medium">{c.pendingAmendment}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-2 border-t border-border/60">
              <a
                href={body.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                Source: {body.sourceLabel}
              </a>
              <span className="text-muted-foreground">
                {body.rulesChangedLastSync > 0
                  ? `${body.rulesChangedLastSync} change${body.rulesChangedLastSync === 1 ? "" : "s"} in last sync`
                  : "No changes in last sync"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------------- Active guardrails ---------------- */

function ActiveGuardrails({
  guardrailsByCategory,
  passingCount,
  warningCount,
  failingCount,
}: {
  guardrailsByCategory: { category: string; rules: GuardrailRule[] }[];
  passingCount: number;
  warningCount: number;
  failingCount: number;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-success" />
          Active guardrails — pass / warning / fail
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          The internal rules currently watching every agent run. Each guardrail is anchored to a
          specific policy clause from the catalog above.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryTile
          label="Passing"
          count={passingCount}
          delta={GUARDRAIL_TRENDS.passingDelta}
          icon={CheckCircle2}
          accent="text-success"
          bg="bg-success/5 border-success/20"
        />
        <SummaryTile
          label="Warnings"
          count={warningCount}
          delta={GUARDRAIL_TRENDS.warningDelta}
          icon={AlertTriangle}
          accent="text-warning"
          bg="bg-warning/5 border-warning/20"
        />
        <SummaryTile
          label="Failing"
          count={failingCount}
          delta={GUARDRAIL_TRENDS.failingDelta}
          icon={XCircle}
          accent="text-destructive"
          bg="bg-destructive/5 border-destructive/20"
        />
      </div>

      <div className="space-y-6">
        {guardrailsByCategory.map(({ category, rules }) => (
          <div key={category}>
            <div className="sticky top-[88px] z-10 bg-background/95 backdrop-blur py-2 mb-3 flex items-center justify-between border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground">{category}</h3>
              <span className="text-[10px] text-muted-foreground font-medium">
                {rules.length} rule{rules.length === 1 ? "" : "s"}
              </span>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 lg:grid-cols-2 gap-3"
            >
              {rules.map((rule) => (
                <GuardrailCard key={rule.id} rule={rule} />
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryTile({
  label,
  count,
  delta,
  icon: Icon,
  accent,
  bg,
}: {
  label: string;
  count: number;
  delta: number;
  icon: LucideIcon;
  accent: string;
  bg: string;
}) {
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Activity;
  const deltaText = delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta} vs 24h`;
  return (
    <div className={cn("rounded-xl border p-4 flex items-center gap-4", bg)}>
      <div className={cn("p-2 rounded-lg bg-background/60", accent)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <div className={cn("text-2xl font-bold font-mono", accent)}>{count}</div>
      </div>
      <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
        <TrendIcon className="w-3 h-3" />
        {deltaText}
      </div>
    </div>
  );
}

function GuardrailCard({ rule }: { rule: GuardrailRule }) {
  const config = guardrailStatusConfig[rule.status];
  const StatusIcon = config.icon;
  const body = POLICY_ENTRIES.find((b) => b.id === rule.enforcesBodyId);

  return (
    <motion.div
      variants={itemVariants}
      className={cn("bg-card rounded-xl border p-4", config.border)}
      data-testid={`card-guardrail-${rule.id}`}
    >
      <div className="flex items-start gap-3">
        <StatusIcon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground">{rule.id}</span>
            <h4 className="text-sm font-semibold text-foreground">{rule.name}</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{rule.description}</p>
          {rule.details && (
            <p
              className={cn(
                "text-xs mt-2 font-medium",
                rule.status === "warning" ? "text-warning" : "text-destructive",
              )}
            >
              {rule.details}
            </p>
          )}
          {rule.remediation && rule.status !== "passing" && (
            <div
              className={cn(
                "mt-2 text-[11px] rounded-md px-2 py-1.5 border",
                rule.status === "warning"
                  ? "bg-warning/5 border-warning/20 text-warning"
                  : "bg-destructive/5 border-destructive/20 text-destructive",
              )}
            >
              <span className="font-semibold">Remediation: </span>
              {rule.remediation}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-flex items-center gap-1.5 text-[10px]">
              <span className="text-muted-foreground">Enforces</span>
              <span className="font-semibold text-foreground">{body?.short ?? rule.enforcesBodyId}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {rule.enforcesClause}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {rule.lastChecked}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- Sync history sheet ---------------- */

function SyncHistorySheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Sync history
          </SheetTitle>
          <SheetDescription>
            Last 7 daily syncs of the Policy Intelligence node.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {SYNC_HISTORY.map((s, idx) => {
            const isToday = idx === 0;
            const statusColor =
              s.status === "ok"
                ? "text-success bg-success/10 border-success/20"
                : s.status === "retry"
                  ? "text-warning bg-warning/10 border-warning/20"
                  : "text-destructive bg-destructive/10 border-destructive/20";
            return (
              <div
                key={s.date}
                className={cn(
                  "relative pl-6 pb-4 border-l-2",
                  idx === SYNC_HISTORY.length - 1 ? "border-transparent" : "border-border",
                )}
              >
                <span
                  className={cn(
                    "absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-background",
                    s.status === "ok"
                      ? "bg-success"
                      : s.status === "retry"
                        ? "bg-warning"
                        : "bg-destructive",
                  )}
                />
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {s.date} {isToday && <span className="text-[10px] text-primary font-medium">· today</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{s.timestamp}</div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase",
                      statusColor,
                    )}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <SheetStat label="Ingested" value={formatNumber(s.rulesIngested)} />
                  <SheetStat label="Changed" value={formatNumber(s.rulesChanged)} accent="text-warning" />
                  <SheetStat label="Advisories" value={formatNumber(s.newAdvisories)} accent="text-primary" />
                </div>
                {s.note && (
                  <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed bg-muted/40 border border-border/60 rounded-md px-2 py-1.5">
                    {s.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SheetStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-card border border-border rounded-md px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={cn("text-sm font-bold font-mono", accent ?? "text-foreground")}>{value}</div>
    </div>
  );
}
