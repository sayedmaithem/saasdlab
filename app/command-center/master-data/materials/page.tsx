export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { MaterialsManager } from "@/components/master-data/materials-manager";
import { getLabMaterials } from "@/lib/data/master-data";
import { hasRole } from "@/lib/permissions";

export default async function MaterialsPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const materials = await getLabMaterials(session);
  const canManage = hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"]);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Master Data"
      title="Materials"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />
        <MaterialsManager materials={materials} canManage={canManage} />
      </div>
    </AppShell>
  );
}
