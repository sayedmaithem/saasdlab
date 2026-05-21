export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { hashInviteToken, isInviteExpired } from "@/lib/auth/invitation-tokens";
import { roleLabels } from "@/lib/constants/roles";

type Params = { searchParams: Promise<{ token?: string }> };

/**
 * Accept-invite page.
 *
 * Validates the token hash server-side and shows the invite details.
 * For direct-account (pending_internal) invites, directs the user to log in.
 * For pending invites, shows the invite details and next-step instructions.
 *
 * Full password-set-on-accept flow is deferred to Phase 15 (requires
 * Supabase Auth magic link or email OTP integration for safe password reset
 * without exposing admin client to the accept form).
 */
export default async function AcceptInvitePage({ searchParams }: Params) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card>
        <CardHeader><CardTitle>Invalid invitation</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No invitation token was provided. Check that you followed the correct link from your
            invitation email.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!hasSupabaseAdminEnv()) {
    return (
      <Card>
        <CardHeader><CardTitle>Setup required</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The server admin key is not configured. Ask your lab administrator to complete the
            LabFlow setup before following this link.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Hash the raw token and look it up — never store or compare raw tokens
  const tokenHash = hashInviteToken(token);
  const admin = createSupabaseAdminClient();

  const { data: invite, error } = await admin
    .from("portal_invitations")
    .select("id, email, full_name, role, status, expires_at, lab_id")
    .eq("token_hash", tokenHash)
    .maybeSingle<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      status: string;
      expires_at: string | null;
      lab_id: string;
    }>();

  if (error || !invite) {
    return (
      <Card>
        <CardHeader><CardTitle>Invitation not found</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This invitation link is invalid or has already been used. Ask your lab administrator to
            send a new invite.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (invite.status === "revoked") {
    return (
      <Card>
        <CardHeader><CardTitle>Invitation revoked</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This invitation has been revoked by your lab administrator. Ask them for a new invite.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (invite.status === "accepted" || invite.status === "pending_internal") {
    return (
      <Card>
        <CardHeader><CardTitle>Account already active</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your account for <span className="font-medium text-foreground">{invite.email}</span> is
            already set up. You can sign in directly.
          </p>
          <a
            href="/auth"
            className="inline-block rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign in →
          </a>
        </CardContent>
      </Card>
    );
  }

  if (isInviteExpired(invite.expires_at)) {
    return (
      <Card>
        <CardHeader><CardTitle>Invitation expired</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This invitation expired on{" "}
            {invite.expires_at
              ? new Date(invite.expires_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "an unknown date"}
            . Ask your lab administrator to send a new invite.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Valid pending invite — show details and direct to log in
  // Full password-set flow (Phase 15): requires magic-link or email-OTP
  // so the user can set their password without the admin creating it first.
  const roleLabel = roleLabels[invite.role as keyof typeof roleLabels] ?? invite.role;

  return (
    <Card>
      <CardHeader>
        <CardTitle>You have been invited</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{invite.email}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span>{" "}
            <span className="font-medium">{roleLabel}</span>
          </p>
          {invite.expires_at && (
            <p className="text-xs text-muted-foreground">
              Invite expires{" "}
              {new Date(invite.expires_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
            Next step: ask your administrator for your temporary password
          </p>
          <p className="text-amber-700 dark:text-amber-400 text-xs">
            Your lab administrator will share a temporary password with you securely (in person or
            via an encrypted message). Once you have it, sign in and change your password
            immediately.
          </p>
          <p className="text-amber-600 dark:text-amber-500 text-xs mt-2">
            Email-based password setup is coming in the next phase.
          </p>
        </div>

        <a
          href="/auth"
          className="inline-block rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign in to LabFlow →
        </a>
      </CardContent>
    </Card>
  );
}
