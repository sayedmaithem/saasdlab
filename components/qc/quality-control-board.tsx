import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QualityControlCase } from "@/lib/data/quality";

function dueTone(dueDate: string | null) {
  if (!dueDate) return "neutral" as const;
  const today = new Date().toISOString().slice(0, 10);

  return dueDate < today ? "red" : dueDate === today ? "amber" : "neutral";
}

export function QualityControlBoard({ cases }: { cases: QualityControlCase[] }) {
  const waiting = cases.filter((item) => item.qcStatus !== "passed");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Quality Control</p>
        <h1 className="text-2xl font-semibold">Cases waiting for final inspection</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Waiting QC</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{waiting.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Overdue risk</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">
            {cases.filter((item) => dueTone(item.dueDate) === "red").length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Need adjustment</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">
            {cases.filter((item) => item.qcStatus === "needs_adjustment").length}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QC queue</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 font-medium">Case</th>
                <th className="py-3 font-medium">Doctor</th>
                <th className="py-3 font-medium">Work type</th>
                <th className="py-3 font-medium">Technician</th>
                <th className="py-3 font-medium">Checker</th>
                <th className="py-3 font-medium">Due</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3">
                    <Link href={`/cases/${item.id}`} className="font-semibold hover:underline">
                      {item.caseNumber}
                    </Link>
                    <p className="text-muted-foreground">{item.patientName}</p>
                  </td>
                  <td className="py-3">{item.doctorName}</td>
                  <td className="py-3">{item.workType}</td>
                  <td className="py-3">{item.technicianName}</td>
                  <td className="py-3">{item.checkerName ?? "Not checked"}</td>
                  <td className="py-3">
                    <Badge tone={dueTone(item.dueDate)}>{item.dueDate ?? "No due date"}</Badge>
                  </td>
                  <td className="py-3">
                    <Badge
                      tone={
                        item.qcStatus === "passed"
                          ? "green"
                          : item.qcStatus === "failed"
                            ? "red"
                            : item.qcStatus === "needs_adjustment"
                              ? "amber"
                              : "neutral"
                      }
                    >
                      {item.qcStatus.replaceAll("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cases.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No cases are waiting for quality control.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
