import { Database, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DashboardSource } from "@/lib/types";

export function SourceBanner({ source }: { source: DashboardSource }) {
  if (source === "supabase") {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-lg border bg-card p-4">
        <Database className="size-5 text-primary" aria-hidden="true" />
        <div>
          <Badge tone="green">Supabase live</Badge>
          <p className="mt-1 text-sm text-muted-foreground">
            Data is loaded through RLS-protected Supabase queries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <ShieldAlert className="mt-0.5 size-5" aria-hidden="true" />
      <div>
        <Badge tone="amber">Preview mode</Badge>
        <p className="mt-1 text-sm leading-6">
          Supabase env vars are not configured yet. The UI is running with typed
          preview data while the real schema, RLS policies, storage bucket, and
          server action are already in place.
        </p>
      </div>
    </div>
  );
}
