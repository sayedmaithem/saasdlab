"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, PackageCheck, Truck } from "lucide-react";
import { updateDeliveryAction } from "@/app/actions/delivery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryQueueItem } from "@/lib/data/delivery";

// ── Types and constants ───────────────────────────────────────────────────────

const TAB_META: Record<
  string,
  { label: string; tone: "amber" | "blue" | "green" | "red" | "neutral" }
> = {
  ready_for_delivery: { label: "Ready", tone: "amber" },
  assigned_to_delivery: { label: "Assigned", tone: "blue" },
  out_for_delivery: { label: "Out for delivery", tone: "blue" },
  delivered: { label: "Delivered", tone: "green" },
  failed_delivery: { label: "Failed", tone: "red" },
};

const tabs = [
  "ready_for_delivery",
  "assigned_to_delivery",
  "out_for_delivery",
  "delivered",
  "failed_delivery",
] as const;

type Tab = (typeof tabs)[number];

// ── Delivery item card ────────────────────────────────────────────────────────

function DeliveryCard({
  item,
  deliveryPeople,
  onMessage,
}: {
  item: DeliveryQueueItem;
  deliveryPeople: Array<{ id: string; name: string }>;
  onMessage: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updateDeliveryAction(formData);
      onMessage(result.message);
    });
  }

  const tabMeta = TAB_META[item.status] ?? { label: item.status, tone: "neutral" as const };

  return (
    <article className="rounded-lg border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/cases/${item.caseId}`}
              className="text-sm font-semibold hover:underline"
            >
              {item.caseNumber}
            </Link>
            <Badge tone={tabMeta.tone}>{tabMeta.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.patientName} · {item.doctorName}
            {item.clinicName ? ` · ${item.clinicName}` : ""}
          </p>
        </div>
        {item.deliveryPersonName && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Truck className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">{item.deliveryPersonName}</span>
          </div>
        )}
      </div>

      {/* Action form */}
      <form action={submit} className="space-y-3 border-t pt-3">
        <input type="hidden" name="caseId" value={item.caseId} />

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Delivery person
            </label>
            <Select name="deliveryPersonId" defaultValue="">
              <option value="">Select person</option>
              {deliveryPeople.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Scheduled time
            </label>
            <Input name="scheduledAt" type="datetime-local" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Recipient name
            </label>
            <Input name="recipientName" placeholder="Who received the case?" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Notes
            </label>
            <Input
              name="notes"
              placeholder="e.g. left at reception desk"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Textarea
            name="failureReason"
            placeholder="Failure reason — required when marking as failed"
            className="text-xs"
            rows={2}
          />
          <p className="text-[10px] text-muted-foreground">
            Delivery proof file: attach via the case file manager after dispatch.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            name="deliveryAction"
            value="assign"
            size="sm"
            disabled={isPending}
          >
            Assign
          </Button>
          <Button
            name="deliveryAction"
            value="out"
            size="sm"
            variant="outline"
            disabled={isPending}
          >
            <Truck className="size-3.5" />
            Out for delivery
          </Button>
          <Button
            name="deliveryAction"
            value="delivered"
            size="sm"
            variant="outline"
            disabled={isPending}
          >
            <CheckCircle2 className="size-3.5" />
            Mark delivered
          </Button>
          <Button
            name="deliveryAction"
            value="failed"
            size="sm"
            variant="destructive"
            disabled={isPending}
          >
            Failed
          </Button>
        </div>
      </form>
    </article>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DeliveryDashboard({
  items,
  deliveryPeople,
}: {
  items: DeliveryQueueItem[];
  deliveryPeople: Array<{ id: string; name: string }>;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("ready_for_delivery");
  const [message, setMessage] = useState<string | null>(null);

  const filtered = items.filter((item) => item.status === activeTab);
  const countsByTab = Object.fromEntries(
    tabs.map((tab) => [tab, items.filter((item) => item.status === tab).length]),
  );

  const isSuccess =
    message?.toLowerCase().includes("assigned") ||
    message?.toLowerCase().includes("delivered") ||
    message?.toLowerCase().includes("updated");

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 border-b pb-4">
        {tabs.map((tab) => {
          const meta = TAB_META[tab];
          const count = countsByTab[tab] ?? 0;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {meta.label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Action feedback ───────────────────────────────────── */}
      {message && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* ── Case list ─────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {TAB_META[activeTab]?.label} · {filtered.length} case{filtered.length === 1 ? "" : "s"}
          </p>
          {filtered.map((item) => (
            <DeliveryCard
              key={item.id}
              item={item}
              deliveryPeople={deliveryPeople}
              onMessage={setMessage}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/20 py-14 text-center">
          {activeTab === "delivered" ? (
            <CheckCircle2 className="size-8 text-muted-foreground" />
          ) : (
            <PackageCheck className="size-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              No cases in &ldquo;{TAB_META[activeTab]?.label}&rdquo;
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              {activeTab === "ready_for_delivery"
                ? "Cases that have passed QC and are waiting to be dispatched will appear here."
                : activeTab === "delivered"
                ? "Successfully delivered cases will be recorded here."
                : "Cases will appear here as they move through the delivery workflow."}
            </p>
          </div>
          {activeTab === "ready_for_delivery" && (
            <Button asChild variant="outline" size="sm" className="mt-1">
              <Link href="/quality-control">Check QC queue</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
