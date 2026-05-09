import Link from "next/link";
import { Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { appNavigation } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar({
  labName,
  activeHref = "/dashboard",
}: {
  labName: string;
  activeHref?: string;
}) {
  return (
    <aside className="fixed inset-y-0 start-0 hidden w-64 border-e bg-card lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold">LabFlow</p>
            <p className="text-xs text-muted-foreground">Dental CRM</p>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-3">
          {appNavigation.map((item) => {
            const active = activeHref === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground",
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Active lab
          </p>
          <p className="mt-1 text-sm font-semibold">{labName}</p>
        </div>
      </div>
    </aside>
  );
}
