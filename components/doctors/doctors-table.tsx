import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ClinicOption, DoctorListItem } from "@/lib/data/doctors";

const paymentTone = {
  good: "green",
  attention: "amber",
  blocked: "red",
} as const;

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DoctorsTable({
  doctors,
  clinics,
  query,
  clinicId,
  status,
}: {
  doctors: DoctorListItem[];
  clinics: ClinicOption[];
  query?: string;
  clinicId?: string;
  status?: string;
}) {
  return (
    <div className="space-y-5">
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_220px_180px_auto]">
        <input
          className="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          name="q"
          placeholder="Search doctors..."
          defaultValue={query}
        />
        <select
          className="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          name="clinic"
          defaultValue={clinicId}
        >
          <option value="">All clinics</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          name="status"
          defaultValue={status}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="vip">VIP</option>
        </select>
        <Button type="submit">Filter</Button>
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-normal text-muted-foreground">
                <th className="p-4">Doctor</th>
                <th className="p-4">Clinic</th>
                <th className="p-4">Cases</th>
                <th className="p-4">Balance</th>
                <th className="p-4">Missing info</th>
                <th className="p-4">Remakes</th>
                <th className="p-4">Payment</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="border-b last:border-0">
                  <td className="p-4">
                    <Link
                      href={`/doctors/${doctor.id}`}
                      className="font-semibold hover:underline"
                    >
                      {doctor.displayName}
                    </Link>
                    <p className="text-muted-foreground">{doctor.phone ?? doctor.email}</p>
                    <div className="mt-2 flex gap-2">
                      {doctor.isVip ? <Badge tone="amber">VIP</Badge> : null}
                      <Badge tone={doctor.isActive ? "green" : "neutral"}>
                        {doctor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-4">{doctor.clinicName ?? "Unassigned"}</td>
                  <td className="p-4 font-medium">{doctor.totalCases}</td>
                  <td className="p-4 font-medium">{money(doctor.totalBalance)}</td>
                  <td className="p-4">{doctor.missingInformationRate}%</td>
                  <td className="p-4">{doctor.remakeRate}%</td>
                  <td className="p-4">
                    <Badge tone={paymentTone[doctor.paymentStatus]}>
                      {doctor.paymentStatus}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/doctors/${doctor.id}/edit`}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
