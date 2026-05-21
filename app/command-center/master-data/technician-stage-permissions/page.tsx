export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { TechnicianPermissionsMatrix } from "@/components/master-data/technician-permissions-matrix";
import { getPermissionsMatrixData } from "@/lib/data/workflows";
import { hasRole } from "@/lib/permissions";

export default async function TechnicianStagePermissionsPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const canManage = hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"]);

  const matrixData = await getPermissionsMatrixData(session.activeLabId ?? "");

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Master Data"
      title="Technician Stage Permissions"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />
        <TechnicianPermissionsMatrix data={matrixData} canManage={canManage} />
      </div>
    </AppShell>
  );
}
