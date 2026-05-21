# LabFlow — Operating Core Mega Sprint

**Branch:** `phase-15-operating-core-mega-sprint`  
**Sprint goal:** Harden the case lifecycle, production board, and owner visibility layer so LabFlow can run a real pilot lab with real cases from intake to delivery.

---

## Sprint overview

Seven workstreams delivered in a single branch:

| # | Workstream | Status |
|---|-----------|--------|
| WS1 | Staff Workspaces 2.0 Audit | ✅ Complete |
| WS2 | Workflow Engine Foundation | ✅ Complete |
| WS3 | Case Lifecycle Foundation | ✅ Complete (surfaced via case-summary) |
| WS4 | Production Board 2.0 | ✅ Complete |
| WS5 | Printable Case Sheet | ✅ Complete |
| WS6 | Owner Command Center 2.0 | ✅ Complete |
| WS7 | Documentation + QA | ✅ Complete |

---

## WS1 — Staff Workspaces 2.0 Audit

**Deliverable:** `LABFLOW_STAFF_WORKSPACES_2_0.md`

Full audit of all 14 staff-facing routes. Key findings:

- **PRIM-01:** Command Center reads from hardcoded TypeScript arrays instead of live DB data
- **PRIM-04:** Delivery proof upload is a broken raw UUID text field
- **PRIM-05:** `/technicians/workspace` is not in sidebar navigation
- **PRIM-09:** No pagination anywhere (critical scale risk)
- Technician role navigates to the management list (security/UX issue)

Recommended next PR: `technician-workspace-first-class-portal`

---

## WS2 — Workflow Engine Foundation

**Deliverable:** `supabase/migrations/0019_workflow_transitions_stage_requirements.sql`

Additive migration (no existing data modified) adding two tables:

### `workflow_transitions`
Defines allowed stage-to-stage moves within a custom workflow:
- `from_stage_key` — source stage (or `*` for any-to-target catch-all)
- `to_stage_key` — destination stage
- `allowed_roles` — empty = all lab members; non-empty restricts by role
- `requires_note` — forces a reason to be entered on transition
- `is_active` — soft-disable transitions without deletion
- Unique constraint: `(workflow_id, from_stage_key, to_stage_key)`

### `stage_requirements`
Per-stage entry gates (evaluated before entering the stage):
- `requires_files` — at least one file must be uploaded
- `requires_price` — `total_price > 0` must be set
- `requires_assigned_technician` — case must have an assigned technician
- `requires_qc_pass` — a passing quality check must exist
- `requires_doctor_approval` — doctor approval record must exist
- Unique constraint: `(workflow_id, stage_key)`

Both tables have full RLS:
- `SELECT`: any authenticated lab member
- `INSERT / UPDATE / DELETE`: lab_owner, lab_manager, super_admin only

---

## WS3 — Case Lifecycle Foundation

**Deliverable:** Rewritten `lib/data/case-summary.ts`

Upgraded data layer for the case summary / printable sheet:

- **Bug fixed:** `doctors(name, ...)` → `doctors(display_name, ...)` — the `doctors` table uses `display_name`, not `name`. Previously returned `null` silently.
- Added `CaseSummaryStageLog` type: `{ id, from_stage, to_stage, notes, created_at }`
- New `CaseSummaryData` fields: `missingInfoStatus`, `totalPrice`, `assignedTechnicianName`, `filesCount`, `stageHistory`
- 4 parallel supplementary queries:
  - `case_items` — line-item breakdown
  - `case_timeline` — last 10 events descending
  - `case_stage_logs` — full stage transition history ascending
  - `case_files` — file count (head-only)
- Assigned technician resolution: try `technicians.profile_id` match first, fallback to `profiles.full_name`

---

## WS4 — Production Board 2.0

**Deliverable:** Updated `components/production/production-board.tsx`

Upgraded column headers and card blocking logic:

### Column header improvements
Each column header now shows inline sub-badges beneath the stage label:
- **`N blocked`** (red chip) — cards where `delayRisk === "blocked"` OR `missingInfoStatus !== "complete"`
- **`N unassigned`** (amber chip) — cards with no assigned technician

These chips only appear when the count is > 0, keeping clean columns uncluttered.

### Card blocking improvements
- Blocked card border changed from `border-amber-300` → `border-red-300` for clearer visual signal
- `isBlocked` check corrected: `missingInfoStatus !== "complete"` (was incorrectly `=== "missing"`) — now catches all non-complete states (e.g., `requested`, `received`)

### Existing capabilities retained
- Drag-and-drop between columns (canManageBoard gate)
- Bottleneck column detection (amber highlight when column has most cases, min 2)
- Quick prev/next stage buttons
- Full stage select + delay reason for overdue moves
- Technician assignment form
- Workload display panel

---

## WS5 — Printable Case Sheet

**Deliverable:** Rewritten `components/cases/case-summary-sheet.tsx`

New components and sections added to the printable sheet:

### `MissingInfoBanner`
Amber/red alert bar shown when `missingInfoStatus !== "complete"`:
- Amber for `requested` or `received` states
- Red for all other non-complete states (e.g., `missing`, `not_started`)
- Includes "Case is blocked for production until resolved" message

### `QrPlaceholder`
SVG-based QR code placeholder showing the case number:
- Clearly marked as a placeholder requiring a QR library
- Renders in the top-right header alongside print metadata

### New data sections
- **Production section** — assigned technician name (or "Unassigned"), file count, current stage
- **Stage history table** — from / to / when / note for all `case_stage_logs`, ascending order
- **Updated header badges** — includes `missingInfoStatus` as an amber badge
- **Price row** — shown in Restoration section when `totalPrice > 0`

### Print fidelity retained
- Two-column grid with `print:grid-cols-2`
- Stage history and timeline tables use `print:break-inside-avoid`
- Print footer with lab name + case number + timestamp

---

## WS6 — Owner Command Center 2.0

**Deliverables:**
- Updated `lib/data/owner.ts` — new `getOwnerOperationalInsights()` function
- Updated `app/owner/page.tsx` — new KPI row + insight cards + bottleneck chart

### New `OwnerOperationalInsights` type
```ts
type OwnerOperationalInsights = {
  casesMissingTechnicianCount: number;  // active cases with no assigned_technician_id
  casesMissingPriceCount: number;       // active cases where total_price IS NULL OR 0
  casesWaitingApprovalCount: number;    // active cases at current_stage = 'doctor_approval'
  bottlenecksByStage: BottleneckStage[]; // top-5 stages by case count
};
```

### `getOwnerOperationalInsights(session)`
- Single Supabase query: all active cases with `current_stage`, `assigned_technician_id`, `total_price`
- Client-side grouping and counting (avoids N+1 round-trips)
- Returns top-5 bottleneck stages sorted by case count descending
- Always scoped to `session.activeLabId` — no cross-tenant data

### Owner page upgrades
New secondary KPI row (3 cards):
- **No technician** — amber-bordered when > 0, links to production board
- **No price set** — amber-bordered when > 0, links to cases list
- **Awaiting approval** — blue-bordered when > 0, links to filtered cases

New InsightCards:
- Warning for cases missing technician
- Warning for cases missing price
- Info for cases waiting doctor approval

New **Stage bottlenecks** section:
- Horizontal bar chart using CSS width % relative to top stage
- Top stage shown in amber (bottleneck indicator), rest in blue
- Shows count badge per stage
- Links to production board

---

## Architecture decisions

### Single query + client grouping (WS6)
Fetching all active cases in one query and grouping client-side is deliberately chosen over 3 separate count queries. The total active case count for a pilot lab is small (< 500). A single query with 3 fields is more efficient than 3 round-trips.

### Additive-only migrations (WS2)
Migration 0019 uses `create table if not exists` throughout. No existing case data, stages, or workflow templates are touched. Safe to apply to a production Supabase instance without downtime.

### No fake data in insights (WS6)
The `getOwnerOperationalInsights` preview fallback returns all zeros — not invented numbers. The bottleneck chart only renders when there are real stages to show. This prevents misleading owners in preview mode.

### `isBlocked` definition
A card or case is considered "blocked" when:
1. `delayRisk === "blocked"` — the stage-rules engine has flagged it, OR
2. `missingInfoStatus !== "complete"` — missing information is preventing production

Both conditions are used consistently across the production board and case summary sheet.

---

---

## Workflow Engine Truth Status

**Updated in Phase 15 Closure Pass 2 (branch: `phase-15-operating-core-closure-pass-2`)**

This section clearly separates what is implemented from what is not.

### What exists in the database (migrations deployed)

| Table | Migration | Status |
|-------|-----------|--------|
| `case_stage_logs` | 0006 | ✅ Active — populated by `moveCaseStageAction` |
| `case_timeline` | 0008 | ✅ Active — populated on every stage move |
| `lab_workflow_templates` | 0017 | ✅ Schema exists — EMPTY (no workflows seeded) |
| `lab_workflow_stages` | 0017 | ✅ Schema exists — EMPTY |
| `technician_stage_permissions` | 0017 | ✅ Schema exists — EMPTY |
| `workflow_transitions` | 0019 | ✅ Schema exists — EMPTY |
| `stage_requirements` | 0019 | ✅ Schema exists — EMPTY |

All tables have RLS enabled and are lab-scoped. None are used by the production board's runtime logic yet.

### What is implemented in application code

| Feature | Status | Notes |
|---------|--------|-------|
| Stage movement action (`moveCaseStageAction`) | ✅ Implemented | Validates permissions, missing info, QC, overdue reason |
| Stage log insertion on every move | ✅ Implemented | Writes to `case_stage_logs` with `from_stage`, `to_stage`, actor, timestamp |
| Timeline event insertion on every move | ✅ Implemented | Writes to `case_timeline` |
| Stage history display on case detail (`/cases/[id]`) | ✅ Implemented | Shows from/to/notes/date |
| Stage history display on case summary sheet | ✅ Implemented | Printable, ascending |
| Hardcoded 18-stage enum (`productionStages`) | ✅ Active | Used by production board, kanban, all movement validation |
| Workflow readiness check in `/owner` | ✅ Implemented | Shows "No custom workflow configured" warning if `lab_workflow_templates` is empty |
| Compatibility bridge stub (`validateTransitionAgainstWorkflow`) | ✅ Stubbed | No-op in Phase 15; wired for Phase 16 activation |

### What is NOT implemented (deferred to Phase 16)

| Feature | Why not yet |
|---------|-------------|
| Production board uses `lab_workflow_stages` for column order | Board still reads hardcoded `kanbanStages` from `productionStages` constant |
| `moveCaseStageAction` queries `workflow_transitions` | Transition validation still uses `getTransitionError()` hardcoded rules |
| Per-stage gate from `stage_requirements` table | Table exists but no code reads it |
| Per-technician stage permissions from `technician_stage_permissions` | Table exists but no code reads it |
| Workflow template admin UI | `master-data/workflows` page exists but is a placeholder |
| Default workflow seeder per lab | Not seeded — explicit design choice (would not change board behavior until integration is wired) |
| Role-restricted transitions (`allowed_roles` column) | Column exists in `workflow_transitions` but `getTransitionError()` uses `canManageProductionBoard()` only |

### Compatibility bridge location

`lib/production/stage-rules.ts` — `validateTransitionAgainstWorkflow()`

This function is a documented no-op stub. It exists so Phase 16 can activate real workflow validation by replacing its body with a Supabase query against `workflow_transitions`. Activation requires:
1. At least one lab has a fully populated workflow template with stages and transitions
2. Integration test confirming no valid moves are incorrectly blocked
3. Production board E2E test passing with workflow validation active

### What "Workflow Engine Truth" means for the production board today

The production board is **NOT yet a configurable workflow engine**. It is a **hardcoded 18-stage Kanban board with server-side movement validation**. The `lab_workflow_templates` tables are schema-ready but disconnected from the runtime. This is clearly disclosed:
- The board shows a "Fixed enum — 18 stages" badge
- The `/owner` page now warns if no workflow template is configured
- This document states the truth

---

## Security checklist

All new code passed the LabFlow security checklist:

- [x] All queries scoped to `session.activeLabId`
- [x] No cross-tenant data access
- [x] No service role key in client code
- [x] Supabase client created via `createSupabaseServerClient()` (server-only)
- [x] `import "server-only"` at top of all data layer files
- [x] RLS enabled on both new tables (`workflow_transitions`, `stage_requirements`)
- [x] Finance data (invoices, payments) never exposed to technician or delivery roles
- [x] Doctor names/contact info only in server components, never in client-side state
- [x] No `console.log` with sensitive data added

---

## Files changed

### New files
- `supabase/migrations/0019_workflow_transitions_stage_requirements.sql`
- `LABFLOW_OPERATING_CORE_SPRINT.md` (this file)

### Modified files
- `lib/data/case-summary.ts` — rewritten, bug fix + new fields
- `lib/data/owner.ts` — new `getOwnerOperationalInsights` function + types
- `app/owner/page.tsx` — secondary KPI row, new insight cards, bottleneck chart
- `components/cases/case-summary-sheet.tsx` — rewritten, new sections
- `components/production/production-board.tsx` — column blocked/unassigned sub-badges, isBlocked fix

---

## Known limitations (deferred)

| Item | Notes |
|------|-------|
| Pagination | PRIM-09 — no pagination anywhere; deferred to next sprint |
| Real QR codes | `QrPlaceholder` requires `qrcode` npm package integration |
| Workflow transitions UI | Tables exist but no admin UI yet; Phase 16 |
| Workflow engine runtime activation | `validateTransitionAgainstWorkflow` stub; Phase 16 |
| `changed_by` name resolution in stage history | Only UUID stored; profile name lookup deferred |

---

## Closure Pass 2 additions (branch: `phase-15-operating-core-closure-pass-2`)

| Item | Status |
|------|--------|
| Technician workspace first-class portal (nav + redirect + route) | ✅ Fixed |
| Developer "Next TODO" artifact removed from `/cases/new` | ✅ Fixed |
| Workflow engine truth status section | ✅ Added (this section) |
| `/cases/[id]/summary` route verification | ✅ Confirmed complete |
| Workflow readiness warning in `/owner` | ✅ Implemented |
| `validateTransitionAgainstWorkflow` compatibility bridge stub | ✅ Added |
| `LABFLOW_WORKFLOW_ENGINE_PLAN.md` created | ✅ Created |

---

*Sprint completed: 2026-05-19*  
*Closure Pass 2: 2026-05-19*  
*Branch: `phase-15-operating-core-mega-sprint`*
