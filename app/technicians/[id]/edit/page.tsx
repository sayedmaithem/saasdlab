export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { TechnicianForm } from "@/components/technicians/technician-form";
import { TechnicianPortalAccountSection } from "@/components/technicians/portal-account-section";
import { TechnicianMatrix } from "@/components/technicians/technician-matrix";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { requireRouteAccess } from "@/lib/auth/guards";
import { hasRole } from "@/lib/permissions";
import { getTechnicianById } from "@/lib/data/technicians";
import {
  grantTechnicianStageAction,
  revokeTechnicianStageAction,
} from "@/app/actions/technicians";
import { stageLabels } from "@/lib/constants/workflow";

export default async function EditTechnicianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRouteAccess("/technicians");
  const canManage = hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"]);

  if (!canManage) redirect("/unauthorized");

  const { id } = await params;
  const technician = await getTechnicianById(session, id);

  if (!technician) notFound();

  const canLinkAccounts = hasRole(session.roles, ["super_admin", "lab_owner"]);

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/technicians">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Lab team</p>
          <h2 className="text-2xl font-semibold">Edit technician</h2>
        </div>
        <Button asChild variant="outline">
          <Link href="/technicians">
            <ArrowLeft aria-hidden="true" />
            Back to technicians
          </Link>
        </Button>
      </div>
      <div className="max-w-2xl space-y-6">
        <TechnicianForm technician={technician} />
        <TechnicianPortalAccountSection
          technicianId={technician.id}
          profileId={technician.profileId}
          canManage={canLinkAccounts}
        />
        {/* Stage permission matrix — built from current skills list */}
        <TechnicianMatrix
          technicianId={technician.id}
          permissions={technician.skills.map((skill) => ({
            id: `${technician.id}-${skill.skill}`,
            stage_id: skill.skill,
            stage_key: skill.skill,
            stage_name:
              stageLabels[skill.skill as keyof typeof stageLabels] ??
              skill.skill.replaceAll("_", " "),
            can_work: true,
            can_move_from: false,
            can_move_to: false,
          }))}
          canManage={canManage}
          onGrant={async (tId, stageKey) => {
            "use server";
            return grantTechnicianStageAction(tId, stageKey);
          }}
          onRevoke={async (permId) => {
            "use server";
            // permId in fixed-enum mode is `${technicianId}-${stageKey}`
            const stageKey = permId.split("-").slice(1).join("-");
            return revokeTechnicianStageAction(technician.id, stageKey);
          }}
        />
      </div>
    </AppShell>
  );
}
