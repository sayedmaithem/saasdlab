export const dynamic = "force-dynamic";

import { NewDoctorForm } from "@/components/doctors/new-doctor-form";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorList } from "@/lib/data/doctors";
import { hasRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function NewDoctorPage() {
  const session = await requireRouteAccess("/doctors/new");

  if (!hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager", "reception"])) {
    redirect("/unauthorized");
  }

  const data = await getDoctorList(session, {});

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/doctors">
      <div className="mb-5">
        <p className="text-sm font-medium text-muted-foreground">
          Relationship management
        </p>
        <h2 className="text-2xl font-semibold">New doctor</h2>
      </div>
      <NewDoctorForm clinics={data.clinics} />
    </AppShell>
  );
}
