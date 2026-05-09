export const dynamic = "force-dynamic";

import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSessionContext } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/env";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabaseReady = hasSupabaseEnv();
  const session = await getCurrentSessionContext();
  const params = await searchParams;

  if (session) {
    redirect("/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </div>
        <CardTitle>Sign in to LabFlow</CardTitle>
      </CardHeader>
      <CardContent>
        {supabaseReady ? (
          <LoginForm error={params.error} />
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            Supabase environment variables are not configured yet. Add
            NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before
            signing in.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
