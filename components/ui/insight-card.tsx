import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ArrowRight } from "lucide-react";

export type InsightTone = "critical" | "warning" | "info" | "success";

interface InsightCardProps {
  tone: InsightTone;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  /** Optional extra content (e.g. count badge or sub-list) */
  children?: ReactNode;
}

const TONE_CONFIG: Record<
  InsightTone,
  {
    border: string;
    bg: string;
    icon: typeof AlertCircle;
    iconColor: string;
    titleColor: string;
  }
> = {
  critical: {
    border: "border-red-200 dark:border-red-900",
    bg: "bg-red-50 dark:bg-red-950/30",
    icon: AlertCircle,
    iconColor: "text-red-600 dark:text-red-400",
    titleColor: "text-red-800 dark:text-red-300",
  },
  warning: {
    border: "border-amber-200 dark:border-amber-900",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    icon: AlertTriangle,
    iconColor: "text-amber-600 dark:text-amber-400",
    titleColor: "text-amber-800 dark:text-amber-300",
  },
  info: {
    border: "border-blue-200 dark:border-blue-900",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
    titleColor: "text-blue-800 dark:text-blue-300",
  },
  success: {
    border: "border-green-200 dark:border-green-900",
    bg: "bg-green-50 dark:bg-green-950/30",
    icon: CheckCircle2,
    iconColor: "text-green-600 dark:text-green-400",
    titleColor: "text-green-800 dark:text-green-300",
  },
};

/**
 * Actionable operational insight card — used in /owner and /hq dashboards.
 * Each card describes a situation, its impact, and offers a direct action.
 * Never decorative — every InsightCard must have a purpose.
 */
export function InsightCard({
  tone,
  title,
  description,
  action,
  children,
}: InsightCardProps) {
  const config = TONE_CONFIG[tone];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border ${config.border} ${config.bg} p-4`}
    >
      <Icon
        className={`mt-0.5 size-4 shrink-0 ${config.iconColor}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={`text-sm font-semibold leading-snug ${config.titleColor}`}>
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        {children && <div className="pt-1">{children}</div>}
        {action && (
          <Link
            href={action.href}
            className={`inline-flex items-center gap-1 text-xs font-medium ${config.iconColor} hover:underline pt-1`}
          >
            {action.label}
            <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
