import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DoctorPerformance as DoctorPerformanceType } from "@/lib/types";

export function DoctorPerformance({
  doctors,
}: {
  doctors: DoctorPerformanceType[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Doctor performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {doctors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Doctor scoring appears after approvals, remakes, and payments are
            recorded.
          </p>
        ) : (
          doctors.map((doctor) => (
            <div
              key={doctor.doctorName}
              className="rounded-lg border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{doctor.doctorName}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    <span data-count="">{doctor.activeCases}</span> active cases
                  </p>
                </div>
                <Badge
                  tone={
                    doctor.paymentStatus === "good"
                      ? "green"
                      : doctor.paymentStatus === "attention"
                        ? "amber"
                        : "red"
                  }
                >
                  {doctor.paymentStatus}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Approval rate</p>
                  <p className="font-semibold tabular-nums">{doctor.approvalRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remake rate</p>
                  <p className="font-semibold tabular-nums">{doctor.remakeRate}%</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
