"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { submitQualityCheckAction } from "@/app/actions/quality";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getQcChecklistForWorkType } from "@/lib/quality/qc-rules";
import type { QualityControlCase } from "@/lib/data/quality";

// ── Helpers ───────────────────────────────────────────────────────────────────

function dueTone(dueDate: string | null): "red" | "amber" | "neutral" {
  if (!dueDate) return "neutral";
  const today = new Date().toISOString().slice(0, 10);
  return dueDate < today ? "red" : dueDate === today ? "amber" : "neutral";
}

function qcTone(status: string) {
  if (status === "passed") return "green" as const;
  if (status === "failed") return "red" as const;
  if (status === "needs_adjustment") return "amber" as const;
  return "neutral" as const;
}

function qcLabel(status: string) {
  if (status === "needs_adjustment") return "Needs adjustment";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ── QC action form per case ───────────────────────────────────────────────────

function QcForm({
  item,
  onMessage,
}: {
  item: QualityControlCase;
  onMessage: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(item.qcStatus === "pending");
  const [selectedResult, setSelectedResult] = useState<string>("");
  const checklist = getQcChecklistForWorkType(item.workType);

  function submit(fd: FormData) {
    startTransition(async () => {
      const result = await submitQualityCheckAction(fd);
      onMessage(result.message);
      if (result.ok) setOpen(false);
    });
  }

  return (
    <div className="rounded-md border bg-muted/20">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-1.5">
          <ClipboardCheck className="size-3.5" />
          {item.qcStatus === "pending" ? "Submit QC inspection" : "Re-inspect"}
        </span>
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>

      {open && (
        <form action={submit} className="border-t px-3 pb-4 pt-3 space-y-4">
          <input type="hidden" name="caseId" value={item.id} />

          {/* Checklist */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Inspection checklist
            </p>
            <div className="grid gap-1 sm:grid-cols-2">
              {checklist.map((entry) => (
                <label
                  key={entry.key}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted cursor-pointer"
                >
                  <input type="checkbox" name={entry.key} className="size-3.5 shrink-0" />
                  <span>{entry.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Result selector */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Inspection result
            </p>
            <div className="flex flex-wrap gap-2">
              {(["passed", "needs_adjustment", "failed"] as const).map((r) => (
                <label key={r} className="cursor-pointer">
                  <input
                    type="radio"
                    name="result"
                    value={r}
                    checked={selectedResult === r}
                    onChange={() => setSelectedResult(r)}
                    className="sr-only"
                    required
                  />
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      selectedResult === r
                        ? r === "passed"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : r === "needs_adjustment"
                          ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                        : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {r === "passed" && <CheckCircle2 className="size-3" />}
                    {r === "needs_adjustment" && <AlertTriangle className="size-3" />}
                    {r === "failed" && <XCircle className="size-3" />}
                    {qcLabel(r)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes (required for fail/needs_adjustment) */}
          <div className="space-y-1">
            <Textarea
              name="notes"
              placeholder={
                selectedResult === "failed" || selectedResult === "needs_adjustment"
                  ? "Reason required for fails and adjustments…"
                  : "Notes (optional for pass)…"
              }
              rows={2}
              className="text-xs"
            />
            {(selectedResult === "failed" || selectedResult === "needs_adjustment") && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                A reason is required when result is not passed.
              </p>
            )}
          </div>

          <Button type="submit" size="sm" disabled={isPending || !selectedResult}>
            {isPending ? "Saving…" : "Submit inspection"}
          </Button>
        </form>
      )}
    </div>
  );
}

// ── Case card ─────────────────────────────────────────────────────────────────

function QcCaseCard({
  item,
  canManage,
  onMessage,
}: {
  item: QualityControlCase;
  canManage: boolean;
  onMessage: (msg: string) => void;
}) {
  const overdue = dueTone(item.dueDate) === "red";
  const today = dueTone(item.dueDate) === "amber";

  return (
    <article
      className={`rounded-lg border bg-card p-4 space-y-3 ${
        overdue ? "border-red-200 dark:border-red-900" : today ? "border-amber-200 dark:border-amber-900" : ""
      }`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/cases/${item.id}`}
              className="font-semibold text-sm hover:underline"
            >
              {item.caseNumber}
            </Link>
            <Badge tone={qcTone(item.qcStatus)} className="text-[10px]">
              {qcLabel(item.qcStatus)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.patientName} · {item.doctorName}
          </p>
        </div>
        {item.dueDate && (
          <Badge tone={dueTone(item.dueDate)} className="shrink-0 text-xs">
            Due {item.dueDate}
          </Badge>
        )}
      </div>

      {/* Detail row */}
      <div className="grid gap-2 text-xs sm:grid-cols-3">
        <p>
          <span className="text-muted-foreground">Work type</span>
          <span className="block font-medium">{item.workType}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Technician</span>
          <span className="block font-medium">{item.technicianName}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Last checked by</span>
          <span className="block font-medium">{item.checkerName ?? "Not checked"}</span>
        </p>
      </div>

      {/* Notes from previous check */}
      {item.notes && (
        <p className="rounded border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <strong>Previous notes:</strong> {item.notes}
        </p>
      )}

      {/* QC form (managers and technicians) */}
      {canManage && <QcForm item={item} onMessage={onMessage} />}
    </article>
  );
}

// ── Main board component ──────────────────────────────────────────────────────

export function QualityControlBoard({
  cases,
  canManage,
}: {
  cases: QualityControlCase[];
  canManage: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const waiting = cases.filter((item) => item.qcStatus === "pending");
  const overdue = cases.filter((item) => dueTone(item.dueDate) === "red");
  const needsAdjustment = cases.filter((item) => item.qcStatus === "needs_adjustment");

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── KPI strip ─────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Awaiting inspection
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold tabular-nums">{waiting.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Not yet checked</p>
          </CardContent>
        </Card>
        <Card className={overdue.length > 0 ? "border-red-200 dark:border-red-900" : ""}>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Overdue risk
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className={`text-2xl font-bold tabular-nums ${overdue.length > 0 ? "text-red-700 dark:text-red-400" : ""}`}>
              {overdue.length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {overdue.length > 0 ? "Past due date" : "All within schedule"}
            </p>
          </CardContent>
        </Card>
        <Card className={needsAdjustment.length > 0 ? "border-amber-200 dark:border-amber-900" : ""}>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Needs adjustment
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className={`text-2xl font-bold tabular-nums ${needsAdjustment.length > 0 ? "text-amber-700 dark:text-amber-400" : ""}`}>
              {needsAdjustment.length}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Returned for rework</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Action feedback ───────────────────────────────── */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
            message.toLowerCase().includes("pass") || message.toLowerCase().includes("saved") || message.toLowerCase().includes("recorded")
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* ── Case list ─────────────────────────────────────── */}
      {cases.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/20 py-14 text-center">
          <CheckCircle2 className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">QC queue is clear</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              No cases are waiting at the quality control stage. When a case reaches
              QC, it will appear here for inspection.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-1">
            <Link href="/production">View production board</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((item) => (
            <QcCaseCard
              key={item.id}
              item={item}
              canManage={canManage}
              onMessage={setMessage}
            />
          ))}
        </div>
      )}

    </div>
  );
}
