export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { DoctorCaseForm } from "@/components/doctor-portal/doctor-case-form";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorPortalFormData } from "@/lib/data/doctor-portal";

export default async function DoctorPortalNewCasePage() {
  const session = await requireRouteAccess("/doctor-portal");
  const formData = await getDoctorPortalFormData(session);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/doctor-portal"
      eyebrow="Doctor Portal"
      title="New case"
    >
      <DoctorCaseForm formData={formData} />
    </AppShell>
  );
}
