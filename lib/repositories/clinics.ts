import "server-only";
import { BaseRepository, type DbClient } from "./base";
import type { Database } from "@/types/database";
import { DatabaseError } from "@/lib/errors";

type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];

export class ClinicRepository extends BaseRepository<ClinicRow> {
  constructor(db: DbClient, labId: string) {
    super(db, "clinics", labId);
  }

  async listActive(): Promise<ClinicRow[]> {
    this.assertLabId();
    const { data, error } = await this.db
      .from("clinics")
      .select("*")
      .eq("lab_id", this.labId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw new DatabaseError("clinics.listActive", error);
    return data ?? [];
  }
}
