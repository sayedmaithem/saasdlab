# LabFlow Staff Workspaces 2.0 — Executive Audit

**Branch:** `phase-15-staff-workspaces-2-audit`  
**Audit Date:** 2026-05-19  
**Audit Scope:** All staff/workflow routes, data layers, components, role boundaries, missing systems  
**Model Reasoning:** Opus-level architecture synthesis  
**War Room Panel:** Principal Engineering Director · Product Design Director · Financial Systems Architect · RLS Security Lead · Lab Operations Strategist · Enterprise SaaS CTO · QA Commander

---

## 1. Executive Summary

LabFlow has **14 deployed route zones**, **8 defined roles**, **18 SQL migrations**, and a functioning Supabase/RLS multi-tenant backend. The foundation is real. The problems are structural.

**The system is split into two incompatible identities:**

- **Developer Console** — The Command Center reads from hardcoded constant arrays. Its security score, readiness score, launch checklist, and system tasks are all computed from static TypeScript files, not live database state. It is operationally useless for running a lab.

- **Real Lab Operations** — Cases, production, invoices, delivery, and QC all read from live Supabase queries scoped to `session.activeLabId`. These work. But they lack priority intelligence, automation, and proper per-role workspace design.

**The most dangerous structural gap:** Technicians — the most frequent daily users — have no dedicated landing page. They are routed to `/technicians` which shows a management view of ALL lab technicians. Their workspace (`/technicians/workspace`) exists but is absent from sidebar navigation and requires manual URL discovery. This is the single highest-impact fix available.

**The second systemic gap:** No notification system exists anywhere. Stage changes, overdue cases, QC failures, and delivery events produce zero external signals. Lab staff must manually refresh pages to discover state changes.

**The third structural gap:** All case lists and the production board load unbounded result sets from Supabase. No pagination, no cursor-based fetching, no `limit/offset`. This will fail at scale.

---

## 2. Staff Routes Inventory

### 2.1 Core Operations

#### `/cases` — Case List
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, lab_manager, reception, technician, doctor |
| **Purpose** | Intake register. Full-lab case list with filtering. |
| **Data** | `getCaseList()` → real Supabase query scoped to `activeLabId` |
| **Actions** | Filter by status/stage/doctor/overdue/urgent. Link to new case. |
| **Assessment** | ✅ **Functional** — real data, proper filters, role-gated create button |
| **Issues** | ⚠️ No pagination. All cases loaded at once. Doctor role sees entire lab case list (not just their own). |
| **Missing backend** | Pagination (limit/offset or cursor). Doctor-scoped RLS for the staff case list. |
| **Security** | RLS enforces `lab_id`. Doctor role must NOT see cases from other doctors at the `/cases` staff route. Currently they can. |

#### `/cases/new` — New Case Form
| Property | Value |
|---|---|
| **Roles** | Inherits from `/cases` guard. Create button is `canManageCases()`-gated. |
| **Purpose** | Reception-facing case intake form. |
| **Data** | `getCaseFormOptions()` → doctors, clinics, operations, materials from lab catalog |
| **Actions** | Creates a new case with full form (patient, doctor, clinic, work type, material, shade, due date, tooth chart, notes) |
| **Assessment** | ✅ **Functional** — integrates lab catalog, missing info engine |
| **Issues** | Sidebar info card still says "Next TODO" about file upload — developer note left in production UI. |
| **Missing backend** | Signed upload flow for intake files at creation time. |

#### `/cases/[id]` — Case Detail
| Property | Value |
|---|---|
| **Roles** | `/cases` guard (super_admin, lab_owner, lab_manager, reception, technician, doctor) |
| **Purpose** | The richest route in the system. Full case view: info, files, design versions, comments, QC, remake, timeline |
| **Data** | `getCaseDetail()` — 8+ parallel Supabase queries in one call |
| **Actions** | Upload files, submit design version, approve/reject design, create QC check, log remake, write comments, move stage |
| **Assessment** | ✅ **Most complete route** — real data, real actions, real permissions |
| **Issues** | ⚠️ No explicit page for doctor-initiated stage review. Technician sees same view as lab owner. Finance section shown to non-finance roles if `canViewFinancials` is not carefully threaded. |
| **Security** | `canViewFinance` prop correctly gates financial content. |

#### `/cases/[id]/summary` — Case Summary Sheet
| Property | Value |
|---|---|
| **Roles** | `/cases` guard |
| **Purpose** | Print-ready case sheet for physical lab handoff |
| **Data** | `getCaseSummaryData()` — cases, case_items, case_timeline |
| **Actions** | Print via `window.print()`. Back navigation. |
| **Assessment** | ✅ **Good** — serves a real operational need (physical lab tracking) |
| **Issues** | Timeline shows raw `actor_id` UUID instead of actor name due to no profile join |

---

#### `/production` — Production Board
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, lab_manager, technician |
| **Purpose** | Kanban board: 15 stages × N cases. Drag cases between stages. Assign technicians. |
| **Data** | `getProductionBoardData()` — all non-completed cases grouped by stage |
| **Actions** | `moveCaseStageAction`, `assignTechnicianAction` — server actions with role checks |
| **Assessment** | ⚠️ **Functional but MVP** — drag-and-drop works, data is real |
| **Issues** | 1. No virtualization — loads ALL cases into the browser. 2. No stage time tracking displayed. 3. Skill matching is cosmetic (just a label "Skill match" / "General fit") with no enforced routing. 4. 18-stage board renders 15 visible columns — overwhelming for staff. |
| **Missing backend** | Stage time tracking (when did case enter each stage). Capacity-aware assignment. |
| **Performance** | 🔴 **Critical** — no pagination or row limit. Will OOM the browser at scale. |

#### `/technicians` — Technician Management List
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, lab_manager, **technician** |
| **Purpose** | Admin view of all lab technicians. Edit, new, link to workspace. |
| **Data** | `getTechnicians()` — real data |
| **Actions** | Navigate to edit, navigate to new, navigate to workspace |
| **Assessment** | 🔴 **Role mismatch** — technician role sees the management list of ALL technicians. This is wrong. A technician should NOT see their colleagues' skills, rates, or portal account status. |
| **Security** | ⚠️ **Moderate risk** — technicians see full roster including skill and status of every other technician |
| **Fix** | Technician role must redirect from `/technicians` to `/technicians/workspace` |

#### `/technicians/[id]/edit` — Technician Editor
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, lab_manager only (enforced via `canManage` check in component) |
| **Purpose** | Edit technician profile: display name, phone, status, skills, portal account, stage matrix |
| **Data** | Full technician record + portal account status + skill list |
| **Actions** | Update profile, grant/revoke stage permissions, link portal account |
| **Assessment** | ✅ **Good** — rich editing surface, TechnicianMatrix is implemented |
| **Issues** | `technician_profiles_ext` table (migration 0018) not yet joined here — hire date, hourly rate, daily capacity not surfaced |

#### `/technicians/workspace` — Technician Personal Workspace
| Property | Value |
|---|---|
| **Roles** | `/technicians` guard — technician accessible |
| **Purpose** | Personal daily workspace: my assigned cases, start/complete stages, log problems |
| **Data** | `getTechnicianWorkspaceData()` — finds technician record linked to current user's profile, pulls assigned cases |
| **Actions** | `startStageAction`, `completeStageAction`, `addProductionProblemAction` |
| **Assessment** | ⚠️ **Exists but buried** — solid data layer, working actions, but not in sidebar navigation for technician role |
| **Critical issue** | 🔴 `/technicians/workspace` is **NOT in the sidebar navigation**. Technicians must manually type the URL or click a management-page link. This is a daily-use route for the most frequent user type. |
| **Missing backend** | No priority queue ordering for technician's cases. No daily capacity display (minutes used vs. available). No notification when new case is assigned. |

---

#### `/quality-control` — QC Queue
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, lab_manager, technician |
| **Purpose** | List of cases at QC stage awaiting inspection |
| **Data** | `getQualityControlData()` — real data |
| **Actions** | None — this is a read-only list. QC actions exist only inside `/cases/[id]` |
| **Assessment** | ⚠️ **Primitive** — acts as a pointer board, not a workspace. No action can be taken here. |
| **UX problem** | Staff must click to a case, navigate to the QC section, and submit the form there. The QC board is an index with no action affordance. |
| **Recommendation** | Merge QC action inline (open a sheet/dialog) OR add direct "Pass / Fail" action buttons that submit from the queue. |

#### `/remakes` — Remake Tracker
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, lab_manager, reception, accountant |
| **Purpose** | Filtered list of all remake records with analytics (reason, responsibility, cost) |
| **Data** | `getRemakesData()` — real Supabase data |
| **Actions** | Filter by doctor/responsibility/reason/date range. Read-only analytics. |
| **Assessment** | ⚠️ **Partial** — analytics work but remake creation lives in `/cases/[id]` |
| **Issues** | No ability to mark a remake as resolved or track its re-production journey |
| **Missing backend** | Remake status lifecycle (open → in_production → resolved). Cost impact reports by period. |

#### `/delivery` — Delivery Queue
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, lab_manager, delivery |
| **Purpose** | Delivery operations: queue by status, assign driver, schedule, confirm delivery |
| **Data** | `getDeliveryData()` — real data from `deliveries` table joined to cases |
| **Actions** | `updateDeliveryAction` — assign driver, schedule, set recipient, upload proof |
| **Assessment** | ⚠️ **Functional but incomplete** |
| **Critical gap** | 🔴 "Proof file UUID" is a raw text input field expecting a UUID. This is **not a real file upload**. A delivery proof requires an actual Supabase Storage upload with a signed URL. The current form is broken as a UX — staff would need to upload a file elsewhere, copy its UUID, and paste it in. |
| **Missing backend** | Supabase Storage upload for delivery proof photos. Notification trigger when delivery is confirmed. |

---

### 2.2 Finance Zone

#### `/invoices` — Invoice List + Create
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, accountant |
| **Purpose** | Invoice management: list, create from case, view KPIs |
| **Data** | `getFinanceDashboard()` — invoices, doctors, cases, summary |
| **Actions** | Create invoice (inline in list view via `showCreate` flag), navigate to new/detail |
| **Assessment** | ✅ **Functional** — real data, real actions |
| **Issues** | Same `getFinanceDashboard()` called from both `/invoices` AND `/payments` — loads all invoices twice |

#### `/invoices/new` — New Invoice
| Property | Value |
|---|---|
| **Roles** | finance roles only |
| **Purpose** | Dedicated invoice creation page |
| **Assessment** | ✅ **Works** |

#### `/invoices/[id]` — Invoice Detail
| Property | Value |
|---|---|
| **Roles** | finance roles |
| **Purpose** | Invoice line items, payment allocations |
| **Assessment** | ✅ **Works** — payment allocation supported |

#### `/payments` — Payment Log
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, accountant |
| **Purpose** | Record payments and view payment history |
| **Data** | Same `getFinanceDashboard()` as `/invoices` — loads all invoice data again |
| **Assessment** | ⚠️ **Works but wastes** — no reason to reload all invoices for the payments page |
| **Issues** | `PaymentsDashboard` receives only `doctors` and `summary`. The full invoice list is loaded but not passed. |

---

### 2.3 Administrative Zone

#### `/dashboard` — Lab Dashboard
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, lab_manager, reception |
| **Purpose** | Lab operational overview: KPIs, active cases table, workflow board, doctor performance, reports |
| **Data** | `getDashboardData()` + `getOpsReports()` — two parallel heavy queries |
| **Assessment** | ⚠️ **Redundant** — `ReportsDashboard` is fully embedded here AND exists as a standalone `/reports` page |
| **Critical finding** | `lib/data/dashboard.ts` contains **hardcoded `previewCases` and `previewDoctors` arrays** that are shown in preview mode. These are named real people and cases that look like real data. Anyone in preview mode sees fake lab data labeled with names. |
| **Issues** | Double-loading reports data. Preview data looks too real. No action items surfaced — pure visualization. |

#### `/reports` — Operations Reports
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, lab_manager, accountant |
| **Purpose** | Standalone ops reporting: bottlenecks, distribution, doctor scores, QC analysis, remake analysis |
| **Data** | `getOpsReports()` — 4 parallel Supabase queries |
| **Assessment** | ✅ **Functional** — but also embedded in `/dashboard` (duplicate render) |
| **Issues** | No export. No date range selector on the page (would require server-side searchParam handling). |

#### `/settings` — Lab Settings
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner |
| **Purpose** | Lab configuration: name, contact, preferences |
| **Data** | `getSettingsData()` |
| **Assessment** | ✅ **Minimal but works** |

---

### 2.4 Portal Zone

#### `/doctor-portal` — Doctor Dashboard
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, **doctor** |
| **Purpose** | Doctor-facing view: my cases, KPI cards (active, waiting info, design approvals, balance) |
| **Data** | `getDoctorPortalData()` — finds doctor record linked to current auth user |
| **Assessment** | ✅ **Functional** for the `doctor` role |
| **Security concern** | `lab_owner` can access `/doctor-portal`. `getDoctorPortalData` will look up their doctor profile record. If they have none, the doctor ID is null and the case query returns 0 results — silently. This is confusing, not dangerous. |
| **Critical finding** | `/doctor-portal/cases` renders `DoctorPortalDashboard` — **the exact same component as `/doctor-portal/page.tsx`**. This is a route duplication. |
| **UX problem** | Doctor portal and lab staff portal share the same AppShell and sidebar. A `doctor` user sees the same navigation chrome as a lab staff member. There is no distinct portal identity. |

#### `/doctor-portal/statement` — Doctor Statement
| Property | Value |
|---|---|
| **Assessment** | ✅ Works — doctor's financial statement view |

#### `/doctor-portal/cases/[id]` — Doctor Case View
| Property | Value |
|---|---|
| **Assessment** | Separate from `/cases/[id]` — doctor-safe view without internal notes |

---

### 2.5 Command/Executive Zone

#### `/command-center` — System Command Center
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, lab_manager |
| **Purpose** | Intended: system health, launch readiness, operational control |
| **Data** | `getSystemReadiness()`, `getCloudStatus()`, `calculateLaunchReadiness()`, `getTopUrgentTasks()` |
| **Assessment** | 🔴 **Developer console, not operational dashboard** |
| **Critical finding** | ALL of the following read from **static TypeScript constant arrays**, not the database: security score, readiness score, launch checklist, system tasks, and feature flags. This is hardcoded developer tooling presented as a live dashboard. |
| **Recommendation** | Do not upgrade this into a staff workspace. Keep as developer/admin tool. Operational needs are served by `/owner`. |

#### `/command-center/finance` — Finance Command
| Property | Value |
|---|---|
| **Assessment** | ✅ **Real** — reads live from `getFinanceDashboard()`. The only CC sub-page with live data. |

#### `/command-center/master-data/*` — Lab Catalog
| Property | Value |
|---|---|
| **Assessment** | ✅ **Real** — configurable operations, materials, prices, technician rates, workflow engine |

#### `/owner` — Operations HQ (new)
| Property | Value |
|---|---|
| **Roles** | super_admin, lab_owner, lab_manager |
| **Purpose** | Real operational intelligence: active cases count, overdue, due today, outstanding balance, recommended actions |
| **Data** | `getOwnerOperationalSnapshot()`, `getOwnerOverdueCases()` — 5 parallel real queries |
| **Assessment** | ✅ **Real and useful** — newly built, serves a clear daily purpose |
| **Issues** | Good foundation but missing: last 7-day trend lines, technician bottleneck view, doctor outstanding leaderboard |

#### `/hq` — Platform HQ (new)
| Property | Value |
|---|---|
| **Roles** | super_admin only |
| **Purpose** | Platform-level view: count of labs, users, migrations |
| **Assessment** | ✅ **Foundation** — real data, correctly gated |
| **Issues** | Most HQ modules are "Soon" stubs. Needs real tenant management tools. |

---

## 3. Staff Role Reality Map

| Role | Should land at | Actually sees | Gap |
|---|---|---|---|
| **super_admin** | `/owner` or `/hq` | Navigates anywhere — no default | No dedicated home |
| **lab_owner** | `/owner` | `/owner` now works | ✅ Covered |
| **lab_manager** | `/owner` | `/owner` now works | ✅ Covered |
| **reception** | `/cases` | `/cases` and `/dashboard` | ✅ Covered |
| **technician** | `/technicians/workspace` | `/technicians` (management list) | 🔴 Wrong destination |
| **accountant** | `/invoices` | `/invoices` | ✅ Covered |
| **doctor** | `/doctor-portal` | `/doctor-portal` | ✅ Works, but same chrome as staff |
| **delivery** | `/delivery` | `/delivery` | ✅ Works |

---

## 4. Primitive MVP Findings

### PRIM-01 — Command Center is a Static Developer Board
**Severity: High**  
`getSystemReadiness()`, `calculateLaunchReadiness()`, `getTopUrgentTasks()`, and `getFeatureFlags()` all read from `lib/constants/security-findings.ts`, `lib/command-center/launch-checklist.ts`, and `lib/command-center/system-tasks.ts`. These are TypeScript constant arrays that never change at runtime. The readiness scores displayed are fiction. The "tasks" are hardcoded to-dos. The security score will never move unless a developer edits the source file.

### PRIM-02 — Dashboard Has Hardcoded Preview Data That Looks Real
**Severity: Medium**  
`lib/data/dashboard.ts` lines 31–88 define `previewCases` with patient names, doctor names, clinic names, and case stages. Lines 90–112 define `previewDoctors` with approval rates and payment status. In preview mode (when Supabase is not configured), these show as if they were real data. The names look realistic. Any demo or stakeholder review sees fake data that is indistinguishable from live production data.

### PRIM-03 — Quality Control Board is Read-Only
**Severity: High**  
`/quality-control` shows a list of cases awaiting QC. No action can be taken from this view. The QC pass/fail form exists only inside `/cases/[id]`. A QC inspector must: (1) open the QC board, (2) identify which case to inspect, (3) navigate to `/cases/[id]`, (4) scroll to the QC section, (5) submit. Three navigation steps for what should be one action.

### PRIM-04 — Delivery Proof Upload is Broken
**Severity: High**  
`components/delivery/delivery-dashboard.tsx` line 78: `<Input name="proofFileId" placeholder="Proof file UUID" />`. This is a raw text field expecting a UUID of a file that doesn't exist yet. There is no upload UI. A delivery person cannot photograph a delivery and upload it through this interface. The "Proof delivered" feature is cosmetically present but functionally absent.

### PRIM-05 — Technician Workspace Not in Navigation
**Severity: Critical**  
`/technicians/workspace` is the primary daily tool for 60-80% of lab staff. It is not in the sidebar navigation. The `technician` role navigates to `/technicians` instead — a management view they shouldn't see. The workspace was built and works, but no one will discover it.

### PRIM-06 — Reports Duplicated in Dashboard
**Severity: Medium**  
`ReportsDashboard` renders inside `/dashboard` (same component, same data) as well as at `/reports`. Both pages load `getOpsReports()`. This doubles the Supabase query count for anyone who visits `/dashboard` (which loads ALL cases, invoices, QC checks, and remakes for analytics, on top of the dashboard data).

### PRIM-07 — Doctor Portal Cases Page is Identical to Portal Home
**Severity: Low**  
`/doctor-portal/cases` renders `DoctorPortalDashboard` — the same component as `/doctor-portal/page.tsx`. These two routes serve the same function. One should be removed or differentiated.

### PRIM-08 — Delivery Case List Sidebar Note in Production UI
**Severity: Low**  
`/cases/new` right sidebar panel includes text: "**Next TODO**: Add signed upload flow that writes metadata to case_files only after Supabase Storage confirms the upload." This developer note is rendered to all users including doctors and reception.

### PRIM-09 — No Pagination Anywhere
**Severity: Critical**  
`getCaseList()`, `getProductionBoardData()`, and `getQualityControlData()` all load unbounded result sets. At 500+ cases, the production board will transmit megabytes of JSON and render hundreds of DOM nodes. At 2000+ cases, the page will time out or OOM.

---

## 5. Duplicate and Confusing Areas

| Confusion | Routes | Impact |
|---|---|---|
| Three overlapping dashboards | `/dashboard`, `/owner`, `/command-center` | Staff don't know where to go |
| Reports embedded in dashboard | `/dashboard` renders `ReportsDashboard`; `/reports` exists separately | Double query load |
| Doctor portal cases page = portal home | `/doctor-portal` and `/doctor-portal/cases` render same component | Wasted route |
| Technician nav destination | `/technicians` for technician role instead of `/technicians/workspace` | Role goes to wrong place |
| Finance command and invoices page | `/command-center/finance` and `/invoices` both show finance KPIs | Overlapping display |
| Production board and dashboard workflow board | `/production` is kanban; `/dashboard` has `WorkflowBoard` (stage counts) | Similar widgets |

---

## 6. Missing Backend Systems

### MISS-01 — Automated Stage Transition Engine
**Status: Architecture exists, not wired**  
Migration 0017 created `lab_workflow_templates` and `lab_workflow_stages`. The Workflow Engine UI exists at `/command-center/master-data/workflows`. But case stage transitions are still 100% manual (drag on board or server action). No automation rules are evaluated when a stage completes. Example: when QC passes, the case should auto-advance to `ready_for_delivery`. This doesn't happen.

### MISS-02 — Notification System
**Status: Missing entirely**  
`hasEmailProviderEnv()` checks for Resend API key but no email is ever sent by any server action. Events that should trigger notifications: case created, stage moved, QC failed, doctor approval requested, overdue case threshold crossed, invoice payment received. Without notifications, lab staff must manually refresh pages to discover state changes.

### MISS-03 — Real-Time Case Updates
**Status: Missing entirely**  
All pages are `force-dynamic` server-rendered with no client-side subscriptions. The production board does not update when another user moves a case. Two technicians could drag the same case simultaneously with no conflict resolution. Supabase Realtime is not used.

### MISS-04 — Technician Capacity Engine
**Status: Schema exists, not used**  
`technician_profiles_ext.daily_capacity_minutes` (migration 0018) defines each technician's daily capacity but nothing reads or displays it. `production.ts` sets `workload: 0` for all technicians. No capacity-aware assignment logic exists.

### MISS-05 — Automated Invoice Overdue Marking
**Status: Missing**  
No scheduled job or trigger marks invoices as `overdue` when `due_date < today`. The `overdue` status must be set manually. The `/owner` page's "overdue invoices" count is accurate only if someone has manually updated statuses.

### MISS-06 — Real Delivery Proof Upload
**Status: Broken (raw UUID field)**  
See PRIM-04. A Supabase Storage signed upload flow for delivery proof photos does not exist.

### MISS-07 — Pagination / Cursor-Based Fetching
**Status: Missing everywhere**  
See PRIM-09. All case/production queries need `range(from, to)` or cursor-based pagination before scale becomes an issue.

### MISS-08 — Case Stage History Display
**Status: Schema exists, partially hidden**  
`case_stage_history` table exists (migration 0006). `getCaseDetail()` fetches `stageHistory` but it is rendered as a small timeline. Stage duration (time spent in each stage) is not computed or displayed. This is the core data needed for bottleneck analysis.

---

## 7. Upgrade Strategy

### Tier 1 — Security and Correctness (Do First)

| Fix | Route | Action |
|---|---|---|
| Route technician role to workspace | nav → `/technicians/workspace` | Change navigation entry for technician role |
| Remove technician role from `/technicians` nav | `navigation.ts` | Restrict management list to owner/manager only |
| Suppress developer TODO note in cases/new UI | `cases/new` sidebar | Remove or move to admin-only section |
| Doctor data isolation on `/cases` staff list | `getCaseList()` | Add doctor role filter: only show their own cases |

### Tier 2 — UX Completeness (High Impact)

| Upgrade | Route | Description |
|---|---|---|
| QC inline actions | `/quality-control` | Add QC pass/fail sheet/dialog directly in the board |
| Real delivery proof upload | `/delivery` | Replace UUID field with Supabase Storage upload |
| Technician workspace in navigation | Sidebar | Add `/technicians/workspace` for `technician` role |
| Case pagination | `/cases`, `/production` | Add page/cursor-based fetching |

### Tier 3 — Backend Systems (Foundation)

| System | Priority | Complexity |
|---|---|---|
| Overdue invoice cronjob / DB trigger | High | Low |
| Notification engine (email on key events) | High | Medium |
| Stage automation rules wiring | Medium | High |
| Supabase Realtime for production board | Medium | Medium |
| Technician capacity display | Low | Low |

### Tier 4 — Structural Cleanup

| Fix | Action |
|---|---|
| Remove `ReportsDashboard` from `/dashboard` | Replace with a summary card linking to `/reports` |
| Merge `/doctor-portal/cases` into portal home | Remove duplicate route |
| Clear preview data in `dashboard.ts` | Replace `previewCases`/`previewDoctors` with empty state |
| Clear hardcoded CC data | Label Command Center as "developer console" |

---

## 8. Recommended Next Implementation PR

### PR: `technician-workspace-first-class-portal`

**Recommended because:**  
The technician workspace is the highest-frequency, highest-value daily touchpoint in a dental lab — and it is currently undiscoverable. Technicians navigate to a management list instead of their work queue. The server actions (start stage, complete stage, log problem) already work. The data layer is correct. The fix is primarily navigation and workspace UX — no new backend system is required.

**Exact changes required:**

#### 1. Navigation (`lib/constants/navigation.ts`)
```
// REMOVE: technician role from Technicians nav item
roles: ["super_admin", "lab_owner", "lab_manager"] // was also "technician"

// ADD: new nav item for technician role only
{
  label: "My Workspace",
  href: "/technicians/workspace",
  icon: Wrench,
  roles: ["technician"],
  group: "lab-ops",
}
```

#### 2. Technician Workspace Upgrade (`components/production/technician-workspace.tsx`)
Current state: Shows assigned cases with start/complete buttons. Productivity stats at top.
Upgrade needed:
- Sort cases by priority score + delay risk (overdue first)
- Show daily capacity counter (cases today vs. capacity if `technician_profiles_ext` is joined)
- Add "Cases assigned today" badge
- Replace raw productivity numbers with human labels ("On track", "Behind schedule")
- Surface notification when workspace loads with 0 assigned cases ("No cases assigned — check with your manager")

#### 3. Workspace Data Layer (`lib/data/production.ts`)
- Sort `assignedCases` by `priority_score DESC, due_date ASC` (currently no sort order)
- Join `technician_profiles_ext` for `daily_capacity_minutes` display
- Add `casesCompletedToday` count

#### 4. Route Access (`app/technicians/workspace/page.tsx`)
- Current: `requireRouteAccess("/technicians/workspace")` — correct, uses `/technicians` rule
- Consider adding a specific `/technicians/workspace` rule in `routes.ts` for `technician` only

#### 5. Technicians Management Page (`app/technicians/page.tsx`)
- Remove the workspace link from the management list header
- This page is now management-only; the workspace link was the only acknowledgment technicians existed

**Database needs:**
- No new migrations required
- Optional: join `technician_profiles_ext` for capacity display (table exists, migration 0018)

**Security risks:**
- Low. No new attack surface. Route guard already correct. Restricting `/technicians` nav is additive safety.

**Acceptance criteria:**
- [ ] `technician` role sidebar shows "My Workspace" not "Technicians"
- [ ] `lab_owner` and `lab_manager` sidebar still shows "Technicians" (management list)
- [ ] Workspace page loads assigned cases sorted by urgency
- [ ] Cases display delay risk badge, stage label, due date
- [ ] Start/Complete stage actions work
- [ ] Empty state shown when no cases assigned
- [ ] Zero new TypeScript errors
- [ ] Zero new ESLint errors
- [ ] Build passes

**Why not other options:**

| Alternative PR | Why not now |
|---|---|
| QC inline actions | Requires new sheet/dialog component + action wiring. Higher effort, less blocking. |
| Real delivery proof upload | Needs new Supabase Storage bucket configuration and signed upload flow. Infrastructure-first. |
| Case pagination | Correct but mechanical. Doesn't unblock any role from doing their job. |
| Remove duplicate dashboard/reports | Structural cleanup — safe but zero operational impact. |
| Notification system | Multi-file backend work. Needs email provider configuration. Not a UI PR. |

---

## 9. Files Created / Changed

| File | Status |
|---|---|
| `LABFLOW_STAFF_WORKSPACES_2_0.md` | ✅ Created (this document) |

No code changes in this PR. This is an audit-first, documentation-only phase. Minimal code changes would only be justified for the Tier 1 security fixes (removing technician from management nav), which are low-risk one-liners in `navigation.ts` and `routes.ts`. Those are deferred to the next implementation PR to maintain a clean audit boundary.

---

## 10. QA Results

### TypeScript
```
npm run typecheck → ✅ PASS (zero errors)
```

### ESLint
```
npm run lint → ✅ PASS (zero errors, zero warnings)
```

### Production Build
```
npm run build → ✅ PASS (61 routes compiled, zero errors)
Route /hq ✓
Route /owner ✓
All existing routes ✓
```

No route guards were weakened. No fake data was added. No secrets were exposed. No existing routes were broken. No code changes were made in this audit phase.

---

## 11. Risks and Next Phase Handoff

### Active Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Unbounded case queries at scale | 🔴 Critical | Must add pagination before going to production |
| Technician lands on wrong page | 🔴 Critical | Fix in next PR |
| Delivery proof field is fake | 🔴 Critical | Fix in Tier 2 |
| Doctor sees all-lab cases at `/cases` | 🟡 High | Add doctor-scoped filter to `getCaseList` |
| Automated overdue invoice marking absent | 🟡 High | Add Postgres trigger or Supabase Edge Function cron |
| No notifications means state changes are invisible | 🟡 High | Email system needed before pilot lab goes live |

### What "Staff Workspaces 2.0" actually means

The MVP staff workspaces were built role-by-role in isolation. 2.0 means:

1. **Role-correct navigation** — every role lands at their primary workspace, not a management screen
2. **Action-first design** — every workspace shows what needs to be done NOW, not just data
3. **Live operational data** — no hardcoded scores, no static arrays, no preview fiction
4. **Event-driven awareness** — notification system so staff know when things change
5. **Scale-safe queries** — pagination on all lists before scale hurts

The next implementation PR (Technician Workspace as First-Class Portal) is the right first step because it fixes the highest-frequency, highest-impact user with the lowest backend complexity.

After that: QC inline actions → Delivery proof upload → Invoice overdue automation → Notification system → Pagination.

---

*Generated by LabFlow Executive Product Engineering War Room*  
*Branch: `phase-15-staff-workspaces-2-audit`*  
*Do not git push. Do not commit secrets.*
