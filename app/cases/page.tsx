export const dynamic = "force-dynamic";

import Link from "next/link";
import { CasesTable } from "@/components/cases/cases-table";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getCaseList } from "@/lib/data/cases";
import { canManageCases } from "@/lib/permissions";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    stage?: string;
    doctor?: string;
    overdue?: string;
    urgent?: string;
  }>;
}) {
  const session = await requireRouteAccess("/cases");
  const params = await searchParams;
  const data = await getCaseList(session, {
    query: params.q,
    status: params.status,
    stage: params.stage,
    doctorId: params.doctor,
    overdue: params.overdue === "on" || params.overdue === "true",
    urgent: params.urgent === "on" || params.urgent === "true",
  });

  return (
    <AppShell labName="LabFlow" session={session} activeHref="/cases">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Production intake
          </p>
          <h2 className="text-2xl font-semibold">Cases</h2>
        </div>
        {canManageCases(session.roles) ? (
          <Button asChild>
            <Link href="/cases/new">New case</Link>
          </Button>
        ) : null}
      </div>
      <CasesTable cases={data.cases} doctors={data.doctors} filters={params} />
    </AppShell>
  );
}
