"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/env";
import { invoiceStatusForBalance, toMoney } from "@/lib/finance/money";
import { hasRole } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FinanceActionState = { ok: boolean; message: string };

const invoiceSchema = z.object({
  doctorId: z.uuid(),
  clinicId: z.uuid().optional().or(z.literal("")),
  caseId: z.uuid(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().min(2).max(300),
  workType: z.string().min(1).max(120),
  material: z.string().max(120).optional(),
  units: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().max(1000).optional(),
});

const paymentSchema = z.object({
  doctorId: z.uuid(),
  amount: z.coerce.number().positive(),
  method: z.enum(["cash", "bank_transfer", "card", "other"]),
  paidAt: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function canManageFinance(roles: string[]) {
  return hasRole(roles as never, ["super_admin", "lab_owner", "accountant"]);
}

export async function createInvoiceAction(formData: FormData): Promise<FinanceActionState> {
  const session = await requireAuth();
  if (!session.activeLabId) return { ok: false, message: "No active lab was found." };
  if (!hasSupabaseEnv()) return { ok: false, message: "Connect Supabase before saving invoices." };
  if (!canManageFinance(session.roles)) return { ok: false, message: "You cannot manage invoices." };

  const parsed = invoiceSchema.safeParse({
    doctorId: getString(formData, "doctorId"),
    clinicId: getString(formData, "clinicId"),
    caseId: getString(formData, "caseId"),
    issueDate: getString(formData, "issueDate"),
    dueDate: getString(formData, "dueDate"),
    description: getString(formData, "description"),
    workType: getString(formData, "workType"),
    material: getString(formData, "material"),
    units: getString(formData, "units"),
    unitPrice: getString(formData, "unitPrice"),
    discount: getString(formData, "discount") || "0",
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid invoice." };
  }

  try {
    const input = parsed.data;
    const lineTotal = toMoney(input.units * input.unitPrice - input.discount);
    const invoiceNumber = `INV-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
    const supabase = await createSupabaseServerClient();
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        lab_id: session.activeLabId,
        doctor_id: input.doctorId,
        clinic_id: input.clinicId || null,
        invoice_number: invoiceNumber,
        status: invoiceStatusForBalance({ total: lineTotal, paid: 0, dueDate: input.dueDate }),
        issue_date: input.issueDate || new Date().toISOString().slice(0, 10),
        due_date: input.dueDate || null,
        subtotal: lineTotal,
        discount: 0,
        tax: 0,
        paid_amount: 0,
        remaining_balance: lineTotal,
        notes: input.notes || null,
      })
      .select("id")
      .single<{ id: string }>();

    if (error) throw new Error(error.message);

    const { error: itemError } = await supabase.from("invoice_items").insert({
      lab_id: session.activeLabId,
      invoice_id: invoice.id,
      case_id: input.caseId,
      description: input.description,
      work_type: input.workType,
      material: input.material || null,
      quantity: input.units,
      unit_price: input.unitPrice,
      discount: input.discount,
    });
    if (itemError) throw new Error(itemError.message);

    await supabase.from("case_timeline").insert({
      lab_id: session.activeLabId,
      case_id: input.caseId,
      actor_id: session.userId,
      event_type: "invoice_created",
      title: `Invoice ${invoiceNumber} created`,
      metadata: { invoice_id: invoice.id, total: lineTotal },
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoice.id}`);
    revalidatePath(`/doctors/${input.doctorId}/statement`);
    return { ok: true, message: `Invoice ${invoiceNumber} created.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invoice failed." };
  }
}

export async function recordPaymentAction(formData: FormData): Promise<FinanceActionState> {
  const session = await requireAuth();
  if (!session.activeLabId) return { ok: false, message: "No active lab was found." };
  if (!hasSupabaseEnv()) return { ok: false, message: "Connect Supabase before saving payments." };
  if (!canManageFinance(session.roles)) return { ok: false, message: "You cannot manage payments." };

  const parsed = paymentSchema.safeParse({
    doctorId: getString(formData, "doctorId"),
    amount: getString(formData, "amount"),
    method: getString(formData, "method"),
    paidAt: getString(formData, "paidAt"),
    notes: getString(formData, "notes"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid payment." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const input = parsed.data;
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        lab_id: session.activeLabId,
        doctor_id: input.doctorId,
        amount: input.amount,
        method: input.method,
        paid_at: input.paidAt ? `${input.paidAt}T12:00:00.000Z` : new Date().toISOString(),
        recorded_by: session.userId,
        notes: input.notes || null,
      })
      .select("id")
      .single<{ id: string }>();
    if (error) throw new Error(error.message);

    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id, total, paid_amount, remaining_balance, due_date")
      .eq("lab_id", session.activeLabId)
      .eq("doctor_id", input.doctorId)
      .gt("remaining_balance", 0)
      .order("due_date", { ascending: true })
      .returns<Array<{ id: string; total: number; paid_amount: number; remaining_balance: number; due_date: string | null }>>();
    if (invoicesError) throw new Error(invoicesError.message);

    let remainingPayment = toMoney(input.amount);
    const allocations = [];
    for (const invoice of invoices ?? []) {
      if (remainingPayment <= 0) break;
      const allocated = toMoney(Math.min(remainingPayment, Number(invoice.remaining_balance)));
      remainingPayment = toMoney(remainingPayment - allocated);
      const paid = toMoney(Number(invoice.paid_amount ?? 0) + allocated);
      const remaining = toMoney(Number(invoice.total ?? 0) - paid);
      allocations.push({ lab_id: session.activeLabId, payment_id: payment.id, invoice_id: invoice.id, amount: allocated });
      const status = invoiceStatusForBalance({ total: Number(invoice.total), paid, dueDate: invoice.due_date });
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ paid_amount: paid, remaining_balance: Math.max(remaining, 0), status })
        .eq("lab_id", session.activeLabId)
        .eq("id", invoice.id);
      if (updateError) throw new Error(updateError.message);
    }

    if (allocations.length > 0) {
      const { error: allocationError } = await supabase.from("payment_allocations").insert(allocations);
      if (allocationError) throw new Error(allocationError.message);
    }

    await supabase.from("audit_logs").insert({
      lab_id: session.activeLabId,
      actor_id: session.userId,
      entity_type: "payment",
      entity_id: payment.id,
      action: "payment_recorded",
      metadata: { doctor_id: input.doctorId, amount: input.amount, allocations: allocations.length },
    });

    revalidatePath("/payments");
    revalidatePath("/invoices");
    revalidatePath(`/doctors/${input.doctorId}/statement`);
    return { ok: true, message: "Payment recorded and allocated to oldest unpaid invoices." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Payment failed." };
  }
}
