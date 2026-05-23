import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  FileText,
  Scale,
  Globe,
  Lock,
  CreditCard,
  Building2,
  Gavel,
  Eye,
  Bot,
  Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSampleData } from "@/components/sample-data-context";
import { NoDataState } from "@/components/no-data-state";

interface PolicyArea {
  body: string;
  full_name: string;
  jurisdiction: string;
  applicability: string;
  compliance_status: string;
  icon: typeof ShieldCheck;
  color: string;
  details: string[];
  nextDeadline?: string;
}

const policyAreas: PolicyArea[] = [
  {
    body: "Data Privacy",
    full_name: "Data Privacy Policy",
    jurisdiction: "Organization-wide",
    applicability: "Handling of personal and sensitive data across all agent runs",
    compliance_status: "current",
    icon: Lock,
    color: "text-accent",
    details: ["PII detection on ingest", "Field-level redaction in logs", "Data minimization", "Retention limits", "Subject access handling"],
    nextDeadline: "Jun 1, 2026 — Quarterly Privacy Review"
  },
  {
    body: "Access Control",
    full_name: "Access Control Policy",
    jurisdiction: "Organization-wide",
    applicability: "Authentication, authorization, and least-privilege access for agents and users",
    compliance_status: "current",
    icon: ShieldCheck,
    color: "text-success",
    details: ["Role-based access (RBAC)", "Least-privilege defaults", "Skill boundary enforcement", "Session expiry", "Access review cycle"],
    nextDeadline: "Jun 1, 2026 — Access Review"
  },
  {
    body: "Output Safety",
    full_name: "Output Safety Policy",
    jurisdiction: "Organization-wide",
    applicability: "Grounding, hallucination prevention, and safe content generation for agent output",
    compliance_status: "current",
    icon: Scale,
    color: "text-accent",
    details: ["Grounding on retrieved evidence", "Hallucination guard", "Citation required on assertions", "Unsafe content filter", "Last review: clean"]
  },
  {
    body: "Approval Policy",
    full_name: "Approval & Threshold Policy",
    jurisdiction: "Organization-wide",
    applicability: "Threshold-based approval gates and human-in-the-loop sign-off",
    compliance_status: "current",
    icon: FileText,
    color: "text-primary",
    details: ["Reviewer sign-off above thresholds", "Dual approval for large batches", "No self-approval", "Override justification capture", "Escalation routing"],
    nextDeadline: "Jul 2027 — Threshold Policy Refresh"
  },
  {
    body: "Data Retention",
    full_name: "Data Retention Policy",
    jurisdiction: "Organization-wide",
    applicability: "Storage duration, archival, and deletion of records and agent traces",
    compliance_status: "current",
    icon: Building2,
    color: "text-foreground",
    details: ["Retention schedule by data class", "Automated archival", "Deletion on expiry", "Legal hold support", "Open reviews: none"],
    nextDeadline: "Apr 15, 2026 — Q1 Retention Sweep"
  },
  {
    body: "PII Redaction",
    full_name: "PII Redaction Standard",
    jurisdiction: "Organization-wide",
    applicability: "Detection and masking of personal data in inputs, outputs, and logs",
    compliance_status: "current",
    icon: Lock,
    color: "text-warning",
    details: ["Pattern + ML detection", "Masking before storage", "Redaction in traces", "Free-text scrubbing", "Right to erasure support"]
  },
  {
    body: "Audit Logging",
    full_name: "Audit Logging Policy",
    jurisdiction: "Organization-wide",
    applicability: "Immutable, traceable logging of all agent actions and decisions",
    compliance_status: "current",
    icon: Eye,
    color: "text-foreground",
    details: ["Append-only action log", "Hash-chained entries", "Reviewer identity on overrides", "Citation on every check", "Tamper detection"]
  },
  {
    body: "AI Governance",
    full_name: "AI Governance Framework",
    jurisdiction: "Organization-wide",
    applicability: "Risk classification, oversight, and documentation for deployed agents",
    compliance_status: "in_progress",
    icon: Bot,
    color: "text-warning",
    details: ["Risk-tier classification", "Human oversight on high-risk steps", "Impact assessments", "Model documentation", "AI-content disclosure"],
    nextDeadline: "Aug 1, 2026 — Governance Rollout"
  }
];

const complianceCalendar = [
  { date: "Apr 1", item: "Q1 guardrail test completion", owner: "Operations", urgency: "high" },
  { date: "Apr 14", item: "Output Safety policy review", owner: "Policy Team", urgency: "high" },
  { date: "Apr 15", item: "Q1 data retention sweep", owner: "Platform", urgency: "critical" },
  { date: "Apr 30", item: "Data Privacy annual review", owner: "Privacy", urgency: "medium" },
  { date: "May 15", item: "Access control review cycle", owner: "Security", urgency: "medium" },
  { date: "May 31", item: "Quarterly security scan", owner: "InfoSec", urgency: "medium" },
  { date: "Jun 1", item: "Mid-year policy certification", owner: "Owner", urgency: "high" },
  { date: "Jun 15", item: "Approval threshold review", owner: "Operations", urgency: "critical" },
  { date: "Jun 30", item: "Audit log integrity check", owner: "Security", urgency: "medium" },
  { date: "Jun 30", item: "AI Governance readiness assessment", owner: "Policy/Eng", urgency: "high" },
];

const controlsSummary = {
  totalControls: 342,
  keyControls: 128,
  testedQ1: 89,
  exceptions: 3,
  remediated: 2,
  open: 1,
  materialWeaknesses: 0,
  significantDeficiencies: 0,
};

export default function ComplianceCenter() {
  const { sampleDataEnabled } = useSampleData();
  const [expandedBody, setExpandedBody] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const currentCount = policyAreas.filter(r => r.compliance_status === "current").length;
  const inProgressCount = policyAreas.filter(r => r.compliance_status === "in_progress").length;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight font-sans text-foreground">Compliance Center</h1>
          
        </div>
        <p className="text-muted-foreground mt-1">Policy and guardrail compliance monitoring across all agent operations.</p>
      </div>

      {!sampleDataEnabled ? (
        <NoDataState
          title="No compliance data available"
          description="Policy compliance status will appear here after compliance checks are configured. Enable the Sample Data toggle to view demonstration data."
        />
      ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Policies</div>
          <div className="text-3xl font-bold font-mono text-foreground">{policyAreas.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Actively monitored</div>
        </div>
        <div className="bg-card rounded-xl p-5 border border-success/20">
          <div className="text-sm text-muted-foreground mb-1">Compliant</div>
          <div className="text-3xl font-bold font-mono text-success">{currentCount}</div>
          <div className="text-xs text-success mt-1">All requirements met</div>
        </div>
        <div className="bg-card rounded-xl p-5 border border-warning/20">
          <div className="text-sm text-muted-foreground mb-1">In Progress</div>
          <div className="text-3xl font-bold font-mono text-warning">{inProgressCount}</div>
          <div className="text-xs text-warning mt-1">Implementation underway</div>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Controls</div>
          <div className="text-3xl font-bold font-mono text-foreground">{controlsSummary.totalControls}</div>
          <div className="text-xs text-muted-foreground mt-1">{controlsSummary.testedQ1} tested Q1 · {controlsSummary.materialWeaknesses} material weaknesses</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Policies & Frameworks
          </h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {policyAreas.map((reg) => {
              const isExpanded = expandedBody === reg.body;
              const Icon = reg.icon;
              return (
                <motion.div
                  key={reg.body}
                  variants={itemVariants}
                  className={cn(
                    "bg-card rounded-xl border transition-all cursor-pointer",
                    reg.compliance_status === "in_progress" ? "border-warning/30" : "border-border",
                    isExpanded && "shadow-md"
                  )}
                  onClick={() => setExpandedBody(isExpanded ? null : reg.body)}
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg bg-muted/50", reg.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{reg.body}</span>
                        <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">{reg.full_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{reg.jurisdiction}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {reg.compliance_status === "current" ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Compliant
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> In Progress
                        </span>
                      )}
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-4 pb-4 border-t border-border/50"
                    >
                      <p className="text-sm text-muted-foreground mt-3 mb-3">{reg.applicability}</p>
                      <div className="space-y-1.5">
                        {reg.details.map((detail, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                            {detail}
                          </div>
                        ))}
                      </div>
                      {reg.nextDeadline && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-warning bg-warning/5 px-3 py-2 rounded-lg border border-warning/20">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span className="font-medium">Next: {reg.nextDeadline}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Upcoming Deadlines
            </h2>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {complianceCalendar.map((item, i) => (
                <div key={i} className={cn(
                  "p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors",
                  i !== complianceCalendar.length - 1 ? "border-b border-border/50" : ""
                )}>
                  <div className={cn(
                    "text-[10px] font-bold uppercase px-2 py-1 rounded flex-shrink-0 mt-0.5",
                    item.urgency === "critical" ? "bg-destructive/10 text-destructive" :
                    item.urgency === "high" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {item.date}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium">{item.item}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.owner}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              Controls Summary
            </h2>
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Controls</div>
                  <div className="text-xl font-bold font-mono">{controlsSummary.totalControls}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Key Controls</div>
                  <div className="text-xl font-bold font-mono">{controlsSummary.keyControls}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tested (Q1)</div>
                  <div className="text-xl font-bold font-mono text-primary">{controlsSummary.testedQ1}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Exceptions</div>
                  <div className="text-xl font-bold font-mono text-warning">{controlsSummary.exceptions}</div>
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Material Weaknesses</span>
                  <span className="font-bold text-success">0</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Significant Deficiencies</span>
                  <span className="font-bold text-success">0</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Remediated</span>
                  <span className="font-bold text-foreground">{controlsSummary.remediated} of {controlsSummary.exceptions}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Open Items</span>
                  <span className="font-bold text-warning">{controlsSummary.open}</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-success h-2 rounded-full" style={{ width: `${(controlsSummary.testedQ1 / controlsSummary.keyControls) * 100}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                {Math.round((controlsSummary.testedQ1 / controlsSummary.keyControls) * 100)}% of key controls tested in Q1
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Lock className="w-5 h-5 text-accent" />
              Data Privacy Metrics
            </h2>
            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">DSAR Requests (Q1)</span>
                <span className="font-bold font-mono">342</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Avg Response Time</span>
                <span className="font-bold font-mono text-success">18 days</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Compliance Rate</span>
                <span className="font-bold font-mono text-success">99.7%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Breach Incidents (Q1)</span>
                <span className="font-bold font-mono text-success">0</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Connector Agreements Executed</span>
                <span className="font-bold font-mono">142 / 148</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
