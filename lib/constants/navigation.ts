import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  ClipboardCheck,
  FileStack,
  Gauge,
  Hospital,
  LayoutDashboard,
  PenTool,
  RotateCcw,
  Settings,
  Truck,
  UserCog,
  UsersRound,
  WalletCards,
  Building2,
  LayoutGrid,
  Wrench,
  Map,
  Package,
  TrendingUp,
  GitCommitHorizontal,
} from "lucide-react";
import type { ComponentType } from "react";
import type { AppRole } from "@/lib/constants/roles";

export type NavGroup =
  | "command"
  | "lab-ops"
  | "finance"
  | "logistics"
  | "admin"
  | "portals";

export const navGroupLabels: Record<NavGroup, string> = {
  "command": "Command",
  "lab-ops": "Operations",
  "finance": "Finance",
  "logistics": "Logistics",
  "admin": "Configuration",
  "portals": "Portals",
};

export type AppNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  roles: AppRole[];
  group: NavGroup;
};

export const appNavigation: AppNavItem[] = [
  {
    label: "Operations HQ",
    href: "/owner",
    icon: LayoutGrid,
    roles: ["super_admin", "lab_owner", "lab_manager"],
    group: "command",
  },
  {
    label: "Platform HQ",
    href: "/hq",
    icon: Building2,
    roles: ["super_admin"],
    group: "command",
  },
  {
    label: "Command Center",
    href: "/command-center",
    icon: LayoutDashboard,
    roles: ["super_admin", "lab_owner", "lab_manager"],
    group: "command",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Gauge,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
    group: "lab-ops",
  },
  {
    label: "Cases",
    href: "/cases",
    icon: FileStack,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "technician", "doctor"],
    group: "lab-ops",
  },
  {
    label: "Doctors",
    href: "/doctors",
    icon: UsersRound,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "accountant"],
    group: "lab-ops",
  },
  {
    label: "Clinics",
    href: "/clinics",
    icon: Hospital,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "accountant"],
    group: "lab-ops",
  },
  {
    label: "Production",
    href: "/production",
    icon: Boxes,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
    group: "lab-ops",
  },
  {
    label: "Design",
    href: "/design",
    icon: PenTool,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
    group: "lab-ops",
  },
  {
    label: "Quality Control",
    href: "/quality-control",
    icon: ClipboardCheck,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
    group: "lab-ops",
  },
  {
    label: "Remakes",
    href: "/remakes",
    icon: RotateCcw,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "accountant"],
    group: "lab-ops",
  },
  {
    // Management list: managers only — technicians are redirected to /workspace
    label: "Technicians",
    href: "/technicians",
    icon: UserCog,
    roles: ["super_admin", "lab_owner", "lab_manager"],
    group: "lab-ops",
  },
  {
    // First-class workspace portal for technician role users
    label: "My Workspace",
    href: "/technicians/workspace",
    icon: Wrench,
    roles: ["technician"],
    group: "lab-ops",
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: BadgeDollarSign,
    roles: ["super_admin", "lab_owner", "accountant"],
    group: "finance",
  },
  {
    label: "Payments",
    href: "/payments",
    icon: WalletCards,
    roles: ["super_admin", "lab_owner", "accountant"],
    group: "finance",
  },
  {
    label: "Delivery",
    href: "/delivery",
    icon: Truck,
    roles: ["super_admin", "lab_owner", "lab_manager", "delivery"],
    group: "logistics",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["super_admin", "lab_owner", "lab_manager", "accountant"],
    group: "finance",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["super_admin", "lab_owner"],
    group: "admin",
  },
  {
    label: "Doctor Portal",
    href: "/doctor-portal",
    icon: ClipboardCheck,
    roles: ["super_admin", "lab_owner", "doctor"],
    group: "portals",
  },
  // ── LabOS Command OS additions ───────────────────────────────────────────
  {
    label: "Finance Overview",
    href: "/finance",
    icon: TrendingUp,
    roles: ["super_admin", "lab_owner", "accountant"],
    group: "finance",
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
    group: "lab-ops",
  },
  {
    label: "Movement Log",
    href: "/cases/log",
    icon: GitCommitHorizontal,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
    group: "lab-ops",
  },
  {
    label: "LabOS Map",
    href: "/lab-os",
    icon: Map,
    roles: ["super_admin", "lab_owner"],
    group: "admin",
  },
];
