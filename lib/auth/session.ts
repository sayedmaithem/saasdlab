import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/constants/roles";
import type { AuthSessionContext } from "@/types/app";

type MembershipRow = {
  lab_id: string;
  role: AppRole;
};

export async function getCurrentSessionContext(): Promise<AuthSessionContext | null> {
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

  const { data: memberships, error: membershipsError } = await supabase
    .from("lab_memberships")
    .select("lab_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .returns<MembershipRow[]>();

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    activeLabId: memberships?.[0]?.lab_id ?? null,
    roles: memberships?.map((membership) => membership.role) ?? [],
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
