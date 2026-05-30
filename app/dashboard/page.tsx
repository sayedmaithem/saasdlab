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
      <div className="animate-fade-in relative z-10 w-full max-w-7xl mx-auto space-y-8">
        
        {/* Spatial Header */}
        <div className="relative overflow-hidden rounded-3xl glass-strong border border-white/10 p-8 shadow-2xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black/40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 mix-blend-screen" />
          
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg mb-2">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">{session.email?.split('@')[0] || 'User'}</span>
          </h1>
          <p className="text-sky-200/80 uppercase tracking-widest text-xs font-bold">
            Live Lab Operations • All Systems Nominal
          </p>
        </div>

        <SourceBanner source={data.source} />

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-white/5 bg-black/20 shadow-inner">
            <KpiGrid kpis={data.kpis} />
          </div>
          
          <div className="glass-card p-6 rounded-3xl border border-white/5 bg-black/20 shadow-inner">
            <WorkflowBoard metrics={data.stageMetrics} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="glass-strong rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <CaseTable cases={data.activeCases} />
            </div>
            <div className="space-y-6">
              <div className="glass-card p-5 rounded-3xl border border-white/5 bg-black/20">
                <OperationsPanel data={data} />
              </div>
              <div className="glass-card p-5 rounded-3xl border border-white/5 bg-black/20">
                <DoctorPerformance doctors={data.doctorPerformance} />
              </div>
            </div>
          </div>

          <div className="glass-strong p-6 rounded-3xl border border-white/10 shadow-2xl mt-8 relative overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 blur-[100px] -z-10 pointer-events-none" />
            <ReportsDashboard data={reports} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
