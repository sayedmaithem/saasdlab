export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { DesignQueue } from "@/components/design/design-queue";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDesignQueueData } from "@/lib/data/design";
import { ClientMotionWrapper, MotionSection } from "@/components/command-center/client-motion-wrapper";

export default async function DesignPage() {
  const session = await requireRouteAccess("/design");
  const data = await getDesignQueueData(session);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/design"
      eyebrow="Lab Operations"
      title="Design Queue"
      cloudStatus="connected"
    >
      <div className="fixed inset-0 -z-10 bg-aurora opacity-20 pointer-events-none" />
      <ClientMotionWrapper className="relative z-10 space-y-6">
        <MotionSection className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Lab Operations
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gradient mt-1">Design Queue</h2>
          </div>
        </MotionSection>

        <MotionSection>
          <DesignQueue items={data.items} totalByStage={data.totalByStage} />
        </MotionSection>
      </ClientMotionWrapper>
    </AppShell>
  );
}
