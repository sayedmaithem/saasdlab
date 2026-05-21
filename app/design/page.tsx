export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { DesignQueue } from "@/components/design/design-queue";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDesignQueueData } from "@/lib/data/design";

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
      <DesignQueue items={data.items} totalByStage={data.totalByStage} />
    </AppShell>
  );
}
