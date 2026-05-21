import Link from "next/link";
import { CheckCircle2, Circle, AlertCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { hasSupabaseEnv } from "@/lib/env";

type StepStatus = "done" | "pending" | "warning";
type BadgeTone = "default" | "blue" | "amber" | "green" | "red" | "neutral";

const STATUS_TONE: Record<StepStatus, BadgeTone> = {
  done: "green",
  warning: "amber",
  pending: "neutral",
};

const STATUS_LABEL: Record<StepStatus, string> = {
  done: "Done",
  warning: "Needs attention",
  pending: "Pending",
};

type WizardStep = {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
  actionLabel: string;
  actionHref: string;
  blocksPilot: boolean;
  blocksProduction: boolean;
};

function getSteps(): WizardStep[] {
  const supabase = hasSupabaseEnv();

  return [
    {
      id: 1,
      title: "Configure Supabase project",
      description:
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local. Create the Supabase project if it does not exist yet.",
      status: supabase ? "done" : "warning",
      actionLabel: "Cloud setup",
      actionHref: "/command-center/cloud",
      blocksPilot: true,
      blocksProduction: true,
    },
    {
      id: 2,
      title: "Apply database migrations",
      description:
        "Run supabase db push or apply migrations 0001–0011 in order via the Supabase CLI. Verify row counts match expectations.",
      status: "pending",
      actionLabel: "Backend health",
      actionHref: "/command-center/health",
      blocksPilot: true,
      blocksProduction: true,
    },
    {
      id: 3,
      title: "Verify Row Level Security",
      description:
        "RLS must be enabled on all business tables. Check via Supabase dashboard → Database → Tables and confirm the shield icon is green.",
      status: "pending",
      actionLabel: "Cloud setup",
      actionHref: "/command-center/cloud",
      blocksPilot: true,
      blocksProduction: true,
    },
    {
      id: 4,
      title: "Create lab profile",
      description:
        "Insert a row in the labs table with your lab's name, phone, address, and logo URL. Complete this via Settings → Lab Profile.",
      status: "pending",
      actionLabel: "Settings",
      actionHref: "/settings",
      blocksPilot: true,
      blocksProduction: true,
    },
    {
      id: 5,
      title: "Create first lab_owner account",
      description:
        "Sign up via Supabase Auth and assign role = lab_owner in the lab_members table. This account will administer the entire system.",
      status: "pending",
      actionLabel: "Roles & Access",
      actionHref: "/command-center/roles",
      blocksPilot: true,
      blocksProduction: true,
    },
    {
      id: 6,
      title: "Configure storage buckets",
      description:
        "Create case-files and design-files buckets in Supabase Storage with role-scoped access policies and correct CORS settings.",
      status: "pending",
      actionLabel: "Cloud setup",
      actionHref: "/command-center/cloud",
      blocksPilot: true,
      blocksProduction: true,
    },
    {
      id: 7,
      title: "Configure work types and materials",
      description:
        "Define restoration types, materials list, pricing structure, and QC thresholds in lab settings before any real cases are entered.",
      status: "pending",
      actionLabel: "Settings",
      actionHref: "/settings",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: 8,
      title: "Invite first doctor and technician",
      description:
        "Add a doctor profile linked to a clinic. Invite a technician via Supabase Auth. Test both portal views with real credentials.",
      status: "pending",
      actionLabel: "Add doctor",
      actionHref: "/doctors/new",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: 9,
      title: "Submit a demo case end-to-end",
      description:
        "Create a test case, move it through all stages: received → cad_design → quality_control → ready_for_delivery → delivered.",
      status: "pending",
      actionLabel: "New case",
      actionHref: "/cases/new",
      blocksPilot: true,
      blocksProduction: false,
    },
    {
      id: 10,
      title: "Deploy to Vercel",
      description:
        "Connect the GitHub repo to Vercel, set all production environment variables, configure a custom domain, and trigger a production build.",
      status: "pending",
      actionLabel: "Cloud setup",
      actionHref: "/command-center/cloud",
      blocksPilot: false,
      blocksProduction: true,
    },
  ];
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done")
    return <CheckCircle2 className="size-5 shrink-0 text-green-600" aria-label="Complete" />;
  if (status === "warning")
    return <AlertCircle className="size-5 shrink-0 text-amber-500" aria-label="Needs attention" />;
  return <Circle className="size-5 shrink-0 text-muted-foreground/40" aria-label="Pending" />;
}

export function SetupWizard() {
  const steps = getSteps();
  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {doneCount} of {steps.length} steps complete
        </p>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="space-y-2.5">
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "rounded-lg border p-4",
              step.status === "warning" && "border-amber-200 bg-amber-50/60",
              step.status === "done" && "border-green-200 bg-green-50/40",
              step.status === "pending" && "bg-card",
            )}
          >
            <div className="flex items-start gap-3">
              <StepIcon status={step.status} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">
                    {step.id}. {step.title}
                  </p>
                  <Badge tone={STATUS_TONE[step.status]}>
                    {STATUS_LABEL[step.status]}
                  </Badge>
                  {step.blocksPilot && step.status !== "done" && (
                    <Badge tone="red">blocks pilot</Badge>
                  )}
                  {step.blocksProduction && !step.blocksPilot && step.status !== "done" && (
                    <Badge tone="amber">blocks production</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-5">
                  {step.description}
                </p>
              </div>
              {step.status !== "done" && (
                <Link
                  href={step.actionHref}
                  className="flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {step.actionLabel}
                  <ArrowRight className="size-3" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
