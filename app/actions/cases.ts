"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { checkMissingInformation } from "@/lib/cases/missing-info";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateCasePriority } from "@/lib/scoring/case-priority";
import { createCaseSchema, parseToothNumbers } from "@/lib/validations/case";

export type CreateCaseActionState = {
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

async function getDoctorPrice(params: {
  labId: string;
  doctorId: string;
  workType: string;
  material?: string;
  unitsCount: number;
}) {
  const supabase = await createSupabaseServerClient();
  const [{ data: doctor }, { data: prices, error }] = await Promise.all([
    supabase
      .from("doctors")
      .select("is_vip")
      .eq("lab_id", params.labId)
      .eq("id", params.doctorId)
      .maybeSingle<{ is_vip: boolean }>(),
    supabase
      .from("doctor_price_lists")
      .select("unit_price, material")
      .eq("lab_id", params.labId)
      .eq("doctor_id", params.doctorId)
      .eq("work_type", params.workType)
      .eq("is_active", true)
      .order("effective_from", { ascending: false })
      .returns<Array<{ unit_price: number; material: string | null }>>(),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const price =
    prices?.find((item) => item.material === params.material)?.unit_price ??
    prices?.find((item) => item.material === null)?.unit_price ??
    0;

  return {
    isVipDoctor: Boolean(doctor?.is_vip),
    unitPrice: Number(price),
    totalPrice: Number(price) * params.unitsCount,
  };
}

export async function createCaseAction(
  formData: FormData,
): Promise<CreateCaseActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const parsed = createCaseSchema.safeParse({
    doctorId: getString(formData, "doctorId"),
    clinicId: getString(formData, "clinicId"),
    patientName: getString(formData, "patientName"),
    workType: getString(formData, "workType"),
    material: getString(formData, "material"),
    shade: getString(formData, "shade"),
    unitsCount: getString(formData, "unitsCount"),
    toothNumbers: getString(formData, "toothNumbers"),
    dueDate: getString(formData, "dueDate"),
    isUrgent: getBoolean(formData, "isUrgent"),
    isRemake: getBoolean(formData, "isRemake"),
    isWarranty: getBoolean(formData, "isWarranty"),
    requiresDoctorApproval: getBoolean(formData, "requiresDoctorApproval"),
    physicalImpressionReceived: getBoolean(
      formData,
      "physicalImpressionReceived",
    ),
    preparationPhotoReceived: getBoolean(formData, "preparationPhotoReceived"),
    implantSystem: getString(formData, "implantSystem"),
    scanBodyInfo: getString(formData, "scanBodyInfo"),
    biteInfo: getString(formData, "biteInfo"),
    arch: getString(formData, "arch"),
    complexity: getString(formData, "complexity") || "standard",
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid case data.",
    };
  }

  const input = parsed.data;
  const toothNumbers = parseToothNumbers(input.toothNumbers);
  const missing = checkMissingInformation(input, []);
  const price = await getDoctorPrice({
    labId: session.activeLabId,
    doctorId: input.doctorId,
    workType: input.workType,
    material: input.material,
    unitsCount: input.unitsCount,
  });
  const priorityScore = calculateCasePriority({
    ...input,
    isVipDoctor: price.isVipDoctor,
  });
  const currentStage =
    missing.status === "missing" ? "waiting_doctor_info" : "information_check";
  const status = missing.status === "missing" ? "waiting_doctor_info" : "active";
  const caseNumber = `LF-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  const supabase = await createSupabaseServerClient();
  const { data: insertedCase, error } = await supabase
    .from("cases")
    .insert({
      lab_id: session.activeLabId,
      case_number: caseNumber,
      patient_display: input.patientName,
      patient_name: input.patientName,
      doctor_id: input.doctorId,
      clinic_id: input.clinicId,
      restoration_type: input.workType,
      work_type: input.workType,
      material: input.material || null,
      shade: input.shade || null,
      units_count: input.unitsCount,
      tooth_numbers: toothNumbers,
      due_date: input.dueDate || null,
      priority: input.isUrgent ? "urgent" : "normal",
      priority_score: priorityScore,
      status,
      stage: currentStage,
      current_stage: currentStage,
      is_urgent: input.isUrgent,
      is_remake: input.isRemake,
      is_warranty: input.isWarranty,
      requires_doctor_approval: input.requiresDoctorApproval,
      missing_info_status: missing.status,
      missing_info_fields: missing.requiredMissing,
      total_price: price.totalPrice,
      physical_impression_received: input.physicalImpressionReceived,
      preparation_photo_received: input.preparationPhotoReceived,
      implant_system: input.implantSystem || null,
      scan_body_info: input.scanBodyInfo || null,
      bite_info: input.biteInfo || null,
      arch: input.arch || null,
      complexity: input.complexity,
      clinical_notes: input.notes || null,
      notes: input.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    return { ok: false, message: error.message };
  }

  await Promise.all([
    supabase.from("case_stage_logs").insert({
      lab_id: session.activeLabId,
      case_id: insertedCase.id,
      from_stage: null,
      to_stage: currentStage,
      changed_by: session.userId,
      notes: missing.message ?? "Case entered information check.",
    }),
    supabase.from("case_timeline").insert({
      lab_id: session.activeLabId,
      case_id: insertedCase.id,
      actor_id: session.userId,
      event_type: missing.status === "missing" ? "updated" : "created",
      title: missing.message ?? "Case created and ready for information check.",
      metadata: {
        missing_required: missing.requiredMissing,
        missing_recommended: missing.recommendedMissing,
        priority_score: priorityScore,
        calculated_price: price.totalPrice,
      },
    }),
  ]);

  revalidatePath("/cases");
  revalidatePath("/cases/new");

  return {
    ok: true,
    message:
      missing.status === "missing"
        ? `${caseNumber} created. This case is waiting for doctor information.`
        : `${caseNumber} created and moved to information check.`,
  };
}
