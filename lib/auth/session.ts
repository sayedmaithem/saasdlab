import { redirect } from "next/navigation";
import { canUsePreviewAuth, hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/constants/roles";
import type { AuthSessionContext } from "@/types/app";

type MembershipRow = {
  lab_id: string;
  role: AppRole;
};

type ProfileRow = {
  id: string;
  lab_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: AppRole | null;
  is_active: boolean;
};

export async function getCurrentSessionContext(): Promise<AuthSessionContext | null> {
  if (canUsePreviewAuth()) {
    return {
      userId: "00000000-0000-4000-8000-000000000001",
      email: "owner@labflow.local",
      fullName: "Preview Lab Owner",
      phone: null,
      role: "lab_owner",
      activeLabId: "00000000-0000-4000-8000-000000000001",
      roles: ["lab_owner"],
    };
  }

  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, lab_id, full_name, email, phone, role, is_active")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile || !profile.is_active || !profile.role) {
    return null;
  }

  const { data: extraRoles, error: rolesError } = await supabase
    .from("user_roles")
    .select("lab_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<MembershipRow[]>();

  if (rolesError) {
    throw new Error(rolesError.message);
  }

  const roles = Array.from(
    new Set([profile.role, ...(extraRoles?.map((item) => item.role) ?? [])]),
  );

  return {
    userId: user.id,
    email: profile.email ?? user.email ?? null,
    fullName: profile.full_name,
    phone: profile.phone,
    role: profile.role,
    activeLabId: profile.lab_id ?? extraRoles?.[0]?.lab_id ?? null,
    roles,
  };
}

export async function requireAuth() {
  const session = await getCurrentSessionContext();

  if (!session) {
    redirect("/auth");
  }

  return session;
}

export async function requireAnyRole(allowedRoles: AppRole[]) {
  const session = await requireAuth();
  const allowed = session.roles.some((role) => allowedRoles.includes(role));

  if (!allowed) {
    redirect("/dashboard");
  }

  return session;
}
