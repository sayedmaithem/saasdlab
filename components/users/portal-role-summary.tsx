import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RoleCard = {
  role: string;
  label: string;
  portalDestination: string;
  portalPath: string;
  canDo: string[];
  cannotDo: string[];
};

const ROLE_CARDS: RoleCard[] = [
  {
    role: "lab_manager",
    label: "Lab Manager",
    portalDestination: "Command Center & full app",
    portalPath: "/command-center",
    canDo: [
      "Create and manage cases",
      "Manage doctors, clinics, technicians",
      "View production board",
      "Manage portal users (create/deactivate)",
      "View invoices and payments",
      "View reports and analytics",
    ],
    cannotDo: [
      "Change lab billing settings",
      "Assign lab_owner role",
      "Delete audit logs",
    ],
  },
  {
    role: "reception",
    label: "Reception",
    portalDestination: "Case intake",
    portalPath: "/cases",
    canDo: [
      "Create and view cases",
      "Upload case files",
      "View doctor and clinic list",
      "Update missing case info",
    ],
    cannotDo: [
      "Move production stages",
      "View invoices or payments",
      "Access Command Center",
      "Manage users",
    ],
  },
  {
    role: "technician",
    label: "Technician",
    portalDestination: "Technician workspace",
    portalPath: "/technicians/workspace",
    canDo: [
      "View cases assigned to their stage",
      "Move cases through production stages",
      "Upload design files and STL",
      "Log QC results",
    ],
    cannotDo: [
      "View finance (invoices, payments, statements)",
      "Create or delete cases",
      "Access Command Center",
      "View other technicians' rates",
    ],
  },
  {
    role: "doctor",
    label: "Doctor",
    portalDestination: "Doctor portal",
    portalPath: "/doctor-portal",
    canDo: [
      "Submit new cases",
      "View own cases only",
      "Download doctor-visible files",
      "Upload case files",
      "View own statement",
      "Approve design when required",
    ],
    cannotDo: [
      "See other doctors' cases",
      "View internal comments",
      "Access production board",
      "Access Command Center",
      "View lab finance dashboards",
    ],
  },
  {
    role: "accountant",
    label: "Accountant",
    portalDestination: "Finance module",
    portalPath: "/invoices",
    canDo: [
      "View and create invoices",
      "Record payments",
      "View financial reports",
      "View doctor statements",
    ],
    cannotDo: [
      "Move production stages",
      "Create or edit cases",
      "Access Command Center",
      "Manage users",
    ],
  },
  {
    role: "delivery",
    label: "Delivery",
    portalDestination: "Delivery dashboard",
    portalPath: "/delivery",
    canDo: [
      "View cases ready for delivery",
      "Mark cases as delivered",
      "Upload delivery proof",
    ],
    cannotDo: [
      "View finance (invoices, payments)",
      "Edit case details",
      "Access Command Center",
      "View technician or doctor profiles",
    ],
  },
];

export function PortalRoleSummary() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Portal destinations by role</h2>
        <p className="text-sm text-muted-foreground">
          Where each user lands after login and what they can and cannot access.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ROLE_CARDS.map((rc) => (
          <Card key={rc.role} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{rc.label}</CardTitle>
                <Badge tone="neutral" className="font-mono text-xs">{rc.portalPath}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{rc.portalDestination}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 flex-1 text-xs">
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400 mb-1">Can do</p>
                <ul className="space-y-0.5 text-muted-foreground">
                  {rc.canDo.map((item) => (
                    <li key={item} className="flex gap-1.5">
                      <span className="text-green-500 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-600 dark:text-red-400 mb-1">Cannot do</p>
                <ul className="space-y-0.5 text-muted-foreground">
                  {rc.cannotDo.map((item) => (
                    <li key={item} className="flex gap-1.5">
                      <span className="text-red-400 shrink-0">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
