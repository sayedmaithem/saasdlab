"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { hasRole } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clinicSchema } from "@/lib/validations/clinic";
import type { ActionState } from "@/app/actions/doctors";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export async function upsertClinicAction(formData: FormData): Promise<ActionState> {
  const session = await requireAuth();

  if (!hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager", "reception"])) {
    return { ok: false, message: "You do not have permission to manage clinics." };
  }

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const parsed = clinicSchema.safeParse({
    clinicId: getString(formData, "clinicId"),
    name: getString(formData, "name"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    address: getString(formData, "address"),
    notes: getString(formData, "notes"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid clinic data.",
    };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const payload = {
    lab_id: session.activeLabId,
    name: input.name,
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
    notes: input.notes || null,
    is_active: input.isActive,
  };
  const query = input.clinicId
    ? supabase.from("clinics").update(payload).eq("id", input.clinicId)
    : supabase.from("clinics").insert(payload);
  const { error } = await query;

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/clinics");
  revalidatePath("/doctors");

  return { ok: true, message: input.clinicId ? "Clinic updated." : "Clinic created." };
}
