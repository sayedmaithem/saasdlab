import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { foundationRoutes } from "@/lib/constants/modules";

export default function DeliveryPage() {
  return (
    <AppShell labName="LabFlow" activeHref="/delivery">
      <ModuleScaffold route={foundationRoutes.delivery} />
    </AppShell>
  );
}
