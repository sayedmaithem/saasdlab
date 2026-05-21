export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { ProductionBoard } from "@/components/production/production-board";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { getProductionBoardData } from "@/lib/data/production";
import { getLabWorkflowSummary } from "@/lib/data/workflows";
import { canManageProductionBoard } from "@/lib/production/stage-rules";

export default async function ProductionPage() {
  const session = await requireRouteAccess("/production");
  const isPreview = canUsePreviewAuth();

  const [data, workflowSummary] = await Promise.all([
    getProductionBoardData(session),
    getLabWorkflowSummary(),
  ]);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/production"
      eyebrow="Lab Operations"
      title="Production Board"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <ProductionBoard
        data={data}
        canManageBoard={canManageProductionBoard(session.roles)}
        hasCustomWorkflow={workflowSummary.hasCustomWorkflows}
        defaultWorkflowName={workflowSummary.defaultTemplate?.name ?? null}
      />
    </AppShell>
  );
}
