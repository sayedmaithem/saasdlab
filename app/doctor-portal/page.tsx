export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { DoctorPortalDashboard } from "@/components/doctor-portal/doctor-portal-dashboard";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorPortalData } from "@/lib/data/doctor-portal";

export default async function DoctorPortalPage() {
  const session = await requireRouteAccess("/doctor-portal");
  const data = await getDoctorPortalData(session);

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/doctor-portal">
      <DoctorPortalDashboard data={data} />
    </AppShell>
  );
}
