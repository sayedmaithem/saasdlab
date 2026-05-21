export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getFlagsByCategory, type FlagStatus, type FlagRisk, type FlagCategory } from "@/lib/command-center/feature-flags";

type BadgeTone = "default" | "blue" | "amber" | "green" | "red" | "neutral";

const STATUS_TONE: Record<FlagStatus, BadgeTone> = {
  enabled: "green",
  disabled: "neutral",
  coming_soon: "blue",
  needs_setup: "amber",
};

const STATUS_LABEL: Record<FlagStatus, string> = {
  enabled: "Enabled",
  disabled: "Disabled",
  coming_soon: "Coming soon",
  needs_setup: "Needs setup",
};

const RISK_TONE: Record<FlagRisk, BadgeTone> = {
  low: "neutral",
  medium: "amber",
  high: "red",
};

const CATEGORY_LABEL: Record<FlagCategory, string> = {
  core: "Core",
  portal: "Portals",
  finance: "Finance",
  automation: "Automation",
  integration: "Integrations",
  experimental: "Experimental",
};

const STATUS_BG: Record<FlagStatus, string> = {
  enabled: "border-green-200 bg-green-50/30",
  disabled: "border-muted bg-muted/20",
  coming_soon: "border-dashed border-muted bg-muted/10",
  needs_setup: "border-amber-200 bg-amber-50/20",
};

export default async function FeaturesPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const byCategory = getFlagsByCategory();

  const categories = Object.keys(byCategory) as FlagCategory[];
  const allFlags = categories.flatMap((c) => byCategory[c]);
  const enabledCount = allFlags.filter((f) => f.status === "enabled").length;
  const needsSetupCount = allFlags.filter((f) => f.status === "needs_setup").length;

  return (
    <AppShell
      labName={isPreview ? "Preview Lab" : "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="Feature Flags"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-8">
        <CcNav />

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-green-600">{enabledCount}</span> enabled
          </span>
          <span>
            <span className="font-semibold text-amber-500">{needsSetupCount}</span> needs setup
          </span>
          <span className="text-muted-foreground/60">{allFlags.length} total flags</span>
        </div>

        {categories.map((category) => {
          const flags = byCategory[category];
          if (!flags?.length) return null;

          return (
            <section key={category}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {CATEGORY_LABEL[category]}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {flags.map((flag) => (
                  <div
                    key={flag.key}
                    className={cn(
                      "rounded-lg border p-4 space-y-2",
                      STATUS_BG[flag.status],
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{flag.label}</p>
                      <Badge tone={STATUS_TONE[flag.status]}>
                        {STATUS_LABEL[flag.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-5">
                      {flag.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge tone={RISK_TONE[flag.risk]}>Risk: {flag.risk}</Badge>
                      <span className="text-xs text-muted-foreground/60 font-mono">
                        {flag.key}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
