"use client";

import Link from "next/link";
import {
  FileStack,
  Boxes,
  PenTool,
  ClipboardCheck,
  Truck,
  BadgeDollarSign,
  WalletCards,
  BarChart3,
  UsersRound,
  Hospital,
  UserCog,
  Settings,
  LayoutDashboard,
  Package,
  TrendingUp,
  Map,
  GitCommitHorizontal,
  RotateCcw,
  Gauge,
  Building2,
  Activity,
  ArrowUpRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ModuleStatus = "live" | "wip" | "planned";

type SystemModule = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  status: ModuleStatus;
  badge?: string;
};

type ModuleSection = {
  id: string;
  title: string;
  color: string;
  modules: SystemModule[];
};

// ── Module definitions ────────────────────────────────────────────────────────

const SYSTEM_SECTIONS: ModuleSection[] = [
  {
    id: "command",
    title: "Command & Intelligence",
    color: "text-primary",
    modules: [
      { id: "owner",    label: "Operations HQ",   description: "Live KPIs, overdue, bottlenecks",      href: "/owner",           icon: LayoutDashboard, status: "live" },
      { id: "dashboard",label: "Dashboard",        description: "Workflow board & case overview",        href: "/dashboard",       icon: Gauge,           status: "live" },
      { id: "cc",       label: "Command Center",   description: "System health & setup readiness",       href: "/command-center",  icon: Activity,        status: "live" },
      { id: "lab-os",   label: "LabOS System Map", description: "Full system module overview",           href: "/lab-os",          icon: Map,             status: "live", badge: "You are here" },
    ],
  },
  {
    id: "lab-ops",
    title: "Lab Operations",
    color: "text-blue-600 dark:text-blue-400",
    modules: [
      { id: "cases",      label: "Cases",           description: "All dental case management",          href: "/cases",           icon: FileStack,          status: "live" },
      { id: "production", label: "Production Board",description: "Stage-by-stage Kanban workflow",       href: "/production",      icon: Boxes,              status: "live" },
      { id: "design",     label: "Design Queue",    description: "CAD/exocad workflow management",       href: "/design",          icon: PenTool,            status: "live" },
      { id: "qc",         label: "Quality Control", description: "QC inspection & pass/fail board",     href: "/quality-control", icon: ClipboardCheck,     status: "live" },
      { id: "remakes",    label: "Remakes",         description: "Remake & revision management",         href: "/remakes",         icon: RotateCcw,          status: "live" },
      { id: "log",        label: "Movement Log",    description: "Timeline of all case state changes",   href: "/cases/log",       icon: GitCommitHorizontal,status: "live" },
    ],
  },
  {
    id: "people",
    title: "People & Relationships",
    color: "text-violet-600 dark:text-violet-400",
    modules: [
      { id: "doctors",     label: "Doctors",       description: "Referring doctor profiles & pricing", href: "/doctors",      icon: UsersRound, status: "live" },
      { id: "clinics",     label: "Clinics",       description: "Dental clinic directory",             href: "/clinics",      icon: Hospital,   status: "live" },
      { id: "technicians", label: "Technicians",   description: "Lab staff & workload management",     href: "/technicians",  icon: UserCog,    status: "live" },
    ],
  },
  {
    id: "finance",
    title: "Finance & Billing",
    color: "text-emerald-600 dark:text-emerald-400",
    modules: [
      { id: "finance-ov", label: "Finance Overview", description: "Revenue, outstanding, overdue",    href: "/finance",    icon: TrendingUp,      status: "live" },
      { id: "invoices",   label: "Invoices",          description: "Invoice creation & management",   href: "/invoices",   icon: BadgeDollarSign, status: "live" },
      { id: "payments",   label: "Payments",          description: "Payment recording & tracking",    href: "/payments",   icon: WalletCards,     status: "live" },
      { id: "reports",    label: "Reports",           description: "Analytics, revenue, trends",      href: "/reports",    icon: BarChart3,       status: "live" },
      { id: "suppliers",  label: "Suppliers",         description: "Supplier accounts & expenses",    href: "/finance",    icon: Building2,       status: "wip", badge: "Phase 12" },
    ],
  },
  {
    id: "logistics",
    title: "Logistics & Delivery",
    color: "text-amber-600 dark:text-amber-400",
    modules: [
      { id: "delivery",   label: "Delivery",       description: "Dispatch queue & proof of delivery", href: "/delivery",  icon: Truck,   status: "live" },
      { id: "inventory",  label: "Inventory",      description: "Materials, stock & warehouses",      href: "/inventory", icon: Package, status: "wip", badge: "Expanding" },
    ],
  },
  {
    id: "config",
    title: "Configuration & Admin",
    color: "text-slate-600 dark:text-slate-400",
    modules: [
      { id: "settings",      label: "Settings",        description: "Lab configuration & profile",       href: "/settings",                               icon: Settings,       status: "live" },
      { id: "print",         label: "Print Hub",        description: "Invoice, barcode & case templates", href: "/settings/print",                         icon: Settings,       status: "wip", badge: "Beta" },
      { id: "master-data",   label: "Master Data",     description: "Operations, materials, workflows",   href: "/command-center/master-data",             icon: Activity,       status: "live" },
      { id: "users",         label: "User Management", description: "Create & manage portal accounts",    href: "/command-center/users",                   icon: UsersRound,     status: "live" },
      { id: "portal-access", label: "Doctor Portal",   description: "Doctor-facing case & approval view", href: "/doctor-portal",                          icon: ClipboardCheck, status: "live" },
    ],
  },
];

const STATUS_CONFIG: Record<ModuleStatus, { label: string; dot: string; cardClass: string }> = {
  live:    { label: "Live",    dot: "bg-emerald-500", cardClass: "module-card-live" },
  wip:     { label: "Active",  dot: "bg-amber-400",   cardClass: "module-card-wip" },
  planned: { label: "Planned", dot: "bg-muted-foreground/40", cardClass: "module-card-planned" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SystemMap() {
  const totalModules = SYSTEM_SECTIONS.reduce((sum, s) => sum + s.modules.length, 0);
  const liveModules = SYSTEM_SECTIONS.reduce(
    (sum, s) => sum + s.modules.filter((m) => m.status === "live").length,
    0,
  );

  return (
    <div className="space-y-8">
      {/* ── Summary strip ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total modules</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5">{totalModules}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live & active</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5 text-emerald-600 dark:text-emerald-400">{liveModules}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expanding</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5 text-amber-600 dark:text-amber-400">
            {totalModules - liveModules}
          </p>
        </div>

        {/* System health indicator */}
        <div className="ml-auto hidden sm:flex items-center gap-2 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5">
          <span className="size-2 rounded-full bg-emerald-500 live-dot" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            System operating normally
          </span>
        </div>
      </div>

      {/* ── Sections ─────────────────────────────────────────────────────── */}
      {SYSTEM_SECTIONS.map((section) => (
        <div key={section.id} className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className={`text-sm font-bold uppercase tracking-[0.1em] ${section.color}`}>
              {section.title}
            </h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground/60 font-medium">
              {section.modules.filter((m) => m.status === "live").length}/{section.modules.length} live
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.modules.map((mod) => {
              const Icon = mod.icon;
              const statusCfg = STATUS_CONFIG[mod.status];

              return (
                <Link
                  key={mod.id}
                  href={mod.href}
                  className={`module-card p-4 block group ${statusCfg.cardClass}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">
                          {mod.label}
                        </p>
                        {mod.badge && (
                          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                            {mod.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {mod.description}
                      </p>
                    </div>
                    <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors mt-0.5" />
                  </div>

                  {/* Status row */}
                  <div className="mt-3 flex items-center gap-1.5 pt-2.5 border-t">
                    <span className={`size-1.5 rounded-full ${statusCfg.dot}`} />
                    <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                      {statusCfg.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
