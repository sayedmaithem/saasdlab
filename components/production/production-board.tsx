"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
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
  if (risk === "overdue" || risk === "blocked") return "red" as const;
  if (risk === "due_today") return "amber" as const;
  return "green" as const;
}

function CaseCard({
  card,
  technicians,
  canManageBoard,
  onMessage,
  dragHandleProps,
}: {
  card: ProductionCaseCard;
  technicians: ProductionTechnician[];
  canManageBoard: boolean;
  onMessage: (message: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: any;
}) {
  const [isPending, startTransition] = useTransition();
  const [targetStage, setTargetStage] = useState<ProductionStage>(card.currentStage);

  const currentIndex = kanbanStages.indexOf(card.currentStage);
  const prevStage = currentIndex > 0 ? kanbanStages[currentIndex - 1] : null;
  const nextStage =
    currentIndex < kanbanStages.length - 1 ? kanbanStages[currentIndex + 1] : null;

  function moveCase(formData: FormData) {
    startTransition(async () => {
      const result = await moveCaseStageAction(formData);
      onMessage(result.message);
    });
  }

  function quickMove(stage: ProductionStage) {
    const formData = new FormData();
    formData.set("caseId", card.id);
    formData.set("targetStage", stage);
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

  const isBlocked =
    card.delayRisk === "blocked" || card.missingInfoStatus !== "complete";
  const isOverdue = card.delayRisk === "overdue";

  return (
    <article
      {...dragHandleProps}
      className={`space-y-3 rounded-lg border bg-card p-3 shadow-sm ${
        isPending ? "opacity-60" : ""
      } ${isBlocked ? "border-red-300 dark:border-red-800" : ""}`}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <a
              href={`/cases/${card.id}`}
              className="text-sm font-semibold hover:underline"
            >
              {card.caseNumber}
            </a>
            {card.isUrgent && <Badge tone="red">Urgent</Badge>}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {card.patientName} · {card.doctorName}
          </p>
        </div>
        <Badge tone={badgeToneForRisk(card.delayRisk)} className="shrink-0">
          {getDelayRiskLabel(card.delayRisk)}
        </Badge>
      </div>

      {/* Work details */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <div>
          <span className="text-muted-foreground">Work</span>
          <p className="font-medium truncate">{card.workType}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Units</span>
          <p className="font-medium">{card.unitsCount}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Due</span>
          <p className={`font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : ""}`}>
            {card.dueDate ?? "—"}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Technician</span>
          <p className={`font-medium truncate ${!card.assignedTechnicianName ? "text-amber-600 dark:text-amber-400 italic" : ""}`}>
            {card.assignedTechnicianName ?? "Unassigned"}
          </p>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1">
        {card.missingInfoStatus !== "complete" && (
          <Badge tone="amber">Missing info</Badge>
        )}
        {card.hasPassedQc && <Badge tone="green">QC ✓</Badge>}
      </div>

      {canManageBoard ? (
        <form action={assignTechnician} className="space-y-2 border-t pt-3">
          <input type="hidden" name="caseId" value={card.id} />
          <Label htmlFor={`assign-${card.id}`} className="text-xs">
            Assign technician
          </Label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Select
              id={`assign-${card.id}`}
              name="technicianId"
              defaultValue=""
            >
              <option value="" disabled>
                Choose
              </option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.name} ({technician.workload}){" "}
                  {!technician.profileId ? "· no account" : ""}
                </option>
              ))}
            </Select>
            <Button type="submit" size="icon" variant="outline" disabled={isPending}>
              <UserPlus />
            </Button>
          </div>
        </form>
      ) : null}

      {/* Quick move prev / next */}
      {canManageBoard && (prevStage ?? nextStage) ? (
        <div className="flex items-center gap-1 border-t pt-3">
          {prevStage ? (
            <button
              type="button"
              onClick={() => quickMove(prevStage)}
              disabled={isPending}
              title={`← ${stageLabels[prevStage]}`}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border bg-card px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft className="size-3" />
              <span className="truncate">{stageLabels[prevStage]}</span>
            </button>
          ) : (
            <div className="flex-1" />
          )}
          {nextStage ? (
            <button
              type="button"
              onClick={() => quickMove(nextStage)}
              disabled={isPending}
              title={`→ ${stageLabels[nextStage]}`}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
            >
              <span className="truncate">{stageLabels[nextStage]}</span>
              <ChevronRight className="size-3" />
            </button>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      ) : null}

      {/* Full stage select for any-stage moves */}
      <form action={moveCase} className="space-y-2 border-t pt-3">
        <input type="hidden" name="caseId" value={card.id} />
        <Label htmlFor={`stage-${card.id}`} className="text-xs text-muted-foreground">
          Move to any stage
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
        {isOverdue ? (
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

type ColumnState = {
  stage: ProductionStage;
  cases: ProductionCaseCard[];
};

export function ProductionBoard({
  data,
  canManageBoard,
  hasCustomWorkflow = false,
  defaultWorkflowName = null,
}: {
  data: ProductionBoardData;
  canManageBoard: boolean;
  hasCustomWorkflow?: boolean;
  defaultWorkflowName?: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnState[]>(data.columns);
  const [isDragging, setIsDragging] = useState(false);

  const totalCases = useMemo(
    () => columns.reduce((sum, column) => sum + column.cases.length, 0),
    [columns],
  );

  // Bottleneck column: stage with the most cases (min 2 to qualify)
  const maxCases = useMemo(
    () => Math.max(...columns.map((c) => c.cases.length), 0),
    [columns],
  );

  function onDragStart() {
    setIsDragging(true);
    setMessage(null);
  }

  function onDragEnd(result: DropResult) {
    setIsDragging(false);
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;
    if (!canManageBoard) return;

    const fromStage = source.droppableId as ProductionStage;
    const toStage = destination.droppableId as ProductionStage;
    if (fromStage === toStage) return;

    // Optimistic update — move card locally
    setColumns((prev) => {
      const next = prev.map((col) => ({ ...col, cases: [...col.cases] }));
      const fromCol = next.find((c) => c.stage === fromStage);
      const toCol = next.find((c) => c.stage === toStage);
      if (!fromCol || !toCol) return prev;

      const cardIndex = fromCol.cases.findIndex((c) => c.id === draggableId);
      if (cardIndex === -1) return prev;
      const [card] = fromCol.cases.splice(cardIndex, 1);
      const updatedCard = { ...card, currentStage: toStage };
      toCol.cases.splice(destination.index, 0, updatedCard);
      return next;
    });

    // Call server action — revalidates and returns authoritative state
    const formData = new FormData();
    formData.set("caseId", draggableId);
    formData.set("targetStage", toStage);
    moveCaseStageAction(formData).then((result) => {
      setMessage(result.message);
      if (!result.ok) {
        // Revert by restoring original data
        setColumns(data.columns);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={hasCustomWorkflow ? "green" : "neutral"}>
            {hasCustomWorkflow
              ? `Custom workflow${defaultWorkflowName ? `: ${defaultWorkflowName}` : ""}`
              : "Fixed workflow · 18 stages"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {totalCases} active case{totalCases === 1 ? "" : "s"}
            {canManageBoard ? " · drag to move" : ""}
          </span>
        </div>
        <div className="flex gap-2">
          {!hasCustomWorkflow && (
            <Button asChild variant="ghost" size="sm">
              <a href="/command-center/master-data/workflows">Configure workflow</a>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <a href="/technicians/workspace">Technician workspace</a>
          </Button>
        </div>
      </div>

      {message ? (
        <div
          className={`rounded-lg border p-3 text-sm ${
            message.toLowerCase().includes("updated") ||
            message.toLowerCase().includes("assigned") ||
            message.toLowerCase().includes("moved") ||
            message.toLowerCase().includes("success")
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
          }`}
        >
          {message}
        </div>
      ) : null}

      {data.technicians.length > 0 ? (
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
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm space-y-2">
          <p className="font-medium text-foreground">No technicians configured</p>
          <p className="text-muted-foreground text-xs">
            Create a technician record, then give them portal access so they can log in and manage
            their workload.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a href="/technicians/new" className="text-xs font-medium text-primary hover:underline">
              + Add technician record
            </a>
            <span className="text-muted-foreground text-xs">·</span>
            <a href="/command-center/users/new" className="text-xs font-medium text-primary hover:underline">
              Create portal login →
            </a>
          </div>
        </div>
      )}

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="overflow-x-auto pb-3">
          <div className="grid min-w-[3600px] grid-cols-[repeat(15,minmax(220px,1fr))] gap-3">
            {columns.map((column) => {
              const isBottleneck =
                column.cases.length === maxCases && maxCases >= 2;
              return (
                <section
                  key={column.stage}
                  className={`min-h-[560px] rounded-lg border ${
                    isBottleneck
                      ? "border-amber-400 bg-amber-50/50"
                      : "bg-muted/30"
                  }`}
                >
                  <div
                    className={`sticky top-0 z-10 flex items-start justify-between gap-2 border-b px-3 py-3 ${
                      isBottleneck ? "bg-amber-50 dark:bg-amber-950/40" : "bg-card"
                    }`}
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{stageLabels[column.stage]}</h3>
                      {(() => {
                        const blockedCount = column.cases.filter(
                          (c) =>
                            c.delayRisk === "blocked" ||
                            c.missingInfoStatus !== "complete",
                        ).length;
                        const unassignedCount = column.cases.filter(
                          (c) => !c.assignedTechnicianId,
                        ).length;
                        return (blockedCount > 0 || unassignedCount > 0) ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {blockedCount > 0 && (
                              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                {blockedCount} blocked
                              </span>
                            )}
                            {unassignedCount > 0 && (
                              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                {unassignedCount} unassigned
                              </span>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge tone={isBottleneck ? "amber" : "neutral"}>
                        {column.cases.length}
                      </Badge>
                    </div>
                  </div>
                  <Droppable droppableId={column.stage} isDropDisabled={!canManageBoard}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[480px] space-y-3 p-3 transition-colors ${
                          snapshot.isDraggingOver ? "bg-primary/5" : ""
                        }`}
                      >
                        {column.cases.length > 0 ? (
                          column.cases.map((card, index) => (
                            <Draggable
                              key={card.id}
                              draggableId={card.id}
                              index={index}
                              isDragDisabled={!canManageBoard || isDragging === false}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  className={`${
                                    dragSnapshot.isDragging
                                      ? "rotate-1 shadow-lg"
                                      : ""
                                  }`}
                                >
                                  <CaseCard
                                    card={card}
                                    technicians={data.technicians}
                                    canManageBoard={canManageBoard}
                                    onMessage={setMessage}
                                    dragHandleProps={dragProvided.dragHandleProps}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <div className="rounded-lg border border-dashed bg-background p-4 text-center text-xs text-muted-foreground">
                            No cases
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </section>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      <div className="flex items-start gap-2 rounded-lg border bg-amber-50 p-3 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>
          Overdue moves require a delay reason. Cases waiting for doctor information are
          blocked until management releases them. QC must pass before ready for delivery.
        </p>
      </div>
    </div>
  );
}
