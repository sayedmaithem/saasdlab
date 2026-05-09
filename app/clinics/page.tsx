export const dynamic = "force-dynamic";

import { ClinicsManager } from "@/components/clinics/clinics-manager";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getClinics } from "@/lib/data/clinics";
import { hasRole } from "@/lib/permissions";

export default async function ClinicsPage() {
  const session = await requireRouteAccess("/clinics");
  const clinics = await getClinics(session);
  const canManage = hasRole(session.roles, [
    "super_admin",
    "lab_owner",
    "lab_manager",
    "reception",
  ]);

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/clinics">
      <div className="mb-5">
        <p className="text-sm font-medium text-muted-foreground">
          Relationship management
        </p>
        <h2 className="text-2xl font-semibold">Clinics</h2>
      </div>
      <ClinicsManager clinics={clinics} canManage={canManage} />
    </AppShell>
  );
}
