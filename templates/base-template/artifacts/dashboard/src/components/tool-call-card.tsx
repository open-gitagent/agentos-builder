import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SYSTEM_REGISTRY, formatToolCall } from "@/lib/tool-registry";
import type { ToolCallEvent } from "@/lib/journey-events";

function SystemLogo({
  logoUrl,
  Icon,
  label,
  size,
  iconClass,
}: {
  logoUrl?: string;
  Icon: LucideIcon;
  label: string;
  size: number;
  iconClass: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed) return <Icon className={iconClass} />;
  return (
    <img
      src={logoUrl}
      alt={label}
      style={{ width: size, height: size }}
      className="object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export function ToolCallCard({ event }: { event: ToolCallEvent }) {
  const sys = SYSTEM_REGISTRY[event.system] ?? SYSTEM_REGISTRY.internal;
  const SysIcon = sys.icon;
  const [open, setOpen] = useState(false);
  const hasRaw = !!event.rawPreview;
  return (
    <div className={cn("rounded-lg border", sys.border, sys.bg)}>
      <div className="px-3 py-2 flex items-start gap-3">
        <div
          className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-white/90 border border-black/5", sys.accent)}
          title={sys.tooltip ?? sys.label}
          aria-label={sys.tooltip ?? sys.label}
        >
          <SystemLogo logoUrl={sys.logoUrl} Icon={SysIcon} label={sys.label} size={16} iconClass="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn("text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border inline-flex items-center gap-1", sys.badge)}
              title={sys.tooltip ?? sys.label}
              aria-label={sys.tooltip ?? sys.label}
            >
              {sys.label}
            </span>
            <code className="text-[11px] font-mono text-foreground truncate">
              {formatToolCall(event.system, event.verb, event.args)}
            </code>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
            {event.fileName && <span className="truncate">{event.fileName}</span>}
            {typeof event.rowCount === "number" && <span>{event.rowCount.toLocaleString()} rows</span>}
            <span>{event.latencyMs}ms</span>
            {hasRaw && (
              <button
                onClick={() => setOpen(o => !o)}
                className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                View raw
              </button>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {event.status === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
           event.status === "running" ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> :
           event.status === "failed" ? <AlertCircle className="w-4 h-4 text-red-500" /> :
           <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
        </div>
      </div>
      {open && hasRaw && (
        <div className="border-t border-border/40 px-3 py-2 bg-white/50">
          <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Raw response preview</div>
          <pre className="text-[10px] font-mono text-foreground whitespace-pre-wrap break-all max-h-40 overflow-y-auto leading-relaxed">{event.rawPreview}</pre>
        </div>
      )}
    </div>
  );
}
