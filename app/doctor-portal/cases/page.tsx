export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { DoctorPortalDashboard } from "@/components/doctor-portal/doctor-portal-dashboard";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorPortalData } from "@/lib/data/doctor-portal";

export default async function DoctorPortalCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; waitingInfo?: string; approval?: string }>;
}) {
  const session = await requireRouteAccess("/doctor-portal");
  const filters = await searchParams;
  const data = await getDoctorPortalData(session, {
    query: filters.query,
    status: filters.status,
    waitingInfo: filters.waitingInfo === "true",
    approval: filters.approval === "true",
  });

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/doctor-portal">
      <DoctorPortalDashboard data={data} />
    </AppShell>
  );
}
