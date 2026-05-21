"use client";

import { Badge } from "@/components/ui/badge";
import type { CaseSummaryData } from "@/lib/data/case-summary";

// ── Helpers ───────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "" || value === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      <dt className="w-36 shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="flex-1 text-xs text-foreground">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 print:break-inside-avoid">
      <h3 className="border-b pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <dl className="space-y-1.5">{children}</dl>
    </section>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventLabel(type: string) {
  return type
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function stageLabel(key: string) {
  return key.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Missing info warning banner ────────────────────────────────────────────────

function MissingInfoBanner({ status }: { status: string }) {
  if (status === "complete") return null;
  const isRequestedOrReceived = status === "requested" || status === "received";
  return (
    <div
      className={`flex items-start gap-2 rounded border p-3 text-xs ${
        isRequestedOrReceived
          ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
          : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
      }`}
    >
      <span className="font-semibold">⚠ Missing information:</span>
      <span className="capitalize">{status.replaceAll("_", " ")}</span>
      <span className="text-muted-foreground ml-auto italic">Case is blocked for production until resolved</span>
    </div>
  );
}

// ── QR placeholder ────────────────────────────────────────────────────────────

function QrPlaceholder({ caseNumber }: { caseNumber: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Visual QR placeholder — real implementation requires a QR library */}
      <div
        className="flex size-16 items-center justify-center rounded border-2 border-dashed border-muted-foreground/30 bg-muted/20"
        title="QR code placeholder — requires qrcode library integration"
        aria-label="QR code placeholder"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-7 text-muted-foreground/40"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="3" height="3" />
          <rect x="19" y="14" width="2" height="2" />
          <rect x="14" y="19" width="2" height="2" />
          <rect x="17" y="17" width="4" height="4" />
        </svg>
      </div>
      <p className="text-[10px] font-medium text-muted-foreground">{caseNumber}</p>
      <p className="text-[9px] text-muted-foreground/60 italic">QR — scan to open</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CaseSummarySheet({ data }: { data: CaseSummaryData }) {
  return (
    <div className="space-y-6 text-foreground">

      {/* ── Print header ────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div className="flex-1">
          {data.labName && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {data.labName}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Case {data.caseNumber}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{data.currentStageLabel}</Badge>
            <Badge tone={data.status === "completed" ? "neutral" : "green"}>
              {data.status.replaceAll("_", " ")}
            </Badge>
            {data.isUrgent && <Badge tone="red">URGENT</Badge>}
            {data.missingInfoStatus !== "complete" && (
              <Badge tone="amber">Missing info: {data.missingInfoStatus.replaceAll("_", " ")}</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <QrPlaceholder caseNumber={data.caseNumber} />
          <div className="text-right text-xs text-muted-foreground space-y-0.5">
            <p>Printed {formatDate(new Date().toISOString())}</p>
            {data.createdAt && <p>Created {formatDate(data.createdAt)}</p>}
            {data.dueDate && <p>Due <strong>{data.dueDate}</strong></p>}
          </div>
        </div>
      </div>

      {/* ── Missing information warning ──────────────────────── */}
      <MissingInfoBanner status={data.missingInfoStatus} />

      {/* ── Two-column main grid ─────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">

        {/* Left column */}
        <div className="space-y-6">
          <Section title="Patient">
            <Row label="Name" value={data.patientName} />
            <Row label="Arch" value={data.arch} />
            <Row
              label="Teeth (FDI)"
              value={data.toothNumbers.length > 0 ? data.toothNumbers.join(", ") : null}
            />
          </Section>

          <Section title="Restoration">
            <Row label="Work type" value={data.workType} />
            <Row label="Material" value={data.material} />
            <Row label="Shade" value={data.shade} />
            <Row label="Units" value={data.unitsCount > 0 ? data.unitsCount : null} />
            {data.totalPrice > 0 && (
              <Row label="Price" value={money(data.totalPrice)} />
            )}
          </Section>

          {data.units.length > 0 && (
            <Section title={`Case items (${data.units.length})`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-1 pr-4 text-left font-medium">Work type</th>
                      <th className="py-1 pr-4 text-left font-medium">Material</th>
                      <th className="py-1 pr-4 text-left font-medium">Teeth</th>
                      <th className="py-1 text-right font-medium">Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.units.map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-1 pr-4">{u.work_type || "—"}</td>
                        <td className="py-1 pr-4 text-muted-foreground">{u.material ?? "—"}</td>
                        <td className="py-1 pr-4 text-muted-foreground">
                          {u.tooth_numbers.length > 0 ? u.tooth_numbers.join(", ") : "—"}
                        </td>
                        <td className="py-1 text-right">{u.units_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Section title="Doctor / Clinic">
            <Row label="Doctor" value={data.doctorName} />
            <Row label="Phone" value={data.doctorPhone} />
            <Row label="Email" value={data.doctorEmail} />
            <Row label="Clinic" value={data.clinicName} />
            <Row label="Address" value={data.clinicAddress} />
            <Row label="Clinic phone" value={data.clinicPhone} />
          </Section>

          <Section title="Production">
            <Row
              label="Assigned to"
              value={data.assignedTechnicianName ?? <span className="italic text-muted-foreground">Unassigned</span>}
            />
            <Row
              label="Files uploaded"
              value={data.filesCount > 0 ? `${data.filesCount} file${data.filesCount === 1 ? "" : "s"}` : "None"}
            />
            <Row label="Current stage" value={data.currentStageLabel} />
          </Section>

          {data.notes && (
            <Section title="Doctor notes">
              <p className="text-xs whitespace-pre-wrap text-foreground leading-relaxed">
                {data.notes}
              </p>
            </Section>
          )}
        </div>
      </div>

      {/* ── Stage history ────────────────────────────────────── */}
      {data.stageHistory.length > 0 && (
        <Section title={`Stage history (${data.stageHistory.length} transitions)`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[400px]">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1 pr-4 text-left font-medium w-36">When</th>
                  <th className="py-1 pr-4 text-left font-medium">From</th>
                  <th className="py-1 pr-4 text-left font-medium">To</th>
                  <th className="py-1 text-left font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {data.stageHistory.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-1.5 pr-4 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(s.created_at)}
                    </td>
                    <td className="py-1.5 pr-4 text-muted-foreground">
                      {s.from_stage ? stageLabel(s.from_stage) : "—"}
                    </td>
                    <td className="py-1.5 pr-4 font-medium">
                      {stageLabel(s.to_stage)}
                    </td>
                    <td className="py-1.5 text-muted-foreground">
                      {s.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── Timeline ─────────────────────────────────────────── */}
      {data.timeline.length > 0 && (
        <Section title="Recent activity">
          <div className="space-y-1">
            {data.timeline.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-start gap-3 border-b py-1.5 last:border-0"
              >
                <span className="w-40 shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(event.created_at)}
                </span>
                <span className="text-xs font-medium">{eventLabel(event.event_type)}</span>
                {event.title && (
                  <span className="text-xs text-muted-foreground">— {event.title}</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Print footer ─────────────────────────────────────── */}
      <div className="hidden print:block border-t pt-4 text-center text-xs text-muted-foreground">
        <p>
          {data.labName ?? "Lab"} · Case {data.caseNumber} · Generated{" "}
          {formatDateTime(new Date().toISOString())}
        </p>
        <p className="mt-1 italic">For internal use only. Not a clinical record.</p>
      </div>

    </div>
  );
}
