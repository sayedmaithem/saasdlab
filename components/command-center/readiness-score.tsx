"use client";

import type { ReadinessScore } from "@/lib/data/command-center";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function scoreColor(score: number) {
  if (score >= 70) return "text-success";
  if (score >= 45) return "text-warning";
  return "text-destructive";
}

function scoreBar(score: number) {
  if (score >= 70) return "bg-success";
  if (score >= 45) return "bg-warning";
  return "bg-destructive";
}

const SUB_LABELS: Record<keyof Omit<ReadinessScore, "total">, string> = {
  security: "Security",
  cloud: "Cloud",
  setup: "Setup",
  launch: "Launch",
  feature: "Features",
};

type Props = {
  readiness: ReadinessScore;
};

export function ReadinessScorePanel({ readiness }: Props) {
  const subs = (["security", "cloud", "setup", "launch", "feature"] as const).map((key) => ({
    key,
    label: SUB_LABELS[key],
    value: readiness[key],
  }));

  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden group hover:glow-primary transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      
      <div className="flex items-center gap-8 relative z-10">
        <div className="shrink-0 text-center pl-2">
          <motion.p 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className={cn("text-6xl font-bold tabular-nums tracking-tighter", scoreColor(readiness.total))}
          >
            {readiness.total}
          </motion.p>
          <p className="mt-1 text-xs text-muted-foreground font-medium">/ 100</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Readiness
          </p>
        </div>

        <div className="flex-1 space-y-4">
          {subs.map(({ key, label, value }, i) => (
            <div key={key}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-semibold tracking-tight text-foreground/80">{label}</span>
                <span className={cn("font-bold tabular-nums", scoreColor(value))}>
                  {value}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50 ring-1 ring-inset ring-foreground/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.1, ease: "easeOut" }}
                  className={cn("h-full rounded-full shadow-sm", scoreBar(value))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
