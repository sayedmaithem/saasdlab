"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Play, Wrench } from "lucide-react";
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

function riskTone(risk: DelayRisk) {
  if (risk === "overdue" || risk === "blocked") return "red";
  if (risk === "due_today") return "amber";
  return "green";
}

function WorkspaceCase({
  card,
  onMessage,
}: {
  card: ProductionCaseCard;
  onMessage: (message: string) => void;
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

  return (
    <article className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <a href={`/cases/${card.id}`} className="font-semibold hover:underline">
            {card.caseNumber}
          </a>
          <p className="mt-1 text-sm text-muted-foreground">
            {card.doctorName} / {card.patientName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {card.isUrgent ? <Badge tone="red">Urgent</Badge> : null}
          <Badge tone={riskTone(card.delayRisk)}>
            {getDelayRiskLabel(card.delayRisk)}
          </Badge>
          <Badge tone="neutral">P{card.priorityScore}</Badge>
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
          <span className="block font-medium">{card.dueDate ?? "Not set"}</span>
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <form
          action={(formData) => run(startStageAction, formData)}
          className="flex gap-2"
        >
          <input type="hidden" name="caseId" value={card.id} />
          <Button type="submit" variant="outline" size="sm" disabled={isPending}>
            <Play />
            Start
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
              placeholder="Delay reason"
              className="h-8"
            />
          ) : null}
          <Button type="submit" variant="outline" size="sm" disabled={isPending}>
            <CheckCircle2 />
            Complete
          </Button>
        </form>
        <form
          action={(formData) => run(addProductionProblemAction, formData)}
          className="flex gap-2"
        >
          <input type="hidden" name="caseId" value={card.id} />
          <Input name="problem" placeholder="Problem" className="h-8" />
          <Button type="submit" variant="outline" size="sm" disabled={isPending}>
            <Wrench />
          </Button>
        </form>
      </div>
    </article>
  );
}

export function TechnicianWorkspace({
  data,
}: {
  data: TechnicianWorkspaceData;
}) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Technician workspace
          </p>
          <h2 className="mt-1 text-2xl font-semibold">
            {data.technician?.name ?? "My production queue"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Assigned cases ordered by priority and due date.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/production">Production board</a>
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border bg-background p-3 text-sm">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader><CardTitle>Assigned</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.productivity.assignedCases}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Due today</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{data.dueToday}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Overdue</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{data.overdue}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Design upload</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.needsDesignUpload}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>QC correction</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.needsQcCorrection}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>QC pass</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data.productivity.qcPassRate === null
              ? "TBD"
              : `${data.productivity.qcPassRate}%`}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productivity base</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-4">
          <p>
            <span className="text-muted-foreground">Completed cases</span>
            <span className="block text-xl font-semibold">
              {data.productivity.completedCases}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Units completed</span>
            <span className="block text-xl font-semibold">
              {data.productivity.unitsCompleted}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Average stage time</span>
            <span className="block text-xl font-semibold">
              {data.productivity.averageStageTimeHours}h
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Delay percentage</span>
            <span className="block text-xl font-semibold">
              {data.productivity.delayPercentage}%
            </span>
          </p>
        </CardContent>
      </Card>

      {data.assignedCases.length > 0 ? (
        <div className="space-y-3">
          {data.assignedCases.map((card) => (
            <WorkspaceCase key={card.id} card={card} onMessage={setMessage} />
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4" />
          <p>No assigned cases are waiting in your production queue.</p>
        </div>
      )}
    </div>
  );
}
