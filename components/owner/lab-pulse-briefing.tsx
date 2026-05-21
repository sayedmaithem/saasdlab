import { Activity, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type BriefingStatus = "clean" | "action_needed" | "critical";

interface LabPulseBriefingProps {
  labName: string;
  activeCases: number;
  overdueCases: number;
  casesToday: number;
  missingTechnician: number;
  waitingApproval: number;
  waitingQC: number;
  readyForDelivery: number;
}

function getBriefingStatus(props: LabPulseBriefingProps): BriefingStatus {
  if (props.overdueCases > 0) return "critical";
  if (
    props.missingTechnician > 0 ||
    props.waitingApproval > 0 ||
    props.waitingQC > 0 ||
    props.casesToday > 0
  )
    return "action_needed";
  return "clean";
}

function generateBriefing(props: LabPulseBriefingProps): string {
  const {
    activeCases,
    overdueCases,
    casesToday,
    missingTechnician,
    waitingApproval,
    waitingQC,
    readyForDelivery,
  } = props;

  const parts: string[] = [];

  if (overdueCases > 0) {
    parts.push(
      `${overdueCases} case${overdueCases > 1 ? "s are" : " is"} past due date`,
    );
  }
  if (casesToday > 0) {
    parts.push(
      `${casesToday} case${casesToday > 1 ? "s" : ""} due today`,
    );
  }
  if (missingTechnician > 0) {
    parts.push(
      `${missingTechnician} active case${missingTechnician > 1 ? "s" : ""} without a technician`,
    );
  }
  if (waitingApproval > 0) {
    parts.push(
      `${waitingApproval} design${waitingApproval > 1 ? "s" : ""} waiting for doctor approval`,
    );
  }
  if (waitingQC > 0) {
    parts.push(
      `${waitingQC} case${waitingQC > 1 ? "s" : ""} ready for quality check`,
    );
  }
  if (readyForDelivery > 0) {
    parts.push(
      `${readyForDelivery} case${readyForDelivery > 1 ? "s" : ""} ready to dispatch`,
    );
  }

  if (parts.length === 0) {
    return `All ${activeCases} active cases are on track. No overdue cases, no missing assignments, nothing blocking the floor.`;
  }

  const summary = parts.join(", ");
  return `${activeCases} active cases in production. Today: ${summary}.`;
}

const STATUS_STYLES: Record<
  BriefingStatus,
  { border: string; bg: string; icon: typeof Activity; iconColor: string; dot: string; label: string }
> = {
  clean: {
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    icon: CheckCircle2,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    label: "Lab is running clean",
  },
  action_needed: {
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    icon: AlertCircle,
    iconColor: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-400",
    label: "Actions needed",
  },
  critical: {
    border: "border-red-200 dark:border-red-900",
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: AlertCircle,
    iconColor: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    label: "Critical — overdue cases",
  },
};

export function LabPulseBriefing(props: LabPulseBriefingProps) {
  const status = getBriefingStatus(props);
  const briefing = generateBriefing(props);
  const styles = STATUS_STYLES[status];

  return (
    <div
      className={`rounded-xl border ${styles.border} ${styles.bg} p-4 sm:p-5`}
    >
      <div className="flex flex-wrap items-start gap-4">
        {/* Icon + status */}
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm border">
            <Activity className="size-5 text-primary" />
            {/* Live pulse dot */}
            <span className={`absolute -top-1 -right-1 live-dot size-2.5 rounded-full ${styles.dot}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
              Lab Pulse
            </p>
            <p className={`text-[13px] font-semibold ${styles.iconColor}`}>
              {styles.label}
            </p>
          </div>
        </div>

        {/* Briefing text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed text-foreground/90">
            {briefing}
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {props.overdueCases > 0 && (
            <Link
              href="/cases?overdue=true"
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              {props.overdueCases} overdue
              <ArrowRight className="size-3" />
            </Link>
          )}
          {props.readyForDelivery > 0 && (
            <Link
              href="/delivery"
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
            >
              {props.readyForDelivery} to dispatch
              <ArrowRight className="size-3" />
            </Link>
          )}
          {props.waitingQC > 0 && (
            <Link
              href="/quality-control"
              className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-100 dark:bg-purple-900/30 px-2.5 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              {props.waitingQC} in QC
              <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
