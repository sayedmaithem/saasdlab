export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { DoctorStatement } from "@/components/finance/doctor-statement";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorPortalData } from "@/lib/data/doctor-portal";
import { getDoctorStatement } from "@/lib/data/finance";

export default async function DoctorPortalStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireRouteAccess("/doctor-portal");
  const portal = await getDoctorPortalData(session);
  const filters = await searchParams;
  const statement = portal.doctorId
    ? await getDoctorStatement(session, portal.doctorId, filters)
    : { doctorName: portal.doctorName, rows: [], remainingBalance: 0 };

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/doctor-portal">
      <DoctorStatement
        doctorName={statement.doctorName}
        rows={statement.rows}
        remainingBalance={statement.remainingBalance}
      />
    </AppShell>
  );
}
