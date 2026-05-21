"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { upsertTechnicianStagePermissionAction } from "@/app/actions/workflows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  PermissionsMatrixData,
  WorkflowStage,
  TechnicianPermissionRow,
  TechnicianPermissionsForMatrix,
} from "@/lib/data/workflows";

// ── Permission row (per stage per technician) ─────────────────────────────────

function PermissionRow({
  technicianId,
  stage,
  perm,
  canManage,
}: {
  technicianId: string;
  stage: WorkflowStage;
  perm: TechnicianPermissionRow;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [canWork, setCanWork] = useState(perm.can_work);
  const [canMoveFrom, setCanMoveFrom] = useState(perm.can_move_from);
  const [canMoveTo, setCanMoveTo] = useState(perm.can_move_to);
  const [saved, setSaved] = useState(false);
  const dirty =
    canWork !== perm.can_work ||
    canMoveFrom !== perm.can_move_from ||
    canMoveTo !== perm.can_move_to;

  function handleSubmit(fd: FormData) {
    startTransition(async () => {
      const result = await upsertTechnicianStagePermissionAction(fd);
      if (result.ok) setSaved(true);
    });
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-wrap items-center gap-3 rounded-md border bg-background px-3 py-2 text-xs"
    >
      <input type="hidden" name="technician_id" value={technicianId} />
      <input type="hidden" name="stage_id" value={stage.id} />
      <input type="hidden" name="can_work" value={String(canWork)} />
      <input type="hidden" name="can_move_from" value={String(canMoveFrom)} />
      <input type="hidden" name="can_move_to" value={String(canMoveTo)} />

      {/* Stage name */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="w-5 text-center font-mono text-muted-foreground">
          {stage.sort_order + 1}
        </span>
        <span className="font-medium">{stage.name}</span>
        <code className="hidden shrink-0 font-mono text-[10px] text-muted-foreground sm:block">
          {stage.stage_key}
        </code>
      </div>

      {canManage ? (
        <>
          {/* Toggle checkboxes */}
          <label className="flex cursor-pointer select-none items-center gap-1">
            <input
              type="checkbox"
              checked={canWork}
              onChange={(e) => {
                setCanWork(e.target.checked);
                setSaved(false);
              }}
              className="size-3"
            />
            <span className="text-muted-foreground">Work</span>
          </label>
          <label className="flex cursor-pointer select-none items-center gap-1">
            <input
              type="checkbox"
              checked={canMoveFrom}
              onChange={(e) => {
                setCanMoveFrom(e.target.checked);
                setSaved(false);
              }}
              className="size-3"
            />
            <span className="text-muted-foreground">Move from</span>
          </label>
          <label className="flex cursor-pointer select-none items-center gap-1">
            <input
              type="checkbox"
              checked={canMoveTo}
              onChange={(e) => {
                setCanMoveTo(e.target.checked);
                setSaved(false);
              }}
              className="size-3"
            />
            <span className="text-muted-foreground">Move to</span>
          </label>

          <Button
            type="submit"
            size="sm"
            disabled={isPending || !dirty}
            variant={dirty ? "default" : "outline"}
            className="shrink-0"
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
          {saved && !dirty && (
            <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
          )}
        </>
      ) : (
        /* Read-only badge display */
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge tone={canWork ? "green" : "red"} className="text-[10px] px-1">
            Work {canWork ? "✓" : "✗"}
          </Badge>
          <Badge tone={canMoveTo ? "green" : "red"} className="text-[10px] px-1">
            →{canMoveTo ? "✓" : "✗"}
          </Badge>
          <Badge tone={canMoveFrom ? "green" : "red"} className="text-[10px] px-1">
            ←{canMoveFrom ? "✓" : "✗"}
          </Badge>
        </div>
      )}
    </form>
  );
}

// ── Per-technician accordion section ─────────────────────────────────────────

function TechnicianSection({
  technician,
  stages,
  canManage,
}: {
  technician: TechnicianPermissionsForMatrix;
  stages: WorkflowStage[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Count stages where any permission is restricted from default
  const restrictedCount = technician.permissions.filter(
    (p) => !p.can_work || !p.can_move_to || p.can_move_from,
  ).length;

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span>{technician.technicianName}</span>
          {restrictedCount > 0 ? (
            <Badge tone="amber" className="text-[10px]">
              {restrictedCount} stage{restrictedCount !== 1 ? "s" : ""} restricted
            </Badge>
          ) : (
            <Badge tone="green" className="text-[10px]">
              All stages open
            </Badge>
          )}
        </div>
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="border-t px-4 pb-4 pt-3 space-y-2">
          <p className="mb-3 text-xs text-muted-foreground">
            <strong>Work</strong> — can be assigned to and work this stage.{" "}
            <strong>Move from</strong> — can move cases away from this stage.{" "}
            <strong>Move to</strong> — can push cases into this stage.
          </p>
          {stages.map((stage) => {
            const perm = technician.permissions.find(
              (p) => p.stage_id === stage.id,
            );
            if (!perm) return null;
            return (
              <PermissionRow
                key={stage.id}
                technicianId={technician.technicianId}
                stage={stage}
                perm={perm}
                canManage={canManage}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function TechnicianPermissionsMatrix({
  data,
  canManage,
}: {
  data: PermissionsMatrixData;
  canManage: boolean;
}) {
  // No workflow configured
  if (!data.workflowId || data.stages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center space-y-3">
        <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No workflow configured</p>
        <p className="text-xs text-muted-foreground mx-auto max-w-sm">
          Stage permissions are tied to a workflow template. Create and activate a
          workflow in{" "}
          <a
            href="/command-center/master-data/workflows"
            className="underline text-primary"
          >
            Workflow Engine
          </a>{" "}
          before configuring permissions.
        </p>
      </div>
    );
  }

  // No technicians with portal accounts
  if (data.technicians.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center space-y-3">
        <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No technicians with portal accounts</p>
        <p className="text-xs text-muted-foreground mx-auto max-w-sm">
          Technician stage permissions only apply to technicians who have portal
          accounts. Create portal accounts for your technicians under{" "}
          <a
            href="/command-center/users"
            className="underline text-primary"
          >
            Portal Users
          </a>
          , then link them to technician records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold">Technician Stage Permissions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Control which workflow stages each technician can work on and move cases
          between. Permissions are enforced server-side on every stage transition.
        </p>
      </div>

      {/* ── Activation warning ─────────────────────────────── */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
        <strong>Activation notice:</strong> The enforcement engine is{" "}
        <em>fallback (inactive)</em> when no permission rows have been saved for
        this lab. Once you save any row, enforcement activates for{" "}
        <strong>all technicians</strong> — any technician-stage pair without a
        saved row will be blocked. Configure all technicians fully before saving.
      </div>

      {/* ── Technician list ─────────────────────────────────── */}
      <div className="space-y-3">
        {data.technicians.map((tech) => (
          <TechnicianSection
            key={tech.technicianId}
            technician={tech}
            stages={data.stages}
            canManage={canManage}
          />
        ))}
      </div>

      {/* ── Stage count footer ──────────────────────────────── */}
      <p className="text-xs text-muted-foreground">
        {data.stages.length} stage{data.stages.length !== 1 ? "s" : ""} in active
        workflow · {data.technicians.length} technician
        {data.technicians.length !== 1 ? "s" : ""} with portal accounts
      </p>
    </div>
  );
}
