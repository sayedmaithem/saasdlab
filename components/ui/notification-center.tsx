"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  FileWarning,
  MessageSquare,
  PackageCheck,
  Truck,
  X,
} from "lucide-react";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications";
import type { NotificationItem } from "@/lib/data/notifications";

// ── Filter config ─────────────────────────────────────────────────────────────

const FILTERS = [
  { key: "all",      label: "All" },
  { key: "unread",   label: "Unread" },
  { key: "approval", label: "Approval" },
  { key: "files",    label: "Files" },
  { key: "qc",       label: "QC" },
  { key: "delivery", label: "Delivery" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function filterMatches(notif: NotificationItem, key: FilterKey): boolean {
  if (key === "all") return true;
  if (key === "unread") return !notif.isRead;
  if (key === "approval") return ["doctor_approval", "design_approved", "design_rejected"].includes(notif.type);
  if (key === "files") return notif.type === "missing_file";
  if (key === "qc") return notif.type === "qc_required";
  if (key === "delivery") return notif.type === "delivery_ready";
  return true;
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  missing_file:    { icon: FileWarning,   color: "text-amber-600",  bg: "bg-amber-100 dark:bg-amber-900/30" },
  doctor_approval: { icon: Clock,         color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30" },
  stage_overdue:   { icon: AlertCircle,   color: "text-red-600",    bg: "bg-red-100 dark:bg-red-900/30" },
  qc_required:     { icon: CheckCircle2,  color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
  delivery_ready:  { icon: PackageCheck,  color: "text-emerald-600",bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  design_approved: { icon: CheckCircle2,  color: "text-emerald-600",bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  design_rejected: { icon: AlertCircle,   color: "text-red-600",    bg: "bg-red-100 dark:bg-red-900/30" },
  case_blocked:    { icon: AlertCircle,   color: "text-red-600",    bg: "bg-red-100 dark:bg-red-900/30" },
  new_comment:     { icon: MessageSquare, color: "text-slate-600",  bg: "bg-slate-100 dark:bg-slate-800" },
  assignment:      { icon: Truck,         color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30" },
};

const DEFAULT_ICON = { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };

function getIconMeta(type: string) {
  return ICON_MAP[type] ?? DEFAULT_ICON;
}

function formatRelativeTime(createdAt: string): string {
  try {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  } catch {
    return "";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationCenter({
  initialNotifications = [],
}: {
  /** Server-fetched notifications passed as initial state. Falls back to [] when no DB. */
  initialNotifications?: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [isPending, startTransition] = useTransition();

  const isRealData = initialNotifications.length > 0;
  const unread = notifications.filter((n) => !n.isRead).length;
  const filtered = notifications.filter((n) => filterMatches(n, activeFilter));

  function optimisticMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  }

  function optimisticMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  }

  return (
    <>
      {/* Bell trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label={`Notifications${unread > 0 ? ` — ${unread} unread` : ""}`}
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div
            className="notification-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="notification-panel" role="dialog" aria-label="Notifications">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
              <div>
                <h2 className="text-sm font-bold">Notifications</h2>
                {unread > 0 && (
                  <p className="text-[11px] text-muted-foreground">{unread} unread</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={optimisticMarkAllRead}
                    disabled={isPending}
                    className="text-[11px] text-primary font-medium hover:underline disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Data source banner */}
            {!isRealData && (
              <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3 py-2">
                <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                  ⚠ No notifications yet
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                  Notifications will appear here when events occur in the lab. Database table is ready (migration 0020 applied).
                </p>
              </div>
            )}

            {/* Filter pill tabs */}
            <div className="flex flex-wrap gap-1.5 px-4 mt-3">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFilter(f.key)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium ring-1 transition-colors ${
                    activeFilter === f.key
                      ? "bg-primary/10 text-primary ring-primary/30"
                      : "bg-transparent text-muted-foreground ring-border hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="divide-y divide-border mt-3">
              {filtered.map((notif) => {
                const meta = getIconMeta(notif.type);
                const Icon = meta.icon;

                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => {
                      if (!notif.isRead) optimisticMarkRead(notif.id);
                      if (notif.actionUrl) {
                        setOpen(false);
                        window.location.href = notif.actionUrl;
                      }
                    }}
                    className={`w-full text-left px-4 py-3.5 hover:bg-muted/50 transition-colors ${
                      notif.isRead ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${meta.bg}`}
                      >
                        <Icon className={`size-4 ${meta.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[13px] font-semibold leading-snug ${notif.isRead ? "" : "text-foreground"}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="size-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        {notif.body && (
                          <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                            {notif.body}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 mt-1.5 font-medium">
                          {formatRelativeTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {activeFilter === "unread" ? "No unread notifications." : "Nothing here."}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
