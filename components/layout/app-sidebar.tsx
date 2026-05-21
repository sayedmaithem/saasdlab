import Link from "next/link";
import { Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { appNavigation, navGroupLabels, type NavGroup } from "@/lib/constants/navigation";
import { roleLabels } from "@/lib/constants/roles";
import type { AppRole } from "@/lib/constants/roles";
import { hasRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type CloudStatus = "connected" | "preview" | "offline";

const cloudDotClass: Record<CloudStatus, string> = {
  connected: "bg-emerald-500",
  preview: "bg-amber-400",
  offline: "bg-red-500",
};

const cloudDotTitle: Record<CloudStatus, string> = {
  connected: "Supabase connected",
  preview: "Preview mode — Supabase not configured",
  offline: "Database offline",
};

const GROUP_ORDER: NavGroup[] = [
  "command",
  "lab-ops",
  "finance",
  "logistics",
  "admin",
  "portals",
];

export function AppSidebar({
  labName,
  activeHref = "/dashboard",
  roles,
  cloudStatus = "preview",
}: {
  labName: string;
  activeHref?: string;
  roles: AppRole[];
  cloudStatus?: CloudStatus;
}) {
  const visibleItems = appNavigation.filter((item) => hasRole(roles, item.roles));

  const groupedItems = GROUP_ORDER.reduce<Partial<Record<NavGroup, typeof visibleItems>>>(
    (acc, group) => {
      const items = visibleItems.filter((item) => item.group === group);
      if (items.length > 0) acc[group] = items;
      return acc;
    },
    {},
  );

  const primaryRole = roles[0] ?? "reception";

  return (
    <aside className="fixed inset-y-0 start-0 hidden w-64 border-e bg-card lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">LabFlow</p>
            <p className="text-xs text-muted-foreground">Lab Operating System</p>
          </div>
          <span
            className={cn("size-2.5 shrink-0 rounded-full", cloudDotClass[cloudStatus])}
            title={cloudDotTitle[cloudStatus]}
            aria-label={cloudDotTitle[cloudStatus]}
          />
        </div>

        <Separator />

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {GROUP_ORDER.map((group) => {
            const items = groupedItems[group];
            if (!items) return null;

            return (
              <div key={group}>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {navGroupLabels[group]}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = activeHref === item.href || activeHref.startsWith(`${item.href}/`);
                    const isCommandCenter = item.group === "command";

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                          active && "bg-muted text-foreground",
                          isCommandCenter && !active && "text-foreground/80",
                          isCommandCenter && active && "bg-primary/10 text-primary",
                        )}
                      >
                        <item.icon className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t p-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Active lab
          </p>
          <p className="text-sm font-semibold truncate">{labName}</p>
          <p className="text-xs text-muted-foreground">
            {roleLabels[primaryRole as AppRole] ?? primaryRole}
          </p>
        </div>
      </div>
    </aside>
  );
}
