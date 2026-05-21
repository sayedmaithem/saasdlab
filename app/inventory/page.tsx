export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { InventoryDashboard } from "@/components/inventory/inventory-dashboard";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";

export default async function InventoryPage() {
  const session = await requireRouteAccess("/inventory");
  const isPreview = canUsePreviewAuth();

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/inventory"
      eyebrow="Lab Operations"
      title="Inventory"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <PageShell>
        <SectionHeader
          title="Stock & Materials"
          description="Track materials, consumables, and equipment across your lab. Manage stock levels, movements, and warehouses."
        />

        <InventoryDashboard />
      </PageShell>
    </AppShell>
  );
}
