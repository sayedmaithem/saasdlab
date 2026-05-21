export const dynamic = "force-dynamic";

import { DoctorProfile } from "@/components/doctors/doctor-profile";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorProfile } from "@/lib/data/doctors";

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRouteAccess("/doctors");
  const { id } = await params;
  const doctor = await getDoctorProfile(session, id);

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/doctors">
      <DoctorProfile doctor={doctor} />
    </AppShell>
  );
}
