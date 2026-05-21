import { ShieldCheck, Stethoscope, Briefcase, FolderOpen, Settings, Globe, DollarSign, Truck, BarChart3, Wrench, ClipboardCheck, Lock } from "lucide-react";

type PermissionGroup = {
  name: string;
  icon: React.ElementType;
  description: string;
  roles: string[];
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: "System Administration",
    icon: Lock,
    description: "Full system access — migrate data, manage all labs, override any setting.",
    roles: ["super_admin"],
  },
  {
    name: "Lab Operations",
    icon: Briefcase,
    description: "Manage lab settings, users, billing, and all modules.",
    roles: ["lab_owner", "lab_manager"],
  },
  {
    name: "Doctor Management",
    icon: Stethoscope,
    description: "Create, edit, and view doctor and clinic profiles. Manage price lists.",
    roles: ["lab_owner", "lab_manager", "reception"],
  },
  {
    name: "Case Management",
    icon: ClipboardCheck,
    description: "Create cases, view case details, update missing information, manage case files.",
    roles: ["lab_owner", "lab_manager", "reception", "technician", "doctor"],
  },
  {
    name: "Production Management",
    icon: Wrench,
    description: "Move cases through production stages. Assign technicians. Manage the Kanban board.",
    roles: ["lab_owner", "lab_manager", "technician"],
  },
  {
    name: "File Management",
    icon: FolderOpen,
    description: "Upload and download case files, design files, STL, DICOM, and photos.",
    roles: ["lab_owner", "lab_manager", "technician", "doctor"],
  },
  {
    name: "Quality Control",
    icon: ShieldCheck,
    description: "Submit and review QC checks. Pass or fail cases before delivery.",
    roles: ["lab_owner", "lab_manager", "technician"],
  },
  {
    name: "Finance",
    icon: DollarSign,
    description: "Create invoices, record payments, view statements. Hidden from technicians and delivery.",
    roles: ["lab_owner", "accountant"],
  },
  {
    name: "Delivery",
    icon: Truck,
    description: "Mark cases as out-for-delivery and delivered. Upload delivery proof.",
    roles: ["lab_owner", "lab_manager", "delivery"],
  },
  {
    name: "Reports",
    icon: BarChart3,
    description: "View performance reports, doctor analytics, lab productivity, and revenue summaries.",
    roles: ["lab_owner", "lab_manager", "accountant"],
  },
  {
    name: "Portal Access",
    icon: Globe,
    description: "Access to role-specific portals: Doctor Portal, Technician Workspace, Finance Portal.",
    roles: ["doctor", "technician", "accountant", "delivery"],
  },
  {
    name: "Settings",
    icon: Settings,
    description: "Configure lab profile, app settings, notifications, and default values.",
    roles: ["lab_owner"],
  },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700 border-red-200",
  lab_owner: "bg-violet-100 text-violet-700 border-violet-200",
  lab_manager: "bg-blue-100 text-blue-700 border-blue-200",
  reception: "bg-cyan-100 text-cyan-700 border-cyan-200",
  technician: "bg-amber-100 text-amber-700 border-amber-200",
  accountant: "bg-green-100 text-green-700 border-green-200",
  delivery: "bg-orange-100 text-orange-700 border-orange-200",
  doctor: "bg-pink-100 text-pink-700 border-pink-200",
};

export function PermissionGroups() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Permission groups</h2>
        <p className="text-sm text-muted-foreground">
          Capabilities are organised into 12 groups. Each group maps to one or more roles.
          Roles are enforced at the database level via RLS — not just the UI.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PERMISSION_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div
              key={group.name}
              className="space-y-3 rounded-lg border bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold">{group.name}</p>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{group.description}</p>
              <div className="flex flex-wrap gap-1">
                {group.roles.map((role) => (
                  <span
                    key={role}
                    className={`rounded border px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role] ?? "bg-muted text-muted-foreground border-muted"}`}
                  >
                    {role.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
