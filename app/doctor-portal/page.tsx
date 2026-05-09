import { AppShell } from "@/components/layout/app-shell";
import { ModuleScaffold } from "@/components/layout/module-scaffold";
import { foundationRoutes } from "@/lib/constants/modules";

export default function DoctorPortalPage() {
  return (
    <AppShell labName="LabFlow" activeHref="/doctor-portal">
      <ModuleScaffold route={foundationRoutes.doctorPortal} />
    </AppShell>
  );
}
