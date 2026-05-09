import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { foundationRoutes } from "@/lib/constants/modules";

export default function DoctorsPage() {
  return (
    <AppShell labName="LabFlow" activeHref="/doctors">
      <ModuleScaffold route={foundationRoutes.doctors} />
    </AppShell>
  );
}
