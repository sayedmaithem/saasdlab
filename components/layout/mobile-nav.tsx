"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { appNavigation, navGroupLabels, type NavGroup } from "@/lib/constants/navigation";
import { hasRole } from "@/lib/permissions";

import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/constants/roles";

const GROUP_ORDER: NavGroup[] = [
  "workspace",
  "finance",
  "logistics",
  "system",
];

// ── Mobile hamburger button (rendered in Topbar) ──────────────────────────────

export function MobileNavButton({
  roles,
  activeHref,
  labName,
}: {
  roles: AppRole[];
  activeHref: string;
  labName: string;
}) {
  const [open, setOpen] = useState(false);

  const visibleNav = appNavigation.filter((item) =>
    hasRole(roles, item.roles),
  );

  const groupedItems = visibleNav.reduce<Partial<Record<NavGroup, typeof visibleNav>>>(
    (acc, item) => {
      const existing = acc[item.group] ?? [];
      return { ...acc, [item.group]: [...existing, item] };
    },
    {},
  );

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </button>

      {/* Drawer overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div
            className="fixed inset-y-0 start-0 z-50 flex w-[260px] flex-col border-e bg-card shadow-xl animate-slide-in-up"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  LabFlow
                </p>
                <p className="text-sm font-semibold truncate">{labName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
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
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-all",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                            )}
                          >
                            <item.icon className="size-[15px] shrink-0" aria-hidden />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
