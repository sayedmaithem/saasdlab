"use client";

import { useState, useTransition } from "react";
import { recordPaymentAction } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/finance/money";
import type { FinanceSummary } from "@/lib/data/finance";

export function PaymentsDashboard({
  doctors,
  summary,
}: {
  doctors: Array<{ id: string; name: string }>;
  summary: FinanceSummary;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await recordPaymentAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Finance</p>
        <h1 className="text-2xl font-semibold">Payments</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Payments month</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(summary.paymentsThisMonth)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total unpaid</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(summary.totalUnpaid)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Overdue invoices</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{summary.overdueInvoices}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Record payment</CardTitle></CardHeader>
        <CardContent>
          <form action={submit} className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="doctorId">Doctor</Label>
              <Select id="doctorId" name="doctorId" required>
                <option value="">Select doctor</option>
                {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="method">Method</Label>
              <Select id="method" name="method" defaultValue="cash">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paidAt">Date</Label>
              <Input id="paidAt" name="paidAt" type="date" />
            </div>
            <Textarea name="notes" placeholder="Payment notes" className="md:col-span-2" />
            <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
              <p className="text-sm text-muted-foreground">
                Default allocation applies payment to oldest unpaid invoices first. {message ?? ""}
              </p>
              <Button type="submit" disabled={isPending}>Record payment</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
