import Link from "next/link";
import { LogOut, PlusCircle, UserCircle } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { canManageCases } from "@/lib/permissions";
import type { AuthSessionContext } from "@/types/app";

export function Topbar({
  title = "LabFlow Dental CRM",
  eyebrow = "Production command center",
  session,
}: {
  title?: string;
  eyebrow?: string;
  session: AuthSessionContext;
}) {
  const canCreateCase = canManageCases(session.roles);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/90 px-4 backdrop-blur md:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {canCreateCase ? (
          <Button asChild size="sm">
            <Link href="/cases/new">
              <PlusCircle aria-hidden="true" />
              New case
            </Link>
          </Button>
        ) : null}
        <details className="group relative">
          <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium hover:bg-muted">
            <UserCircle className="size-4" aria-hidden="true" />
            <span className="hidden max-w-36 truncate md:inline">
              {session.fullName ?? session.email ?? "Profile"}
            </span>
          </summary>
          <div className="absolute end-0 mt-2 w-64 rounded-lg border bg-card p-3 shadow-lg">
            <p className="text-sm font-semibold">
              {session.fullName ?? "LabFlow user"}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {session.email ?? "No email"}
            </p>
            <p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              {session.role.replaceAll("_", " ")}
            </p>
            <form action={logoutAction} className="mt-3">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                <LogOut aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
