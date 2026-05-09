import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateDoctorMetrics } from "@/lib/scoring/doctor-metrics";
import type { AuthSessionContext } from "@/types/app";

export type DoctorPaymentStatus = "good" | "attention" | "blocked";

export type ClinicOption = {
  id: string;
  name: string;
};

export type DoctorListFilters = {
  query?: string;
  clinicId?: string;
  status?: "active" | "inactive" | "vip";
};

export type DoctorListItem = {
  id: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  clinicName: string | null;
  isActive: boolean;
  isVip: boolean;
  totalCases: number;
  totalBalance: number;
  missingInformationRate: number;
  remakeRate: number;
  paymentStatus: DoctorPaymentStatus;
};

export type DoctorProfile = DoctorListItem & {
  address: string | null;
  notes: string | null;
  paymentTerms: string | null;
  defaultPriceGroup: string | null;
  revenueTotal: number;
  paidTotal: number;
  designRejectionRate: number;
  paymentCommitmentScore: number;
  urgentCasePercentage: number;
  averageResponseTimeHours: number | null;
  linkedClinics: ClinicOption[];
  cases: Array<{
    id: string;
    caseNumber: string;
    patientName: string;
    workType: string;
    status: string;
    currentStage: string;
    dueDate: string | null;
    totalPrice: number;
  }>;
};

export type DoctorPriceItem = {
  id: string;
  workType: string;
  material: string | null;
  unitPrice: number;
  effectiveFrom: string;
  isActive: boolean;
};

type DoctorRow = {
  id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  default_clinic_id: string | null;
  is_active: boolean;
  is_vip: boolean;
  address: string | null;
  notes: string | null;
  payment_terms: string | null;
  default_price_group: string | null;
  performance_score: number;
  clinics: { name: string } | null;
};

type CaseMetricRow = {
  id: string;
  doctor_id: string;
  case_number: string;
  patient_name: string | null;
  patient_display: string;
  work_type: string | null;
  restoration_type: string;
  status: string | null;
  current_stage: string | null;
  stage: string;
  due_date: string | null;
  total_price: number | null;
  is_urgent: boolean | null;
  is_remake: boolean | null;
  missing_info_status: string | null;
};

type InvoiceMetricRow = {
  doctor_id: string;
  total: number;
  paid_amount: number | null;
  remaining_balance: number | null;
};

type DesignApprovalRow = {
  doctor_id: string;
  status: string;
};

function assertLab(session: AuthSessionContext) {
  if (!session.activeLabId) {
    throw new Error("No active lab was found for this user.");
  }

  return session.activeLabId;
}

function paymentStatus(balance: number, revenue: number): DoctorPaymentStatus {
  if (balance <= 0) {
    return "good";
  }

  if (revenue > 0 && balance / revenue > 0.35) {
    return "blocked";
  }

  return "attention";
}

function buildDoctorList(
  doctors: DoctorRow[],
  cases: CaseMetricRow[],
  invoices: InvoiceMetricRow[],
  approvals: DesignApprovalRow[],
) {
  return doctors.map((doctor): DoctorListItem => {
    const doctorCases = cases.filter((item) => item.doctor_id === doctor.id);
    const doctorInvoices = invoices.filter((item) => item.doctor_id === doctor.id);
    const doctorApprovals = approvals.filter((item) => item.doctor_id === doctor.id);
    const revenueTotal = doctorInvoices.reduce(
      (sum, item) => sum + Number(item.total ?? 0),
      0,
    );
    const totalBalance = doctorInvoices.reduce(
      (sum, item) => sum + Number(item.remaining_balance ?? 0),
      0,
    );
    const metrics = calculateDoctorMetrics({
      totalCases: doctorCases.length,
      missingInfoCases: doctorCases.filter(
        (item) => item.missing_info_status && item.missing_info_status !== "complete",
      ).length,
      remakes: doctorCases.filter((item) => item.is_remake).length,
      urgentCases: doctorCases.filter((item) => item.is_urgent).length,
      rejectedDesigns: doctorApprovals.filter((item) => item.status === "rejected")
        .length,
      invoicesTotal: revenueTotal,
      remainingBalance: totalBalance,
    });

    return {
      id: doctor.id,
      displayName: doctor.display_name,
      phone: doctor.phone,
      email: doctor.email,
      clinicName: doctor.clinics?.name ?? null,
      isActive: doctor.is_active,
      isVip: doctor.is_vip,
      totalCases: doctorCases.length,
      totalBalance,
      missingInformationRate: metrics.missingInformationRate,
      remakeRate: metrics.remakeRate,
      paymentStatus: paymentStatus(totalBalance, revenueTotal),
    };
  });
}

export async function getDoctorList(
  session: AuthSessionContext,
  filters: DoctorListFilters,
) {
  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();

  let doctorsQuery = supabase
    .from("doctors")
    .select(
      "id, display_name, phone, email, default_clinic_id, is_active, is_vip, address, notes, payment_terms, default_price_group, performance_score, clinics(name)",
    )
    .eq("lab_id", labId)
    .order("display_name");

  if (filters.query) {
    doctorsQuery = doctorsQuery.or(
      `display_name.ilike.%${filters.query}%,phone.ilike.%${filters.query}%,email.ilike.%${filters.query}%`,
    );
  }

  if (filters.clinicId) {
    doctorsQuery = doctorsQuery.eq("default_clinic_id", filters.clinicId);
  }

  if (filters.status === "active") {
    doctorsQuery = doctorsQuery.eq("is_active", true);
  }

  if (filters.status === "inactive") {
    doctorsQuery = doctorsQuery.eq("is_active", false);
  }

  if (filters.status === "vip") {
    doctorsQuery = doctorsQuery.eq("is_vip", true);
  }

  const [
    { data: doctors, error: doctorsError },
    { data: cases, error: casesError },
    { data: invoices, error: invoicesError },
    { data: approvals, error: approvalsError },
    { data: clinics, error: clinicsError },
  ] = await Promise.all([
    doctorsQuery.returns<DoctorRow[]>(),
    supabase
      .from("cases")
      .select(
        "id, doctor_id, case_number, patient_name, patient_display, work_type, restoration_type, status, current_stage, stage, due_date, total_price, is_urgent, is_remake, missing_info_status",
      )
      .eq("lab_id", labId)
      .returns<CaseMetricRow[]>(),
    supabase
      .from("invoices")
      .select("doctor_id, total, paid_amount, remaining_balance")
      .eq("lab_id", labId)
      .returns<InvoiceMetricRow[]>(),
    supabase
      .from("design_approvals")
      .select("doctor_id, status")
      .eq("lab_id", labId)
      .returns<DesignApprovalRow[]>(),
    supabase
      .from("clinics")
      .select("id, name")
      .eq("lab_id", labId)
      .order("name")
      .returns<ClinicOption[]>(),
  ]);

  const error =
    doctorsError ?? casesError ?? invoicesError ?? approvalsError ?? clinicsError;

  if (error) {
    throw new Error(error.message);
  }

  return {
    doctors: buildDoctorList(
      doctors ?? [],
      cases ?? [],
      invoices ?? [],
      approvals ?? [],
    ),
    clinics: clinics ?? [],
  };
}

export async function getDoctorProfile(
  session: AuthSessionContext,
  doctorId: string,
): Promise<DoctorProfile> {
  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();
  const list = await getDoctorList(session, {});
  const summary = list.doctors.find((doctor) => doctor.id === doctorId);

  const [
    { data: doctor, error: doctorError },
    { data: cases, error: casesError },
    { data: invoices, error: invoicesError },
    { data: approvals, error: approvalsError },
    { data: clinics, error: clinicsError },
  ] = await Promise.all([
    supabase
      .from("doctors")
      .select(
        "id, display_name, phone, email, default_clinic_id, is_active, is_vip, address, notes, payment_terms, default_price_group, performance_score, clinics(name)",
      )
      .eq("lab_id", labId)
      .eq("id", doctorId)
      .maybeSingle<DoctorRow>(),
    supabase
      .from("cases")
      .select(
        "id, doctor_id, case_number, patient_name, patient_display, work_type, restoration_type, status, current_stage, stage, due_date, total_price, is_urgent, is_remake, missing_info_status",
      )
      .eq("lab_id", labId)
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<CaseMetricRow[]>(),
    supabase
      .from("invoices")
      .select("doctor_id, total, paid_amount, remaining_balance")
      .eq("lab_id", labId)
      .eq("doctor_id", doctorId)
      .returns<InvoiceMetricRow[]>(),
    supabase
      .from("design_approvals")
      .select("doctor_id, status")
      .eq("lab_id", labId)
      .eq("doctor_id", doctorId)
      .returns<DesignApprovalRow[]>(),
    supabase
      .from("clinics")
      .select("id, name")
      .eq("lab_id", labId)
      .order("name")
      .returns<ClinicOption[]>(),
  ]);

  const error = doctorError ?? casesError ?? invoicesError ?? approvalsError ?? clinicsError;

  if (error) {
    throw new Error(error.message);
  }

  if (!doctor || !summary) {
    notFound();
  }

  const revenueTotal = (invoices ?? []).reduce(
    (sum, item) => sum + Number(item.total ?? 0),
    0,
  );
  const paidTotal = (invoices ?? []).reduce(
    (sum, item) => sum + Number(item.paid_amount ?? 0),
    0,
  );
  const totalBalance = (invoices ?? []).reduce(
    (sum, item) => sum + Number(item.remaining_balance ?? 0),
    0,
  );
  const metrics = calculateDoctorMetrics({
    totalCases: cases?.length ?? 0,
    missingInfoCases: (cases ?? []).filter(
      (item) => item.missing_info_status && item.missing_info_status !== "complete",
    ).length,
    remakes: (cases ?? []).filter((item) => item.is_remake).length,
    urgentCases: (cases ?? []).filter((item) => item.is_urgent).length,
    rejectedDesigns: (approvals ?? []).filter((item) => item.status === "rejected")
      .length,
    invoicesTotal: revenueTotal,
    remainingBalance: totalBalance,
  });

  return {
    ...summary,
    address: doctor.address,
    notes: doctor.notes,
    paymentTerms: doctor.payment_terms,
    defaultPriceGroup: doctor.default_price_group,
    revenueTotal,
    paidTotal,
    totalBalance,
    designRejectionRate: metrics.designRejectionRate,
    paymentCommitmentScore: metrics.paymentCommitmentScore,
    urgentCasePercentage: metrics.urgentCasePercentage,
    averageResponseTimeHours: metrics.averageResponseTimeHours,
    linkedClinics: clinics ?? [],
    cases: (cases ?? []).map((item) => ({
      id: item.id,
      caseNumber: item.case_number,
      patientName: item.patient_name ?? item.patient_display,
      workType: item.work_type ?? item.restoration_type,
      status: item.status ?? "open",
      currentStage: item.current_stage ?? item.stage,
      dueDate: item.due_date,
      totalPrice: Number(item.total_price ?? 0),
    })),
  };
}

export async function getDoctorPrices(
  session: AuthSessionContext,
  doctorId: string,
) {
  const labId = assertLab(session);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("doctor_price_lists")
    .select("id, work_type, material, unit_price, effective_from, is_active")
    .eq("lab_id", labId)
    .eq("doctor_id", doctorId)
    .order("effective_from", { ascending: false })
    .returns<
      Array<{
        id: string;
        work_type: string;
        material: string | null;
        unit_price: number;
        effective_from: string;
        is_active: boolean;
      }>
    >();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(
    (item): DoctorPriceItem => ({
      id: item.id,
      workType: item.work_type,
      material: item.material,
      unitPrice: Number(item.unit_price),
      effectiveFrom: item.effective_from,
      isActive: item.is_active,
    }),
  );
}
