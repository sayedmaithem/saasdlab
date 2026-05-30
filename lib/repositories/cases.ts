import "server-only";
import { BaseRepository, type DbClient } from "./base";
import type { Database } from "@/types/database";
import { DatabaseError } from "@/lib/errors";

type CaseRow = Database["public"]["Tables"]["cases"]["Row"];

export type CaseListFilters = {
  status?: string;
  stage?: string;
  doctorId?: string;
  query?: string;
  overdue?: boolean;
  urgent?: boolean;
  limit?: number;
  offset?: number;
};

export class CaseRepository extends BaseRepository<CaseRow> {
  constructor(db: DbClient, labId: string) {
    super(db, "cases", labId);
  }

  async listWithDoctorClinic(filters: CaseListFilters = {}): Promise<CaseRow[]> {
    this.assertLabId();
    let query = this.db
      .from("cases")
      .select(`
        *,
        doctors:doctor_id(id, display_name),
        clinics:clinic_id(id, name)
      `)
      .eq("lab_id", this.labId)
      .order("created_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.stage) query = query.eq("stage", filters.stage as never);
    if (filters.doctorId) query = query.eq("doctor_id", filters.doctorId);
    if (filters.urgent) query = query.eq("is_urgent", true);
    if (filters.query) {
      query = query.or(
        `case_number.ilike.%${filters.query}%,patient_display.ilike.%${filters.query}%`,
      );
    }
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);

    const { data, error } = await query;
    if (error) throw new DatabaseError("cases.listWithDoctorClinic", error);
    return (data ?? []) as unknown as CaseRow[];
  }

  async findByNumber(caseNumber: string): Promise<CaseRow | null> {
    this.assertLabId();
    const { data, error } = await this.db
      .from("cases")
      .select("*")
      .eq("lab_id", this.labId)
      .eq("case_number", caseNumber)
      .maybeSingle();

    if (error) throw new DatabaseError("cases.findByNumber", error);
    return data;
  }

  async countByStatus(): Promise<Record<string, number>> {
    this.assertLabId();
    const { data, error } = await this.db
      .from("cases")
      .select("status")
      .eq("lab_id", this.labId);

    if (error) throw new DatabaseError("cases.countByStatus", error);

    return (data ?? []).reduce<Record<string, number>>((acc, row) => {
      const key = row.status ?? "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }

  async updateStage(
    id: string,
    stage: string,
    actorId: string,
    notes?: string,
  ): Promise<CaseRow> {
    this.assertLabId();
    const { data, error } = await this.db
      .from("cases")
      .update({ stage: stage as never, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("lab_id", this.labId)
      .select()
      .single();

    if (error || !data) throw new DatabaseError("cases.updateStage", error);

    // Fire-and-forget timeline entry
    void this.db.from("case_timeline").insert({
      case_id: id,
      lab_id: this.labId,
      event_type: "stage_change",
      actor_id: actorId,
      title: notes ?? `Stage changed to ${stage}`,
      metadata: { to_stage: stage },
    });

    return data;
  }
}
