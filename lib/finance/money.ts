export function toMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function invoiceStatusForBalance(params: {
  total: number;
  paid: number;
  dueDate?: string | null;
}) {
  const remaining = toMoney(params.total - params.paid);
  const today = new Date().toISOString().slice(0, 10);

  if (remaining <= 0) return "paid";
  if (params.paid > 0) return "partially_paid";
  if (params.dueDate && params.dueDate < today) return "overdue";

  return "issued";
}
