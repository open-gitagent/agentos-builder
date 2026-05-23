import { AlertCircle, AlertTriangle, Info, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionPriority = "critical" | "warning" | "info";

export interface PendingAction {
  id: string;
  priority: ActionPriority;
  description: string;
  subDescription?: string;
  cta: string;
  targetSection?: string;
}

interface PendingActionsStripProps {
  actions: PendingAction[];
  onActionClick?: (action: PendingAction) => void;
}

const priorityConfig: Record<ActionPriority, { icon: typeof AlertCircle; dotColor: string; textColor: string }> = {
  critical: { icon: AlertCircle, dotColor: "bg-red-500", textColor: "text-red-600" },
  warning: { icon: AlertTriangle, dotColor: "bg-amber-500", textColor: "text-amber-600" },
  info: { icon: Info, dotColor: "bg-blue-500", textColor: "text-blue-600" },
};

export function PendingActionsStrip({ actions, onActionClick }: PendingActionsStripProps) {
  if (actions.length === 0) {
    return (
      <div className="border-l-[3px] border-emerald-500 bg-emerald-50/50 px-5 py-2.5 rounded-r-lg">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-sm text-emerald-700 font-medium">No pending actions — all items reviewed</span>
        </div>
      </div>
    );
  }

  const criticalCount = actions.filter(a => a.priority === "critical").length;
  const hasCritical = criticalCount > 0;

  return (
    <div className={cn(
      "border-l-[3px] px-5 py-3 rounded-r-lg",
      hasCritical ? "border-red-400 bg-red-50/30" : "border-[#c4a35a] bg-amber-50/20"
    )}>
      <div className="flex items-center gap-2 mb-2.5">
        <Zap className={cn("w-4 h-4", hasCritical ? "text-red-500" : "text-[#c4a35a]")} />
        <span className="text-xs font-bold uppercase tracking-wide text-foreground">
          Pending Actions ({actions.length}){hasCritical && ` — ${criticalCount} Critical`}
        </span>
      </div>
      <div className="space-y-2">
        {actions.map((action) => {
          const config = priorityConfig[action.priority];
          return (
            <div key={action.id} className="flex items-start gap-3 py-1 group">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1.5", config.dotColor)} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{action.description}</span>
                {action.subDescription && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{action.subDescription}</p>
                )}
              </div>
              <button
                onClick={() => onActionClick?.(action)}
                className={cn(
                  "text-xs font-semibold px-3 py-1 rounded-md transition-colors flex-shrink-0 mt-0.5",
                  "bg-white border border-border hover:border-primary/30 hover:text-primary"
                )}
              >
                {action.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
