"use client";

import { Badge } from "@/components/ui/badge";
import type { CaseSummaryData } from "@/lib/data/case-summary";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
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

export function CaseSummarySheet({ data }: { data: CaseSummaryData }) {
  return (
    <div className="space-y-6 text-foreground">
      {/* ── Print header ───────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div>
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
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground space-y-0.5">
          <p>Printed {formatDate(new Date().toISOString())}</p>
          {data.createdAt && <p>Created {formatDate(data.createdAt)}</p>}
          {data.dueDate && <p>Due {data.dueDate}</p>}
        </div>
      </div>

      {/* ── Two-column main grid ────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <Section title="Patient">
            <Row label="Name" value={data.patientName} />
            <Row label="Arch" value={data.arch} />
            <Row label="Teeth (FDI)" value={data.toothNumbers.length > 0 ? data.toothNumbers.join(", ") : null} />
          </Section>

          <Section title="Restoration">
            <Row label="Work type" value={data.workType} />
            <Row label="Material" value={data.material} />
            <Row label="Shade" value={data.shade} />
            <Row label="Units" value={data.unitsCount} />
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
                        <td className="py-1 pr-4 text-muted-foreground">
                          {u.material ?? "—"}
                        </td>
                        <td className="py-1 pr-4 text-muted-foreground">
                          {u.tooth_numbers.length > 0
                            ? u.tooth_numbers.join(", ")
                            : "—"}
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

          {data.notes && (
            <Section title="Doctor notes">
              <p className="text-xs whitespace-pre-wrap text-foreground leading-relaxed">
                {data.notes}
              </p>
            </Section>
          )}

        </div>
      </div>

      {/* ── Timeline ───────────────────────────────────── */}
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

      {/* ── Print footer ───────────────────────────────── */}
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
