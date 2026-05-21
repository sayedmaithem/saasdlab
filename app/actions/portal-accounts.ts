"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { hasRole } from "@/lib/permissions";
import { linkPortalAccount, unlinkPortalAccount, isValidUUID } from "@/lib/auth/portal-accounts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/constants/roles";
import type { AuthSessionContext } from "@/types/app";

export type PortalAccountActionResult = { ok: boolean; message: string };

type SessionWithLab = AuthSessionContext & { activeLabId: string };

// ─────────────────────────────────────────────────────────────
// requireOwnerAccess — only lab_owner / super_admin may link accounts
// ─────────────────────────────────────────────────────────────
async function requireOwnerAccess(): Promise<
  | { session: SessionWithLab; error: null }
  | { session: null; error: string }
> {
  const session = await requireAuth();
  if (!hasRole(session.roles, ["super_admin", "lab_owner"])) {
    return { session: null, error: "Only lab owners can manage portal accounts." };
  }
  if (!session.activeLabId) {
    return { session: null, error: "No active lab in session." };
  }
  return { session: session as SessionWithLab, error: null };
}

// ─────────────────────────────────────────────────────────────
// linkTechnicianPortalAccountAction
// Links an existing auth user to a technician record.
//
// FormData fields:
//   technicianId  — technicians.id (UUID)
//   userId        — auth.users.id  (UUID, copied from Supabase dashboard)
//   fullName      — optional display name override
// ─────────────────────────────────────────────────────────────
export async function linkTechnicianPortalAccountAction(
  formData: FormData,
): Promise<PortalAccountActionResult> {
  const ownerResult = await requireOwnerAccess();
  if (!ownerResult.session) return { ok: false, message: ownerResult.error ?? "Unauthorized." };
  const session = ownerResult.session;

  const technicianId = (formData.get("technicianId") as string | null)?.trim() ?? "";
  const userId = (formData.get("userId") as string | null)?.trim() ?? "";
  const fullName = (formData.get("fullName") as string | null)?.trim() || undefined;

  if (!technicianId || !isValidUUID(technicianId)) {
    return { ok: false, message: "Invalid technician ID." };
  }
  if (!userId || !isValidUUID(userId)) {
    return { ok: false, message: "User ID must be a valid UUID (copy from Supabase dashboard)." };
  }

  // 1. Link in Supabase Auth layer (profiles + user_roles)
  const linkResult = await linkPortalAccount(session, userId, "technician", fullName);
  if (!linkResult.ok) return { ok: false, message: linkResult.error };

  // 2. Update technicians.profile_id
  const supabase = await createSupabaseServerClient();
  const { error: updateError } = await supabase
    .from("technicians")
    .update({ profile_id: userId, updated_at: new Date().toISOString() })
    .eq("id", technicianId)
    .eq("lab_id", session.activeLabId);

  if (updateError) return { ok: false, message: updateError.message };

  revalidatePath("/technicians");
  revalidatePath(`/technicians/${technicianId}/edit`);
  revalidatePath("/production");
  revalidatePath("/command-center/users");

  return { ok: true, message: "Portal account linked. The user can now log in as a technician." };
}

// ─────────────────────────────────────────────────────────────
// unlinkTechnicianPortalAccountAction
// Deactivates the portal account — does NOT delete the auth user.
// ─────────────────────────────────────────────────────────────
export async function unlinkTechnicianPortalAccountAction(
  formData: FormData,
): Promise<PortalAccountActionResult> {
  const ownerResult = await requireOwnerAccess();
  if (!ownerResult.session) return { ok: false, message: ownerResult.error ?? "Unauthorized." };
  const session = ownerResult.session;

  const technicianId = (formData.get("technicianId") as string | null)?.trim() ?? "";
  const userId = (formData.get("userId") as string | null)?.trim() ?? "";

  if (!technicianId || !isValidUUID(technicianId)) {
    return { ok: false, message: "Invalid technician ID." };
  }
  if (!userId || !isValidUUID(userId)) {
    return { ok: false, message: "Invalid user ID." };
  }

  // 1. Deactivate in Supabase Auth layer
  const result = await unlinkPortalAccount(session, userId);
  if (!result.ok) return { ok: false, message: result.error };

  // 2. Clear technicians.profile_id
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("technicians")
    .update({ profile_id: null, updated_at: new Date().toISOString() })
    .eq("id", technicianId)
    .eq("lab_id", session.activeLabId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/technicians");
  revalidatePath(`/technicians/${technicianId}/edit`);
  revalidatePath("/production");
  revalidatePath("/command-center/users");

  return {
    ok: true,
    message:
      "Portal account deactivated. The auth user still exists in Supabase — delete it there if needed.",
  };
}

// ─────────────────────────────────────────────────────────────
// linkDoctorPortalAccountAction
// Links an existing auth user to a doctor record.
// ─────────────────────────────────────────────────────────────
export async function linkDoctorPortalAccountAction(
  formData: FormData,
): Promise<PortalAccountActionResult> {
  const ownerResult = await requireOwnerAccess();
  if (!ownerResult.session) return { ok: false, message: ownerResult.error ?? "Unauthorized." };
  const session = ownerResult.session;

  const doctorId = (formData.get("doctorId") as string | null)?.trim() ?? "";
  const userId = (formData.get("userId") as string | null)?.trim() ?? "";
  const fullName = (formData.get("fullName") as string | null)?.trim() || undefined;

  if (!doctorId || !isValidUUID(doctorId)) {
    return { ok: false, message: "Invalid doctor ID." };
  }
  if (!userId || !isValidUUID(userId)) {
    return { ok: false, message: "User ID must be a valid UUID (copy from Supabase dashboard)." };
  }

  const linkResult = await linkPortalAccount(session, userId, "doctor" as AppRole, fullName);
  if (!linkResult.ok) return { ok: false, message: linkResult.error };

  const supabase = await createSupabaseServerClient();
  const { error: updateError } = await supabase
    .from("doctors")
    .update({ profile_id: userId })
    .eq("id", doctorId)
    .eq("lab_id", session.activeLabId);

  if (updateError) return { ok: false, message: updateError.message };

  revalidatePath("/doctors");
  revalidatePath(`/doctors/${doctorId}/edit`);
  revalidatePath("/command-center/users");

  return { ok: true, message: "Portal account linked. The doctor can now log in to their portal." };
}

// ─────────────────────────────────────────────────────────────
// unlinkDoctorPortalAccountAction
// ─────────────────────────────────────────────────────────────
export async function unlinkDoctorPortalAccountAction(
  formData: FormData,
): Promise<PortalAccountActionResult> {
  const ownerResult = await requireOwnerAccess();
  if (!ownerResult.session) return { ok: false, message: ownerResult.error ?? "Unauthorized." };
  const session = ownerResult.session;

  const doctorId = (formData.get("doctorId") as string | null)?.trim() ?? "";
  const userId = (formData.get("userId") as string | null)?.trim() ?? "";

  if (!doctorId || !isValidUUID(doctorId)) {
    return { ok: false, message: "Invalid doctor ID." };
  }
  if (!userId || !isValidUUID(userId)) {
    return { ok: false, message: "Invalid user ID." };
  }

  const result = await unlinkPortalAccount(session, userId);
  if (!result.ok) return { ok: false, message: result.error };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("doctors")
    .update({ profile_id: null })
    .eq("id", doctorId)
    .eq("lab_id", session.activeLabId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/doctors");
  revalidatePath(`/doctors/${doctorId}/edit`);
  revalidatePath("/command-center/users");

  return {
    ok: true,
    message: "Portal access revoked. The auth user still exists in Supabase — delete it there if needed.",
  };
}
