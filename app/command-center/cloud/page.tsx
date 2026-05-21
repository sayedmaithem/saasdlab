export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { SystemStatusGrid } from "@/components/command-center/system-status-grid";
import { StatusCard } from "@/components/command-center/status-card";
import { getCloudStatus } from "@/lib/data/command-center";

export default async function CloudPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const cloud = getCloudStatus();

  return (
    <AppShell
      labName={isPreview ? "Preview Lab" : "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="Cloud Manager"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />

        <div>
          <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
            Connection status for Supabase services, storage, and external integrations.
            Advanced checks (RLS audit, bucket policies, Vercel webhook) are planned for Phase 3.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatusCard
            title="Overall cloud status"
            value={
              cloud.overall === "connected"
                ? "Connected"
                : cloud.overall === "preview"
                ? "Preview mode"
                : "Offline"
            }
            status={
              cloud.overall === "connected"
                ? "ok"
                : cloud.overall === "preview"
                ? "warning"
                : "error"
            }
            detail={
              cloud.overall === "connected"
                ? "Supabase environment variables are set"
                : "Connect Supabase to enable live cloud services"
            }
          />
          <StatusCard
            title="RLS audit"
            value="Not run"
            status="placeholder"
            placeholderLabel="Automated RLS audit — Phase 3"
          />
          <StatusCard
            title="Vercel integration"
            value="Not wired"
            status="placeholder"
            placeholderLabel="Deployment webhook — Phase 3"
          />
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Service status
          </h2>
          <SystemStatusGrid cloudStatus={cloud} />
        </section>
      </div>
    </AppShell>
  );
}
