export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { SecurityOverview } from "@/components/command-center/security-overview";
import { FindingCard } from "@/components/command-center/finding-card";
import { getSecuritySummary } from "@/lib/data/command-center";
import { SECURITY_FINDINGS } from "@/lib/constants/security-findings";
import type { FindingSeverity } from "@/lib/constants/security-findings";

const SEVERITY_ORDER: FindingSeverity[] = ["critical", "high", "medium", "low"];

const SEVERITY_HEADING: Record<FindingSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default async function SecurityCenterPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const summary = getSecuritySummary();

  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    findings: SECURITY_FINDINGS.filter((f) => f.severity === severity),
  })).filter((group) => group.findings.length > 0);

  return (
    <AppShell
      labName={isPreview ? "Preview Lab" : "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="Security Center"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />

        <SecurityOverview score={summary.score} />

        {grouped.map(({ severity, findings }) => (
          <section key={severity}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {SEVERITY_HEADING[severity]} ({findings.length})
            </h2>
            <div className="space-y-3">
              {findings.map((finding) => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
