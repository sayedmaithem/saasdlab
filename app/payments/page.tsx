import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { foundationRoutes } from "@/lib/constants/modules";

export default function PaymentsPage() {
  return (
    <AppShell labName="LabFlow" activeHref="/payments">
      <ModuleScaffold route={foundationRoutes.payments} />
    </AppShell>
  );
}
