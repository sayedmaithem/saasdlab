import type { ReactNode } from "react";

type StatTileTone = "default" | "green" | "amber" | "red" | "blue";

interface StatTileProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  tone?: StatTileTone;
}

const TONE_CLASSES: Record<StatTileTone, string> = {
  default: "text-foreground",
  green: "text-green-700 dark:text-green-400",
  amber: "text-amber-700 dark:text-amber-400",
  red: "text-red-700 dark:text-red-400",
  blue: "text-blue-700 dark:text-blue-400",
};

/**
 * A single stat metric tile — value-dominant, label below.
 * Designed for dashboards and command center summary sections.
 */
export function StatTile({
  label,
  value,
  sub,
  icon,
  tone = "default",
}: StatTileProps) {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        {icon && (
          <span className="text-muted-foreground">{icon}</span>
        )}
      </div>
      <p className={`text-2xl font-bold leading-none ${TONE_CLASSES[tone]}`}>
        {value}
      </p>
      {sub && (
        <p className="text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
