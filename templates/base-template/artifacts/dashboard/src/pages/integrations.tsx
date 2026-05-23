import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Plug, 
  RefreshCw,
  Settings,
  Shield,
  Plus,
  Globe,
  Key,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  connected: boolean;
  lastSync?: string;
  dataPoints?: string;
}

const allIntegrations: Integration[] = [
  {
    id: "erp",
    name: "ERP System",
    description: "Core system of record — your primary business application holding master records and transactions.",
    category: "ERP",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/database.svg",
    connected: true,
    lastSync: "2 min ago",
    dataPoints: "1.2M records"
  },
  {
    id: "secondary-erp",
    name: "Secondary ERP",
    description: "Cloud business application for additional units. Provides operational records and detail for downstream processing.",
    category: "ERP",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/server.svg",
    connected: true,
    lastSync: "5 min ago",
    dataPoints: "847K records"
  },
  {
    id: "warehouse",
    name: "Data Warehouse",
    description: "Cloud analytical warehouse — golden source for reporting and analysis. Powers matching, rollups, and metrics.",
    category: "Data Warehouse",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/clickhouse.svg",
    connected: true,
    lastSync: "1 min ago",
    dataPoints: "12.4M rows / day"
  },
  {
    id: "database",
    name: "Operational Database",
    description: "Transactional database holding day-to-day operational records used by the example journey.",
    category: "Database",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/postgresql.svg",
    connected: true,
    lastSync: "8 min ago",
    dataPoints: "324K records"
  },
  {
    id: "secondary-database",
    name: "Reporting Database",
    description: "Read replica used for reporting and reference lookups across the platform.",
    category: "Database",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/mysql.svg",
    connected: false
  },
  {
    id: "internal",
    name: "Internal Service",
    description: "Your own microservice for compute and data enrichment. Exposes records and reference data to agents.",
    category: "Internal Service",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/kubernetes.svg",
    connected: true,
    lastSync: "15 min ago",
    dataPoints: "42K records"
  },
  {
    id: "api",
    name: "External API",
    description: "Third-party REST API integration. Supplies external reference data and enrichment to the agent.",
    category: "API",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/openapi.svg",
    connected: false
  },
  {
    id: "object-store",
    name: "Object Storage",
    description: "Bucket storage for files and exports. Holds input datasets and generated run summaries.",
    category: "Storage",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/minio.svg",
    connected: true,
    lastSync: "3 min ago",
    dataPoints: "89K objects"
  },
  {
    id: "messaging",
    name: "Team Messaging",
    description: "Team communication and alert delivery. Agent posts proactive insights, alerts, and approval requests to channels.",
    category: "Messaging",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/slack.svg",
    connected: false
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Integrations() {
  const [integrations, setIntegrations] = useState(allIntegrations);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());

  const toggleConnection = (id: string) => {
    setIntegrations(prev => prev.map(i => 
      i.id === id 
        ? { 
            ...i, 
            connected: !i.connected,
            lastSync: !i.connected ? "Just now" : undefined,
            dataPoints: !i.connected ? i.dataPoints || "Syncing..." : undefined
          } 
        : i
    ));
  };

  const handleSync = (id: string) => {
    setSyncing(prev => new Set(prev).add(id));
    setTimeout(() => {
      setSyncing(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setIntegrations(prev => prev.map(i => 
        i.id === id ? { ...i, lastSync: "Just now" } : i
      ));
    }, 2000);
  };

  const categories = [...new Set(integrations.map(i => i.category))];

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-sans text-foreground">Integrations</h1>
          <p className="text-muted-foreground mt-1">Connect your systems to enable real-time agent operations.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Access Controlled</span>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{category}</h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {integrations.filter(i => i.category === category).map((integration) => (
              <motion.div
                key={integration.id}
                variants={itemVariants}
                className="bg-card rounded-xl border border-border p-5 transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-border/60 flex items-center justify-center overflow-hidden flex-shrink-0 p-2">
                    <img src={integration.logo} alt={integration.name} className="w-full h-full object-contain" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div>
                      <h3 className="font-semibold text-foreground leading-tight">{integration.name}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{integration.category}</span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                      {integration.description}
                    </p>

                    {integration.connected && (
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                        {integration.lastSync && (
                          <span className="flex items-center gap-1">
                            <RefreshCw className={cn("w-3 h-3", syncing.has(integration.id) && "animate-spin text-primary")} />
                            {syncing.has(integration.id) ? "Syncing..." : `Last sync: ${integration.lastSync}`}
                          </span>
                        )}
                        {integration.dataPoints && (
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground/70">{integration.dataPoints}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      {integration.connected ? (
                        <>
                          <button
                            onClick={() => handleSync(integration.id)}
                            disabled={syncing.has(integration.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <RefreshCw className={cn("w-3 h-3", syncing.has(integration.id) && "animate-spin")} />
                            Sync Now
                          </button>
                          <button
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors flex items-center gap-1.5"
                          >
                            <Settings className="w-3 h-3" />
                            Configure
                          </button>
                          <button
                            onClick={() => toggleConnection(integration.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => toggleConnection(integration.id)}
                          className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                        >
                          <Plug className="w-3 h-3" />
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Custom Integration
        </h2>
        <CustomIntegrationBuilder />
      </div>
    </div>
  );
}

interface CustomField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "date";
  required: boolean;
}

function CustomIntegrationBuilder() {
  const [endpoint, setEndpoint] = useState("");
  const [authMethod, setAuthMethod] = useState<"none" | "api-key" | "bearer" | "basic">("api-key");
  const [fields, setFields] = useState<CustomField[]>([
    { id: "1", name: "", type: "string", required: true },
  ]);

  const addField = () => {
    setFields([...fields, { id: Date.now().toString(), name: "", type: "string", required: false }]);
  };

  const removeField = (id: string) => {
    if (fields.length > 1) setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-5">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Connect a custom REST API endpoint. Define the schema so the agent knows how to read incoming data.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1.5">Endpoint URL</label>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="url"
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              placeholder="https://api.example.com/v1/data"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1.5">Authentication Method</label>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={authMethod}
              onChange={e => setAuthMethod(e.target.value as typeof authMethod)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
            >
              <option value="none">None</option>
              <option value="api-key">API Key</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-foreground">Response Schema Fields</label>
            <button onClick={addField} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Field
            </button>
          </div>
          <div className="space-y-2">
            {fields.map((field) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={field.name}
                  onChange={e => updateField(field.id, { name: e.target.value })}
                  placeholder="field_name"
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
                <select
                  value={field.type}
                  onChange={e => updateField(field.id, { type: e.target.value as CustomField["type"] })}
                  className="px-2 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                </select>
                <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => updateField(field.id, { required: e.target.checked })}
                    className="rounded border-border"
                  />
                  Req
                </label>
                <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5">
          <Plug className="w-3.5 h-3.5" />
          Test Connection
        </button>
        <button className="px-4 py-2 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
          Save Integration
        </button>
      </div>
    </div>
  );
}
