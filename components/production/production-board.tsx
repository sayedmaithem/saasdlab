"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, UserPlus } from "lucide-react";
import {
  assignTechnicianAction,
  moveCaseStageAction,
} from "@/app/actions/production";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { stageLabels, type ProductionStage } from "@/lib/constants/workflow";
import type {
  ProductionBoardData,
  ProductionCaseCard,
  ProductionTechnician,
} from "@/lib/data/production";
import {
  getDelayRiskLabel,
  kanbanStages,
  type DelayRisk,
} from "@/lib/production/stage-rules";

function badgeToneForRisk(risk: DelayRisk) {
  if (risk === "overdue" || risk === "blocked") return "red";
  if (risk === "due_today") return "amber";
  return "green";
}

function skillMatch(card: ProductionCaseCard, technician?: ProductionTechnician) {
  if (!technician) return "Unassigned";

  const skills = new Set(technician.skills.map((skill) => skill.toLowerCase()));
  const signals = [
    card.currentStage,
    card.workType,
    card.material ?? "",
  ].map((item) => item.toLowerCase());

  return signals.some((signal) => skills.has(signal)) ? "Skill match" : "General fit";
}

function CaseCard({
  card,
  technicians,
  canManageBoard,
  onMessage,
}: {
  card: ProductionCaseCard;
  technicians: ProductionTechnician[];
  canManageBoard: boolean;
  onMessage: (message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [targetStage, setTargetStage] = useState<ProductionStage>(card.currentStage);
  const assignedTechnician = technicians.find(
    (technician) => technician.profileId === card.assignedTechnicianId,
  );

  function moveCase(formData: FormData) {
    startTransition(async () => {
      const result = await moveCaseStageAction(formData);
      onMessage(result.message);
    });
  }

  function assignTechnician(formData: FormData) {
    startTransition(async () => {
      const result = await assignTechnicianAction(formData);
      onMessage(result.message);
    });
  }

  return (
    <article className="space-y-3 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={`/cases/${card.id}`}
            className="truncate text-sm font-semibold hover:underline"
          >
            {card.caseNumber}
          </a>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {card.doctorName} / {card.patientName}
          </p>
        </div>
        <Badge tone={card.isUrgent ? "red" : "neutral"}>
          P{card.priorityScore}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
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
        <p>
          <span className="text-muted-foreground">Technician</span>
          <span className="block font-medium">
            {card.assignedTechnicianName ?? "Unassigned"}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {card.isUrgent ? <Badge tone="red">Urgent</Badge> : null}
        {card.missingInfoStatus === "missing" ? (
          <Badge tone="amber">Missing info</Badge>
        ) : null}
        <Badge tone={badgeToneForRisk(card.delayRisk)}>
          {getDelayRiskLabel(card.delayRisk)}
        </Badge>
        <Badge tone={card.hasPassedQc ? "green" : "neutral"}>
          {card.hasPassedQc ? "QC passed" : "QC pending"}
        </Badge>
        <Badge tone="blue">{skillMatch(card, assignedTechnician)}</Badge>
      </div>

      {canManageBoard ? (
        <form action={assignTechnician} className="space-y-2 border-t pt-3">
          <input type="hidden" name="caseId" value={card.id} />
          <Label htmlFor={`assign-${card.id}`} className="text-xs">
            Assign technician
          </Label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Select id={`assign-${card.id}`} name="technicianId" defaultValue="">
              <option value="" disabled>
                Choose
              </option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.name} ({technician.workload})
                </option>
              ))}
            </Select>
            <Button type="submit" size="icon" variant="outline" disabled={isPending}>
              <UserPlus />
            </Button>
          </div>
        </form>
      ) : null}

      <form action={moveCase} className="space-y-2 border-t pt-3">
        <input type="hidden" name="caseId" value={card.id} />
        <Label htmlFor={`stage-${card.id}`} className="text-xs">
          Move stage
        </Label>
        <Select
          id={`stage-${card.id}`}
          name="targetStage"
          value={targetStage}
          onChange={(event) => setTargetStage(event.target.value as ProductionStage)}
        >
          {kanbanStages.map((stage) => (
            <option key={stage} value={stage}>
              {stageLabels[stage]}
            </option>
          ))}
        </Select>
        {card.delayRisk === "overdue" ? (
          <Input
            name="delayReason"
            placeholder="Delay reason required"
            className="h-9"
          />
        ) : null}
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          <ArrowRight />
          Move
        </Button>
      </form>
    </article>
  );
}

export function ProductionBoard({
  data,
  canManageBoard,
}: {
  data: ProductionBoardData;
  canManageBoard: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const totalCases = useMemo(
    () => data.columns.reduce((sum, column) => sum + column.cases.length, 0),
    [data.columns],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Production workflow
          </p>
          <h2 className="mt-1 text-2xl font-semibold">Production Kanban</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {totalCases} active cases across {data.columns.length} stages.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/technicians/workspace">Technician workspace</a>
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border bg-background p-3 text-sm">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Technician workload</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {data.technicians.map((technician) => (
            <div key={technician.id} className="rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{technician.name}</p>
                <Badge tone={technician.workload > 6 ? "amber" : "neutral"}>
                  {technician.workload} cases
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {technician.skills.length
                  ? technician.skills.join(", ")
                  : "No skills registered"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="overflow-x-auto pb-3">
        <div className="grid min-w-[3600px] grid-cols-[repeat(15,minmax(220px,1fr))] gap-3">
          {data.columns.map((column) => (
            <section
              key={column.stage}
              className="min-h-[560px] rounded-lg border bg-muted/30"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-card px-3 py-3">
                <h3 className="text-sm font-semibold">{stageLabels[column.stage]}</h3>
                <Badge tone="neutral">{column.cases.length}</Badge>
              </div>
              <div className="space-y-3 p-3">
                {column.cases.length > 0 ? (
                  column.cases.map((card) => (
                    <CaseCard
                      key={card.id}
                      card={card}
                      technicians={data.technicians}
                      canManageBoard={canManageBoard}
                      onMessage={setMessage}
                    />
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed bg-background p-4 text-center text-xs text-muted-foreground">
                    No cases
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border bg-amber-50 p-3 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 size-4" />
        <p>
          Overdue moves require a delay reason. Cases waiting for doctor
          information are blocked for technicians until management releases them.
        </p>
      </div>
    </div>
  );
}
