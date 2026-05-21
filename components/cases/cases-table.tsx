import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { stageLabels, productionStages } from "@/lib/constants/workflow";
import type { CaseListItem } from "@/lib/data/cases";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  waiting_doctor_info: "Waiting info",
  waiting_approval: "Awaiting approval",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On hold",
};

const STATUS_TONE: Record<string, "amber" | "green" | "red" | "neutral"> = {
  active: "green",
  waiting_doctor_info: "amber",
  waiting_approval: "amber",
  completed: "neutral",
  cancelled: "red",
  on_hold: "neutral",
};

function dueTone(item: CaseListItem) {
  if (item.isOverdue) return "text-red-700";
  if (!item.dueDate) return "text-muted-foreground";
  const days = Math.ceil(
    (new Date(`${item.dueDate}T00:00:00`).getTime() - Date.now()) / 86_400_000,
  );
  return days <= 2 ? "text-amber-700" : "text-muted-foreground";
}

export function CasesTable({
  cases,
  doctors,
  filters,
}: {
  cases: CaseListItem[];
  doctors: Array<{ id: string; name: string }>;
  filters: Record<string, string | undefined>;
}) {
  return (
    <div className="space-y-5">
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_160px_180px_220px_120px_120px_auto]">
        <input
          className="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          name="q"
          placeholder="Case, doctor, patient..."
          defaultValue={filters.q}
        />
        <select
          className="h-10 rounded-md border bg-card px-3 text-sm"
          name="status"
          defaultValue={filters.status}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="waiting_doctor_info">Waiting info</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="h-10 rounded-md border bg-card px-3 text-sm"
          name="stage"
          defaultValue={filters.stage}
        >
          <option value="">All stages</option>
          {productionStages.map((stage) => (
            <option key={stage} value={stage}>
              {stageLabels[stage]}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border bg-card px-3 text-sm"
          name="doctor"
          defaultValue={filters.doctor}
        >
          <option value="">All doctors</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="overdue" type="checkbox" defaultChecked={filters.overdue === "true"} />
          Overdue
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="urgent" type="checkbox" defaultChecked={filters.urgent === "true"} />
          Urgent
        </label>
        <Button type="submit">Filter</Button>
      </form>

      {cases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-base font-medium text-foreground">No cases found</p>
            <p className="text-sm text-muted-foreground">
              {Object.values(filters).some(Boolean)
                ? "Try clearing the filters above."
                : "No cases have been created yet. Submit the first case to get started."}
            </p>
            {!Object.values(filters).some(Boolean) && (
              <Link href="/cases/new" className="inline-block text-sm font-medium text-primary hover:underline">
                Create first case →
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-normal text-muted-foreground">
                <th className="p-4">Case</th>
                <th className="p-4">Doctor</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Work</th>
                <th className="p-4">Status</th>
                <th className="p-4">Stage</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Due</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-4">
                    <Link href={`/cases/${item.id}`} className="font-semibold hover:underline">
                      {item.caseNumber}
                    </Link>
                    {item.isUrgent ? <div className="mt-2"><Badge tone="red">Urgent</Badge></div> : null}
                  </td>
                  <td className="p-4">{item.doctorName}</td>
                  <td className="p-4">{item.patientName}</td>
                  <td className="p-4">{item.workType}</td>
                  <td className="p-4">
                    <Badge tone={STATUS_TONE[item.status] ?? "neutral"}>
                      {STATUS_LABELS[item.status] ?? item.status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="p-4">{stageLabels[item.currentStage as keyof typeof stageLabels] ?? item.currentStage.replaceAll("_", " ")}</td>
                  <td className="p-4 font-semibold">{item.priorityScore}</td>
                  <td className={`p-4 font-medium ${dueTone(item)}`}>
                    {item.dueDate ?? "Not set"}
                    {item.isOverdue ? <span className="block text-xs">Overdue</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
