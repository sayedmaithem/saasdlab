export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Building2,
  UserRound,
  Wrench,
  FlaskConical,
  Tags,
  DollarSign,
  Hammer,
  ShieldCheck,
  Globe,
  Users,
  ArrowRight,
  AlertCircle,
  Workflow,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireRouteAccess } from "@/lib/auth/guards";
import { canUsePreviewAuth } from "@/lib/env";
import { CcNav } from "@/components/command-center/cc-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMasterDataOverview } from "@/lib/data/master-data";

type CardStatus = "ready" | "needs_setup" | "coming_soon";

type MasterDataCard = {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  cta: string;
  status: CardStatus;
  count?: number;
  note?: string;
  setupStep?: number; // 1-based setup order for first-time setup
};

const STATUS_BADGE: Record<CardStatus, { label: string; tone: "green" | "amber" | "blue" }> = {
  ready: { label: "Ready", tone: "green" },
  needs_setup: { label: "Needs setup", tone: "amber" },
  coming_soon: { label: "Coming soon", tone: "blue" },
};

function statusFromCount(count: number): CardStatus {
  return count > 0 ? "ready" : "needs_setup";
}

export default async function MasterDataPage() {
  const session = await requireRouteAccess("/command-center");
  const isPreview = canUsePreviewAuth();
  const overview = await getMasterDataOverview(session);

  const CARDS: MasterDataCard[] = [
    // ── People (configure first) ──────────────────────────────
    {
      title: "Clinics",
      description:
        "Clinic profiles, addresses, contact details, and doctor assignments. Every case must be linked to a clinic.",
      href: "/clinics",
      icon: Building2,
      status: "ready",
      cta: "Manage clinics",
      setupStep: 1,
    },
    {
      title: "Doctors",
      description:
        "Doctor profiles, clinic assignments, payment terms, and VIP status. Doctors are referenced on every case.",
      href: "/doctors",
      icon: UserRound,
      status: "ready",
      cta: "Manage doctors",
      setupStep: 2,
    },
    {
      title: "Technicians",
      description:
        "Lab technicians, skills, workloads, and workspace access. Technicians are assigned to production stages.",
      href: "/technicians",
      icon: Wrench,
      status: "ready",
      cta: "Manage technicians",
      setupStep: 3,
    },
    // ── Catalog (configure before pricing) ───────────────────
    {
      title: "Work Types",
      description:
        "Restoration types your lab performs: crowns, bridges, implants, aligners, night guards. Drives case creation and QC checklists.",
      href: "/command-center/master-data/operations",
      icon: FlaskConical,
      status: statusFromCount(overview.operationsCount),
      cta: overview.operationsCount > 0 ? "Manage work types" : "Configure work types",
      count: overview.operationsCount,
      setupStep: 4,
    },
    {
      title: "Materials",
      description:
        "Materials catalogue: zirconia, e.max, PMMA, titanium. Materials are selected per case and used in pricing.",
      href: "/command-center/master-data/materials",
      icon: FlaskConical,
      status: statusFromCount(overview.materialsCount),
      cta: overview.materialsCount > 0 ? "Manage materials" : "Configure materials",
      count: overview.materialsCount,
      setupStep: 5,
    },
    // ── Pricing (configure after catalog) ────────────────────
    {
      title: "Price Groups",
      description:
        "Named price tiers: Standard, VIP, Implant Specialist, Wholesale. Each doctor is assigned a default group.",
      href: "/command-center/master-data/price-groups",
      icon: Tags,
      status: statusFromCount(overview.priceGroupsCount),
      cta: overview.priceGroupsCount > 0 ? "Manage groups" : "Create price groups",
      count: overview.priceGroupsCount,
      setupStep: 6,
    },
    {
      title: "Operation Prices",
      description:
        "Unit prices per work type, material, and price group. Prices auto-apply when creating cases.",
      href: "/command-center/master-data/prices",
      icon: DollarSign,
      status: statusFromCount(overview.operationPricesCount),
      cta: overview.operationPricesCount > 0 ? "View prices" : "Configure prices",
      count: overview.operationPricesCount,
      setupStep: 7,
      note:
        overview.priceGroupsCount === 0
          ? "Create price groups before adding prices."
          : overview.operationsCount === 0
          ? "Configure work types before adding prices."
          : undefined,
    },
    {
      title: "Technician Rates",
      description:
        "Per-operation cost rates for internal tracking. Feeds into lab margin and profit reporting.",
      href: "/command-center/master-data/technician-rates",
      icon: Hammer,
      status: statusFromCount(overview.technicianRatesCount),
      cta: overview.technicianRatesCount > 0 ? "Manage rates" : "Configure rates",
      count: overview.technicianRatesCount,
    },
    // ── Workflow and access ───────────────────────────────────
    {
      title: "Workflow Engine",
      description:
        "Custom production stage sequences. Override the default 18-stage workflow with relabeled, reordered stages and entry requirements.",
      href: "/command-center/master-data/workflows",
      icon: Workflow,
      status: "ready",
      cta: "Configure workflows",
    },
    {
      title: "Stage Permissions",
      description:
        "Per-technician stage access control. Enforce which stages each technician can work on and move cases between.",
      href: "/command-center/master-data/technician-stage-permissions",
      icon: ShieldCheck,
      status: "ready",
      cta: "Configure permissions",
    },
    {
      title: "Portal Users",
      description:
        "Portal accounts for technicians, doctors, accountants, and delivery staff. Manage identity directly from the app.",
      href: "/command-center/users",
      icon: Users,
      status: "ready",
      cta: "Manage portal users",
    },
    {
      title: "Roles & Permissions",
      description:
        "8-role permission matrix. Understand which roles can access what. Review before inviting team members.",
      href: "/command-center/roles",
      icon: ShieldCheck,
      status: "ready",
      cta: "View permission matrix",
    },
    {
      title: "Portal Access",
      description:
        "Control which portals are active: Doctor Portal, Technician Workspace, Finance view, Delivery view.",
      href: "/command-center/master-data/portal-access",
      icon: Globe,
      status: statusFromCount(overview.portalTemplatesCount),
      cta: overview.portalTemplatesCount > 0 ? "Manage templates" : "Configure portal access",
      count: overview.portalTemplatesCount,
    },
  ];

  const readyCount = CARDS.filter((c) => c.status === "ready").length;
  const needsSetupCount = CARDS.filter((c) => c.status === "needs_setup").length;

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/command-center"
      eyebrow="Command Center"
      title="Master Data"
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <div className="space-y-8">
        <CcNav />

        <div className="space-y-2">
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure your lab before going live. Each section is isolated to your lab — nothing is shared.
            Items marked <span className="font-semibold text-amber-600">Needs setup</span> must be completed before cases can be created and priced.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              <span className="font-semibold text-emerald-600">{readyCount}</span> sections ready
            </span>
            {needsSetupCount > 0 && (
              <span className="text-muted-foreground">
                <span className="font-semibold text-amber-600">{needsSetupCount}</span> need setup
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            const badge = STATUS_BADGE[card.status];

            return (
              <Card key={card.title} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                        {card.setupStep !== undefined && card.status === "needs_setup" && (
                          <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                            {card.setupStep}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-sm font-semibold">{card.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {card.count !== undefined && card.count > 0 ? (
                        <span className="text-xs font-medium tabular-nums text-muted-foreground">
                          {card.count}
                        </span>
                      ) : null}
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="flex-1 text-sm leading-6 text-muted-foreground">
                    {card.description}
                  </p>
                  {card.note ? (
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-800">
                      <AlertCircle className="mt-0.5 size-3 shrink-0" />
                      <span>{card.note}</span>
                    </div>
                  ) : null}
                  {card.status !== "coming_soon" ? (
                    <Link
                      href={card.href}
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {card.cta}
                      <ArrowRight className="size-3" />
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">{card.cta}</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/30 p-5">
          <p className="text-sm font-semibold">Lab isolation guarantee</p>
          <p className="text-sm leading-6 text-muted-foreground">
            All master data (clinics, doctors, operations, prices, permissions) is scoped to{" "}
            <strong>{session.labName ?? "your lab"}</strong> and never shared with other labs.
            RLS policies enforce isolation at the database level on every query.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
