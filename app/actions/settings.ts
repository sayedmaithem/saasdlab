"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/env";
import { hasRole } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateLabSettingsAction(formData: FormData) {
  const session = await requireAuth();
  if (!session.activeLabId) return { ok: false, message: "No active lab was found." };
  if (!hasSupabaseEnv()) return { ok: false, message: "Connect Supabase before saving settings." };
  if (!hasRole(session.roles, ["super_admin", "lab_owner"])) {
    return { ok: false, message: "Only lab owners can update settings." };
  }

  const get = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("labs")
    .update({
      name: get("name") || "LabFlow",
      phone: get("phone") || null,
      address: get("address") || null,
      currency: get("currency") || "USD",
      timezone: get("timezone") || "Asia/Baghdad",
    })
    .eq("id", session.activeLabId);
  if (error) return { ok: false, message: error.message };

  await supabase.from("audit_logs").insert({
    lab_id: session.activeLabId,
    actor_id: session.userId,
    entity_type: "lab",
    entity_id: session.activeLabId,
    action: "settings_updated",
    metadata: { section: "lab_profile" },
  });

  revalidatePath("/settings");
  return { ok: true, message: "Settings updated." };
}
