"use client";

import { useState } from "react";
import {
  FileText,
  Tag,
  ClipboardList,
  Printer,
  CheckCircle2,
  Settings2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Template definitions ──────────────────────────────────────────────────────

type PrintTemplate = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: "available" | "wip";
  formats: string[];
};

const TEMPLATES: PrintTemplate[] = [
  {
    id: "invoice",
    label: "Invoice",
    description: "Standard A4 invoice with line items, totals, and payment info. Sent to referring doctors.",
    icon: FileText,
    status: "available",
    formats: ["PDF", "A4", "Letter"],
  },
  {
    id: "case-summary",
    label: "Case Summary",
    description: "One-page case overview: patient, doctor, work type, stage history, and QC result.",
    icon: ClipboardList,
    status: "available",
    formats: ["PDF", "A4"],
  },
  {
    id: "barcode-label",
    label: "Barcode Label",
    description: "Case barcode label for physical tray tracking. Includes case number, patient, and due date.",
    icon: Tag,
    status: "available",
    formats: ["50×25mm", "60×30mm", "Label sheet"],
  },
  {
    id: "delivery-slip",
    label: "Delivery Slip",
    description: "Dispatch slip accompanying delivered cases. Includes clinic address and case list.",
    icon: Printer,
    status: "wip",
    formats: ["A5", "Thermal"],
  },
  {
    id: "qc-report",
    label: "QC Report",
    description: "Detailed QC inspection sheet with pass/fail, technician signature, and notes.",
    icon: CheckCircle2,
    status: "wip",
    formats: ["A4"],
  },
];

// ── Format options ────────────────────────────────────────────────────────────

const PAPER_SIZES = ["A4", "Letter", "A5", "Label sheet"];
const BARCODE_FORMATS = ["Code 128", "QR Code", "EAN-13"];

// ── Component ─────────────────────────────────────────────────────────────────

export function PrintHub() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("invoice");
  const [paperSize, setPaperSize] = useState("A4");
  const [barcodeFormat, setBarcodeFormat] = useState("Code 128");
  const [showLogo, setShowLogo] = useState(true);

  const active = TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <div className="space-y-8">

      {/* ── Template selector ──────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">
          Print templates
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map((tpl) => {
            const Icon = tpl.icon;
            const isSelected = selectedTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`text-left rounded-xl border p-4 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                      aria-hidden
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-[13px] font-semibold ${isSelected ? "text-primary" : ""}`}>
                        {tpl.label}
                      </p>
                      {tpl.status === "wip" && (
                        <Badge tone="amber" className="text-[9px] py-0 px-1.5">Beta</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {tpl.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tpl.formats.map((f) => (
                        <span key={f} className="text-[9px] font-medium bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Template settings ──────────────────────────────────────────── */}
      {active && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: options */}
          <Card>
            <CardContent className="pt-5 pb-5 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Settings2 className="size-4 text-primary" />
                <p className="text-sm font-semibold">{active.label} — Settings</p>
              </div>

              {/* Paper size */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Paper size
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAPER_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setPaperSize(size)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        paperSize === size
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barcode format (only for barcode label) */}
              {active.id === "barcode-label" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Barcode format
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BARCODE_FORMATS.map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setBarcodeFormat(fmt)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          barcodeFormat === fmt
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show logo toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Include lab logo</p>
                  <p className="text-xs text-muted-foreground">Print lab branding on the template</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showLogo}
                  onClick={() => setShowLogo((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    showLogo ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      showLogo ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Print button */}
              <Button className="w-full gap-2" disabled>
                <Printer className="size-4" />
                Preview & Print
                <Badge tone="neutral" className="ml-1 text-[9px]">Coming soon</Badge>
              </Button>
            </CardContent>
          </Card>

          {/* Right: preview placeholder */}
          <div className="rounded-xl border bg-muted/30 flex items-center justify-center min-h-[280px]">
            <div className="text-center p-8">
              <active.icon className="size-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">{active.label} preview</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px] mx-auto">
                Print preview rendering will appear here when the module is complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Info note ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card px-5 py-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">Print engine status</p>
        <p>
          Template configuration is saved per lab. The print engine (PDF generation via browser or server) will be activated once the first template goes live.
          Barcode labels support Zebra ZPL for thermal printers.
        </p>
      </div>
    </div>
  );
}
