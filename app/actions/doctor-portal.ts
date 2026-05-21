"use server";

import { redirect } from "next/navigation";
import { createCaseAction } from "@/app/actions/cases";
import { requireAuth } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DoctorCaseActionResult = { ok: false; message: string };

/**
 * Doctor-portal case submission.
 *
 * Security contract:
 *  - doctorId is ALWAYS resolved server-side from profile_id = session.userId.
 *    The client cannot supply or override it.
 *  - clinicId comes from the form (doctor chose from their pre-populated clinics list);
 *    the underlying createCaseAction validates the case belongs to the lab via RLS.
 *  - requiresDoctorApproval is forced ON — portal-submitted cases always require approval.
 *  - On success we redirect() away; the component never receives a truthy result.
 */
export async function createDoctorPortalCaseAction(
  formData: FormData,
): Promise<DoctorCaseActionResult> {
  const session = await requireAuth();
  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found." };
  }

  // Resolve doctor server-side — never trust doctorId from the client
  const supabase = await createSupabaseServerClient();
  const { data: doctor, error } = await supabase
    .from("doctors")
    .select("id")
    .eq("lab_id", session.activeLabId)
    .eq("profile_id", session.userId)
    .maybeSingle<{ id: string }>();

  if (error) return { ok: false, message: error.message };
  if (!doctor) {
    return {
      ok: false,
      message:
        "No linked doctor profile found. Ask your lab administrator to link your portal account.",
    };
  }

  // Forward form data with server-injected values
  const forwarded = new FormData();
  for (const [key, value] of formData.entries()) forwarded.set(key, value);
  forwarded.set("doctorId", doctor.id);
  // Always require doctor approval for portal-submitted cases
  forwarded.set("requiresDoctorApproval", "on");

  const result = await createCaseAction(forwarded);
  if (!result.ok) return { ok: false, message: result.message };

  // Success — navigate back to the portal dashboard
  redirect("/doctor-portal");
}
