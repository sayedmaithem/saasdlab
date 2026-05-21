import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasSupabaseEnv } from "@/lib/env";

type SystemStatus = "active" | "partial" | "needs_setup" | "coming_soon";

type OperatingSystem = {
  name: string;
  description: string;
  status: SystemStatus;
  href: string;
  ownerRole: string;
  dependencies: string[];
};

function getSystems(supabase: boolean): OperatingSystem[] {
  return [
    {
      name: "Command Center",
      description: "System control plane, readiness, security, tasks.",
      status: "active",
      href: "/command-center",
      ownerRole: "lab_owner",
      dependencies: [],
    },
    {
      name: "Core CRM",
      description: "Cases, doctors, clinics, case intake and tracking.",
      status: supabase ? "partial" : "needs_setup",
      href: "/cases",
      ownerRole: "reception",
      dependencies: ["Cloud"],
    },
    {
      name: "Doctor Portal",
      description: "Doctor-facing case view, files, approvals, statement.",
      status: supabase ? "partial" : "needs_setup",
      href: "/doctor-portal",
      ownerRole: "doctor",
      dependencies: ["Core CRM", "Cloud"],
    },
    {
      name: "Technician Workspace",
      description: "Kanban board, assigned cases, productivity metrics.",
      status: supabase ? "partial" : "needs_setup",
      href: "/technicians/workspace",
      ownerRole: "technician",
      dependencies: ["Core CRM"],
    },
    {
      name: "Production Engine",
      description: "Stage progression, missing info engine, priority scoring.",
      status: supabase ? "partial" : "needs_setup",
      href: "/production",
      ownerRole: "lab_manager",
      dependencies: ["Core CRM"],
    },
    {
      name: "Cloud Files",
      description: "Supabase Storage, signed uploads, role-scoped access.",
      status: supabase ? "needs_setup" : "needs_setup",
      href: "/command-center/cloud",
      ownerRole: "lab_owner",
      dependencies: ["Cloud"],
    },
    {
      name: "exocad Workflow",
      description: "CAD/CAM design upload, versioning, doctor approval.",
      status: supabase ? "partial" : "needs_setup",
      href: "/production",
      ownerRole: "technician",
      dependencies: ["Cloud Files"],
    },
    {
      name: "QC & Remakes",
      description: "Quality control passes, remake tracking, delivery gate.",
      status: supabase ? "partial" : "needs_setup",
      href: "/quality-control",
      ownerRole: "technician",
      dependencies: ["Production Engine"],
    },
    {
      name: "Finance",
      description: "Invoices, payments, statements — scoped to accountant role.",
      status: supabase ? "partial" : "needs_setup",
      href: "/invoices",
      ownerRole: "accountant",
      dependencies: ["Core CRM"],
    },
    {
      name: "Delivery",
      description: "Delivery tracking and proof-of-delivery workflow.",
      status: supabase ? "partial" : "needs_setup",
      href: "/delivery",
      ownerRole: "delivery",
      dependencies: ["Core CRM"],
    },
    {
      name: "Reports",
      description: "Operations analytics, revenue, doctor performance.",
      status: supabase ? "partial" : "needs_setup",
      href: "/reports",
      ownerRole: "lab_owner",
      dependencies: ["Finance", "Core CRM"],
    },
    {
      name: "Security",
      description: "Audit findings, RLS policies, role matrix.",
      status: "active",
      href: "/command-center/security",
      ownerRole: "developer",
      dependencies: [],
    },
    {
      name: "AI Agents",
      description: "Claude-powered assistants for intake and QC.",
      status: "coming_soon",
      href: "/command-center/features",
      ownerRole: "lab_owner",
      dependencies: ["Core CRM", "Cloud"],
    },
    {
      name: "Integrations",
      description: "WhatsApp, email, external lab systems.",
      status: "coming_soon",
      href: "/command-center/features",
      ownerRole: "lab_owner",
      dependencies: ["Cloud"],
    },
  ];
}

const STATUS_CONFIG: Record<
  SystemStatus,
  { icon: React.ElementType; colorClass: string; bg: string; label: string }
> = {
  active: {
    icon: CheckCircle2,
    colorClass: "text-green-600",
    bg: "border-green-200 bg-green-50/40",
    label: "Active",
  },
  partial: {
    icon: AlertTriangle,
    colorClass: "text-amber-500",
    bg: "border-amber-200 bg-amber-50/30",
    label: "Partial",
  },
  needs_setup: {
    icon: XCircle,
    colorClass: "text-red-500",
    bg: "border-red-200 bg-red-50/30",
    label: "Needs setup",
  },
  coming_soon: {
    icon: Clock,
    colorClass: "text-muted-foreground",
    bg: "border-dashed border-muted bg-muted/20",
    label: "Coming soon",
  },
};

export function CrmOperatingMap() {
  const supabase = hasSupabaseEnv();
  const systems = getSystems(supabase);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(["active", "partial", "needs_setup", "coming_soon"] as SystemStatus[]).map(
          (s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <span key={s} className="flex items-center gap-1.5">
                <Icon className={cn("size-3.5", cfg.colorClass)} />
                {cfg.label}
              </span>
            );
          },
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {systems.map((sys) => {
          const cfg = STATUS_CONFIG[sys.status];
          const Icon = cfg.icon;

          return (
            <Link
              key={sys.name}
              href={sys.href}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:brightness-95",
                cfg.bg,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-tight">{sys.name}</p>
                <Icon
                  className={cn("mt-0.5 size-4 shrink-0", cfg.colorClass)}
                  aria-label={cfg.label}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-5">
                {sys.description}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium">{sys.ownerRole}</span>
                {sys.dependencies.length > 0 && (
                  <span className="opacity-60">
                    needs: {sys.dependencies.join(", ")}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
