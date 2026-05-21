export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  FileStack,
  FlaskConical,
  PackageCheck,
  TrendingUp,
  Users,
  Tag,
  ClipboardCheck,
  Truck,
  Settings2,
  BarChart3,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/lib/auth/session";
import { canUsePreviewAuth } from "@/lib/env";
import {
  getOwnerOperationalSnapshot,
  getOwnerOverdueCases,
  getOwnerOperationalInsights,
  getPilotReadinessData,
} from "@/lib/data/owner";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { InsightCard } from "@/components/ui/insight-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/finance/money";
import { CheckCircle2, XCircle } from "lucide-react";
import { LabPulseBriefing } from "@/components/owner/lab-pulse-briefing";

export default async function OwnerPage() {
  const session = await requireAuth();
  const isPreview = canUsePreviewAuth();

  const [snapshot, overdueCases, insights, pilotReadiness] = await Promise.all([
    getOwnerOperationalSnapshot(session),
    getOwnerOverdueCases(session, 5),
    getOwnerOperationalInsights(session),
    getPilotReadinessData(session),
  ]);

  const hasOverdue = snapshot.overdueCasesCount > 0;
  const hasOverdueInvoices = snapshot.overdueInvoicesCount > 0;
  const hasOutstanding = snapshot.totalOutstanding > 0;
  const hasMissingTechnician = insights.casesMissingTechnicianCount > 0;
  const hasMissingPrice = insights.casesMissingPriceCount > 0;
  const hasWaitingApproval = insights.casesWaitingApprovalCount > 0;
  const hasWaitingQC = insights.casesWaitingQCCount > 0;
  const hasReadyForDelivery = insights.casesReadyForDeliveryCount > 0;
  const workflowConfigured = insights.workflowConfigured;
  const workflowNotConfigured = workflowConfigured === false;
  const transitionsNotConfigured = insights.transitionsConfigured === false;
  const techPermsNotConfigured = insights.techPermissionsConfigured === false;

  return (
    <AppShell
      labName={session.labName ?? "LabFlow"}
      session={session}
      activeHref="/owner"
      eyebrow="Operations HQ"
      title={`${session.labName ?? "Lab"} Overview`}
      cloudStatus={isPreview ? "preview" : "connected"}
    >
      <PageShell maxWidth="2xl">

        {/* ── Lab Pulse Briefing ───────────────────────────────── */}
        <LabPulseBriefing
          labName={session.labName ?? "Lab"}
          activeCases={snapshot.activeCasesCount}
          overdueCases={snapshot.overdueCasesCount}
          casesToday={snapshot.casesTodayCount}
          missingTechnician={insights.casesMissingTechnicianCount}
          waitingApproval={insights.casesWaitingApprovalCount}
          waitingQC={insights.casesWaitingQCCount}
          readyForDelivery={insights.casesReadyForDeliveryCount}
        />

        {/* ── Operational KPIs ─────────────────────────────────── */}
        <SectionHeader
          title="Live snapshot"
          description="Real-time operational status of your lab right now."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Active cases */}
          <Link href="/cases">
            <Card className="hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                    <FileStack className="size-5 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Active cases
                    </p>
                    <p className="stat-xl mt-1">
                      {snapshot.activeCasesCount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">In production</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Overdue cases */}
          <Link href="/cases?overdue=true">
          <Card className={`transition-colors cursor-pointer hover:border-primary/40 ${hasOverdue ? "border-red-200 dark:border-red-900" : ""}`}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
                    hasOverdue
                      ? "bg-red-100 dark:bg-red-900/30"
                      : "bg-muted"
                  }`}
                >
                  <AlertCircle
                    className={`size-5 ${
                      hasOverdue
                        ? "text-red-700 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Overdue cases
                  </p>
                  <p className={`stat-xl mt-1 ${hasOverdue ? "text-red-700 dark:text-red-400" : ""}`}>
                    {snapshot.overdueCasesCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hasOverdue ? "Past due date" : "All on track"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>

          {/* Due today */}
          <Link href="/cases">
          <Card className="hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                  <Calendar className="size-5 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Due today
                  </p>
                  <p className="stat-xl mt-1">
                    {snapshot.casesTodayCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Require delivery today
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>

          {/* Outstanding balance */}
          <Link href="/invoices">
          <Card className="hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                  <DollarSign className="size-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Outstanding
                  </p>
                  <p className="stat-xl mt-1">
                    {formatMoney(snapshot.totalOutstanding)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Unpaid invoice balance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
        </div>

        {/* ── Secondary KPI row ────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {/* Missing technician */}
          <Card className={hasMissingTechnician ? "border-amber-200 dark:border-amber-900" : ""}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
                    hasMissingTechnician ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
                  }`}
                >
                  <Users
                    className={`size-4 ${
                      hasMissingTechnician
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    No technician
                  </p>
                  <p
                    className={`mt-0.5 stat-lg ${
                      hasMissingTechnician ? "text-amber-700 dark:text-amber-400" : ""
                    }`}
                  >
                    {insights.casesMissingTechnicianCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Active cases unassigned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Missing price */}
          <Card className={hasMissingPrice ? "border-amber-200 dark:border-amber-900" : ""}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
                    hasMissingPrice ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
                  }`}
                >
                  <Tag
                    className={`size-4 ${
                      hasMissingPrice
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    No price set
                  </p>
                  <p
                    className={`mt-0.5 stat-lg ${
                      hasMissingPrice ? "text-amber-700 dark:text-amber-400" : ""
                    }`}
                  >
                    {insights.casesMissingPriceCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Cases missing total price</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waiting doctor approval */}
          <Card className={hasWaitingApproval ? "border-blue-200 dark:border-blue-900" : ""}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
                    hasWaitingApproval ? "bg-blue-100 dark:bg-blue-900/30" : "bg-muted"
                  }`}
                >
                  <ClipboardCheck
                    className={`size-4 ${
                      hasWaitingApproval
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Awaiting approval
                  </p>
                  <p
                    className={`mt-0.5 stat-lg ${
                      hasWaitingApproval ? "text-blue-700 dark:text-blue-400" : ""
                    }`}
                  >
                    {insights.casesWaitingApprovalCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Doctor sign-off pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waiting QC */}
          <Link href="/quality-control">
          <Card className={`transition-colors cursor-pointer hover:border-primary/40 ${hasWaitingQC ? "border-purple-200 dark:border-purple-900" : ""}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
                    hasWaitingQC ? "bg-purple-100 dark:bg-purple-900/30" : "bg-muted"
                  }`}
                >
                  <FlaskConical
                    className={`size-4 ${
                      hasWaitingQC ? "text-purple-700 dark:text-purple-400" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    In QC
                  </p>
                  <p className={`mt-0.5 stat-lg ${hasWaitingQC ? "text-purple-700 dark:text-purple-400" : ""}`}>
                    {insights.casesWaitingQCCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Awaiting quality check</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>

          {/* Ready for delivery */}
          <Link href="/delivery">
          <Card className={`transition-colors cursor-pointer hover:border-primary/40 ${hasReadyForDelivery ? "border-emerald-200 dark:border-emerald-900" : ""}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
                    hasReadyForDelivery ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted"
                  }`}
                >
                  <PackageCheck
                    className={`size-4 ${
                      hasReadyForDelivery ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Ready
                  </p>
                  <p className={`mt-0.5 stat-lg ${hasReadyForDelivery ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
                    {insights.casesReadyForDeliveryCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Ready for delivery</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
        </div>

        {/* ── Recommended actions ──────────────────────────────── */}
        <SectionHeader
          title="Recommended actions"
          description="Items that need your attention right now."
        />

        <div className="space-y-3">
          {!hasOverdue && !hasOverdueInvoices && !hasOutstanding &&
           !hasMissingTechnician && !hasMissingPrice && !hasWaitingApproval && (
            <InsightCard
              tone="success"
              title="Lab is running clean"
              description="No overdue cases, no outstanding balances, all cases priced and assigned. Everything is on track."
            />
          )}

          {hasOverdue && (
            <InsightCard
              tone="critical"
              title={`${snapshot.overdueCasesCount} overdue case${snapshot.overdueCasesCount > 1 ? "s" : ""} — action required`}
              description="These cases have passed their due date and are still in production. Contact the responsible technicians."
              action={{ label: "View overdue cases", href: "/cases?overdue=true" }}
            />
          )}

          {snapshot.casesTodayCount > 0 && (
            <InsightCard
              tone="warning"
              title={`${snapshot.casesTodayCount} case${snapshot.casesTodayCount > 1 ? "s" : ""} due today`}
              description="These cases must be completed and prepared for delivery by end of day."
              action={{ label: "View today's cases", href: `/cases?due_date=${new Date().toISOString().slice(0, 10)}` }}
            />
          )}

          {hasMissingTechnician && (
            <InsightCard
              tone="warning"
              title={`${insights.casesMissingTechnicianCount} case${insights.casesMissingTechnicianCount > 1 ? "s" : ""} without a technician`}
              description="Active cases with no assigned technician will stall production. Assign from the production board."
              action={{ label: "Open production board", href: "/production" }}
            />
          )}

          {hasMissingPrice && (
            <InsightCard
              tone="warning"
              title={`${insights.casesMissingPriceCount} case${insights.casesMissingPriceCount > 1 ? "s" : ""} missing a price`}
              description="Cases without a total price cannot be invoiced. Set pricing before the case reaches delivery."
              action={{ label: "View all cases", href: "/cases" }}
            />
          )}

          {hasWaitingApproval && (
            <InsightCard
              tone="info"
              title={`${insights.casesWaitingApprovalCount} case${insights.casesWaitingApprovalCount > 1 ? "s" : ""} waiting for doctor approval`}
              description="Cases are paused at the doctor approval gate. Follow up with the referring doctor."
              action={{ label: "View cases", href: "/cases?stage=doctor_approval" }}
            />
          )}

          {hasOverdueInvoices && (
            <InsightCard
              tone="warning"
              title={`${snapshot.overdueInvoicesCount} overdue invoice${snapshot.overdueInvoicesCount > 1 ? "s" : ""}`}
              description="Follow up with doctors who have invoices past their payment due date."
              action={{ label: "View overdue invoices", href: "/invoices?status=overdue" }}
            />
          )}

          {hasOutstanding && !hasOverdueInvoices && (
            <InsightCard
              tone="info"
              title={`${formatMoney(snapshot.totalOutstanding)} in outstanding invoices`}
              description="Open invoice balances across all doctors. No invoices are overdue yet."
              action={{ label: "View invoices", href: "/invoices" }}
            />
          )}

          {hasWaitingQC && (
            <InsightCard
              tone="warning"
              title={`${insights.casesWaitingQCCount} case${insights.casesWaitingQCCount > 1 ? "s" : ""} waiting quality check`}
              description="Cases are at the quality control stage. Pass or fail each one before they can move to delivery."
              action={{ label: "Open QC queue", href: "/quality-control" }}
            />
          )}

          {hasReadyForDelivery && (
            <InsightCard
              tone="info"
              title={`${insights.casesReadyForDeliveryCount} case${insights.casesReadyForDeliveryCount > 1 ? "s" : ""} ready for delivery`}
              description="Cases have passed QC and are waiting to be dispatched to the referring doctor or clinic."
              action={{ label: "Open delivery queue", href: "/delivery" }}
            />
          )}

          {workflowNotConfigured && !isPreview && (
            <InsightCard
              tone="info"
              title="No custom workflow configured"
              description="Your lab is running on the default fixed 18-stage enum. Configure a custom workflow in Master Data to enable per-stage role gates, transition rules, and stage requirements."
              action={{ label: "Configure workflow", href: "/command-center/master-data/workflows" }}
            />
          )}

          {!workflowNotConfigured && transitionsNotConfigured && !isPreview && (
            <InsightCard
              tone="info"
              title="Workflow configured but no transitions defined"
              description="A workflow template exists but no stage transitions are configured. Seed the standard workflow or define transitions manually to activate the workflow engine."
              action={{ label: "Configure transitions", href: "/command-center/master-data/workflows" }}
            />
          )}

          {techPermsNotConfigured && !isPreview && (
            <InsightCard
              tone="info"
              title="Technician stage permissions not configured"
              description="Technicians can move cases to any stage. Configure per-technician stage permissions in the Workflow Engine to restrict which stages each technician can access."
              action={{ label: "Configure stage permissions", href: "/command-center/master-data/technician-stage-permissions" }}
            />
          )}

          {isPreview && (
            <InsightCard
              tone="info"
              title="Preview mode — showing placeholder data"
              description="Connect Supabase to see real case counts, overdue warnings, and outstanding balances for your lab."
            />
          )}
        </div>

        {/* ── Stage bottlenecks ────────────────────────────────── */}
        {insights.bottlenecksByStage.length > 0 && (
          <>
            <SectionHeader
              title="Stage bottlenecks"
              description="Active case concentration by stage — highest load first."
              actions={
                <Link
                  href="/production"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open board <ArrowRight className="size-3" />
                </Link>
              }
            />

            <Card>
              <CardContent className="pt-4 pb-2">
                <div className="space-y-1">
                  {insights.bottlenecksByStage.map((item, idx) => {
                    const maxCount = insights.bottlenecksByStage[0]?.count ?? 1;
                    const pct = Math.round((item.count / maxCount) * 100);
                    const isTop = idx === 0 && item.count >= 2;
                    return (
                      <div key={item.stage} className="flex items-center gap-3 py-1.5">
                        <span className="w-40 shrink-0 text-sm font-medium capitalize">
                          {item.label}
                        </span>
                        <div className="flex-1 overflow-hidden rounded-full bg-muted h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isTop ? "bg-amber-500" : "bg-blue-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <Badge tone={isTop ? "amber" : "neutral"} className="w-16 justify-center">
                          {item.count} case{item.count === 1 ? "" : "s"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Overdue cases table ──────────────────────────────── */}
        {overdueCases.length > 0 && (
          <>
            <SectionHeader
              title="Overdue cases"
              description="Sorted oldest-first. Resolve the most critical first."
              actions={
                <Link
                  href="/cases?overdue=true"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  All overdue <ArrowRight className="size-3" />
                </Link>
              }
            />

            <Card>
              <CardContent className="pt-4 pb-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[540px]">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="py-2 pr-4 text-left font-medium">Case</th>
                        <th className="py-2 pr-4 text-left font-medium">Patient</th>
                        <th className="py-2 pr-4 text-left font-medium">Doctor</th>
                        <th className="py-2 pr-4 text-left font-medium">Stage</th>
                        <th className="py-2 text-left font-medium">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueCases.map((c) => {
                        return (
                          <tr key={c.id} className="border-b last:border-0">
                            <td className="py-2.5 pr-4">
                              <Link
                                href={`/cases/${c.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {c.caseNumber}
                              </Link>
                            </td>
                            <td className="py-2.5 pr-4 text-muted-foreground">
                              {c.patientName}
                            </td>
                            <td className="py-2.5 pr-4 text-muted-foreground">
                              {c.doctorName}
                            </td>
                            <td className="py-2.5 pr-4">
                              <Badge tone="neutral">
                                {c.currentStage.replaceAll("_", " ")}
                              </Badge>
                            </td>
                            <td className="py-2.5">
                              <span className="font-medium text-red-700 dark:text-red-400">
                                {c.dueDate}
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({c.daysOverdue}d ago)
                                </span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Pilot Readiness ──────────────────────────────────── */}
        {!isPreview && (
          <>
            <SectionHeader
              title="Lab setup readiness"
              description={
                pilotReadiness.allReady
                  ? "All setup checks passing. Your lab is ready for live production use."
                  : `${pilotReadiness.passCount} of ${pilotReadiness.totalCount} setup checks complete.`
              }
            />
            <Card className={pilotReadiness.allReady ? "border-emerald-200 dark:border-emerald-800" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    [
                      {
                        key: "workflowConfigured",
                        label: "Workflow configured",
                        passing: pilotReadiness.workflowConfigured,
                        href: "/command-center/master-data/workflows",
                        hint: "Seed or create a workflow template",
                      },
                      {
                        key: "techniciansExist",
                        label: "Technicians on file",
                        passing: pilotReadiness.techniciansExist,
                        href: "/technicians",
                        hint: "Add at least one technician",
                      },
                      {
                        key: "doctorsExist",
                        label: "Doctors registered",
                        passing: pilotReadiness.doctorsExist,
                        href: "/doctors",
                        hint: "Add at least one referring doctor",
                      },
                      {
                        key: "operationsExist",
                        label: "Operations catalog",
                        passing: pilotReadiness.operationsExist,
                        href: "/command-center/master-data/operations",
                        hint: "Add lab operations to the catalog",
                      },
                      {
                        key: "activeCasesExist",
                        label: "First case created",
                        passing: pilotReadiness.activeCasesExist,
                        href: "/cases/new",
                        hint: "Create your first active case",
                      },
                    ] as const
                  ).map((check) => (
                    <div
                      key={check.key}
                      className="flex items-start gap-2.5 rounded-md border bg-muted/20 px-3 py-2.5"
                    >
                      {check.passing ? (
                        <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                      ) : (
                        <XCircle className="size-4 shrink-0 mt-0.5 text-amber-500" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${check.passing ? "" : "text-muted-foreground"}`}>
                          {check.label}
                        </p>
                        {!check.passing && (
                          <a
                            href={check.href}
                            className="text-xs text-primary hover:underline"
                          >
                            {check.hint} →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Quick navigation ─────────────────────────────────── */}
        <SectionHeader title="Quick access" sub />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Production board", href: "/production", icon: TrendingUp, description: "Stage-by-stage Kanban" },
            { label: "Quality control", href: "/quality-control", icon: ClipboardCheck, description: "Inspect & pass cases" },
            { label: "Delivery queue", href: "/delivery", icon: Truck, description: "Dispatch & track" },
            { label: "All cases", href: "/cases", icon: FileStack, description: "Full case list" },
            { label: "Technicians", href: "/technicians", icon: Users, description: "Staff & workloads" },
            { label: "Finance", href: "/invoices", icon: DollarSign, description: "Invoices & payments" },
            { label: "Reports", href: "/reports", icon: BarChart3, description: "Analytics & trends" },
            { label: "Master data", href: "/command-center/master-data", icon: Settings2, description: "Catalog & workflows" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                      <item.icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground shrink-0 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

      </PageShell>
    </AppShell>
  );
}
