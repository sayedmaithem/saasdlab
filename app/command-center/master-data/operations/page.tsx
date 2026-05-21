export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { OperationsManager } from "@/components/master-data/operations-manager";
import { getLabOperations } from "@/lib/data/master-data";
import { hasRole } from "@/lib/permissions";

export default async function OperationsPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const operations = await getLabOperations(session);
  const canManage = hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"]);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Master Data"
      title="Work Types / Operations"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />
        <OperationsManager operations={operations} canManage={canManage} />
      </div>
    </AppShell>
  );
}
