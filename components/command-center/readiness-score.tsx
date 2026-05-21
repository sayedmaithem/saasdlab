import type { ReadinessScore } from "@/lib/data/command-center";
import { cn } from "@/lib/utils";

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 45) return "text-amber-500";
  return "text-red-600";
}

function scoreBar(score: number) {
  if (score >= 70) return "bg-green-500";
  if (score >= 45) return "bg-amber-400";
  return "bg-red-500";
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
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start gap-6">
        <div className="shrink-0 text-center">
          <p className={cn("text-5xl font-bold tabular-nums", scoreColor(readiness.total))}>
            {readiness.total}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">/ 100</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Readiness
          </p>
        </div>

        <div className="flex-1 space-y-3">
          {subs.map(({ key, label, value }) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">{label}</span>
                <span className={cn("font-semibold tabular-nums", scoreColor(value))}>
                  {value}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all", scoreBar(value))}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
