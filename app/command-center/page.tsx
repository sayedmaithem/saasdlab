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
import { getSystemReadiness, getCloudStatus } from "@/lib/data/command-center";
import { calculateLaunchReadiness } from "@/lib/command-center/launch-checklist";
import { getTopUrgentTasks } from "@/lib/command-center/system-tasks";
import { ClientMotionWrapper, MotionSection } from "@/components/command-center/client-motion-wrapper";

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
    >
      <div className="fixed inset-0 -z-10 bg-aurora opacity-20 pointer-events-none" />
      <ClientMotionWrapper className="space-y-10 relative z-10">
        <MotionSection>
          <CcNav />
        </MotionSection>

        {isPreview && (
          <MotionSection>
            <div className="flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-5 text-amber-950 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:text-amber-100">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                <FileWarning className="size-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight">Supabase not configured — preview mode active</p>
                <p className="mt-1.5 text-sm leading-relaxed text-amber-800/80 dark:text-amber-200/80">
                  Set{" "}
                  <code className="rounded-md bg-amber-500/20 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    NEXT_PUBLIC_SUPABASE_URL
                  </code>{" "}
                  and{" "}
                  <code className="rounded-md bg-amber-500/20 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>{" "}
                  in{" "}
                  <code className="rounded-md bg-amber-500/20 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-900 dark:text-amber-200">.env.local</code>{" "}
                  to enable live cloud checks and real user management.
                </p>
              </div>
            </div>
          </MotionSection>
        )}

        {/* Identity & Access quick panel */}
        <MotionSection>
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Identity &amp; access
            </h2>
            <Link href="/command-center/users" className="text-xs font-medium text-primary transition-colors hover:text-primary/80">
              Manage users &rarr;
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Admin key */}
            <div className={`glass flex items-start gap-4 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${adminKeyConfigured ? "glow-primary border-primary/20 bg-primary/5" : "border-warning/30 bg-warning/5"}`}>
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${adminKeyConfigured ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"}`}>
                <KeyRound className="size-5" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold tracking-tight ${adminKeyConfigured ? "text-primary-foreground" : "text-warning-foreground"}`}>
                  Admin key{adminKeyConfigured ? " configured" : " missing"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {adminKeyConfigured ? "In-app user creation enabled" : "Add SUPABASE_SERVICE_ROLE_KEY to .env.local"}
                </p>
              </div>
            </div>

            {/* Email provider */}
            <div className={`glass flex items-start gap-4 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${emailProviderConfigured ? "glow-primary border-primary/20 bg-primary/5" : "border-warning/30 bg-warning/5"}`}>
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${emailProviderConfigured ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning"}`}>
                <Mail className="size-5" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold tracking-tight ${emailProviderConfigured ? "text-primary-foreground" : "text-warning-foreground"}`}>
                  Email provider{emailProviderConfigured ? " configured" : " missing"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {emailProviderConfigured ? "Invite emails & password reset enabled" : "Add RESEND_API_KEY + EMAIL_FROM to enable email invites"}
                </p>
              </div>
            </div>

            {/* Quick link */}
            <Link
              href="/command-center/users/new"
              className="glass group flex items-start gap-4 rounded-2xl border-dashed p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:glow-primary"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors group-hover:bg-primary/20 group-hover:text-primary">
                <Users className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">Create portal user</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Technician · Doctor · Accountant</p>
              </div>
              <ArrowRight className="mt-2.5 size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          </div>
        </MotionSection>

        {/* Finance quick panel */}
        <MotionSection>
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Finance
            </h2>
            <Link href="/command-center/finance" className="text-xs font-medium text-primary transition-colors hover:text-primary/80">
              Finance overview &rarr;
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/command-center/finance"
              className="glass group flex items-start gap-4 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:glow-primary"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <DollarSign className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">Finance command</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Revenue, unpaid balances, overdue alerts</p>
              </div>
              <ArrowRight className="mt-2.5 size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
            <Link
              href="/finance"
              className="glass group flex items-start gap-4 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:glow-primary"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <DollarSign className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">Invoices</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Create and manage invoices</p>
              </div>
              <ArrowRight className="mt-2.5 size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
            <Link
              href="/payments"
              className="glass group flex items-start gap-4 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:glow-primary"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <DollarSign className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">Payments</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Record and track payments</p>
              </div>
              <ArrowRight className="mt-2.5 size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          </div>
        </MotionSection>

        {/* Launch readiness */}
        <MotionSection>
          <LaunchReadinessCard readiness={launchReadiness} />
        </MotionSection>

        {/* System readiness score */}
        <MotionSection>
          <h2 className="mb-4 px-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            System readiness
          </h2>
          <ReadinessScorePanel readiness={readiness} />
        </MotionSection>

        {/* Top urgent tasks */}
        {topTasks.length > 0 && (
          <MotionSection>
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Top urgent tasks
              </h2>
              <Link
                href="/command-center/tasks"
                className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                All tasks &rarr;
              </Link>
            </div>
            <div className="glass overflow-hidden rounded-2xl">
              <TopTasks tasks={topTasks} />
            </div>
          </MotionSection>
        )}

        {/* CRM Operating Map */}
        <MotionSection>
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              CRM operating map
            </h2>
          </div>
          <div className="glass overflow-hidden rounded-2xl p-2 glow-primary">
            <CrmOperatingMap />
          </div>
        </MotionSection>

        {/* Cloud / service status */}
        <MotionSection>
          <h2 className="mb-4 px-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
            Service status
          </h2>
          <SystemStatusGrid cloudStatus={cloudStatus} />
        </MotionSection>
      </ClientMotionWrapper>
    </AppShell>
  );
}
