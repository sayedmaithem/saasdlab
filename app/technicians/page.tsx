export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { requireRouteAccess } from "@/lib/auth/guards";
import { foundationRoutes } from "@/lib/constants/modules";

export default async function TechniciansPage() {
  const session = await requireRouteAccess("/technicians");

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/technicians">
      <div className="space-y-5">
        <ModuleScaffold route={foundationRoutes.technicians} />
        <div>
          <a
            href="/technicians/workspace"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Open technician workspace
          </a>
        </div>
      </div>
    </AppShell>
  );
}
