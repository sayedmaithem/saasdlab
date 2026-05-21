export const dynamic = "force-dynamic";

import Link from "next/link";
import { CheckCircle2, XCircle, AlertTriangle, Minus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { TopTasks } from "@/components/command-center/top-tasks";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  calculateLaunchReadiness,
  getLaunchChecklist,
  type ChecklistStatus,
  type ChecklistRequirement,
} from "@/lib/command-center/launch-checklist";
import { getTopUrgentTasks } from "@/lib/command-center/system-tasks";

type BadgeTone = "default" | "blue" | "amber" | "green" | "red" | "neutral";

const STATUS_ICON: Record<ChecklistStatus, React.ElementType> = {
  passed: CheckCircle2,
  warning: AlertTriangle,
  failed: XCircle,
  not_checked: Minus,
};

const STATUS_COLOR: Record<ChecklistStatus, string> = {
  passed: "text-green-600",
  warning: "text-amber-500",
  failed: "text-red-500",
  not_checked: "text-muted-foreground/50",
};

const REQUIRED_TONE: Record<ChecklistRequirement, BadgeTone> = {
  pilot: "blue",
  production: "amber",
  optional: "neutral",
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
        "flex flex-col items-center gap-1.5 rounded-xl border px-6 py-4",
        ready ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/40",
      )}
    >
      <span
        className={cn(
          "text-4xl font-bold tabular-nums",
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

export default async function LaunchPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const readiness = calculateLaunchReadiness();
  const groups = getLaunchChecklist();
  const topTasks = getTopUrgentTasks(5);

  return (
    <AppShell
      labName={isPreview ? "Preview Lab" : "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="Launch Readiness"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-8">
        <CcNav />

        {/* Score summary */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Readiness scores
          </h2>
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

          {readiness.pilotReady && readiness.productionReady && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>System is production-ready. All checklist items passed.</span>
            </div>
          )}

          {readiness.pilotReady && !readiness.productionReady && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                Pilot-ready — use for real cases with oversight. Not yet production-ready.
              </span>
            </div>
          )}

          {!readiness.pilotReady && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              <XCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                {readiness.pilotBlockers.length} pilot blocker
                {readiness.pilotBlockers.length !== 1 ? "s" : ""} must be resolved before any
                real lab use.
              </span>
            </div>
          )}
        </section>

        {/* Pilot blockers */}
        {readiness.pilotBlockers.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Pilot blockers
            </h2>
            <div className="space-y-2">
              {readiness.pilotBlockers.map((b) => (
                <Link
                  key={b.id}
                  href={b.actionHref}
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/40 p-3 transition-colors hover:bg-red-50"
                >
                  <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-5">
                      {b.reason}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recommended tasks */}
        {topTasks.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Recommended next tasks
              </h2>
              <Link
                href="/command-center/tasks"
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                All tasks →
              </Link>
            </div>
            <TopTasks tasks={topTasks} />
          </section>
        )}

        {/* Full checklist */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Full checklist
          </h2>
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.id}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </h3>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const Icon = STATUS_ICON[item.status];
                    return (
                      <Link
                        key={item.id}
                        href={item.actionHref}
                        className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
                      >
                        <Icon
                          className={cn("mt-0.5 size-4 shrink-0", STATUS_COLOR[item.status])}
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{item.title}</p>
                            <Badge tone={REQUIRED_TONE[item.requiredFor]}>
                              {item.requiredFor}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground leading-5">
                            {item.reason}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
