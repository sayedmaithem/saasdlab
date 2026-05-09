export const dynamic = "force-dynamic";

import Link from "next/link";
import { DoctorsTable } from "@/components/doctors/doctors-table";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorList } from "@/lib/data/doctors";
import { hasRole } from "@/lib/permissions";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; clinic?: string; status?: string }>;
}) {
  const session = await requireRouteAccess("/doctors");
  const params = await searchParams;
  const canCreate = hasRole(session.roles, [
    "super_admin",
    "lab_owner",
    "lab_manager",
    "reception",
  ]);
  const status =
    params.status === "active" ||
    params.status === "inactive" ||
    params.status === "vip"
      ? params.status
      : undefined;
  const data = await getDoctorList(session, {
    query: params.q,
    clinicId: params.clinic,
    status,
  });

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/doctors">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Relationship management
          </p>
          <h2 className="text-2xl font-semibold">Doctors</h2>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/doctors/new">New doctor</Link>
          </Button>
        ) : null}
      </div>
      <DoctorsTable
        doctors={data.doctors}
        clinics={data.clinics}
        query={params.q}
        clinicId={params.clinic}
        status={params.status}
      />
    </AppShell>
  );
}
