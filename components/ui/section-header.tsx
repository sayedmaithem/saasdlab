import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** If true, renders as a smaller sub-section header */
  sub?: boolean;
}

/**
 * Consistent section-level heading used inside pages.
 * Separates major content blocks within a page with a clear title.
 */
export function SectionHeader({
  title,
  description,
  actions,
  sub = false,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {sub ? (
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </h3>
        ) : (
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        )}
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
