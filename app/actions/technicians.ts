"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { hasRole } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TechnicianActionResult = { ok: boolean; message: string };

const upsertTechnicianSchema = z.object({
  technicianId: z.string().optional(),
  displayName: z.string().min(2, "Name must be at least 2 characters").max(80),
  phone: z.string().max(30).optional(),
  employmentStatus: z.enum(["active", "inactive", "contractor"]).default("active"),
  skills: z.string().max(500).optional(), // comma-separated list
});

function getString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

async function requireManagerAccess(): Promise<
  { labId: string; userId: string; error: null } | { labId: null; userId: null; error: string }
> {
  const session = await requireAuth();
  if (!hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"])) {
    return { labId: null, userId: null, error: "Only lab managers can manage technicians." };
  }
  if (!session.activeLabId) {
    return { labId: null, userId: null, error: "No active lab." };
  }
  return { labId: session.activeLabId, userId: session.userId, error: null };
}

export async function upsertTechnicianAction(
  formData: FormData,
): Promise<TechnicianActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const parsed = upsertTechnicianSchema.safeParse({
    technicianId: getString(formData, "technicianId") || undefined,
    displayName: getString(formData, "displayName"),
    phone: getString(formData, "phone") || undefined,
    employmentStatus: getString(formData, "employmentStatus") || "active",
    skills: getString(formData, "skills") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const payload = {
    lab_id: labId,
    display_name: input.displayName,
    phone: input.phone || null,
    employment_status: input.employmentStatus,
  };

  let technicianId = input.technicianId;

  if (technicianId) {
    // Update — must be in same lab
    const { error } = await supabase
      .from("technicians")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", technicianId)
      .eq("lab_id", labId);
    if (error) return { ok: false, message: error.message };
  } else {
    // Insert
    const { data, error } = await supabase
      .from("technicians")
      .insert(payload)
      .select("id")
      .single<{ id: string }>();
    if (error) return { ok: false, message: error.message };
    technicianId = data.id;
  }

  // Sync skills — replace all for this technician
  if (input.skills !== undefined) {
    const skillList = input.skills
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && s.length <= 60);

    await supabase.from("technician_skills").delete().eq("technician_id", technicianId).eq("lab_id", labId);

    if (skillList.length > 0) {
      const rows = skillList.map((skill) => ({
        lab_id: labId,
        technician_id: technicianId as string,
        skill,
        level: 1,
      }));
      const { error } = await supabase.from("technician_skills").insert(rows);
      if (error) return { ok: false, message: error.message };
    }
  }

  revalidatePath("/technicians");
  revalidatePath("/production");
  return {
    ok: true,
    message: input.technicianId ? "Technician updated." : "Technician created.",
  };
}

export async function deactivateTechnicianAction(
  technicianId: string,
): Promise<TechnicianActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("technicians")
    .update({ employment_status: "inactive", updated_at: new Date().toISOString() })
    .eq("id", technicianId)
    .eq("lab_id", labId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/technicians");
  revalidatePath("/production");
  return { ok: true, message: "Technician deactivated." };
}

// ── Stage permission actions ──────────────────────────────────────────────────

/**
 * Grant a technician access to a production stage (fixed enum key).
 * Uses the fixed enum directly — no workflow_id required for the default mode.
 */
export async function grantTechnicianStageAction(
  technicianId: string,
  stageKey: string,
): Promise<TechnicianActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const supabase = await createSupabaseServerClient();

  // Check technician belongs to this lab
  const { data: tech } = await supabase
    .from("technicians")
    .select("id")
    .eq("id", technicianId)
    .eq("lab_id", labId)
    .single();

  if (!tech) return { ok: false, message: "Technician not found." };

  // Upsert into technician_skills as the simple approach (no stage FK required
  // when operating in fixed-enum mode — the stage_key IS the identifier).
  // For future custom-workflow mode this will be extended to use stage_id FK.
  const { error } = await supabase.from("technician_skills").upsert(
    {
      technician_id: technicianId,
      lab_id: labId,
      skill: stageKey,
      level: 1,
    },
    { onConflict: "technician_id,skill" },
  );

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/technicians/${technicianId}/edit`);
  return { ok: true, message: `Stage "${stageKey}" granted.` };
}

/**
 * Revoke a technician's access to a production stage.
 * Removes the skill record that represents the stage permission.
 */
export async function revokeTechnicianStageAction(
  technicianId: string,
  stageKey: string,
): Promise<TechnicianActionResult> {
  const { labId, error: authError } = await requireManagerAccess();
  if (!labId) return { ok: false, message: authError ?? "Unauthorized." };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("technician_skills")
    .delete()
    .eq("technician_id", technicianId)
    .eq("skill", stageKey);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/technicians/${technicianId}/edit`);
  return { ok: true, message: `Stage "${stageKey}" revoked.` };
}
