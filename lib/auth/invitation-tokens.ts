/**
 * Invitation token utilities — SERVER ONLY
 *
 * Security model:
 *  - Raw tokens are NEVER stored in the database or logged.
 *  - Only the SHA-256 hex hash is stored in portal_invitations.token_hash.
 *  - Tokens are 32 random bytes encoded as hex (256 bits of entropy).
 *  - Invite URLs include the raw token as a query parameter; the server
 *    hashes it on receipt and looks up the hash.
 *  - Tokens expire after 7 days (configurable per invite).
 */
import "server-only";

import { createHash, randomBytes } from "crypto";

// ── Token generation ───────────────────────────────────────────────────────

/**
 * Generates a cryptographically secure invite token.
 * Returns the RAW token — do NOT store this directly.
 * Pass through hashInviteToken() before writing to the database.
 */
export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Returns the SHA-256 hex digest of the given raw token.
 * This is what gets stored in portal_invitations.token_hash.
 */
export function hashInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

// ── URL builders ──────────────────────────────────────────────────────────

/**
 * Constructs the accept-invite URL that goes into the email.
 * Example: https://app.labflow.ae/auth/accept-invite?token=abc123...
 *
 * The raw token is in the URL — this is safe because:
 *  1. It is one-time-use (token is invalidated on acceptance)
 *  2. It expires after 7 days
 *  3. The server validates the hash before taking any action
 *  4. No sensitive data is embedded in the token itself
 */
export function buildInviteUrl(rawToken: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/auth/accept-invite?token=${rawToken}`;
}

/** Login URL for direct-account emails (no token needed). */
export function buildLoginUrl(): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/auth`;
}

// ── Expiry helpers ────────────────────────────────────────────────────────

/** Default invite TTL: 7 days. */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Returns an ISO timestamp for 7 days from now. */
export function inviteExpiresAt(): string {
  return new Date(Date.now() + INVITE_TTL_MS).toISOString();
}

/** Returns a human-readable expiry string for email templates. */
export function inviteExpiryLabel(expiresAt: string): string {
  try {
    return new Date(expiresAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return expiresAt;
  }
}

/**
 * Returns true if the invite has passed its expiry timestamp.
 * Null / undefined expiresAt means no expiry (internal accounts).
 */
export function isInviteExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}
