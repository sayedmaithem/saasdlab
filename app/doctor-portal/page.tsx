export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { DoctorPortalDashboard } from "@/components/doctor-portal/doctor-portal-dashboard";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorPortalData } from "@/lib/data/doctor-portal";
import { ClientMotionWrapper, MotionSection } from "@/components/command-center/client-motion-wrapper";

export default async function DoctorPortalPage() {
  const session = await requireRouteAccess("/doctor-portal");
  const data = await getDoctorPortalData(session);

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/doctor-portal">
      <div className="fixed inset-0 -z-10 bg-aurora opacity-20 pointer-events-none" />
      <ClientMotionWrapper className="relative z-10 space-y-6">
        <MotionSection>
          <DoctorPortalDashboard data={data} />
        </MotionSection>
      </ClientMotionWrapper>
    </AppShell>
  );
}
