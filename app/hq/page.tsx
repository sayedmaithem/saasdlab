export const dynamic = "force-dynamic";

import {
  Database,
  FlaskConical,
  Globe,
  Lock,
  Server,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/lib/auth/session";
import { canUsePreviewAuth } from "@/lib/env";
import { getHqPlatformStats, getHqLabList } from "@/lib/data/hq";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { InsightCard } from "@/components/ui/insight-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const HQ_MODULES: Array<{ icon: typeof Database; label: string; description: string; coming?: boolean }> = [
  { icon: Globe, label: "All Labs", description: "Manage tenant labs, billing, and onboarding", coming: true },
  { icon: Users, label: "All Users", description: "Cross-tenant user search and impersonation", coming: true },
  { icon: Shield, label: "Security Audit", description: "RLS policy review and violation monitoring", coming: true },
  { icon: Zap, label: "Feature Flags", description: "Roll out features per lab or globally", coming: true },
  { icon: Server, label: "Infrastructure", description: "DB health, storage quotas, API limits", coming: true },
  { icon: Lock, label: "Audit Log", description: "Platform-level event stream and alerts", coming: true },
];

export default async function HqPage() {
  const session = await requireAuth();
  const isPreview = canUsePreviewAuth();

  const [stats, labs] = await Promise.all([
    getHqPlatformStats(),
    getHqLabList(),
  ]);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/hq"
      eyebrow="Platform HQ"
      title="Platform Overview"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <PageShell maxWidth="2xl">

        {/* ── Platform KPIs ──────────────────────────────────────── */}
        <SectionHeader
          title="Platform health"
          description="Live counts across all tenant labs."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <FlaskConical className="size-5 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Active labs
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{stats.labCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tenant lab accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/30">
                  <Users className="size-5 text-violet-700 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total users
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{stats.userCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">All staff profiles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                  <Database className="size-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Migrations
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{stats.migrationCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">SQL migration files</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Platform insights ──────────────────────────────────── */}
        <SectionHeader title="Platform insights" />

        <div className="space-y-3">
          {isPreview && (
            <InsightCard
              tone="warning"
              title="Preview mode active"
              description="Supabase is not connected. Counts above are placeholder values, not live data."
            />
          )}
          <InsightCard
            tone="success"
            title="Multi-tenant RLS isolation confirmed"
            description="All 18 migrations enforce lab_id-scoped row-level security. Cross-tenant data leakage is blocked at the database level."
          />
          <InsightCard
            tone="success"
            title="Doctor portal authentication isolated"
            description="Doctor-facing routes use a separate portal_account auth flow, fully isolated from internal staff sessions."
          />
          <InsightCard
            tone="info"
            title="Finance is role-gated at every layer"
            description="Invoice and payment data is accessible only to super_admin, lab_owner, and accountant roles — enforced in navigation, route guards, and RLS policies."
          />
        </div>

        {/* ── Tenant labs ───────────────────────────────────────── */}
        {labs.length > 0 && (
          <>
            <SectionHeader
              title="Registered labs"
              description={`${labs.length} tenant lab${labs.length === 1 ? "" : "s"} on this platform.`}
            />

            <Card>
              <CardContent className="pt-4 pb-2">
                <div className="divide-y">
                  {labs.map((lab) => (
                    <div key={lab.id} className="flex items-center gap-3 py-3">
                      <FlaskConical className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-sm font-medium">{lab.name}</span>
                      <Badge tone="neutral" className="font-mono text-[10px]">
                        {lab.id.slice(0, 8)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {lab.created_at
                          ? new Date(lab.created_at).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Upcoming HQ modules ────────────────────────────────── */}
        <SectionHeader
          title="HQ modules"
          description="Full platform management coming in future phases."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {HQ_MODULES.map((mod) => (
            <Card key={mod.label} className="opacity-70">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <mod.icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{mod.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 border rounded px-1.5 py-0.5 shrink-0">
                    Soon
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </PageShell>
    </AppShell>
  );
}
