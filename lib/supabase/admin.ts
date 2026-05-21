/**
 * Supabase Admin Client — SERVER ONLY
 *
 * Uses the service-role key which bypasses all RLS policies.
 * This file MUST NEVER be imported from client components.
 *
 * Capabilities unlocked by this client:
 *  - createUser / inviteUserByEmail via auth.admin API
 *  - Direct profile/user_roles writes without RLS checks
 *
 * All callers are responsible for enforcing their own authorization checks
 * (e.g. verifying the calling session is lab_owner/super_admin) before
 * using this client. This client does not check roles itself.
 */
import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** True only when both the Supabase URL and service-role key are configured. */
export function hasSupabaseAdminEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Returns a Supabase client authenticated as the service role.
 *
 * - autoRefreshToken: false — server processes don't refresh tokens
 * - persistSession: false  — stateless, no cookie/localStorage needed
 *
 * Throws if the required environment variables are absent so callers
 * always get an explicit error rather than a silent no-op.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not configured. " +
        "Add them to .env.local to enable server-side user management.",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
