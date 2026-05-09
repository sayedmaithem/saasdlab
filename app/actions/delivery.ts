"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import type { AppRole } from "@/lib/constants/roles";
import type { ProductionStage } from "@/lib/constants/workflow";
import { hasSupabaseEnv } from "@/lib/env";
import { hasRole } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeliveryActionState = { ok: boolean; message: string };

const deliverySchema = z.object({
  caseId: z.uuid(),
  deliveryPersonId: z.uuid().optional().or(z.literal("")),
  scheduledAt: z.string().optional(),
  recipientName: z.string().max(160).optional(),
  proofFileId: z.uuid().optional().or(z.literal("")),
  failureReason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function canManageDelivery(roles: AppRole[]) {
  return hasRole(roles, ["super_admin", "lab_owner", "lab_manager", "delivery"]);
}

async function hasPassedQc(caseId: string, labId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quality_checks")
    .select("id")
    .eq("lab_id", labId)
    .eq("case_id", caseId)
    .eq("result", "passed")
    .limit(1);
  if (error) throw new Error(error.message);
  return Boolean(data?.length);
}

async function upsertDelivery(params: {
  labId: string;
  caseId: string;
  actorId: string;
  status: string;
  deliveryPersonId?: string | null;
  scheduledAt?: string | null;
  recipientName?: string | null;
  proofFileId?: string | null;
  failureReason?: string | null;
  notes?: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: item, error: caseError } = await supabase
    .from("cases")
    .select("id, doctor_id, clinic_id")
    .eq("lab_id", params.labId)
    .eq("id", params.caseId)
    .maybeSingle<{ id: string; doctor_id: string; clinic_id: string | null }>();
  if (caseError) throw new Error(caseError.message);
  if (!item) throw new Error("Case was not found.");

  const { data: existing, error: existingError } = await supabase
    .from("deliveries")
    .select("id")
    .eq("lab_id", params.labId)
    .eq("case_id", params.caseId)
    .maybeSingle<{ id: string }>();
  if (existingError) throw new Error(existingError.message);

  const stage: ProductionStage =
    params.status === "out_for_delivery"
      ? "out_for_delivery"
      : params.status === "delivered"
        ? "delivered"
        : "ready_for_delivery";
  const patch = {
    lab_id: params.labId,
    case_id: params.caseId,
    doctor_id: item.doctor_id,
    clinic_id: item.clinic_id,
    delivery_status: params.status,
    status: stage,
    delivery_person_id: params.deliveryPersonId ?? undefined,
    driver_id: params.deliveryPersonId ?? undefined,
    scheduled_at: params.scheduledAt || undefined,
    out_at: params.status === "out_for_delivery" ? new Date().toISOString() : undefined,
    delivered_at: params.status === "delivered" ? new Date().toISOString() : undefined,
    recipient_name: params.recipientName ?? undefined,
    proof_file_id: params.proofFileId || undefined,
    failure_reason: params.failureReason || undefined,
    notes: params.notes ?? undefined,
  };

  if (existing) {
    const { error } = await supabase.from("deliveries").update(patch).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return existing.id;
  }

  const { data, error } = await supabase.from("deliveries").insert(patch).select("id").single<{ id: string }>();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function updateDeliveryAction(formData: FormData): Promise<DeliveryActionState> {
  const session = await requireAuth();
  if (!session.activeLabId) return { ok: false, message: "No active lab was found." };
  if (!hasSupabaseEnv()) return { ok: false, message: "Connect Supabase before delivery updates." };
  if (!canManageDelivery(session.roles)) return { ok: false, message: "You cannot update delivery." };

  const action = getString(formData, "deliveryAction");
  const parsed = deliverySchema.safeParse({
    caseId: getString(formData, "caseId"),
    deliveryPersonId: getString(formData, "deliveryPersonId"),
    scheduledAt: getString(formData, "scheduledAt"),
    recipientName: getString(formData, "recipientName"),
    proofFileId: getString(formData, "proofFileId"),
    failureReason: getString(formData, "failureReason"),
    notes: getString(formData, "notes"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid delivery update." };

  try {
    if (!(await hasPassedQc(parsed.data.caseId, session.activeLabId))) {
      return { ok: false, message: "Delivery cannot start until QC has passed." };
    }

    const status =
      action === "assign"
        ? "assigned_to_delivery"
        : action === "out"
          ? "out_for_delivery"
          : action === "delivered"
            ? "delivered"
            : "failed_delivery";
    if (status === "failed_delivery" && !parsed.data.failureReason) {
      return { ok: false, message: "Failure reason is required." };
    }

    const supabase = await createSupabaseServerClient();
    await upsertDelivery({
      labId: session.activeLabId,
      caseId: parsed.data.caseId,
      actorId: session.userId,
      status,
      deliveryPersonId: parsed.data.deliveryPersonId || (session.roles.includes("delivery") ? session.userId : null),
      scheduledAt: parsed.data.scheduledAt || null,
      recipientName: parsed.data.recipientName || null,
      proofFileId: parsed.data.proofFileId || null,
      failureReason: parsed.data.failureReason || null,
      notes: parsed.data.notes || null,
    });

    const stage = status === "out_for_delivery" ? "out_for_delivery" : status === "delivered" ? "delivered" : "ready_for_delivery";
    await supabase
      .from("cases")
      .update({ current_stage: stage, stage, status: stage === "delivered" ? "completed" : "active", updated_at: new Date().toISOString() })
      .eq("lab_id", session.activeLabId)
      .eq("id", parsed.data.caseId);

    await supabase.from("case_timeline").insert({
      lab_id: session.activeLabId,
      case_id: parsed.data.caseId,
      actor_id: session.userId,
      event_type: "delivery_updated",
      title: status.replaceAll("_", " "),
      metadata: {
        delivery_status: status,
        recipient_name: parsed.data.recipientName || null,
        failure_reason: parsed.data.failureReason || null,
        proof_file_id: parsed.data.proofFileId || null,
      },
    });

    revalidatePath("/delivery");
    revalidatePath(`/cases/${parsed.data.caseId}`);
    return { ok: true, message: "Delivery updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Delivery update failed." };
  }
}
