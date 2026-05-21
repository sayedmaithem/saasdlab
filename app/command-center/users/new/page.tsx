export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { hasRole } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { canUsePreviewAuth } from "@/lib/env";
import { hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { hasEmailProviderEnv } from "@/lib/email/resend";
import { CcNav } from "@/components/command-center/cc-nav";
import { CreateUserForm, type LinkableRecord } from "@/components/users/create-user-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getLinkableRecords(labId: string): Promise<{
  technicians: LinkableRecord[];
  doctors: LinkableRecord[];
}> {
  const supabase = await createSupabaseServerClient();

  const [{ data: techs }, { data: docs }] = await Promise.all([
    supabase
      .from("technicians")
      .select("id, display_name, profile_id")
      .eq("lab_id", labId)
      .eq("employment_status", "active")
      .order("display_name"),
    supabase
      .from("doctors")
      .select("id, display_name, profile_id")
      .eq("lab_id", labId)
      .eq("is_active", true)
      .order("display_name"),
  ]);

  return {
    technicians: (techs ?? []).map((t) => ({
      id: t.id,
      displayName: (t as { id: string; display_name: string; profile_id: string | null }).display_name,
      hasAccount: !!(t as { id: string; display_name: string; profile_id: string | null }).profile_id,
    })),
    doctors: (docs ?? []).map((d) => ({
      id: d.id,
      displayName: (d as { id: string; display_name: string; profile_id: string | null }).display_name,
      hasAccount: !!(d as { id: string; display_name: string; profile_id: string | null }).profile_id,
    })),
  };
}

export default async function CreateUserPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();

  // Only lab_owner and lab_manager can reach this page
  if (!hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"])) {
    redirect("/command-center/users");
  }

  const adminKeyConfigured = hasSupabaseAdminEnv();
  const emailProviderConfigured = hasEmailProviderEnv();
  const linkable = session.activeLabId
    ? await getLinkableRecords(session.activeLabId)
    : { technicians: [], doctors: [] };

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="Create portal user"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />

        <div className="flex items-center gap-3">
          <Link
            href="/command-center/users"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Portal users
          </Link>
        </div>

        {!adminKeyConfigured && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Admin key not configured — limited mode
            </p>
            <p className="text-amber-700 dark:text-amber-400">
              Direct account creation requires{" "}
              <code className="rounded bg-amber-100 dark:bg-amber-900 px-1 font-mono text-xs">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{" "}
              in <code className="rounded bg-amber-100 dark:bg-amber-900 px-1 font-mono text-xs">.env.local</code>.
              You can save invite records now and create accounts later.
            </p>
          </div>
        )}

        <CreateUserForm
          adminKeyConfigured={adminKeyConfigured}
          emailProviderConfigured={emailProviderConfigured}
          linkableTechnicians={linkable.technicians}
          linkableDoctors={linkable.doctors}
        />
      </div>
    </AppShell>
  );
}
