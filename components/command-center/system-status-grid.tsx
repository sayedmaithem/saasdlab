import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CloudStatus, CloudStatusKind } from "@/lib/data/command-center";

const STATUS_ICON: Record<CloudStatusKind, React.ElementType> = {
  connected: CheckCircle2,
  warning: AlertTriangle,
  offline: XCircle,
  unknown: HelpCircle,
};

const STATUS_COLOR: Record<CloudStatusKind, string> = {
  connected: "text-green-600",
  warning: "text-amber-500",
  offline: "text-red-600",
  unknown: "text-muted-foreground",
};

type Props = {
  cloudStatus: CloudStatus;
};

export function SystemStatusGrid({ cloudStatus }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cloudStatus.items.map((item) => {
        const Icon = STATUS_ICON[item.status];
        return (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-lg border bg-card p-4"
          >
            <Icon
              className={cn("mt-0.5 size-4 shrink-0", STATUS_COLOR[item.status])}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-5">
                {item.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
