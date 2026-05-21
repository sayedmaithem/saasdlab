import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusKind = "ok" | "warning" | "error" | "unknown" | "placeholder";

const STATUS_CONFIG: Record<
  StatusKind,
  { icon: React.ElementType; colorClass: string; label: string }
> = {
  ok: { icon: CheckCircle2, colorClass: "text-green-600", label: "OK" },
  warning: { icon: AlertTriangle, colorClass: "text-amber-500", label: "Warning" },
  error: { icon: XCircle, colorClass: "text-red-600", label: "Error" },
  unknown: { icon: HelpCircle, colorClass: "text-muted-foreground", label: "Unknown" },
  placeholder: { icon: HelpCircle, colorClass: "text-muted-foreground/50", label: "Planned" },
};

type Props = {
  title: string;
  value: string;
  status: StatusKind;
  detail?: string;
  placeholderLabel?: string;
};

export function StatusCard({ title, value, status, detail, placeholderLabel }: Props) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        <Icon
          className={cn("size-4 shrink-0", config.colorClass)}
          aria-label={config.label}
        />
      </div>
      <p
        className={cn(
          "text-lg font-semibold leading-tight",
          status === "placeholder" && "text-muted-foreground/50",
        )}
      >
        {value}
      </p>
      {detail && (
        <p className="text-xs text-muted-foreground leading-5">{detail}</p>
      )}
      {status === "placeholder" && placeholderLabel && (
        <p className="text-xs text-muted-foreground/60 italic">{placeholderLabel}</p>
      )}
    </div>
  );
}
