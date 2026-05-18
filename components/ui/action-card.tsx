import Link from "next/link";
import type { ReactNode } from "react";

interface ActionCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  href: string;
  badge?: ReactNode;
  external?: boolean;
}

/**
 * Clickable card that acts as a navigation shortcut.
 * Used in master-data, command center dashboards, and quick-action panels.
 */
export function ActionCard({
  icon,
  title,
  description,
  href,
  badge,
  external = false,
}: ActionCardProps) {
  const inner = (
    <div className="group flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent hover:border-accent-foreground/20 cursor-pointer">
      {icon && (
        <div className="mt-0.5 flex-shrink-0 flex items-center justify-center size-9 rounded-md bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground leading-none">
            {title}
          </p>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return <Link href={href}>{inner}</Link>;
}
