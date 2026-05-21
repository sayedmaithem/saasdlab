# LabFlow Product Architecture Reset
## Dental Lab Operating System + SaaS Founder HQ

> Written: 2026-05-18 — Pre-implementation reset.
> This is the definitive architecture document. All future implementation decisions must be checked against it.

---

## A. Product Truth

### What LabFlow Is

LabFlow is a **Dental Lab Operating System** — a vertical SaaS product that manages the complete lifecycle of a dental lab:

- Case intake → production → QC → delivery → invoicing
- Doctor relationships, communication, and digital approvals
- Technician scheduling, workload, and performance
- Financial tracking: invoices, payments, balances, statements
- Lab configuration: workflows, pricing, catalog, permissions

LabFlow is **multi-tenant** (one platform, many labs). Each lab is fully isolated. No data ever crosses lab boundaries.

The platform owner (Abbas / ODENT / Sayed) operates a **SaaS Founder HQ** — a separate zone for managing the platform itself: tenants, billing, onboarding, system health, support, automations, and AI agents.

### What LabFlow Is NOT

- ❌ Not a generic CRM
- ❌ Not a project management tool
- ❌ Not a dental clinic/practice management system (that's the doctor's world, not the lab's)
- ❌ Not an EHR (Electronic Health Record) — we store patient names, not clinical records
- ❌ Not a general-purpose workflow builder like Notion or Monday

### Why "CRM" Is the Wrong Framing

Calling LabFlow a "CRM" frames it around doctor relationships. That is one module among 12. The correct frame is:

> LabFlow is the operating system of a dental lab. The lab runs on LabFlow. Not in it.

A CRM is a side tool. An Operating System is the mission-critical core. Every case, every invoice, every technician assignment, every QC gate — LabFlow owns all of it.

### The Correct Framing

| Layer | What it is |
|-------|-----------|
| **LabFlow OS** | The dental lab operating system — every lab runs on it |
| **SaaS Founder HQ** (`/hq`) | Platform owner controls: tenants, billing, system, automations |
| **Lab Owner Command Center** (`/owner`) | Real-time lab ops: workload, risks, bottlenecks, actions |
| **Production Zone** (`/production`) | Kanban + stage management for lab managers and technicians |
| **Doctor Portal** (`/doctor-portal`) | Self-service case submission and tracking for doctors |
| **Technician Workspace** (`/technicians/workspace`) | Queue, actions, productivity for bench technicians |
| **Finance Zone** (`/finance`) | Invoices, payments, statements — finance-role gated |

---

## B. User Layers

### 1. SaaS Owner / Platform Owner
**Who:** Abbas, ODENT founders, future platform team.
**Zone:** `/hq`
**Needs:**
- View and manage all labs (tenants)
- Monitor usage, storage, trial status
- Manage subscriptions and billing
- View system-wide health (DB, storage, auth, queues)
- Manage support issues
- Configure AI agents and automations
- Control feature flags per lab
- Access audit logs
- Manage onboarding templates

**Critical constraint:** SaaS owner sees tenant metadata, NOT tenant lab data. Never reads patient cases from another lab.

---

### 2. Lab Owner
**Who:** The person who runs the dental lab. Controls everything within their lab.
**Zone:** `/owner` (new, focused, real-time) + full app access
**Needs:**
- Real-time operational dashboard: workload, overdue, bottlenecks
- Doctor relationship management
- Finance: revenue, unpaid, overdue
- Hiring decisions: technician capacity, performance
- Pricing and catalog management
- Workflow configuration
- Portal access control

---

### 3. Lab Manager
**Who:** Operations manager inside the lab. Day-to-day production oversight.
**Zone:** `/production`, `/cases`, `/owner` (read-only financial)
**Needs:**
- Production board (Kanban)
- Technician assignment and rebalancing
- Stage movement oversight
- QC gate management
- Missing info triage

---

### 4. Reception
**Who:** Front desk. Receives cases, handles doctor communication.
**Zone:** `/cases` (limited), `/doctors`
**Needs:**
- New case intake
- Missing information management
- Doctor communication
- Case status updates (no production movement)

---

### 5. Technician
**Who:** The person doing the dental work. Works at a bench.
**Zone:** `/technicians/workspace` (primary), `/cases` (read-only detail)
**Needs:**
- Personal work queue ordered by priority and due date
- Stage start/complete actions
- Problem reporting
- Design upload (CAD files)
- Productivity stats

**Critical constraint:** Technicians NEVER see finance.

---

### 6. Doctor
**Who:** External dental practitioner sending cases to the lab.
**Zone:** `/doctor-portal` exclusively
**Needs:**
- Submit new cases
- Track case status
- View/download completed files
- View their own statement
- Approve designs (when required)

**Critical constraint:** Doctors NEVER see other doctors' cases. Never see internal notes. Never see lab finances.

---

### 7. Accountant
**Who:** Lab's finance person. May be external.
**Zone:** `/finance`, `/invoices`, `/payments`, case read-only
**Needs:**
- Create and manage invoices
- Record payments
- Generate doctor statements
- View outstanding balances
- Finance reports

**Critical constraint:** Accountants CANNOT move production stages.

---

### 8. Delivery
**Who:** Person delivering completed lab work to clinics.
**Zone:** `/delivery`
**Needs:**
- Today's delivery list
- Mark cases delivered
- Upload delivery proof

**Critical constraint:** Delivery users NEVER see finance.

---

## C. Required App Zones

### Current Zone Reality vs. Required

| Zone | Current State | Required State |
|------|--------------|----------------|
| `/hq` | **MISSING** | SaaS Owner HQ — tenant management, billing, system health |
| `/owner` | **MISSING** | Lab Owner Command Center — real operational intelligence |
| `/command-center` | **REWORK NEEDED** — mixed developer/owner concerns | Redirect to `/owner` for lab ops; `/hq` for platform ops |
| `/dashboard` | Thin — preview data + basic KPIs | Fold into `/owner` OR make it the default landing after login |
| `/cases` | Good — real data, filter, detail | Keep; add inline status actions |
| `/cases/[id]/summary` | New — printable sheet | Keep |
| `/production` | Good — Kanban with real data | Keep; add workflow awareness |
| `/doctor-portal` | Good — real submit, track, statement | Keep; improve empty states |
| `/technicians/workspace` | Good — real queue | Keep |
| `/finance` (invoices + payments) | Real data | Keep; improve with Finance CC |
| `/command-center/finance` | New skeleton | Merge into `/owner` finance panel |
| `/reports` | Real queries, thin UI | Expand; make `/owner/reports` |
| `/settings` | Exists — unknown depth | Audit; merge with `/owner/settings` |
| `/clinics` | Real data | Keep |
| `/doctors` | Real data | Keep |
| `/technicians` | Real data | Keep |
| `/delivery` | Real data | Keep |
| `/quality-control` | Real data | Keep |
| `/remakes` | Real data | Keep |

### Zone Definitions

#### `/hq` — SaaS Founder Headquarters
Access: `super_admin` role only.
```
/hq                    → Overview: tenant count, MRR, system health
/hq/tenants            → All labs: name, owner, status, trial/paid
/hq/tenants/[id]       → Lab detail: usage, users, cases, storage
/hq/billing            → Subscriptions, plans, revenue
/hq/health             → DB health, storage, auth, queues
/hq/support            → Issues, contact requests
/hq/automations        → Automation rules, runs, logs
/hq/agents             → AI agent registry, runs, approvals
/hq/feature-flags      → Per-lab and global feature flags
/hq/templates          → Workflow templates, onboarding templates
/hq/audit              → System-wide audit logs
```

#### `/owner` — Lab Owner Command Center
Access: `lab_owner`, `lab_manager`, `super_admin`.
```
/owner                 → Real-time operational overview
/owner/workload        → Today's cases by stage, technician load
/owner/bottlenecks     → Stage congestion, overdue risk
/owner/finance         → Revenue, collected, outstanding, overdue
/owner/doctors         → Doctor performance, balances, VIP status
/owner/technicians     → Capacity, productivity, skill gaps
/owner/settings        → Lab config, catalog, pricing, workflows
/owner/reports         → Analytics, trend charts
```

#### `/cases` — Case Operations
```
/cases                 → Filtered list with empty states
/cases/new             → New case form
/cases/[id]            → Full case detail
/cases/[id]/summary    → Printable case sheet
```

#### `/production` — Production Workflow
```
/production            → Kanban board (stage columns)
```

#### `/doctor-portal` — Doctor Self-Service
```
/doctor-portal         → Doctor dashboard
/doctor-portal/cases   → Doctor's cases
/doctor-portal/cases/new → Submit case
/doctor-portal/cases/[id] → Doctor case detail
/doctor-portal/statement → Doctor financial statement
```

#### `/technicians/workspace` — Technician Bench View
```
/technicians/workspace → Personal queue, actions, productivity
```

#### `/finance` — Finance Zone
```
/invoices              → Invoice list
/invoices/new          → Create invoice
/invoices/[id]         → Invoice detail
/payments              → Payments log
/doctors/[id]/statement → Doctor statement
```

---

## D. Command Center Reset

### Why The Current `/command-center` Is Weak

The current Command Center is a **developer console** pretending to be a management tool.

Evidence:
1. The "readiness score" is computed from **hardcoded security findings** in a TypeScript constant array (`lib/constants/security-findings.ts`). It is not a live operational metric. It does not tell the lab owner anything about today's work.

2. The "system tasks" are **code-level deployment tasks** — things like "apply migrations", "configure email provider", "verify RLS". These are DevOps tasks, not operational tasks.

3. The CC overview shows: Identity & Access status, launch readiness, system readiness score, top tasks, CRM operating map, service status. **Zero operational intelligence about actual lab work.**

4. The Master Data section is correctly placed here but should be in `/owner/settings`, not mixed with developer tools.

5. The `cc-nav.tsx` has 12 tabs: Overview, Master Data, Finance, Launch, Tasks, Features, Security, Roles & Access, Users, Backend Health, Cloud, Setup. This is a **SaaS developer control panel** mixed with lab management. A lab owner opening this sees tabs like "Backend Health" and "Cloud". That is wrong.

### What a Real Command Center Must Do

A real lab owner command center must:

| Function | Description |
|----------|-------------|
| **Detect risks** | Cases overdue, cases missing info, cases without technician assignment |
| **Show bottlenecks** | Which stage has the most cases? Where is production stuck? |
| **Recommend actions** | "3 cases are overdue — review production board", "Doctor X balance $4,200 unpaid 45+ days" |
| **Expose readiness gaps** | "5 cases have no files attached", "2 operations have no prices set" |
| **Trigger workflows** | Send doctor a reminder, push a case to the next stage |
| **Show financial truth** | Revenue this month, collected, gap, top unpaid |
| **Show operational truth** | Active cases, technician capacity, daily throughput |

The current Command Center does **none of these things**. It shows developer infrastructure status.

### Required Split

```
Current /command-center ─────────────────────────────────────────────────────
├── Developer/SaaS tools          →  Move to /hq (super_admin only)
│   ├── Backend Health
│   ├── Cloud status
│   ├── Security findings
│   ├── Launch checklist
│   ├── Feature flags
│   ├── System tasks (code-level)
│   ├── Users / Identity console
│   └── Roles & permissions matrix
│
└── Lab management tools          →  Move to /owner
    ├── Master Data (catalog, pricing, workflows)
    ├── Finance overview
    └── (currently nothing operational)
```

---

## E. SaaS Owner HQ Specification (`/hq`)

> Access: `super_admin` role only. RLS must enforce this. Lab owners must never reach `/hq`.

### Modules

#### 1. Tenants / Labs
- List all labs: name, owner email, created date, plan, status (trial/active/churned)
- Per-lab: case count, user count, storage used, last activity
- Ability to view lab health without reading case content
- Quick actions: suspend lab, extend trial, view owner contact

#### 2. Subscriptions / Plans
- Current plan per lab
- Trial start/end dates
- Upcoming renewals
- Revenue by plan tier
- Churn tracking

#### 3. Onboarding Readiness
- Per-lab onboarding checklist completion percentage
- Labs that are stuck: no cases created, no technicians added, no pricing set
- Outreach triggers: "Lab X has been on trial 14 days and hasn't created a case"

#### 4. Usage Metrics
- Cases created per lab per month
- Files uploaded per lab
- API calls (future)
- Active users per lab

#### 5. Storage
- Storage used per lab (Supabase Storage buckets)
- Storage per file type (STL, PDF, image)
- Approaching limits

#### 6. System Health
- Supabase DB: connection, slow queries (from pg_stat_statements)
- Storage bucket: reachability
- Auth: active sessions, recent failures
- Email: delivery rates (Resend dashboard API)
- Queue: pending jobs (future)

#### 7. Support
- Contact requests from lab owners
- Feature requests
- Bug reports
- Response SLA tracking

#### 8. Automations
- Automation rules library (internal-first, see Section G)
- Run history and status
- Error rates

#### 9. AI Agents
- Agent registry: name, type, permissions, last run
- Agent run log: input, output, duration, approval status
- Human approval queue for risky agent actions

#### 10. Feature Flags
- Global flags (affect all labs)
- Per-lab overrides
- Rollout percentages

#### 11. Templates
- Workflow templates that labs can clone
- Onboarding playbooks
- Email notification templates

#### 12. Audit Logs
- System-level: logins, role changes, data exports
- Cross-tenant admin actions (what did SaaS owner do in which lab)

#### 13. Performance
- Slowest pages (from OpenTelemetry / Sentry, future)
- DB query time percentiles
- Build size tracking over time

#### 14. Billing Ops
- Stripe/payment integration (future)
- Invoice generation for labs
- Revenue dashboard

---

## F. Lab Owner Command Center Specification (`/owner`)

> Access: `lab_owner`, `lab_manager`, `super_admin`. Never `technician`, `doctor`, `accountant`, `delivery`.

This is the **real operational brain** of LabFlow for the lab. Every metric here is live from the database. Nothing is hardcoded.

### Module 1: Today's Workload
```
- Active cases count (not completed/cancelled)
- Cases by stage: visual bar showing volume in each stage
- Cases due today: count + list
- Cases due in 2 days: count + list
- Overdue cases: count + list (highlighted red)
- Cases with no technician assigned: count
```

### Module 2: Production Bottlenecks
```
- Stage with most cases right now (the congestion point)
- Stages with zero cases (idle stages)
- Average time cases have been sitting in each stage
- Cases that have been in the same stage for > 24h
```

### Module 3: Technician Capacity
```
- Per technician: assigned cases, daily capacity, utilization %
- Over-capacity technicians: flag them
- Under-utilized technicians: flag them
- Technicians with cases overdue in their queue
```

### Module 4: Doctor Balances & Relationship Health
```
- Total outstanding balance (all doctors)
- Doctors with balance > 30 days overdue
- Top 5 doctors by balance owed
- Doctors with no cases this month (churn risk)
```

### Module 5: Missing Price Warnings
```
- Operations with no price in any price group
- Cases where total_price = 0 (pricing not computed)
- Number of cases affected
```

### Module 6: Missing Technician Rates
```
- Operations with no technician rate configured
- Impact on margin calculations
```

### Module 7: Cases Without Files
```
- Cases that are past "received" stage but have 0 files attached
- These cases may be missing critical STL/photo inputs
```

### Module 8: Approvals Needed
```
- Design versions awaiting doctor approval
- Cases requiring doctor_approval stage sign-off
- Cases flagged for internal QC manager review
```

### Module 9: Delivery Risk
```
- Cases in "ready_for_delivery" with no delivery person assigned
- Cases that have been "out_for_delivery" for > 24h (stuck)
- No delivery proof uploaded for delivered cases
```

### Module 10: Quality & Remake Alerts
```
- QC failure rate this month vs last month
- Open remakes: count, responsible party (lab/doctor/patient)
- Remake cases not yet started
```

### Module 11: Recommended Next Actions (AI-ready)
```
This panel generates the top 5 recommended actions for right now.
Each action has:
- Icon + severity (critical, warning, info)
- Plain-English description: "3 cases are overdue — open production board"
- Direct action link
- Dismiss or snooze capability

Examples:
✗ 2 cases overdue (due yesterday) — view production board
⚠ Dr. Kareem has $3,200 unpaid for 47 days — send reminder
⚠ 5 cases past intake with no files attached — review cases
ℹ Mina's workload is at 140% capacity — reassign cases
ℹ Zirconia Crown has no price set — configure catalog pricing
```

---

## G. Automation Architecture

### Core Principle
**LabFlow is the brain. n8n/Make/Zapier are external execution arms.**

LabFlow emits events. External tools subscribe to webhooks. LabFlow maintains its own automation rule engine for simple internal triggers.

### Internal-First Schema

```sql
-- Event log (append-only)
system_events (
  id, lab_id, event_type, entity_type, entity_id,
  actor_id, payload jsonb, created_at
)

-- Rule definitions per lab
automation_rules (
  id, lab_id, name, description, is_active,
  trigger_event_type,           -- e.g. 'case.stage_changed'
  trigger_conditions jsonb,     -- e.g. { "to_stage": "quality_control" }
  action_type,                  -- e.g. 'notify', 'webhook', 'assign_technician'
  action_config jsonb,
  requires_approval boolean,
  created_at, updated_at
)

-- Execution log (per rule trigger)
automation_runs (
  id, rule_id, lab_id, triggered_by_event_id,
  status ('pending', 'running', 'succeeded', 'failed', 'awaiting_approval'),
  started_at, finished_at, error text
)

-- Step-level log (for multi-step rules)
automation_run_steps (
  id, run_id, step_order, step_type, input jsonb,
  output jsonb, status, error, created_at
)

-- Outbound webhooks per lab
webhook_endpoints (
  id, lab_id, name, url, secret_hash,
  event_types text[],           -- which event types to forward
  is_active, created_at
)

-- Notification templates (email/in-app)
notification_templates (
  id, lab_id, name, event_type,
  channel ('email', 'in_app', 'sms'),
  subject_template text,        -- Handlebars / mustache
  body_template text,
  is_active
)
```

### Event Types (Phase 1)
```
case.created
case.stage_changed
case.marked_overdue
case.missing_info_requested
case.approved
case.qc_passed
case.qc_failed
case.remake_opened
case.delivered
invoice.created
invoice.overdue
payment.received
doctor.balance_threshold_crossed
technician.workload_exceeded
```

### Human Approval Gate
All automation rules with `requires_approval = true` pause at `awaiting_approval` status and surface in the `/owner` command center for the lab owner to approve. This is non-negotiable — no automation should silently send emails, move cases, or change financial records.

---

## H. AI Agents Architecture

### Core Principle
All AI agents are read-only by default. Write actions require explicit approval or are flagged for review. No agent ever performs irreversible operations silently.

### Agent Registry

#### 1. Production Risk Agent
```yaml
Purpose: Monitor production board and flag risk before it becomes overdue
Permissions:
  - read: cases, case_timeline, technicians, case_stage_logs
  - write: NONE (generates recommendations only)
Trigger: Scheduled every 6 hours OR on case.stage_changed event
Output: InsightCard entries in /owner dashboard
Risky actions: None — read-only
```

#### 2. Finance Collection Agent
```yaml
Purpose: Surface doctors with overdue balances, draft reminder messages
Permissions:
  - read: invoices, payments, doctors
  - write: Can draft notifications (requires human approval to send)
Trigger: Daily at 08:00 lab timezone
Output: Suggested actions in /owner finance panel
Risky actions: Sending emails → requires human approval
```

#### 3. Onboarding Agent (for /hq)
```yaml
Purpose: Detect labs that are stuck in onboarding and suggest interventions
Permissions:
  - read: labs, user_roles, cases (count only), technicians, operations
  - write: NONE
Trigger: Daily for super_admin
Output: Onboarding health per lab in /hq/tenants
Risky actions: None
```

#### 4. Case Intake Agent
```yaml
Purpose: When a case is created, validate completeness, flag missing info
Permissions:
  - read: cases, case_items, case_files, operations, materials
  - write: case.missing_info_status (if explicitly enabled by lab owner)
Trigger: On case.created event
Output: Missing info flags on case detail page
Risky actions: Modifying case status → requires lab to opt-in
```

#### 5. Support Agent (for /hq)
```yaml
Purpose: Draft responses to support requests from lab owners
Permissions:
  - read: support_requests, lab metadata (NOT lab data)
  - write: Draft responses (human reviews before sending)
Trigger: On support_request.created
Output: Draft response surfaced in /hq/support
Risky actions: Sending messages → requires human approval
```

#### 6. Workflow Optimizer Agent
```yaml
Purpose: Analyze completed cases and suggest workflow improvements
Permissions:
  - read: case_stage_logs, case_timeline, technicians, cases
  - write: NONE
Trigger: Weekly report generation
Output: Insight report in /owner/reports
Risky actions: None
```

### Agent Audit Schema
```sql
agent_tasks (
  id, lab_id, agent_type, trigger_type ('event', 'schedule', 'manual'),
  input_context jsonb, status ('pending', 'running', 'completed', 'failed'),
  created_at, started_at, completed_at
)

agent_runs (
  id, task_id, model_used, prompt_tokens, completion_tokens,
  output jsonb, reasoning_summary text, duration_ms,
  created_at
)

agent_audit_logs (
  id, task_id, lab_id, action_type, description text,
  requires_approval boolean, approved_by uuid, approved_at,
  was_executed boolean, created_at
)
```

---

## I. Premium UI Direction

### Design Principles

#### 1. Premium Clinical SaaS
- Feels like a $500/month professional tool
- No toy gradients, no cartoon icons
- Typography-first: clear hierarchy, generous whitespace
- Muted color palette with deliberate accent use
- Shadows are subtle, not decorative

#### 2. Fast
- Every page must render under 200ms server-side
- No full-page loading spinners (use Suspense boundaries + skeletons)
- Streaming for heavy dashboards
- No client-side data fetching where server rendering is possible

#### 3. Minimal
- Never show a user more than they need right now
- Role-filtered navigation (technician should not see Finance in the sidebar)
- Empty states are informative, not generic ("No cases yet" → "Your lab has no active cases. Create the first case →")
- Actions surface at the right moment, not crammed into headers

#### 4. Clear Hierarchy
- One primary action per page
- H1 → section titles → field labels. No heading soup.
- Color for status (green = good, amber = warning, red = critical, neutral = inactive)
- Use `Badge` consistently — not arbitrary colored `div`s

#### 5. Mobile-First for Field Roles
These three roles use the app on phones/tablets:
- **Technician** — workspace, queue, actions
- **Doctor** — portal, case submission, status
- **Delivery** — delivery list, mark delivered

All three zones must be fully usable at 375px width. Desktop layout is secondary for them.

#### 6. Command Center Cards Must Be Actionable
Every InsightCard must:
- Describe the situation: "3 cases overdue"
- State the impact: "Risk of missing delivery deadline"
- Offer a direct action: "View cases →" or "Open production board →"
- Have a severity tone (red, amber, neutral)

Decorative cards with no actions are waste. Remove them.

### Component Architecture

```
components/ui/
├── page-header.tsx        ✅ EXISTS
├── empty-state.tsx        ✅ EXISTS
├── action-card.tsx        ✅ EXISTS
├── stat-tile.tsx          ✅ EXISTS
├── badge.tsx              ✅ EXISTS
├── button.tsx             ✅ EXISTS
├── card.tsx               ✅ EXISTS
├── input.tsx              ✅ EXISTS
├── insight-card.tsx       🔴 MISSING — actionable alert card for /owner
├── skeleton.tsx           🔴 MISSING — loading skeletons
├── page-shell.tsx         🔴 MISSING — inner page layout wrapper
└── section-header.tsx     🔴 MISSING — consistent section h2 + description
```

---

## J. Performance Strategy

### Current Performance Risks (Confirmed in Code)

| Risk | Location | Severity |
|------|----------|----------|
| `lib/data/cases.ts` is 761 lines — monolith with many select paths | `lib/data/cases.ts` | High |
| Dashboard preview data is hardcoded — renders instantly but hides real load time | `lib/data/dashboard.ts:31-90` | Medium |
| Finance `getFinanceDashboard()` loads all invoices at once — no limit | `lib/data/finance.ts` | High |
| Reports `getOpsReports()` loads all cases, no pagination | `lib/data/reports.ts` | High |
| Cases list has no explicit `limit()` visible — potential full scan | `lib/data/cases.ts` | Medium |
| No indexes on `payments.paid_at` + `lab_id` verified | migrations | Medium |
| No Suspense boundaries or streaming — pages block on slowest query | app layout | High |
| All CC readiness is computed from static constants — no real DB check | `lib/data/command-center.ts` | Medium |

### Required Improvements

#### Route-Level Performance Budgets
Every page must have a documented P95 target:
- `/owner` (new) → < 300ms
- `/cases` → < 250ms (paginated)
- `/production` → < 400ms (Kanban load)
- `/finance` → < 300ms

#### Supabase Select Narrowing
Every query must select only the columns it needs. Replace `select("*")` with explicit column lists.

#### Indexes (verify applied)
```sql
-- Verify these exist:
cases(lab_id, status, due_date)              -- cases list filter
cases(lab_id, current_stage)                 -- production board
invoices(lab_id, status)                     -- finance queries
payments(lab_id, paid_at)                    -- monthly revenue
case_timeline(case_id, created_at desc)      -- timeline order
technician_skills(technician_id)             -- skill lookups
```

#### Pagination
- Cases list: 25 per page with cursor pagination
- Invoices list: 50 per page
- Timeline: already limited to 10 events ✅

#### Loading Skeletons
Every data-heavy page must show skeletons while loading:
- `/owner` → 4 stat tiles + 3 insight panels
- `/cases` → table rows (5–10 row skeletons)
- `/production` → Kanban column skeletons

#### Bundle Review
Run `next build` with `ANALYZE=true` (add `@next/bundle-analyzer`).
Remove unused Lucide icons (each adds ~500 bytes to bundle).
Lazy-load heavy components (Drag-and-drop, design workflow viewer).

#### Monitoring (Future)
- Sentry: error tracking (Phase 17+)
- PostHog: product analytics, funnel analysis (Phase 17+)
- Supabase `pg_stat_statements`: slow query log (configure now)
- Vercel Analytics: real-time performance (enable now — free tier)

---

## K. Build Roadmap

### Phase 0.5 — Architecture Reset (NOW)
- ✅ Write this document
- Create `/hq` skeleton (super_admin gated)
- Create `/owner` skeleton with real-time operational data
- Add `InsightCard`, `Skeleton`, `PageShell`, `SectionHeader` primitives
- Retire/repurpose misleading `/command-center` pages
- No fake data in new pages

### Phase 15A — SaaS HQ + Owner Command Center
- `/hq` with real tenant list (query `labs` table as super_admin)
- `/owner` with real-time metrics: overdue count, bottlenecks, balance warnings
- Recommended Next Actions panel (rule-based, no AI yet)
- Mobile-first layout for `/owner` landing

### Phase 15B — Automation Event Foundation
- `system_events` table (migration 0019)
- `automation_rules` table (migration 0020)
- `automation_runs` table
- Event emitter: emit events on case stage change, invoice overdue, etc.
- No AI yet — rule-based triggers only

### Phase 15C — Workflow Engine + Technician Matrix
- Custom workflow stages driving production board
- Stage permission matrix for technicians (UI exists; wire to custom stages)
- `technician_profiles_ext` data surfaced in `/owner/technicians`

### Phase 15D — Production Board 2.0
- Workflow-aware Kanban (respects custom stage order)
- Stage gate indicators (requires_technician, requires_qc, blocks_delivery)
- Technician capacity overlay on board
- Bottleneck highlighting (column with most cases)

### Phase 15E — Finance Command Center
- `/owner/finance` with real metrics (not cc/finance placeholder)
- Doctor statement email trigger (with human approval gate)
- Invoice aging report (0-30, 30-60, 60-90, 90+ days)

### Phase 15F — Case Sheet + QR/Print
- Print CSS for `/cases/[id]/summary` ✅ (exists)
- QR code on printable sheet (links back to case)
- Delivery label print view

### Phase 15G — Premium UI + PWA
- Install `insight-card.tsx`, `skeleton.tsx`, `page-shell.tsx`
- Role-filtered sidebar (technician sees no Finance links)
- Mobile-optimized workspace and doctor portal
- PWA install prompt on mobile

### Phase 15H — Performance and QA
- Paginate cases list
- Narrow all `select("*")` to explicit columns
- Add Suspense boundaries on heavy pages
- Lighthouse audit: target 90+ on Performance
- Full typecheck, lint, build — zero errors on every PR

---

## L. Truth Audit Table

This is the honest state of the product as of 2026-05-18.

| Feature / Area | Status | Notes |
|----------------|--------|-------|
| **Multi-tenant isolation (RLS)** | ✅ Confirmed | All business tables have lab_id RLS |
| **8-role RBAC** | ✅ Confirmed | Roles defined, enforced in guards and permissions |
| **Case intake & detail** | ✅ Confirmed | Real data, forms work, file upload works |
| **Cases list with filters** | ✅ Confirmed | Real data, filter by status/stage/doctor |
| **Production Kanban** | ✅ Confirmed | Real data, drag-to-move works |
| **QC gate** | ✅ Confirmed | `quality_control` stage with QC form |
| **Remakes tracking** | ✅ Confirmed | Remakes table, dashboard exists |
| **Doctor portal (submit, track)** | ✅ Confirmed | Real data, submit/track works |
| **Doctor statement** | ✅ Confirmed | Real invoice/payment ledger |
| **Technician workspace** | ✅ Confirmed | Real queue, start/complete actions |
| **Finance: invoices** | ✅ Confirmed | Create, list, detail, payment allocation |
| **Finance: payments** | ✅ Confirmed | Record payments, link to invoices |
| **Enterprise identity (invites)** | ✅ Confirmed | Migrations 0015/0016, accept-invite flow |
| **Master data: operations/materials** | ✅ Confirmed | CRUD exists, catalog-driven |
| **Pricing engine** | ✅ Confirmed | Price groups, operation prices, auto-pricing |
| **Technician rates** | ✅ Confirmed | Per-operation cost rates |
| **Case file manager** | ✅ Confirmed | Upload, categorize, visibility controls |
| **Design workflow (CAD)** | ✅ Confirmed | Design versions, approval, comments |
| **Missing info engine** | ✅ Confirmed | Flags missing fields, blocks production |
| **Case timeline** | ✅ Confirmed | Audit log of events per case |
| **Case summary sheet** | ✅ New — Phase 15 | Printable, real data |
| **Custom workflow engine (templates)** | ✅ New — Phase 15 | Tables exist (0017), UI exists, no production cases use it yet |
| **Technician stage matrix** | ✅ New — Phase 15 | UI exists, uses skill table as proxy |
| **PWA manifest** | ✅ New — Phase 15 | `/manifest.webmanifest` exists |
| **Finance Command Center** | ✅ New — Phase 15 | Page exists, real data |
| **`/hq` SaaS Owner HQ** | 🔴 MISSING | Does not exist anywhere |
| **`/owner` Lab Owner Command Center** | 🔴 MISSING | Does not exist; `/dashboard` is thin proxy |
| **Real-time operational insights** | 🔴 MISSING | No overdue detection, no bottleneck alerts, no recommended actions |
| **Automation rules engine** | 🔴 MISSING | No `system_events`, no `automation_rules` tables |
| **AI agents** | 🔴 MISSING | No agent infrastructure |
| **`InsightCard` component** | 🔴 MISSING | Needed for /owner panels |
| **Loading skeletons** | 🔴 MISSING | No Skeleton component exists |
| **Pagination on cases/invoices** | 🔴 MISSING | Full table loads |
| **Role-filtered sidebar** | 🔴 MISSING | All roles see all nav items |
| **Delivery zone** | ⚠️ Partial | Page exists, UI thin, no real delivery management |
| **Reports/Analytics** | ⚠️ Partial | Real queries, thin visualization, no charts |
| **Settings page** | ⚠️ Partial | Exists, unknown depth — needs audit |
| **Email notifications** | ⚠️ Partial | Email provider plumbing exists (Resend), no templates sent yet |
| **`/dashboard`** | ⚠️ Weak | Has preview data, real KPIs thin, should be replaced by `/owner` |
| **`/command-center` readiness score** | ⚠️ Misleading | Computed from hardcoded constants, not live DB |
| **`/command-center` system tasks** | ⚠️ Misleading | Developer/DevOps tasks, not operational tasks |
| **Performance: select narrowing** | ⚠️ Not done | Multiple `select("*")` in data layer |
| **Performance: pagination** | ⚠️ Not done | Cases and invoices are full loads |
| **Supabase Storage buckets** | ⚠️ Unknown | File upload code exists but bucket config not verified here |
| **Stripe / billing** | 🔴 MISSING | No billing integration |
| **Sentry error tracking** | 🔴 MISSING | Not configured |
| **PostHog analytics** | 🔴 MISSING | Not configured |
| **pg_stat_statements** | 🔴 Unknown | Not configured via migrations |
| **Offline/PWA caching** | 🔴 MISSING | Manifest exists, no service worker |

---

## First Implementation PR

See Section P1 below.

---

## P1: First PR — Foundation for `/hq` + `/owner` Skeletons

### Goal
Establish the two new app zones with correct access control, honest empty states, and the UI primitives they need. No fake data. No cosmetic-only work.

### Scope

#### New Files
```
app/hq/page.tsx                    → SaaS HQ overview (super_admin only)
app/hq/layout.tsx                  → Gate: redirect non-super_admin to /dashboard
app/owner/page.tsx                  → Lab Owner CC overview (lab_owner/manager)
app/owner/layout.tsx                → Gate: redirect insufficient roles
components/ui/insight-card.tsx      → Actionable alert card (tone, title, description, action)
components/ui/skeleton.tsx          → Loading skeleton block
components/ui/section-header.tsx    → Consistent h2 + description for page sections
components/ui/page-shell.tsx        → Inner content wrapper with max-width and spacing
```

#### Modified Files
```
lib/auth/routes.ts                  → Add /hq and /owner to route registry
lib/constants/navigation.ts         → Add /hq to super_admin nav, /owner to owner nav
components/layout/app-sidebar.tsx   → Role-filter: hide Finance from technician/delivery/doctor
```

#### Data (real, not fake)
```
/hq page:
- Count of all labs: SELECT count(*) FROM labs (super_admin RLS)
- Count of all users: SELECT count(*) FROM profiles
- Migration count: read from filesystem (existing pattern)

/owner page:
- Overdue cases count: SELECT count(*) FROM cases WHERE status != 'completed' AND due_date < today
- Cases due today: SELECT count(*) FROM cases WHERE due_date = today
- Active cases count: SELECT count(*) FROM cases WHERE status = 'active'
- Total outstanding balance: sum of remaining_balance from invoices
```

#### NOT in this PR
- No automation engine
- No AI agents
- No charts
- No full reporting
- No breaking existing routes

### Acceptance Criteria
- `npm run typecheck` → 0 errors
- `npm run lint` → 0 errors
- `npm run build` → 0 errors, all routes render
- `/hq` returns 401/redirect for non-super_admin
- `/owner` returns 401/redirect for technician/doctor/accountant/delivery
- Both pages show honest, real data (or honest empty state if DB not connected)
- No hardcoded preview data in new pages
