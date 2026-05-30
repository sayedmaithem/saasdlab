"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function ErrorBoundary({ error, reset, title = "Something went wrong" }: ErrorBoundaryProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
        <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <p className="text-[15px] font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {error.message ?? "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono mt-2">
            Ref: {error.digest}
          </p>
        )}
      </div>

      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary
                   hover:bg-primary/20 transition-[background-color,border-color] duration-150"
      >
        <RefreshCw className="size-3.5" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}
