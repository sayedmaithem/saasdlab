/**
 * Resend Email Provider — SERVER ONLY
 *
 * Uses RESEND_API_KEY which must never be exposed to the browser.
 * All functions return structured results — never throw to callers.
 *
 * Guard pattern: every exported function calls hasEmailProviderEnv()
 * first and returns { ok: false, reason: "provider_not_configured" }
 * rather than throwing when the key is absent.
 */
import "server-only";

export type EmailResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: "provider_not_configured" | "send_failed"; error?: string };

/** True only when RESEND_API_KEY and EMAIL_FROM are both present. */
export function hasEmailProviderEnv(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "noreply@labflow.app";
  if (!apiKey) return null;
  return { apiKey, from };
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const config = getResendConfig();
  if (!config) {
    return { ok: false, reason: "provider_not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { ok: false, reason: "send_failed", error: `HTTP ${response.status}: ${body}` };
    }

    const data = (await response.json()) as { id?: string };
    return { ok: true, messageId: data.id ?? "unknown" };
  } catch (err) {
    return {
      ok: false,
      reason: "send_failed",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ── Public send functions ──────────────────────────────────────────────────

export async function sendInviteEmail(params: {
  to: string;
  recipientName: string;
  labName: string;
  roleLabel: string;
  inviteUrl: string;
  expiresAt: string;
}): Promise<EmailResult> {
  if (!hasEmailProviderEnv()) {
    return { ok: false, reason: "provider_not_configured" };
  }

  const { html, text } = buildInviteEmailContent(params);

  return sendEmail({
    to: params.to,
    subject: `You've been invited to ${params.labName} on LabFlow`,
    html,
    text,
  });
}

export async function sendTemporaryPasswordEmail(params: {
  to: string;
  recipientName: string;
  labName: string;
  roleLabel: string;
  loginUrl: string;
}): Promise<EmailResult> {
  if (!hasEmailProviderEnv()) {
    return { ok: false, reason: "provider_not_configured" };
  }

  const { html, text } = buildTempPasswordEmailContent(params);

  return sendEmail({
    to: params.to,
    subject: `Your LabFlow account is ready — ${params.labName}`,
    html,
    text,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  recipientName: string;
  resetUrl: string;
  labName: string;
}): Promise<EmailResult> {
  if (!hasEmailProviderEnv()) {
    return { ok: false, reason: "provider_not_configured" };
  }

  const { html, text } = buildPasswordResetEmailContent(params);

  return sendEmail({
    to: params.to,
    subject: "Reset your LabFlow password",
    html,
    text,
  });
}

// ── Email content builders (inline for zero deps) ─────────────────────────

function emailShell(title: string, body: string): { html: string; text: string } {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:#1a1a2e;padding:24px 32px;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">LabFlow</p>
        </td></tr>
        <tr><td style="padding:32px;">
          ${body}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            This is an automated message from LabFlow Dental CRM.
            Do not reply to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { html, text: "" }; // text is set per template
}

function buildInviteEmailContent(params: {
  recipientName: string;
  labName: string;
  roleLabel: string;
  inviteUrl: string;
  expiresAt: string;
}) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">You've been invited</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Hi ${params.recipientName}, you have been invited to join
      <strong style="color:#111827;">${params.labName}</strong>
      as a <strong style="color:#111827;">${params.roleLabel}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="background:#1a1a2e;border-radius:8px;padding:12px 28px;">
        <a href="${params.inviteUrl}"
           style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">
          Accept invitation →
        </a>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
      This invitation expires on ${params.expiresAt}.
    </p>
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      If you did not expect this invitation, you can safely ignore this email.
    </p>`;

  const { html } = emailShell(`Invitation to ${params.labName}`, body);
  const text = `You've been invited to join ${params.labName} as ${params.roleLabel}.\n\nAccept your invitation: ${params.inviteUrl}\n\nExpires: ${params.expiresAt}`;
  return { html, text };
}

function buildTempPasswordEmailContent(params: {
  recipientName: string;
  labName: string;
  roleLabel: string;
  loginUrl: string;
}) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Your account is ready</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Hi ${params.recipientName}, your LabFlow account for
      <strong style="color:#111827;">${params.labName}</strong>
      has been created with the role of <strong style="color:#111827;">${params.roleLabel}</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#374151;">
      Your administrator will share your temporary password with you securely.
    </p>
    <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">
        ⚠ Change your password immediately after first login.
      </p>
    </div>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="background:#1a1a2e;border-radius:8px;padding:12px 28px;">
        <a href="${params.loginUrl}"
           style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">
          Log in to LabFlow →
        </a>
      </td></tr>
    </table>`;

  const { html } = emailShell(`Your ${params.labName} account is ready`, body);
  const text = `Hi ${params.recipientName},\n\nYour LabFlow account for ${params.labName} is ready. Log in at: ${params.loginUrl}\n\nIMPORTANT: Change your password immediately after first login.`;
  return { html, text };
}

function buildPasswordResetEmailContent(params: {
  recipientName: string;
  resetUrl: string;
  labName: string;
}) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Reset your password</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Hi ${params.recipientName}, we received a request to reset your LabFlow password for
      <strong style="color:#111827;">${params.labName}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="background:#1a1a2e;border-radius:8px;padding:12px 28px;">
        <a href="${params.resetUrl}"
           style="color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">
          Reset password →
        </a>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      If you did not request a password reset, you can safely ignore this email.
      This link expires in 1 hour.
    </p>`;

  const { html } = emailShell("Reset your LabFlow password", body);
  const text = `Reset your LabFlow password: ${params.resetUrl}\n\nIf you didn't request this, ignore this email.`;
  return { html, text };
}
