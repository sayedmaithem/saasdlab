"use client";

import { useState, useTransition } from "react";
import { sendPasswordResetAction } from "@/app/auth/reset-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function PasswordResetForm({
  emailProviderConfigured,
}: {
  emailProviderConfigured: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  function submit(fd: FormData) {
    startTransition(async () => {
      await sendPasswordResetAction(fd);
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-4 text-sm">
          <p className="font-semibold text-green-800 dark:text-green-300">Check your inbox</p>
          <p className="text-green-700 dark:text-green-400 mt-1">
            If this email address has a LabFlow account, reset instructions have been sent.
            Check your spam folder if you don&apos;t see it within a few minutes.
          </p>
        </div>
        <Link href="/auth" className="text-sm text-primary hover:underline">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={submit} className="space-y-4">
      {!emailProviderConfigured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 text-sm">
          <p className="text-amber-800 dark:text-amber-300 font-medium">Email provider not configured</p>
          <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
            Supabase will still send a default reset email. Configure{" "}
            <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">RESEND_API_KEY</code>{" "}
            for branded emails.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          required
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Enter the email address on your LabFlow account and we&apos;ll send reset instructions.
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Sending…" : "Send reset instructions"}
      </Button>

      <p className="text-center text-sm">
        <Link href="/auth" className="text-primary hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </form>
  );
}
