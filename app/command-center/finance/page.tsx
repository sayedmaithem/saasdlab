export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  DollarSign,
  AlertCircle,
  TrendingUp,
  Clock,
  Receipt,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFinanceDashboard } from "@/lib/data/finance";
import { canViewFinancials } from "@/lib/permissions";
import { formatMoney } from "@/lib/finance/money";

export default async function FinanceCommandPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const canViewFinance = canViewFinancials(session.roles);

  // Gate: redirect-like — render access denied if no finance permission
  if (!canViewFinance) {
    return (
      <AppShell
        labName={session.labName ?? "LabFlow"}
        session={session}
        activeHref="/command-center"
        eyebrow="Command Center"
        title="Finance"
        cloudStatus={isPreview ? "preview" : "connected"}
      >
        <div className="space-y-6">
          <CcNav />
          <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 py-16 text-center">
            <ShieldAlert className="size-10 text-destructive/60" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">Access restricted</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                The Finance Command Center is only visible to lab owners, managers, and
                accountants. Contact your administrator to request access.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const { summary, invoices } = await getFinanceDashboard(session);

  // Most urgent unpaid invoices (top 5)
  const urgentUnpaid = invoices
    .filter((inv) => inv.status !== "paid" && inv.remainingBalance > 0)
    .sort((a, b) => b.remainingBalance - a.remainingBalance)
    .slice(0, 5);

  const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="Finance"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-8">
        <CcNav />

        {/* ── KPI tiles ──────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="size-5 text-green-700 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Revenue this month
                  </p>
                  <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400">
                    {formatMoney(summary.revenueThisMonth)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Invoices issued in current month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <DollarSign className="size-5 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Collected this month
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {formatMoney(summary.paymentsThisMonth)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Payments received (cash basis)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="size-5 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total outstanding
                  </p>
                  <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {formatMoney(summary.totalUnpaid)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Remaining balance across all invoices
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-9 items-center justify-center rounded-md ${
                    summary.overdueInvoices > 0
                      ? "bg-red-100 dark:bg-red-900/30"
                      : "bg-muted"
                  }`}
                >
                  <AlertCircle
                    className={`size-5 ${
                      summary.overdueInvoices > 0
                        ? "text-red-700 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Overdue invoices
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      summary.overdueInvoices > 0
                        ? "text-red-700 dark:text-red-400"
                        : "text-foreground"
                    }`}
                  >
                    {summary.overdueInvoices}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {summary.overdueInvoices === 0
                      ? "All invoices on track"
                      : "Require immediate follow-up"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Two-column lower section ────────────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Top revenue doctors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-muted-foreground" />
                Top doctors by revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.topDoctorsByRevenue.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No invoice data yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.topDoctorsByRevenue.map((row, i) => (
                    <div key={row.doctor} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-medium text-muted-foreground">
                        {i + 1}.
                      </span>
                      <span className="flex-1 text-sm font-medium truncate">
                        {row.doctor}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMoney(row.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Highest outstanding balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-muted-foreground" />
                Highest outstanding balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.topDoctorsByUnpaid.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No outstanding balances.
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.topDoctorsByUnpaid.map((row, i) => (
                    <div key={row.doctor} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-medium text-muted-foreground">
                        {i + 1}.
                      </span>
                      <span className="flex-1 text-sm font-medium truncate">
                        {row.doctor}
                      </span>
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                        {formatMoney(row.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Overdue invoices alert ──────────────────────────────── */}
        {overdueInvoices.length > 0 && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
                <AlertCircle className="size-4" />
                Overdue invoices requiring action ({overdueInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueInvoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 px-3 py-2"
                >
                  <Badge tone="red">{inv.invoiceNumber}</Badge>
                  <span className="flex-1 text-sm font-medium">{inv.doctorName}</span>
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400 tabular-nums">
                    {formatMoney(inv.remainingBalance)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Due {inv.dueDate ?? "no date"}
                  </span>
                </div>
              ))}
              {overdueInvoices.length > 5 && (
                <p className="text-xs text-muted-foreground pt-1">
                  +{overdueInvoices.length - 5} more overdue invoices
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Largest unpaid (not overdue) ────────────────────────── */}
        {urgentUnpaid.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="size-4 text-muted-foreground" />
                Largest open balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[540px]">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-2 pr-4 text-left font-medium">Invoice</th>
                      <th className="py-2 pr-4 text-left font-medium">Doctor</th>
                      <th className="py-2 pr-4 text-left font-medium">Total</th>
                      <th className="py-2 pr-4 text-left font-medium">Remaining</th>
                      <th className="py-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgentUnpaid.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{inv.invoiceNumber}</td>
                        <td className="py-2 pr-4">{inv.doctorName}</td>
                        <td className="py-2 pr-4 tabular-nums">{formatMoney(inv.total)}</td>
                        <td className="py-2 pr-4 font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                          {formatMoney(inv.remainingBalance)}
                        </td>
                        <td className="py-2">
                          <Badge
                            tone={
                              inv.status === "overdue"
                                ? "red"
                                : inv.status === "partially_paid"
                                ? "amber"
                                : "neutral"
                            }
                          >
                            {inv.status.replaceAll("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Quick links ─────────────────────────────────────────── */}
        <div className="rounded-lg border bg-muted/30 p-5 space-y-3">
          <p className="text-sm font-semibold">Finance quick links</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/finance"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              All invoices <ArrowRight className="size-3" />
            </Link>
            <Link
              href="/payments"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Payments log <ArrowRight className="size-3" />
            </Link>
            <Link
              href="/finance/statements"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Doctor statements <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
