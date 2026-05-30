import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm animate-fade-in">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Compass className="size-7 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <p className="text-4xl font-bold tabular-nums text-foreground">404</p>
          <p className="text-[15px] font-semibold text-foreground">Page not found</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary
                     hover:bg-primary/20 transition-[background-color,border-color] duration-150"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
