export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { RoleMatrix } from "@/components/command-center/role-matrix";
import { PermissionGroups } from "@/components/command-center/permission-groups";
import { PortalRoleSummary } from "@/components/users/portal-role-summary";

export default async function RolesPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();

  return (
    <AppShell
      labName={isPreview ? "Preview Lab" : "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="Roles & Access"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />

        <div>
          <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
            Permission matrix for all 8 system roles across 13 capability areas. Use this to
            verify that role boundaries match your lab&apos;s access policy before going live.
          </p>
        </div>

        <PermissionGroups />

        <div className="border-t pt-6">
          <PortalRoleSummary />
        </div>

        <div className="border-t pt-6">
          <p className="mb-4 text-sm font-semibold">Full permission matrix</p>
          <RoleMatrix />
        </div>
      </div>
    </AppShell>
  );
}
