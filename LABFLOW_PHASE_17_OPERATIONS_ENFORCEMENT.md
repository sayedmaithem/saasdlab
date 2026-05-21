# LabFlow — Phase 17: Lab Operations Enforcement Sprint

**Branch:** `phase-17-lab-operations-enforcement`  
**Status:** Core enforcement delivered — QA clean  
**Preceded by:** `phase-16-interactive-pilot-build`  
**Date:** 2026-05-19

---

## Executive Summary

Phase 17 converts LabFlow from an interactive pilot into a real operations enforcement system.

The three most critical gaps from Phase 16 were:

1. **Technician stage permissions existed in the database but were never queried.** A technician could move any case to any stage with zero restriction.
2. **Stage requirements existed in the database but were never enforced.** Cases could proceed without files, prices, technicians, QC passes, or doctor approval.
3. **Owner operational insights loaded ALL active cases into memory** with no limit — a serious performance risk as case volume grows.

All three are resolved in this sprint. Additionally:
- 5 new owner intelligence KPIs were added (QC queue, delivery ready, workflow transitions, tech permissions)
- 4 new InsightCards were added to the owner recommended actions panel
- Unbounded queries across case detail, technician workspace, and production insights were bounded with safe limits

---

## Workstream Status

| # | Workstream | Status | Notes |
|---|-----------|--------|-------|
| WS1 | Technician stage permissions runtime | ✅ Enforced (additive gate) | Fallback to no-op when 0 permissions configured |
| WS2 | Stage requirements enforcement | ✅ Enforced (additive gate) | Checks files, price, technician, QC, doctor approval |
| WS3 | QC gate enforcement | ✅ Improved | QC count visible on owner; requires_qc_pass via stage_requirements |
| WS4 | Delivery workflow foundation | ⚠️ Visibility improved | Infra exists; casesReadyForDelivery on owner; no new migration |
| WS5 | Design / doctor approval readiness | ✅ Runtime enforced | Existing milling_printing gate + stage_requirements layer |
| WS6 | Staff workspace workflow awareness | ⚠️ Partial | Error messages improved; permission UI deferred |
| WS7 | Owner operational risk intelligence 2.0 | ✅ Complete | 5 new KPIs, 4 new InsightCards, full rebuild of insights fn |
| WS8 | Case lifecycle enforcement visibility | ⚠️ Partial | Limits added; "what blocks this case?" deferred |
| WS9 | Critical pagination / performance strike | ✅ Complete | 4 query sites bounded |
| WS10 | Documentation + QA | ✅ Complete | This file + typecheck/lint/build pass |

---

## WS1 — Technician Stage Permission Runtime

### What was implemented

**New function:** `checkTechnicianStagePermission()` in `lib/data/workflows.ts`

**Called from:** `moveCaseStageAction()` in `app/actions/production.ts` (after `checkWorkflowTransition()`)

**Logic chain:**

```
1. Count technician_stage_permissions rows for lab_id
   → If 0: return null (fallback mode, no enforcement)

2. Find technician record by profile_id = session.userId
   → If not found: return null (not a technician record, e.g. manager calling)

3. Find stage_id via lab_workflow_stages where stage_key = toStageKey AND is_active=true
   → If not found: return null (stage not in workflow, no rule to enforce)

4. Fetch technician_stage_permissions row
   → If row not found: return blocked message
      "You are not permitted to work on the '{stage}' stage."
   → If row found but action=false: return blocked message
      "You are not permitted to {action} the '{stage}' stage."

5. Return null (permitted)
```

**Action checked:** `can_move_to` — the technician must be authorized to move cases TO the target stage.

**Why additive:**
- Hardcoded role rules run first (`getTransitionError()`)
- Workflow transitions run second (`checkWorkflowTransition()`)  
- Technician permissions run third (new)
- Stage requirements run fourth (new)

This means existing behavior for all labs without configured permissions is unchanged.

### Owner visibility

- Owner page now shows whether `techPermissionsConfigured` is true or false
- InsightCard shown if permissions table is empty: guides lab manager to configure

### What is deferred

- **Permission management UI**: No admin UI exists yet to create/edit rows in `technician_stage_permissions`. A lab manager must insert rows directly (via Supabase Studio or a future admin UI).
- **`can_work` check**: The workspace "Start stage" action does not yet check `can_work`. Only the stage move action checks `can_move_to`. Phase 18 should add `can_work` to `startStageAction()`.
- **`can_move_from` check**: The departure-side check is not wired. If a lab needs bidirectional enforcement (technician can only leave stage X if they have can_move_from), that's Phase 18.

---

## WS2 — Stage Requirements Enforcement

### What was implemented

**New function:** `checkStageRequirements()` in `lib/data/workflows.ts`

**Called from:** `moveCaseStageAction()` in `app/actions/production.ts` (after technician permission check)

**Logic chain:**

```
1. Find active workflow (default or any active) for lab_id
   → If none: return null (fallback)

2. Fetch stage_requirements row for (workflow_id, to_stage_key)
   → If none: return null (no requirements for this stage)

3. For each requirement flag = true:
   a. requires_assigned_technician
      → Check cases.assigned_technician_id IS NOT NULL
      → Block: "This stage requires a technician to be assigned before proceeding."

   b. requires_price
      → Check cases.total_price > 0
      → Block: "This stage requires a case price to be configured."

   c. requires_files
      → Count case_files where case_id = caseId
      → Block: "This stage requires at least one case file."

   d. requires_qc_pass
      → Fetch quality_checks most recent row, check result = 'passed'
      → Block: "This stage requires a passed quality check."

   e. requires_doctor_approval (only if cases.requires_doctor_approval = true)
      → Fetch design_approvals where status = 'approved'
      → Block: "Doctor approval is required before this stage."

4. Return null (all requirements met or no requirements configured)
```

**Fallback behavior:** If `stage_requirements` has zero rows for a workflow, all stages pass (no requirements). The standard seeded workflow does not seed stage_requirements rows — labs must add them via Supabase Studio or future admin UI.

### Error message examples

```
"This stage requires a technician to be assigned to the case before proceeding."
"This stage requires a case price to be configured before proceeding."
"This stage requires at least one case file to be uploaded before proceeding."
"This stage requires a passed quality check before proceeding."
"Doctor approval is required before this stage. Ask the referring doctor to approve the design."
```

### What is deferred

- **Stage requirements UI**: No admin UI to create stage_requirements rows. Phase 18.
- **requires_doctor_approval when case.requires_doctor_approval=false**: The doctor approval check is intentionally only enforced when the case is flagged as needing approval. This avoids blocking non-approval cases.

---

## WS3 — QC Gate Enforcement

### What is now enforced

**Pre-existing hardcoded gate (unchanged):**
```
If targetStage = ready_for_delivery AND !hasPassedQc:
  Block: "Quality control must pass before ready for delivery."
```
This gate is in `lib/production/stage-rules.ts::getTransitionError()`.

**New additive gate (Phase 17):**
```
If stage_requirements.requires_qc_pass = true for the target stage:
  Check quality_checks.result = 'passed'
  Block: "This stage requires a passed quality check."
```
This means labs can configure QC requirements for any stage, not just `ready_for_delivery`.

### Owner visibility added

- `casesWaitingQCCount`: number of active cases in `quality_control` stage
- Owner page shows QC count in secondary KPI row (purple card)
- InsightCard appears when cases are waiting QC, with link to `/quality-control`

### What is deferred

- QC pass/fail UI upgrades to `/quality-control` page (already functional from prior phases)
- Itemized QC checklist display on case detail

---

## WS4 — Delivery Workflow

### Existing infrastructure

The `deliveries` table has full metadata:
- `delivery_status` enum: `pending | assigned | out_for_delivery | delivered | failed | cancelled | assigned_to_delivery`
- `delivery_person_id`: FK to profiles
- `delivered_at`, `out_at`, `proof_file_id`, `failure_reason`, `recipient_name`

The delivery page (`/delivery`) already renders cases in `ready_for_delivery`, `out_for_delivery`, and `delivered` stages with assignment actions.

### Phase 17 improvements

- `casesReadyForDeliveryCount` added to owner insights (emerald card in secondary KPI row)
- InsightCard appears when cases are ready for delivery: "N cases ready for delivery — open delivery queue"
- `blocks_delivery` flag on `lab_workflow_stages` documented as deferred enforcement

### What is deferred

- `blocks_delivery` gate: The schema flag exists but is never queried. A future phase should prevent delivery dispatch when any blocking stage is incomplete.
- Proof file upload UX: `/delivery` still uses raw UUID file picker. Replace with proper drag-and-drop file upload (Phase 18).

---

## WS5 — Design / Doctor Approval Readiness

### Existing enforcement (unchanged)

In `moveCaseStageAction()`:
```ts
if (
  targetStage === "milling_printing" &&
  item.requires_doctor_approval &&
  !(await hasApprovedDesign(item.id, item.lab_id))
) {
  return { ok: false, message: "Doctor approval is required before milling or printing." };
}
```

### New additive enforcement (Phase 17)

`checkStageRequirements()` now handles `requires_doctor_approval` for any stage via `stage_requirements` table. This extends the doctor approval check beyond `milling_printing` to any stage a lab configures.

---

## WS7 — Owner Operational Risk Intelligence 2.0

### Before (Phase 16)

```ts
// Single unbounded query loaded ALL active cases:
supabase
  .from("cases")
  .select("current_stage, stage, assigned_technician_id, total_price")
  .not("status", "in", '("completed","cancelled","archived")')
// Then grouped client-side with no row limit
```

This would spike server memory on large labs (500+ active cases).

### After (Phase 17)

Nine targeted queries run in parallel, each is a count or bounded fetch:

| Query | Type | Output |
|-------|------|--------|
| Cases missing technician | `count(exact, head)` | `casesMissingTechnicianCount` |
| Cases missing price | `count(exact, head)` | `casesMissingPriceCount` |
| Cases in doctor_approval | `count(exact, head)` | `casesWaitingApprovalCount` |
| Cases in quality_control | `count(exact, head)` | `casesWaitingQCCount` |
| Cases in ready_for_delivery | `count(exact, head)` | `casesReadyForDeliveryCount` |
| Stage distribution | `select(current_stage, stage).limit(500)` | `bottlenecksByStage` |
| Workflow templates | `count(exact, head)` | `workflowConfigured` |
| Workflow transitions | `count(exact, head)` | `transitionsConfigured` |
| Technician permissions | `count(exact, head)` | `techPermissionsConfigured` |

**Performance improvement:** From 1 unbounded full-table scan + client grouping → 8 precise count queries + 1 bounded (500-row max) stage distribution. For a lab with 1000 active cases, memory usage drops from ~100KB of case data to essentially zero for the count queries.

### New owner UI

**Secondary KPI row** — expanded from 3 to 5 cards:
- No technician (amber) — existing
- No price (amber) — existing
- Awaiting approval (blue) — existing
- In QC (purple) — new
- Ready for delivery (emerald) — new

**Recommended Actions** — new InsightCards:
- "N cases waiting quality check" → `/quality-control`
- "N cases ready for delivery" → `/delivery`
- "Workflow configured but no transitions defined" → workflow config
- "Technician stage permissions not configured" → workflow config

---

## WS9 — Critical Performance / Pagination Strike

### Queries bounded in this sprint

| File | Query | Before | After |
|------|-------|--------|-------|
| `lib/data/cases.ts::getCaseDetail()` | `case_stage_logs` | No limit | `.limit(60)` |
| `lib/data/cases.ts::getCaseDetail()` | `case_timeline` | No limit | `.limit(80)` |
| `lib/data/cases.ts::getCaseDetail()` | `case_comments` | No limit | `.limit(100)` |
| `lib/data/production.ts::getTechnicianWorkspaceData()` | `quality_checks` | No limit | `.limit(500)` with order |
| `lib/data/production.ts::getTechnicianWorkspaceData()` | `case_stage_logs` | No limit | `.limit(500)` with order |
| `lib/data/owner.ts::getOwnerOperationalInsights()` | Full case scan | Unbounded | 9 targeted queries + `.limit(500)` |

### Remaining performance risks (not fixed — document)

| Query | Risk | Recommendation |
|-------|------|---------------|
| `getCaseDetail()::case_files` | No limit. A case with 100+ files loads everything. | Add `.limit(50)` in Phase 18 with "load more" UI |
| `getCaseDetail()::design_versions` | No limit. | Usually < 20, low risk for pilot |
| `getCaseList()` | `.limit(150)` hard limit, no cursor pagination. | Add cursor or page-based pagination in Phase 18 |
| `getProductionBoardData()` | No limit on full active case list. | Add `.limit(300)` + note in Phase 18 |

---

## Database: No New Migrations

Phase 17 adds **zero new database tables or migrations**. All enforcement uses existing schema from migrations 0017 and 0019:

- `technician_stage_permissions` — now queried at runtime
- `stage_requirements` — now queried at runtime
- `quality_checks` — used for QC pass verification in stage_requirements gate

The only change to existing queries is adding `.limit()` clauses for performance.

---

## RLS / Security Notes

No RLS changes. All new queries are server-side only (`"server-only"` import at top of `lib/data/workflows.ts`).

All queries filter by `lab_id = session.activeLabId` — tenant boundary enforced.

The technician stage permission check falls open on query error (fail-open) to prevent a DB issue from locking all technicians out of production. This is intentional — enforcement errors should never stop lab production.

Stage requirements check also falls open on query error.

---

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `lib/data/workflows.ts` | Modified | Added `checkTechnicianStagePermission()` + `checkStageRequirements()` + internal types + `_checkRequirementsForWorkflow()` helper |
| `app/actions/production.ts` | Modified | Added imports + two new gate calls in `moveCaseStageAction()` after `checkWorkflowTransition()` |
| `lib/data/owner.ts` | Modified | Full rebuild of `getOwnerOperationalInsights()` — 9 parallel targeted queries, 5 new fields in return type |
| `app/owner/page.tsx` | Modified | 5-column secondary KPI row, 4 new InsightCards, QC + delivery + transitions + tech permissions intelligence |
| `lib/data/cases.ts` | Modified | `.limit(60)` on case_stage_logs, `.limit(80)` on case_timeline, `.limit(100)` on case_comments |
| `lib/data/production.ts` | Modified | `.limit(500)` with order on quality_checks + case_stage_logs in workspace loader |

---

## QA Results

```
npm run typecheck → 0 errors ✅
npm run lint      → 0 errors, 0 warnings ✅
npm run build     → 57 routes, 0 errors ✅
```

---

## How Abbas Should Test Phase 17

### Test 1: Workflow transition enforcement (existing, verify still works)

1. Open `/production`
2. Create or find a test case in `received` stage
3. Log in as a `technician` user
4. Try to drag the case from `received` to `completed` (not a configured transition in the seeded workflow)
5. **Expected:** Move fails with "Stage move from received to completed is not permitted by your lab workflow"

### Test 2: Stage requirements enforcement (if stage_requirements rows seeded)

1. Insert a row into `stage_requirements`:
   ```sql
   INSERT INTO stage_requirements (lab_id, workflow_id, stage_key, requires_assigned_technician, requires_price)
   VALUES ('<lab_id>', '<workflow_id>', 'cad_design', true, true);
   ```
2. Find a case with no assigned technician and no total_price
3. Try to move it to `cad_design` stage
4. **Expected:** Move fails with "This stage requires a technician to be assigned before proceeding."

### Test 3: Technician stage permissions enforcement (if rows seeded)

1. Insert test rows:
   ```sql
   -- First find technician_id and stage_id
   INSERT INTO technician_stage_permissions (lab_id, technician_id, stage_id, can_work, can_move_from, can_move_to)
   VALUES ('<lab_id>', '<technician_id>', '<milling_stage_id>', false, false, false);
   ```
2. Log in as that technician
3. Try to move a case to `milling_printing`
4. **Expected:** Move fails with "You are not permitted to move cases to the 'milling printing' stage."

### Test 4: Owner intelligence 2.0

1. Open `/owner`
2. **Expected:**
   - Secondary KPI row shows 5 cards: No Technician, No Price, Awaiting Approval, In QC, Ready for Delivery
   - Recommended Actions shows real warnings (QC queue if cases in QC, delivery queue if cases ready)
   - Lab setup readiness shows correct status for workflow/transitions/tech permissions
   - Stage bottleneck bar chart still loads

### Test 5: Performance — case detail

1. Open any case at `/cases/{id}`
2. Open browser dev tools → Network tab
3. **Expected:** No single request takes > 2 seconds
4. Stage history shows at most 60 entries; timeline shows at most 80; comments at most 100

### Test 6: QC gate (existing gate, verify)

1. Find a case in `quality_control` stage
2. Move it to `ready_for_delivery` WITHOUT a QC check
3. **Expected:** Move fails with "Quality control must pass before ready for delivery."
4. Pass the case in `/quality-control`, then retry
5. **Expected:** Move succeeds

---

## Blocked / Deferred Items

| Item | Status | Reason | Phase |
|------|--------|--------|-------|
| Technician stage permissions admin UI | ⏳ Deferred | No admin UI to create permission rows | Phase 18 |
| `can_work` + `can_move_from` checks | ⏳ Deferred | Only `can_move_to` enforced | Phase 18 |
| Stage requirements admin UI | ⏳ Deferred | No admin UI to create requirement rows | Phase 18 |
| Delivery `blocks_delivery` gate | ⏳ Deferred | Flag exists, not queried | Phase 18 |
| Delivery proof upload UX | ⏳ Deferred | Raw UUID field still shown | Phase 18 |
| "What blocks this case?" case detail section | ⏳ Deferred | Would need case-level blocker query | Phase 18 |
| Case_files + design_versions limits in getCaseDetail | ⏳ Noted | Low risk for pilot | Phase 18 |
| getCaseList cursor pagination | ⏳ Noted | .limit(150) is acceptable for pilot | Phase 18 |
| Production board case load limit | ⏳ Noted | No limit, acceptable for pilot | Phase 18 |

---

## Next Sprint Recommendation

### Phase 18 — Workflow Admin + Staff Permissions UI

**Why it's next:**

Phase 17 enforced technician stage permissions and stage requirements at runtime, but Abbas cannot configure them without direct database access. The highest-leverage next step is building the admin UI that makes these enforcement tables manageable:

1. **Technician stage permissions UI** — matrix view in WorkflowManager or Technicians page:
   - Per-technician, per-stage toggles for `can_work`, `can_move_from`, `can_move_to`
   - Bulk-enable for "standard technician" vs. "specialist" roles

2. **Stage requirements UI** — per-stage requirement flags editor in WorkflowManager:
   - Toggle `requires_files`, `requires_price`, `requires_assigned_technician`, `requires_qc_pass`, `requires_doctor_approval` per stage

3. **Delivery proof upload UX** — replace raw UUID field with proper file upload in `/delivery`

4. **`can_work` enforcement in `startStageAction()`** — add technician permission check to the workspace "Start" button

5. **`blocks_delivery` gate** — add check to delivery dispatch action

**Likely files:**
- `components/master-data/workflow-manager.tsx` — stage requirements editor per stage
- `components/technicians/technician-detail.tsx` — stage permissions matrix
- `app/actions/workflows.ts` — new server actions: `setStageRequirementsAction()`, `setTechnicianStagePermissionAction()`
- `lib/data/workflows.ts` — admin queries for permissions/requirements
- `app/delivery/page.tsx` / `components/delivery/delivery-dashboard.tsx` — proof upload UX
- `app/actions/production.ts` — `startStageAction()` with `can_work` check

**Database needs:** No new tables. Uses `stage_requirements` and `technician_stage_permissions` from migrations 0017/0019.

**Security risks:** Admin UI for permissions must be restricted to `lab_owner`, `lab_manager`, `super_admin` only. RLS already enforces this on writes.

**Acceptance criteria:**
- Lab manager can configure stage requirements via UI without Supabase Studio access
- Lab manager can configure technician permissions via UI without Supabase Studio access
- Delivery proof upload replaces raw UUID field
- `startStageAction()` checks `can_work` permission
- `blocks_delivery` gate enforced in delivery dispatch
- Build, typecheck, lint pass

---

*Phase 17 complete. Enforcement is live. Abbas should test with real case data to verify the fallback behavior (no enforcement when tables are empty) before seeding permission rows.*
