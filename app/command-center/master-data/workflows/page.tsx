export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { WorkflowManager } from "@/components/master-data/workflow-manager";
import { getLabWorkflowTemplates, getLabWorkflowSummary } from "@/lib/data/workflows";
import { hasRole } from "@/lib/permissions";

export default async function WorkflowsPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();

  const [templates, summary] = await Promise.all([
    getLabWorkflowTemplates(),
    getLabWorkflowSummary(),
  ]);

  const canManage = hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"]);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Master Data"
      title="Workflow Engine"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />
        <WorkflowManager
          templates={templates}
          summary={summary}
          canManage={canManage}
        />
      </div>
    </AppShell>
  );
}
