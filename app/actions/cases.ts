"use server";

import { revalidatePath } from "next/cache";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCaseSchema } from "@/lib/validations/case";

export type CreateCaseActionState = {
  ok: boolean;
  message: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseToothNumbers(value: string) {
  return value
    .split(/[,\s]+/)
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isInteger(item) && item > 0 && item <= 48);
}

export async function createCaseAction(
  formData: FormData,
): Promise<CreateCaseActionState> {
  if (!hasSupabaseEnv()) {
    return {
      ok: false,
      message:
        "Supabase is not configured yet. Add env vars, run the migration, then submit again.",
    };
  }

  const parsed = createCaseSchema.safeParse({
    patientDisplay: getString(formData, "patientDisplay"),
    doctorId: getString(formData, "doctorId"),
    clinicId: getString(formData, "clinicId"),
    restorationType: getString(formData, "restorationType"),
    shade: getString(formData, "shade"),
    toothNumbers: getString(formData, "toothNumbers"),
    dueDate: getString(formData, "dueDate"),
    priority: getString(formData, "priority"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid case data.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "You must be signed in to create a case.",
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("lab_memberships")
    .select("lab_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle<{ lab_id: string }>();

  if (membershipError || !membership) {
    return {
      ok: false,
      message: "No lab membership was found for this user.",
    };
  }

  const input = parsed.data;
  const caseNumber = `LF-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

  const { error } = await supabase.from("cases").insert({
    lab_id: membership.lab_id,
    case_number: caseNumber,
    patient_display: input.patientDisplay,
    doctor_id: input.doctorId,
    clinic_id: input.clinicId,
    restoration_type: input.restorationType,
    shade: input.shade || null,
    tooth_numbers: parseToothNumbers(input.toothNumbers),
    due_date: input.dueDate || null,
    priority: input.priority,
    clinical_notes: input.notes || null,
    stage: "received",
    created_by: user.id,
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  revalidatePath("/");
  revalidatePath("/cases/new");

  return {
    ok: true,
    message: `Case ${caseNumber} created and moved to Received.`,
  };
}
