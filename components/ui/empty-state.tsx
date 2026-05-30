import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateVariant = "default" | "dashed" | "ghost";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: EmptyStateVariant;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl py-14 px-8 text-center",
        variant === "dashed" && "border-2 border-dashed border-white/10",
        variant === "default" && "border border-white/5 glass-card",
        variant === "ghost" && "bg-transparent",
        className,
      )}
    >
      {icon && (
        <div className="flex items-center justify-center size-14 rounded-2xl bg-white/5 border border-white/8 text-muted-foreground shadow-inner">
          <span className="size-6 [&>svg]:size-6">{icon}</span>
        </div>
      )}
      <div className="space-y-1.5 max-w-xs">
        <p className="text-[15px] font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
