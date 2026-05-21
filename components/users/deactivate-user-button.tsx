"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deactivatePortalUserAction } from "@/app/actions/users";

export function DeactivateUserButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [done, setDone] = useState(false);

  function handleDeactivate() {
    if (
      !confirm(
        "Deactivate this account? The user will not be able to log in.\n\nThe Supabase auth user is kept — delete it from the Supabase Dashboard if needed.",
      )
    )
      return;
    startTransition(async () => {
      const result = await deactivatePortalUserAction(userId);
      setFeedback(result);
      if (result.ok) setDone(true);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      {!done && (
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={handleDeactivate}
          disabled={isPending}
        >
          {isPending ? "Deactivating…" : "Deactivate"}
        </Button>
      )}
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
