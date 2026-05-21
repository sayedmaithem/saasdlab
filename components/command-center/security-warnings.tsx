import Link from "next/link";
import { AlertTriangle, XCircle } from "lucide-react";
import { SECURITY_FINDINGS } from "@/lib/constants/security-findings";
import { Badge } from "@/components/ui/badge";

export function SecurityWarnings() {
  const criticals = SECURITY_FINDINGS.filter((f) => f.severity === "critical" && f.status === "open");
  const highs = SECURITY_FINDINGS.filter((f) => f.severity === "high" && f.status === "open");
  const topFindings = [...criticals, ...highs].slice(0, 4);

  if (topFindings.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
        <p className="text-sm font-semibold">No critical or high findings</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topFindings.map((finding) => {
        const isCritical = finding.severity === "critical";
        const Icon = isCritical ? XCircle : AlertTriangle;

        return (
          <div
            key={finding.id}
            className={
              isCritical
                ? "flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-900"
                : "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900"
            }
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold">{finding.id}</span>
                <Badge tone={isCritical ? "red" : "amber"}>
                  {isCritical ? "Critical" : "High"}
                </Badge>
                <span className="text-xs font-medium truncate">{finding.title}</span>
              </div>
              <p className="mt-1 font-mono text-xs opacity-70 truncate">
                {finding.affectedArea}
              </p>
            </div>
          </div>
        );
      })}

      {(criticals.length + highs.length) > 4 && (
        <p className="text-xs text-muted-foreground pl-1">
          +{criticals.length + highs.length - 4} more critical/high findings —{" "}
          <Link href="/command-center/security" className="underline">
            view all
          </Link>
        </p>
      )}
    </div>
  );
}
