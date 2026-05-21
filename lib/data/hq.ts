import "server-only";
import { readdir } from "fs/promises";
import { join } from "path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export type HqPlatformStats = {
  labCount: number;
  userCount: number;
  migrationCount: number;
};

export type HqLabRow = {
  id: string;
  name: string;
  created_at: string | null;
};

/**
 * Platform-level stats for the SaaS Owner HQ.
 * Only callable by super_admin. Reads across ALL tenant labs.
 */
export async function getHqPlatformStats(): Promise<HqPlatformStats> {
  if (!hasSupabaseEnv()) {
    return { labCount: 1, userCount: 4, migrationCount: 18 };
  }

  const supabase = await createSupabaseServerClient();

  const [labsResult, usersResult] = await Promise.all([
    supabase.from("labs").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const labCount = labsResult.count ?? 0;
  const userCount = usersResult.count ?? 0;

  let migrationCount = 18; // fallback
  try {
    const migrationsDir = join(process.cwd(), "supabase", "migrations");
    const files = await readdir(migrationsDir);
    migrationCount = files.filter((f) => f.endsWith(".sql")).length;
  } catch {
    // filesystem read failed — use fallback
  }

  return { labCount, userCount, migrationCount };
}

/**
 * List of all labs for HQ overview table.
 * Only callable by super_admin.
 */
export async function getHqLabList(): Promise<HqLabRow[]> {
  if (!hasSupabaseEnv()) {
    return [
      {
        id: "00000000-0000-4000-8000-000000000001",
        name: "ODENT Lab (Preview)",
        created_at: new Date().toISOString(),
      },
    ];
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("labs")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<HqLabRow[]>();

  return data ?? [];
}
