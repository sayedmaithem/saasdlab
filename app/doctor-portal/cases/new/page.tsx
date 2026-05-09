export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { DoctorCaseForm } from "@/components/doctor-portal/doctor-case-form";
import { requireRouteAccess } from "@/lib/auth/guards";

export default async function DoctorPortalNewCasePage() {
  const session = await requireRouteAccess("/doctor-portal");

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/doctor-portal">
      <DoctorCaseForm />
    </AppShell>
  );
}
