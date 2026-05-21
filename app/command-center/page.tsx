export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileWarning, KeyRound, Mail, Users, ArrowRight, DollarSign } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { hasEmailProviderEnv } from "@/lib/email/resend";
import { CcNav } from "@/components/command-center/cc-nav";
import { ReadinessScorePanel } from "@/components/command-center/readiness-score";
import { SystemStatusGrid } from "@/components/command-center/system-status-grid";
import { CrmOperatingMap } from "@/components/command-center/crm-operating-map";
import { LaunchReadinessCard } from "@/components/command-center/launch-readiness-card";
import { TopTasks } from "@/components/command-center/top-tasks";
import {
  getSystemReadiness,
  getCloudStatus,
} from "@/lib/data/command-center";
import { calculateLaunchReadiness } from "@/lib/command-center/launch-checklist";
import { getTopUrgentTasks } from "@/lib/command-center/system-tasks";

export default async function CommandCenterPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const adminKeyConfigured = hasSupabaseAdminEnv();
  const emailProviderConfigured = hasEmailProviderEnv();
  const readiness = getSystemReadiness();
  const cloudStatus = getCloudStatus();
  const launchReadiness = calculateLaunchReadiness();
  const topTasks = getTopUrgentTasks(5);

  return (
    <AppShell
      labName={isPreview ? "Preview Lab" : "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="System control"
      title="Command Center"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-8">
        <CcNav />

        {isPreview && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <FileWarning className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Supabase not configured — preview mode active</p>
              <p className="mt-1 text-sm leading-6">
                Set{" "}
                <code className="rounded bg-amber-100 px-1 font-mono text-xs">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>{" "}
                and{" "}
                <code className="rounded bg-amber-100 px-1 font-mono text-xs">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>{" "}
                in{" "}
                <code className="rounded bg-amber-100 px-1 font-mono text-xs">.env.local</code>{" "}
                to enable live cloud checks and real user management.
              </p>
            </div>
          </div>
        )}

        {/* Identity & Access quick panel */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Identity &amp; access
            </h2>
            <Link href="/command-center/users" className="text-xs text-muted-foreground underline hover:text-foreground">
              Manage users →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Admin key */}
            <div className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${adminKeyConfigured ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"}`}>
              <KeyRound className={`mt-0.5 size-4 shrink-0 ${adminKeyConfigured ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`} />
              <div className="min-w-0">
                <p className={`font-medium text-xs ${adminKeyConfigured ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300"}`}>
                  Admin key{adminKeyConfigured ? " configured" : " missing"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {adminKeyConfigured ? "In-app user creation enabled" : "Add SUPABASE_SERVICE_ROLE_KEY to .env.local"}
                </p>
              </div>
            </div>

            {/* Email provider */}
            <div className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${emailProviderConfigured ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"}`}>
              <Mail className={`mt-0.5 size-4 shrink-0 ${emailProviderConfigured ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`} />
              <div className="min-w-0">
                <p className={`font-medium text-xs ${emailProviderConfigured ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300"}`}>
                  Email provider{emailProviderConfigured ? " configured" : " missing"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {emailProviderConfigured ? "Invite emails & password reset enabled" : "Add RESEND_API_KEY + EMAIL_FROM to enable email invites"}
                </p>
              </div>
            </div>

            {/* Quick link */}
            <Link
              href="/command-center/users/new"
              className="flex items-center gap-3 rounded-lg border border-dashed p-3 text-sm hover:bg-muted/30 transition-colors group"
            >
              <Users className="size-4 text-muted-foreground group-hover:text-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-xs text-foreground">Create portal user</p>
                <p className="text-xs text-muted-foreground mt-0.5">Technician · Doctor · Accountant</p>
              </div>
              <ArrowRight className="ml-auto size-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </Link>
          </div>
        </section>

        {/* Finance quick panel */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Finance
            </h2>
            <Link href="/command-center/finance" className="text-xs text-muted-foreground underline hover:text-foreground">
              Finance overview →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/command-center/finance"
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/30 transition-colors group"
            >
              <DollarSign className="size-4 text-green-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-xs text-foreground">Finance command</p>
                <p className="text-xs text-muted-foreground mt-0.5">Revenue, unpaid balances, overdue alerts</p>
              </div>
              <ArrowRight className="ml-auto size-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </Link>
            <Link
              href="/finance"
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/30 transition-colors group"
            >
              <DollarSign className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-xs text-foreground">Invoices</p>
                <p className="text-xs text-muted-foreground mt-0.5">Create and manage invoices</p>
              </div>
              <ArrowRight className="ml-auto size-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </Link>
            <Link
              href="/payments"
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/30 transition-colors group"
            >
              <DollarSign className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-xs text-foreground">Payments</p>
                <p className="text-xs text-muted-foreground mt-0.5">Record and track payments</p>
              </div>
              <ArrowRight className="ml-auto size-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
            </Link>
          </div>
        </section>

        {/* Launch readiness */}
        <section>
          <LaunchReadinessCard readiness={launchReadiness} />
        </section>

        {/* System readiness score */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            System readiness
          </h2>
          <ReadinessScorePanel readiness={readiness} />
        </section>

        {/* Top urgent tasks */}
        {topTasks.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Top urgent tasks
              </h2>
              <Link
                href="/command-center/tasks"
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                All tasks →
              </Link>
            </div>
            <TopTasks tasks={topTasks} />
          </section>
        )}

        {/* CRM Operating Map */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              CRM operating map
            </h2>
          </div>
          <CrmOperatingMap />
        </section>

        {/* Cloud / service status */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Service status
          </h2>
          <SystemStatusGrid cloudStatus={cloudStatus} />
        </section>
      </div>
    </AppShell>
  );
}
