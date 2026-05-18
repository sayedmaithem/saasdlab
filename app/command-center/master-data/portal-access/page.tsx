export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { PortalAccessManager } from "@/components/master-data/portal-access-manager";
import { getPortalAccessTemplates } from "@/lib/data/master-data";
import { hasRole } from "@/lib/permissions";

export default async function PortalAccessPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const templates = await getPortalAccessTemplates(session);
  const canManage = hasRole(session.roles, ["super_admin", "lab_owner"]);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Master Data"
      title="Portal Access"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />

        {/* Quick-link to the live users page */}
        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p className="font-medium text-foreground mb-1">Looking for active portal accounts?</p>
          <p className="text-muted-foreground">
            Manage live user accounts (link/revoke access) from the{" "}
            <Link
              href="/command-center/users"
              className="font-medium text-primary hover:underline"
            >
              Users page →
            </Link>
          </p>
          <p className="mt-2 text-muted-foreground">
            To link a new account: edit a{" "}
            <Link href="/technicians" className="font-medium text-primary hover:underline">
              technician
            </Link>{" "}
            or{" "}
            <Link href="/doctors" className="font-medium text-primary hover:underline">
              doctor
            </Link>
            , scroll to the &quot;Portal account&quot; section, and paste the Supabase User UID.
          </p>
        </div>

        <PortalAccessManager templates={templates} canManage={canManage} />
      </div>
    </AppShell>
  );
}
