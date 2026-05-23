import { useCallback, useEffect, useRef, useState } from "react";
import type { RunnerPhase } from "./journey-events";

export type AuditEmitter = (entry: { type?: string; actor?: string; action: string; details?: string; journey?: string }) => void;

export interface StepRunnerOptions<T> {
  delayFor: (step: T, idx: number) => number;
  onStepStart?: (step: T, idx: number) => void;
  onStepDone?: (step: T, idx: number) => void;
  onComplete?: () => void;
  audit?: AuditEmitter;
  journey?: string;
  label?: string;
}

export function useStepRunner<T>(opts: StepRunnerOptions<T>) {
  const [phase, setPhase] = useState<RunnerPhase>("idle");
  const [currentIdx, setCurrentIdx] = useState(-1);
  const stepsRef = useRef<T[]>([]);
  const idxRef = useRef(0);
  const phaseRef = useRef<RunnerPhase>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  phaseRef.current = phase;

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const advance = useCallback((from: number) => {
    const tick = (i: number) => {
      if (phaseRef.current === "paused" || phaseRef.current === "halted") return;
      const steps = stepsRef.current;
      if (i >= steps.length) {
        idxRef.current = steps.length;
        setCurrentIdx(steps.length);
        setPhase("complete");
        opts.onComplete?.();
        if (opts.audit) opts.audit({ type: "agent_action", action: `Completed ${opts.label ?? "run"}`, journey: opts.journey });
        return;
      }
      const step = steps[i];
      idxRef.current = i;
      setCurrentIdx(i);
      opts.onStepStart?.(step, i);
      timerRef.current = setTimeout(() => {
        opts.onStepDone?.(step, i);
        tick(i + 1);
      }, Math.max(50, opts.delayFor(step, i)));
    };
    tick(from);
  }, [opts]);

  const start = useCallback((steps: T[]) => {
    if (phase === "pipeline" || phase === "awaiting_approval" || phase === "paused" || phase === "analyzing") return;
    stepsRef.current = steps;
    idxRef.current = 0;
    setCurrentIdx(-1);
    setPhase("pipeline");
    if (opts.audit) opts.audit({ type: "agent_action", action: `Started ${opts.label ?? "run"}`, details: `${steps.length} steps`, journey: opts.journey });
    timerRef.current = setTimeout(() => advance(0), 200);
  }, [phase, advance, opts]);

  const pause = useCallback(() => {
    if (phase === "pipeline") {
      setPhase("paused");
      if (timerRef.current) clearTimeout(timerRef.current);
      if (opts.audit) opts.audit({ type: "user_decision", actor: "owner@example.com", action: `Paused ${opts.label ?? "run"}`, details: `At step ${idxRef.current + 1}`, journey: opts.journey });
    } else if (phase === "paused") {
      setPhase("pipeline");
      const idx = Math.max(0, idxRef.current);
      if (opts.audit) opts.audit({ type: "user_decision", actor: "owner@example.com", action: `Resumed ${opts.label ?? "run"}`, details: `From step ${idx + 1}`, journey: opts.journey });
      advance(idx);
    }
  }, [phase, advance, opts]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stepsRef.current = [];
    idxRef.current = 0;
    setCurrentIdx(-1);
    setPhase("idle");
  }, []);

  return { phase, currentIdx, start, pause, reset };
}
