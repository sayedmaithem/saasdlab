export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, ShieldAlert, Cloud, Settings, Workflow, Rocket } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getSystemTasks,
  type TaskCategory,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/command-center/system-tasks";

type BadgeTone = "default" | "blue" | "amber" | "green" | "red" | "neutral";

const PRIORITY_TONE: Record<TaskPriority, BadgeTone> = {
  critical: "red",
  high: "amber",
  medium: "blue",
  low: "neutral",
};

const STATUS_TONE: Record<TaskStatus, BadgeTone> = {
  open: "red",
  planned: "blue",
  blocked: "amber",
  done: "green",
};

const CATEGORY_ICON: Record<TaskCategory, React.ElementType> = {
  security: ShieldAlert,
  cloud: Cloud,
  setup: Settings,
  workflow: Workflow,
  finance: Workflow,
  ui: Settings,
  deployment: Rocket,
  pilot: Rocket,
};

const FILTER_OPTIONS = [
  { label: "All tasks", value: "all" },
  { label: "Critical & High", value: "urgent" },
  { label: "Pilot blockers", value: "pilot" },
  { label: "Production blockers", value: "production" },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function TasksPage({ searchParams }: Props) {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const params = await searchParams;
  const filter = (params.filter ?? "all") as FilterValue;

  const allTasks = getSystemTasks();

  const tasks = allTasks.filter((t) => {
    if (filter === "urgent") return t.priority === "critical" || t.priority === "high";
    if (filter === "pilot") return t.blocksPilot && t.status !== "done";
    if (filter === "production") return t.blocksProduction && t.status !== "done";
    return true;
  });

  const openCount = allTasks.filter((t) => t.status === "open" || t.status === "planned").length;
  const pilotBlockerCount = allTasks.filter(
    (t) => t.blocksPilot && t.status !== "done",
  ).length;

  return (
    <AppShell
      labName={isPreview ? "Preview Lab" : "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="System Tasks"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-6">
        <CcNav />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {openCount} open task{openCount !== 1 ? "s" : ""}
            {pilotBlockerCount > 0 && (
              <span className="ml-2 font-medium text-red-600">
                · {pilotBlockerCount} pilot blocker{pilotBlockerCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={`/command-center/tasks?filter=${opt.value}`}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <div className="rounded-lg border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
            No tasks match this filter.
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const Icon = CATEGORY_ICON[task.category];
              return (
                <Link
                  key={task.id}
                  href={task.actionHref}
                  className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{task.title}</p>
                      <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
                      <Badge tone={STATUS_TONE[task.status]}>{task.status}</Badge>
                      {task.blocksPilot && <Badge tone="red">blocks pilot</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-5 line-clamp-2">
                      {task.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Owner: {task.recommendedOwner} · Model: {task.recommendedModel}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground/50" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
