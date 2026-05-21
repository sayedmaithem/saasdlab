import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { remakeResponsibilities } from "@/lib/quality/qc-rules";
import type { RemakeListItem } from "@/lib/data/quality";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function RemakesDashboard({
  remakes,
  doctors,
  analytics,
}: {
  remakes: RemakeListItem[];
  doctors: Array<{ id: string; name: string }>;
  analytics: {
    remakesThisMonth: number;
    totalCostImpact: number;
    topReasons: Array<{ reason: string; count: number }>;
    byDoctor: Array<{ doctor: string; count: number }>;
    byTechnician: Array<{ technicianId: string; count: number }>;
  };
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Remakes</p>
        <h1 className="text-2xl font-semibold">Remake tracking and cost impact</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>This month</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{analytics.remakesThisMonth}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cost impact</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{money(analytics.totalCostImpact)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top reason</CardTitle></CardHeader>
          <CardContent className="text-lg font-semibold">
            {analytics.topReasons[0]?.reason ?? "None"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Doctor risk</CardTitle></CardHeader>
          <CardContent className="text-lg font-semibold">
            {analytics.byDoctor[0]?.doctor ?? "None"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-5">
            <Select name="doctorId" defaultValue="">
              <option value="">All doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
              ))}
            </Select>
            <Select name="responsibility" defaultValue="">
              <option value="">All responsibility</option>
              {remakeResponsibilities.map((item) => (
                <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
              ))}
            </Select>
            <Input name="reason" placeholder="Reason search" />
            <Input name="from" type="date" />
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Remake list</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 font-medium">Case</th>
                <th className="py-3 font-medium">Doctor</th>
                <th className="py-3 font-medium">Reason</th>
                <th className="py-3 font-medium">Responsibility</th>
                <th className="py-3 font-medium">Cost</th>
                <th className="py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {remakes.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3">
                    <Link href={`/cases/${item.caseId}`} className="font-semibold hover:underline">
                      {item.caseNumber}
                    </Link>
                  </td>
                  <td className="py-3">{item.doctorName}</td>
                  <td className="py-3">{item.reason}</td>
                  <td className="py-3">
                    <Badge tone="amber">{item.responsibility.replaceAll("_", " ")}</Badge>
                  </td>
                  <td className="py-3">{money(item.costImpact)}</td>
                  <td className="py-3">{item.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {remakes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No remake records match the current filters.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top remake reasons</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {analytics.topReasons.map((item) => (
              <p key={item.reason} className="flex justify-between">
                <span>{item.reason}</span>
                <span className="font-semibold">{item.count}</span>
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Remake rate base</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {analytics.byDoctor.map((item) => (
              <p key={item.doctor} className="flex justify-between">
                <span>{item.doctor}</span>
                <span className="font-semibold">{item.count}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
