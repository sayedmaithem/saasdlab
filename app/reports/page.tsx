export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getOpsReports } from "@/lib/data/reports";

export default async function ReportsPage() {
  const session = await requireRouteAccess("/reports");
  const data = await getOpsReports(session);

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/reports">
      <ReportsDashboard data={data} />
    </AppShell>
  );
}
