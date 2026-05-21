import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OpsReportsData } from "@/lib/data/reports";

export function ReportsDashboard({ data }: { data: OpsReportsData }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Analytics</p>
        <h1 className="text-2xl font-semibold">Reports</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {data.metrics.map((metric) => (
          <Card key={metric.label}><CardHeader><CardTitle>{metric.label}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{metric.value}</p><p className="text-sm text-muted-foreground">{metric.hint}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ReportTable title="Stage bottlenecks" rows={data.stageBottlenecks.map((item) => [item.stage.replaceAll("_", " "), String(item.count)])} headers={["Stage", "Cases"]} />
        <ReportTable title="Work type distribution" rows={data.workTypeDistribution.map((item) => [item.workType, String(item.count)])} headers={["Work type", "Cases"]} />
        <ReportTable title="Doctor score" rows={data.doctorScores.map((item) => [item.doctor, String(item.cases), `$${item.revenue.toFixed(0)}`, `${item.missingRate.toFixed(1)}%`, `${item.remakeRate.toFixed(1)}%`])} headers={["Doctor", "Cases", "Revenue", "Missing", "Remakes"]} />
        <ReportTable title="QC analysis" rows={data.qcAnalysis.map((item) => [item.result, String(item.count)])} headers={["Result", "Checks"]} />
        <ReportTable title="Remake analysis" rows={data.remakeAnalysis.map((item) => [item.reason, String(item.count), `$${item.costImpact.toFixed(0)}`])} headers={["Reason", "Count", "Cost"]} />
        <ReportTable title="Overdue cases" rows={data.overdueCases.map((item) => [item.caseNumber, item.doctor, item.dueDate ?? "-", item.stage.replaceAll("_", " ")])} headers={["Case", "Doctor", "Due", "Stage"]} />
      </div>
    </div>
  );
}

function ReportTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="text-muted-foreground"><tr className="border-b">{headers.map((header) => <th key={header} className="py-3 font-medium">{header}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={`${title}-${index}`} className="border-b last:border-0">{row.map((cell, cellIndex) => <td key={cellIndex} className="py-3">{cell}</td>)}</tr>)}</tbody>
        </table>
        {rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No data yet. TODO: add charts once the chart library is selected.</p> : null}
      </CardContent>
    </Card>
  );
}
