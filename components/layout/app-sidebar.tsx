"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { appNavigation, navGroupLabels, type NavGroup } from "@/lib/constants/navigation";
import { roleLabels } from "@/lib/constants/roles";
import type { AppRole } from "@/lib/constants/roles";
import { hasRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  "workspace",
  "finance",
  "logistics",
  "system",
];

const ROLE_COLOR: Partial<Record<AppRole, string>> = {
  lab_owner:   "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  lab_manager: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  technician:  "bg-violet-500/20 text-violet-400 border border-violet-500/30",
  accountant:  "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  reception:   "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  delivery:    "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  super_admin: "bg-red-500/20 text-red-400 border border-red-500/30",
  doctor:      "bg-sky-500/20 text-sky-400 border border-sky-500/30",
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
  const rolePill = ROLE_COLOR[primaryRole as AppRole] ?? "bg-white/10 text-slate-300";

  return (
    <aside className="fixed inset-y-0 start-0 hidden w-[260px] lg:flex flex-col z-40 border-r border-white/5 spatial-glass backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {/* ── Brand ── */}
      <div className="flex h-[72px] items-center gap-3 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-50" />
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white shadow-lg spatial-glow-cyan relative z-10">
          <Activity className="size-5 animate-pulse" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 relative z-10">
          <p className="text-[15px] font-extrabold tracking-tight leading-none text-white drop-shadow-md">LabFlow</p>
          <p className="text-[9px] text-sky-300 mt-1 leading-none uppercase tracking-[0.2em] font-bold">Dental OS</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-hide relative z-10">
        {GROUP_ORDER.map((group, groupIndex) => {
          const items = groupedItems[group];
          if (!items) return null;

          return (
            <motion.div 
              key={group}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: groupIndex * 0.1, duration: 0.5, type: "spring" }}
            >
              <p className="mb-2.5 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/40 drop-shadow-sm">
                {navGroupLabels[group]}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const active =
                    activeHref === item.href ||
                    (item.href !== "/" && activeHref.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-all duration-300 overflow-hidden",
                        active
                          ? "text-white shadow-md shadow-black/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5",
                      )}
                    >
                      {/* Active Background */}
                      {active && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 to-purple-500/20 border border-white/10"
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      <item.icon
                        className={cn(
                          "size-[18px] shrink-0 transition-all duration-300 relative z-10",
                          active ? "text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" : "text-slate-500 group-hover:text-sky-200",
                        )}
                        aria-hidden
                      />
                      <span className="truncate relative z-10 font-semibold tracking-wide">{item.label}</span>

                      {/* Active glowing dot */}
                      {active && (
                        <motion.span
                          layoutId="sidebar-dot"
                          className="absolute right-3 size-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,1)]"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </nav>

      {/* ── User Footer ── */}
      <div className="p-4 relative z-10 border-t border-white/5 bg-black/20 backdrop-blur-md">
        <div className="rounded-xl px-3 py-3 glass-card border border-white/5 hover:border-white/20 transition-colors cursor-pointer flex items-center gap-3">
          <div className={cn("size-9 shrink-0 rounded-xl flex items-center justify-center text-[13px] shadow-inner", rolePill)}>
            {labName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-white truncate drop-shadow-sm">{labName}</p>
            <p className="text-[10px] text-sky-200/80 uppercase tracking-widest font-bold mt-0.5">
              {roleLabels[primaryRole as AppRole] ?? primaryRole.replaceAll("_", " ")}
            </p>
          </div>
          <span
            className={cn("size-2 rounded-full shadow-[0_0_8px_currentColor]", cloudDotClass[cloudStatus])}
            title={cloudDotTitle[cloudStatus]}
          />
        </div>
      </div>
    </aside>
  );
}
