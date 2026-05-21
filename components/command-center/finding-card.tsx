import { Badge } from "@/components/ui/badge";
import type { SecurityFinding, FindingSeverity } from "@/lib/constants/security-findings";

type BadgeTone = "default" | "blue" | "amber" | "green" | "red" | "neutral";

const SEVERITY_TONE: Record<FindingSeverity, BadgeTone> = {
  critical: "red",
  high: "amber",
  medium: "blue",
  low: "neutral",
};

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

type Props = {
  finding: SecurityFinding;
};

export function FindingCard({ finding }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-muted-foreground">
            {finding.id}
          </span>
          <Badge tone={SEVERITY_TONE[finding.severity]}>
            {SEVERITY_LABEL[finding.severity]}
          </Badge>
          <Badge tone="neutral">{finding.status}</Badge>
        </div>
        <span className="text-xs text-muted-foreground">{finding.phase}</span>
      </div>

      <div>
        <p className="text-sm font-semibold leading-snug">{finding.title}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {finding.affectedArea}
        </p>
      </div>

      <p className="text-sm text-muted-foreground leading-6">{finding.detail}</p>

      <div className="rounded-md bg-muted/50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Recommended action
        </p>
        <p className="text-sm leading-6">{finding.recommendedAction}</p>
      </div>
    </div>
  );
}
