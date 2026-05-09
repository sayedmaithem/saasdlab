export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { InvoicesDashboard } from "@/components/finance/invoices-dashboard";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getFinanceDashboard } from "@/lib/data/finance";

export default async function NewInvoicePage() {
  const session = await requireRouteAccess("/invoices");
  const data = await getFinanceDashboard(session);

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/invoices">
      <InvoicesDashboard
        invoices={data.invoices}
        doctors={data.doctors}
        cases={data.cases}
        summary={data.summary}
        showCreate
      />
    </AppShell>
  );
}
