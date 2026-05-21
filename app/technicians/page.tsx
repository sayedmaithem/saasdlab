export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TechnicianList } from "@/components/technicians/technician-list";
import { requireRouteAccess } from "@/lib/auth/guards";
import { hasRole } from "@/lib/permissions";
import { getTechnicians } from "@/lib/data/technicians";

export default async function TechniciansPage() {
  const session = await requireRouteAccess("/technicians");

  // Technician role users must not see the management list.
  // They are redirected to their own first-class workspace.
  // Only managers (owner, manager, super_admin) access this page.
  const canManage = hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"]);
  if (!canManage) {
    redirect("/technicians/workspace");
  }

  const technicians = await getTechnicians(session);

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/technicians">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Lab team</p>
          <h2 className="text-2xl font-semibold">Technicians</h2>
        </div>
        <Link
          href="/technicians/workspace"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Technician workspace →
        </Link>
      </div>
      <div className="max-w-3xl">
        <TechnicianList technicians={technicians} canManage={canManage} />
      </div>
    </AppShell>
  );
}
