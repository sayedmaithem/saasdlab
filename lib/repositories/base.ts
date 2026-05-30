import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { DatabaseError, NotFoundError } from "@/lib/errors";

export type DbClient = SupabaseClient<Database>;

export abstract class BaseRepository<TRow extends { id: string }> {
  constructor(
    protected readonly db: DbClient,
    protected readonly table: string,
    protected readonly labId: string,
  ) {}

  protected assertLabId() {
    if (!this.labId) throw new DatabaseError("query", "labId is required — multi-tenant isolation violated");
  }

  async findById(id: string): Promise<TRow> {
    this.assertLabId();
    const { data, error } = await this.db
      .from(this.table as never)
      .select("*")
      .eq("id", id)
      .eq("lab_id", this.labId)
      .single();

    if (error || !data) throw new NotFoundError(this.table, id);
    return data as TRow;
  }

  async findAll(filters?: Record<string, unknown>): Promise<TRow[]> {
    this.assertLabId();
    let query = this.db
      .from(this.table as never)
      .select("*")
      .eq("lab_id", this.labId);

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key as never, value as never);
        }
      }
    }

    const { data, error } = await query;
    if (error) throw new DatabaseError(`findAll(${this.table})`, error);
    return (data ?? []) as TRow[];
  }

  async create(payload: Omit<TRow, "id" | "created_at" | "updated_at">): Promise<TRow> {
    this.assertLabId();
    const { data, error } = await this.db
      .from(this.table as never)
      .insert({ ...payload, lab_id: this.labId } as never)
      .select()
      .single();

    if (error || !data) throw new DatabaseError(`create(${this.table})`, error);
    return data as TRow;
  }

  async update(id: string, patch: Partial<Omit<TRow, "id" | "lab_id">>): Promise<TRow> {
    this.assertLabId();
    const { data, error } = await this.db
      .from(this.table as never)
      .update(patch as never)
      .eq("id", id)
      .eq("lab_id", this.labId)
      .select()
      .single();

    if (error || !data) throw new DatabaseError(`update(${this.table})`, error);
    return data as TRow;
  }

  async delete(id: string): Promise<void> {
    this.assertLabId();
    const { error } = await this.db
      .from(this.table as never)
      .delete()
      .eq("id", id)
      .eq("lab_id", this.labId);

    if (error) throw new DatabaseError(`delete(${this.table})`, error);
  }

  async count(filters?: Record<string, unknown>): Promise<number> {
    this.assertLabId();
    let query = this.db
      .from(this.table as never)
      .select("*", { count: "exact", head: true })
      .eq("lab_id", this.labId);

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key as never, value as never);
        }
      }
    }

    const { count, error } = await query;
    if (error) throw new DatabaseError(`count(${this.table})`, error);
    return count ?? 0;
  }
}
