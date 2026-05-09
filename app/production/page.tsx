export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { ProductionBoard } from "@/components/production/production-board";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getProductionBoardData } from "@/lib/data/production";
import { canManageProductionBoard } from "@/lib/production/stage-rules";

export default async function ProductionPage() {
  const session = await requireRouteAccess("/production");
  const data = await getProductionBoardData(session);

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/production">
      <ProductionBoard
        data={data}
        canManageBoard={canManageProductionBoard(session.roles)}
      />
    </AppShell>
  );
}
