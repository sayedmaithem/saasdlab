export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { SetupWizard } from "@/components/command-center/setup-wizard";

export default async function SetupPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();

  return (
    <AppShell
      labName={isPreview ? "Preview Lab" : "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="Setup Wizard"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />

        <div>
          <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
            Step-by-step checklist to get LabFlow production-ready. Complete these steps in order
            before going live with a real dental lab.
          </p>
        </div>

        <SetupWizard />
      </div>
    </AppShell>
  );
}
