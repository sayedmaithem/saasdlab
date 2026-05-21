"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileStack,
  Gauge,
  UsersRound,
  Hospital,
  Boxes,
  PenTool,
  ClipboardCheck,
  BadgeDollarSign,
  WalletCards,
  Truck,
  BarChart3,
  Settings,
  LayoutDashboard,
  Package,
  TrendingUp,
  Map,
  UserCog,
  GitCommitHorizontal,
  ArrowRight,
  Command,
} from "lucide-react";

// ── Static index of searchable items ─────────────────────────────────────────

type SearchItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  category: string;
  keywords: string[];
};

const SEARCH_INDEX: SearchItem[] = [
  // Pages
  { id: "cases",      label: "Cases",            description: "All active and completed cases",      href: "/cases",                   icon: FileStack,          category: "Pages", keywords: ["case", "order", "work"] },
  { id: "cases-new",  label: "New Case",          description: "Create a new case",                  href: "/cases/new",               icon: FileStack,          category: "Actions", keywords: ["new", "create", "add"] },
  { id: "dashboard",  label: "Dashboard",         description: "Lab overview and workflow board",     href: "/dashboard",               icon: Gauge,              category: "Pages", keywords: ["home", "overview", "kpi"] },
  { id: "owner",      label: "Operations HQ",     description: "Live lab operational snapshot",      href: "/owner",                   icon: LayoutDashboard,    category: "Pages", keywords: ["owner", "ops", "hq", "operations", "snapshot"] },
  { id: "production", label: "Production Board",  description: "Stage-by-stage Kanban board",        href: "/production",              icon: Boxes,              category: "Pages", keywords: ["production", "kanban", "stage", "board"] },
  { id: "design",     label: "Design Queue",      description: "CAD design workflow queue",          href: "/design",                  icon: PenTool,            category: "Pages", keywords: ["cad", "design", "exocad", "queue"] },
  { id: "qc",         label: "Quality Control",   description: "QC inspection board",               href: "/quality-control",         icon: ClipboardCheck,     category: "Pages", keywords: ["qc", "quality", "inspect", "check"] },
  { id: "delivery",   label: "Delivery",          description: "Dispatch and delivery queue",        href: "/delivery",                icon: Truck,              category: "Pages", keywords: ["delivery", "dispatch", "ship"] },
  { id: "doctors",    label: "Doctors",           description: "Referring doctor profiles",          href: "/doctors",                 icon: UsersRound,         category: "Pages", keywords: ["doctor", "dentist", "referring"] },
  { id: "doctors-new",label: "Add Doctor",        description: "Register a new referring doctor",    href: "/doctors/new",             icon: UsersRound,         category: "Actions", keywords: ["new", "add", "doctor"] },
  { id: "clinics",    label: "Clinics",           description: "Dental clinic directory",            href: "/clinics",                 icon: Hospital,           category: "Pages", keywords: ["clinic", "practice", "location"] },
  { id: "technicians",label: "Technicians",       description: "Lab staff and workload management",  href: "/technicians",             icon: UserCog,            category: "Pages", keywords: ["tech", "staff", "employee"] },
  { id: "invoices",   label: "Invoices",          description: "Invoice management",                 href: "/invoices",                icon: BadgeDollarSign,    category: "Finance", keywords: ["invoice", "bill", "billing"] },
  { id: "invoices-new",label:"New Invoice",       description: "Create a new invoice",               href: "/invoices/new",            icon: BadgeDollarSign,    category: "Actions", keywords: ["new", "create", "invoice"] },
  { id: "payments",   label: "Payments",          description: "Record and track payments",          href: "/payments",                icon: WalletCards,        category: "Finance", keywords: ["payment", "collect", "receipt"] },
  { id: "finance",    label: "Finance Overview",  description: "Revenue, outstanding, overdue",      href: "/finance",                 icon: TrendingUp,         category: "Finance", keywords: ["finance", "revenue", "money", "overview"] },
  { id: "reports",    label: "Reports",           description: "Analytics and trends",               href: "/reports",                 icon: BarChart3,          category: "Finance", keywords: ["report", "analytics", "trend", "stats"] },
  { id: "inventory",  label: "Inventory",         description: "Materials, stock, and warehouses",   href: "/inventory",               icon: Package,            category: "Pages", keywords: ["stock", "material", "warehouse", "supply", "inventory"] },
  { id: "log",        label: "Case Movement Log", description: "Timeline of all case movements",     href: "/cases/log",               icon: GitCommitHorizontal, category: "Pages", keywords: ["log", "timeline", "movement", "history", "audit"] },
  { id: "lab-os",     label: "LabOS System Map",  description: "Full view of all system modules",   href: "/lab-os",                  icon: Map,                category: "System", keywords: ["map", "system", "overview", "modules", "os"] },
  { id: "settings",   label: "Settings",          description: "Lab configuration",                  href: "/settings",                icon: Settings,           category: "System", keywords: ["settings", "config", "setup"] },
  { id: "print",      label: "Print Hub",         description: "Invoice and case print templates",   href: "/settings/print",          icon: Settings,           category: "System", keywords: ["print", "barcode", "label", "template"] },
  { id: "command-center", label: "Command Center",description: "System health and setup",            href: "/command-center",          icon: LayoutDashboard,    category: "System", keywords: ["command", "health", "system", "setup"] },
  { id: "remakes",    label: "Remakes",           description: "Remake and revision tracker",        href: "/remakes",                 icon: ClipboardCheck,     category: "Pages", keywords: ["remake", "redo", "revision", "rework"] },
];

// ── Search logic ──────────────────────────────────────────────────────────────

function scoreMatch(item: SearchItem, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase().trim();
  const label = item.label.toLowerCase();
  const desc = item.description.toLowerCase();
  const keywords = item.keywords.join(" ");

  if (label.startsWith(q)) return 100;
  if (label.includes(q)) return 80;
  if (keywords.includes(q)) return 60;
  if (desc.includes(q)) return 40;

  // Fuzzy — every char in query must appear in order in label
  let li = 0;
  for (const c of q) {
    const idx = label.indexOf(c, li);
    if (idx === -1) return 0;
    li = idx + 1;
  }
  return 20;
}

// ── Category colors ───────────────────────────────────────────────────────────

const categoryDot: Record<string, string> = {
  Pages:   "bg-blue-500",
  Actions: "bg-primary",
  Finance: "bg-emerald-500",
  System:  "bg-violet-500",
};

// ── Main component ────────────────────────────────────────────────────────────

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter + score results
  const results = query.trim()
    ? SEARCH_INDEX
        .map((item) => ({ item, score: scoreMatch(item, query) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(({ item }) => item)
    : SEARCH_INDEX.filter((i) => i.category === "Actions").slice(0, 6);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setActiveIdx(0);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Arrow nav + Enter
  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const item = results[activeIdx];
      if (item) navigate(item.href);
    }
  }


  return (
    <>
      {/* ── Trigger button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => { setOpen(true); setQuery(""); setActiveIdx(0); }}
        className="hidden md:flex h-9 items-center gap-2 rounded-lg border bg-muted/40 px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Open command search"
      >
        <Search className="size-3.5 shrink-0" aria-hidden />
        <span className="text-xs">Search</span>
        <kbd className="ml-1 inline-flex h-5 items-center gap-0.5 rounded border bg-background px-1 font-mono text-[10px] text-muted-foreground">
          <Command className="size-2.5" />K
        </kbd>
      </button>

      {/* ── Trigger (mobile icon only) ───────────────────────────────────── */}
      <button
        type="button"
        onClick={() => { setOpen(true); setQuery(""); setActiveIdx(0); }}
        className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Search"
      >
        <Search className="size-4" />
      </button>

      {/* ── Command panel ────────────────────────────────────────────────── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="cmd-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className="cmd-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Search commands and pages"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 border-b px-4 py-3.5">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                ref={inputRef}
                className="cmd-input flex-1"
                placeholder="Search cases, doctors, pages, actions…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
                onKeyDown={onInputKey}
                autoComplete="off"
                spellCheck={false}
              />
              <kbd
                className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-[10px] text-muted-foreground cursor-pointer"
                onClick={() => setOpen(false)}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[360px] overflow-y-auto py-2 px-2">
              {results.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </div>
              ) : (
                <>
                  {!query && (
                    <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Quick actions
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {results.map((item, idx) => {
                      const Icon = item.icon;
                      const dot = categoryDot[item.category] ?? "bg-muted-foreground";
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-active={idx === activeIdx}
                          className="cmd-result-item w-full text-left"
                          onClick={() => navigate(item.href)}
                          onMouseEnter={() => setActiveIdx(idx)}
                        >
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Icon className="cmd-result-icon size-3.5 text-muted-foreground" aria-hidden />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-[13px]">{item.label}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`size-1.5 rounded-full ${dot}`} />
                            <span className="text-[10px] text-muted-foreground">{item.category}</span>
                            <ArrowRight className="size-3 text-muted-foreground/50" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t px-4 py-2 flex items-center gap-4">
              <span className="text-[10px] text-muted-foreground">
                <kbd className="rounded border bg-muted px-1 font-mono text-[9px]">↑↓</kbd>{" "}
                Navigate
              </span>
              <span className="text-[10px] text-muted-foreground">
                <kbd className="rounded border bg-muted px-1 font-mono text-[9px]">⏎</kbd>{" "}
                Open
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                ⌘K to toggle
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
