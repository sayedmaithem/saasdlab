import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSessionContext } from "@/types/app";

export type ReportMetric = {
  label: string;
  value: string;
  hint: string;
};

export type OpsReportsData = {
  metrics: ReportMetric[];
  stageBottlenecks: Array<{ stage: string; count: number }>;
  workTypeDistribution: Array<{ workType: string; count: number }>;
  doctorScores: Array<{ doctor: string; cases: number; revenue: number; missingRate: number; remakeRate: number }>;
  qcAnalysis: Array<{ result: string; count: number }>;
  remakeAnalysis: Array<{ reason: string; count: number; costImpact: number }>;
  overdueCases: Array<{ caseNumber: string; doctor: string; dueDate: string | null; stage: string }>;
};

function assertLab(session: AuthSessionContext) {
  if (!session.activeLabId) throw new Error("No active lab was found.");
  return session.activeLabId;
}

export async function getOpsReports(session: AuthSessionContext): Promise<OpsReportsData> {
  const labId = assertLab(session);
  if (!hasSupabaseEnv()) {
    return {
      metrics: [
        { label: "Monthly revenue", value: "$0", hint: "Connect Supabase for live reporting" },
        { label: "Unpaid balance", value: "$0", hint: "Finance totals" },
        { label: "Remake rate", value: "0%", hint: "Remakes / cases" },
        { label: "QC failure rate", value: "0%", hint: "Failed QC / QC checks" },
      ],
      stageBottlenecks: [],
      workTypeDistribution: [],
      doctorScores: [],
      qcAnalysis: [],
      remakeAnalysis: [],
      overdueCases: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: cases }, { data: invoices }, { data: checks }, { data: remakes }] =
    await Promise.all([
      supabase
        .from("cases")
        .select("case_number, current_stage, stage, due_date, work_type, restoration_type, missing_info_status, is_remake, doctor_id, doctors(display_name)")
        .eq("lab_id", labId)
        .returns<Array<{ case_number: string; current_stage: string | null; stage: string; due_date: string | null; work_type: string | null; restoration_type: string; missing_info_status: string | null; is_remake: boolean | null; doctor_id: string; doctors: { display_name: string } | null }>>(),
      supabase
        .from("invoices")
        .select("doctor_id, total, remaining_balance, issue_date, doctors(display_name)")
        .eq("lab_id", labId)
        .returns<Array<{ doctor_id: string; total: number; remaining_balance: number; issue_date: string | null; doctors: { display_name: string } | null }>>(),
      supabase
        .from("quality_checks")
        .select("result")
        .eq("lab_id", labId)
        .returns<Array<{ result: string }>>(),
      supabase
        .from("remakes")
        .select("reason, cost_impact, cases(doctor_id, doctors(display_name))")
        .eq("lab_id", labId)
        .returns<Array<{ reason: string; cost_impact: number | null; cases: { doctor_id: string; doctors: { display_name: string } | null } | null }>>(),
    ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const stageCounts = new Map<string, number>();
  const workTypeCounts = new Map<string, number>();
  const doctorCaseCounts = new Map<string, { doctor: string; cases: number; missing: number; remakes: number; revenue: number }>();
  const qcCounts = new Map<string, number>();
  const remakeCounts = new Map<string, { count: number; costImpact: number }>();

  for (const item of cases ?? []) {
    const stage = item.current_stage ?? item.stage;
    const workType = item.work_type ?? item.restoration_type;
    const doctor = item.doctors?.display_name ?? "Unknown doctor";
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
    workTypeCounts.set(workType, (workTypeCounts.get(workType) ?? 0) + 1);
    const doctorStats = doctorCaseCounts.get(item.doctor_id) ?? { doctor, cases: 0, missing: 0, remakes: 0, revenue: 0 };
    doctorStats.cases += 1;
    if (item.missing_info_status === "missing") doctorStats.missing += 1;
    if (item.is_remake) doctorStats.remakes += 1;
    doctorCaseCounts.set(item.doctor_id, doctorStats);
  }

  for (const invoice of invoices ?? []) {
    const stats = doctorCaseCounts.get(invoice.doctor_id) ?? {
      doctor: invoice.doctors?.display_name ?? "Unknown doctor",
      cases: 0,
      missing: 0,
      remakes: 0,
      revenue: 0,
    };
    stats.revenue += Number(invoice.total ?? 0);
    doctorCaseCounts.set(invoice.doctor_id, stats);
  }

  for (const check of checks ?? []) qcCounts.set(check.result, (qcCounts.get(check.result) ?? 0) + 1);
  for (const remake of remakes ?? []) {
    const existing = remakeCounts.get(remake.reason) ?? { count: 0, costImpact: 0 };
    existing.count += 1;
    existing.costImpact += Number(remake.cost_impact ?? 0);
    remakeCounts.set(remake.reason, existing);
  }

  const monthlyRevenue = (invoices ?? [])
    .filter((invoice) => invoice.issue_date && new Date(invoice.issue_date) >= monthStart)
    .reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);
  const unpaid = (invoices ?? []).reduce((sum, invoice) => sum + Number(invoice.remaining_balance ?? 0), 0);
  const qcTotal = checks?.length ?? 0;
  const qcFailed = (checks ?? []).filter((check) => check.result === "failed").length;
  const totalCases = cases?.length ?? 0;

  return {
    metrics: [
      { label: "Monthly revenue", value: `$${monthlyRevenue.toFixed(0)}`, hint: "Issued invoices this month" },
      { label: "Unpaid balance", value: `$${unpaid.toFixed(0)}`, hint: "Remaining invoice balance" },
      { label: "Remake rate", value: `${totalCases ? (((remakes?.length ?? 0) / totalCases) * 100).toFixed(1) : 0}%`, hint: "Remakes / cases" },
      { label: "QC failure rate", value: `${qcTotal ? ((qcFailed / qcTotal) * 100).toFixed(1) : 0}%`, hint: "Failed QC / checks" },
    ],
    stageBottlenecks: Array.from(stageCounts.entries()).map(([stage, count]) => ({ stage, count })).sort((a, b) => b.count - a.count),
    workTypeDistribution: Array.from(workTypeCounts.entries()).map(([workType, count]) => ({ workType, count })).sort((a, b) => b.count - a.count),
    doctorScores: Array.from(doctorCaseCounts.values())
      .map((item) => ({
        doctor: item.doctor,
        cases: item.cases,
        revenue: item.revenue,
        missingRate: item.cases ? (item.missing / item.cases) * 100 : 0,
        remakeRate: item.cases ? (item.remakes / item.cases) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue),
    qcAnalysis: Array.from(qcCounts.entries()).map(([result, count]) => ({ result, count })),
    remakeAnalysis: Array.from(remakeCounts.entries()).map(([reason, value]) => ({ reason, count: value.count, costImpact: value.costImpact })),
    overdueCases: (cases ?? [])
      .filter((item) => item.due_date && item.due_date < new Date().toISOString().slice(0, 10))
      .map((item) => ({
        caseNumber: item.case_number,
        doctor: item.doctors?.display_name ?? "Unknown doctor",
        dueDate: item.due_date,
        stage: item.current_stage ?? item.stage,
      })),
  };
}
