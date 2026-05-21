import "server-only";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSessionContext } from "@/types/app";

export type MovementLogEntry = {
  id: string;
  caseId: string;
  caseNumber: string;
  patientName: string | null;
  doctorName: string | null;
  eventType: string;
  title: string;
  metadata: Record<string, unknown> | null;
  actorId: string | null;
  createdAt: string;
};

export async function getMovementLog(
  session: AuthSessionContext,
  limit = 60,
): Promise<MovementLogEntry[]> {
  const labId = session.activeLabId;
  if (!labId || !hasSupabaseEnv()) return [];

  try {
    const supabase = await createSupabaseServerClient();

    type TimelineRow = {
      id: string;
      case_id: string;
      event_type: string | null;
      title: string | null;
      metadata: Record<string, unknown> | null;
      actor_id: string | null;
      created_at: string;
      cases: {
        case_number: string;
        patient_name: string | null;
        doctors: { display_name: string } | null;
      } | null;
    };

    const { data, error } = await supabase
      .from("case_timeline")
      .select(`
        id,
        event_type,
        title,
        metadata,
        actor_id,
        created_at,
        case_id,
        cases (
          case_number,
          patient_name,
          doctors ( display_name )
        )
      `)
      .eq("lab_id", labId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .returns<TimelineRow[]>();

    if (error || !data) return [];

    return data.map((row) => {
      const caseData = row.cases;
      return {
        id: row.id,
        caseId: row.case_id,
        caseNumber: caseData?.case_number ?? "—",
        patientName: caseData?.patient_name ?? null,
        doctorName: caseData?.doctors?.display_name ?? null,
        eventType: row.event_type ?? "event",
        title: row.title ?? "Event",
        metadata: row.metadata,
        actorId: row.actor_id,
        createdAt: row.created_at,
      };
    });
  } catch {
    return [];
  }
}
