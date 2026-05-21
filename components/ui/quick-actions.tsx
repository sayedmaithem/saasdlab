"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  FileStack,
  BadgeDollarSign,
  WalletCards,
  Upload,
  UsersRound,
  UserCog,
  Package,
  X,
} from "lucide-react";
import type { AppRole } from "@/lib/constants/roles";

// ── Action definitions ────────────────────────────────────────────────────────

type QuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  tone: "primary" | "green" | "blue" | "amber" | "violet" | "orange";
  roles: AppRole[];
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "new-case",
    label: "New Case",
    description: "Open a new dental case",
    href: "/cases/new",
    icon: FileStack,
    tone: "primary",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
  },
  {
    id: "new-invoice",
    label: "New Invoice",
    description: "Create a patient invoice",
    href: "/invoices/new",
    icon: BadgeDollarSign,
    tone: "green",
    roles: ["super_admin", "lab_owner", "accountant"],
  },
  {
    id: "record-payment",
    label: "Record Payment",
    description: "Log a received payment",
    href: "/payments",
    icon: WalletCards,
    tone: "blue",
    roles: ["super_admin", "lab_owner", "accountant"],
  },
  {
    id: "upload-files",
    label: "Upload Files",
    description: "Add files to a case",
    href: "/cases",
    icon: Upload,
    tone: "violet",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "technician"],
  },
  {
    id: "add-doctor",
    label: "Add Doctor",
    description: "Register a referring doctor",
    href: "/doctors/new",
    icon: UsersRound,
    tone: "amber",
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
  },
  {
    id: "add-technician",
    label: "Add Technician",
    description: "Invite a lab technician",
    href: "/technicians/new",
    icon: UserCog,
    tone: "orange",
    roles: ["super_admin", "lab_owner", "lab_manager"],
  },
  {
    id: "stock-in",
    label: "Stock In",
    description: "Record material stock-in",
    href: "/inventory",
    icon: Package,
    tone: "amber",
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
];

const TONE_STYLES: Record<QuickAction["tone"], { bg: string; text: string }> = {
  primary: { bg: "bg-primary/10",   text: "text-primary" },
  green:   { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  blue:    { bg: "bg-blue-100 dark:bg-blue-900/30",       text: "text-blue-700 dark:text-blue-400" },
  amber:   { bg: "bg-amber-100 dark:bg-amber-900/30",     text: "text-amber-700 dark:text-amber-400" },
  violet:  { bg: "bg-violet-100 dark:bg-violet-900/30",   text: "text-violet-700 dark:text-violet-400" },
  orange:  { bg: "bg-orange-100 dark:bg-orange-900/30",   text: "text-orange-700 dark:text-orange-400" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickActions({ roles }: { roles: AppRole[] }) {
  const [open, setOpen] = useState(false);

  const visibleActions = QUICK_ACTIONS.filter((a) =>
    a.roles.some((r) => roles.includes(r)),
  );

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
          open
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        aria-label="Quick actions"
        aria-expanded={open}
      >
        {open ? (
          <X className="size-4" aria-hidden />
        ) : (
          <Plus className="size-4" aria-hidden />
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Invisible backdrop for dismiss-on-outside-click */}
          <div
            className="qa-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            className="qa-panel"
            role="menu"
            aria-label="Quick actions"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Quick Actions
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Actions grid */}
            <div className="p-2 space-y-0.5" role="group">
              {visibleActions.map((action) => {
                const Icon = action.icon;
                const tone = TONE_STYLES[action.tone];
                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 group"
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone.bg}`}
                    >
                      <Icon className={`size-4 ${tone.text}`} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[13px] truncate group-hover:text-foreground">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-2">
              <p className="text-[10px] text-muted-foreground">
                Showing actions for your role
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
