export const dynamic = "force-dynamic";

import Link from "next/link";
import { CasesTable } from "@/components/cases/cases-table";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getCaseList } from "@/lib/data/cases";
import { canManageCases } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { ClientMotionWrapper, MotionSection } from "@/components/command-center/client-motion-wrapper";

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
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/cases">
      <div className="fixed inset-0 -z-10 bg-aurora opacity-20 pointer-events-none" />
      <ClientMotionWrapper className="relative z-10 space-y-6">
        <MotionSection className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Production intake
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gradient mt-1">Cases</h2>
          </div>
          {canManageCases(session.roles) ? (
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 glow-primary"
            >
              <Plus className="h-4 w-4" />
              New case
            </Link>
          ) : null}
        </MotionSection>

        <MotionSection>
          <CasesTable cases={data.cases} doctors={data.doctors} filters={params} />
        </MotionSection>
      </ClientMotionWrapper>
    </AppShell>
  );
}
