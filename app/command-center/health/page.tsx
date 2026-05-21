export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { StatusCard } from "@/components/command-center/status-card";
import { getBackendHealth } from "@/lib/data/command-center";

export default async function HealthPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const health = await getBackendHealth();

  return (
    <AppShell
      labName={isPreview ? "Preview Lab" : "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="Backend Health"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />

        <div>
          <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
            Local backend checks — migration files, environment configuration, build mode.
            Live database connectivity checks require Supabase to be connected.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatusCard
            title="Database migrations"
            value={`${health.migrationCount} files`}
            status={health.migrationCount >= 10 ? "ok" : "warning"}
            detail={`Found in supabase/migrations/`}
          />
          <StatusCard
            title=".env.example"
            value={health.hasEnvExample ? "Present" : "Missing"}
            status={health.hasEnvExample ? "ok" : "warning"}
            detail={
              health.hasEnvExample
                ? "Env key reference exists at root"
                : "Create .env.example with all required keys (no values)"
            }
          />
          <StatusCard
            title="tsconfig.tsbuildinfo"
            value={health.hasTsBuildInfo ? "Tracked (issue)" : "Not tracked"}
            status={health.hasTsBuildInfo ? "warning" : "ok"}
            detail={
              health.hasTsBuildInfo
                ? "Should be in .gitignore — finding L1"
                : "Not in repository — correct"
            }
          />
          <StatusCard
            title="Preview mode"
            value={health.isPreview ? "Active" : "Inactive"}
            status={health.isPreview ? "warning" : "ok"}
            detail={
              health.isPreview
                ? "Running without Supabase — hardcoded lab_owner session"
                : "Supabase connected — real auth active"
            }
          />
          <StatusCard
            title="NODE_ENV"
            value={health.nodeEnv}
            status={health.nodeEnv === "production" ? "ok" : health.nodeEnv === "development" ? "ok" : "warning"}
            detail="Current runtime environment"
          />
          <StatusCard
            title="Live DB health"
            value="Not checked"
            status="placeholder"
            placeholderLabel="Requires Supabase connection — Phase 3"
          />
        </div>
      </div>
    </AppShell>
  );
}
