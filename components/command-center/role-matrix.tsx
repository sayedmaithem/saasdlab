import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type CellValue = "yes" | "no" | "own" | "assigned" | "partial";

type Capability = {
  label: string;
  super_admin: CellValue;
  lab_owner: CellValue;
  lab_manager: CellValue;
  reception: CellValue;
  technician: CellValue;
  accountant: CellValue;
  doctor: CellValue;
  delivery: CellValue;
};

const CAPABILITIES: Capability[] = [
  {
    label: "Dashboard",
    super_admin: "yes", lab_owner: "yes", lab_manager: "yes",
    reception: "yes", technician: "no", accountant: "no",
    doctor: "no", delivery: "no",
  },
  {
    label: "Doctors & Clinics",
    super_admin: "yes", lab_owner: "yes", lab_manager: "yes",
    reception: "yes", technician: "no", accountant: "yes",
    doctor: "no", delivery: "no",
  },
  {
    label: "Cases — view",
    super_admin: "yes", lab_owner: "yes", lab_manager: "yes",
    reception: "yes", technician: "assigned", accountant: "yes",
    doctor: "own", delivery: "yes",
  },
  {
    label: "Cases — create / edit",
    super_admin: "yes", lab_owner: "yes", lab_manager: "yes",
    reception: "yes", technician: "no", accountant: "no",
    doctor: "no", delivery: "no",
  },
  {
    label: "Files (upload / view)",
    super_admin: "yes", lab_owner: "yes", lab_manager: "yes",
    reception: "yes", technician: "yes", accountant: "no",
    doctor: "own", delivery: "no",
  },
  {
    label: "Design Workflow",
    super_admin: "yes", lab_owner: "yes", lab_manager: "yes",
    reception: "no", technician: "partial", accountant: "no",
    doctor: "partial", delivery: "no",
  },
  {
    label: "Production Tasks",
    super_admin: "yes", lab_owner: "yes", lab_manager: "yes",
    reception: "no", technician: "assigned", accountant: "no",
    doctor: "no", delivery: "no",
  },
  {
    label: "Comments",
    super_admin: "yes", lab_owner: "yes", lab_manager: "yes",
    reception: "yes", technician: "yes", accountant: "no",
    doctor: "own", delivery: "no",
  },
  {
    label: "Quality Control",
    super_admin: "yes", lab_owner: "yes", lab_manager: "yes",
    reception: "no", technician: "yes", accountant: "no",
    doctor: "no", delivery: "no",
  },
  {
    label: "Invoices",
    super_admin: "yes", lab_owner: "yes", lab_manager: "no",
    reception: "no", technician: "no", accountant: "yes",
    doctor: "own", delivery: "no",
  },
  {
    label: "Payments",
    super_admin: "yes", lab_owner: "yes", lab_manager: "no",
    reception: "no", technician: "no", accountant: "yes",
    doctor: "no", delivery: "no",
  },
  {
    label: "Delivery",
    super_admin: "yes", lab_owner: "yes", lab_manager: "yes",
    reception: "yes", technician: "no", accountant: "no",
    doctor: "no", delivery: "yes",
  },
  {
    label: "Settings",
    super_admin: "yes", lab_owner: "yes", lab_manager: "no",
    reception: "no", technician: "no", accountant: "no",
    doctor: "no", delivery: "no",
  },
];

const ROLE_LABELS = [
  { key: "super_admin", label: "Super Admin" },
  { key: "lab_owner", label: "Owner" },
  { key: "lab_manager", label: "Manager" },
  { key: "reception", label: "Reception" },
  { key: "technician", label: "Technician" },
  { key: "accountant", label: "Accountant" },
  { key: "doctor", label: "Doctor" },
  { key: "delivery", label: "Delivery" },
] as const;

function Cell({ value }: { value: CellValue }) {
  if (value === "yes") {
    return (
      <span className="flex justify-center">
        <Check className="size-4 text-green-600" aria-label="Allowed" />
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="flex justify-center">
        <X className="size-4 text-muted-foreground/40" aria-label="Not allowed" />
      </span>
    );
  }
  if (value === "own") {
    return (
      <span className="flex justify-center">
        <span
          className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700"
          title="Own only"
        >
          Own
        </span>
      </span>
    );
  }
  if (value === "assigned") {
    return (
      <span className="flex justify-center">
        <span
          className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700"
          title="Assigned only"
        >
          Asgn
        </span>
      </span>
    );
  }
  // partial
  return (
    <span className="flex justify-center">
      <Minus className="size-4 text-amber-500" aria-label="Partial" />
    </span>
  );
}

export function RoleMatrix() {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="py-3 pl-4 pr-6 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Capability
            </th>
            {ROLE_LABELS.map((r) => (
              <th
                key={r.key}
                className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {r.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CAPABILITIES.map((cap, i) => (
            <tr
              key={cap.label}
              className={cn("border-b last:border-0", i % 2 === 0 ? "bg-background" : "bg-muted/20")}
            >
              <td className="py-2.5 pl-4 pr-6 font-medium">{cap.label}</td>
              {ROLE_LABELS.map((r) => (
                <td key={r.key} className="px-3 py-2.5">
                  <Cell value={cap[r.key]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-wrap gap-4 border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Check className="size-3 text-green-600" /> Allowed
        </span>
        <span className="flex items-center gap-1.5">
          <X className="size-3 text-muted-foreground/40" /> Not allowed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-blue-100 px-1 text-blue-700 font-semibold">Own</span> Own records only
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-amber-100 px-1 text-amber-700 font-semibold">Asgn</span> Assigned only
        </span>
        <span className="flex items-center gap-1.5">
          <Minus className="size-3 text-amber-500" /> Partial (view only)
        </span>
      </div>
    </div>
  );
}
