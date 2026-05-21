import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DoctorPortalData } from "@/lib/data/doctor-portal";

// Human-readable labels for internal stage/status identifiers
const STAGE_LABELS: Record<string, string> = {
  received: "Received",
  information_check: "Info check",
  in_production: "In production",
  design: "Design",
  doctor_approval: "Awaiting approval",
  quality_check: "Quality check",
  ready_for_delivery: "Ready for delivery",
  delivered: "Delivered",
  on_hold: "On hold",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On hold",
};

function stageLabel(stage: string) {
  return STAGE_LABELS[stage] ?? stage.replaceAll("_", " ");
}
function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

// ── Not-linked placeholder ─────────────────────────────────────────────────
function NotLinked() {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-3">
        <p className="text-base font-medium text-foreground">Portal account not linked</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your login is not yet associated with a doctor profile. Ask your lab administrator to
          link your account from the doctor edit page.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export function DoctorPortalDashboard({ data }: { data: DoctorPortalData }) {
  if (!data.doctorId) return <NotLinked />;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Doctor portal</p>
          <h1 className="text-2xl font-semibold">{data.doctorName}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/doctor-portal/statement">Statement</Link>
          </Button>
          <Button asChild>
            <Link href="/doctor-portal/cases/new">New case</Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {data.cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cases list */}
      <Card>
        <CardHeader>
          <CardTitle>My cases</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <Input name="query" placeholder="Search patient or case number" />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          <div className="space-y-2">
            {data.cases.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No cases yet.{" "}
                <Link
                  href="/doctor-portal/cases/new"
                  className="text-primary hover:underline font-medium"
                >
                  Submit your first case →
                </Link>
              </p>
            ) : (
              data.cases.map((item) => (
                <Link
                  key={item.id}
                  href={`/doctor-portal/cases/${item.id}`}
                  className="block rounded-lg border bg-background p-4 hover:bg-muted transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {item.caseNumber} — {item.patientName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.workType}
                        {item.dueDate ? ` · Due ${item.dueDate}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {item.missingInfoStatus === "missing" && (
                        <Badge tone="amber">Missing info</Badge>
                      )}
                      {item.currentStage === "doctor_approval" && (
                        <Badge tone="red">Approval needed</Badge>
                      )}
                      <Badge tone="blue">{stageLabel(item.currentStage)}</Badge>
                      {item.status !== "active" && (
                        <Badge tone="neutral">{statusLabel(item.status)}</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
