"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { hasRole } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseAdminEnv, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasEmailProviderEnv, sendInviteEmail, sendTemporaryPasswordEmail } from "@/lib/email/resend";
import {
  generateInviteToken,
  hashInviteToken,
  buildInviteUrl,
  buildLoginUrl,
  inviteExpiresAt,
  inviteExpiryLabel,
} from "@/lib/auth/invitation-tokens";
import { CreatePortalUserSchema, type CreatePortalUserInput } from "@/lib/validations/users";
import { roleLabels } from "@/lib/constants/roles";
import type { AuthSessionContext } from "@/types/app";

// ── Result type ────────────────────────────────────────────────────────────

export type UserActionResult = {
  ok: boolean;
  message: string;
  userCreated?: boolean;
  inviteCreated?: boolean;
  emailSent?: boolean;
  mode?: "direct" | "invite_only" | "blocked";
};

// ── Session helpers ────────────────────────────────────────────────────────

type SessionWithLab = AuthSessionContext & { activeLabId: string };

async function requireManagerAccess(): Promise<
  { session: SessionWithLab; error: null } | { session: null; error: string }
> {
  const session = await requireAuth();
  if (!hasRole(session.roles, ["super_admin", "lab_owner", "lab_manager"])) {
    return { session: null, error: "Only lab owners and managers can manage portal accounts." };
  }
  if (!session.activeLabId) {
    return { session: null, error: "No active lab in session." };
  }
  return { session: session as SessionWithLab, error: null };
}

function parseFormInput(
  formData: FormData,
): Partial<CreatePortalUserInput> & { temporaryPassword?: string } {
  return {
    fullName: (formData.get("fullName") as string | null)?.trim() ?? "",
    email: (formData.get("email") as string | null)?.trim() ?? "",
    role:
      (formData.get("role") as CreatePortalUserInput["role"] | null) ?? undefined,
    temporaryPassword:
      (formData.get("temporaryPassword") as string | null)?.trim() || undefined,
    linkedRecordType:
      (formData.get("linkedRecordType") as CreatePortalUserInput["linkedRecordType"] | null) ||
      undefined,
    linkedRecordId:
      (formData.get("linkedRecordId") as string | null)?.trim() || undefined,
    isActive: formData.get("isActive") !== "false",
    sendEmail: formData.get("sendEmail") === "on",
    notes: (formData.get("notes") as string | null)?.trim() || undefined,
  };
}

// ── Audit log helper ───────────────────────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function writeAuditLog(
  supabase: SupabaseClient,
  labId: string,
  actorId: string,
  action: string,
  opts: {
    targetUserId?: string;
    role?: string;
    linkedRecordType?: string;
    linkedRecordId?: string;
    details?: Record<string, unknown>;
  } = {},
) {
  await supabase.from("access_audit_logs").insert({
    lab_id: labId,
    actor_user_id: actorId,
    target_user_id: opts.targetUserId ?? null,
    action,
    role: opts.role ?? null,
    linked_record_type: opts.linkedRecordType ?? null,
    linked_record_id: opts.linkedRecordId ?? null,
    details: opts.details ?? {},
  });
}

// ── ACTION 1: Create portal user or invite ─────────────────────────────────

/**
 * createPortalUserOrInviteAction
 *
 * Three operating modes resolved at runtime:
 *
 *  "direct"       — admin key + temporaryPassword present
 *                   → creates Auth user, profiles/user_roles, links record, audit log
 *                   → if sendEmail + email provider: sends account-ready email
 *
 *  "invite_only"  — no temporaryPassword
 *                   → generates token, stores hash in portal_invitations (status=pending)
 *                   → if sendEmail + email provider: sends invite email with accept URL
 *                   → if provider missing: records invite, shows manual link in response
 *
 *  "blocked"      — admin key missing
 *                   → creates pending invite record only, no Auth user
 *
 * Security invariants:
 *  - lab_owner/super_admin role blocked at schema + runtime
 *  - doctorId/technicianId verified to belong to activeLabId before linking
 *  - temporaryPassword never logged, returned, or stored
 *  - raw invite tokens never stored — only SHA-256 hash
 *  - all Auth-side failures recorded in portal_invitations with status=failed
 */
export async function createPortalUserOrInviteAction(
  formData: FormData,
): Promise<UserActionResult> {
  const access = await requireManagerAccess();
  if (!access.session) return { ok: false, message: access.error ?? "Unauthorized." };
  const session = access.session;

  const raw = parseFormInput(formData);
  const parsed = CreatePortalUserSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues?.[0];
    return { ok: false, message: first?.message ?? "Validation failed." };
  }
  const input = parsed.data;

  // Belt-and-suspenders role guard (schema enum already blocks, but be explicit)
  if (
    input.role === ("lab_owner" as string) ||
    input.role === ("super_admin" as string)
  ) {
    return {
      ok: false,
      message: "Cannot create lab_owner or super_admin via this console.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const labName = session.labName ?? "LabFlow";
  const roleLabel = roleLabels[input.role] ?? input.role;

  // ── BLOCKED: no admin key ──────────────────────────────────────────────
  if (!hasSupabaseAdminEnv()) {
    await supabase.from("portal_invitations").insert({
      lab_id: session.activeLabId,
      email: input.email,
      full_name: input.fullName,
      role: input.role,
      linked_record_type: input.linkedRecordType ?? null,
      linked_record_id: input.linkedRecordId ?? null,
      status: "pending",
      invited_by: session.userId,
      expires_at: inviteExpiresAt(),
      metadata: { notes: input.notes ?? null, blocked_reason: "admin_key_not_configured" },
    });
    await writeAuditLog(supabase, session.activeLabId, session.userId, "invite_pending_blocked", {
      role: input.role,
      details: { email_domain: input.email.split("@")[1], reason: "admin_key_not_configured" },
    });
    revalidatePath("/command-center/users");
    return {
      ok: false,
      message:
        "Server admin key not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local. " +
        "An invite record has been saved.",
      mode: "blocked",
    };
  }

  // ── INVITE-ONLY: no password ────────────────────────────────────────────
  if (!input.temporaryPassword) {
    const rawToken = generateInviteToken();
    const tokenHash = hashInviteToken(rawToken);
    const expiresAt = inviteExpiresAt();

    await supabase.from("portal_invitations").insert({
      lab_id: session.activeLabId,
      email: input.email,
      full_name: input.fullName,
      role: input.role,
      linked_record_type: input.linkedRecordType ?? null,
      linked_record_id: input.linkedRecordId ?? null,
      status: "pending",
      token_hash: tokenHash,
      invited_by: session.userId,
      expires_at: expiresAt,
      metadata: { notes: input.notes ?? null },
    });

    await writeAuditLog(supabase, session.activeLabId, session.userId, "invite_record_created", {
      role: input.role,
      linkedRecordType: input.linkedRecordType,
      linkedRecordId: input.linkedRecordId,
      details: { email_domain: input.email.split("@")[1] },
    });

    let emailSent = false;
    let emailWarning = "";

    if (input.sendEmail) {
      if (hasEmailProviderEnv()) {
        const result = await sendInviteEmail({
          to: input.email,
          recipientName: input.fullName,
          labName,
          roleLabel,
          inviteUrl: buildInviteUrl(rawToken),
          expiresAt: inviteExpiryLabel(expiresAt),
        });
        emailSent = result.ok;
        if (!result.ok) {
          emailWarning = ` Email delivery failed: ${result.error ?? result.reason}.`;
        }
      } else {
        emailWarning = " Email provider not configured — invite not emailed.";
      }
    }

    revalidatePath("/command-center/users");
    return {
      ok: true,
      message:
        `Invite record created for ${input.email} (${roleLabel}).${emailSent ? " Invite email sent." : emailWarning}` +
        (!emailSent && !input.sendEmail
          ? " Share credentials manually or configure Resend to send email invites."
          : ""),
      inviteCreated: true,
      emailSent,
      mode: "invite_only",
    };
  }

  // ── DIRECT CREATION: admin key + password ───────────────────────────────
  const admin = createSupabaseAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      lab_id: session.activeLabId,
      role: input.role,
    },
  });

  if (authError || !authData.user) {
    await supabase.from("portal_invitations").insert({
      lab_id: session.activeLabId,
      email: input.email,
      full_name: input.fullName,
      role: input.role,
      status: "failed",
      invited_by: session.userId,
      metadata: { error: authError?.message ?? "unknown", notes: input.notes ?? null },
    });
    await writeAuditLog(supabase, session.activeLabId, session.userId, "user_creation_failed", {
      role: input.role,
      details: { email_domain: input.email.split("@")[1], error: authError?.message ?? "unknown" },
    });
    return {
      ok: false,
      message:
        authError?.message ?? "Failed to create auth user. The email may already be in use.",
    };
  }

  const newUserId = authData.user.id;

  // Upsert profile — protects existing lab assignments per migration 0014 contract
  await admin.from("profiles").upsert(
    {
      id: newUserId,
      lab_id: session.activeLabId,
      full_name: input.fullName,
      email: input.email,
      role: input.role,
      is_active: input.isActive,
    },
    { onConflict: "id", ignoreDuplicates: false },
  );

  // Upsert user_roles
  await admin
    .from("user_roles")
    .upsert(
      {
        lab_id: session.activeLabId,
        user_id: newUserId,
        role: input.role,
        is_active: input.isActive,
      },
      { onConflict: "lab_id,user_id,role" },
    );

  // Link to technician record if applicable (verified to belong to this lab)
  if (input.role === "technician" && input.linkedRecordId) {
    const { data: tech } = await admin
      .from("technicians")
      .select("id")
      .eq("id", input.linkedRecordId)
      .eq("lab_id", session.activeLabId)
      .maybeSingle();
    if (tech) {
      await admin
        .from("technicians")
        .update({ profile_id: newUserId, updated_at: new Date().toISOString() })
        .eq("id", input.linkedRecordId)
        .eq("lab_id", session.activeLabId);
    }
  }

  // Link to doctor record if applicable (verified to belong to this lab)
  if (input.role === "doctor" && input.linkedRecordId) {
    const { data: doc } = await admin
      .from("doctors")
      .select("id")
      .eq("id", input.linkedRecordId)
      .eq("lab_id", session.activeLabId)
      .maybeSingle();
    if (doc) {
      await admin
        .from("doctors")
        .update({ profile_id: newUserId })
        .eq("id", input.linkedRecordId)
        .eq("lab_id", session.activeLabId);
    }
  }

  // Invite record — status pending_internal (accepted once user logs in)
  await supabase.from("portal_invitations").insert({
    lab_id: session.activeLabId,
    email: input.email,
    full_name: input.fullName,
    role: input.role,
    linked_record_type: input.linkedRecordType ?? null,
    linked_record_id: input.linkedRecordId ?? null,
    status: "pending_internal",
    invited_by: session.userId,
    accepted_at: new Date().toISOString(),
    metadata: { notes: input.notes ?? null, is_active: input.isActive },
  });

  // Audit log — never include the password
  await writeAuditLog(supabase, session.activeLabId, session.userId, "user_created_direct", {
    targetUserId: newUserId,
    role: input.role,
    linkedRecordType: input.linkedRecordType,
    linkedRecordId: input.linkedRecordId,
    details: { email_domain: input.email.split("@")[1], is_active: input.isActive },
  });

  // Optional notification email (no password in email — just a heads-up)
  let emailSent = false;
  let emailWarning = "";
  if (input.sendEmail) {
    if (hasEmailProviderEnv()) {
      const result = await sendTemporaryPasswordEmail({
        to: input.email,
        recipientName: input.fullName,
        labName,
        roleLabel,
        loginUrl: buildLoginUrl(),
      });
      emailSent = result.ok;
      if (!result.ok) emailWarning = ` Email failed: ${result.error ?? result.reason}.`;
    } else {
      emailWarning = " Email provider not configured — share credentials manually.";
    }
  }

  revalidatePath("/command-center/users");
  revalidatePath("/command-center/users/new");
  if (input.role === "technician") {
    revalidatePath("/technicians");
    if (input.linkedRecordId) revalidatePath(`/technicians/${input.linkedRecordId}/edit`);
  }
  if (input.role === "doctor") {
    revalidatePath("/doctors");
    if (input.linkedRecordId) revalidatePath(`/doctors/${input.linkedRecordId}/edit`);
  }

  return {
    ok: true,
    message:
      `Account created for ${input.email} (${roleLabel}).${emailSent ? " Notification email sent." : emailWarning} ` +
      "Share the temporary password securely — the user must change it on first login.",
    userCreated: true,
    emailSent,
    mode: "direct",
  };
}

// ── ACTION 2: Resend invite ────────────────────────────────────────────────

/**
 * resendPortalInviteAction
 *
 * Generates a fresh token, updates the invite record with a new hash and
 * extended expiry, and re-sends the invite email if the provider is configured.
 *
 * Requires email provider — if missing, returns clear error.
 * Blocked for accepted/revoked invites.
 */
export async function resendPortalInviteAction(
  invitationId: string,
): Promise<UserActionResult> {
  const access = await requireManagerAccess();
  if (!access.session) return { ok: false, message: access.error ?? "Unauthorized." };
  const session = access.session;

  if (!invitationId) return { ok: false, message: "Missing invitation ID." };

  const supabase = await createSupabaseServerClient();

  // Fetch and verify ownership in one query
  const { data: invite, error: fetchError } = await supabase
    .from("portal_invitations")
    .select("id, email, full_name, role, status, lab_id")
    .eq("id", invitationId)
    .eq("lab_id", session.activeLabId) // cross-lab guard
    .maybeSingle<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      status: string;
      lab_id: string;
    }>();

  if (fetchError) return { ok: false, message: fetchError.message };
  if (!invite) return { ok: false, message: "Invite not found or does not belong to this lab." };
  if (invite.status === "revoked") return { ok: false, message: "Cannot resend a revoked invite." };
  if (invite.status === "accepted") return { ok: false, message: "This invite has already been accepted." };

  if (!hasEmailProviderEnv()) {
    return {
      ok: false,
      message:
        "Email provider not configured. Add RESEND_API_KEY and EMAIL_FROM to .env.local to resend invites.",
    };
  }

  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = inviteExpiresAt();

  const { error: updateError } = await supabase
    .from("portal_invitations")
    .update({ token_hash: tokenHash, expires_at: expiresAt, status: "pending", updated_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("lab_id", session.activeLabId);

  if (updateError) return { ok: false, message: updateError.message };

  const labName = session.labName ?? "LabFlow";
  const roleLabel = roleLabels[invite.role as keyof typeof roleLabels] ?? invite.role;

  const emailResult = await sendInviteEmail({
    to: invite.email,
    recipientName: invite.full_name ?? invite.email,
    labName,
    roleLabel,
    inviteUrl: buildInviteUrl(rawToken),
    expiresAt: inviteExpiryLabel(expiresAt),
  });

  await writeAuditLog(supabase, session.activeLabId, session.userId, "invite_resent", {
    role: invite.role,
    details: { email_domain: invite.email.split("@")[1], email_sent: emailResult.ok },
  });

  revalidatePath("/command-center/users");

  if (!emailResult.ok) {
    return {
      ok: false,
      message: `Token refreshed but email delivery failed: ${emailResult.error ?? emailResult.reason}`,
    };
  }

  return { ok: true, message: `Invite resent to ${invite.email}.`, emailSent: true };
}

// ── ACTION 3: Revoke invite ────────────────────────────────────────────────

/**
 * revokePortalInviteAction
 *
 * Marks a pending invite as revoked. The auth user (if created) is not deleted.
 * An audit log entry records the revocation.
 */
export async function revokePortalInviteAction(
  invitationId: string,
): Promise<UserActionResult> {
  const access = await requireManagerAccess();
  if (!access.session) return { ok: false, message: access.error ?? "Unauthorized." };
  const session = access.session;

  if (!invitationId) return { ok: false, message: "Missing invitation ID." };

  const supabase = await createSupabaseServerClient();

  const { data: invite, error: fetchError } = await supabase
    .from("portal_invitations")
    .select("id, email, role, status, lab_id")
    .eq("id", invitationId)
    .eq("lab_id", session.activeLabId) // cross-lab guard
    .maybeSingle<{
      id: string;
      email: string;
      role: string;
      status: string;
      lab_id: string;
    }>();

  if (fetchError) return { ok: false, message: fetchError.message };
  if (!invite) return { ok: false, message: "Invite not found or does not belong to this lab." };
  if (invite.status === "accepted") {
    return {
      ok: false,
      message: "Cannot revoke an accepted invite. Use deactivate account instead.",
    };
  }

  const { error: updateError } = await supabase
    .from("portal_invitations")
    .update({ status: "revoked", revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("lab_id", session.activeLabId);

  if (updateError) return { ok: false, message: updateError.message };

  await writeAuditLog(supabase, session.activeLabId, session.userId, "invite_revoked", {
    role: invite.role,
    details: { email_domain: invite.email.split("@")[1] },
  });

  revalidatePath("/command-center/users");
  return { ok: true, message: `Invite for ${invite.email} has been revoked.` };
}

// ── ACTION 4: Deactivate user ──────────────────────────────────────────────

/**
 * deactivatePortalUserAction
 *
 * Soft-deactivates: sets profiles.is_active = false + user_roles.is_active = false.
 * Does NOT delete the auth.users row — that must be done in Supabase Dashboard.
 * Writes an audit log entry.
 */
export async function deactivatePortalUserAction(
  userId: string,
): Promise<UserActionResult> {
  const access = await requireManagerAccess();
  if (!access.session) return { ok: false, message: access.error ?? "Unauthorized." };
  const session = access.session;

  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return { ok: false, message: "Invalid user ID." };
  }
  if (userId === session.userId) {
    return { ok: false, message: "You cannot deactivate your own account." };
  }

  const supabase = await createSupabaseServerClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId)
    .eq("lab_id", session.activeLabId);

  if (profileError) return { ok: false, message: profileError.message };

  await supabase
    .from("user_roles")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("lab_id", session.activeLabId);

  await writeAuditLog(supabase, session.activeLabId, session.userId, "user_deactivated", {
    targetUserId: userId,
    details: { deactivated_by: session.userId },
  });

  revalidatePath("/command-center/users");
  return {
    ok: true,
    message: "Account deactivated. The auth user still exists in Supabase — delete it there if needed.",
  };
}
