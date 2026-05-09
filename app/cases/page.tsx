import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { foundationRoutes } from "@/lib/constants/modules";

export default function CasesPage() {
  return (
    <AppShell labName="LabFlow" activeHref="/cases">
      <ModuleScaffold route={foundationRoutes.cases} />
    </AppShell>
  );
}
