export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { TechnicianWorkspace } from "@/components/production/technician-workspace";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getTechnicianWorkspaceData } from "@/lib/data/production";

export default async function TechnicianWorkspacePage() {
  const session = await requireRouteAccess("/technicians/workspace");
  const data = await getTechnicianWorkspaceData(session);

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/technicians">
      <TechnicianWorkspace data={data} />
    </AppShell>
  );
}
