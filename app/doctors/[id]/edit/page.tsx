export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { EditDoctorForm } from "@/components/doctors/edit-doctor-form";
import { DoctorPortalAccountSection } from "@/components/doctors/portal-account-section";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorForEdit } from "@/lib/data/doctors";
import { getPriceGroups } from "@/lib/data/master-data";
import { hasRole } from "@/lib/permissions";

export default async function EditDoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRouteAccess("/doctors");
  const canEdit = hasRole(session.roles, [
    "super_admin",
    "lab_owner",
    "lab_manager",
    "reception",
  ]);

  if (!canEdit) {
    redirect("/unauthorized");
  }

  const { id } = await params;
  const [doctor, priceGroups] = await Promise.all([
    getDoctorForEdit(session, id),
    getPriceGroups(session),
  ]);

  const canLinkAccounts = hasRole(session.roles, ["super_admin", "lab_owner"]);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/doctors"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Doctor management</p>
          <h2 className="text-2xl font-semibold">Edit doctor</h2>
        </div>
        <Button asChild variant="outline">
          <Link href={`/doctors/${id}`}>
            <ArrowLeft aria-hidden="true" />
            Back to profile
          </Link>
        </Button>
      </div>
      <div className="max-w-2xl space-y-6">
        <EditDoctorForm doctor={doctor} priceGroups={priceGroups} />
        <DoctorPortalAccountSection
          doctorId={id}
          profileId={doctor.profileId ?? null}
          canManage={canLinkAccounts}
        />
      </div>
    </AppShell>
  );
}
