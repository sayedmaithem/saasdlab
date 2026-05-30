import {
  LayoutDashboard,
  FileStack,
  WalletCards,
  BarChart3,
  Package,
  UsersRound,
  Bell,
  Database,
  Settings,
  Factory,
  Palette,
  ShieldCheck,
  Truck,
  Stethoscope,
  Building2,
  UserCog,
  Receipt,
  CreditCard,
  RefreshCcw,
  HeartPulse,
} from "lucide-react";
import type { ComponentType } from "react";
import type { AppRole } from "@/lib/constants/roles";

export type NavGroup = "workspace" | "production" | "finance" | "logistics" | "system";

export const navGroupLabels: Record<NavGroup, string> = {
  workspace:  "Workspace",
  production: "Production",
  finance:    "Finance & Analytics",
  logistics:  "Logistics",
  system:     "System & Config",
};

export type AppNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  roles: AppRole[];
  group: NavGroup;
};

export const appNavigation: AppNavItem[] = [
  // ── Workspace ──────────────────────────────────────────────────────────
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
    group: "workspace",
  },
  {
    label: "Cases",
    href: "/cases",
    icon: FileStack,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "technician", "doctor"],
    group: "workspace",
  },
  {
    label: "Doctor Portal",
    href: "/doctor-portal",
    icon: HeartPulse,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "doctor"],
    group: "workspace",
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "technician", "accountant", "delivery", "doctor"],
    group: "workspace",
  },

  // ── Production ─────────────────────────────────────────────────────────
  {
    label: "Production",
    href: "/production",
    icon: Factory,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
    group: "production",
  },
  {
    label: "Design",
    href: "/design",
    icon: Palette,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
    group: "production",
  },
  {
    label: "Quality Control",
    href: "/quality-control",
    icon: ShieldCheck,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
    group: "production",
  },
  {
    label: "Remakes",
    href: "/remakes",
    icon: RefreshCcw,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician", "reception"],
    group: "production",
  },

  // ── Finance & Analytics ────────────────────────────────────────────────
  {
    label: "Invoices",
    href: "/invoices",
    icon: Receipt,
    roles: ["super_admin", "lab_owner", "accountant"],
    group: "finance",
  },
  {
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
    roles: ["super_admin", "lab_owner", "accountant"],
    group: "finance",
  },
  {
    label: "Accounting",
    href: "/finance",
    icon: WalletCards,
    roles: ["super_admin", "lab_owner", "accountant"],
    group: "finance",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["super_admin", "lab_owner", "lab_manager", "accountant"],
    group: "finance",
  },

  // ── Logistics ──────────────────────────────────────────────────────────
  {
    label: "Delivery",
    href: "/delivery",
    icon: Truck,
    roles: ["super_admin", "lab_owner", "lab_manager", "delivery", "reception"],
    group: "logistics",
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
    group: "logistics",
  },

  // ── System & Config ────────────────────────────────────────────────────
  {
    label: "Doctors",
    href: "/doctors",
    icon: Stethoscope,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
    group: "system",
  },
  {
    label: "Clinics",
    href: "/clinics",
    icon: Building2,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
    group: "system",
  },
  {
    label: "Technicians",
    href: "/technicians",
    icon: UserCog,
    roles: ["super_admin", "lab_owner", "lab_manager"],
    group: "system",
  },
  {
    label: "Administration",
    href: "/command-center",
    icon: UsersRound,
    roles: ["super_admin", "lab_owner"],
    group: "system",
  },
  {
    label: "Master Data",
    href: "/command-center/master-data",
    icon: Database,
    roles: ["super_admin", "lab_owner", "lab_manager"],
    group: "system",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["super_admin", "lab_owner"],
    group: "system",
  },
];
