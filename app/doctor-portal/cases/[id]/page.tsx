export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { CaseDetail } from "@/components/cases/case-detail";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getCaseDetail } from "@/lib/data/cases";

export default async function DoctorPortalCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRouteAccess("/doctor-portal");
  const { id } = await params;
  const item = await getCaseDetail(session, id, false);

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/doctor-portal">
      <CaseDetail item={item} canViewFinance={false} />
    </AppShell>
  );
}
