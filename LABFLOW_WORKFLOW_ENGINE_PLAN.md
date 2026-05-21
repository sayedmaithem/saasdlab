# LabFlow — Workflow Engine Plan

**Status:** Phase 15 — Schema exists, runtime disconnected  
**Target phase:** Phase 16 — True Workflow Engine Integration  
**Author:** LabFlow Engineering War Room

---

## Current Status (Phase 15)

### What is running today

The production board runs on a **hardcoded 18-stage fixed enum** defined in
`lib/constants/workflow.ts → productionStages`. Stage movement is validated
server-side by `getTransitionError()` in `lib/production/stage-rules.ts` using
hard-coded rules:

1. Role check: only managers or the assigned technician can move a case
2. Missing info gate: cases with `missingInfoStatus !== "complete"` cannot leave production without manager override
3. QC gate: `ready_for_delivery` requires a passed QC check
4. Overdue gate: overdue cases require a delay reason
5. Doctor approval gate: specific stages check `requires_doctor_approval` flag

Every successful move writes to `case_stage_logs` and `case_timeline`. These
are the only workflow-related tables actively written to.

### What exists in the database but is disconnected

All tables from migrations 0017 and 0019 exist with proper RLS and grants
but are not read by any server action:

```
lab_workflow_templates       — named workflow per lab (EMPTY)
lab_workflow_stages          — ordered stage list per template (EMPTY)
technician_stage_permissions — per-technician stage access (EMPTY)
workflow_transitions         — allowed from→to pairs (EMPTY)
stage_requirements           — per-stage entry gates (EMPTY)
```

---

## Existing Stage / Status Model

### `cases` table fields

| Column | Type | Purpose |
|--------|------|---------|
| `current_stage` | `text` (public.case_stage enum) | Primary stage field used by production board |
| `stage` | `text` | Legacy fallback; code reads `current_stage ?? stage` |
| `status` | `text` | High-level case status (`open`, `active`, `completed`, etc.) |
| `missing_info_status` | `text` | Missing information gate (`complete`, `missing`, `requested`, `received`) |
| `requires_doctor_approval` | `boolean` | Triggers doctor approval gate on certain stage moves |
| `assigned_technician_id` | `uuid` | References `profiles.id` of the assigned technician |

### Stage enum (`public.case_stage`)

18 fixed values: `received`, `information_check`, `waiting_doctor_info`,
`cad_design`, `design_review`, `doctor_approval`, `milling_printing`, `try_in`,
`coloring`, `furnace`, `polishing`, `quality_control`, `ready_for_delivery`,
`out_for_delivery`, `delivered`, `completed`, `on_hold`, `cancelled`

### `case_stage_logs` table

Written by `moveCaseStageAction` on every successful stage move:

| Column | Content |
|--------|---------|
| `id` | UUID primary key |
| `lab_id` | Tenant scope |
| `case_id` | FK to cases |
| `from_stage` | Previous stage key |
| `to_stage` | New stage key |
| `changed_by` | Actor profile UUID |
| `moved_by` | Actor profile UUID (duplicate for audit clarity) |
| `notes` | Transition title or custom note |
| `delay_reason` | Required for overdue moves |
| `started_at` | Timestamp of move |
| `completed_at` | Same as `started_at` in current model |
| `created_at` | Auto timestamp |

This table is the audit log of all production movements. It is displayed in
the case detail (`/cases/[id]`) and case summary sheet (`/cases/[id]/summary`).

---

## Target Workflow Engine Schema

### Layer 1 — Workflow Definition (already exists)

```sql
lab_workflow_templates (id, lab_id, name, is_default, is_active)
lab_workflow_stages    (id, lab_id, workflow_id, stage_key, name, sort_order,
                        requires_technician, requires_qc, requires_doctor_approval,
                        blocks_delivery, is_active)
```

### Layer 2 — Transition Rules (already exists)

```sql
workflow_transitions (id, lab_id, workflow_id, from_stage_key, to_stage_key,
                      allowed_roles[], requires_note, is_active)
stage_requirements   (id, lab_id, workflow_id, stage_key,
                      requires_files, requires_price,
                      requires_assigned_technician,
                      requires_qc_pass, requires_doctor_approval)
```

### Layer 3 — Technician Permissions (already exists)

```sql
technician_stage_permissions (id, lab_id, technician_id, stage_id,
                               can_work, can_move_from, can_move_to)
```

All tables have lab-scoped RLS. No new tables are needed for Phase 16.

---

## Migration Strategy

### Phase 15 (current)
- All tables exist with correct schema and RLS
- No data seeded — tables are empty
- Production board uses hardcoded enum
- `moveCaseStageAction` uses `getTransitionError()` hardcoded rules

### Phase 16 — Activation plan

#### Step 1: Admin UI for workflow creation
**File:** `app/command-center/master-data/workflows/` pages  
Create a UI that allows lab owners to:
- Create a workflow template (`lab_workflow_templates`)
- Add stages with `sort_order` and gate flags (`lab_workflow_stages`)
- Define transitions between stages (`workflow_transitions`)
- Set stage requirements (`stage_requirements`)

#### Step 2: Idempotent default workflow seeder
A server action (or migration) that, for labs with no active workflow:
- Creates a default template named "Standard Workflow"
- Seeds all 18 stages with sensible defaults
- Seeds the most common transitions (linear, forward-only)
- Marks `is_default = true`

This seeder must be **idempotent** — safe to run multiple times, checks if workflow already exists before inserting.

#### Step 3: Activate `validateTransitionAgainstWorkflow()`
**File:** `lib/production/stage-rules.ts`  
Replace the stub body with real logic:
```ts
// 1. Fetch the lab's active workflow template
// 2. Look up workflow_transitions for (from_stage, to_stage)
// 3. If no transition row: return "This transition is not permitted by your workflow"
// 4. If allowed_roles non-empty and user role not in list: return "Your role cannot make this move"
// 5. If requires_note and no note provided: return "A note is required for this transition"
// 6. Check stage_requirements for target stage
```

#### Step 4: Call the bridge from `moveCaseStageAction`
**File:** `app/actions/production.ts`  
After `getTransitionError()` passes, call `validateTransitionAgainstWorkflow()`.
If it returns a string, return that error immediately.

This preserves full backwards compatibility — hardcoded rules still run first,
workflow rules run second as an additive gate.

#### Step 5: Update production board to use workflow stage order
**File:** `lib/data/production.ts` → `getProductionBoardData()`  
Optionally: query `lab_workflow_stages` for the lab's active workflow to determine
column order instead of using the hardcoded `kanbanStages` array.
Fallback to `kanbanStages` if no workflow is configured.

---

## Compatibility Bridge

**File:** `lib/production/stage-rules.ts`  
**Function:** `validateTransitionAgainstWorkflow(params: WorkflowTransitionCheckParams)`

Current behavior: returns `null` always (no-op pass-through).  
Phase 16 behavior: queries `workflow_transitions` and returns error string or null.

The bridge exists so the activation is a single-function replacement, not
a cross-file refactor.

```ts
// Phase 15 (now): stub
export function validateTransitionAgainstWorkflow(_params) {
  return null; // pass-through
}

// Phase 16: real implementation
export async function validateTransitionAgainstWorkflow(params) {
  const { data } = await supabase
    .from("workflow_transitions")
    .select("id, allowed_roles, requires_note")
    .eq("lab_id", params.labId)
    .eq("from_stage_key", params.fromStage)
    .eq("to_stage_key", params.toStage)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return "This transition is not permitted by your workflow.";
  if (data.allowed_roles.length > 0 && !params.roles.some(r => data.allowed_roles.includes(r)))
    return "Your role cannot make this transition.";
  if (data.requires_note && !params.hasNote)
    return "A note is required for this transition.";
  return null;
}
```

---

## RLS / Security Requirements

All workflow tables already have correct RLS:
- `SELECT`: any authenticated lab member
- `INSERT / UPDATE / DELETE`: lab_owner, lab_manager, super_admin only

Phase 16 must:
- Never expose workflow config to doctor role
- Never expose `technician_stage_permissions` to delivery role
- Ensure `allowed_roles` validation happens server-side only (never client-gated)
- Validate `lab_id` on every write — the `with check` RLS clauses already enforce this

No RLS changes are needed for Phase 16.

---

## Production Board Integration Plan

| Change | Impact | Risk |
|--------|--------|------|
| Column order from `lab_workflow_stages.sort_order` | Board shows lab-configured stages | Medium — fallback to hardcoded if no workflow |
| Filter board to only `lab_workflow_stages.is_active = true` | Hides disabled stages | Low — only affects labs with configured workflow |
| Drag-and-drop still calls `moveCaseStageAction` | No change to DnD | None |
| `validateTransitionAgainstWorkflow` blocks invalid DnD moves | Move rejected server-side, UI reverts | Low — existing revert logic in `onDragEnd` handles `result.ok === false` |

The production board already handles `result.ok === false` by reverting
the optimistic local state. No frontend changes needed for Phase 16 workflow validation.

---

## Staff Workspace Integration Plan

| Change | Impact |
|--------|--------|
| `getTechnicianWorkspaceData` filters cases by `technician_stage_permissions.can_work = true` | Technician only sees cases they are permitted to work |
| `startStageAction` checks `can_work` permission | Prevents start if not permitted |
| `completeStageAction` checks `can_move_from` permission | Prevents completion if not permitted |

These changes are Phase 16+. Current model: any assigned technician can work any stage.

---

## Acceptance Criteria for True Workflow Engine Completion

Phase 16 is complete only when:

- [ ] Lab owner can create a custom workflow template with named stages
- [ ] Lab owner can define allowed transitions between stages
- [ ] Lab owner can set stage requirements (files, price, technician, QC, approval)
- [ ] `moveCaseStageAction` queries `workflow_transitions` and rejects invalid moves
- [ ] Production board can display lab-configured stages (not only hardcoded enum)
- [ ] Technician stage permissions are checked before allowing work
- [ ] `/owner` workflow readiness warning disappears after a workflow is configured
- [ ] At least one lab has an end-to-end configured workflow that matches their real process
- [ ] Typecheck, lint, and build pass with zero errors
- [ ] No existing case is disrupted by the workflow activation

---

## Deferred Items (Post Phase 16)

| Item | Notes |
|------|-------|
| Workflow versioning | Cases record which workflow version they were created under |
| Workflow migration for in-flight cases | Cases mid-production when workflow changes |
| Multi-workflow support per lab | Different workflows for different case types |
| Webhook / event triggers on stage entry/exit | Automation layer (Phase 18+) |
| Doctor portal stage visibility config | Show/hide stages from doctor view |

---

*Created: 2026-05-19*  
*Branch: `phase-15-operating-core-closure-pass-2`*
