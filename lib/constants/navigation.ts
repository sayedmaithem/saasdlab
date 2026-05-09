import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  ClipboardCheck,
  FileStack,
  Gauge,
  Hospital,
  RotateCcw,
  Settings,
  Truck,
  UserCog,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";
import type { AppRole } from "@/lib/constants/roles";

export type AppNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  roles: AppRole[];
};

export const appNavigation: AppNavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Gauge,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception"],
  },
  {
    label: "Cases",
    href: "/cases",
    icon: FileStack,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "technician", "doctor"],
  },
  {
    label: "Doctors",
    href: "/doctors",
    icon: UsersRound,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "accountant"],
  },
  {
    label: "Clinics",
    href: "/clinics",
    icon: Hospital,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "accountant"],
  },
  {
    label: "Production",
    href: "/production",
    icon: Boxes,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    label: "Quality",
    href: "/quality-control",
    icon: ClipboardCheck,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    label: "Remakes",
    href: "/remakes",
    icon: RotateCcw,
    roles: ["super_admin", "lab_owner", "lab_manager", "reception", "accountant"],
  },
  {
    label: "Technicians",
    href: "/technicians",
    icon: UserCog,
    roles: ["super_admin", "lab_owner", "lab_manager", "technician"],
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: BadgeDollarSign,
    roles: ["super_admin", "lab_owner", "accountant", "doctor"],
  },
  {
    label: "Payments",
    href: "/payments",
    icon: WalletCards,
    roles: ["super_admin", "lab_owner", "accountant"],
  },
  {
    label: "Delivery",
    href: "/delivery",
    icon: Truck,
    roles: ["super_admin", "lab_owner", "lab_manager", "delivery"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["super_admin", "lab_owner", "lab_manager", "accountant"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["super_admin", "lab_owner"],
  },
  {
    label: "Doctor Portal",
    href: "/doctor-portal",
    icon: ClipboardCheck,
    roles: ["super_admin", "lab_owner", "doctor"],
  },
];
