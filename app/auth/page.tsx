import { LockKeyhole } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/env";

export default function AuthPage() {
  const supabaseReady = hasSupabaseEnv();

  return (
    <Card>
      <CardHeader>
        <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </div>
        <CardTitle>Sign in to LabFlow</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          Supabase Auth is wired at the architecture level. The production sign
          in form and invite flow will be implemented in the auth and roles
          phase.
        </p>
        <p className="mt-4 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
          {supabaseReady
            ? "Supabase environment variables are configured."
            : "Supabase environment variables are not configured yet."}
        </p>
      </CardContent>
    </Card>
  );
}
