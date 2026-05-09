import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { foundationRoutes } from "@/lib/constants/modules";

export default function SettingsPage() {
  return (
    <AppShell labName="LabFlow" activeHref="/settings">
      <ModuleScaffold route={foundationRoutes.settings} />
    </AppShell>
  );
}
