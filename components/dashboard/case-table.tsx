import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStageLabel } from "@/lib/data/dashboard";
import { priorityBadgeTone, stageBadgeTone } from "@/lib/utils/status-badges";
import type { CaseSummary } from "@/lib/types";

export function CaseTable({ cases }: { cases: CaseSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active case workbench</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-normal text-muted-foreground">
              <th className="py-3 pr-4 font-semibold">Case</th>
              <th className="py-3 pr-4 font-semibold">Doctor / clinic</th>
              <th className="py-3 pr-4 font-semibold">Work</th>
              <th className="py-3 pr-4 font-semibold">Stage</th>
              <th className="py-3 pr-4 font-semibold">Due</th>
              <th className="py-3 pr-4 font-semibold">Files</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-4 pr-4 align-top">
                  <p className="font-semibold">{item.caseNumber}</p>
                  <p className="text-muted-foreground">{item.patientDisplay}</p>
                </td>
                <td className="py-4 pr-4 align-top">
                  <p className="font-medium">{item.doctorName}</p>
                  <p className="text-muted-foreground">{item.clinicName}</p>
                </td>
                <td className="py-4 pr-4 align-top">
                  <p className="font-medium">{item.restorationType}</p>
                  <p className="text-muted-foreground">
                    {item.assignedTechnician ?? "Unassigned"}
                  </p>
                </td>
                <td className="py-4 pr-4 align-top">
                  <Badge tone={stageBadgeTone[item.stage]}>
                    {getStageLabel(item.stage)}
                  </Badge>
                  <div className="mt-2">
                    <Badge tone={priorityBadgeTone[item.priority]}>
                      {item.priority}
                    </Badge>
                  </div>
                </td>
                <td className="py-4 pr-4 align-top text-muted-foreground">
                  {item.dueDate ?? "Not set"}
                </td>
                <td className="py-4 pr-4 align-top">
                  <p className="font-medium">{item.fileCount} files</p>
                  <p className="text-muted-foreground">
                    {item.unreadDiscussionCount} unread
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
