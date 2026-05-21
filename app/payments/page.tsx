export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { PaymentsDashboard } from "@/components/finance/payments-dashboard";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getFinanceDashboard } from "@/lib/data/finance";

export default async function PaymentsPage() {
  const session = await requireRouteAccess("/payments");
  const data = await getFinanceDashboard(session);

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/payments">
      <PaymentsDashboard doctors={data.doctors} summary={data.summary} />
    </AppShell>
  );
}
