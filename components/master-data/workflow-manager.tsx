"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import {
  createWorkflowTemplateAction,
  deleteWorkflowTemplateAction,
  seedDefaultWorkflowAction,
  upsertStageRequirementsAction,
} from "@/app/actions/workflows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  WorkflowTemplateWithStages,
  WorkflowStage,
  StageRequirements,
  LabWorkflowSummary,
} from "@/lib/data/workflows";

// ── Fixed stage reference panel ───────────────────────────────────────────────

function FixedStagesPanel({
  stages,
}: {
  stages: LabWorkflowSummary["fixedStages"];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border bg-muted/30">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Fixed stage enum ({stages.length} stages)</span>
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
      </button>
      {open && (
        <div className="border-t px-4 pb-4 pt-3">
          <p className="text-xs text-muted-foreground mb-3">
            Custom workflow templates use these stage keys to stay compatible with the
            production board. The <code>stage_key</code> value in each custom stage must
            match one of the keys below.
          </p>
          <div className="grid gap-1 sm:grid-cols-2 md:grid-cols-3">
            {stages.map((s) => (
              <div
                key={s.key}
                className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs"
              >
                <code className="font-mono text-muted-foreground">{s.key}</code>
                <span className="text-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stage Requirements Editor (per stage) ────────────────────────────────────

const REQ_FLAGS: Array<{
  key: keyof Omit<StageRequirements, "workflow_id" | "stage_key">;
  label: string;
  hint: string;
}> = [
  { key: "requires_assigned_technician", label: "Requires assigned technician", hint: "Case must have a technician assigned before entering this stage." },
  { key: "requires_price", label: "Requires case price", hint: "Case must have a total price set before entering this stage." },
  { key: "requires_files", label: "Requires at least one file", hint: "At least one case file must be uploaded before entering this stage." },
  { key: "requires_qc_pass", label: "Requires passed QC", hint: "A quality control check must have passed before entering this stage." },
  { key: "requires_doctor_approval", label: "Requires doctor approval", hint: "Doctor must have approved the design before entering this stage (only checked when case requires approval)." },
];

function StageRequirementsEditor({
  stage,
  workflowId,
  canManage,
  onMessage,
}: {
  stage: WorkflowStage;
  workflowId: string;
  canManage: boolean;
  onMessage: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const reqs = stage.requirements;

  function submit(fd: FormData) {
    startTransition(async () => {
      const result = await upsertStageRequirementsAction(fd);
      onMessage(result.message);
      if (result.ok) setOpen(false);
    });
  }

  return (
    <div className="mt-2 rounded-md border border-dashed bg-background">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-1.5">
          <span>Entry requirements</span>
          {reqs && Object.entries(reqs).some(([k, v]) =>
            k !== "workflow_id" && k !== "stage_key" && v === true
          ) && (
            <Badge tone="amber" className="text-[9px] px-1 py-0">configured</Badge>
          )}
        </span>
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>
      {open && canManage && (
        <form action={submit} className="border-t px-3 pb-3 pt-2 space-y-3">
          <input type="hidden" name="workflow_id" value={workflowId} />
          <input type="hidden" name="stage_key" value={stage.stage_key} />
          <p className="text-[11px] text-muted-foreground">
            These requirements are enforced server-side when a case tries to move into this stage.
            If not configured, no requirement is checked for this stage.
          </p>
          <div className="space-y-2">
            {REQ_FLAGS.map((flag) => (
              <label key={flag.key} className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name={flag.key}
                  defaultChecked={reqs?.[flag.key] ?? false}
                  className="mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-xs font-medium">{flag.label}</p>
                  <p className="text-[10px] text-muted-foreground">{flag.hint}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving…" : "Save requirements"}
            </Button>
          </div>
        </form>
      )}
      {open && !canManage && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          Only lab owners and managers can configure stage requirements.
        </div>
      )}
    </div>
  );
}

// ── Inline stages panel (per template) ───────────────────────────────────────

function StagesPanel({
  stages,
  workflowId,
  canManage,
  onMessage,
}: {
  stages: WorkflowStage[];
  workflowId: string;
  canManage: boolean;
  onMessage: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (stages.length === 0) {
    return (
      <p className="text-xs text-muted-foreground mt-2">No stages defined yet.</p>
    );
  }

  return (
    <div className="mt-3 rounded-md border bg-muted/20">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-1.5">
          <Layers className="size-3.5 text-muted-foreground" />
          {stages.length} stage{stages.length !== 1 ? "s" : ""}
        </span>
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>
      {open && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          {stages.map((s) => (
            <div key={s.id} className="rounded border bg-background">
              <div className="flex items-center gap-3 px-2 py-1.5 text-xs">
                <span className="w-5 text-center font-mono text-muted-foreground">
                  {s.sort_order + 1}
                </span>
                <span className="flex-1 font-medium truncate">{s.name}</span>
                <code className="font-mono text-muted-foreground hidden sm:block shrink-0">
                  {s.stage_key}
                </code>
                <div className="flex items-center gap-1 shrink-0">
                  {s.requires_technician && (
                    <Badge tone="blue" className="text-[10px] px-1 py-0">Tech</Badge>
                  )}
                  {s.requires_qc && (
                    <Badge tone="blue" className="text-[10px] px-1 py-0">QC</Badge>
                  )}
                  {s.requires_doctor_approval && (
                    <Badge tone="amber" className="text-[10px] px-1 py-0">Dr Appr</Badge>
                  )}
                  {s.blocks_delivery && (
                    <Badge tone="red" className="text-[10px] px-1 py-0">Blocks</Badge>
                  )}
                </div>
              </div>
              <div className="px-2 pb-2">
                <StageRequirementsEditor
                  stage={s}
                  workflowId={workflowId}
                  canManage={canManage}
                  onMessage={onMessage}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create template form ──────────────────────────────────────────────────────

function CreateTemplateForm({ onDone }: { onDone: (msg: string) => void }) {
  const [isPending, startTransition] = useTransition();

  function submit(fd: FormData) {
    startTransition(async () => {
      const result = await createWorkflowTemplateAction(fd);
      onDone(result.message);
    });
  }

  return (
    <form action={submit} className="space-y-4 rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold">New workflow template</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="wf-name">Name *</Label>
          <Input id="wf-name" name="name" placeholder="e.g. Crown & Bridge Standard" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="wf-desc">Description</Label>
          <Input id="wf-desc" name="description" placeholder="Optional description" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_default" />
        Set as default workflow
      </label>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          <Plus className="size-4" />
          {isPending ? "Creating…" : "Create template"}
        </Button>
      </div>
    </form>
  );
}

// ── Seed default workflow button ──────────────────────────────────────────────

function SeedWorkflowButton({ onDone }: { onDone: (msg: string, ok: boolean) => void }) {
  const [isPending, startTransition] = useTransition();

  function handleSeed() {
    if (
      !confirm(
        "This will create the Standard Lab Workflow template with all 18 production stages and linear transitions. Continue?",
      )
    )
      return;
    startTransition(async () => {
      const result = await seedDefaultWorkflowAction();
      onDone(result.message, result.ok);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSeed}
      disabled={isPending}
      className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
    >
      <Zap className="size-4" />
      {isPending ? "Setting up…" : "Quick setup: seed standard workflow"}
    </Button>
  );
}

// ── Template row ──────────────────────────────────────────────────────────────

function TemplateRow({
  template,
  canManage,
  onMessage,
}: {
  template: WorkflowTemplateWithStages;
  canManage: boolean;
  onMessage: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !confirm(
        `Deactivate the template "${template.name}"? Existing cases won't be affected.`,
      )
    )
      return;
    startTransition(async () => {
      const result = await deleteWorkflowTemplateAction(template.id);
      onMessage(result.message);
    });
  }

  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{template.name}</p>
            {template.is_default && (
              <Badge tone="green">Default</Badge>
            )}
          </div>
          {template.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Created {new Date(template.created_at).toLocaleDateString()}
          </p>
        </div>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="text-destructive hover:text-destructive flex-shrink-0"
          >
            <Trash2 className="size-4" />
            {isPending ? "Removing…" : "Remove"}
          </Button>
        )}
      </div>
      <StagesPanel
        stages={template.stages}
        workflowId={template.id}
        canManage={canManage}
        onMessage={onMessage}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WorkflowManager({
  templates,
  summary,
  canManage,
}: {
  templates: WorkflowTemplateWithStages[];
  summary: LabWorkflowSummary;
  canManage: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(true);
  const [showForm, setShowForm] = useState(false);

  function handleDone(msg: string) {
    setMessage(msg);
    setMessageOk(true);
    setShowForm(false);
  }

  function handleSeedDone(msg: string, ok: boolean) {
    setMessage(msg);
    setMessageOk(ok);
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Workflow Engine</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure custom stage sequences for your lab. The production board uses
            the fixed stage enum by default; custom templates give you relabeling and
            ordering control without breaking existing cases.
          </p>
        </div>
        {canManage && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            New template
          </Button>
        )}
      </div>

      {/* ── Status message ─────────────────────────────────── */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border bg-background p-3 text-sm ${
            messageOk ? "border-green-200 text-green-700" : "border-amber-200 text-amber-700"
          }`}
        >
          <CheckCircle2 className="size-4 shrink-0" />
          {message}
        </div>
      )}

      {/* ── Create form ────────────────────────────────────── */}
      {showForm && canManage && (
        <CreateTemplateForm onDone={handleDone} />
      )}

      {/* ── Mode indicator ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Production board mode</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-center gap-3">
            <Badge tone={summary.hasCustomWorkflows ? "green" : "neutral"}>
              {summary.hasCustomWorkflows ? "Custom workflow" : "Fixed enum (default)"}
            </Badge>
            {summary.defaultTemplate && (
              <span className="text-muted-foreground">
                Default: {summary.defaultTemplate.name}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            {summary.hasCustomWorkflows
              ? `${summary.templateCount} custom template${summary.templateCount !== 1 ? "s" : ""} defined. The default template drives the production board stage order.`
              : "No custom templates yet. The production board uses the 18-stage fixed enum. Create a template to customise stage labels and ordering."}
          </p>
        </CardContent>
      </Card>

      {/* ── Template list ──────────────────────────────────── */}
      {templates.length > 0 ? (
        <div className="space-y-3">
          {templates.map((t) => (
            <TemplateRow
              key={t.id}
              template={t}
              canManage={canManage}
              onMessage={setMessage}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 py-10 text-center space-y-3">
          <p className="text-sm font-medium text-foreground">No workflow templates yet</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create a blank template to define a custom stage order, or use Quick Setup to
            instantly seed all 18 production stages with standard transitions.
          </p>
          {canManage && (
            <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="size-4" />
                New blank template
              </Button>
              <SeedWorkflowButton onDone={handleSeedDone} />
            </div>
          )}
        </div>
      )}

      {/* ── Fixed stage reference ──────────────────────────── */}
      <FixedStagesPanel stages={summary.fixedStages} />
    </div>
  );
}
