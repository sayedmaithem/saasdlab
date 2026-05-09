import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSessionContext } from "@/types/app";

export type DeliveryStatus =
  | "ready_for_delivery"
  | "assigned_to_delivery"
  | "out_for_delivery"
  | "delivered"
  | "failed_delivery";

export type DeliveryQueueItem = {
  id: string;
  deliveryId: string | null;
  caseNumber: string;
  caseId: string;
  doctorName: string;
  clinicName: string;
  patientName: string;
  status: DeliveryStatus;
  deliveryPersonName: string | null;
  scheduledAt: string | null;
  outAt: string | null;
  deliveredAt: string | null;
  recipientName: string | null;
  failureReason: string | null;
  proofFileId: string | null;
};

type CaseRow = {
  id: string;
  case_number: string;
  patient_name: string | null;
  patient_display: string;
  current_stage: string | null;
  doctor_id: string;
  clinic_id: string | null;
  doctors: { display_name: string } | null;
  clinics: { name: string } | null;
};

type DeliveryRow = {
  id: string;
  case_id: string;
  delivery_status: string;
  driver_id: string | null;
  delivery_person_id: string | null;
  scheduled_at: string | null;
  out_at: string | null;
  delivered_at: string | null;
  recipient_name: string | null;
  failure_reason: string | null;
  proof_file_id: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

function assertLab(session: AuthSessionContext) {
  if (!session.activeLabId) throw new Error("No active lab was found.");
  return session.activeLabId;
}

function toDeliveryStatus(stage: string | null, delivery?: DeliveryRow): DeliveryStatus {
  if (delivery?.delivery_status === "assigned" || delivery?.delivery_status === "assigned_to_delivery") return "assigned_to_delivery";
  if (delivery?.delivery_status === "out_for_delivery") return "out_for_delivery";
  if (delivery?.delivery_status === "delivered") return "delivered";
  if (delivery?.delivery_status === "failed" || delivery?.delivery_status === "failed_delivery") return "failed_delivery";
  if (stage === "out_for_delivery") return "out_for_delivery";
  if (stage === "delivered") return "delivered";
  return "ready_for_delivery";
}

export async function getDeliveryData(session: AuthSessionContext) {
  const labId = assertLab(session);
  if (!hasSupabaseEnv()) {
    return {
      items: [] as DeliveryQueueItem[],
      deliveryPeople: [] as Array<{ id: string; name: string }>,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: cases, error }, { data: deliveries }, { data: deliveryPeople }] =
    await Promise.all([
      supabase
        .from("cases")
        .select("id, case_number, patient_name, patient_display, current_stage, doctor_id, clinic_id, doctors(display_name), clinics(name)")
        .eq("lab_id", labId)
        .in("current_stage", ["ready_for_delivery", "out_for_delivery", "delivered"])
        .order("updated_at", { ascending: false })
        .returns<CaseRow[]>(),
      supabase
        .from("deliveries")
        .select("id, case_id, delivery_status, driver_id, delivery_person_id, scheduled_at, out_at, delivered_at, recipient_name, failure_reason, proof_file_id, profiles:delivery_person_id(full_name, email)")
        .eq("lab_id", labId)
        .order("created_at", { ascending: false })
        .returns<DeliveryRow[]>(),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("lab_id", labId)
        .eq("role", "delivery")
        .returns<Array<{ id: string; full_name: string | null; email: string | null }>>(),
    ]);

  if (error) throw new Error(error.message);
  const deliveryByCase = new Map<string, DeliveryRow>();
  for (const delivery of deliveries ?? []) {
    if (!deliveryByCase.has(delivery.case_id)) deliveryByCase.set(delivery.case_id, delivery);
  }

  return {
    items: (cases ?? []).map((item) => {
      const delivery = deliveryByCase.get(item.id);
      return {
        id: delivery?.id ?? item.id,
        deliveryId: delivery?.id ?? null,
        caseId: item.id,
        caseNumber: item.case_number,
        doctorName: item.doctors?.display_name ?? "Unknown doctor",
        clinicName: item.clinics?.name ?? "Unknown clinic",
        patientName: item.patient_name ?? item.patient_display,
        status: toDeliveryStatus(item.current_stage, delivery),
        deliveryPersonName: delivery?.profiles?.full_name ?? delivery?.profiles?.email ?? null,
        scheduledAt: delivery?.scheduled_at ?? null,
        outAt: delivery?.out_at ?? null,
        deliveredAt: delivery?.delivered_at ?? null,
        recipientName: delivery?.recipient_name ?? null,
        failureReason: delivery?.failure_reason ?? null,
        proofFileId: delivery?.proof_file_id ?? null,
      };
    }),
    deliveryPeople: (deliveryPeople ?? []).map((person) => ({
      id: person.id,
      name: person.full_name ?? person.email ?? "Delivery user",
    })),
  };
}
