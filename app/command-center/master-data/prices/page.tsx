export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { OperationPricesManager } from "@/components/master-data/operation-prices-manager";
import {
  getOperationPrices,
  getPriceGroups,
  getLabOperations,
  getLabMaterials,
} from "@/lib/data/master-data";
import { hasRole } from "@/lib/permissions";

export default async function PricesPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const { group: selectedGroupId } = await searchParams;
  const canManage = hasRole(session.roles, [
    "super_admin",
    "lab_owner",
    "lab_manager",
    "accountant",
  ]);

  const [prices, priceGroups, operations, materials] = await Promise.all([
    getOperationPrices(session, selectedGroupId),
    getPriceGroups(session),
    getLabOperations(session),
    getLabMaterials(session),
  ]);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Master Data"
      title="Operation Prices"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />
        <OperationPricesManager
          prices={prices}
          priceGroups={priceGroups}
          operations={operations}
          materials={materials}
          selectedGroupId={selectedGroupId ?? null}
          canManage={canManage}
        />
      </div>
    </AppShell>
  );
}
