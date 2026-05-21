"use client";

import { useState } from "react";
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

function filterMatches(notif: Notification, key: FilterKey): boolean {
  if (key === "all") return true;
  if (key === "unread") return !notif.read;
  if (key === "approval") return notif.type === "doctor_approval" || notif.type === "design_approved" || notif.type === "design_rejected";
  if (key === "files") return notif.type === "missing_file";
  if (key === "qc") return notif.type === "qc_required";
  if (key === "delivery") return notif.type === "delivery_ready";
  return true;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifType =
  | "missing_file"
  | "doctor_approval"
  | "stage_overdue"
  | "qc_required"
  | "delivery_ready"
  | "design_approved"
  | "design_rejected"
  | "case_blocked"
  | "new_comment"
  | "assignment";

type Notification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  caseNumber?: string;
  caseId?: string;
  time: string;
  read: boolean;
};

// ── Mock data — TODO: replace with real Supabase real-time subscription ───────
// When backend is ready: subscribe to case_timeline / notifications table
// using supabase.channel(...).on('postgres_changes',...) in a client provider
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "stage_overdue",
    title: "Case overdue",
    body: "LAB-2041 passed due date. Currently at wax_modeling stage.",
    caseNumber: "LAB-2041",
    caseId: "",
    time: "2 min ago",
    read: false,
  },
  {
    id: "n2",
    type: "doctor_approval",
    title: "Doctor approval needed",
    body: "LAB-2038 design V2 is waiting for Dr. Hassan's approval.",
    caseNumber: "LAB-2038",
    caseId: "",
    time: "14 min ago",
    read: false,
  },
  {
    id: "n3",
    type: "missing_file",
    title: "Missing scan files",
    body: "LAB-2035 has no scan files uploaded. Technician is blocked.",
    caseNumber: "LAB-2035",
    caseId: "",
    time: "1 hr ago",
    read: false,
  },
  {
    id: "n4",
    type: "qc_required",
    title: "Quality check required",
    body: "LAB-2031 completed production and needs QC inspection.",
    caseNumber: "LAB-2031",
    caseId: "",
    time: "2 hr ago",
    read: true,
  },
  {
    id: "n5",
    type: "delivery_ready",
    title: "Ready for delivery",
    body: "LAB-2028 passed QC and is ready to dispatch to Dr. Khalil clinic.",
    caseNumber: "LAB-2028",
    caseId: "",
    time: "3 hr ago",
    read: true,
  },
  {
    id: "n6",
    type: "design_approved",
    title: "Design approved",
    body: "Dr. Ahmed approved the CAD design for LAB-2025. Ready for milling.",
    caseNumber: "LAB-2025",
    caseId: "",
    time: "Yesterday",
    read: true,
  },
  {
    id: "n7",
    type: "new_comment",
    title: "New comment",
    body: "Dr. Nour added a note on LAB-2022: 'Please adjust the occlusal contact.'",
    caseNumber: "LAB-2022",
    caseId: "",
    time: "Yesterday",
    read: true,
  },
];

// ── Icon map ──────────────────────────────────────────────────────────────────

const NOTIF_ICON: Record<NotifType, { icon: typeof Bell; color: string; bg: string }> = {
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

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const unread = notifications.filter((n) => !n.read).length;
  const filtered = notifications.filter((n) => filterMatches(n, activeFilter));

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
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
          {/* Backdrop */}
          <div
            className="notification-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="notification-panel" role="dialog" aria-label="Notifications">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
              <div>
                <h2 className="text-sm font-bold">Notifications</h2>
                {unread > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {unread} unread
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] text-primary font-medium hover:underline"
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

            {/* Mock data banner */}
            <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3 py-2">
              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                ⚠ Mock notifications — TODO: wire to Supabase real-time
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                Backend needed: notifications table + real-time channel subscription
              </p>
            </div>

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
                const meta = NOTIF_ICON[notif.type];
                const Icon = meta.icon;

                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => markRead(notif.id)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-muted/50 transition-colors ${
                      notif.read ? "opacity-60" : ""
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
                          <p className={`text-[13px] font-semibold leading-snug ${notif.read ? "" : "text-foreground"}`}>
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!notif.read && (
                              <span className="size-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                          {notif.body}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1.5 font-medium">
                          {notif.time}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Nothing here.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
