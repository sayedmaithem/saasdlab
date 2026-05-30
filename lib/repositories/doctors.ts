import "server-only";
import { BaseRepository, type DbClient } from "./base";
import type { Database } from "@/types/database";
import { DatabaseError } from "@/lib/errors";

type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];

export class DoctorRepository extends BaseRepository<DoctorRow> {
  constructor(db: DbClient, labId: string) {
    super(db, "doctors", labId);
  }

  async listActive(): Promise<DoctorRow[]> {
    this.assertLabId();
    const { data, error } = await this.db
      .from("doctors")
      .select("*, clinics:default_clinic_id(id, name)")
      .eq("lab_id", this.labId)
      .eq("is_active", true)
      .order("display_name", { ascending: true });

    if (error) throw new DatabaseError("doctors.listActive", error);
    return (data ?? []) as DoctorRow[];
  }

  async findByProfileId(profileId: string): Promise<DoctorRow | null> {
    this.assertLabId();
    const { data, error } = await this.db
      .from("doctors")
      .select("*")
      .eq("lab_id", this.labId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) throw new DatabaseError("doctors.findByProfileId", error);
    return data;
  }

  async updatePerformanceScore(id: string, score: number): Promise<void> {
    this.assertLabId();
    const { error } = await this.db
      .from("doctors")
      .update({ performance_score: score })
      .eq("id", id)
      .eq("lab_id", this.labId);

    if (error) throw new DatabaseError("doctors.updatePerformanceScore", error);
  }
}
