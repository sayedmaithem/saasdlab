export const dynamic = "force-dynamic";

import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { CaseSummarySheet } from "@/components/cases/case-summary-sheet";
import { getCaseSummaryData } from "@/lib/data/case-summary";
import { Button } from "@/components/ui/button";

export default async function CaseSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRouteAccess("/cases");
  const { id } = await params;
  const data = await getCaseSummaryData(session, id);

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/cases"
      eyebrow="Cases"
      title={`Case ${data.caseNumber} — Summary`}
    >
      <div className="space-y-5">
        {/* ── Actions bar ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/cases/${id}`}>
              <ArrowLeft className="size-4" />
              Back to case
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={undefined}
            className="ml-auto"
            asChild
          >
            {/* Print is triggered via JS in browser — we use a simple anchor */}
            <a href="#" onClick={(e) => { e.preventDefault(); window.print(); }}>
              <Printer className="size-4" />
              Print / Save PDF
            </a>
          </Button>
        </div>

        {/* ── Summary sheet ───────────────────────────────── */}
        <div className="rounded-lg border bg-card p-6 shadow-sm print:shadow-none print:border-0 print:p-0">
          <CaseSummarySheet data={data} />
        </div>
      </div>
    </AppShell>
  );
}
