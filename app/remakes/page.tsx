export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { RemakesDashboard } from "@/components/qc/remakes-dashboard";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getRemakesData } from "@/lib/data/quality";

export default async function RemakesPage({
  searchParams,
}: {
  searchParams: Promise<{
    doctorId?: string;
    responsibility?: string;
    reason?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await requireRouteAccess("/remakes");
  const filters = await searchParams;
  const data = await getRemakesData(session, filters);

  return (
    <AppShell labName={session.labName ?? "LabFlow"} session={session} activeHref="/remakes">
      <RemakesDashboard
        remakes={data.remakes}
        doctors={data.doctors}
        analytics={data.analytics}
      />
    </AppShell>
  );
}
