import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { foundationRoutes } from "@/lib/constants/modules";

export default function ReportsPage() {
  return (
    <AppShell labName="LabFlow" activeHref="/reports">
      <ModuleScaffold route={foundationRoutes.reports} />
    </AppShell>
  );
}
