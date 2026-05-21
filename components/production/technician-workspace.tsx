"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Play, Wrench, ArrowRight, Clock, FileText } from "lucide-react";
import {
  addProductionProblemAction,
  completeStageAction,
  startStageAction,
} from "@/app/actions/production";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { stageLabels } from "@/lib/constants/workflow";
import type {
  ProductionCaseCard,
  TechnicianWorkspaceData,
} from "@/lib/data/production";
import {
  getDelayRiskLabel,
  type DelayRisk,
} from "@/lib/production/stage-rules";

function riskTone(risk: DelayRisk): "red" | "amber" | "green" | "neutral" {
  if (risk === "overdue" || risk === "blocked") return "red";
  if (risk === "due_today") return "amber";
  return "green";
}

// Sort by: overdue first, then due_today, then urgent, then priority score desc
function sortByUrgency(cases: ProductionCaseCard[]): ProductionCaseCard[] {
  const riskWeight: Record<DelayRisk, number> = {
    overdue: 0,
    due_today: 1,
    blocked: 2,
    normal: 3,
  };
  return [...cases].sort((a, b) => {
    const rw = riskWeight[a.delayRisk] - riskWeight[b.delayRisk];
    if (rw !== 0) return rw;
    if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
    return b.priorityScore - a.priorityScore;
  });
}

function WorkspaceCase({
  card,
  onMessage,
  isTopPriority,
}: {
  card: ProductionCaseCard;
  onMessage: (message: string) => void;
  isTopPriority: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function run(
    action: (formData: FormData) => Promise<{ ok: boolean; message: string }>,
    formData: FormData,
  ) {
    startTransition(async () => {
      const result = await action(formData);
      onMessage(result.message);
    });
  }

  const isBlocked = card.delayRisk === "blocked" || card.missingInfoStatus !== "complete";

  return (
    <article
      className={`rounded-lg border bg-card p-4 ${
        isTopPriority
          ? "border-primary/40 ring-1 ring-primary/20"
          : isBlocked
          ? "border-red-300 dark:border-red-800"
          : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {isTopPriority && (
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              Work on this next
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <a href={`/cases/${card.id}`} className="font-semibold hover:underline">
              {card.caseNumber}
            </a>
            <a
              href={`/cases/${card.id}/summary`}
              className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Print case sheet"
            >
              <FileText className="size-2.5" />
              Sheet
            </a>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {card.doctorName} · {card.patientName}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {card.isUrgent ? <Badge tone="red">Urgent</Badge> : null}
          {isBlocked ? <Badge tone="red">Blocked</Badge> : null}
          <Badge tone={riskTone(card.delayRisk)}>
            {getDelayRiskLabel(card.delayRisk)}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
        <p>
          <span className="text-muted-foreground">Stage</span>
          <span className="block font-medium">{stageLabels[card.currentStage]}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Work</span>
          <span className="block font-medium">{card.workType}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Units</span>
          <span className="block font-medium">{card.unitsCount}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Due</span>
          <span
            className={`block font-medium ${
              card.delayRisk === "overdue" ? "text-red-600 dark:text-red-400" : ""
            }`}
          >
            {card.dueDate ?? "Not set"}
          </span>
        </p>
      </div>

      {isBlocked && card.missingInfoStatus !== "complete" && (
        <div className="mt-3 rounded border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          Case is waiting for missing information before production can continue.
          Contact lab management to release.
        </div>
      )}

      {!isBlocked && (
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <form
            action={(formData) => run(startStageAction, formData)}
            className="flex gap-2"
          >
            <input type="hidden" name="caseId" value={card.id} />
            <Button type="submit" variant="outline" size="sm" disabled={isPending} className="w-full">
              <Play className="size-3.5" />
              Start work
            </Button>
          </form>
          <form
            action={(formData) => run(completeStageAction, formData)}
            className="flex gap-2"
          >
            <input type="hidden" name="caseId" value={card.id} />
            {card.delayRisk === "overdue" ? (
              <Input
                name="delayReason"
                placeholder="Delay reason (required)"
                className="h-8 text-xs"
              />
            ) : null}
            <Button type="submit" variant="outline" size="sm" disabled={isPending} className="w-full">
              <CheckCircle2 className="size-3.5" />
              Complete
            </Button>
          </form>
          <form
            action={(formData) => run(addProductionProblemAction, formData)}
            className="flex gap-2"
          >
            <input type="hidden" name="caseId" value={card.id} />
            <Input name="problem" placeholder="Report a problem…" className="h-8 text-xs flex-1" />
            <Button type="submit" variant="outline" size="sm" disabled={isPending}>
              <Wrench className="size-3.5" />
            </Button>
          </form>
        </div>
      )}
    </article>
  );
}

export function TechnicianWorkspace({
  data,
}: {
  data: TechnicianWorkspaceData;
}) {
  const [message, setMessage] = useState<string | null>(null);

  // ── Not linked ────────────────────────────────────────────────────────────
  if (!data.technician) {
    return (
      <div className="space-y-5 max-w-2xl">
        <div>
          <p className="text-sm font-medium text-muted-foreground">My workspace</p>
          <h2 className="mt-1 text-2xl font-semibold">Production queue</h2>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-6 text-center space-y-3">
          <p className="text-base font-medium text-amber-800 dark:text-amber-300">
            Account not linked to a technician record
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 max-w-sm mx-auto">
            Your login has not been linked to a technician profile yet. Ask your
            lab manager to link your account from the technician settings page.
          </p>
        </div>
      </div>
    );
  }

  const sortedCases = sortByUrgency(data.assignedCases);
  const hasUrgentWork =
    sortedCases.length > 0 &&
    (sortedCases[0]!.delayRisk === "overdue" ||
      sortedCases[0]!.delayRisk === "due_today" ||
      sortedCases[0]!.isUrgent);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Your assigned production queue — highest priority first.
        </p>
        <Button asChild variant="outline" size="sm">
          <a href="/production">
            Production board <ArrowRight className="size-3.5 ml-1" />
          </a>
        </Button>
      </div>

      {/* ── Action message ─────────────────────────────── */}
      {message ? (
        <div
          className={`rounded-lg border p-3 text-sm ${
            message.toLowerCase().includes("updated") ||
            message.toLowerCase().includes("started") ||
            message.toLowerCase().includes("assigned") ||
            message.toLowerCase().includes("completed") ||
            message.toLowerCase().includes("recorded")
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
          }`}
        >
          {message}
        </div>
      ) : null}

      {/* ── KPI strip ──────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Assigned to me
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {data.productivity.assignedCases}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Active cases</p>
          </CardContent>
        </Card>
        <Card className={data.overdue > 0 ? "border-red-200 dark:border-red-900" : ""}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Overdue
            </p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${data.overdue > 0 ? "text-red-700 dark:text-red-400" : ""}`}>
              {data.overdue}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.overdue > 0 ? "Past due date — act now" : "All within schedule"}
            </p>
          </CardContent>
        </Card>
        <Card className={data.dueToday > 0 ? "border-amber-200 dark:border-amber-900" : ""}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Due today
              </p>
            </div>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${data.dueToday > 0 ? "text-amber-700 dark:text-amber-400" : ""}`}>
              {data.dueToday}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Must complete today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              QC pass rate
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {data.productivity.qcPassRate === null ? "—" : `${data.productivity.qcPassRate}%`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.productivity.qcPassRate === null ? "No checks yet" : "Quality score"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Urgent banner ──────────────────────────────── */}
      {hasUrgentWork && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3 text-sm text-red-900 dark:text-red-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>
            You have{" "}
            {data.overdue > 0 ? `${data.overdue} overdue case${data.overdue > 1 ? "s" : ""}` : ""}
            {data.overdue > 0 && data.dueToday > 0 ? " and " : ""}
            {data.dueToday > 0 ? `${data.dueToday} due today` : ""}.
            Work on these first.
          </p>
        </div>
      )}

      {/* ── Case queue ─────────────────────────────────── */}
      {sortedCases.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Your queue ({sortedCases.length} case{sortedCases.length === 1 ? "" : "s"})
          </h3>
          {sortedCases.map((card, idx) => (
            <WorkspaceCase
              key={card.id}
              card={card}
              onMessage={setMessage}
              isTopPriority={idx === 0}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <CheckCircle2 className="size-6 text-muted-foreground shrink-0" />
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Queue is clear</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              No cases are assigned to you. Ask your lab manager for your next assignment.
            </p>
          </div>
        </div>
      )}

      {/* ── Productivity base ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Productivity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-4">
          <p>
            <span className="text-muted-foreground">Completed</span>
            <span className="block text-xl font-semibold">
              {data.productivity.completedCases}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Units done</span>
            <span className="block text-xl font-semibold">
              {data.productivity.unitsCompleted}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Avg stage time</span>
            <span className="block text-xl font-semibold">
              {data.productivity.averageStageTimeHours}h
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Delay rate</span>
            <span className="block text-xl font-semibold">
              {data.productivity.delayPercentage}%
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
