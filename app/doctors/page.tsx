export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { requireRouteAccess } from "@/lib/auth/guards";
import { foundationRoutes } from "@/lib/constants/modules";

export default async function DoctorsPage() {
  const session = await requireRouteAccess("/doctors");

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/doctors">
      <ModuleScaffold route={foundationRoutes.doctors} />
    </AppShell>
  );
}
