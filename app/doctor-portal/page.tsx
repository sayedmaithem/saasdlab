export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { requireRouteAccess } from "@/lib/auth/guards";
import { foundationRoutes } from "@/lib/constants/modules";

export default async function DoctorPortalPage() {
  const session = await requireRouteAccess("/doctor-portal");

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/doctor-portal">
      <ModuleScaffold route={foundationRoutes.doctorPortal} />
    </AppShell>
  );
}
