import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "dashed";
}

/**
 * Standardized empty state block used when a list or section has no data.
 * Replaces one-off ad-hoc empty divs throughout the app.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) {
  const border =
    variant === "dashed"
      ? "border-2 border-dashed"
      : "border";

  return (
    <div
      className={`${border} rounded-lg bg-muted/20 py-12 px-6 text-center flex flex-col items-center gap-3`}
    >
      {icon && (
        <div className="flex items-center justify-center size-12 rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
