import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { SampleDataProvider } from "@/components/sample-data-context";
import NotFound from "@/pages/not-found";

import CommandCenter from "@/pages/command-center";
import ExampleJourney from "@/pages/example-journey";
import LLMWiki from "@/pages/llm-wiki";
import AgentMatrix from "@/pages/agent-matrix";
import AgentConsole from "@/pages/agent-console";
import AgentArchitecture from "@/pages/agent-architecture";
import FileSystemView from "@/pages/file-system-view";
import Integrations from "@/pages/integrations";
import AgentStudio from "@/pages/agent-studio";
import SkillsManager from "@/pages/skills-manager";
import KnowledgeBase from "@/pages/knowledge-base";
import SkillFlows from "@/pages/skill-flows";
import DecisionInbox from "@/pages/decision-inbox";
import AgentRuns from "@/pages/agent-runs";
import ComplianceGuardrails from "@/pages/compliance-guardrails";
import ComplianceCenter from "@/pages/compliance-center";
import AuditTrail from "@/pages/audit-trail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={CommandCenter} />
        <Route path="/wiki" component={LLMWiki} />

        {/* Agent Journeys — duplicate ExampleJourney to add your own */}
        <Route path="/example-journey" component={ExampleJourney} />

        {/* Build */}
        <Route path="/agent-studio" component={AgentStudio} />
        <Route path="/skills-manager" component={SkillsManager} />
        <Route path="/skills" component={SkillsManager} />
        <Route path="/knowledge-base" component={KnowledgeBase} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/skill-flows" component={SkillFlows} />

        {/* Observe */}
        <Route path="/decision-inbox/:id" component={DecisionInbox} />
        <Route path="/decision-inbox" component={DecisionInbox} />
        <Route path="/agent-runs" component={AgentRuns} />
        <Route path="/agent-matrix" component={AgentMatrix} />
        <Route path="/compliance-guardrails" component={ComplianceGuardrails} />
        <Route path="/compliance-governance" component={ComplianceCenter} />
        <Route path="/audit-trail" component={AuditTrail} />

        {/* Other */}
        <Route path="/console" component={AgentConsole} />
        <Route path="/architecture" component={AgentArchitecture} />
        <Route path="/files" component={FileSystemView} />

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SampleDataProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </SampleDataProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
