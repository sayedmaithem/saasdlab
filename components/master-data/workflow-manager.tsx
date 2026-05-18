"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import {
  createWorkflowTemplateAction,
  deleteWorkflowTemplateAction,
} from "@/app/actions/workflows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkflowTemplate, LabWorkflowSummary } from "@/lib/data/workflows";

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

// ── Template row ──────────────────────────────────────────────────────────────

function TemplateRow({
  template,
  canManage,
  onMessage,
}: {
  template: WorkflowTemplate;
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
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="min-w-0">
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
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WorkflowManager({
  templates,
  summary,
  canManage,
}: {
  templates: WorkflowTemplate[];
  summary: LabWorkflowSummary;
  canManage: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handleDone(msg: string) {
    setMessage(msg);
    setShowForm(false);
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
        <div className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm">
          <CheckCircle2 className="size-4 text-green-600" />
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
        <div className="rounded-lg border border-dashed bg-muted/20 py-10 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">No workflow templates yet</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create a template to define a custom stage order for this lab.
            Until then, the production board uses the built-in 18-stage sequence.
          </p>
        </div>
      )}

      {/* ── Fixed stage reference ──────────────────────────── */}
      <FixedStagesPanel stages={summary.fixedStages} />
    </div>
  );
}
