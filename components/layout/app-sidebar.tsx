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

const ROLE_COLOR: Partial<Record<AppRole, string>> = {
  lab_owner:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  lab_manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  technician:  "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  accountant:  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  reception:   "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  delivery:    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  super_admin: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  doctor:      "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
};

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
  const rolePill = ROLE_COLOR[primaryRole as AppRole] ?? "bg-muted text-muted-foreground";

  return (
    <aside
      className="fixed inset-y-0 start-0 hidden w-[220px] border-e lg:flex flex-col"
      style={{ background: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}
    >
      {/* ── Brand ── */}
      <div className="flex h-[60px] items-center gap-2.5 px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Activity className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold tracking-tight leading-none">LabFlow</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Dental OS</p>
        </div>
        <span
          className={cn(
            "live-dot size-2 shrink-0 rounded-full",
            cloudDotClass[cloudStatus],
          )}
          title={cloudDotTitle[cloudStatus]}
          aria-label={cloudDotTitle[cloudStatus]}
          style={{ color: cloudStatus === "connected" ? "#10b981" : cloudStatus === "preview" ? "#f59e0b" : "#ef4444" }}
        />
      </div>

      <Separator />

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {GROUP_ORDER.map((group) => {
          const items = groupedItems[group];
          if (!items) return null;

          return (
            <div key={group}>
              <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50">
                {navGroupLabels[group]}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    activeHref === item.href ||
                    (item.href !== "/" && activeHref.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-all duration-100",
                        "relative",
                        active
                          ? "text-[var(--sidebar-active-text)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                      style={
                        active
                          ? { background: "var(--sidebar-active-bg)" }
                          : undefined
                      }
                    >
                      {/* Active left border accent */}
                      {active && (
                        <span
                          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                          style={{ background: "var(--sidebar-active-border)" }}
                        />
                      )}
                      <item.icon
                        className={cn(
                          "size-[15px] shrink-0 transition-colors",
                          active ? "text-[var(--sidebar-active-text)]" : "text-muted-foreground/70 group-hover:text-foreground",
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User footer ── */}
      <div
        className="border-t px-3 py-3 space-y-2"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="size-7 shrink-0 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground uppercase">
            {labName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate leading-tight">{labName}</p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold",
            rolePill,
          )}
        >
          {roleLabels[primaryRole as AppRole] ?? primaryRole.replaceAll("_", " ")}
        </span>
      </div>
    </aside>
  );
}
