export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { requireRouteAccess } from "@/lib/auth/guards";
import { foundationRoutes } from "@/lib/constants/modules";

export default async function PaymentsPage() {
  const session = await requireRouteAccess("/payments");

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/payments">
      <ModuleScaffold route={foundationRoutes.payments} />
    </AppShell>
  );
}
