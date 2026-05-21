export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { PrintHub } from "@/components/settings/print-hub";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function PrintHubPage() {
  const session = await requireRouteAccess("/settings/print");
  const isPreview = canUsePreviewAuth();

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/settings"
      eyebrow="Settings"
      title="Print Hub"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <PageShell>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/settings"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ChevronLeft className="size-3" /> Settings
          </Link>
        </div>

        <SectionHeader
          title="Print Hub"
          description="Configure and preview print templates for invoices, barcode labels, case summaries, and delivery slips."
        />

        <PrintHub />
      </PageShell>
    </AppShell>
  );
}
