import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/finance/money";
import type { DoctorStatementRow } from "@/lib/data/finance";

export function DoctorStatement({
  doctorName,
  rows,
  remainingBalance,
}: {
  doctorName: string;
  rows: DoctorStatementRow[];
  remainingBalance: number;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Doctor statement</p>
        <h1 className="text-2xl font-semibold">{doctorName}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Opening balance</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(0)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Remaining balance</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(remainingBalance)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Print/export</CardTitle></CardHeader><CardContent><Button variant="outline" disabled>PDF soon</Button></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Input name="from" type="date" />
            <Input name="to" type="date" />
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Statement ledger</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b"><th className="py-3">Date</th><th>Type</th><th>Reference</th><th>Debit</th><th>Credit</th><th>Balance</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.type}-${row.reference}-${row.date}`} className="border-b last:border-0">
                  <td className="py-3">{row.date}</td>
                  <td>{row.type}</td>
                  <td>{row.reference}</td>
                  <td>{row.debit ? formatMoney(row.debit) : "-"}</td>
                  <td>{row.credit ? formatMoney(row.credit) : "-"}</td>
                  <td className="font-semibold">{formatMoney(row.balance)}</td>
                  <td>{row.notes ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No statement activity yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
