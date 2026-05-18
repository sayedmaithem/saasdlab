/**
 * Users data layer — lab member accounts for the Command Center.
 *
 * Fetches combined data from user_roles + profiles so the CC /users page
 * can show every person who has (or had) a portal account in this lab.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { AuthSessionContext } from "@/types/app";
import type { AppRole } from "@/lib/constants/roles";

export type LabUser = {
  userId: string;
  fullName: string | null;
  email: string | null;
  role: AppRole;
  isActive: boolean;
  /** Set if this user is linked to a technician record */
  technicianId: string | null;
  technicianName: string | null;
  /** Set if this user is linked to a doctor record */
  doctorId: string | null;
  doctorName: string | null;
};

type UserRoleRow = {
  user_id: string;
  role: string;
  is_active: boolean;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type TechnicianLinkRow = {
  profile_id: string | null;
  id: string;
  display_name: string;
};

type DoctorLinkRow = {
  profile_id: string | null;
  id: string;
  display_name: string;
};

function assertLab(session: AuthSessionContext): string {
  if (!session.activeLabId) throw new Error("No active lab in session");
  return session.activeLabId;
}

export async function getLabUsers(session: AuthSessionContext): Promise<LabUser[]> {
  if (!hasSupabaseEnv()) {
    // Preview mode — return a stub list
    return [
      {
        userId: session.userId,
        fullName: session.fullName,
        email: session.email,
        role: session.role as AppRole,
        isActive: true,
        technicianId: null,
        technicianName: null,
        doctorId: null,
        doctorName: null,
      },
    ];
  }

  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();

  const [
    { data: userRoles, error: rolesError },
    { data: technicians, error: techError },
    { data: doctors, error: doctorError },
  ] = await Promise.all([
    supabase
      .from("user_roles")
      .select("user_id, role, is_active")
      .eq("lab_id", labId)
      .order("is_active", { ascending: false })
      .returns<UserRoleRow[]>(),
    supabase
      .from("technicians")
      .select("id, display_name, profile_id")
      .eq("lab_id", labId)
      .returns<TechnicianLinkRow[]>(),
    supabase
      .from("doctors")
      .select("id, display_name, profile_id")
      .eq("lab_id", labId)
      .returns<DoctorLinkRow[]>(),
  ]);

  if (rolesError) throw new Error(rolesError.message);
  if (techError) throw new Error(techError.message);
  if (doctorError) throw new Error(doctorError.message);

  if (!userRoles || userRoles.length === 0) return [];

  // Fetch profiles for all user_ids in one query
  const userIds = [...new Set(userRoles.map((r) => r.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds)
    .returns<ProfileRow[]>();

  if (profilesError) throw new Error(profilesError.message);

  const profileMap = new Map<string, ProfileRow>(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  // Build technician/doctor lookup by profile_id
  const techByProfile = new Map<string, TechnicianLinkRow>(
    (technicians ?? [])
      .filter((t) => t.profile_id)
      .map((t) => [t.profile_id as string, t]),
  );
  const doctorByProfile = new Map<string, DoctorLinkRow>(
    (doctors ?? [])
      .filter((d) => d.profile_id)
      .map((d) => [d.profile_id as string, d]),
  );

  return userRoles.map((ur) => {
    const profile = profileMap.get(ur.user_id);
    const tech = techByProfile.get(ur.user_id);
    const doctor = doctorByProfile.get(ur.user_id);

    return {
      userId: ur.user_id,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      role: ur.role as AppRole,
      isActive: ur.is_active,
      technicianId: tech?.id ?? null,
      technicianName: tech?.display_name ?? null,
      doctorId: doctor?.id ?? null,
      doctorName: doctor?.display_name ?? null,
    };
  });
}
