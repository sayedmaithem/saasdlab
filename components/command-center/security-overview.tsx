import { FINDING_COUNTS } from "@/lib/constants/security-findings";
import { Badge } from "@/components/ui/badge";

type Props = {
  score: number;
};

export function SecurityOverview({ score }: Props) {
  const rows = [
    { label: "Critical", count: FINDING_COUNTS.critical, tone: "red" as const },
    { label: "High", count: FINDING_COUNTS.high, tone: "amber" as const },
    { label: "Medium", count: FINDING_COUNTS.medium, tone: "blue" as const },
    { label: "Low", count: FINDING_COUNTS.low, tone: "neutral" as const },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3">
        <span className="text-2xl font-bold">{score}</span>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Security score</p>
          <p className="text-xs text-muted-foreground">out of 100</p>
        </div>
      </div>

      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3"
        >
          <span className="text-2xl font-bold">{row.count}</span>
          <Badge tone={row.tone}>{row.label}</Badge>
        </div>
      ))}

      <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3">
        <span className="text-2xl font-bold">{FINDING_COUNTS.total}</span>
        <p className="text-xs font-semibold text-muted-foreground">Total findings</p>
      </div>
    </div>
  );
}
