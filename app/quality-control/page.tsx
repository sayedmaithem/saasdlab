export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { QualityControlBoard } from "@/components/qc/quality-control-board";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { getQualityControlData } from "@/lib/data/quality";
import { hasRole } from "@/lib/permissions";

export default async function QualityControlPage() {
  const session = await requireRouteAccess("/quality-control");
  const isPreview = canUsePreviewAuth();
  const data = await getQualityControlData(session);
  const canManage = hasRole(session.roles, [
    "super_admin",
    "lab_owner",
    "lab_manager",
    "technician",
  ]);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/quality-control"
      eyebrow="Lab Operations"
      title="Quality Control"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <QualityControlBoard cases={data.cases} canManage={canManage} />
    </AppShell>
  );
}
