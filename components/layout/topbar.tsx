import Link from "next/link";
import { LogOut, PlusCircle, UserCircle } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/constants/roles";
import { canManageCases } from "@/lib/permissions";
import type { AppRole } from "@/lib/constants/roles";
import type { AuthSessionContext } from "@/types/app";
import { NotificationCenter } from "@/components/ui/notification-center";
import { AiCommandPanel } from "@/components/ui/ai-command-panel";

type BadgeTone = "default" | "blue" | "amber" | "green" | "red" | "neutral";

const roleBadgeTone: Record<AppRole, BadgeTone> = {
  super_admin: "red",
  lab_owner: "green",
  lab_manager: "blue",
  reception: "neutral",
  technician: "blue",
  accountant: "amber",
  doctor: "default",
  delivery: "neutral",
};

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
  const primaryRole = session.role;

  return (
    <header className="sticky top-0 z-10 flex h-[60px] items-center justify-between border-b bg-card/90 px-4 backdrop-blur-md md:px-6">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70 leading-none">
          {eyebrow}
        </p>
        <h1 className="mt-0.5 text-base font-bold leading-tight tracking-tight truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* AI Command Panel trigger */}
        <AiCommandPanel />

        {/* Notification center */}
        <NotificationCenter />

        {/* New case */}
        {canCreateCase && (
          <Button asChild size="sm">
            <Link href="/cases/new">
              <PlusCircle className="size-3.5" aria-hidden="true" />
              New case
            </Link>
          </Button>
        )}

        {/* User menu */}
        <details className="group relative">
          <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border bg-card px-2.5 text-sm font-medium hover:bg-muted transition-colors">
            <UserCircle className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="hidden max-w-28 truncate md:inline text-[13px]">
              {session.fullName?.split(" ")[0] ?? session.email ?? "Profile"}
            </span>
          </summary>
          <div className="absolute end-0 mt-2 w-64 rounded-xl border bg-card p-3 shadow-lg animate-slide-in-up">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="size-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground uppercase">
                {(session.fullName ?? session.email ?? "U").charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {session.fullName ?? "LabFlow user"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.email ?? "No email"}
                </p>
              </div>
            </div>
            <div className="mb-3">
              <Badge tone={roleBadgeTone[primaryRole]}>
                {roleLabels[primaryRole] ?? primaryRole.replaceAll("_", " ")}
              </Badge>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm" className="w-full">
                <LogOut className="size-3.5" aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
