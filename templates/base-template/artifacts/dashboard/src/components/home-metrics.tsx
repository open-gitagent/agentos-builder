import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid, Line, ComposedChart, Legend,
} from "recharts";
import { ArrowDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

function GaugeArc({ value, max, label, color, size = 120 }: { value: number; max: number; label: string; color: string; size?: number }) {
  const pct = Math.min(value / max, 1);
  const cx = size / 2;
  const cy = size / 2 + 2;
  const r = size / 2 - 12;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - pct);

  const needleAngle = Math.PI * (1 - pct);
  const needleLen = r - 8;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 14} viewBox={`0 0 ${size} ${size / 2 + 14}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
        <line
          x1={cx} y1={cy}
          x2={nx} y2={ny}
          stroke="#1a1a1a"
          strokeWidth={2}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
        <circle cx={cx} cy={cy} r={4} fill="#1a1a1a" />
        <circle cx={cx} cy={cy} r={1.5} fill="white" />
        <text x={cx} y={cy - 18} textAnchor="middle" className="fill-foreground" fontSize={16} fontWeight={700}>
          {value.toFixed(1)}%
        </text>
      </svg>
      <span className="text-[10px] font-semibold text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

function ServiceHealth() {
  return (
    <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-2xl rounded-2xl p-5 border border-white/90 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Service Health</h3>
        <span className="text-[8px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded-full">All above target</span>
      </div>
      <div className="flex items-center justify-around">
        <GaugeArc value={99.2} max={100} label="Uptime" color="hsl(25, 62%, 25%)" />
        <GaugeArc value={96.2} max={100} label="Auto-Handled" color="hsl(25, 50%, 35%)" />
        <GaugeArc value={92.4} max={100} label="Quality" color="hsl(30, 55%, 45%)" />
      </div>
    </motion.div>
  );
}

const pipelineStages = [
  { name: "Intake", status: "done" as const, count: "14/14" },
  { name: "Validation", status: "done" as const, count: "8/8" },
  { name: "Processing", status: "active" as const, count: "42/56" },
  { name: "Review", status: "pending" as const, count: "0/3" },
  { name: "Output", status: "pending" as const, count: "0/1" },
];

function RunPipeline() {
  return (
    <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-2xl rounded-2xl p-5 border border-white/90 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Example Journey — Step 3 of 5</h3>
        <span className="text-[8px] font-semibold text-[hsl(25,62%,25%)] bg-[hsl(25,62%,25%)]/10 px-1.5 py-0.5 rounded-full">50% complete</span>
      </div>
      <div className="flex items-stretch gap-1.5">
        {pipelineStages.map((stage) => (
          <div
            key={stage.name}
            className={cn(
              "flex-1 rounded-lg px-3 py-3 flex flex-col items-center justify-center text-center gap-1 transition-all",
              stage.status === "done" && "bg-[hsl(25,62%,25%)] text-white",
              stage.status === "active" && "bg-[hsl(30,55%,45%)]/20 ring-1 ring-[hsl(30,55%,45%)] text-foreground",
              stage.status === "pending" && "bg-gray-50 text-muted-foreground"
            )}
          >
            <span className={cn(
              "text-[10px] font-semibold leading-tight",
              stage.status === "done" && "text-white",
            )}>{stage.name}</span>
            <span className={cn(
              "text-[10px] font-mono font-bold",
              stage.status === "done" ? "text-white/70" : "text-muted-foreground"
            )}>{stage.count}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const throughputTrend = [
  { day: "Mon", value: 132 },
  { day: "Tue", value: 128 },
  { day: "Wed", value: 134 },
  { day: "Thu", value: 131 },
  { day: "Fri", value: 136 },
  { day: "Sat", value: 138 },
  { day: "Today", value: 141 },
];

function ThroughputTrend() {
  const current = throughputTrend[throughputTrend.length - 1].value;
  const prev = throughputTrend[throughputTrend.length - 2].value;
  const change = current - prev;

  return (
    <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-2xl rounded-2xl p-5 border border-white/90 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Daily Throughput</h3>
        <span className="text-[8px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <TrendingUp className="w-2.5 h-2.5" /> +{change}
        </span>
      </div>
      <div className="flex items-end gap-4">
        <div>
          <span className="text-3xl font-bold font-mono text-[hsl(25,62%,25%)]">{current}</span>
          <p className="text-[9px] text-muted-foreground mt-0.5">Records / day</p>
        </div>
        <div className="flex-1 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={throughputTrend} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
              <defs>
                <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(25, 62%, 25%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(25, 62%, 25%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="hsl(25, 62%, 25%)" strokeWidth={2} fill="url(#throughputGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

const statusData = [
  { name: "Auto-Handled", value: 82.4, color: "hsl(25, 62%, 25%)" },
  { name: "Needs Review", value: 14.1, color: "hsl(30, 55%, 45%)" },
  { name: "Failed", value: 3.5, color: "#ef4444" },
];

const transitionData = [
  { from: "Auto-Handled", to: "Needs Review", amount: "+18", pct: "+0.8%" },
  { from: "Needs Review", to: "Failed", amount: "+3", pct: "+0.3%" },
];

function OutcomeDistribution() {
  return (
    <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-2xl rounded-2xl p-5 border border-white/90 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Run Outcome Distribution</h3>
        <span className="text-[8px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">Needs Review +0.8% MoM</span>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 8, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Share"]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col justify-center gap-2 min-w-[110px]">
          <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Status Transitions</p>
          {transitionData.map((m) => (
            <div key={m.from + m.to} className="flex items-center gap-1.5 text-[9px]">
              <span className="font-medium text-foreground">{m.from}</span>
              <ArrowDown className="w-2.5 h-2.5 text-destructive" />
              <span className="font-medium text-foreground">{m.to}</span>
              <span className="font-mono text-muted-foreground ml-auto">{m.amount}</span>
              <span className="text-destructive font-semibold">{m.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const volumeData = [
  { cat: "Source A", planned: 142, actual: 138, variance: -4 },
  { cat: "Source B", planned: 56, actual: 61, variance: 5 },
  { cat: "Source C", planned: 28, actual: 27, variance: -1 },
  { cat: "Source D", planned: 19, actual: 24, variance: 5 },
  { cat: "Source E", planned: 15, actual: 13, variance: -2 },
  { cat: "Other", planned: 12, actual: 14, variance: 2 },
];

function VolumeBySource() {
  return (
    <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-2xl rounded-2xl p-5 border border-white/90 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Volume by Source — Planned vs Actual (K)</h3>
        <span className="text-[8px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">+10K over on B & D</span>
      </div>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={volumeData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="cat" tick={{ fontSize: 8, fill: "#6b7280" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 8, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(value: number, name: string) => [`${value}K`, name === "planned" ? "Planned" : name === "actual" ? "Actual" : "Variance"]}
            />
            <Legend wrapperStyle={{ fontSize: 9 }} iconSize={8} />
            <Bar dataKey="planned" name="Planned" fill="hsl(25, 62%, 25%)" opacity={0.25} radius={[3, 3, 0, 0]} barSize={14} />
            <Bar dataKey="actual" name="Actual" fill="hsl(25, 62%, 25%)" radius={[3, 3, 0, 0]} barSize={14} />
            <Line type="monotone" dataKey="variance" name="Variance" stroke="hsl(30, 55%, 45%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(30, 55%, 45%)" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function HomeMetrics() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ServiceHealth />
        <ThroughputTrend />
      </div>
      <RunPipeline />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <OutcomeDistribution />
        <VolumeBySource />
      </div>
    </motion.div>
  );
}
