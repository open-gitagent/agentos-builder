import { Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoDataStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function NoDataState({ 
  title = "No data available",
  description = "Run the agent to generate actual data. Enable the Sample Data toggle to view demonstration data.",
  className 
}: NoDataStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-8", className)}>
      <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center mb-4">
        <Database className="w-6 h-6 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground text-center max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}

export function SampleDataBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
      SAMPLE DATA
    </span>
  );
}
