import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStageLabel } from "@/lib/data/dashboard";
import type { StageMetric } from "@/lib/types";

export function WorkflowBoard({ metrics }: { metrics: StageMetric[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Production workflow</CardTitle>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active production stages yet.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.stage}
                className="min-h-28 rounded-lg border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {getStageLabel(metric.stage)}
                  </p>
                  <Badge tone={metric.overdue > 0 ? "red" : "neutral"}>
                    {metric.count}
                  </Badge>
                </div>
                <div className="mt-5 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, 24 + metric.count * 18)}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {metric.overdue > 0
                    ? `${metric.overdue} overdue`
                    : "Within SLA"}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
