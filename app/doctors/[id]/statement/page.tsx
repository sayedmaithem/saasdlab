export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { DoctorStatement } from "@/components/finance/doctor-statement";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getDoctorStatement } from "@/lib/data/finance";

export default async function DoctorStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireRouteAccess("/doctors");
  const { id } = await params;
  const filters = await searchParams;
  const statement = await getDoctorStatement(session, id, filters);

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/doctors">
      <DoctorStatement
        doctorName={statement.doctorName}
        rows={statement.rows}
        remainingBalance={statement.remainingBalance}
      />
    </AppShell>
  );
}
