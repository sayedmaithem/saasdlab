"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSearch,
  Layers,
  ThumbsUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DesignQueueItem, DesignQueueStage } from "@/lib/data/design";

// ── Constants ─────────────────────────────────────────────────────────────────

const TAB_META: Record<
  DesignQueueStage,
  { label: string; tone: "neutral" | "amber" | "blue" | "green" | "red" }
> = {
  cad_design: { label: "Needs design", tone: "amber" },
  doctor_approval: { label: "Awaiting approval", tone: "blue" },
  design_review: { label: "In review", tone: "neutral" },
};

const tabs: DesignQueueStage[] = ["cad_design", "doctor_approval", "design_review"];

const DESIGN_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  needs_changes: "Needs changes",
};

function designStatusTone(
  status: string | null,
): "neutral" | "green" | "red" | "amber" | "blue" {
  if (!status) return "neutral";
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  if (status === "needs_changes") return "amber";
  if (status === "pending_review") return "blue";
  return "neutral";
}

function dueRiskClass(dueDate: string | null): string {
  if (!dueDate) return "text-muted-foreground";
  const today = new Date().toISOString().slice(0, 10);
  if (dueDate < today) return "text-red-700 dark:text-red-400";
  if (dueDate === today) return "text-amber-700 dark:text-amber-400";
  return "text-muted-foreground";
}

// ── Case card ─────────────────────────────────────────────────────────────────

function DesignCaseCard({ item }: { item: DesignQueueItem }) {
  const hasVersions = item.designVersionsCount > 0;

  return (
    <article className="rounded-lg border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/cases/${item.id}`}
              className="text-sm font-semibold hover:underline"
            >
              {item.caseNumber}
            </Link>
            {item.isUrgent && <Badge tone="red">Urgent</Badge>}
            {!item.hasSourceFiles && (
              <Badge tone="amber">No scan files</Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.patientName} · {item.doctorName}
            {item.clinicName ? ` · ${item.clinicName}` : ""}
          </p>
        </div>

        {item.dueDate && (
          <div className={`flex items-center gap-1 text-xs font-medium shrink-0 ${dueRiskClass(item.dueDate)}`}>
            <Clock className="size-3" />
            {item.dueDate}
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{item.workType}</Badge>

        {hasVersions ? (
          <Badge tone={designStatusTone(item.latestDesignStatus)}>
            <Layers className="size-3" />
            {item.designVersionsCount} version{item.designVersionsCount === 1 ? "" : "s"}
            {item.latestDesignStatus
              ? ` · ${DESIGN_STATUS_LABELS[item.latestDesignStatus] ?? item.latestDesignStatus}`
              : ""}
          </Badge>
        ) : (
          <Badge tone="neutral">No design uploaded yet</Badge>
        )}
      </div>

      {/* Action link */}
      <div className="flex items-center gap-2 border-t pt-3">
        <Link
          href={`/cases/${item.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Open case file →
        </Link>
      </div>
    </article>
  );
}

// ── Empty states ──────────────────────────────────────────────────────────────

function EmptyState({ stage }: { stage: DesignQueueStage }) {
  const config: Record<
    DesignQueueStage,
    { icon: React.ElementType; title: string; description: string }
  > = {
    cad_design: {
      icon: FileSearch,
      title: "No cases need design",
      description:
        "Cases that have entered the CAD design stage will appear here for you to upload design files.",
    },
    doctor_approval: {
      icon: ThumbsUp,
      title: "No cases awaiting approval",
      description:
        "Cases where a design version has been submitted and is waiting for doctor sign-off will appear here.",
    },
    design_review: {
      icon: CheckCircle2,
      title: "No cases in review",
      description:
        "Cases where the doctor has requested changes and the design is being revised will appear here.",
    },
  };

  const { icon: Icon, title, description } = config[stage];

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/20 py-14 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DesignQueue({
  items,
  totalByStage,
}: {
  items: DesignQueueItem[];
  totalByStage: Record<DesignQueueStage, number>;
}) {
  const [activeTab, setActiveTab] = useState<DesignQueueStage>("cad_design");

  const filtered = items.filter((item) => item.currentStage === activeTab);
  const totalCases = items.length;
  const noScanFilesCount = items.filter((i) => !i.hasSourceFiles).length;

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Summary strip ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{totalCases}</span> case{totalCases === 1 ? "" : "s"} in design workflow
        </span>
        {noScanFilesCount > 0 && (
          <span className="flex items-center gap-1 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="size-3.5" />
            <span className="font-semibold">{noScanFilesCount}</span> missing scan files
          </span>
        )}
      </div>

      {/* ── Tab bar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 border-b pb-4">
        {tabs.map((tab) => {
          const meta = TAB_META[tab];
          const count = totalByStage[tab] ?? 0;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {meta.label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Case list ─────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {TAB_META[activeTab].label} · {filtered.length} case{filtered.length === 1 ? "" : "s"}
          </p>
          {filtered.map((item) => (
            <DesignCaseCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState stage={activeTab} />
      )}
    </div>
  );
}
