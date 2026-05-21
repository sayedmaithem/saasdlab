import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DoctorProfile as DoctorProfileData } from "@/lib/data/doctors";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DoctorProfile({ doctor }: { doctor: DoctorProfileData }) {
  const metrics = [
    ["Total revenue", money(doctor.revenueTotal)],
    ["Balance", money(doctor.totalBalance)],
    ["Missing info rate", `${doctor.missingInformationRate}%`],
    ["Remake rate", `${doctor.remakeRate}%`],
    ["Design rejection", `${doctor.designRejectionRate}%`],
    ["Payment commitment", `${doctor.paymentCommitmentScore}/100`],
    ["Urgent cases", `${doctor.urgentCasePercentage}%`],
    ["Avg response time", "Pending"],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Doctor profile</p>
          <h2 className="mt-1 text-2xl font-semibold">{doctor.displayName}</h2>
          <div className="mt-3 flex gap-2">
            {doctor.isVip ? <Badge tone="amber">VIP</Badge> : null}
            <Badge tone={doctor.isActive ? "green" : "neutral"}>
              {doctor.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/doctors/${doctor.id}/edit`}>Edit</Link>
          </Button>
          <Button asChild>
            <Link href={`/doctors/${doctor.id}/prices`}>Price list</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Contact info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">Phone:</span> {doctor.phone ?? "Not set"}</p>
            <p><span className="text-muted-foreground">Email:</span> {doctor.email ?? "Not set"}</p>
            <p><span className="text-muted-foreground">Address:</span> {doctor.address ?? "Not set"}</p>
            <p><span className="text-muted-foreground">Payment terms:</span> {doctor.paymentTerms ?? "Not set"}</p>
            <p><span className="text-muted-foreground">Price group:</span> {doctor.defaultPriceGroup ?? "Standard"}</p>
            <div>
              <p className="text-muted-foreground">Notes</p>
              <p className="mt-1 leading-6">{doctor.notes ?? "No notes yet."}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            {metrics.map(([label, value]) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-2 text-xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cases</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-normal text-muted-foreground">
                    <th className="py-3">Case</th>
                    <th className="py-3">Patient</th>
                    <th className="py-3">Work</th>
                    <th className="py-3">Stage</th>
                    <th className="py-3">Due</th>
                    <th className="py-3">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {doctor.cases.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{item.caseNumber}</td>
                      <td className="py-3">{item.patientName}</td>
                      <td className="py-3">{item.workType}</td>
                      <td className="py-3">{item.currentStage}</td>
                      <td className="py-3">{item.dueDate ?? "Not set"}</td>
                      <td className="py-3">{money(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
