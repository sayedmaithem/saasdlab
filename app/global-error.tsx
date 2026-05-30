"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[oklch(0.16_0.018_260)] text-[oklch(0.97_0.005_250)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 px-6 text-center max-w-sm">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="size-6 text-red-400" />
          </div>
          <div className="space-y-1.5">
            <p className="text-[15px] font-semibold">Application error</p>
            <p className="text-sm text-white/50 leading-relaxed">
              {error.message ?? "A critical error occurred. Please reload."}
            </p>
            {error.digest && (
              <p className="text-xs text-white/30 font-mono mt-2">Ref: {error.digest}</p>
            )}
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            <RefreshCw className="size-3.5" />
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
