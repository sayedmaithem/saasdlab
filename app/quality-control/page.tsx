export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { QualityControlBoard } from "@/components/qc/quality-control-board";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getQualityControlData } from "@/lib/data/quality";

export default async function QualityControlPage() {
  const session = await requireRouteAccess("/quality-control");
  const data = await getQualityControlData(session);

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/quality-control">
      <QualityControlBoard cases={data.cases} />
    </AppShell>
  );
}
