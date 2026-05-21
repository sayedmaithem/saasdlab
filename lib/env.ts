const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Preview auth requires ALL three conditions:
 * 1. LABFLOW_DEV_PREVIEW=1 — explicit local-dev opt-in (never set in staging/production)
 * 2. Supabase env vars are absent — otherwise use real auth
 * 3. NODE_ENV !== "production" — hard stop for production deployments
 *
 * Without the explicit opt-in flag, missing Supabase env triggers a
 * configuration error instead of a silent fake session (fixing C3).
 */
export function canUsePreviewAuth() {
  return (
    process.env.LABFLOW_DEV_PREVIEW === "1" &&
    !hasSupabaseEnv() &&
    process.env.NODE_ENV !== "production"
  );
}

export function getSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}
