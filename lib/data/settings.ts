import { hasSupabaseEnv } from "@/lib/env";
import { defaultMaterials, defaultQcSettings, defaultWorkTypes } from "@/lib/settings/defaults";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSessionContext } from "@/types/app";

export type SettingsData = {
  lab: {
    name: string;
    phone: string | null;
    address: string | null;
    currency: string;
    timezone: string;
  };
  workTypes: string[];
  materials: Array<{ name: string; defaultPrice: number; active: boolean }>;
  qcSettings: Array<{ workType: string; item: string; required: boolean; active: boolean }>;
  users: Array<{ id: string; name: string; role: string | null; email: string | null }>;
};

export async function getSettingsData(session: AuthSessionContext): Promise<SettingsData> {
  if (!session.activeLabId || !hasSupabaseEnv()) {
    return {
      lab: { name: "LabFlow", phone: null, address: null, currency: "USD", timezone: "Asia/Baghdad" },
      workTypes: defaultWorkTypes,
      materials: defaultMaterials,
      qcSettings: defaultQcSettings,
      users: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: lab }, { data: settings }, { data: users }] = await Promise.all([
    supabase
      .from("labs")
      .select("name, phone, address, currency, timezone")
      .eq("id", session.activeLabId)
      .maybeSingle<{ name: string; phone: string | null; address: string | null; currency: string | null; timezone: string }>(),
    supabase
      .from("app_settings")
      .select("settings")
      .eq("lab_id", session.activeLabId)
      .maybeSingle<{ settings: Record<string, unknown> | null }>(),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("lab_id", session.activeLabId)
      .returns<Array<{ id: string; full_name: string | null; email: string | null; role: string | null }>>(),
  ]);

  const raw = settings?.settings ?? {};
  const workTypes = Array.isArray(raw.workTypes) ? raw.workTypes.filter((item): item is string => typeof item === "string") : defaultWorkTypes;

  return {
    lab: {
      name: lab?.name ?? "LabFlow",
      phone: lab?.phone ?? null,
      address: lab?.address ?? null,
      currency: lab?.currency ?? "USD",
      timezone: lab?.timezone ?? "Asia/Baghdad",
    },
    workTypes,
    materials: defaultMaterials,
    qcSettings: defaultQcSettings,
    users: (users ?? []).map((user) => ({
      id: user.id,
      name: user.full_name ?? user.email ?? "User",
      role: user.role,
      email: user.email,
    })),
  };
}
