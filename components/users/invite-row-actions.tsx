"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resendPortalInviteAction, revokePortalInviteAction } from "@/app/actions/users";

export function InviteRowActions({
  invitationId,
  status,
  emailProviderConfigured,
}: {
  invitationId: string;
  status: string;
  emailProviderConfigured: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  if (status === "revoked" || status === "accepted") return null;

  function handleResend() {
    startTransition(async () => {
      const result = await resendPortalInviteAction(invitationId);
      setFeedback(result);
    });
  }

  function handleRevoke() {
    if (
      !confirm(
        "Revoke this invitation? The link will stop working and the user will need a new invite.",
      )
    )
      return;
    startTransition(async () => {
      const result = await revokePortalInviteAction(invitationId);
      setFeedback(result);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className="flex gap-2">
        {status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleResend}
            disabled={isPending || !emailProviderConfigured}
            title={
              !emailProviderConfigured
                ? "Resend requires RESEND_API_KEY in .env.local"
                : "Resend invite email"
            }
          >
            {isPending ? "Sending…" : "Resend"}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={handleRevoke}
          disabled={isPending}
        >
          Revoke
        </Button>
      </div>
      {feedback && (
        <p
          className={`text-xs max-w-xs text-right ${
            feedback.ok
              ? "text-green-600 dark:text-green-400"
              : "text-destructive"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
