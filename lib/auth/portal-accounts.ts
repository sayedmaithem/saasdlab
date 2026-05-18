/**
 * Portal account helpers — safe SECURITY DEFINER RPC wrappers.
 *
 * All mutations go through Postgres SECURITY DEFINER functions defined in
 * migration 0014. The app never touches auth.users and never needs the
 * service-role key. The database functions enforce lab-owner authorization
 * server-side before writing to profiles / user_roles.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/constants/roles";
import type { AuthSessionContext } from "@/types/app";

export type LinkResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Link a portal account to a lab member.
 *
 * Calls admin_link_portal_account() which:
 *  - Validates the calling user is lab_owner/super_admin for the lab
 *  - Upserts profiles row (lab_id, role, is_active, full_name)
 *  - Upserts user_roles row
 *
 * After this the caller should also update technicians.profile_id or
 * doctors.profile_id to point at userId.
 */
export async function linkPortalAccount(
  session: AuthSessionContext,
  userId: string,
  role: AppRole,
  fullName?: string,
): Promise<LinkResult> {
  if (!session.activeLabId) {
    return { ok: false, error: "No active lab in session" };
  }

  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("admin_link_portal_account", {
    p_user_id: userId,
    p_lab_id: session.activeLabId,
    p_role: role,
    p_full_name: fullName ?? null,
  });

  if (error) {
    return { ok: false, error: (error as { message: string }).message };
  }

  const result = data as { ok: boolean; error?: string } | null;

  if (!result?.ok) {
    return { ok: false, error: result?.error ?? "Unknown error from database" };
  }

  return { ok: true };
}

/**
 * Deactivate all portal roles for a user in the current lab.
 * Does NOT delete the auth.users row — that must be done in the dashboard.
 */
export async function unlinkPortalAccount(
  session: AuthSessionContext,
  userId: string,
): Promise<LinkResult> {
  if (!session.activeLabId) {
    return { ok: false, error: "No active lab in session" };
  }

  const supabase = await createSupabaseServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("admin_unlink_portal_account", {
    p_user_id: userId,
    p_lab_id: session.activeLabId,
  });

  if (error) {
    return { ok: false, error: (error as { message: string }).message };
  }

  const result = data as { ok: boolean; error?: string } | null;

  if (!result?.ok) {
    return { ok: false, error: result?.error ?? "Unknown error from database" };
  }

  return { ok: true };
}

/** Minimal UUID format check — prevents obviously wrong input before the DB call. */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
