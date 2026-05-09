"use server";

import { createCaseAction } from "@/app/actions/cases";
import { requireAuth } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createDoctorPortalCaseAction(formData: FormData) {
  const session = await requireAuth();
  if (!session.activeLabId) return { ok: false, message: "No active lab was found." };

  const supabase = await createSupabaseServerClient();
  const { data: doctor, error } = await supabase
    .from("doctors")
    .select("id, clinic_id")
    .eq("lab_id", session.activeLabId)
    .eq("profile_id", session.userId)
    .maybeSingle<{ id: string; clinic_id: string | null }>();
  if (error) return { ok: false, message: error.message };
  if (!doctor?.clinic_id) return { ok: false, message: "Doctor profile is not linked to a clinic." };

  const forwarded = new FormData();
  for (const [key, value] of formData.entries()) forwarded.set(key, value);
  forwarded.set("doctorId", doctor.id);
  forwarded.set("clinicId", doctor.clinic_id);
  forwarded.set("requiresDoctorApproval", "on");
  return createCaseAction(forwarded);
}
