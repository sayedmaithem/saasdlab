import { SECURITY_FINDINGS } from "@/lib/constants/security-findings";
import { hasSupabaseEnv } from "@/lib/env";

export type TaskCategory =
  | "security"
  | "cloud"
  | "setup"
  | "workflow"
  | "finance"
  | "ui"
  | "deployment"
  | "pilot";

export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "open" | "planned" | "blocked" | "done";
export type TaskSource =
  | "security_finding"
  | "setup_wizard"
  | "cloud_check"
  | "health_check"
  | "manual";

export type RecommendedOwner =
  | "owner"
  | "developer"
  | "accountant"
  | "technician"
  | "admin";

export type RecommendedModel = "opus" | "sonnet" | "haiku" | "manus";

export type SystemTask = {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  source: TaskSource;
  actionHref: string;
  recommendedOwner: RecommendedOwner;
  recommendedModel: RecommendedModel;
  blocksPilot: boolean;
  blocksProduction: boolean;
};

// Tasks derived from open security findings
function securityFindingTasks(): SystemTask[] {
  const open = SECURITY_FINDINGS.filter((f) => f.status === "open");

  return open.map((finding) => ({
    id: `security-${finding.id.toLowerCase()}`,
    title: finding.title,
    description: finding.recommendedAction,
    category: "security" as TaskCategory,
    priority: finding.severity === "critical"
      ? "critical"
      : finding.severity === "high"
      ? "high"
      : finding.severity === "medium"
      ? "medium"
      : "low",
    status: "open" as TaskStatus,
    source: "security_finding" as TaskSource,
    actionHref: "/command-center/security",
    recommendedOwner: "developer" as RecommendedOwner,
    recommendedModel: finding.severity === "critical" ? "opus" : "sonnet",
    blocksPilot: finding.severity === "critical" || finding.severity === "high",
    blocksProduction: true,
  }));
}

// Tasks derived from cloud/env state
function cloudTasks(): SystemTask[] {
  const tasks: SystemTask[] = [];

  if (!hasSupabaseEnv()) {
    tasks.push({
      id: "cloud-supabase-connect",
      title: "Connect Supabase project",
      description:
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment. Run all 13 migrations against the live database.",
      category: "cloud",
      priority: "critical",
      status: "open",
      source: "cloud_check",
      actionHref: "/command-center/cloud",
      recommendedOwner: "developer",
      recommendedModel: "sonnet",
      blocksPilot: true,
      blocksProduction: true,
    });

    tasks.push({
      id: "cloud-migrations-apply",
      title: "Apply database migrations",
      description:
        "Run supabase db push or apply migrations 0001–0013 in order. Verify RLS is enabled on all business tables.",
      category: "cloud",
      priority: "critical",
      status: "blocked",
      source: "cloud_check",
      actionHref: "/command-center/health",
      recommendedOwner: "developer",
      recommendedModel: "sonnet",
      blocksPilot: true,
      blocksProduction: true,
    });
  }

  tasks.push({
    id: "cloud-storage-buckets",
    title: "Create and configure storage buckets",
    description:
      "Create case-files and design-files buckets in Supabase Storage with correct RLS policies and CORS settings.",
    category: "cloud",
    priority: "high",
    status: hasSupabaseEnv() ? "open" : "blocked",
    source: "cloud_check",
    actionHref: "/command-center/cloud",
    recommendedOwner: "developer",
    recommendedModel: "sonnet",
    blocksPilot: true,
    blocksProduction: true,
  });

  tasks.push({
    id: "cloud-backup-dr",
    title: "Configure backup and disaster recovery",
    description:
      "Enable Supabase automated backups. Document a restore procedure. Define RTO/RPO targets for the lab.",
    category: "cloud",
    priority: "medium",
    status: "planned",
    source: "cloud_check",
    actionHref: "/command-center/cloud",
    recommendedOwner: "developer",
    recommendedModel: "sonnet",
    blocksPilot: false,
    blocksProduction: true,
  });

  return tasks;
}

// Tasks derived from setup wizard state
function setupTasks(): SystemTask[] {
  return [
    {
      id: "setup-lab-profile",
      title: "Complete lab profile",
      description:
        "Add lab name, address, phone, logo, and default settings in /settings.",
      category: "setup",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/settings",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: true,
    },
    {
      id: "setup-first-doctor",
      title: "Add first doctor and clinic",
      description:
        "Create at least one doctor profile linked to a clinic before testing the case intake flow.",
      category: "setup",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/doctors/new",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: "setup-work-types",
      title: "Configure work types and materials",
      description:
        "Define the lab's restoration types, materials list, and pricing in settings.",
      category: "setup",
      priority: "medium",
      status: "open",
      source: "setup_wizard",
      actionHref: "/settings",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: "setup-demo-case",
      title: "Submit a demo case end-to-end",
      description:
        "Create a test case, move it through all production stages, run QC, and mark as delivered. Validates the full workflow.",
      category: "setup",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/cases/new",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
  ];
}

// Tasks derived from workflow hardening gaps
function workflowTasks(): SystemTask[] {
  return [
    {
      id: "workflow-db-gates",
      title: "Add DB-level workflow gates (H2)",
      description:
        "Add PostgreSQL CHECK constraints or BEFORE UPDATE triggers to enforce: missing-info blocks production entry, QC must pass before delivery, doctor approval required when flagged.",
      category: "workflow",
      priority: "high",
      status: "open",
      source: "security_finding",
      actionHref: "/command-center/security",
      recommendedOwner: "developer",
      recommendedModel: "opus",
      blocksPilot: false,
      blocksProduction: true,
    },
    {
      id: "workflow-settings-validation",
      title: "Add Zod validation to settings server action (H3)",
      description:
        "updateLabSettingsAction() accepts raw FormData without schema validation. Add a Zod schema and validate before writing to the database.",
      category: "workflow",
      priority: "high",
      status: "open",
      source: "security_finding",
      actionHref: "/command-center/security",
      recommendedOwner: "developer",
      recommendedModel: "sonnet",
      blocksPilot: false,
      blocksProduction: true,
    },
  ];
}

// Tasks for deployment readiness
function deploymentTasks(): SystemTask[] {
  return [
    {
      id: "deploy-vercel-config",
      title: "Configure Vercel deployment",
      description:
        "Connect GitHub repo to Vercel. Set all production environment variables. Configure custom domain.",
      category: "deployment",
      priority: "medium",
      status: "planned",
      source: "manual",
      actionHref: "/command-center/cloud",
      recommendedOwner: "developer",
      recommendedModel: "sonnet",
      blocksPilot: false,
      blocksProduction: true,
    },
    {
      id: "deploy-rate-limiting",
      title: "Add rate limiting to auth actions (M4)",
      description:
        "loginAction has no rate limiting. Add Upstash rate limiting or rely on Supabase Auth brute-force protection with documentation.",
      category: "deployment",
      priority: "medium",
      status: "open",
      source: "security_finding",
      actionHref: "/command-center/security",
      recommendedOwner: "developer",
      recommendedModel: "sonnet",
      blocksPilot: false,
      blocksProduction: true,
    },
    {
      id: "deploy-readme",
      title: "Create README.md (L4)",
      description:
        "Add README with project description, tech stack, local setup steps, environment variable list, and branch strategy.",
      category: "deployment",
      priority: "low",
      status: "open",
      source: "security_finding",
      actionHref: "/command-center/health",
      recommendedOwner: "developer",
      recommendedModel: "haiku",
      blocksPilot: false,
      blocksProduction: false,
    },
  ];
}

// Master data configuration tasks (Phase 7)
function masterDataTasks(): SystemTask[] {
  return [
    {
      id: "master-configure-clinics",
      title: "Configure clinics",
      description:
        "Create all clinic profiles with address, phone, and contact info. Assign doctors to clinics before accepting the first real case.",
      category: "setup",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/clinics",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: "master-configure-doctors",
      title: "Configure doctors",
      description:
        "Create all doctor profiles. Link each doctor to their default clinic and assign a price group before the first case.",
      category: "setup",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/doctors/new",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: "master-configure-operations",
      title: "Configure work types / operations",
      description:
        "Define the restoration types your lab performs (crowns, bridges, implants, aligners). Each lab configures its own list — no shared global defaults.",
      category: "setup",
      priority: "medium",
      status: "open",
      source: "setup_wizard",
      actionHref: "/command-center/master-data/operations",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: "master-configure-materials",
      title: "Configure materials",
      description:
        "Define the materials catalogue: zirconia, e.max, PMMA, titanium, etc. Materials drive pricing and production routing.",
      category: "setup",
      priority: "medium",
      status: "open",
      source: "setup_wizard",
      actionHref: "/command-center/master-data/materials",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: false,
      blocksProduction: false,
    },
    {
      id: "master-configure-price-groups",
      title: "Create price groups",
      description:
        "Create named price tiers (Standard, VIP, Wholesale) before adding operation prices. Each doctor is assigned to a price group.",
      category: "setup",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/command-center/master-data/price-groups",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: "master-configure-doctor-prices",
      title: "Configure operation prices",
      description:
        "Set unit prices per operation and material for each price group. Prices are looked up automatically when creating cases.",
      category: "setup",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/command-center/master-data/prices",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: "master-configure-technician-prices",
      title: "Configure technician rates",
      description:
        "Set internal cost rates per operation for each technician. Used for margin tracking. Requires operations to be configured first.",
      category: "setup",
      priority: "low",
      status: "open",
      source: "setup_wizard",
      actionHref: "/command-center/master-data/technician-rates",
      recommendedOwner: "owner",
      recommendedModel: "sonnet",
      blocksPilot: false,
      blocksProduction: false,
    },
    {
      id: "master-first-real-case",
      title: "Create first real production case",
      description:
        "After clinics, doctors, and prices are configured, create the first real case with real arch/tooth selection and move it through production.",
      category: "pilot",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/cases/new",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: "master-production-dnd",
      title: "Drag-and-drop on production board",
      description:
        "@hello-pangea/dnd installed. Cards can be dragged between stage columns. Server-side rules are enforced — blocked moves show an error and revert. Quick prev/next buttons remain as fallback.",
      category: "ui",
      priority: "medium",
      status: "done",
      source: "manual",
      actionHref: "/production",
      recommendedOwner: "developer",
      recommendedModel: "sonnet",
      blocksPilot: false,
      blocksProduction: false,
    },
    {
      id: "master-configure-portal-access",
      title: "Configure portal access",
      description:
        "Link technician and doctor portal accounts. Create users in Supabase Auth, then paste their UID into each technician/doctor edit page.",
      category: "setup",
      priority: "medium",
      status: "open",
      source: "setup_wizard",
      actionHref: "/command-center/users",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: false,
      blocksProduction: false,
    },
    {
      id: "master-review-permissions",
      title: "Review base permissions",
      description:
        "Review the 12-group permission matrix. Confirm role boundaries match your lab policy before inviting team members.",
      category: "setup",
      priority: "medium",
      status: "open",
      source: "setup_wizard",
      actionHref: "/command-center/roles",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: false,
      blocksProduction: false,
    },
  ];
}

// Tasks for pilot launch
function pilotTasks(): SystemTask[] {
  return [
    {
      id: "pilot-first-technician",
      title: "Add first technician",
      description:
        "Create a technician record at /technicians/new. Add name, phone, skills, and employment status. Portal account (Supabase Auth invite) can be linked later.",
      category: "pilot",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/technicians/new",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: "pilot-assign-technician",
      title: "Assign technician to first case",
      description:
        "Go to the Production board, find an active case, and assign your first technician. The technician's name will appear on the card.",
      category: "pilot",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/production",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: "pilot-technician-rates",
      title: "Configure technician operation rates",
      description:
        "Set per-operation internal cost rates for each technician at /command-center/master-data/technician-rates. Used for margin tracking.",
      category: "pilot",
      priority: "medium",
      status: "open",
      source: "setup_wizard",
      actionHref: "/command-center/master-data/technician-rates",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: false,
      blocksProduction: false,
    },
    {
      id: "pilot-link-technician-portal",
      title: "Link technician portal account",
      description:
        "Create a user in Supabase Auth, copy their UID, then link it from the technician edit page → Portal account section. This unlocks the technician workspace login.",
      category: "pilot",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/technicians",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: "pilot-doctor-portal-test",
      title: "Test doctor portal with a real doctor login",
      description:
        "Link a doctor portal account (doctor edit page → Portal account), log in as that doctor, verify case visibility, file access, and statement page are correct.",
      category: "pilot",
      priority: "high",
      status: "open",
      source: "setup_wizard",
      actionHref: "/doctors",
      recommendedOwner: "owner",
      recommendedModel: "haiku",
      blocksPilot: true,
      blocksProduction: false,
    },
  ];
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function getSystemTasks(): SystemTask[] {
  const all = [
    ...securityFindingTasks(),
    ...cloudTasks(),
    ...setupTasks(),
    ...masterDataTasks(),
    ...workflowTasks(),
    ...deploymentTasks(),
    ...pilotTasks(),
  ];

  return all.sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      a.title.localeCompare(b.title),
  );
}

export function getPilotBlockers(): SystemTask[] {
  return getSystemTasks().filter((t) => t.blocksPilot && t.status !== "done");
}

export function getProductionBlockers(): SystemTask[] {
  return getSystemTasks().filter(
    (t) => t.blocksProduction && t.status !== "done",
  );
}

export function getTopUrgentTasks(limit = 5): SystemTask[] {
  return getSystemTasks()
    .filter((t) => t.status === "open" || t.status === "planned")
    .slice(0, limit);
}
