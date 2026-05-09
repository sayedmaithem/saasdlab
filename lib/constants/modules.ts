import type { FoundationRoute } from "@/types/app";

export const foundationRoutes = {
  doctors: {
    eyebrow: "Relationship management",
    title: "Doctors and clinics",
    description:
      "Manage doctor accounts, clinics, billing ownership, and performance scoring.",
  },
  cases: {
    eyebrow: "Clinical intake",
    title: "Dental cases",
    description:
      "Register cases, track missing information, assign technicians, and store doctor-facing details.",
    primaryAction: {
      label: "Create case",
      href: "/cases/new",
    },
  },
  production: {
    eyebrow: "Lab workflow",
    title: "Production",
    description:
      "Coordinate the stage pipeline from received through delivery and completion.",
  },
  technicians: {
    eyebrow: "Workforce",
    title: "Technicians",
    description:
      "Prepare technician assignment, productivity, permissions, and workload views.",
  },
  invoices: {
    eyebrow: "Finance",
    title: "Invoices",
    description:
      "Prepare case-linked invoice creation, invoice lines, and doctor statement workflows.",
  },
  payments: {
    eyebrow: "Finance",
    title: "Payments",
    description:
      "Prepare payment capture, reconciliation, outstanding balances, and audit-safe entries.",
  },
  delivery: {
    eyebrow: "Logistics",
    title: "Delivery",
    description:
      "Prepare delivery assignments, proof of delivery, and delivered case tracking.",
  },
  reports: {
    eyebrow: "Analytics",
    title: "Reports",
    description:
      "Prepare lab dashboards, doctor performance, technician productivity, and finance reporting.",
  },
  settings: {
    eyebrow: "Administration",
    title: "Settings",
    description:
      "Prepare lab settings, role configuration, localization, and SaaS tenant controls.",
  },
  doctorPortal: {
    eyebrow: "Doctor portal",
    title: "Doctor approvals",
    description:
      "Prepare doctor-facing case status, design approvals, comments, and secure uploads.",
  },
} satisfies Record<string, FoundationRoute>;
