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
  const isUrgentOrOverdue = card.delayRisk === "overdue" || card.isUrgent || card.delayRisk === "due_today" || isBlocked;
  const missionClass = card.delayRisk === "overdue" || isBlocked
    ? "mission-card mission-card-overdue"
    : card.isUrgent || card.delayRisk === "due_today"
    ? "mission-card mission-card-urgent"
    : isTopPriority
    ? "mission-card mission-card-top"
    : "mission-card";

  return (
    <article className={`${missionClass} relative overflow-hidden p-4 sm:p-5 ${isUrgentOrOverdue ? "mission-card-urgent-line" : ""}`}>
      {/* ── Mission header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {isTopPriority && (
            <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              ▲ Work on this next
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/cases/${card.id}`}
              className="text-base font-bold hover:underline tracking-tight"
            >
              {card.caseNumber}
            </a>
            {card.isUrgent && <Badge tone="red">Urgent</Badge>}
            {isBlocked && <Badge tone="red">Blocked</Badge>}
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {card.doctorName} · {card.patientName}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge tone={riskTone(card.delayRisk)}>
            {getDelayRiskLabel(card.delayRisk)}
          </Badge>
          {card.dueDate && (
            <span className={`flex items-center gap-1 text-[11px] font-medium ${
              card.delayRisk === "overdue"
                ? "text-red-600 dark:text-red-400"
                : card.delayRisk === "due_today"
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            }`}>
              <Clock className="size-3" />
              {card.dueDate}
            </span>
          )}
        </div>
      </div>

      {/* ── Case meta ── */}
      <div className="mt-4 grid gap-2 text-[13px] grid-cols-2 sm:grid-cols-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">Stage</p>
          <p className="mt-0.5 font-semibold">{stageLabels[card.currentStage]}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">Work type</p>
          <p className="mt-0.5 font-semibold">{card.workType}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">Units</p>
          <p className="mt-0.5 font-semibold">{card.unitsCount}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">Material</p>
          <p className="mt-0.5 font-semibold">{card.material ?? <span className="text-muted-foreground italic">Not set</span>}</p>
        </div>
      </div>

      {/* ── Blocker notice ── */}
      {isBlocked && card.missingInfoStatus !== "complete" && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3 py-2.5">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[12px] text-amber-900 dark:text-amber-200 leading-snug">
            Missing required information — production is paused. Contact lab management to release this case.
          </p>
        </div>
      )}

      {/* ── Action buttons ── */}
      {!isBlocked && (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
          <form action={(formData) => run(startStageAction, formData)}>
            <input type="hidden" name="caseId" value={card.id} />
            <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
              <Play className="size-3.5" />
              Start work
            </Button>
          </form>

          <form action={(formData) => run(completeStageAction, formData)} className="flex gap-2">
            <input type="hidden" name="caseId" value={card.id} />
            {card.delayRisk === "overdue" && (
              <Input
                name="delayReason"
                placeholder="Delay reason (required)"
                className="h-8 text-xs w-48"
              />
            )}
            <Button type="submit" variant="outline" size="sm" disabled={isPending} className="gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Complete stage
            </Button>
          </form>

          <form action={(formData) => run(addProductionProblemAction, formData)} className="flex gap-2 ml-auto">
            <input type="hidden" name="caseId" value={card.id} />
            <Input name="problem" placeholder="Report a problem…" className="h-8 text-xs w-48" />
            <Button type="submit" variant="outline" size="sm" disabled={isPending} title="Report problem">
              <Wrench className="size-3.5" />
            </Button>
          </form>

          <a
            href={`/cases/${card.id}/summary`}
            className="ml-auto flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="size-3" />
            Case sheet
          </a>
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
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
              Assigned
            </p>
            <p className="stat-lg mt-1">{data.productivity.assignedCases}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Active cases</p>
          </CardContent>
        </Card>
        <Card className={data.overdue > 0 ? "border-red-200 dark:border-red-900" : ""}>
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
              Overdue
            </p>
            <p className={`stat-lg mt-1 ${data.overdue > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
              {data.overdue}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {data.overdue > 0 ? "Act now" : "On schedule"}
            </p>
          </CardContent>
        </Card>
        <Card className={data.dueToday > 0 ? "border-amber-200 dark:border-amber-900" : ""}>
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
              Due today
            </p>
            <p className={`stat-lg mt-1 ${data.dueToday > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
              {data.dueToday}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Complete today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
              QC pass rate
            </p>
            <p className="stat-lg mt-1">
              {data.productivity.qcPassRate === null ? "—" : `${data.productivity.qcPassRate}%`}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
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
