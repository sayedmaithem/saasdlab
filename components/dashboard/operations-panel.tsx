import { CheckCircle2, Clock3, HardDriveUpload, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/types";

export function OperationsPanel({ data }: { data: DashboardData }) {
  const items = [
    {
      label: "Cloud file intake",
      value: "Storage bucket ready",
      icon: HardDriveUpload,
    },
    {
      label: "Pending approvals",
      value: `${data.pendingApprovals} designs`,
      icon: Clock3,
    },
    {
      label: "Open QC issues",
      value: `${data.openQcIssues} checkpoints`,
      icon: ShieldCheck,
    },
    {
      label: "Audit timeline",
      value: "Insert triggers planned",
      icon: CheckCircle2,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-lg border bg-background p-3"
          >
            <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <item.icon className="size-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
