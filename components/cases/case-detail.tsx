import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Printer,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseFileManager } from "@/components/files/case-file-manager";
import { DesignWorkflow } from "@/components/design/design-workflow";
import { CaseDiscussion } from "@/components/comments/case-discussion";
import { QualityControlForm } from "@/components/qc/qc-form";
import { RemakeForm } from "@/components/qc/remake-form";
import { CaseTimeline } from "@/components/timeline/case-timeline";
import { ReadinessRing } from "@/components/ui/readiness-ring";
import { stageLabels, stageOrder } from "@/lib/constants/workflow";
import type { CaseDetail as CaseDetailData } from "@/lib/data/cases";

// ── Helpers ────────────────────────────────────────────────────────────────────

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusTone(
  status: string,
): "green" | "amber" | "red" | "neutral" | "blue" {
  switch (status) {
    case "active":
      return "green";
    case "on_hold":
      return "red";
    case "waiting_doctor_info":
      return "amber";
    case "completed":
    case "delivered":
      return "neutral";
    default:
      return "neutral";
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Active",
    on_hold: "On Hold",
    waiting_doctor_info: "Awaiting Info",
    completed: "Completed",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function dueRisk(
  dueDate: string | null,
  status: string,
): "overdue" | "due_today" | "upcoming" | null {
  if (!dueDate || status === "completed" || status === "delivered") return null;
  const today = new Date().toISOString().slice(0, 10);
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "due_today";
  return "upcoming";
}

function stageDisplayLabel(stage: string): string {
  return (
    (stageLabels as Record<string, string>)[stage] ??
    stage.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={`text-sm font-medium ${highlight ? "text-amber-700 dark:text-amber-400" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function BlockersPanel({
  missingInfoFields,
  status,
}: {
  missingInfoFields: string[];
  status: string;
}) {
  if (missingInfoFields.length === 0 && status !== "on_hold") return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-300">
        <ShieldAlert className="size-4 shrink-0" />
        {status === "on_hold"
          ? "Case is on hold"
          : `${missingInfoFields.length} item${missingInfoFields.length === 1 ? "" : "s"} blocking production`}
      </div>
      {missingInfoFields.length > 0 && (
        <ul className="grid gap-1 sm:grid-cols-2">
          {missingInfoFields.map((field) => (
            <li
              key={field}
              className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400"
            >
              <AlertCircle className="size-3 shrink-0" />
              {field.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SideCardHeader({
  title,
  count,
  status,
}: {
  title: string;
  count?: number;
  status?: "ok" | "warn" | "empty";
}) {
  return (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-1.5">
          {count !== undefined && (
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {count}
            </span>
          )}
          {status === "ok" && (
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          {status === "warn" && (
            <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
      </div>
    </CardHeader>
  );
}

// ── Workflow gate helpers ──────────────────────────────────────────────────────

/**
 * Compute case readiness from real CaseDetail fields.
 *
 * Weights:
 *   Missing info (25 pts) — all required fields complete
 *   Scan/source files (20 pts) — at least one file uploaded
 *   Design (15 pts) — at least one design version uploaded
 *   Doctor approval (15 pts) — approved or not required
 *   Production stage (10 pts) — past design stage
 *   QC (10 pts) — passed
 *   Finance (5 pts) — price configured
 *
 * Total: 100 pts. Drives the ReadinessRing in the workflow gates card.
 */
function computeReadiness(item: CaseDetailData): number {
  let score = 0;

  // Missing info complete (25 pts)
  if (item.missingInfoFields.length === 0) {
    score += 25;
  } else {
    score += Math.max(0, 25 - item.missingInfoFields.length * 8);
  }

  // Has uploaded files — scans, photos, or doctor uploads (20 pts)
  const hasSourceFiles = item.files.some(
    (f) => ["scan_files", "photos", "doctor_uploads", "exocad_design"].includes(f.category),
  );
  if (hasSourceFiles) score += 20;

  // Has design version (15 pts)
  if (item.designVersions.length > 0) score += 15;

  // Doctor approval (15 pts)
  if (item.requiresDoctorApproval) {
    const approved = item.designVersions.some(
      (d: { approvalStatus: string | null }) => d.approvalStatus === "approved",
    );
    if (approved) score += 15;
  } else {
    score += 15; // Not required = gate is satisfied
  }

  // Past design stage (10 pts) — stage order: cad_design < doctor_approval < milling_printing
  const postDesignStages = [
    "milling_printing", "try_in", "coloring", "furnace", "polishing",
    "quality_control", "ready_for_delivery", "out_for_delivery", "delivered", "completed",
  ];
  if (postDesignStages.includes(item.currentStage)) score += 10;

  // QC passed (10 pts)
  if (item.latestQualityCheck?.result === "passed") score += 10;

  // Finance configured (5 pts)
  if (item.totalPrice > 0) score += 5;

  return Math.min(100, score);
}

function GateRow({
  label,
  state,
}: {
  label: string;
  state: "done" | "pending" | "idle" | "skip";
}) {
  if (state === "skip") return null;

  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${
          state === "done"
            ? "bg-emerald-100 text-emerald-700 ring-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800"
            : state === "pending"
            ? "bg-amber-100 text-amber-700 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800"
            : "bg-muted text-muted-foreground ring-border"
        }`}
      >
        {state === "done" ? (
          <CheckCircle2 className="size-3" />
        ) : (
          <span className="size-1.5 rounded-full bg-current" />
        )}
      </span>
      <span className={state === "done" ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      {state === "pending" && (
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800">
          pending
        </span>
      )}
    </div>
  );
}

function WorkflowGatesPanel({ item }: { item: CaseDetailData }) {
  const currentOrder = stageOrder[item.currentStage as keyof typeof stageOrder] ?? 0;
  const isPast = (stage: string) => currentOrder > (stageOrder[stage as keyof typeof stageOrder] ?? 0);
  const isCurrent = (stage: string) => item.currentStage === stage;

  const filesOk = item.missingInfoFields.length === 0;
  const hasDesign = item.designVersions.length > 0;
  const designApproved = item.designVersions.some((d: { approvalStatus: string | null }) => d.approvalStatus === "approved");
  const qcPassed = item.latestQualityCheck?.result === "passed";
  const qcFailed = item.latestQualityCheck?.result === "failed";
  const inProduction = isPast("doctor_approval") || isCurrent("milling_printing") || isPast("milling_printing");
  const delivered = item.currentStage === "delivered" || item.currentStage === "completed";
  const readyForDelivery = item.currentStage === "ready_for_delivery" || item.currentStage === "out_for_delivery" || delivered;

  const readiness = computeReadiness(item);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Case progress</CardTitle>
          <ReadinessRing value={readiness} size={52} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <GateRow label="Received" state="done" />
          <GateRow
            label="Files complete"
            state={filesOk ? "done" : item.missingInfoFields.length > 0 ? "pending" : "idle"}
          />
          <GateRow
            label="CAD design"
            state={hasDesign ? "done" : isPast("information_check") ? "pending" : "idle"}
          />
          <GateRow
            label="Doctor approval"
            state={
              !item.requiresDoctorApproval
                ? "skip"
                : designApproved
                ? "done"
                : hasDesign
                ? "pending"
                : "idle"
            }
          />
          <GateRow
            label="Production"
            state={
              isPast("milling_printing")
                ? "done"
                : inProduction
                ? "pending"
                : "idle"
            }
          />
          <GateRow
            label="Quality control"
            state={
              qcPassed
                ? "done"
                : qcFailed
                ? "pending"
                : isPast("polishing")
                ? "pending"
                : "idle"
            }
          />
          <GateRow
            label="Delivery"
            state={
              delivered
                ? "done"
                : readyForDelivery
                ? "pending"
                : "idle"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CaseDetail({
  item,
  canViewFinance,
}: {
  item: CaseDetailData;
  canViewFinance: boolean;
}) {
  const risk = dueRisk(item.dueDate, item.status);

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {item.doctorName}
            {item.clinicName ? ` · ${item.clinicName}` : ""}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {item.caseNumber}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{item.patientName}</p>

          {/* Status + stage + flags row */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
            <Badge tone="neutral">{stageDisplayLabel(item.currentStage)}</Badge>
            {item.isUrgent && <Badge tone="red">Urgent</Badge>}
            {item.isRemake && (
              <Badge tone="amber">
                <RotateCcw className="size-2.5" />
                Remake
              </Badge>
            )}
            {item.isWarranty && <Badge tone="blue">Warranty</Badge>}
            {item.requiresDoctorApproval && (
              <Badge tone="amber">Approval required</Badge>
            )}
          </div>
        </div>

        {/* Due date + actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {item.dueDate ? (
            <div
              className={`flex items-center gap-1.5 text-sm font-medium ${
                risk === "overdue"
                  ? "text-red-700 dark:text-red-400"
                  : risk === "due_today"
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground"
              }`}
            >
              <Clock className="size-3.5 shrink-0" />
              {risk === "overdue"
                ? `Overdue · ${item.dueDate}`
                : risk === "due_today"
                ? `Due today · ${item.dueDate}`
                : `Due ${item.dueDate}`}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No due date</p>
          )}
          <Button asChild variant="outline" size="sm">
            <a href={`/cases/${item.id}/summary`}>
              <Printer className="size-3.5" />
              Print summary
            </a>
          </Button>
        </div>
      </div>

      {/* ── Blockers ──────────────────────────────────────────── */}
      <BlockersPanel
        missingInfoFields={item.missingInfoFields}
        status={item.status}
      />

      {/* ── Two-column layout ─────────────────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">

        {/* Left column — case info + history */}
        <div className="space-y-5">

          {/* Case info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Case information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
                <InfoRow label="Work type" value={item.workType} />
                <InfoRow
                  label="Material"
                  value={item.material ?? <span className="text-muted-foreground italic">Not set</span>}
                  highlight={!item.material}
                />
                <InfoRow
                  label="Shade"
                  value={item.shade ?? <span className="text-muted-foreground italic">Not set</span>}
                />
                <InfoRow label="Units" value={item.unitsCount} />
                <InfoRow
                  label="Tooth numbers"
                  value={
                    item.toothNumbers.length > 0
                      ? item.toothNumbers.join(", ")
                      : <span className="text-muted-foreground italic">Not set</span>
                  }
                />
                <InfoRow label="Current stage" value={stageDisplayLabel(item.currentStage)} />
              </dl>

              {item.notes && (
                <div className="mt-4 border-t pt-4">
                  <dt className="text-xs font-medium text-muted-foreground mb-1.5">
                    Doctor notes
                  </dt>
                  <dd className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {item.notes}
                  </dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Activity timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <CaseTimeline events={item.timeline} />
            </CardContent>
          </Card>

          {/* Stage history */}
          {item.stageHistory.length > 0 && (
            <Card>
              <SideCardHeader
                title="Stage history"
                count={item.stageHistory.length}
              />
              <CardContent className="space-y-2">
                {item.stageHistory.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-start gap-3 rounded-md border bg-muted/30 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs">
                        {stage.fromStage
                          ? `${stageDisplayLabel(stage.fromStage)} → ${stageDisplayLabel(stage.toStage)}`
                          : `Started at ${stageDisplayLabel(stage.toStage)}`}
                      </p>
                      {stage.notes && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {stage.notes}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                      {stage.createdAt}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar — operational cards */}
        <div className="space-y-4">

          {/* Workflow gates / case progress */}
          <WorkflowGatesPanel item={item} />

          {/* Files */}
          <Card>
            <SideCardHeader
              title="Files"
              count={item.files.length}
              status={item.files.length > 0 ? "ok" : "empty"}
            />
            <CardContent className="pt-0">
              <CaseFileManager
                labId={item.labId}
                caseId={item.id}
                files={item.files}
                allowedUploadCategories={item.allowedUploadCategories}
                allowedUploadVisibilities={item.allowedUploadVisibilities}
              />
            </CardContent>
          </Card>

          {/* Design versions */}
          <Card>
            <SideCardHeader
              title="Design versions"
              count={item.designVersions.length}
              status={item.designVersions.length > 0 ? "ok" : "empty"}
            />
            <CardContent className="pt-0">
              <DesignWorkflow
                labId={item.labId}
                caseId={item.id}
                versions={item.designVersions}
                canUpload={item.canUploadDesignVersion}
                canDecide={item.canDecideDesignVersion}
                canComment={item.canCommentDesignVersion}
              />
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <SideCardHeader
              title="Comments"
              count={item.comments.length}
              status={item.comments.length > 0 ? "ok" : "empty"}
            />
            <CardContent className="pt-0">
              <CaseDiscussion
                caseId={item.id}
                comments={item.comments}
                files={item.files}
                canCreateComment={item.canCreateComment}
                allowedVisibilities={item.allowedCommentVisibilities}
              />
            </CardContent>
          </Card>

          {/* Quality control */}
          {item.canManageQualityControl && (
            <Card>
              <SideCardHeader
                title="Quality control"
                status={
                  item.latestQualityCheck?.result === "passed"
                    ? "ok"
                    : item.latestQualityCheck?.result === "failed"
                    ? "warn"
                    : "empty"
                }
              />
              <CardContent className="pt-0">
                <QualityControlForm
                  caseId={item.id}
                  workType={item.workType}
                  latestCheck={item.latestQualityCheck}
                  canManage={item.canManageQualityControl}
                />
              </CardContent>
            </Card>
          )}

          {/* Remake */}
          {item.canManageRemakes && (
            <Card>
              <SideCardHeader title="Remake" />
              <CardContent className="pt-0">
                <RemakeForm
                  caseId={item.id}
                  files={item.files}
                  canManage={item.canManageRemakes}
                />
              </CardContent>
            </Card>
          )}

          {/* Finance summary */}
          {canViewFinance && (
            <Card>
              <SideCardHeader title="Finance" />
              <CardContent className="pt-0">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                    <DollarSign className="size-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Case value</p>
                    <p className="text-xl font-bold tabular-nums">
                      {money(item.totalPrice)}
                    </p>
                  </div>
                </div>
                {item.totalPrice === 0 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No price configured for this work type / price group.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
