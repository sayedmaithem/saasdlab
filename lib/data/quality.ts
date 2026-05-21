import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSessionContext } from "@/types/app";
import {
  isRemakeResponsibility,
  type QcResult,
  type RemakeResponsibility,
} from "@/lib/quality/qc-rules";

export type QualityControlCase = {
  id: string;
  caseNumber: string;
  patientName: string;
  workType: string;
  dueDate: string | null;
  doctorName: string;
  technicianName: string;
  checkerName: string | null;
  qcStatus: QcResult | "pending";
  notes: string | null;
};

export type RemakeListItem = {
  id: string;
  caseId: string;
  caseNumber: string;
  doctorName: string;
  technicianId: string | null;
  reason: string;
  responsibility: RemakeResponsibility;
  costImpact: number;
  notes: string | null;
  createdAt: string;
};

export type RemakeFilters = {
  doctorId?: string;
  responsibility?: string;
  reason?: string;
  from?: string;
  to?: string;
};

type QualityCaseRow = {
  id: string;
  case_number: string;
  patient_name: string | null;
  patient_display: string;
  work_type: string | null;
  restoration_type: string;
  due_date: string | null;
  doctors: { display_name: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

type QualityCheckRow = {
  case_id: string;
  result: QcResult;
  notes: string | null;
  checked_by: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type RemakeRow = {
  id: string;
  case_id: string;
  reason: string;
  responsibility: RemakeResponsibility;
  cost_impact: number | null;
  notes: string | null;
  created_at: string;
  cases: {
    id: string;
    case_number: string;
    doctor_id: string;
    assigned_technician_id: string | null;
    doctors: { display_name: string } | null;
  } | null;
};

function assertLab(session: AuthSessionContext) {
  if (!session.activeLabId) {
    throw new Error("No active lab was found for this user.");
  }

  return session.activeLabId;
}

export async function getQualityControlData(session: AuthSessionContext) {
  const labId = assertLab(session);

  if (!hasSupabaseEnv()) {
    return { cases: [] as QualityControlCase[] };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: cases, error: casesError }, { data: checks, error: checksError }] =
    await Promise.all([
      supabase
        .from("cases")
        .select(
          "id, case_number, patient_name, patient_display, work_type, restoration_type, due_date, doctors(display_name), profiles:assigned_technician_id(full_name, email)",
        )
        .eq("lab_id", labId)
        .eq("current_stage", "quality_control")
        .order("due_date", { ascending: true })
        .returns<QualityCaseRow[]>(),
      supabase
        .from("quality_checks")
        .select("case_id, result, notes, checked_by")
        .eq("lab_id", labId)
        .order("created_at", { ascending: false })
        .returns<QualityCheckRow[]>(),
    ]);

  if (casesError ?? checksError) throw new Error((casesError ?? checksError)?.message);

  const checkerIds = Array.from(
    new Set((checks ?? []).map((item) => item.checked_by).filter(Boolean) as string[]),
  );
  const { data: checkerProfiles, error: profilesError } = checkerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", checkerIds)
        .returns<ProfileRow[]>()
    : { data: [], error: null };

  if (profilesError) throw new Error(profilesError.message);

  const checkerMap = new Map(
    (checkerProfiles ?? []).map((profile) => [
      profile.id,
      profile.full_name ?? profile.email ?? "Unknown user",
    ]),
  );
  const latestCheck = new Map<string, QualityCheckRow>();

  for (const check of checks ?? []) {
    if (!latestCheck.has(check.case_id)) latestCheck.set(check.case_id, check);
  }

  return {
    cases: (cases ?? []).map((item) => {
      const check = latestCheck.get(item.id);

      return {
        id: item.id,
        caseNumber: item.case_number,
        patientName: item.patient_name ?? item.patient_display,
        workType: item.work_type ?? item.restoration_type,
        dueDate: item.due_date,
        doctorName: item.doctors?.display_name ?? "Unknown doctor",
        technicianName:
          item.profiles?.full_name ?? item.profiles?.email ?? "Unassigned",
        checkerName: check?.checked_by ? checkerMap.get(check.checked_by) ?? null : null,
        qcStatus: (check?.result ?? "pending") as QualityControlCase["qcStatus"],
        notes: check?.notes ?? null,
      };
    }),
  };
}

export async function getRemakesData(
  session: AuthSessionContext,
  filters: RemakeFilters,
) {
  const labId = assertLab(session);

  if (!hasSupabaseEnv()) {
    return {
      remakes: [] as RemakeListItem[],
      doctors: [] as Array<{ id: string; name: string }>,
      analytics: {
        remakesThisMonth: 0,
        totalCostImpact: 0,
        topReasons: [] as Array<{ reason: string; count: number }>,
        byDoctor: [] as Array<{ doctor: string; count: number }>,
        byTechnician: [] as Array<{ technicianId: string; count: number }>,
      },
    };
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("remakes")
    .select(
      "id, case_id, reason, responsibility, cost_impact, notes, created_at, cases(id, case_number, doctor_id, assigned_technician_id, doctors(display_name))",
    )
    .eq("lab_id", labId)
    .order("created_at", { ascending: false });

  if (filters.responsibility && isRemakeResponsibility(filters.responsibility)) {
    query = query.eq("responsibility", filters.responsibility);
  }
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00.000Z`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59.999Z`);

  const [{ data: remakes, error }, { data: doctors, error: doctorsError }] =
    await Promise.all([
      query.returns<RemakeRow[]>(),
      supabase
        .from("doctors")
        .select("id, display_name")
        .eq("lab_id", labId)
        .order("display_name")
        .returns<Array<{ id: string; display_name: string }>>(),
    ]);

  if (error ?? doctorsError) throw new Error((error ?? doctorsError)?.message);

  let items = (remakes ?? []).map((item) => ({
    id: item.id,
    caseId: item.case_id,
    caseNumber: item.cases?.case_number ?? "Unknown case",
    doctorName: item.cases?.doctors?.display_name ?? "Unknown doctor",
    technicianId: item.cases?.assigned_technician_id ?? null,
    reason: item.reason,
    responsibility: item.responsibility,
    costImpact: Number(item.cost_impact ?? 0),
    notes: item.notes,
    createdAt: item.created_at,
  }));

  if (filters.doctorId) {
    items = items.filter((item) =>
      (remakes ?? []).some(
        (row) => row.id === item.id && row.cases?.doctor_id === filters.doctorId,
      ),
    );
  }
  if (filters.reason) {
    const needle = filters.reason.toLowerCase();
    items = items.filter((item) =>
      [item.reason, item.notes ?? ""].join(" ").toLowerCase().includes(needle),
    );
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const reasonCounts = new Map<string, number>();
  const doctorCounts = new Map<string, number>();
  const technicianCounts = new Map<string, number>();

  for (const item of items) {
    reasonCounts.set(item.reason, (reasonCounts.get(item.reason) ?? 0) + 1);
    doctorCounts.set(item.doctorName, (doctorCounts.get(item.doctorName) ?? 0) + 1);
    if (item.technicianId) {
      technicianCounts.set(item.technicianId, (technicianCounts.get(item.technicianId) ?? 0) + 1);
    }
  }

  return {
    remakes: items,
    doctors: (doctors ?? []).map((doctor) => ({
      id: doctor.id,
      name: doctor.display_name,
    })),
    analytics: {
      remakesThisMonth: items.filter((item) => new Date(item.createdAt) >= monthStart).length,
      totalCostImpact: items.reduce((sum, item) => sum + item.costImpact, 0),
      topReasons: Array.from(reasonCounts.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      byDoctor: Array.from(doctorCounts.entries())
        .map(([doctor, count]) => ({ doctor, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      byTechnician: Array.from(technicianCounts.entries())
        .map(([technicianId, count]) => ({ technicianId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    },
  };
}
