export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  BadgeDollarSign,
  WalletCards,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  BarChart3,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFinanceDashboard } from "@/lib/data/finance";
import { formatMoney } from "@/lib/finance/money";

export default async function FinancePage() {
  const session = await requireRouteAccess("/finance");
  const isPreview = canUsePreviewAuth();

  let summary = null;
  if (!isPreview && session.activeLabId) {
    try {
      const data = await getFinanceDashboard(session);
      summary = data.summary;
    } catch {
      // Non-critical — falls back to null state
    }
  }

  const kpis = [
    {
      label: "Revenue this month",
      value: summary ? formatMoney(summary.revenueThisMonth) : "—",
      icon: TrendingUp,
      color: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-700 dark:text-emerald-400",
      href: "/reports",
    },
    {
      label: "Total unpaid",
      value: summary ? formatMoney(summary.totalUnpaid) : "—",
      icon: BadgeDollarSign,
      color: summary?.totalUnpaid ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted",
      iconColor: summary?.totalUnpaid ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground",
      href: "/invoices?status=unpaid",
    },
    {
      label: "Overdue invoices",
      value: summary ? String(summary.overdueInvoices) : "—",
      icon: AlertCircle,
      color: summary?.overdueInvoices ? "bg-red-100 dark:bg-red-900/30" : "bg-muted",
      iconColor: summary?.overdueInvoices ? "text-red-700 dark:text-red-400" : "text-muted-foreground",
      href: "/invoices?status=overdue",
    },
    {
      label: "Payments this month",
      value: summary ? formatMoney(summary.paymentsThisMonth) : "—",
      icon: WalletCards,
      color: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-700 dark:text-blue-400",
      href: "/payments",
    },
  ];

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/finance"
      eyebrow="Finance"
      title="Finance Overview"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <PageShell>

        {/* ── KPI strip ─────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link key={kpi.label} href={kpi.href}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${kpi.color}`}>
                        <Icon className={`size-5 ${kpi.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {kpi.label}
                        </p>
                        <p className="stat-xl mt-1">{kpi.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* ── Top doctors by revenue ──────────────────────────────────────── */}
        {summary && summary.topDoctorsByRevenue.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            {/* Revenue leaders */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-sm font-semibold mb-3">Top revenue — this month</p>
                <div className="space-y-2">
                  {summary.topDoctorsByRevenue.slice(0, 5).map((d) => (
                    <div key={d.doctor} className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground truncate">{d.doctor}</p>
                      <p className="text-sm font-semibold tabular-nums shrink-0 text-emerald-700 dark:text-emerald-400">
                        {formatMoney(d.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Unpaid leaders */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-sm font-semibold mb-3">Largest unpaid balances</p>
                <div className="space-y-2">
                  {summary.topDoctorsByUnpaid.slice(0, 5).map((d) => (
                    <div key={d.doctor} className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground truncate">{d.doctor}</p>
                      <p className="text-sm font-semibold tabular-nums shrink-0 text-amber-700 dark:text-amber-400">
                        {formatMoney(d.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Quick links ─────────────────────────────────────────────────── */}
        <SectionHeader title="Finance modules" />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              label: "Invoices",
              description: "Create, send, and track invoices",
              href: "/invoices",
              icon: BadgeDollarSign,
              action: { label: "New invoice", href: "/invoices/new" },
            },
            {
              label: "Payments",
              description: "Record and allocate received payments",
              href: "/payments",
              icon: WalletCards,
              action: null,
            },
            {
              label: "Doctor Statements",
              description: "Per-doctor account ledger",
              href: "/doctors",
              icon: TrendingUp,
              action: null,
            },
            {
              label: "Reports & Analytics",
              description: "Revenue trends, monthly summaries",
              href: "/reports",
              icon: BarChart3,
              action: null,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.href} className="hover:border-primary/40 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 pt-3 border-t">
                    <Link href={item.href} className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium">
                      Open <ArrowRight className="size-3" />
                    </Link>
                    {item.action && (
                      <Button asChild size="sm" variant="outline" className="ml-auto h-7 text-xs">
                        <Link href={item.action.href}>
                          <PlusCircle className="size-3" />
                          {item.action.label}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Suppliers placeholder ─────────────────────────────────────── */}
        <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-8 text-center">
          <p className="text-sm font-semibold text-muted-foreground">Supplier Accounts</p>
          <p className="mt-1 text-xs text-muted-foreground/70 max-w-sm mx-auto">
            Supplier expense tracking, purchase orders, and payables management is coming in Phase 12.
          </p>
        </div>

      </PageShell>
    </AppShell>
  );
}
