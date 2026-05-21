import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  caseId: string | null;
  actionUrl: string | null;
  priority: string;
  isRead: boolean;
  createdAt: string;
};

// ── Raw DB row ────────────────────────────────────────────────────────────────

type NotifRow = {
  id: string;
  type: string | null;
  title: string;
  body: string | null;
  case_id: string | null;
  action_url: string | null;
  priority: string | null;
  status: string;
  created_at: string;
};

// ── Query ─────────────────────────────────────────────────────────────────────

/**
 * Load the most recent 40 notifications for the current authenticated user.
 * Filters by recipient_id = auth.uid() via RLS — no extra filtering needed.
 * Falls back to [] if Supabase is not configured.
 */
export async function getNotificationsForCurrentUser(
  labId: string,
): Promise<NotificationItem[]> {
  if (!hasSupabaseEnv() || !labId) return [];

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, case_id, action_url, priority, status, created_at")
    .eq("lab_id", labId)
    .not("status", "eq", "archived")
    .order("created_at", { ascending: false })
    .limit(40)
    .returns<NotifRow[]>();

  if (error) {
    // Don't crash the whole page — just return empty (notification load failure is non-critical)
    console.error("[notifications] load error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type ?? "general",
    title: row.title,
    body: row.body,
    caseId: row.case_id,
    actionUrl: row.action_url,
    priority: row.priority ?? "normal",
    isRead: row.status === "read",
    createdAt: row.created_at,
  }));
}
