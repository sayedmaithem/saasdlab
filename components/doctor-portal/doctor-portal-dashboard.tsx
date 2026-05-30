"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { DoctorPortalData } from "@/lib/data/doctor-portal";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Search, FileText } from "lucide-react";

// Human-readable labels for internal stage/status identifiers
const STAGE_LABELS: Record<string, string> = {
  received: "Received",
  information_check: "Info check",
  in_production: "In production",
  design: "Design",
  doctor_approval: "Awaiting approval",
  quality_check: "Quality check",
  ready_for_delivery: "Ready for delivery",
  delivered: "Delivered",
  on_hold: "On hold",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On hold",
};

function stageLabel(stage: string) {
  return STAGE_LABELS[stage] ?? stage.replaceAll("_", " ");
}
function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

// ── Not-linked placeholder ─────────────────────────────────────────────────
function NotLinked() {
  return (
    <div className="glass rounded-2xl py-16 text-center space-y-4">
      <p className="text-xl font-bold text-foreground">Portal account not linked</p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
        Your login is not yet associated with a doctor profile. Ask your lab administrator to
        link your account from the doctor edit page.
      </p>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export function DoctorPortalDashboard({ data }: { data: DoctorPortalData }) {
  if (!data.doctorId) return <NotLinked />;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Doctor portal</p>
          <h1 className="text-3xl font-bold tracking-tight text-gradient mt-1">{data.doctorName}</h1>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/doctor-portal/statement"
            className="inline-flex items-center gap-2 rounded-lg bg-background/50 border border-border px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted/50 hover:border-primary/50"
          >
            <FileText className="h-4 w-4 text-primary" />
            Statement
          </Link>
          <Link 
            href="/doctor-portal/cases/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 glow-primary"
          >
            <Plus className="h-4 w-4" />
            New case
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <motion.div 
        className="grid gap-4 md:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
      >
        {data.cards.map((card) => (
          <motion.div 
            key={card.label}
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
            }}
            className="glass rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:glow-primary"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-3">
                {card.label}
              </p>
              <p className="text-4xl font-bold tracking-tighter text-foreground mb-1">{card.value}</p>
              <p className="text-xs font-medium text-muted-foreground">{card.hint}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Cases list */}
      <div className="glass rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-border/50 flex flex-wrap items-center justify-between gap-4 bg-background/30">
          <h2 className="text-xl font-bold">My cases</h2>
          <form className="flex items-center w-full md:w-auto relative">
            <Search className="h-4 w-4 absolute left-3 text-muted-foreground pointer-events-none" />
            <Input 
              name="query" 
              placeholder="Search patient or case..." 
              className="pl-9 h-9 w-full md:w-[260px] rounded-lg border-border bg-background/50 focus-visible:ring-primary"
            />
            <button type="submit" className="hidden">Submit</button>
          </form>
        </div>
        
        <div className="p-2">
          {data.cases.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-sm font-medium text-muted-foreground">No cases yet.</p>
              <Link
                href="/doctor-portal/cases/new"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-semibold"
              >
                Submit your first case <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <motion.div 
              className="space-y-1"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
            >
              {data.cases.map((item) => (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
                  }}
                >
                  <Link
                    href={`/doctor-portal/cases/${item.id}`}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-4 hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-primary">{item.caseNumber}</span>
                        <span className="font-semibold text-foreground truncate">{item.patientName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
                        <span>{item.workType}</span>
                        {item.dueDate && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span className={new Date(item.dueDate) < new Date() ? "text-destructive font-semibold" : ""}>
                              Due {item.dueDate}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {item.missingInfoStatus === "missing" && (
                          <Badge tone="amber" className="rounded-md px-2 py-0.5 text-[10px]">Missing info</Badge>
                        )}
                        {item.currentStage === "doctor_approval" && (
                          <Badge tone="red" className="rounded-md px-2 py-0.5 text-[10px] glow-primary border-destructive/30">Approval needed</Badge>
                        )}
                        <Badge tone="blue" className="rounded-md px-2 py-0.5 text-[10px]">{stageLabel(item.currentStage)}</Badge>
                        {item.status !== "active" && (
                          <Badge tone="neutral" className="rounded-md px-2 py-0.5 text-[10px]">{statusLabel(item.status)}</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-transparent group-hover:bg-white/10 transition-colors text-muted-foreground group-hover:text-primary">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
