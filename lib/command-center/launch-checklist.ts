import { FINDING_COUNTS } from "@/lib/constants/security-findings";
import { hasSupabaseEnv } from "@/lib/env";

export type ChecklistStatus = "passed" | "warning" | "failed" | "not_checked";
export type ChecklistRequirement = "pilot" | "production" | "optional";

export type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  status: ChecklistStatus;
  requiredFor: ChecklistRequirement;
  actionHref: string;
  reason: string;
};

export type ChecklistGroup = {
  id: string;
  label: string;
  items: ChecklistItem[];
};

export type LaunchReadiness = {
  pilotReady: boolean;
  productionReady: boolean;
  pilotScore: number;
  productionScore: number;
  pilotBlockers: ChecklistItem[];
  productionBlockers: ChecklistItem[];
  warnings: ChecklistItem[];
};

function item(
  id: string,
  title: string,
  description: string,
  status: ChecklistStatus,
  requiredFor: ChecklistRequirement,
  actionHref: string,
  reason: string,
): ChecklistItem {
  return { id, title, description, status, requiredFor, actionHref, reason };
}

export function getLaunchChecklist(): ChecklistGroup[] {
  const supabase = hasSupabaseEnv();
  const adminKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const noCritical = FINDING_COUNTS.critical === 0;
  const noHigh = FINDING_COUNTS.high === 0;

  return [
    {
      id: "security",
      label: "Security",
      items: [
        item(
          "sec-no-critical",
          "Zero open critical findings",
          "All critical security findings must be resolved before any real lab use.",
          noCritical ? "passed" : "failed",
          "pilot",
          "/command-center/security",
          noCritical ? "All 4 critical findings resolved in Phase 3." : `${FINDING_COUNTS.critical} critical findings still open.`,
        ),
        item(
          "sec-no-high",
          "Zero open high findings",
          "High-severity findings must be resolved before production.",
          noHigh ? "passed" : "warning",
          "production",
          "/command-center/security",
          noHigh ? "No open high findings." : `${FINDING_COUNTS.high} high findings still open (H2, H3).`,
        ),
        item(
          "sec-preview-opt-in",
          "Preview auth requires explicit opt-in",
          "LABFLOW_DEV_PREVIEW=1 required — no accidental staging sessions.",
          "passed",
          "pilot",
          "/command-center/security",
          "Fixed in Phase 3: canUsePreviewAuth() now requires explicit flag.",
        ),
        item(
          "sec-lab-id-filters",
          "Explicit lab_id filters on all queries",
          "Business queries must not rely on RLS alone for tenant isolation.",
          "passed",
          "pilot",
          "/command-center/security",
          "Fixed in Phase 3: dashboard and finance queries now filter by lab_id.",
        ),
        item(
          "sec-file-rls",
          "File RLS: doctor uploaded_by bypass removed",
          "Doctors cannot access private_finance files they uploaded.",
          "passed",
          "pilot",
          "/command-center/security",
          "Fixed in Phase 3: migration 0011 removes the bypass.",
        ),
      ],
    },
    {
      id: "cloud",
      label: "Cloud",
      items: [
        item(
          "cloud-supabase",
          "Supabase project connected",
          "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
          supabase ? "passed" : "failed",
          "pilot",
          "/command-center/cloud",
          supabase ? "Supabase environment variables are configured." : "Supabase not connected — running in preview mode.",
        ),
        item(
          "cloud-migrations",
          "All migrations applied",
          "16 SQL migrations must be applied to the live database.",
          supabase ? "not_checked" : "failed",
          "pilot",
          "/command-center/health",
          supabase ? "Cannot verify migration status from app layer — check Supabase dashboard." : "Cannot apply migrations without Supabase connection.",
        ),
        item(
          "cloud-rls-enabled",
          "RLS enabled on all business tables",
          "Row Level Security must be active on every business table.",
          supabase ? "not_checked" : "failed",
          "pilot",
          "/command-center/cloud",
          "Cannot verify RLS state without a live database connection.",
        ),
        item(
          "cloud-storage",
          "Storage buckets configured",
          "case-files and design-files buckets must exist with correct policies.",
          supabase ? "not_checked" : "failed",
          "pilot",
          "/command-center/cloud",
          "Cannot verify bucket state without Supabase connection.",
        ),
        item(
          "cloud-backup",
          "Backup / DR configured",
          "Automated backups enabled and restore procedure documented.",
          "not_checked",
          "production",
          "/command-center/cloud",
          "Placeholder — configure via Supabase dashboard and document procedure.",
        ),
      ],
    },
    {
      id: "core",
      label: "Core CRM",
      items: [
        item(
          "core-lab-profile",
          "Lab profile complete",
          "Lab name, address, phone, and logo configured in settings.",
          "not_checked",
          "pilot",
          "/settings",
          "Placeholder — complete the lab profile before inviting real users.",
        ),
        item(
          "core-admin-key",
          "Server admin key configured",
          "SUPABASE_SERVICE_ROLE_KEY present in .env.local (server-only). Required for in-app user creation.",
          adminKey ? "passed" : "warning",
          "pilot",
          "/command-center/users",
          adminKey
            ? "Admin key is configured — direct account creation enabled."
            : "Add SUPABASE_SERVICE_ROLE_KEY to .env.local. Without it, users must be created via Supabase Dashboard.",
        ),
        item(
          "core-users",
          "At least one technician and doctor account created",
          "Use Command Center → Users → Create user to create portal accounts without the Supabase dashboard.",
          "not_checked",
          "pilot",
          "/command-center/users/new",
          "Create technician and doctor logins via the in-app user console.",
        ),
        item(
          "core-email-provider",
          "Email invite provider configured (Resend)",
          "RESEND_API_KEY in .env.local enables email invitations and password reset. Required for production.",
          Boolean(process.env.RESEND_API_KEY) ? "passed" : "warning",
          "production",
          "/command-center/cloud",
          Boolean(process.env.RESEND_API_KEY)
            ? "Resend API key configured."
            : "Add RESEND_API_KEY to .env.local (Phase 14). Until then, share credentials manually.",
        ),
        item(
          "core-doctor-clinic",
          "At least one doctor and clinic added",
          "A doctor profile and clinic must exist before case intake can be tested.",
          "not_checked",
          "pilot",
          "/doctors/new",
          "Placeholder — add first doctor and clinic.",
        ),
        item(
          "core-work-types",
          "Work types and materials configured",
          "Restoration types and materials list defined in lab catalog.",
          "not_checked",
          "pilot",
          "/command-center/master-data/operations",
          "Configure operations and materials in Master Data → Operations / Materials.",
        ),
      ],
    },
    {
      id: "files",
      label: "Files & Storage",
      items: [
        item(
          "files-upload-test",
          "File upload tested end-to-end",
          "Upload a case file and verify it appears in the case detail view.",
          "not_checked",
          "pilot",
          "/cases",
          "Cannot test without Supabase and storage bucket configured.",
        ),
        item(
          "files-rls-policies",
          "Storage RLS policies applied",
          "Supabase Storage bucket policies must restrict access by role and lab.",
          "not_checked",
          "production",
          "/command-center/cloud",
          "Verify via Supabase Storage dashboard after connecting.",
        ),
      ],
    },
    {
      id: "workflow",
      label: "Production Workflow",
      items: [
        item(
          "workflow-demo-case",
          "Full demo case completed",
          "A test case moved through all stages: received → cad_design → quality_control → ready_for_delivery → delivered.",
          "not_checked",
          "pilot",
          "/cases/new",
          "Placeholder — run a demo case after Supabase is connected.",
        ),
        item(
          "workflow-db-gates",
          "DB-level workflow gates active",
          "PostgreSQL constraints prevent bypassing missing-info and QC gates.",
          "failed",
          "production",
          "/command-center/security",
          "H2: DB-level workflow gates not yet implemented. App-layer only.",
        ),
        item(
          "workflow-qc-test",
          "QC pass/fail flow tested",
          "A case failed QC, corrected, and passed before delivery.",
          "not_checked",
          "pilot",
          "/quality-control",
          "Placeholder — test after Supabase is connected.",
        ),
      ],
    },
    {
      id: "finance",
      label: "Finance",
      items: [
        item(
          "finance-invoice-test",
          "Invoice creation tested",
          "Create an invoice for a completed case and verify it appears in doctor portal.",
          "not_checked",
          "pilot",
          "/invoices/new",
          "Placeholder — test after Supabase is connected.",
        ),
        item(
          "finance-isolation",
          "Finance isolation verified",
          "Doctors can only see their own invoices. Technicians see none.",
          "passed",
          "pilot",
          "/command-center/security",
          "Fixed in Phase 3: doctor removed from canUseFinance() and /invoices route.",
        ),
      ],
    },
    {
      id: "doctor-portal",
      label: "Doctor Portal",
      items: [
        item(
          "doctor-login-test",
          "Doctor login tested",
          "A real doctor logged in and saw only their own cases, files, and statement.",
          "not_checked",
          "pilot",
          "/doctor-portal",
          "Placeholder — test after Supabase and first doctor are configured.",
        ),
        item(
          "doctor-file-access",
          "Doctor file access scoped correctly",
          "Doctor sees doctor_visible files only. Cannot see private_finance.",
          "passed",
          "pilot",
          "/command-center/security",
          "Fixed in Phase 3: uploaded_by bypass removed from RLS.",
        ),
      ],
    },
    {
      id: "delivery",
      label: "Delivery",
      items: [
        item(
          "delivery-flow-test",
          "Delivery flow tested",
          "A case moved to ready_for_delivery and a delivery user marked it delivered.",
          "not_checked",
          "pilot",
          "/delivery",
          "Placeholder — test after Supabase is connected.",
        ),
      ],
    },
    {
      id: "reports",
      label: "Reports",
      items: [
        item(
          "reports-basic",
          "Basic reports render",
          "Operations report renders without errors for lab_owner role.",
          "not_checked",
          "optional",
          "/reports",
          "Placeholder — verify after Supabase is connected.",
        ),
      ],
    },
    {
      id: "deployment",
      label: "Deployment",
      items: [
        item(
          "deploy-vercel",
          "Vercel deployment configured",
          "App deployed to Vercel with production environment variables.",
          "not_checked",
          "production",
          "/command-center/cloud",
          "Placeholder — configure Vercel project and domain.",
        ),
        item(
          "deploy-custom-domain",
          "Custom domain configured",
          "Lab uses a branded domain (e.g. lab.labflow.app).",
          "not_checked",
          "production",
          "/command-center/cloud",
          "Placeholder — configure via Vercel dashboard.",
        ),
        item(
          "deploy-env-vars",
          "All production env vars set",
          "Every key in .env.example has a real value in Vercel production environment.",
          "not_checked",
          "production",
          "/command-center/health",
          "Placeholder — verify via Vercel dashboard before go-live.",
        ),
      ],
    },
    {
      id: "pilot",
      label: "Pilot Lab Readiness",
      items: [
        item(
          "pilot-data-entered",
          "Real lab data entered",
          "Lab profile, first doctor, first technician, and work types all configured.",
          "not_checked",
          "pilot",
          "/command-center/setup",
          "Placeholder — complete setup wizard steps.",
        ),
        item(
          "pilot-team-trained",
          "Team knows how to use the system",
          "Lab owner and reception can create cases. Technician can use workspace. Doctor can access portal.",
          "not_checked",
          "pilot",
          "/command-center/setup",
          "Placeholder — run a training session.",
        ),
        item(
          "pilot-not-production",
          "Pilot is not production",
          "The lab understands this is a pilot and does not rely on it for billing or legal records.",
          "not_checked",
          "pilot",
          "/command-center/launch",
          "Acknowledge that pilot mode is for testing — not for production lab management.",
        ),
      ],
    },
  ];
}

export function calculateLaunchReadiness(): LaunchReadiness {
  const groups = getLaunchChecklist();
  const all = groups.flatMap((g) => g.items);

  const pilotItems = all.filter(
    (i) => i.requiredFor === "pilot" || i.requiredFor === "production",
  );
  const productionItems = all.filter((i) => i.requiredFor === "production");

  const pilotBlockers = pilotItems.filter((i) => i.status === "failed");
  const productionBlockers = [
    ...pilotBlockers,
    ...productionItems.filter((i) => i.status === "failed"),
  ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

  const warnings = all.filter((i) => i.status === "warning" || i.status === "not_checked");

  const pilotPassed = pilotItems.filter((i) => i.status === "passed").length;
  const pilotScore = pilotItems.length
    ? Math.round((pilotPassed / pilotItems.length) * 100)
    : 0;

  const prodPassed = all.filter((i) => i.status === "passed").length;
  const productionScore = all.length
    ? Math.round((prodPassed / all.length) * 100)
    : 0;

  return {
    pilotReady: pilotBlockers.length === 0,
    productionReady: productionBlockers.length === 0,
    pilotScore,
    productionScore,
    pilotBlockers,
    productionBlockers,
    warnings,
  };
}
