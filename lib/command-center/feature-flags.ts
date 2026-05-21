// Phase 4 foundation — static/pure. DB persistence planned for a later phase.

import { hasSupabaseEnv } from "@/lib/env";

export type FlagStatus = "enabled" | "disabled" | "coming_soon" | "needs_setup";
export type FlagRisk = "low" | "medium" | "high";
export type FlagCategory =
  | "core"
  | "portal"
  | "finance"
  | "automation"
  | "integration"
  | "experimental";

export type FeatureFlag = {
  key: string;
  label: string;
  description: string;
  status: FlagStatus;
  risk: FlagRisk;
  category: FlagCategory;
};

export function getFeatureFlags(): FeatureFlag[] {
  const supabase = hasSupabaseEnv();

  return [
    // Core
    {
      key: "command_center_enabled",
      label: "Command Center",
      description: "System control plane — readiness, security, tasks, and launch management.",
      status: "enabled",
      risk: "low",
      category: "core",
    },
    {
      key: "doctor_portal_enabled",
      label: "Doctor Portal",
      description: "Doctor-facing portal for case tracking, file access, and statement review.",
      status: supabase ? "enabled" : "needs_setup",
      risk: "low",
      category: "portal",
    },
    {
      key: "technician_workspace_enabled",
      label: "Technician Workspace",
      description: "Kanban board and task view scoped to the logged-in technician.",
      status: supabase ? "enabled" : "needs_setup",
      risk: "low",
      category: "core",
    },
    {
      key: "finance_enabled",
      label: "Finance Module",
      description: "Invoice creation, payment tracking, and doctor statements for accountants.",
      status: supabase ? "enabled" : "needs_setup",
      risk: "medium",
      category: "finance",
    },
    {
      key: "payments_enabled",
      label: "Payments",
      description: "Payment recording and allocation against invoices.",
      status: supabase ? "enabled" : "needs_setup",
      risk: "medium",
      category: "finance",
    },
    {
      key: "delivery_enabled",
      label: "Delivery",
      description: "Delivery tracking and proof-of-delivery workflow for the delivery role.",
      status: supabase ? "enabled" : "needs_setup",
      risk: "low",
      category: "core",
    },
    {
      key: "cloud_files_enabled",
      label: "Cloud File Manager",
      description: "Case file uploads to Supabase Storage with role-scoped access.",
      status: supabase ? "needs_setup" : "needs_setup",
      risk: "medium",
      category: "core",
    },
    {
      key: "reports_enabled",
      label: "Reports",
      description: "Operations dashboard with revenue, production metrics, and doctor performance.",
      status: supabase ? "enabled" : "needs_setup",
      risk: "low",
      category: "core",
    },

    // Portal
    {
      key: "exocad_workflow_enabled",
      label: "exocad Design Workflow",
      description: "CAD/CAM design upload, version tracking, and doctor approval flow.",
      status: supabase ? "enabled" : "needs_setup",
      risk: "low",
      category: "portal",
    },

    // Automation
    {
      key: "ai_agents_enabled",
      label: "AI Agents",
      description: "Claude-powered agents for case intake assistance, missing info detection, and QC suggestions.",
      status: "coming_soon",
      risk: "high",
      category: "experimental",
    },
    {
      key: "whatsapp_enabled",
      label: "WhatsApp Notifications",
      description: "Automated case status updates sent to doctors and patients via WhatsApp Business API.",
      status: "coming_soon",
      risk: "medium",
      category: "integration",
    },

    // Modes
    {
      key: "pilot_mode_enabled",
      label: "Pilot Mode",
      description: "Lab is running in pilot mode — real cases but with oversight and no billing.",
      status: supabase ? "needs_setup" : "disabled",
      risk: "low",
      category: "core",
    },
    {
      key: "production_mode_enabled",
      label: "Production Mode",
      description: "Fully operational — real billing, real doctors, SLA commitments active.",
      status: "disabled",
      risk: "high",
      category: "core",
    },
  ];
}

export function getFlagsByCategory(): Record<FlagCategory, FeatureFlag[]> {
  const flags = getFeatureFlags();
  const result = {} as Record<FlagCategory, FeatureFlag[]>;

  for (const flag of flags) {
    if (!result[flag.category]) result[flag.category] = [];
    result[flag.category].push(flag);
  }

  return result;
}
