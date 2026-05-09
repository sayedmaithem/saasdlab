import { hasSupabaseEnv } from "@/lib/env";
import { formatMoney } from "@/lib/finance/money";
import { hasRole } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthSessionContext } from "@/types/app";

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  doctorName: string;
  caseNumber: string | null;
  issueDate: string | null;
  dueDate: string | null;
  total: number;
  paidAmount: number;
  remainingBalance: number;
  status: string;
};

export type InvoiceDetail = InvoiceListItem & {
  notes: string | null;
  items: Array<{
    id: string;
    description: string;
    workType: string | null;
    material: string | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }>;
  allocations: Array<{
    id: string;
    amount: number;
    paidAt: string;
    method: string;
  }>;
};

export type FinanceSummary = {
  revenueThisMonth: number;
  totalUnpaid: number;
  overdueInvoices: number;
  paymentsThisMonth: number;
  topDoctorsByRevenue: Array<{ doctor: string; total: number }>;
  topDoctorsByUnpaid: Array<{ doctor: string; total: number }>;
};

export type DoctorStatementRow = {
  date: string;
  type: "invoice" | "payment";
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  notes: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  total: number;
  paid_amount: number;
  remaining_balance: number;
  notes: string | null;
  doctor_id: string;
  doctors: { display_name: string } | null;
  invoice_items: Array<{ cases: { case_number: string } | null }> | null;
};

function assertLab(session: AuthSessionContext) {
  if (!session.activeLabId) throw new Error("No active lab was found.");
  return session.activeLabId;
}

function canUseFinance(session: AuthSessionContext) {
  return hasRole(session.roles, ["super_admin", "lab_owner", "accountant", "doctor"]);
}

export async function getFinanceDashboard(session: AuthSessionContext) {
  const labId = assertLab(session);
  if (!hasSupabaseEnv() || !canUseFinance(session)) {
    return {
      invoices: [] as InvoiceListItem[],
      doctors: [] as Array<{ id: string; name: string }>,
      cases: [] as Array<{ id: string; label: string; doctorId: string; clinicId: string | null; workType: string; material: string | null; units: number; totalPrice: number }>,
      summary: {
        revenueThisMonth: 0,
        totalUnpaid: 0,
        overdueInvoices: 0,
        paymentsThisMonth: 0,
        topDoctorsByRevenue: [],
        topDoctorsByUnpaid: [],
      } satisfies FinanceSummary,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: invoices, error }, { data: doctors }, { data: cases }, { data: payments }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id, invoice_number, status, issue_date, due_date, total, paid_amount, remaining_balance, notes, doctor_id, doctors(display_name), invoice_items(cases(case_number))")
        .eq("lab_id", labId)
        .order("issue_date", { ascending: false })
        .returns<InvoiceRow[]>(),
      supabase
        .from("doctors")
        .select("id, display_name")
        .eq("lab_id", labId)
        .order("display_name")
        .returns<Array<{ id: string; display_name: string }>>(),
      supabase
        .from("cases")
        .select("id, case_number, doctor_id, clinic_id, work_type, restoration_type, material, units_count, total_price")
        .eq("lab_id", labId)
        .order("created_at", { ascending: false })
        .limit(150)
        .returns<Array<{ id: string; case_number: string; doctor_id: string; clinic_id: string | null; work_type: string | null; restoration_type: string; material: string | null; units_count: number | null; total_price: number | null }>>(),
      supabase
        .from("payments")
        .select("amount, paid_at")
        .eq("lab_id", labId)
        .returns<Array<{ amount: number; paid_at: string }>>(),
    ]);

  if (error) throw new Error(error.message);

  const items = (invoices ?? []).map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    doctorName: invoice.doctors?.display_name ?? "Unknown doctor",
    caseNumber: invoice.invoice_items?.[0]?.cases?.case_number ?? null,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    total: Number(invoice.total ?? 0),
    paidAmount: Number(invoice.paid_amount ?? 0),
    remainingBalance: Number(invoice.remaining_balance ?? 0),
    status: invoice.status,
  }));
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const revenueByDoctor = new Map<string, number>();
  const unpaidByDoctor = new Map<string, number>();

  for (const invoice of invoices ?? []) {
    const name = invoice.doctors?.display_name ?? "Unknown doctor";
    revenueByDoctor.set(name, (revenueByDoctor.get(name) ?? 0) + Number(invoice.total ?? 0));
    unpaidByDoctor.set(name, (unpaidByDoctor.get(name) ?? 0) + Number(invoice.remaining_balance ?? 0));
  }

  return {
    invoices: items,
    doctors: (doctors ?? []).map((doctor) => ({ id: doctor.id, name: doctor.display_name })),
    cases: (cases ?? []).map((item) => ({
      id: item.id,
      label: item.case_number,
      doctorId: item.doctor_id,
      clinicId: item.clinic_id,
      workType: item.work_type ?? item.restoration_type,
      material: item.material,
      units: Number(item.units_count ?? 1),
      totalPrice: Number(item.total_price ?? 0),
    })),
    summary: {
      revenueThisMonth: items
        .filter((item) => item.issueDate && new Date(item.issueDate) >= monthStart)
        .reduce((sum, item) => sum + item.total, 0),
      totalUnpaid: items.reduce((sum, item) => sum + item.remainingBalance, 0),
      overdueInvoices: items.filter((item) => item.status === "overdue").length,
      paymentsThisMonth: (payments ?? [])
        .filter((item) => new Date(item.paid_at) >= monthStart)
        .reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
      topDoctorsByRevenue: Array.from(revenueByDoctor.entries())
        .map(([doctor, total]) => ({ doctor, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
      topDoctorsByUnpaid: Array.from(unpaidByDoctor.entries())
        .map(([doctor, total]) => ({ doctor, total }))
        .filter((item) => item.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
    },
  };
}

export async function getInvoiceDetail(session: AuthSessionContext, invoiceId: string) {
  const labId = assertLab(session);
  if (!hasSupabaseEnv()) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: invoice, error }, { data: items }, { data: allocations }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id, invoice_number, status, issue_date, due_date, total, paid_amount, remaining_balance, notes, doctor_id, doctors(display_name)")
        .eq("lab_id", labId)
        .eq("id", invoiceId)
        .maybeSingle<Omit<InvoiceRow, "invoice_items">>(),
      supabase
        .from("invoice_items")
        .select("id, description, work_type, material, quantity, unit_price, discount, line_total")
        .eq("lab_id", labId)
        .eq("invoice_id", invoiceId)
        .returns<Array<{ id: string; description: string; work_type: string | null; material: string | null; quantity: number; unit_price: number; discount: number; line_total: number }>>(),
      supabase
        .from("payment_allocations")
        .select("id, amount, payments(paid_at, method)")
        .eq("lab_id", labId)
        .eq("invoice_id", invoiceId)
        .returns<Array<{ id: string; amount: number; payments: { paid_at: string; method: string } | null }>>(),
    ]);

  if (error) throw new Error(error.message);
  if (!invoice) return null;

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    doctorName: invoice.doctors?.display_name ?? "Unknown doctor",
    caseNumber: null,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    total: Number(invoice.total ?? 0),
    paidAmount: Number(invoice.paid_amount ?? 0),
    remainingBalance: Number(invoice.remaining_balance ?? 0),
    status: invoice.status,
    notes: invoice.notes,
    items: (items ?? []).map((item) => ({
      id: item.id,
      description: item.description,
      workType: item.work_type,
      material: item.material,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      discount: Number(item.discount),
      total: Number(item.line_total),
    })),
    allocations: (allocations ?? []).map((allocation) => ({
      id: allocation.id,
      amount: Number(allocation.amount),
      paidAt: allocation.payments?.paid_at ?? "",
      method: allocation.payments?.method ?? "cash",
    })),
  } satisfies InvoiceDetail;
}

export async function getDoctorStatement(
  session: AuthSessionContext,
  doctorId: string,
  filters: { from?: string; to?: string },
) {
  const labId = assertLab(session);
  if (!hasSupabaseEnv()) return { doctorName: "Doctor", rows: [] as DoctorStatementRow[], remainingBalance: 0 };

  const supabase = await createSupabaseServerClient();
  const [{ data: doctor }, { data: invoices }, { data: payments }] = await Promise.all([
    supabase.from("doctors").select("display_name").eq("lab_id", labId).eq("id", doctorId).maybeSingle<{ display_name: string }>(),
    supabase
      .from("invoices")
      .select("invoice_number, issue_date, total, notes")
      .eq("lab_id", labId)
      .eq("doctor_id", doctorId)
      .order("issue_date")
      .returns<Array<{ invoice_number: string; issue_date: string | null; total: number; notes: string | null }>>(),
    supabase
      .from("payments")
      .select("id, amount, paid_at, notes")
      .eq("lab_id", labId)
      .eq("doctor_id", doctorId)
      .order("paid_at")
      .returns<Array<{ id: string; amount: number; paid_at: string; notes: string | null }>>(),
  ]);

  const events = [
    ...(invoices ?? []).map((item) => ({
      date: item.issue_date ?? "",
      type: "invoice" as const,
      reference: item.invoice_number,
      debit: Number(item.total ?? 0),
      credit: 0,
      notes: item.notes,
    })),
    ...(payments ?? []).map((item) => ({
      date: item.paid_at,
      type: "payment" as const,
      reference: item.id.slice(0, 8),
      debit: 0,
      credit: Number(item.amount ?? 0),
      notes: item.notes,
    })),
  ]
    .filter((item) => (!filters.from || item.date >= filters.from) && (!filters.to || item.date <= `${filters.to}T23:59:59`))
    .sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const rows = events.map((event) => {
    balance += event.debit - event.credit;
    return { ...event, balance };
  });

  return {
    doctorName: doctor?.display_name ?? "Doctor",
    rows,
    remainingBalance: balance,
    formattedBalance: formatMoney(balance),
  };
}
