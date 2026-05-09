export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getInvoiceDetail } from "@/lib/data/finance";
import { formatMoney } from "@/lib/finance/money";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRouteAccess("/invoices");
  const { id } = await params;
  const invoice = await getInvoiceDetail(session, id);
  if (!invoice) notFound();

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/invoices">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{invoice.doctorName}</p>
            <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
          </div>
          <Badge tone={invoice.status === "paid" ? "green" : "amber"}>{invoice.status.replaceAll("_", " ")}</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle>Total</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(invoice.total)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Paid</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(invoice.paidAmount)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Remaining</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(invoice.remainingBalance)}</CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Invoice items</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {invoice.items.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-lg border p-3 text-sm md:grid-cols-5">
                <p className="font-semibold md:col-span-2">{item.description}</p>
                <p>{item.quantity} x {formatMoney(item.unitPrice)}</p>
                <p>Discount {formatMoney(item.discount)}</p>
                <p className="font-semibold">{formatMoney(item.total)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payments allocated</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {invoice.allocations.map((allocation) => (
              <p key={allocation.id} className="flex justify-between rounded-md border p-3">
                <span>{allocation.paidAt} / {allocation.method}</span>
                <span className="font-semibold">{formatMoney(allocation.amount)}</span>
              </p>
            ))}
            {invoice.allocations.length === 0 ? <p className="text-muted-foreground">No payments allocated yet.</p> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
