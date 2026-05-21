import Link from "next/link";
import { ArrowRight, ShieldAlert, Cloud, Settings, Workflow, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SystemTask, TaskCategory, TaskPriority } from "@/lib/command-center/system-tasks";

const PRIORITY_TONE: Record<TaskPriority, "red" | "amber" | "blue" | "neutral"> = {
  critical: "red",
  high: "amber",
  medium: "blue",
  low: "neutral",
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

type Props = {
  tasks: SystemTask[];
};

export function TopTasks({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        No open tasks — system is in good shape.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const Icon = CATEGORY_ICON[task.category];
        return (
          <Link
            key={task.id}
            href={task.actionHref}
            className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
          >
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <Badge tone={PRIORITY_TONE[task.priority]}>
                  {task.priority}
                </Badge>
                {task.blocksPilot && (
                  <Badge tone="red">blocks pilot</Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground leading-5 line-clamp-1">
                {task.description}
              </p>
            </div>
            <ArrowRight className={cn("mt-1 size-4 shrink-0 text-muted-foreground/50")} />
          </Link>
        );
      })}
    </div>
  );
}
