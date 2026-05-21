export type FindingSeverity = "critical" | "high" | "medium" | "low";
export type FindingStatus = "open" | "in-progress" | "resolved";

export type SecurityFinding = {
  id: string;
  title: string;
  severity: FindingSeverity;
  affectedArea: string;
  detail: string;
  recommendedAction: string;
  status: FindingStatus;
  phase: string;
};

export const SECURITY_FINDINGS: SecurityFinding[] = [
  // Critical
  {
    id: "C1",
    severity: "critical",
    status: "resolved",
    phase: "Phase 3",
    title: "Dashboard query missing explicit lab_id filter",
    affectedArea: "lib/data/dashboard.ts",
    detail:
      "getDashboardData() queried the cases table without .eq('lab_id') at the query layer. Relied solely on RLS for tenant isolation.",
    recommendedAction:
      "Fixed in Phase 3: getDashboardData() now accepts AuthSessionContext and applies .eq('lab_id', session.activeLabId) to all cases queries. getCaseFormOptions() also receives session and applies lab_id to doctors and clinics queries (H1 fixed together).",
  },
  {
    id: "C2",
    severity: "critical",
    status: "resolved",
    phase: "Phase 3",
    title: "Doctor can access any file they uploaded via uploaded_by bypass",
    affectedArea: "supabase/migrations/0011_security_hotfixes.sql",
    detail:
      "can_select_case_file() granted access when uploaded_by = auth.uid() regardless of the visibility flag. A doctor who uploaded a private_finance file retained read access indefinitely.",
    recommendedAction:
      "Fixed in Phase 3 via migration 0011: doctor branch now requires cf.visibility = 'doctor_visible' only. The uploaded_by bypass is removed entirely. Accountant branch extended to include visibility = 'private_finance'.",
  },
  {
    id: "C3",
    severity: "critical",
    status: "resolved",
    phase: "Phase 3",
    title: "Preview auth hardcodes lab_owner session without Supabase check",
    affectedArea: "lib/env.ts, lib/auth/session.ts",
    detail:
      "canUsePreviewAuth() returned true when Supabase env vars were missing AND NODE_ENV !== 'production'. Staging environments with missing env vars silently received a hardcoded lab_owner session.",
    recommendedAction:
      "Fixed in Phase 3: canUsePreviewAuth() now requires LABFLOW_DEV_PREVIEW=1 as an explicit server-side opt-in. Without this flag, missing Supabase env vars throw a ConfigurationError instead of granting a fake session. .env.example documents the flag.",
  },
  {
    id: "C4",
    severity: "critical",
    status: "resolved",
    phase: "Phase 3",
    title: "Finance dashboard has no doctor_id filter at query layer",
    affectedArea: "lib/data/finance.ts, app/doctor-portal/statement/page.tsx",
    detail:
      "getFinanceDashboard() included doctor in canUseFinance(), allowing doctors to call it and receive all lab invoices without any doctor_id filter.",
    recommendedAction:
      "Fixed in Phase 3: doctor removed from canUseFinance(). Doctor removed from /invoices route. New getDoctorStatementData(session) resolves doctor from session.userId (no external doctorId) and scopes all queries by lab_id + doctor.id. Doctor portal statement page uses the new loader.",
  },

  // High
  {
    id: "H1",
    severity: "high",
    status: "resolved",
    phase: "Phase 3",
    title: "getCaseFormOptions missing explicit lab_id filters",
    affectedArea: "lib/data/dashboard.ts",
    detail:
      "getCaseFormOptions() queried doctors and clinics without .eq('lab_id'). In a multi-tenant environment this exposed doctor/clinic lists from other labs if RLS was bypassed.",
    recommendedAction:
      "Fixed in Phase 3 (alongside C1): getCaseFormOptions() now accepts AuthSessionContext and applies .eq('lab_id', session.activeLabId) to both doctors and clinics queries.",
  },
  {
    id: "H2",
    severity: "high",
    status: "open",
    phase: "Phase 2",
    title: "Workflow gates enforced only at application layer",
    affectedArea: "supabase/migrations/ (no DB triggers)",
    detail:
      "Missing-info status, QC pass requirement, and doctor approval before manufacturing are checked only in application code. A direct Supabase API call or a future code path can bypass these gates entirely.",
    recommendedAction:
      "Add PostgreSQL CHECK constraints or BEFORE UPDATE triggers to enforce: (1) cases cannot move to production if missing_info_status != 'complete', (2) cases cannot move to ready_for_delivery without a passing quality_check, (3) doctor_approval_required cases cannot enter manufacturing without approval.",
  },
  {
    id: "H3",
    severity: "high",
    status: "open",
    phase: "Phase 2",
    title: "updateLabSettingsAction has no Zod validation",
    affectedArea: "app/actions/settings.ts",
    detail:
      "updateLabSettingsAction() accepts raw FormData strings and writes them directly to the database without schema validation. Arbitrary string values can corrupt settings rows.",
    recommendedAction:
      "Define a Zod schema for lab settings and validate formData with it at the top of the server action. Reject the request with a structured error if validation fails.",
  },

  // Medium
  {
    id: "M1",
    severity: "medium",
    status: "open",
    phase: "Phase 2",
    title: "tsconfig.json targets ES2017 — outdated for Node 22",
    affectedArea: "tsconfig.json",
    detail:
      "The TypeScript target is ES2017 which is well below what Node 22 and Next.js 16 support. This can prevent modern syntax from being emitted and may cause Turbopack build warnings.",
    recommendedAction:
      'Update tsconfig.json "target" to "ES2022" or "ESNext" and "lib" to ["ES2022", "dom", "dom.iterable"].',
  },
  {
    id: "M2",
    severity: "medium",
    status: "open",
    phase: "Phase 2",
    title: "Payment reference uses id.slice(0,8) — not human-readable",
    affectedArea: "lib/data/finance.ts (getDoctorStatement)",
    detail:
      "Payment reference numbers are generated from the first 8 characters of a UUID. These are not meaningful to accountants or doctors reviewing statements.",
    recommendedAction:
      "Generate human-readable payment references using a sequence (e.g., PAY-2026-0001) stored in the database, or at minimum use a stable prefix + checksum derived from the invoice number.",
  },
  {
    id: "M3",
    severity: "medium",
    status: "open",
    phase: "Phase 2",
    title: "Preview auth UUID could collide with real lab IDs in staging",
    affectedArea: "lib/auth/session.ts",
    detail:
      "The hardcoded preview UUID (00000000-0000-4000-8000-000000000001) is fixed in code. If a staging database ever seeds a lab with this ID, preview auth would silently grant access to a real lab's data.",
    recommendedAction:
      "Use a UUID that is impossible to collide with real data (e.g., all-zeroes is safer than a seeded value) and add an explicit check that no real lab has this ID on startup.",
  },
  {
    id: "M4",
    severity: "medium",
    status: "open",
    phase: "Phase 2",
    title: "No rate limiting on login action",
    affectedArea: "app/actions/auth/loginAction (or equivalent)",
    detail:
      "The loginAction server action has no rate limiting. An attacker can brute-force credentials by sending unlimited auth requests.",
    recommendedAction:
      "Add rate limiting to the login action using an in-memory store (upstash/ratelimit on Vercel) or rely on Supabase Auth's built-in brute-force protection. Document which mechanism is active.",
  },
  {
    id: "M5",
    severity: "medium",
    status: "open",
    phase: "Phase 2",
    title: "Delivery fetcher relies on single RLS defense layer",
    affectedArea: "lib/data/delivery.ts",
    detail:
      "The delivery data fetcher does not add an explicit .eq('lab_id') filter. If the delivery table's RLS policy is ever misconfigured or disabled, cases from other labs could be returned.",
    recommendedAction:
      "Add .eq('lab_id', session.activeLabId) to all delivery queries at the application layer as a second line of defense.",
  },

  // Low
  {
    id: "L1",
    severity: "low",
    status: "open",
    phase: "Phase 2",
    title: "tsconfig.tsbuildinfo committed to git",
    affectedArea: ".gitignore / tsconfig.tsbuildinfo",
    detail:
      "The TypeScript incremental build cache file is tracked in git. It can contain paths specific to a developer's machine and will cause unnecessary merge conflicts.",
    recommendedAction: "Add tsconfig.tsbuildinfo to .gitignore and remove it from git tracking with git rm --cached tsconfig.tsbuildinfo.",
  },
  {
    id: "L2",
    severity: "low",
    status: "open",
    phase: "Phase 2",
    title: "Settings returns hardcoded defaults for materials and QC settings",
    affectedArea: "lib/data/settings.ts",
    detail:
      "The materials list and QC settings return hardcoded fallback values instead of reading from the database. Labs cannot configure these via the settings UI.",
    recommendedAction:
      "Load materials and QC settings from the lab_settings table and return empty arrays or null when the DB row is missing, letting the UI render an empty-state prompt.",
  },
  {
    id: "L3",
    severity: "low",
    status: "open",
    phase: "Phase 2",
    title: "Doctor performance metric always returns empty array",
    affectedArea: "lib/data/dashboard.ts (doctor performance section)",
    detail:
      "The getDoctorPerformance() portion of the dashboard data always returns [] regardless of actual case data. Lab owners see a blank performance panel with no indication it's a placeholder.",
    recommendedAction:
      "Either implement the query (join cases + doctors, group by doctor_id, aggregate turnaround time) or surface a clear placeholder UI that explains the metric is not yet computed.",
  },
  {
    id: "L4",
    severity: "low",
    status: "open",
    phase: "Phase 2",
    title: "No README.md in the repository",
    affectedArea: "/ (repository root)",
    detail:
      "The repository has no README. Contributors and reviewers have no documented setup instructions, environment variable reference, or project overview.",
    recommendedAction:
      "Create README.md with: project description, tech stack, local setup steps, environment variable list, and branch/phase strategy.",
  },
];

const open = SECURITY_FINDINGS.filter((f) => f.status === "open");

// Score-affecting counts use only open findings — resolved items improve the score.
export const FINDING_COUNTS = {
  critical: open.filter((f) => f.severity === "critical").length,
  high: open.filter((f) => f.severity === "high").length,
  medium: open.filter((f) => f.severity === "medium").length,
  low: open.filter((f) => f.severity === "low").length,
  total: SECURITY_FINDINGS.length,
  openTotal: open.length,
};
