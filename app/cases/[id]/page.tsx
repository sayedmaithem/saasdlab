export const dynamic = "force-dynamic";

import { CaseDetail } from "@/components/cases/case-detail";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getCaseDetail } from "@/lib/data/cases";
import { canViewFinancials } from "@/lib/permissions";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRouteAccess("/cases");
  const { id } = await params;
  const canViewFinance = canViewFinancials(session.roles);
  const item = await getCaseDetail(session, id, canViewFinance);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/cases"
      eyebrow="Cases"
      title={`${item.caseNumber} — ${item.patientName}`}
      cloudStatus="connected"
    >
      <CaseDetail item={item} canViewFinance={canViewFinance} />
    </AppShell>
  );
}
