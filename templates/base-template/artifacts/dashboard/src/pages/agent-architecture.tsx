import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Shield, FileText, Database, ArrowRight, Cpu, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetAgentInfo, useGetAgentCompliance, useListAgentSkills } from "@workspace/api-client-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SkillItem {
  name: string;
  description: string;
  status: string;
  lastUsed?: string;
}

interface RegulatoryFramework {
  name: string;
  status: string;
  lastValidated?: string;
}

interface ValidationCheck {
  name: string;
  status: string;
  nextDue?: string;
}

export default function AgentArchitecture() {
  const [activeTab, setActiveTab] = useState("manifest");
  const { data: agentInfo } = useGetAgentInfo();
  const { data: compliance } = useGetAgentCompliance();
  const { data: skills } = useListAgentSkills();

  const tabs = [
    { id: "manifest", label: "Agent Manifest", icon: FileText },
    { id: "skills", label: "Skills Architecture", icon: Layers },
    { id: "compliance", label: "Compliance Framework", icon: Shield },
  ];

  const manifestYaml = agentInfo ? `spec_version: "0.1.0"
name: ${agentInfo.name}
version: ${agentInfo.version}
description: >
  ${agentInfo.description}

model:
  preferred: "${agentInfo.model.preferred}"
  fallback:
${((agentInfo.model.fallback || []) as string[]).map((f) => `    - "${f}"`).join('\n')}
  constraints:
    temperature: 0.3
    max_tokens: 4096

tools: [${agentInfo.tools.join(', ')}]

skills:
${((agentInfo.skillNames || []) as string[]).map((s) => `  - ${s}`).join('\n')}

compliance:
  risk_level: ${agentInfo.compliance.riskLevel}
  human_in_the_loop: ${agentInfo.compliance.humanInTheLoop}
  data_classification: ${agentInfo.compliance.dataClassification}
  regulatory_frameworks: [${agentInfo.compliance.regulatoryFrameworks.join(', ')}]` : 'Loading...';

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-sans text-foreground">Agent Architecture</h1>
        <p className="text-muted-foreground mt-2">
          Built on the open-source Git Agent standard and Git Claw engine. Fully auditable, version-controlled, and compliant by design.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-8 border border-border overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex-1 w-full bg-background border border-border rounded-xl p-5 text-center group hover:border-primary/30 transition-colors">
            <FileText className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">Git Agent Definition</h3>
            <p className="text-xs text-muted-foreground mt-1">agent.yaml, SOUL.md, RULES.md</p>
          </div>

          <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />

          <div className="flex-1 w-full bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
            <Cpu className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-primary">Git Claw Engine</h3>
            <p className="text-xs text-primary/70 mt-1">Runtime, Context Assembly, LLM Routing</p>
          </div>

          <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />

          <div className="flex-1 w-full bg-background border border-border rounded-xl p-5 text-center group hover:border-accent/30 transition-colors">
            <Database className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">Connected Systems</h3>
            <p className="text-xs text-muted-foreground mt-1">ERP, Database, Warehouse via MCP</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                  isActive 
                    ? "border-primary text-primary bg-primary/5" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === "manifest" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SyntaxHighlighter
                language="yaml"
                style={oneLight}
                customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '14px', borderRadius: '0.75rem' }}
                showLineNumbers
              >
                {manifestYaml}
              </SyntaxHighlighter>
            </motion.div>
          )}

          {activeTab === "skills" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {((skills || []) as SkillItem[]).map((skill) => (
                  <div key={skill.name} className="bg-background border border-border rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono font-semibold text-foreground text-sm">{skill.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium uppercase tracking-wider">Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{skill.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Layers className="w-3 h-3" />
                      <span>SKILL.md + scripts/</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "compliance" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-background rounded-xl p-5 border border-border">
                <h3 className="text-foreground font-semibold flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-success" /> Regulatory Frameworks
                </h3>
                <div className="space-y-3">
                  {((compliance?.regulatoryFrameworks || []) as RegulatoryFramework[]).map((fw) => (
                    <div key={fw.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        {fw.status === 'compliant' ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : fw.status === 'at_risk' ? (
                          <AlertTriangle className="w-5 h-5 text-warning" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className="text-sm text-foreground font-medium">{fw.name}</span>
                      </div>
                      <span className={cn(
                        "text-xs font-mono font-semibold uppercase",
                        fw.status === 'compliant' ? "text-success" : "text-warning"
                      )}>{fw.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-background rounded-xl p-5 border border-border">
                <h3 className="text-foreground font-semibold flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" /> Active Guardrails
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm text-foreground">Risk Level</span>
                    <span className="text-sm font-mono text-destructive font-semibold uppercase">{compliance?.riskLevel || 'high'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm text-foreground">Human in the Loop</span>
                    <span className="text-sm font-mono text-success font-semibold">{compliance?.humanInTheLoop ? 'REQUIRED' : 'OPTIONAL'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm text-foreground">Data Classification</span>
                    <span className="text-sm font-mono text-warning font-semibold uppercase">{compliance?.dataClassification || 'confidential'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm text-foreground">Audit Log Retention</span>
                    <span className="text-sm font-mono text-primary font-semibold">{compliance?.retentionDays ? `${Math.round(compliance.retentionDays / 365)} Years` : '7 Years'} (Immutable)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm text-foreground">Review Cadence</span>
                    <span className="text-sm font-mono text-primary font-semibold uppercase">{compliance?.reviewCadence || 'quarterly'}</span>
                  </div>
                </div>
              </div>

              {compliance?.validationChecks && (
                <div className="bg-background rounded-xl p-5 border border-border">
                  <h3 className="text-foreground font-semibold flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-primary" /> Validation Schedule
                  </h3>
                  <div className="space-y-3">
                    {(compliance.validationChecks as ValidationCheck[]).map((check) => (
                      <div key={check.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                        <span className="text-sm text-foreground">{check.name}</span>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-xs font-mono font-semibold uppercase",
                            check.status === 'completed' ? "text-success" :
                            check.status === 'in_progress' ? "text-warning" : "text-muted-foreground"
                          )}>{check.status.replace('_', ' ')}</span>
                          {check.nextDue && (
                            <span className="text-[10px] text-muted-foreground">{check.nextDue}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
