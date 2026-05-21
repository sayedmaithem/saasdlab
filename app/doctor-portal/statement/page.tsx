export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { DoctorStatement } from "@/components/finance/doctor-statement";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorStatementData } from "@/lib/data/finance";

export default async function DoctorPortalStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireRouteAccess("/doctor-portal");
  const filters = await searchParams;
  // getDoctorStatementData resolves the doctor strictly from session.userId —
  // no external doctorId parameter means no cross-doctor data access possible.
  const statement = await getDoctorStatementData(session, filters);

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/doctor-portal">
      <DoctorStatement
        doctorName={statement.doctorName}
        rows={statement.rows}
        remainingBalance={statement.remainingBalance}
      />
    </AppShell>
  );
}
