import { Card, CardContent } from "@/components/ui/card";
import type { DashboardKpi } from "@/lib/types";

export function KpiGrid({ kpis }: { kpis: DashboardKpi[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tabular-nums" data-kpi="">{kpi.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{kpi.hint}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
