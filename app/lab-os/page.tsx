export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { SystemMap } from "@/components/lab-os/system-map";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
export default async function LabOsPage() {
  const session = await requireRouteAccess("/lab-os");
  const isPreview = canUsePreviewAuth();

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/lab-os"
      eyebrow="LabOS"
      title="System Map"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <PageShell>
        <SectionHeader
          title="LabFlow Operating System"
          description="Every module, workflow gate, and system area — your full operational picture in one view."
        />

        <SystemMap />
      </PageShell>
    </AppShell>
  );
}
