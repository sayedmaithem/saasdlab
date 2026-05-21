# LabFlow Phase 18 — Workflow Admin + Staff Permissions UI

**Sprint date:** 2026-05-20  
**Branch:** `phase-18-workflow-admin-permissions-ui`  
**Build status:** ✅ Clean — 0 errors, 0 warnings, 54 routes

---

## Summary

Phase 18 completes the Workflow Engine story started in Phase 16/17.  
It adds the missing UI and enforcement surfaces:

| # | Workstream | Status |
|---|-----------|--------|
| WS1 | Stage Requirements Editor in WorkflowManager | ✅ Complete |
| WS2 | Technician Stage Permissions Matrix page | ✅ Complete |
| WS3 | `can_work` enforcement in `startStageAction()` | ✅ Complete |
| WS4 | Delivery proof upload UX cleanup | ✅ Complete |
| WS5 | `blocks_delivery` gate in `updateDeliveryAction()` | ✅ Complete |
| WS6 | Owner page: tech permissions link fix | ✅ Complete |
| WS7 | Master Data nav card for stage permissions | ✅ Complete |
| WS8 | Documentation + QA (typecheck, lint, build) | ✅ Complete |

---

## WS1 — Stage Requirements Editor

**File:** `components/master-data/workflow-manager.tsx`

Added `StageRequirementsEditor` — a collapsible form rendered per stage inside `StagesPanel`.  
Each stage can have 5 requirement flags toggled on/off:

| Flag | Enforcement |
|------|------------|
| `requires_assigned_technician` | Case must have a technician assigned |
| `requires_price` | Case must have `total_price > 0` |
| `requires_files` | At least one `case_files` row must exist |
| `requires_qc_pass` | Latest `quality_checks.result` must be `"passed"` |
| `requires_doctor_approval` | `design_approvals.status = "approved"` (only if `case.requires_doctor_approval = true`) |

`StagesPanel` now accepts `workflowId`, `canManage`, `onMessage` props so it can render the editor per stage and submit requirements via `upsertStageRequirementsAction`.

**Gate behavior:**  
- If no `stage_requirements` row exists for a stage → no requirements checked (fallback)
- Requirements are enforced in `moveCaseStageAction()` via `checkStageRequirements()`

---

## WS2 — Technician Stage Permissions Matrix

**Files:**
- `components/master-data/technician-permissions-matrix.tsx` ← new
- `app/command-center/master-data/technician-stage-permissions/page.tsx` ← new

New admin page accessible at `/command-center/master-data/technician-stage-permissions`.

**UI structure:**
- Per-technician accordion with summary badge ("All stages open" or "N stages restricted")
- Per-stage rows with 3 toggles: **Work**, **Move from**, **Move to**
- Each row saves independently via `upsertTechnicianStagePermissionAction`
- Read-only badge view for non-managers

**Access control:** `lab_owner`, `lab_manager`, `super_admin` only.

**Activation warning shown:** Once any permission row is saved for the lab, the enforcement engine activates for all technicians (fallback → enforced).

---

## WS3 — `can_work` enforcement in `startStageAction()`

**File:** `app/actions/production.ts`

After the assignment check, added:

```ts
if (session.roles.includes("technician")) {
  const techPermError = await checkTechnicianStagePermission({
    labId: session.activeLabId,
    technicianProfileId: session.userId,
    toStageKey: currentStage,
    action: "can_work",
  });
  if (techPermError) return { ok: false, message: techPermError };
}
```

Now the full technician gate coverage is:

| Action | Gate checked |
|--------|-------------|
| `moveCaseStageAction()` | `can_move_to` (Phase 17) |
| `startStageAction()` | `can_work` (Phase 18) |

---

## WS4 — Delivery Proof Upload UX

**File:** `components/delivery/delivery-dashboard.tsx`

**Removed:** raw `<Input name="proofFileId" placeholder="Proof file UUID" />` field.  
Proof file attachment is now handled via the case file manager (post-dispatch).

**Added:** informational note + improved placeholder text on the failure reason and notes fields.

---

## WS5 — `blocks_delivery` Gate

**File:** `app/actions/delivery.ts`

Added a `blocks_delivery` check on the `"assign"` action (initial delivery assignment).

**Logic:**
1. Fetch the case's `current_stage`
2. Query `lab_workflow_stages` for a row with `stage_key = current_stage AND blocks_delivery = true AND is_active = true`
3. If found → block delivery with a clear message
4. If no workflow configured → fallback (pass through)

**Gate position:** After QC check, before status calculation.  
**Only active on:** `action === "assign"` — subsequent updates (out, delivered, failed) are unaffected.

---

## WS6 — Owner Page Link Fix

**File:** `app/owner/page.tsx`

Updated the "Technician stage permissions not configured" InsightCard action:

```diff
- action={{ label: "Workflow engine", href: "/command-center/master-data/workflows" }}
+ action={{ label: "Configure stage permissions", href: "/command-center/master-data/technician-stage-permissions" }}
```

The link now goes directly to the new permissions matrix page instead of the general workflow engine.

---

## WS7 — Master Data Navigation

**File:** `app/command-center/master-data/page.tsx`

Added "Technician Stage Permissions" card at the end of the CARDS array:

```ts
{
  title: "Technician Stage Permissions",
  description: "Control which workflow stages each technician can work on and move cases between...",
  href: "/command-center/master-data/technician-stage-permissions",
  icon: ShieldCheck,
  status: "ready",
  cta: "Configure permissions",
}
```

---

## Enforcement Architecture (Complete as of Phase 18)

Every production stage transition now passes through **5 sequential gates**:

```
moveCaseStageAction()
  │
  1. getTransitionError()          ← hardcoded rules (missing info, QC, doctor approval)
  2. checkWorkflowTransition()     ← workflow engine (transitions table)
  3. checkTechnicianStagePermission(can_move_to) ← per-technician gate
  4. checkStageRequirements()      ← per-stage entry requirements
  5. hasApprovedDesign()           ← legacy doctor approval gate (milling only)

startStageAction()
  │
  1. assigned_technician_id check  ← only assigned technician can start
  2. checkTechnicianStagePermission(can_work) ← new in Phase 18

updateDeliveryAction()
  │
  1. hasPassedQc()                 ← QC must be passed
  2. blocks_delivery stage check   ← new in Phase 18 (assign only)
```

**Fallback guarantee:** Every additive gate returns `null` (permit) when the lab has no rows configured for that table. Zero disruption for labs without custom workflow/permissions setup.

---

## Database Tables Used (Phases 16–18)

| Table | Purpose |
|-------|---------|
| `lab_workflow_templates` | Custom workflow templates per lab |
| `lab_workflow_stages` | Ordered stages within each template |
| `workflow_transitions` | Allowed from→to moves (runtime enforcement) |
| `stage_requirements` | Per-stage entry requirements (Phase 18) |
| `technician_stage_permissions` | Per-technician per-stage capabilities (Phase 17/18) |

---

## QA Checklist

- [x] `npm run typecheck` — 0 errors
- [x] `npm run lint` — 0 errors, 0 warnings
- [x] `npm run build` — clean, 54 routes
- [x] New route `/command-center/master-data/technician-stage-permissions` appears in build output
- [x] `TemplateRow` passes correct props to `StagesPanel` (workflowId, canManage, onMessage)
- [x] `StageRequirementsEditor` collapses/shows based on `canManage`
- [x] `TechnicianPermissionsMatrix` handles no-workflow and no-technician empty states
- [x] `can_work` gate in `startStageAction` is role-guarded (technician only)
- [x] `blocks_delivery` gate only runs on `action === "assign"` 
- [x] Owner page InsightCard links to the correct permissions page
- [x] Master Data nav card links to the new page
- [x] Raw UUID proof field removed from delivery dashboard

---

*Phase 18 complete. The full Workflow Engine + Staff Permissions stack is now production-ready.*
