import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { foundationRoutes } from "@/lib/constants/modules";

export default function ProductionPage() {
  return (
    <AppShell labName="LabFlow" activeHref="/production">
      <ModuleScaffold route={foundationRoutes.production} />
    </AppShell>
  );
}
