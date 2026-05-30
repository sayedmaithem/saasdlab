"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { stageLabels, productionStages } from "@/lib/constants/workflow";
import type { CaseListItem } from "@/lib/data/cases";
import { motion } from "framer-motion";
import { Filter, ArrowRight } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  waiting_doctor_info: "Waiting info",
  waiting_approval: "Awaiting approval",
  completed: "Completed",
  cancelled: "Cancelled",
  on_hold: "On hold",
};

const STATUS_TONE: Record<string, "amber" | "green" | "red" | "neutral"> = {
  active: "green",
  waiting_doctor_info: "amber",
  waiting_approval: "amber",
  completed: "neutral",
  cancelled: "red",
  on_hold: "neutral",
};

function dueTone(item: CaseListItem) {
  if (item.isOverdue) return "text-destructive";
  if (!item.dueDate) return "text-muted-foreground";
  const days = Math.ceil(
    (new Date(`${item.dueDate}T00:00:00`).getTime() - Date.now()) / 86_400_000,
  );
  return days <= 2 ? "text-warning" : "text-muted-foreground";
}

export function CasesTable({
  cases,
  doctors,
  filters,
}: {
  cases: CaseListItem[];
  doctors: Array<{ id: string; name: string }>;
  filters: Record<string, string | undefined>;
}) {
  return (
    <div className="space-y-6">
      <form className="glass rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
        </div>
        <div className="h-4 w-px bg-border mx-2 hidden sm:block" />
        <input
          className="h-9 rounded-lg border border-border bg-background/50 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[180px] flex-1"
          name="q"
          placeholder="Case, doctor, patient..."
          defaultValue={filters.q}
        />
        <select
          className="h-9 rounded-lg border border-border bg-background/50 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          name="status"
          defaultValue={filters.status}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="waiting_doctor_info">Waiting info</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="h-9 rounded-lg border border-border bg-background/50 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          name="stage"
          defaultValue={filters.stage}
        >
          <option value="">All stages</option>
          {productionStages.map((stage) => (
            <option key={stage} value={stage}>
              {stageLabels[stage]}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-lg border border-border bg-background/50 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          name="doctor"
          defaultValue={filters.doctor}
        >
          <option value="">All doctors</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm font-medium px-2 cursor-pointer">
          <input name="overdue" type="checkbox" defaultChecked={filters.overdue === "true"} className="rounded border-border text-primary focus:ring-primary accent-primary" />
          Overdue
        </label>
        <label className="flex items-center gap-2 text-sm font-medium px-2 cursor-pointer">
          <input name="urgent" type="checkbox" defaultChecked={filters.urgent === "true"} className="rounded border-border text-primary focus:ring-primary accent-primary" />
          Urgent
        </label>
        <button type="submit" className="h-9 px-4 rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors ml-auto">
          Apply
        </button>
      </form>

      {cases.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center space-y-4">
          <p className="text-lg font-semibold text-foreground">No cases found</p>
          <p className="text-sm text-muted-foreground">
            {Object.values(filters).some(Boolean)
              ? "Try clearing the filters above."
              : "No cases have been created yet. Submit the first case to get started."}
          </p>
          {!Object.values(filters).some(Boolean) && (
            <Link href="/cases/new" className="inline-block mt-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              Create first case →
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm text-left">
              <thead className="border-b border-border bg-background/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Case</th>
                  <th className="px-6 py-4 font-semibold">Doctor / Patient</th>
                  <th className="px-6 py-4 font-semibold">Work</th>
                  <th className="px-6 py-4 font-semibold">Stage</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Due</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <motion.tbody 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                }}
              >
                {cases.map((item) => (
                  <motion.tr 
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.4 } }
                    }}
                    key={item.id} 
                    className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <Link href={`/cases/${item.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">
                          {item.caseNumber}
                        </Link>
                        {item.isUrgent && <Badge tone="red" className="text-[10px] py-0 px-1.5 h-5 rounded-md">URGENT</Badge>}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Priority:</span> {item.priorityScore}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="font-medium">{item.doctorName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{item.patientName}</div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="text-sm truncate max-w-[200px]">{item.workType}</div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="inline-flex items-center px-2 py-1 rounded-md bg-info/10 text-info text-xs font-medium border border-info/20">
                        {stageLabels[item.currentStage as keyof typeof stageLabels] ?? item.currentStage.replaceAll("_", " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <Badge tone={STATUS_TONE[item.status] ?? "neutral"} className="rounded-md">
                        {STATUS_LABELS[item.status] ?? item.status.replaceAll("_", " ")}
                      </Badge>
                    </td>
                    <td className={`px-6 py-4 align-middle text-xs font-medium ${dueTone(item)}`}>
                      {item.dueDate ?? "Not set"}
                      {item.isOverdue && <span className="block mt-0.5 text-[10px] uppercase font-bold text-destructive">Overdue</span>}
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <Link href={`/cases/${item.id}`} className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-primary">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
