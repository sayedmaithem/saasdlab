export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { PriceGroupsManager } from "@/components/master-data/price-groups-manager";
import { getPriceGroups } from "@/lib/data/master-data";
import { hasRole } from "@/lib/permissions";

export default async function PriceGroupsPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const priceGroups = await getPriceGroups(session);
  const canManage = hasRole(session.roles, [
    "super_admin",
    "lab_owner",
    "lab_manager",
    "accountant",
  ]);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Master Data"
      title="Price Groups"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />
        <PriceGroupsManager priceGroups={priceGroups} canManage={canManage} />
      </div>
    </AppShell>
  );
}
