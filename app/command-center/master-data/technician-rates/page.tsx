export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth, hasSupabaseEnv } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { TechnicianRatesManager } from "@/components/master-data/technician-rates-manager";
import {
  getTechnicianRates,
  getLabOperations,
  getLabMaterials,
} from "@/lib/data/master-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRole } from "@/lib/permissions";

type TechnicianOption = { id: string; name: string };

async function getActiveTechnicians(labId: string): Promise<TechnicianOption[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("technicians")
    .select("id, display_name")
    .eq("lab_id", labId)
    .eq("employment_status", "active")
    .order("display_name")
    .returns<Array<{ id: string; display_name: string }>>()
    .then((r) => r);
  return (data ?? []).map((t) => ({ id: t.id, name: t.display_name }));
}

export default async function TechnicianRatesPage({
  searchParams,
}: {
  searchParams: Promise<{ technician?: string }>;
}) {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const { technician: selectedTechId } = await searchParams;
  const canManage = hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"]);

  const labId = session.activeLabId ?? "";

  const [rates, operations, materials, technicians] = await Promise.all([
    getTechnicianRates(session, selectedTechId),
    getLabOperations(session),
    getLabMaterials(session),
    getActiveTechnicians(labId),
  ]);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Master Data"
      title="Technician Rates"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />
        <TechnicianRatesManager
          rates={rates}
          technicians={technicians}
          operations={operations}
          materials={materials}
          selectedTechId={selectedTechId ?? null}
          canManage={canManage}
        />
      </div>
    </AppShell>
  );
}
