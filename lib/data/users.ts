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

export type UnlinkedDoctor = { id: string; displayName: string };

/**
 * Returns doctor records that have no portal account linked yet (profile_id IS NULL).
 * Used on the /command-center/users page to show readiness status.
 */
export async function getUnlinkedDoctors(
  session: AuthSessionContext,
): Promise<UnlinkedDoctor[]> {
  if (!hasSupabaseEnv()) return [];
  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("doctors")
    .select("id, display_name")
    .eq("lab_id", labId)
    .is("profile_id", null)
    .eq("is_active", true)
    .order("display_name")
    .returns<Array<{ id: string; display_name: string }>>();
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({ id: d.id, displayName: d.display_name }));
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

// ── Portal invitations overview ──────────────────────────────────────────

export type PortalInvitation = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  linkedRecordType: string | null;
  linkedRecordId: string | null;
  invitedByName: string | null;
  createdAt: string;
  expiresAt: string | null;
};

export type AuditLogEntry = {
  id: string;
  actorName: string | null;
  action: string;
  role: string | null;
  targetUserId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

export type UsersOverview = {
  activeUsers: LabUser[];
  inactiveUsers: LabUser[];
  pendingInvitations: PortalInvitation[];
  recentAuditLogs: AuditLogEntry[];
  unlinkedDoctors: UnlinkedDoctor[];
  counts: {
    active: number;
    inactive: number;
    pending: number;
    unlinkedDoctors: number;
  };
};

/**
 * Fetches the full users overview for the command-center /users page.
 * All queries are lab_id-scoped. Returns a structured summary.
 */
export async function getUsersOverview(session: AuthSessionContext): Promise<UsersOverview> {
  const empty: UsersOverview = {
    activeUsers: [],
    inactiveUsers: [],
    pendingInvitations: [],
    recentAuditLogs: [],
    unlinkedDoctors: [],
    counts: { active: 0, inactive: 0, pending: 0, unlinkedDoctors: 0 },
  };

  if (!hasSupabaseEnv()) {
    return {
      ...empty,
      activeUsers: [
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
      ],
      counts: { active: 1, inactive: 0, pending: 0, unlinkedDoctors: 0 },
    };
  }

  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();

  const [users, unlinked, { data: invites }, { data: auditRaw }] = await Promise.all([
    getLabUsers(session),
    getUnlinkedDoctors(session),
    supabase
      .from("portal_invitations")
      .select("id, email, full_name, role, status, linked_record_type, linked_record_id, invited_by, created_at, expires_at")
      .eq("lab_id", labId)
      .in("status", ["pending", "pending_internal", "failed"])
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<Array<{
        id: string;
        email: string;
        full_name: string | null;
        role: string;
        status: string;
        linked_record_type: string | null;
        linked_record_id: string | null;
        invited_by: string | null;
        created_at: string;
        expires_at: string | null;
      }>>(),
    supabase
      .from("access_audit_logs")
      .select("id, actor_user_id, action, role, target_user_id, details, created_at")
      .eq("lab_id", labId)
      .order("created_at", { ascending: false })
      .limit(15)
      .returns<Array<{
        id: string;
        actor_user_id: string | null;
        action: string;
        role: string | null;
        target_user_id: string | null;
        details: Record<string, unknown>;
        created_at: string;
      }>>(),
  ]);

  // Build actor name map for audit logs
  const actorIds = [...new Set((auditRaw ?? []).map((e) => e.actor_user_id).filter(Boolean) as string[])];
  let actorNameMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds)
      .returns<Array<{ id: string; full_name: string | null }>>();
    actorNameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? p.id.slice(0, 8)]));
  }

  const activeUsers = users.filter((u) => u.isActive);
  const inactiveUsers = users.filter((u) => !u.isActive);

  return {
    activeUsers,
    inactiveUsers,
    pendingInvitations: (invites ?? []).map((inv) => ({
      id: inv.id,
      email: inv.email,
      fullName: inv.full_name,
      role: inv.role,
      status: inv.status,
      linkedRecordType: inv.linked_record_type,
      linkedRecordId: inv.linked_record_id,
      invitedByName: inv.invited_by ? (actorNameMap.get(inv.invited_by) ?? null) : null,
      createdAt: inv.created_at,
      expiresAt: inv.expires_at,
    })),
    recentAuditLogs: (auditRaw ?? []).map((e) => ({
      id: e.id,
      actorName: e.actor_user_id ? (actorNameMap.get(e.actor_user_id) ?? e.actor_user_id.slice(0, 8)) : null,
      action: e.action,
      role: e.role,
      targetUserId: e.target_user_id,
      details: e.details ?? {},
      createdAt: e.created_at,
    })),
    unlinkedDoctors: unlinked,
    counts: {
      active: activeUsers.length,
      inactive: inactiveUsers.length,
      pending: (invites ?? []).length,
      unlinkedDoctors: unlinked.length,
    },
  };
}
