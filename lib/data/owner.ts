import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { stageLabels } from "@/lib/constants/workflow";
import type { AuthSessionContext } from "@/types/app";

export type OwnerOperationalSnapshot = {
  activeCasesCount: number;
  overdueCasesCount: number;
  casesTodayCount: number;
  totalOutstanding: number;
  overdueInvoicesCount: number;
};

/**
 * Real-time operational snapshot for the Lab Owner / Manager.
 * Always scoped to session.activeLabId — never crosses tenant boundary.
 */
export async function getOwnerOperationalSnapshot(
  session: AuthSessionContext,
): Promise<OwnerOperationalSnapshot> {
  const labId = session.activeLabId;

  if (!hasSupabaseEnv() || !labId) {
    return {
      activeCasesCount: 12,
      overdueCasesCount: 3,
      casesTodayCount: 5,
      totalOutstanding: 14_250,
      overdueInvoicesCount: 2,
    };
  }

  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const [activeResult, overdueResult, todayResult, outstandingResult, overdueInvResult] =
    await Promise.all([
      // Active cases (not completed, cancelled, or archived)
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .eq("lab_id", labId)
        .not("status", "in", '("completed","cancelled","archived")'),

      // Overdue cases (due_date < today, not completed)
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .eq("lab_id", labId)
        .lt("due_date", today)
        .not("status", "in", '("completed","cancelled","archived")'),

      // Cases due today
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .eq("lab_id", labId)
        .eq("due_date", today)
        .not("status", "in", '("completed","cancelled","archived")'),

      // Total outstanding balance (sum of remaining_balance on open invoices)
      supabase
        .from("invoices")
        .select("remaining_balance")
        .eq("lab_id", labId)
        .not("status", "in", '("paid","cancelled","voided")'),

      // Overdue invoices count
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("lab_id", labId)
        .eq("status", "overdue"),
    ]);

  // Sum remaining_balance manually (Supabase JS doesn't support aggregate select cleanly)
  const invoiceRows = outstandingResult.data as Array<{ remaining_balance: number }> | null;
  const totalOutstanding = (invoiceRows ?? []).reduce(
    (sum, row) => sum + (row.remaining_balance ?? 0),
    0,
  );

  return {
    activeCasesCount: activeResult.count ?? 0,
    overdueCasesCount: overdueResult.count ?? 0,
    casesTodayCount: todayResult.count ?? 0,
    totalOutstanding,
    overdueInvoicesCount: overdueInvResult.count ?? 0,
  };
}

export type OverdueCaseRow = {
  id: string;
  caseNumber: string;
  patientName: string;
  doctorName: string;
  dueDate: string;
  currentStage: string;
  daysOverdue: number;
};

type RawOverdueCaseRow = {
  id: string;
  case_number: string;
  patient_name: string | null;
  patient_display: string;
  due_date: string | null;
  current_stage: string | null;
  stage: string;
  doctors: { display_name: string } | null;
};

/**
 * Top overdue cases for the owner action panel.
 */
export async function getOwnerOverdueCases(
  session: AuthSessionContext,
  limit = 5,
): Promise<OverdueCaseRow[]> {
  const labId = session.activeLabId;

  if (!hasSupabaseEnv() || !labId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("cases")
    .select(
      "id, case_number, patient_name, patient_display, due_date, current_stage, stage, doctors(display_name)",
    )
    .eq("lab_id", labId)
    .lt("due_date", today)
    .not("status", "in", '("completed","cancelled","archived")')
    .order("due_date", { ascending: true })
    .limit(limit)
    .returns<RawOverdueCaseRow[]>();

  const nowMs = Date.now();

  return (data ?? []).map((row) => {
    const dueDate = row.due_date ?? "";
    const daysOverdue = dueDate
      ? Math.floor((nowMs - new Date(dueDate).getTime()) / 86_400_000)
      : 0;
    return {
      id: row.id,
      caseNumber: row.case_number,
      patientName: row.patient_name ?? row.patient_display,
      doctorName: row.doctors?.display_name ?? "Unknown",
      dueDate,
      currentStage: row.current_stage ?? row.stage,
      daysOverdue,
    };
  });
}

// ── Operational Insights ──────────────────────────────────────────────────────

export type BottleneckStage = {
  stage: string;
  label: string;
  count: number;
};

export type OwnerOperationalInsights = {
  casesMissingTechnicianCount: number;
  casesMissingPriceCount: number;
  casesWaitingApprovalCount: number;
  casesWaitingQCCount: number;
  casesReadyForDeliveryCount: number;
  /** Top-5 stages by active case count, descending */
  bottlenecksByStage: BottleneckStage[];
  /**
   * True if the lab has at least one active workflow template configured.
   * False means the lab is running on the hardcoded 18-stage fixed enum only.
   * Null means the workflow tables are not accessible (query error or env missing).
   */
  workflowConfigured: boolean | null;
  /** True if the lab has any workflow_transitions configured (engine is active). */
  transitionsConfigured: boolean | null;
  /** True if the lab has any technician_stage_permissions configured. */
  techPermissionsConfigured: boolean | null;
};

type InsightCaseRow = {
  current_stage: string | null;
  stage: string;
};

/**
 * Deeper operational insights for the Lab Owner / Manager dashboard.
 *
 * Performance: Uses targeted count queries instead of loading all case rows,
 * plus a bounded stage-distribution query capped at 500 rows for bottleneck analysis.
 *
 * Returns new Phase 17 metrics:
 * - casesWaitingQCCount: cases in quality_control stage
 * - casesReadyForDeliveryCount: cases in ready_for_delivery stage
 * - transitionsConfigured: workflow engine is active
 * - techPermissionsConfigured: per-technician stage gates are active
 */
export async function getOwnerOperationalInsights(
  session: AuthSessionContext,
): Promise<OwnerOperationalInsights> {
  const labId = session.activeLabId;

  const empty: OwnerOperationalInsights = {
    casesMissingTechnicianCount: 0,
    casesMissingPriceCount: 0,
    casesWaitingApprovalCount: 0,
    casesWaitingQCCount: 0,
    casesReadyForDeliveryCount: 0,
    bottlenecksByStage: [],
    workflowConfigured: null,
    transitionsConfigured: null,
    techPermissionsConfigured: null,
  };

  if (!hasSupabaseEnv() || !labId) return empty;

  // Cast as any: workflow tables may not be in generated types yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createSupabaseServerClient() as any;

  // Run all queries in parallel for efficiency.
  // Targeted count queries replace the previously unbounded full-table scan.
  const [
    missingTechResult,
    missingPriceResult,
    waitingApprovalResult,
    waitingQCResult,
    readyForDeliveryResult,
    stageDistResult,
    workflowResult,
    transitionsResult,
    techPermsResult,
  ] = await Promise.all([
    // Cases without an assigned technician
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .is("assigned_technician_id", null)
      .not("status", "in", '("completed","cancelled","archived")'),

    // Cases without a price
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .or("total_price.is.null,total_price.eq.0")
      .not("status", "in", '("completed","cancelled","archived")'),

    // Cases waiting doctor approval (at doctor_approval stage)
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("current_stage", "doctor_approval")
      .not("status", "in", '("completed","cancelled","archived")'),

    // Cases waiting QC
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("current_stage", "quality_control")
      .not("status", "in", '("completed","cancelled","archived")'),

    // Cases ready for delivery
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("current_stage", "ready_for_delivery")
      .not("status", "in", '("completed","cancelled","archived")'),

    // Stage distribution — bounded to 500 rows for bottleneck analysis
    supabase
      .from("cases")
      .select("current_stage, stage")
      .eq("lab_id", labId)
      .not("status", "in", '("completed","cancelled","archived")')
      .limit(500),

    // Workflow template readiness
    supabase
      .from("lab_workflow_templates")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("is_active", true),

    // Workflow transitions readiness (engine is active when > 0)
    supabase
      .from("workflow_transitions")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("is_active", true),

    // Technician stage permissions readiness
    supabase
      .from("technician_stage_permissions")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId),
  ]);

  // Bottleneck calculation from bounded stage-distribution query
  const stageRows = (stageDistResult.data ?? []) as InsightCaseRow[];
  const stageCounts = new Map<string, number>();
  for (const row of stageRows) {
    const stage = row.current_stage ?? row.stage;
    if (stage) stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
  }
  const bottlenecksByStage: BottleneckStage[] = Array.from(stageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([stage, count]) => ({
      stage,
      label: stageLabels[stage as keyof typeof stageLabels] ?? stage.replaceAll("_", " "),
      count,
    }));

  return {
    casesMissingTechnicianCount: missingTechResult.count ?? 0,
    casesMissingPriceCount: missingPriceResult.count ?? 0,
    casesWaitingApprovalCount: waitingApprovalResult.count ?? 0,
    casesWaitingQCCount: waitingQCResult.count ?? 0,
    casesReadyForDeliveryCount: readyForDeliveryResult.count ?? 0,
    bottlenecksByStage,
    workflowConfigured: workflowResult.error != null ? null : (workflowResult.count ?? 0) > 0,
    transitionsConfigured: transitionsResult.error != null ? null : (transitionsResult.count ?? 0) > 0,
    techPermissionsConfigured: techPermsResult.error != null ? null : (techPermsResult.count ?? 0) > 0,
  };
}

// ── Pilot Readiness ───────────────────────────────────────────────────────────

export type PilotReadinessData = {
  workflowConfigured: boolean;
  techniciansExist: boolean;
  doctorsExist: boolean;
  operationsExist: boolean;
  activeCasesExist: boolean;
  passCount: number;
  totalCount: number;
  allReady: boolean;
};

/**
 * Five-point lab setup health check.
 * Used on the owner dashboard to surface incomplete configuration before
 * the lab goes live with real cases.
 */
export async function getPilotReadinessData(
  session: AuthSessionContext,
): Promise<PilotReadinessData> {
  const labId = session.activeLabId;

  const empty: PilotReadinessData = {
    workflowConfigured: false,
    techniciansExist: false,
    doctorsExist: false,
    operationsExist: false,
    activeCasesExist: false,
    passCount: 0,
    totalCount: 5,
    allReady: false,
  };

  if (!hasSupabaseEnv() || !labId) return empty;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createSupabaseServerClient() as any;

  const [wfResult, techResult, docResult, opsResult, casesResult] = await Promise.all([
    supabase
      .from("lab_workflow_templates")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("is_active", true),
    supabase
      .from("technicians")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId),
    supabase
      .from("doctors")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId),
    supabase
      .from("lab_operations")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .eq("is_active", true),
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("lab_id", labId)
      .not("status", "in", '("completed","cancelled","archived")'),
  ]);

  const workflowConfigured = !wfResult.error && (wfResult.count ?? 0) > 0;
  const techniciansExist = !techResult.error && (techResult.count ?? 0) > 0;
  const doctorsExist = !docResult.error && (docResult.count ?? 0) > 0;
  const operationsExist = !opsResult.error && (opsResult.count ?? 0) > 0;
  const activeCasesExist = !casesResult.error && (casesResult.count ?? 0) > 0;

  const checks = [workflowConfigured, techniciansExist, doctorsExist, operationsExist, activeCasesExist];
  const passCount = checks.filter(Boolean).length;

  return {
    workflowConfigured,
    techniciansExist,
    doctorsExist,
    operationsExist,
    activeCasesExist,
    passCount,
    totalCount: 5,
    allReady: passCount === 5,
  };
}
