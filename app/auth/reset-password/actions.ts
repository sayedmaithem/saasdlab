"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

/**
 * sendPasswordResetAction
 *
 * Triggers Supabase Auth's built-in resetPasswordForEmail.
 * Supabase sends an email with a recovery link pointing to APP_URL/auth/callback.
 *
 * Security notes:
 *  - Always returns the same success response regardless of whether the email
 *    exists — prevents email enumeration attacks.
 *  - Redirect URL must match the allowed redirect URLs in Supabase dashboard.
 *  - Does NOT use a custom SMTP provider in this phase — Supabase's built-in
 *    email handles delivery. Phase 15 adds Resend for branded reset emails.
 */
export async function sendPasswordResetAction(formData: FormData): Promise<void> {
  if (!hasSupabaseEnv()) return;

  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  if (!email) return;

  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = `${appUrl}/auth/callback?next=/dashboard`;

  const supabase = await createSupabaseServerClient();

  // Fire-and-forget — we never reveal whether the email exists
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });
}
