import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { AuthSessionContext } from "@/types/app";

export function AppShell({
  children,
  labName,
  session,
  activeHref = "/dashboard",
  title,
  eyebrow,
}: {
  children: React.ReactNode;
  labName: string;
  session: AuthSessionContext;
  activeHref?: string;
  title?: string;
  eyebrow?: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        labName={labName}
        activeHref={activeHref}
        roles={session.roles}
      />

      <div className="lg:ps-64">
        <Topbar title={title} eyebrow={eyebrow} session={session} />
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
