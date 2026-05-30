import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-white/5", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

function SkeletonKpi({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 glass-card p-5 space-y-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 glass-card p-5 space-y-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

function SkeletonTableRow({ cols = 5, className }: { cols?: number; className?: string }) {
  const widths = ["w-24", "w-32", "w-20", "w-16", "w-20"];
  return (
    <div
      className={cn("flex items-center gap-4 py-3 border-b border-white/5", className)}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", widths[i % widths.length])} />
      ))}
    </div>
  );
}

function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKpi key={i} />
        ))}
      </div>
      <div className="rounded-2xl border border-white/5 glass-card p-5 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonKpi,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonPage,
  // Legacy aliases kept for existing callers
  SkeletonKpi as StatTileSkeleton,
  SkeletonCard as InsightCardSkeleton,
};

/** @deprecated Use SkeletonTableRow */
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
