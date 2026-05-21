# ODENT Pilot Final Checklist

**Lab:** ODENT Lab  
**Date:** 2026-05-20  
**Sprint:** Final Productization Mega Sprint  
**Tester:** Abbas (lab owner)

---

## How to run this checklist

Open the app locally:
```
npm run dev
```

Then follow each step in order. The expected result column tells you what you should see.
The "Known limitation" column tells you what is not yet implemented and is safe to skip.

---

## Step 1 — Open /owner (Operations HQ)

**URL:** `/owner`

| Check | Expected result |
|-------|----------------|
| Page loads | Premium header with lab name + "Operations HQ" eyebrow |
| Live snapshot | 4 KPI cards: Active cases, Overdue, Due today, Outstanding |
| Secondary KPIs | 5 cards: No technician, No price, Awaiting approval, In QC, Ready for delivery |
| Recommended actions | InsightCards appear for any real problems (or "Lab is running clean") |
| Stage bottlenecks | Bar chart showing which stages have the most cases (if any) |
| Overdue cases table | Table lists overdue cases with links to case detail |
| Lab setup readiness | 5 checklist items (workflow, technicians, doctors, operations, first case) |
| Quick access | 8 navigation cards: Production, QC, Delivery, Cases, Technicians, Finance, Reports, Master Data |

**Known limitations:** Outstanding balance will show 0 if no invoices exist yet. That is correct behavior.

---

## Step 2 — Check setup readiness

From `/owner`, check the "Lab setup readiness" section.

| Check | Expected result |
|-------|----------------|
| Workflow configured | ✓ if Standard Lab Workflow was seeded |
| Technicians on file | ✓ if at least one technician record exists |
| Doctors registered | ✓ if at least one doctor record exists |
| Operations catalog | ✓ if operations were configured in Master Data |
| First case created | ✓ if at least one active case exists |

**If any check fails:** Click the action link next to it. Each link takes you directly to the setup page.

---

## Step 3 — Seed or verify workflow

**URL:** `/command-center/master-data/workflows`

| Check | Expected result |
|-------|----------------|
| Page loads | "Workflow Engine" heading, mode indicator |
| Workflow exists | "Standard Lab Workflow" card with "Default" badge |
| If no workflow | Click "Quick setup: seed standard workflow" |
| After seed | 18 stages listed, workflow mode badge turns green |

**Action:** Click "Quick setup" if no workflow exists. Confirm the dialog.

---

## Step 4 — Configure stage requirements

From the Workflow Engine page:

| Check | Expected result |
|-------|----------------|
| Expand a template | Click the stage count button to expand stage list |
| Expand a stage | Click "Entry requirements" to open the requirements editor |
| Toggle a requirement | Check "Requires assigned technician" for the QC stage |
| Save requirements | Click "Save requirements" — green confirmation message |
| Requirement badge | "configured" amber badge appears on the stage |

**Purpose:** These requirements will be enforced when moving cases to that stage.

---

## Step 5 — Configure technician stage permissions

**URL:** `/command-center/master-data/technician-stage-permissions`

| Check | Expected result |
|-------|----------------|
| Page loads | Activation notice + technician list |
| If no workflow | Message to set up workflow first |
| If no technicians with portal | Message to add portal accounts |
| Expand a technician | Click to see per-stage permission rows |
| Toggle a permission | Uncheck "Work" for a stage, click Save |
| Save feedback | Green checkmark appears on the saved row |

**Note:** Until at least one permission row is saved, the enforcement engine is in fallback mode (all technicians can access all stages). Once any row is saved, enforcement activates for the entire lab.

---

## Step 6 — Create or open a case

**URL:** `/cases/new` (or open an existing case)

| Check | Expected result |
|-------|----------------|
| Form loads | All fields visible: doctor, patient, work type, material, shade, teeth, due date |
| Urgency toggle | Can mark as urgent |
| Submit | Redirects to the new case detail page |
| Case detail | Shows full case info, stage badge, assigned technician, files section |
| Missing info banner | Appears if case has missing_info_status ≠ complete |

---

## Step 7 — Print case sheet

**URL:** `/cases/[id]/summary`

| Check | Expected result |
|-------|----------------|
| Navigate from case | Click "Print summary" button on case detail page |
| Sheet loads | Clean two-column layout with all case details |
| QR placeholder | Shows as dashed box with case number (real QR requires library) |
| Print button | "Print / Save PDF" button triggers browser print dialog |
| Print layout | Sidebar disappears, footer says "For internal use only" |
| Missing info banner | Shown prominently if case has missing info |

---

## Step 8 — Open production board

**URL:** `/production`

| Check | Expected result |
|-------|----------------|
| Board loads | Kanban with 15 stages visible, horizontal scroll |
| Workflow mode badge | "Fixed enum (default)" or "Custom workflow: [name]" |
| Case cards | Show case number, doctor, patient, work type, due risk badge |
| Assign technician | Dropdown to assign a technician to a case |
| Quick move | ← and → buttons to move a case to adjacent stages |
| Full move | Stage select + Move button for any-stage moves |
| Bottleneck column | Amber highlight on the stage with the most cases |

---

## Step 9 — Move a case to a valid stage

From the production board:

| Check | Expected result |
|-------|----------------|
| Move forward | Case moves to next stage, board updates |
| Move back | Case moves back, delay reason input appears if overdue |
| Success message | Green confirmation text at top of board |

---

## Step 10 — Try an invalid move

From the production board, try to:
- Move a case with missing info from `received` → `information_check` — should be blocked with clear message
- Move a case past QC without a passed QC result — should show error

| Check | Expected result |
|-------|----------------|
| Blocked move | Error message appears at top: clear human-readable reason |
| Case stays in place | Board state reverts to original after failed drag |

---

## Step 11 — Open technician workspace

**URL:** `/technicians/workspace`

**Note:** Must be logged in as a technician-role user, OR use preview mode.

| Check | Expected result |
|-------|----------------|
| Topbar | Shows technician's name as page title |
| 4 KPI cards | Assigned, Overdue, Due Today, QC Pass Rate |
| Queue ordered | Overdue first, then due today, then by priority |
| "Work on this next" | First card is highlighted with primary color badge |
| Print link | Small "Sheet" link on each case card → opens summary |
| Start work button | "Start work" submits startStageAction |
| Complete button | "Complete" submits completeStageAction |
| Report problem | Input + submit for addProductionProblemAction |
| Empty state | "Queue is clear" message if no cases assigned |

---

## Step 12 — Quality Control flow

**URL:** `/quality-control`

| Check | Expected result |
|-------|----------------|
| Page loads | "Quality Control" heading, 3 KPI cards |
| KPI cards | Awaiting inspection count, Overdue risk, Needs adjustment |
| Case cards | Each case shows: case number, patient, doctor, technician, work type, due date |
| QC form expand | Click "Submit QC inspection" to open form |
| Checklist | Items specific to the case's work type (Zirconia, E-max, Implant, Generic) |
| Result selection | Pass / Needs Adjustment / Fail radio buttons |
| Submit Pass | On pass: case moves to ready_for_delivery |
| Submit Needs Adj. | On needs_adjustment: case returns to previous stage + requires notes |
| Submit Fail | On fail: case goes on_hold, notes required |
| Empty state | "QC queue is clear" with link to production board |

---

## Step 13 — Delivery flow

**URL:** `/delivery`

| Check | Expected result |
|-------|----------------|
| Page loads | Delivery queue with tabs (ready, assigned, out, delivered, failed) |
| Assign action | Select delivery person, click Assign |
| No raw UUID field | Proof file field has been removed (note says to use case file manager) |
| QC gate | Attempting to assign a case that hasn't passed QC → error message |
| blocks_delivery gate | Cases in stages flagged blocks_delivery → blocked from delivery assignment |
| Mark delivered | Sets case to delivered, records timestamp |

---

## Step 14 — Check finance readiness

**URL:** `/invoices`

| Check | Expected result |
|-------|----------------|
| Page loads | Invoice list (may be empty for new lab) |
| Role gate | Only lab_owner, super_admin, accountant can access |
| Create invoice | `/invoices/new` — select doctor, add line items |
| Doctor statement | `/doctors/[id]/statement` — shows outstanding balance |

**Known limitation:** Finance module is functional but reporting is basic. Full profit/margin analytics requires technician rates to be configured in Master Data.

---

## Step 15 — Check Platform HQ (as super_admin)

**URL:** `/hq`

| Check | Expected result |
|-------|----------------|
| Route guard | Must be super_admin — other roles redirected |
| Active labs | Count of tenant labs |
| Total users | Count of all staff profiles |
| Migrations | Number of SQL migration files |
| Registered labs | List with lab ID and creation date |
| HQ modules | 6 "Coming soon" cards clearly marked |
| No fake data | All numbers are real counts or explicitly placeholder |

---

## Step 16 — Final security spot checks

| Check | Expected result |
|-------|----------------|
| Doctor portal isolation | `/doctor-portal` shows only that doctor's cases and invoices |
| Finance not visible to technician | Technician user cannot navigate to /invoices |
| Internal comments hidden | Doctor portal case detail does NOT show internal comments |
| Technician can't see management | Technician sidebar shows only: Cases, Production, QC, My Workspace |
| .env not committed | `git status` shows .env.local in .gitignore, not tracked |

---

## Known Limitations (do not report as bugs)

| Area | Limitation |
|------|-----------|
| QR codes on case sheet | Placeholder only — requires qrcode library integration |
| Proof file on delivery | Removed raw UUID input — use case file manager post-dispatch |
| Finance reporting | Basic — profit/margin requires all technician rates configured |
| Drag-drop on mobile | Kanban drag-drop is desktop-only (@hello-pangea/dnd limitation) |
| Email notifications | Not yet implemented — no email on case status changes |
| Design approvals | Doctor approval flow requires doctor portal account and design_approvals table |
| Audit log | Platform-level event stream is "Coming soon" |
| Feature flags | "Coming soon" — no runtime feature toggles yet |

---

## Post-pilot next steps

1. Run the ODENT Pilot Bug Bash (capture real issues from live use)
2. Implement Finance Core 2.0 (invoicing improvements, statements, technician cost reporting)
3. Doctor Portal improvements (notifications, approval UX)
4. Automation event layer (webhooks, stage-change notifications)
5. Mobile-optimized technician workspace

---

*Generated as part of the LabFlow Final Productization Mega Sprint — 2026-05-20*
