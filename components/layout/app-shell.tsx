import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({
  children,
  labName,
  activeHref = "/dashboard",
  title,
  eyebrow,
}: {
  children: React.ReactNode;
  labName: string;
  activeHref?: string;
  title?: string;
  eyebrow?: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar labName={labName} activeHref={activeHref} />

      <div className="lg:ps-64">
        <Topbar title={title} eyebrow={eyebrow} />
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
