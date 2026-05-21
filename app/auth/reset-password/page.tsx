export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { hasSupabaseEnv } from "@/lib/env";
import { hasEmailProviderEnv } from "@/lib/email/resend";

export default function ResetPasswordPage() {
  const supabaseReady = hasSupabaseEnv();
  const emailReady = hasEmailProviderEnv();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
      </CardHeader>
      <CardContent>
        {!supabaseReady ? (
          <p className="text-sm text-muted-foreground">
            Supabase is not configured. Password reset is unavailable.
          </p>
        ) : (
          <PasswordResetForm emailProviderConfigured={emailReady} />
        )}
      </CardContent>
    </Card>
  );
}
