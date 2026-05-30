"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createInvoiceAction } from "@/app/actions/finance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/finance/money";
import type { FinanceSummary, InvoiceListItem } from "@/lib/data/finance";

function statusTone(status: string) {
  if (status === "paid") return "green" as const;
  if (status === "overdue" || status === "cancelled") return "red" as const;
  if (status === "partially_paid") return "amber" as const;
  return "blue" as const;
}

export function InvoicesDashboard({
  invoices,
  doctors,
  cases,
  summary,
  showCreate = false,
}: {
  invoices: InvoiceListItem[];
  doctors: Array<{ id: string; name: string }>;
  cases: Array<{ id: string; label: string; doctorId: string; clinicId: string | null; workType: string; material: string | null; units: number; totalPrice: number }>;
  summary: FinanceSummary;
  showCreate?: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const selectedCase = cases.find((item) => item.id === selectedCaseId);
  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedCase?.doctorId);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createInvoiceAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Finance</p>
          <h1 className="text-2xl font-semibold">{showCreate ? "Create invoice" : "Invoices"}</h1>
        </div>
        {!showCreate ? (
          <Button asChild><Link href="/invoices/new">New invoice</Link></Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>Revenue month</CardTitle></CardHeader><CardContent className="text-2xl font-semibold tabular-nums" data-price="">{formatMoney(summary.revenueThisMonth)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total unpaid</CardTitle></CardHeader><CardContent className="text-2xl font-semibold tabular-nums" data-price="">{formatMoney(summary.totalUnpaid)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Overdue</CardTitle></CardHeader><CardContent className="text-2xl font-semibold tabular-nums" data-count="">{summary.overdueInvoices}</CardContent></Card>
        <Card><CardHeader><CardTitle>Payments month</CardTitle></CardHeader><CardContent className="text-2xl font-semibold tabular-nums" data-price="">{formatMoney(summary.paymentsThisMonth)}</CardContent></Card>
      </div>

      {showCreate ? (
        <Card>
          <CardHeader><CardTitle>Generate invoice from case</CardTitle></CardHeader>
          <CardContent>
            <form action={submit} className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="caseId">Case</Label>
                <Select id="caseId" name="caseId" value={selectedCaseId} onChange={(event) => setSelectedCaseId(event.target.value)} required>
                  {cases.map((item) => <option key={item.id} value={item.id}>{item.label} / {item.workType}</option>)}
                </Select>
              </div>
              <input type="hidden" name="doctorId" value={selectedCase?.doctorId ?? ""} />
              <input type="hidden" name="clinicId" value={selectedCase?.clinicId ?? ""} />
              <Input name="description" defaultValue={selectedCase ? `${selectedCase.workType} for ${selectedCase.label}` : ""} placeholder="Description" required />
              <Input name="workType" defaultValue={selectedCase?.workType ?? ""} placeholder="Work type" required />
              <Input name="material" defaultValue={selectedCase?.material ?? ""} placeholder="Material" />
              <Input name="units" type="number" min="0.01" step="0.01" defaultValue={selectedCase?.units ?? 1} placeholder="Units" required />
              <Input name="unitPrice" type="number" min="0" step="0.01" defaultValue={selectedCase ? Math.max(selectedCase.totalPrice / selectedCase.units, 0) : 0} placeholder="Unit price" required />
              <Input name="discount" type="number" min="0" step="0.01" defaultValue="0" placeholder="Discount" />
              <Input name="issueDate" type="date" />
              <Input name="dueDate" type="date" />
              <Textarea name="notes" placeholder="Invoice notes" className="md:col-span-2" />
              <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                <p className="text-sm text-muted-foreground">
                  Doctor: {selectedDoctor?.name ?? "Select a case"} {message ? `/ ${message}` : ""}
                </p>
                <Button type="submit" disabled={isPending || !selectedCase}>Create invoice</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Invoice list</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 font-medium">Invoice</th>
                <th className="py-3 font-medium">Doctor</th>
                <th className="py-3 font-medium">Case</th>
                <th className="py-3 font-medium">Issue</th>
                <th className="py-3 font-medium">Due</th>
                <th className="py-3 font-medium">Total</th>
                <th className="py-3 font-medium">Paid</th>
                <th className="py-3 font-medium">Remaining</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b last:border-0">
                  <td className="py-3"><Link href={`/invoices/${invoice.id}`} className="font-semibold hover:underline">{invoice.invoiceNumber}</Link></td>
                  <td className="py-3">{invoice.doctorName}</td>
                  <td className="py-3">{invoice.caseNumber ?? "-"}</td>
                  <td className="py-3">{invoice.issueDate ?? "-"}</td>
                  <td className="py-3">{invoice.dueDate ?? "-"}</td>
                  <td className="py-3 tabular-nums">{formatMoney(invoice.total)}</td>
                  <td className="py-3 tabular-nums">{formatMoney(invoice.paidAmount)}</td>
                  <td className="py-3 tabular-nums">{formatMoney(invoice.remainingBalance)}</td>
                  <td className="py-3"><Badge tone={statusTone(invoice.status)}>{invoice.status.replaceAll("_", " ")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No invoices yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
