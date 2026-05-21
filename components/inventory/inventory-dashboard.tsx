"use client";

import {
  Package,
  Boxes,
  FlaskConical,
  Wrench,
  AlertTriangle,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── Static category definitions ───────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "materials",
    label: "Materials",
    icon: FlaskConical,
    description: "Zirconia, PMMA, wax, plaster, resin",
    color: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-700 dark:text-blue-400",
    count: null,
  },
  {
    id: "consumables",
    label: "Consumables",
    icon: Package,
    description: "Polishing discs, sandpaper, gloves, masks",
    color: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-700 dark:text-violet-400",
    count: null,
  },
  {
    id: "equipment",
    label: "Equipment",
    icon: Wrench,
    description: "Milling machines, furnaces, scanners",
    color: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-700 dark:text-amber-400",
    count: null,
  },
  {
    id: "packaging",
    label: "Packaging",
    icon: Boxes,
    description: "Boxes, labels, protective wrapping",
    color: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-700 dark:text-emerald-400",
    count: null,
  },
];

// ── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id: "stock-in",  label: "Stock In",   description: "Record received materials",     icon: ArrowDownToLine, tone: "primary" as const },
  { id: "stock-out", label: "Stock Out",  description: "Record used or consumed items", icon: ArrowUpFromLine,  tone: "neutral" as const },
  { id: "new-item",  label: "New Item",   description: "Define a new stock item",       icon: Plus,             tone: "neutral" as const },
  { id: "low-stock", label: "Low Stock",  description: "View items below minimum",      icon: TrendingDown,     tone: "amber" as const },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function InventoryDashboard() {
  return (
    <div className="space-y-8">

      {/* ── Coming soon banner ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/20 px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Inventory module is expanding</p>
          <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
            The full inventory engine — item tracking, stock levels, reorder alerts, warehouse management, and supplier linking — is arriving in the next sprint.
            The structure below reflects the planned layout.
          </p>
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total items",       value: "—", sub: "Stock definitions" },
          { label: "Low stock alerts",  value: "—", sub: "Below minimum level" },
          { label: "Stock movements",   value: "—", sub: "This month" },
          { label: "Warehouses",        value: "—", sub: "Storage locations" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
              <p className="stat-xl mt-1 text-muted-foreground/50">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Quick actions ──────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                disabled
                className="gap-2"
              >
                <Icon className="size-3.5" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* ── Categories ────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">Stock categories</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="rounded-xl border bg-card p-4 opacity-60">
                <div className={`flex size-9 items-center justify-center rounded-lg ${cat.color} mb-3`}>
                  <Icon className={`size-4 ${cat.iconColor}`} />
                </div>
                <p className="text-sm font-semibold">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{cat.description}</p>
                <div className="mt-3 pt-2 border-t">
                  <Badge tone="neutral">0 items</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Warehouses placeholder ──────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">Warehouses / locations</p>
        <div className="rounded-lg border border-dashed bg-muted/20 py-12 text-center">
          <Package className="size-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No warehouses configured yet</p>
          <p className="mt-1 text-xs text-muted-foreground/70 max-w-xs mx-auto">
            Add storage locations (lab room, storage cabinet, external supplier) to start tracking where stock is held.
          </p>
          <Button variant="outline" size="sm" className="mt-4" disabled>
            <Plus className="size-3.5" />
            Add warehouse
          </Button>
        </div>
      </div>

      {/* ── Materials cross-link ────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card px-5 py-4 flex items-center gap-4">
        <FlaskConical className="size-5 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Materials catalog is in Master Data</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operation materials (zirconia, PMMA, etc.) are defined in the catalog. Inventory will link to these definitions.
          </p>
        </div>
        <a href="/command-center/master-data/materials" className="text-xs text-primary hover:underline font-medium shrink-0">
          View catalog →
        </a>
      </div>

    </div>
  );
}
