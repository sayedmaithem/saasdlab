import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Loading skeleton block. Use inside Suspense boundaries
 * or while async data is loading to avoid layout shift.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60",
        className,
      )}
      aria-hidden="true"
    />
  );
}

/** Pre-composed skeleton for a stat tile (label + big number) */
export function StatTileSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-2.5 w-32" />
    </div>
  );
}

/** Pre-composed skeleton for an insight card row */
export function InsightCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/10 p-4">
      <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-2.5 w-64" />
      </div>
    </div>
  );
}

/** Pre-composed skeleton for a table row */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-3.5 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}
