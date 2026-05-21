import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Blocker = {
  id: string;
  title: string;
  reason: string;
  severity: "critical" | "high";
};

const MVP_BLOCKERS: Blocker[] = [
  {
    id: "C1",
    severity: "critical",
    title: "Add explicit lab_id filter to getDashboardData()",
    reason: "Multi-tenant data isolation cannot rely on RLS alone at the MVP stage.",
  },
  {
    id: "C2",
    severity: "critical",
    title: "Fix doctor file uploaded_by bypass in RLS policy",
    reason:
      "Doctors must not access private_finance files they uploaded. Visibility flag is the gate.",
  },
  {
    id: "C3",
    severity: "critical",
    title: "Add explicit opt-in flag for preview auth",
    reason:
      "Preview mode must never activate on staging without an explicit NEXT_PUBLIC_PREVIEW_AUTH_ENABLED=true flag.",
  },
  {
    id: "C4",
    severity: "critical",
    title: "Add doctor_id filter to getFinanceDashboard() for doctor role",
    reason: "Finance isolation for doctors must be enforced at the query layer, not only by RLS.",
  },
  {
    id: "H3",
    severity: "high",
    title: "Add Zod validation to updateLabSettingsAction()",
    reason: "Settings server action must validate FormData before writing to the database.",
  },
];

export function MvpBlockers() {
  return (
    <ol className="space-y-2">
      {MVP_BLOCKERS.map((blocker, index) => (
        <li key={blocker.id} className="flex items-start gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            {index + 1}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <AlertCircle
                className={
                  blocker.severity === "critical" ? "size-4 text-red-600" : "size-4 text-amber-500"
                }
                aria-hidden="true"
              />
              <Badge tone={blocker.severity === "critical" ? "red" : "amber"}>
                {blocker.id}
              </Badge>
              <p className="text-sm font-semibold">{blocker.title}</p>
            </div>
            <p className="mt-1 pl-6 text-xs text-muted-foreground leading-5">{blocker.reason}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
