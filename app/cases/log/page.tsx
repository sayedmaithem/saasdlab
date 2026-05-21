export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  GitCommitHorizontal,
  FileStack,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  Upload,
  MessageSquare,
  Star,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { getMovementLog } from "@/lib/data/movement-log";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";

// ── Event type config ─────────────────────────────────────────────────────────

type EventMeta = {
  icon: React.ElementType;
  label: string;
  tone: "green" | "blue" | "amber" | "red" | "neutral" | "default";
};

function getEventMeta(eventType: string): EventMeta {
  const map: Record<string, EventMeta> = {
    case_created:         { icon: FileStack,         label: "Case created",         tone: "green" },
    stage_changed:        { icon: GitCommitHorizontal,label: "Stage moved",          tone: "blue" },
    file_uploaded:        { icon: Upload,             label: "File uploaded",        tone: "neutral" },
    design_submitted:     { icon: Layers,             label: "Design submitted",     tone: "blue" },
    design_approved:      { icon: CheckCircle2,       label: "Design approved",      tone: "green" },
    design_rejected:      { icon: AlertCircle,        label: "Design rejected",      tone: "red" },
    qc_passed:            { icon: CheckCircle2,       label: "QC passed",            tone: "green" },
    qc_failed:            { icon: AlertCircle,        label: "QC failed",            tone: "red" },
    case_delivered:       { icon: Star,               label: "Delivered",            tone: "green" },
    comment_added:        { icon: MessageSquare,      label: "Comment added",        tone: "neutral" },
    case_marked_urgent:   { icon: AlertCircle,        label: "Marked urgent",        tone: "amber" },
    payment_recorded:     { icon: Activity,           label: "Payment recorded",     tone: "green" },
  };
  return map[eventType] ?? { icon: Activity, label: eventType.replaceAll("_", " "), tone: "neutral" };
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return "Just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CaseMovementLogPage() {
  const session = await requireRouteAccess("/cases/log");
  const isPreview = canUsePreviewAuth();

  const entries = isPreview ? [] : await getMovementLog(session, 80);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/cases/log"
      eyebrow="Cases"
      title="Movement Log"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <PageShell>
        <SectionHeader
          title="Case movement log"
          description={
            entries.length > 0
              ? `${entries.length} recent events across all cases — newest first.`
              : "A live audit trail of every case state change, file upload, and workflow event."
          }
        />

        {entries.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/20 py-20 text-center">
            <GitCommitHorizontal className="size-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                {isPreview ? "Connect Supabase to see the movement log" : "No events recorded yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60 max-w-sm mx-auto">
                {isPreview
                  ? "Configure your Supabase credentials — case events will appear here as your lab runs."
                  : "Create your first case and move it through stages — every action will be logged here in real time."}
              </p>
            </div>
            {!isPreview && (
              <Link
                href="/cases/new"
                className="text-xs text-primary hover:underline font-medium"
              >
                Create first case →
              </Link>
            )}
          </div>
        ) : (
          /* ── Timeline ── */
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[23px] top-4 bottom-4 w-px bg-border" />

            <div className="space-y-1">
              {entries.map((entry) => {
                const meta = getEventMeta(entry.eventType);
                const Icon = meta.icon;
                return (
                  <div key={entry.id} className="relative flex gap-4 group">
                    {/* Icon bubble */}
                    <div className="relative z-10 flex size-[46px] shrink-0 items-center justify-center">
                      <div className="flex size-8 items-center justify-center rounded-full bg-card border group-hover:border-primary/40 transition-colors">
                        <Icon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 py-2.5 border-b last:border-0 group-hover:border-primary/20 transition-colors">
                      <div className="flex flex-wrap items-start gap-2 justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/cases/${entry.caseId}`}
                              className="text-xs font-mono font-semibold text-primary hover:underline"
                            >
                              {entry.caseNumber}
                            </Link>
                            <Badge tone={meta.tone} className="text-[10px] py-0 px-1.5">
                              {meta.label}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-[13px] font-medium text-foreground">
                            {entry.title}
                          </p>
                          {(entry.patientName || entry.doctorName) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {[entry.patientName, entry.doctorName].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Clock className="size-3" />
                          {formatRelative(entry.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </PageShell>
    </AppShell>
  );
}
