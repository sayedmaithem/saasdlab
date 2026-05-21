import Link from "next/link";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LaunchReadiness } from "@/lib/command-center/launch-checklist";

type Props = {
  readiness: LaunchReadiness;
};

function ScorePill({
  label,
  score,
  ready,
}: {
  label: string;
  score: number;
  ready: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border px-5 py-3",
        ready ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/40",
      )}
    >
      <span
        className={cn(
          "text-3xl font-bold tabular-nums",
          ready ? "text-green-600" : "text-red-600",
        )}
      >
        {score}
      </span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {ready ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
          <CheckCircle2 className="size-3" /> Ready
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
          <XCircle className="size-3" /> Not ready
        </span>
      )}
    </div>
  );
}

export function LaunchReadinessCard({ readiness }: Props) {
  const topBlockers = readiness.pilotBlockers.slice(0, 3);

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Launch readiness</p>
          <p className="text-xs text-muted-foreground">
            Can you use LabFlow in your real lab today?
          </p>
        </div>
        <Link
          href="/command-center/launch"
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          Full report →
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <ScorePill
          label="Pilot score"
          score={readiness.pilotScore}
          ready={readiness.pilotReady}
        />
        <ScorePill
          label="Production score"
          score={readiness.productionScore}
          ready={readiness.productionReady}
        />
      </div>

      {!readiness.pilotReady && topBlockers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pilot blockers
          </p>
          {topBlockers.map((b) => (
            <div key={b.id} className="flex items-start gap-2 text-xs">
              <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
              <span className="text-muted-foreground leading-5">{b.title}</span>
            </div>
          ))}
          {readiness.pilotBlockers.length > 3 && (
            <p className="pl-5 text-xs text-muted-foreground">
              +{readiness.pilotBlockers.length - 3} more blockers
            </p>
          )}
        </div>
      )}

      {readiness.pilotReady && !readiness.productionReady && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Pilot-ready but <strong>not production-ready</strong>. Use for internal testing only.
          </span>
        </div>
      )}

      {readiness.pilotReady && readiness.productionReady && (
        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-900">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          <span>System is production-ready.</span>
        </div>
      )}
    </div>
  );
}
