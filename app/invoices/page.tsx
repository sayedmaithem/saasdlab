import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { foundationRoutes } from "@/lib/constants/modules";

export default function InvoicesPage() {
  return (
    <AppShell labName="LabFlow" activeHref="/invoices">
      <ModuleScaffold route={foundationRoutes.invoices} />
    </AppShell>
  );
}
