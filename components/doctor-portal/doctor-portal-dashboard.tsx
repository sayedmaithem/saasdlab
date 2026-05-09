import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DoctorPortalData } from "@/lib/data/doctor-portal";

export function DoctorPortalDashboard({ data }: { data: DoctorPortalData }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Doctor portal</p>
          <h1 className="text-2xl font-semibold">{data.doctorName}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/doctor-portal/statement">Statement</Link></Button>
          <Button asChild><Link href="/doctor-portal/cases/new">New case</Link></Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {data.cards.map((card) => (
          <Card key={card.label}><CardHeader><CardTitle>{card.label}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{card.value}</p><p className="text-sm text-muted-foreground">{card.hint}</p></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>My cases</CardTitle></CardHeader>
        <CardContent>
          <form className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <Input name="query" placeholder="Search patient or case number" />
            <Button type="submit">Search</Button>
          </form>
          <div className="space-y-3">
            {data.cases.map((item) => (
              <Link key={item.id} href={`/doctor-portal/cases/${item.id}`} className="block rounded-lg border bg-background p-4 hover:bg-muted">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.caseNumber} / {item.patientName}</p>
                    <p className="text-sm text-muted-foreground">{item.workType} / Due {item.dueDate ?? "not set"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge tone={item.missingInfoStatus === "missing" ? "amber" : "green"}>{item.missingInfoStatus}</Badge>
                    <Badge tone="blue">{item.currentStage.replaceAll("_", " ")}</Badge>
                  </div>
                </div>
              </Link>
            ))}
            {data.cases.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No cases yet.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
