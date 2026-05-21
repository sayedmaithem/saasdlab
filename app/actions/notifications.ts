"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NotificationActionResult = { ok: boolean; message: string };

/**
 * Mark a single notification as read.
 * RLS policy ensures the user can only update their own notifications.
 */
export async function markNotificationReadAction(
  id: string,
): Promise<NotificationActionResult> {
  try {
    const session = await requireAuth();
    if (!session.activeLabId) {
      return { ok: false, message: "No active lab" };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("lab_id", session.activeLabId);

    if (error) return { ok: false, message: error.message };

    revalidatePath("/", "layout");
    return { ok: true, message: "Marked as read" };
  } catch {
    return { ok: false, message: "Failed to mark as read" };
  }
}

/**
 * Mark all unread notifications as read for the current user + lab.
 * RLS restricts updates to the authenticated user's own notifications.
 */
export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  try {
    const session = await requireAuth();
    if (!session.activeLabId) {
      return { ok: false, message: "No active lab" };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("lab_id", session.activeLabId)
      .eq("status", "unread");

    if (error) return { ok: false, message: error.message };

    revalidatePath("/", "layout");
    return { ok: true, message: "All notifications marked as read" };
  } catch {
    return { ok: false, message: "Failed to mark all as read" };
  }
}
