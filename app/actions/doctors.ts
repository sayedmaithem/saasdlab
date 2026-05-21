"use server";

import { revalidatePath } from "next/cache";
import { hasRole } from "@/lib/permissions";
import { requireAuth } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createDoctorSchema, updateDoctorSchema, upsertPriceSchema } from "@/lib/validations/doctor";

export type ActionState = {
  ok: boolean;
  message: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function requireLab(session: Awaited<ReturnType<typeof requireAuth>>) {
  if (!session.activeLabId) {
    throw new Error("No active lab was found for this user.");
  }

  return session.activeLabId;
}

function canWriteDoctors(roles: Awaited<ReturnType<typeof requireAuth>>["roles"]) {
  return hasRole(roles, ["super_admin", "lab_owner", "lab_manager", "reception"]);
}

export async function createDoctorAction(formData: FormData): Promise<ActionState> {
  const session = await requireAuth();

  if (!canWriteDoctors(session.roles)) {
    return { ok: false, message: "You do not have permission to create doctors." };
  }

  const parsed = createDoctorSchema.safeParse({
    fullName: getString(formData, "fullName"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    clinicId: getString(formData, "clinicId"),
    address: getString(formData, "address"),
    isVip: getBoolean(formData, "isVip"),
    notes: getString(formData, "notes"),
    paymentTerms: getString(formData, "paymentTerms"),
    defaultPriceGroup: getString(formData, "defaultPriceGroup"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid doctor data.",
    };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("doctors").insert({
    lab_id: requireLab(session),
    display_name: input.fullName,
    phone: input.phone || null,
    email: input.email || null,
    default_clinic_id: input.clinicId || null,
    address: input.address || null,
    is_vip: input.isVip,
    notes: input.notes || null,
    payment_terms: input.paymentTerms || null,
    default_price_group: input.defaultPriceGroup || null,
    is_active: true,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/doctors");
  revalidatePath("/clinics");

  return { ok: true, message: "Doctor created successfully." };
}

export async function updateDoctorAction(formData: FormData): Promise<ActionState> {
  const session = await requireAuth();

  if (!canWriteDoctors(session.roles)) {
    return { ok: false, message: "You do not have permission to edit doctors." };
  }

  const parsed = updateDoctorSchema.safeParse({
    doctorId: getString(formData, "doctorId"),
    fullName: getString(formData, "fullName"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    clinicId: getString(formData, "clinicId"),
    address: getString(formData, "address"),
    isVip: getBoolean(formData, "isVip"),
    isActive: getBoolean(formData, "isActive"),
    notes: getString(formData, "notes"),
    paymentTerms: getString(formData, "paymentTerms"),
    defaultPriceGroup: getString(formData, "defaultPriceGroup"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const input = parsed.data;
  const labId = requireLab(session);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("doctors")
    .update({
      display_name: input.fullName,
      phone: input.phone || null,
      email: input.email || null,
      default_clinic_id: input.clinicId || null,
      address: input.address || null,
      is_vip: input.isVip,
      is_active: input.isActive,
      notes: input.notes || null,
      payment_terms: input.paymentTerms || null,
      default_price_group: input.defaultPriceGroup || null,
    })
    .eq("id", input.doctorId)
    .eq("lab_id", labId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/doctors");
  revalidatePath(`/doctors/${input.doctorId}`);

  return { ok: true, message: "Doctor updated successfully." };
}

export async function upsertDoctorPriceAction(
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAuth();

  if (!hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager", "accountant"])) {
    return { ok: false, message: "You do not have permission to manage prices." };
  }

  const parsed = upsertPriceSchema.safeParse({
    doctorId: getString(formData, "doctorId"),
    priceId: getString(formData, "priceId"),
    workType: getString(formData, "workType"),
    material: getString(formData, "material"),
    unitPrice: getString(formData, "unitPrice"),
    effectiveFrom: getString(formData, "effectiveFrom"),
    isActive: getBoolean(formData, "isActive"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid price data.",
    };
  }

  const input = parsed.data;
  const supabase = await createSupabaseServerClient();
  const payload = {
    lab_id: requireLab(session),
    doctor_id: input.doctorId,
    work_type: input.workType,
    material: input.material || null,
    unit_price: input.unitPrice,
    effective_from: input.effectiveFrom,
    is_active: input.isActive,
  };
  const query = input.priceId
    ? supabase.from("doctor_price_lists").update(payload).eq("id", input.priceId)
    : supabase.from("doctor_price_lists").insert(payload);
  const { error } = await query;

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/doctors/${input.doctorId}`);
  revalidatePath(`/doctors/${input.doctorId}/prices`);

  return { ok: true, message: "Price list updated." };
}
