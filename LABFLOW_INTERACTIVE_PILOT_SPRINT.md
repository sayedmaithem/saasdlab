# LabFlow — Interactive Pilot Build Sprint

**Branch:** `phase-16-interactive-pilot-build`  
**Status:** Complete — all 10 workstreams delivered, build clean  
**Preceded by:** `phase-15-operating-core-closure-pass-2`  
**Date:** 2026-05-19

---

## Sprint Goal

Transform LabFlow from a structurally sound skeleton into a visibly usable interactive pilot.
The core objective was to activate the dormant workflow engine and wire every major surface to
real data, so that an Abbas can demo or hand off the system to a real dental lab with zero
placeholder content visible.

---

## Workstream Summary

| # | Workstream | Status | Files Changed |
|---|-----------|--------|---------------|
| WS1 | Activate workflow engine runtime | ✅ Complete | `lib/data/workflows.ts`, `app/actions/production.ts` |
| WS2 | Seed default workflow + stages UI | ✅ Complete | `app/actions/workflows.ts`, `lib/data/workflows.ts`, `components/master-data/workflow-manager.tsx` |
| WS3 | Pilot readiness data + owner section | ✅ Complete | `lib/data/owner.ts`, `app/owner/page.tsx` |
| WS4 | Production board workflow-aware badge | ✅ Complete | `app/production/page.tsx`, `components/production/production-board.tsx` |
| WS5 | Case detail print button upgrade | ✅ Complete | `components/cases/case-detail.tsx` |
| WS6 | Owner CC operational insights | ✅ Previously complete (Phase 15) | — |
| WS7 | Pilot readiness section (integrated into WS3) | ✅ Complete | — |
| WS8 | Technician workspace first-class portal | ✅ Previously complete (Phase 15) | — |
| WS9 | Compatibility bridge stub | ✅ Previously complete (Phase 15) | — |
| WS10 | Documentation + QA | ✅ Complete | `LABFLOW_INTERACTIVE_PILOT_SPRINT.md` |

---

## WS1 — Workflow Engine Runtime Activation

**Problem:** The workflow engine database tables (`lab_workflow_templates`, `lab_workflow_stages`,
`workflow_transitions`) existed with correct schema and RLS since migrations 0017 + 0019, but
were never read by any server action. Stage moves were validated entirely by hardcoded rules in
`lib/production/stage-rules.ts`.

**Solution:** Created `checkWorkflowTransition()` in `lib/data/workflows.ts` (server-only) and
called it from `moveCaseStageAction()` in `app/actions/production.ts`.

**Key design decisions:**

1. **Additive gate, not replacement.** Hardcoded rules in `getTransitionError()` run first.
   Workflow rules run second. If hardcoded rules block the move, the workflow check never runs.
   This preserves all existing production safety gates.

2. **Fail-open on zero transitions (fallback mode).** `checkWorkflowTransition()` counts active
   `workflow_transitions` for the lab. If count = 0, it returns `null` immediately. This means
   labs that haven't configured transitions yet continue using the hardcoded rules with no
   disruption. The workflow engine only activates when transitions are seeded.

3. **Wildcard support.** Transitions with `from_stage_key = '*'` act as catch-alls (e.g.
   any stage → `on_hold`, any stage → `cancelled`). Exact matches take precedence over wildcards.

4. **Role restriction.** If `allowed_roles` array is non-empty, only users with a matching
   role can make the move. Empty `allowed_roles` = all lab members permitted.

5. **Note requirement.** If `requires_note = true` and no `delayReason` is provided, the
   move is blocked with a clear message.

6. **`stage-rules.ts` constraint.** This file is imported by client components
   (`production-board.tsx`, `technician-workspace.tsx`) so it cannot contain Supabase server
   queries. The real validation lives in `lib/data/workflows.ts` (marked `"server-only"`).
   The stub `validateTransitionAgainstWorkflow()` in `stage-rules.ts` remains as a no-op pass-through.

---

## WS2 — Seed Default Workflow + Stages UI

### Server action: `seedDefaultWorkflowAction()`

Located in `app/actions/workflows.ts`. Idempotent — safe to call multiple times.

**What it does:**
1. Checks if any active `lab_workflow_templates` exist for the lab. If yes, exits early.
2. Creates a "Standard Lab Workflow" template (`is_default: true`).
3. Seeds all 18 `productionStages` as `lab_workflow_stages` with sensible gate flags:
   - `cad_design`: `requires_technician`
   - `milling_printing`: `requires_technician`, `requires_doctor_approval`
   - `quality_control`: `requires_technician`, `requires_qc`
4. Seeds linear forward transitions (each stage → next, excluding `on_hold` / `cancelled`).
5. Seeds wildcard transitions:
   - `* → on_hold` (requires_note: true — a reason is required)
   - `* → cancelled` (requires_note: true)
   - `on_hold → received` (re-enter workflow from hold)

**Non-fatal transitions failure:** If the stage seeding succeeds but the transitions insert fails,
the template and stages are still saved and the action returns a partial success message. The lab
can add transitions manually via the Workflow Engine admin UI.

### Data layer: `getLabWorkflowTemplates()` return type upgraded

Changed from `Promise<WorkflowTemplate[]>` to `Promise<WorkflowTemplateWithStages[]>`.
A single batch query fetches all stages for all templates at once (one extra round-trip,
not N round-trips). Stages are filtered client-side by `workflow_id`.

### UI: `WorkflowManager` component upgraded

- **Prop type** updated from `WorkflowTemplate[]` → `WorkflowTemplateWithStages[]`
- **Stages panel** added to each `TemplateRow` — collapsible list showing:
  - Sort order index
  - Stage name
  - Stage key (hidden on mobile)
  - Gate flag badges: Tech, QC, Dr Appr, Blocks
- **Empty state** upgraded: two buttons side-by-side — "New blank template" and
  "Quick setup: seed standard workflow" (calls `seedDefaultWorkflowAction()`)
- **Status message** now color-coded: green border on success, amber on error

---

## WS3 — Pilot Readiness Data + Owner Page Section

### New function: `getPilotReadinessData()`

Located in `lib/data/owner.ts`. Runs 5 Supabase queries in parallel:

| Check | Table | Condition |
|-------|-------|-----------|
| Workflow configured | `lab_workflow_templates` | `is_active = true` |
| Technicians on file | `technicians` | any row for lab |
| Doctors registered | `doctors` | any row for lab |
| Operations catalog | `lab_operations` | `is_active = true` |
| First case created | `cases` | not completed/cancelled/archived |

Returns `passCount`, `totalCount` (always 5), and `allReady` (all 5 pass).

### Owner page section: "Lab setup readiness"

Shown only when not in preview mode. Renders a 5-item checklist grid:
- Passing checks: green `CheckCircle2` icon, label in normal weight
- Failing checks: amber `XCircle` icon, muted label, inline "→ {hint}" link to the relevant page
- Card border turns emerald when all 5 pass

This section is positioned above "Jump to" quick navigation — it's a configuration gate
that disappears naturally once the lab is fully set up.

---

## WS4 — Production Board Workflow-Aware Mode Badge

**Before:** Badge was hardcoded "Fixed enum — 18 stages" with a static configure link.

**After:** Production page fetches `getLabWorkflowSummary()` in parallel with board data.
The badge is now dynamic:

| State | Badge | Link |
|-------|-------|------|
| No custom workflow | `neutral` "Fixed workflow — 18 stages" | "Configure custom workflow →" |
| Custom workflow active | `green` "Custom workflow: {template name}" | No link |

The default workflow name appears inline in the badge when a default template is configured.

---

## WS5 — Case Detail Print Button Upgrade

**Before:** `<a href="/cases/{id}/summary" className="text-xs ...">View case summary →</a>`

**After:** `<Button asChild variant="outline" size="sm"><a href="..."><Printer /> Print summary</a></Button>`

The summary page has existing CSS print styles. The upgrade makes the action more discoverable
and visually consistent with the rest of the case detail action row.

---

## Quality Assurance

All checks run on the `phase-16-interactive-pilot-build` branch after all workstreams were complete:

```
npm run typecheck  → 0 errors
npm run lint       → 0 warnings
npm run build      → ✅ 57 routes compiled, 0 errors
```

### Route inventory (unchanged — all 57 routes clean)

Confirmed routes include:
- `/owner` — operational + pilot readiness dashboard
- `/production` — workflow-aware Kanban board
- `/command-center/master-data/workflows` — workflow engine admin with seed button + stages view
- `/cases/[id]` — case detail with print button
- All other routes from previous phases preserved

---

## Backwards Compatibility

All changes are strictly additive or default-preserving:

| Change | Compatibility guarantee |
|--------|------------------------|
| `checkWorkflowTransition()` returns null when no transitions | Existing labs see zero behavior change |
| `seedDefaultWorkflowAction()` has idempotency check | Safe to run multiple times, no duplicate data |
| `getLabWorkflowTemplates()` now returns `WorkflowTemplateWithStages[]` | WorkflowManager updated to match |
| `ProductionBoard` new props are optional with defaults | No other callers break |
| Case detail print button | Visual upgrade only, same target URL |

---

## What Gets Activated When Abbas Runs Quick Setup

1. Click "Quick setup: seed standard workflow" on `/command-center/master-data/workflows`
2. Confirm the dialog
3. Server creates:
   - 1 workflow template (`Standard Lab Workflow`, `is_default: true`)
   - 18 stages (all `productionStages` with sensible gate flags)
   - 17 linear forward transitions + 3 wildcard transitions (`→ on_hold`, `→ cancelled`, `on_hold → received`)
4. Production board badge changes from "Fixed workflow — 18 stages" → "Custom workflow: Standard Lab Workflow"
5. `moveCaseStageAction()` now validates moves against `workflow_transitions`
6. `/owner` workflow readiness check turns green
7. Any future stage moves that don't match a configured transition are blocked with a clear error message

---

## Deferred from This Sprint

| Item | Reason | Notes |
|------|--------|-------|
| Stage requirements (`stage_requirements` table) | Schema exists, runtime not activated | Post-launch cleanup |
| Technician stage permissions | Schema exists, runtime not activated | Post-launch cleanup |
| Production board column order from `lab_workflow_stages.sort_order` | Board still uses hardcoded `kanbanStages` | Low risk — standard order matches default workflow |
| Workflow transition editor UI | Create/edit/delete individual transitions | Lab manager can seed; editor is Phase 17+ |
| Doctor portal stage visibility | Show/hide stages in doctor view | Phase 17+ |

---

*Phase 16 complete.*  
*Next: Phase 17 — Workflow Transition Editor + Technician Stage Permissions UI*
