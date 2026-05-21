import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { AuthSessionContext } from "@/types/app";

export type TechnicianSkill = {
  id: string;
  skill: string;
  level: number;
};

export type Technician = {
  id: string;
  labId: string;
  profileId: string | null;
  displayName: string;
  phone: string | null;
  employmentStatus: "active" | "inactive" | "contractor";
  productivityScore: number;
  skills: TechnicianSkill[];
  hasPortalAccount: boolean;
  createdAt: string;
};

type TechnicianRow = {
  id: string;
  lab_id: string;
  profile_id: string | null;
  display_name: string;
  phone: string | null;
  employment_status: string;
  productivity_score: number;
  created_at: string;
};

type SkillRow = {
  id: string;
  technician_id: string;
  skill: string;
  level: number;
};

function assertLab(session: AuthSessionContext): string {
  if (!session.activeLabId) throw new Error("No active lab.");
  return session.activeLabId;
}

export async function getTechnicians(session: AuthSessionContext): Promise<Technician[]> {
  if (!hasSupabaseEnv()) return [];
  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();

  const [{ data: rows, error }, { data: skills, error: skillsError }] = await Promise.all([
    supabase
      .from("technicians")
      .select("id, lab_id, profile_id, display_name, phone, employment_status, productivity_score, created_at")
      .eq("lab_id", labId)
      .order("display_name")
      .returns<TechnicianRow[]>(),
    supabase
      .from("technician_skills")
      .select("id, technician_id, skill, level")
      .eq("lab_id", labId)
      .returns<SkillRow[]>(),
  ]);

  if (error ?? skillsError) throw new Error((error ?? skillsError)?.message);

  const skillMap = new Map<string, TechnicianSkill[]>();
  for (const skill of skills ?? []) {
    skillMap.set(skill.technician_id, [
      ...(skillMap.get(skill.technician_id) ?? []),
      { id: skill.id, skill: skill.skill, level: skill.level },
    ]);
  }

  return (rows ?? []).map((row) => ({
    id: row.id,
    labId: row.lab_id,
    profileId: row.profile_id,
    displayName: row.display_name,
    phone: row.phone,
    employmentStatus: row.employment_status as Technician["employmentStatus"],
    productivityScore: Number(row.productivity_score),
    skills: skillMap.get(row.id) ?? [],
    hasPortalAccount: Boolean(row.profile_id),
    createdAt: row.created_at,
  }));
}

export async function getTechnicianById(
  session: AuthSessionContext,
  technicianId: string,
): Promise<Technician | null> {
  if (!hasSupabaseEnv()) return null;
  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();

  const [{ data: row, error }, { data: skills, error: skillsError }] = await Promise.all([
    supabase
      .from("technicians")
      .select("id, lab_id, profile_id, display_name, phone, employment_status, productivity_score, created_at")
      .eq("lab_id", labId)
      .eq("id", technicianId)
      .maybeSingle<TechnicianRow>(),
    supabase
      .from("technician_skills")
      .select("id, technician_id, skill, level")
      .eq("lab_id", labId)
      .eq("technician_id", technicianId)
      .returns<SkillRow[]>(),
  ]);

  if (error ?? skillsError) throw new Error((error ?? skillsError)?.message);
  if (!row) return null;

  return {
    id: row.id,
    labId: row.lab_id,
    profileId: row.profile_id,
    displayName: row.display_name,
    phone: row.phone,
    employmentStatus: row.employment_status as Technician["employmentStatus"],
    productivityScore: Number(row.productivity_score),
    skills: (skills ?? []).map((s) => ({ id: s.id, skill: s.skill, level: s.level })),
    hasPortalAccount: Boolean(row.profile_id),
    createdAt: row.created_at,
  };
}
