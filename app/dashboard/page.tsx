export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { CaseTable } from "@/components/dashboard/case-table";
import { DoctorPerformance } from "@/components/dashboard/doctor-performance";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { OperationsPanel } from "@/components/dashboard/operations-panel";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { SourceBanner } from "@/components/dashboard/source-banner";
import { WorkflowBoard } from "@/components/dashboard/workflow-board";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/data/dashboard";
import { getOpsReports } from "@/lib/data/reports";

export default async function DashboardPage() {
  const session = await requireRouteAccess("/dashboard");
  const [data, reports] = await Promise.all([
    getDashboardData(session),
    getOpsReports(session),
  ]);

  return (
    <AppShell labName={data.labName} session={session} activeHref="/dashboard">
      <SourceBanner source={data.source} />
      <div className="space-y-5">
        <KpiGrid kpis={data.kpis} />
        <WorkflowBoard metrics={data.stageMetrics} />
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <CaseTable cases={data.activeCases} />
          <div className="space-y-5">
            <OperationsPanel data={data} />
            <DoctorPerformance doctors={data.doctorPerformance} />
          </div>
        </div>
        <ReportsDashboard data={reports} />
      </div>
    </AppShell>
  );
}
