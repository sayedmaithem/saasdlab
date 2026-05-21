# LabFlow Dental CRM — Project Knowledge Base

## 1. Product Identity

**Project name:** LabFlow Dental CRM  
**Product type:** Cloud-based Dental Laboratory CRM + Production Management SaaS  
**Target users:** Dental labs, lab owners, lab managers, reception staff, technicians, accountants, delivery staff, and doctors/clinics.

LabFlow is not a simple CRM. It is a full dental laboratory operating system that manages the journey of every dental case from doctor submission to production, exocad design workflow, quality control, delivery, invoicing, payment, and analytics.

---

## 2. Core Vision

Build a world-class SaaS system that:

- Reduces dental case delays.
- Prevents missing information before production starts.
- Organizes all doctor files, scans, photos, STL/OBJ/PLY/DICOM/PDF files.
- Tracks exocad design versions and doctor approvals.
- Improves technician productivity.
- Measures doctor quality and payment behavior.
- Controls QC and remake reasons.
- Gives the lab owner clear real-time dashboards.
- Gives doctors a simple portal to submit and follow cases.
- Runs fully on cloud infrastructure.

---

## 3. Recommended Tech Stack

### Application

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Server Actions or API Routes
- Vercel deployment

### Backend / Data

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime where useful
- Row Level Security

### DevOps

- GitHub private repository
- Branch per phase
- Pull requests if needed
- GitHub Actions later
- Vercel GitHub deployment

### External Services

- Cloudflare: DNS, SSL, WAF, domain protection
- Sentry: error monitoring
- Resend: transactional email
- WhatsApp Business Cloud API: notifications later
- Cloudflare R2 or Backblaze B2: file backup later
- PayTabs / Amwal: Iraq payment gateway later
- PostHog: product analytics later
- Google Maps: delivery routing later

---

## 4. Main Roles

### Super Admin
Platform-level owner.

### Lab Owner
Can see and manage everything inside their lab.

### Lab Manager
Can manage cases, production, technicians, QC, remakes, delivery, and reports.

### Reception
Can create doctors and cases, upload files, check missing information, and communicate with doctors.

### Technician
Can see assigned cases only, update assigned production tasks, upload design files, and comment. Cannot see finance.

### Accountant
Can manage invoices, payments, doctor statements, and finance reports. Cannot move production stages.

### Doctor
Can see only own cases, own files, own design approvals, own invoices, and own statement.

### Delivery
Can see delivery-related cases only, mark delivery status, upload proof, and cannot see finance.

---

## 5. Core Modules

1. Authentication and roles
2. Doctors and clinics
3. Dental cases
4. Missing information engine
5. Cloud file manager
6. Production Kanban
7. Technician workspace
8. exocad design versions
9. Doctor design approval
10. Case comments
11. Case timeline
12. Quality control
13. Remakes
14. Finance
15. Doctor statement
16. Delivery
17. Doctor portal
18. Dashboard
19. Reports
20. Settings
21. Audit logs
22. Notification architecture

---

## 6. Case Lifecycle

1. Doctor creates or sends a case.
2. Doctor uploads photos, scans, STL/OBJ/PLY/DICOM/PDF files.
3. Reception checks information.
4. Missing information engine validates required fields.
5. If missing, case goes to `waiting_doctor_info`.
6. If complete, case enters production.
7. Lab manager assigns technician.
8. Technician downloads files and works in exocad locally.
9. Technician uploads design version V1/V2/V3.
10. Doctor approves or requests changes.
11. Case moves to milling/printing.
12. Case moves through production stages.
13. QC is completed.
14. Case becomes ready for delivery.
15. Delivery person delivers case and uploads proof.
16. Invoice is created.
17. Payment is recorded.
18. Doctor statement updates.
19. Dashboard and reports update.

---

## 7. Production Stages

Use these stage keys:

- `received`
- `information_check`
- `waiting_doctor_info`
- `cad_design`
- `design_review`
- `doctor_approval`
- `milling_printing`
- `try_in`
- `coloring`
- `furnace`
- `polishing`
- `quality_control`
- `ready_for_delivery`
- `out_for_delivery`
- `delivered`
- `completed`
- `on_hold`
- `cancelled`

Each stage transition must create:

- stage log
- timeline event
- actor ID
- timestamp
- notes if present
- delay reason if overdue

---

## 8. Missing Information Engine

Every new case must be checked before production.

### General required fields

- doctor
- patient name
- work type
- units count
- tooth numbers
- due date
- material
- shade when required
- scan file or physical impression confirmation

### Zircon Crown

Required:

- doctor
- patient name
- shade
- units count
- tooth numbers
- material
- due date
- STL/scan file OR physical impression marked true

### Emax

Required:

- same as Zircon
- preparation photo recommended

### Implant

Required:

- implant system
- scan body info
- bite info
- scan file

Recommended:

- DICOM
- photos

### Night Guard

Required:

- arch
- bite info
- due date
- scan or impression

If required fields are missing:

- status = `waiting_doctor_info`
- current_stage = `waiting_doctor_info`
- missing_info_status = `missing`
- missing_info_fields = JSON array
- add timeline event

---

## 9. Cloud File Structure

Use Supabase Storage bucket:

`case-files`

Recommended logical paths:

```text
case-files/{lab_id}/{case_id}/doctor-uploads/
case-files/{lab_id}/{case_id}/scan-files/
case-files/{lab_id}/{case_id}/photos/
case-files/{lab_id}/{case_id}/exocad-design/
case-files/{lab_id}/{case_id}/design-versions/
case-files/{lab_id}/{case_id}/cam-milling/
case-files/{lab_id}/{case_id}/qc-photos/
case-files/{lab_id}/{case_id}/delivery/
case-files/{lab_id}/{case_id}/invoices/
```

Supported files:

- JPG, JPEG, PNG, WEBP
- STL, OBJ, PLY
- DICOM, DCM
- PDF
- ZIP
- exocad exports as generic files

File visibility:

- `internal`
- `doctor_visible`
- `private_finance`

---

## 10. exocad Workflow

MVP does not require exocad API integration.

MVP workflow:

1. Doctor uploads scan/photos.
2. Technician downloads files.
3. Technician works locally in exocad.
4. Technician exports screenshots/design files.
5. Technician uploads design version.
6. Doctor approves or requests changes.
7. Approved version allows case to move to manufacturing.

Design version statuses:

- `draft`
- `pending_review`
- `approved`
- `rejected`
- `needs_changes`

Future phase:

- Windows Desktop Sync Agent
- Local folder sync
- Auto-upload design exports
- Offline sync support

---

## 11. Finance Workflow

Invoices:

- draft
- issued
- partially_paid
- paid
- overdue
- cancelled

Payment methods:

- cash
- bank_transfer
- card
- other

Payment allocation:

- default allocation to oldest unpaid invoices
- update paid amount
- update remaining amount
- update invoice status

Doctor statement:

- opening balance placeholder
- invoices
- payments
- allocations
- running balance
- remaining balance
- date filter
- print/export placeholder

Technicians and delivery users must never see finance.

---

## 12. Delivery Workflow

Delivery statuses:

- `ready_for_delivery`
- `assigned_to_delivery`
- `out_for_delivery`
- `delivered`
- `failed_delivery`

Rules:

- Case cannot be delivered before QC passed.
- Delivery action updates case stage.
- Every delivery action creates a timeline event.
- Proof photo is uploaded under the delivery folder.

Fields:

- case
- doctor
- clinic
- delivery person
- status
- scheduled time
- out time
- delivered time
- recipient name
- proof photo
- failure reason
- notes

---

## 13. Quality Control

QC must happen before ready for delivery.

QC result:

- `passed`
- `needs_adjustment`
- `failed`

For Zircon checklist:

- Shade checked
- Margin checked
- Contact checked
- Occlusion checked
- Surface polished
- No cracks
- Photos uploaded
- Final approval

If QC fails:

- require reason
- case cannot move to ready for delivery
- add timeline event

---

## 14. Remake Tracking

Every remake must track:

- original case
- remake case
- reason
- responsibility
- cost impact
- notes
- photos

Responsibility values:

- `lab_error`
- `doctor_error`
- `scan_issue`
- `patient_request`
- `shade_issue`
- `margin_issue`
- `fracture`
- `occlusion_issue`
- `unknown`

Do not automatically blame technician. Responsibility must be selected by authorized staff.

---

## 15. Database Tables

Recommended core tables:

- labs
- profiles
- user_roles
- clinics
- doctors
- technicians
- technician_skills
- cases
- case_items
- case_stage_logs
- case_timeline
- case_files
- case_comments
- design_versions
- design_approvals
- tasks
- quality_checks
- quality_check_items
- remakes
- doctor_price_lists
- invoices
- invoice_items
- payments
- payment_allocations
- deliveries
- notifications
- audit_logs
- app_settings

All business tables should include `lab_id` where appropriate.

Use UUID primary keys.

Use `timestamptz`.

Use indexes on:

- lab_id
- doctor_id
- case_id
- assigned_technician_id
- status
- current_stage
- due_date
- created_at

---

## 16. Security Principles

- Use Supabase Auth.
- Use Row Level Security.
- Never expose service role key in frontend.
- Never commit `.env`.
- Store secrets only in environment variables.
- Doctors can only see their own cases.
- Technicians can only see assigned cases.
- Accountants can see finance but not production stage control.
- Delivery can only see delivery cases.
- Internal comments are not visible to doctors.
- Finance is hidden from technicians and delivery.

---

## 17. GitHub Workflow

Use private GitHub repository.

Branch strategy:

- `main`: stable production branch
- `develop`: integration branch
- phase branches:
  - `phase-00-repo-audit`
  - `phase-01-foundation`
  - `phase-02-database-rls`
  - `phase-03-auth-roles`
  - `phase-04-doctors-clinics`
  - `phase-05-cases`
  - `phase-06-cloud-files`
  - `phase-07-production-kanban`
  - `phase-08-design-workflow`
  - `phase-09-comments-timeline`
  - `phase-10-qc-remakes`
  - `phase-11-15-ops-portal-analytics-polish`
  - `phase-16-final-qa`

Every phase must:

1. inspect repo
2. run git status
3. switch/create branch
4. implement
5. run checks
6. commit
7. push
8. report commit hash

Never commit:

- `.env`
- tokens
- service role keys
- `node_modules`
- `.next`
- build output
- logs

---

## 18. Build Phases

### Phase 0
Repository audit and GitHub setup.

### Phase 1
Foundation: Next.js, TypeScript, Tailwind, shadcn/ui, Supabase clients, layout, roles, permissions.

### Phase 2
Database schema, migrations, RLS, seed data.

### Phase 3
Auth, roles, protected routes, permission helpers.

### Phase 4
Doctors and clinics module.

### Phase 5
Cases and missing information engine.

### Phase 6
Cloud file manager.

### Phase 7
Production Kanban and technician workspace.

### Phase 8
exocad design versions and doctor approval.

### Phase 9
Case discussion and timeline.

### Phase 10
Quality control and remakes.

### Phase 11-15
Finance, delivery, doctor portal, dashboard, reports, settings, polish, RTL, docs, production hardening.

### Phase 16
Final QA and bug fix pass.

---

## 19. Acceptance Criteria

The MVP is accepted only if:

1. Lab owner can log in.
2. Doctor can be created.
3. Case can be created.
4. Missing information is detected.
5. Files can be uploaded to the case.
6. Technician can be assigned.
7. Case moves through production stages.
8. Technician uploads design version.
9. Doctor approves or rejects design.
10. Comments work inside the case.
11. Internal notes are hidden from doctor.
12. QC can be completed.
13. Case becomes ready for delivery.
14. Delivery can be completed with proof.
15. Invoice can be generated.
16. Payment can be recorded.
17. Doctor statement shows balance.
18. Dashboard shows real database counts.
19. Reports show meaningful tables/cards.
20. Permissions prevent unauthorized access.
21. UI feels modern and professional.
22. Project is pushed to GitHub safely.
23. README and `.env.example` exist.

---

## 20. Phase 2 Ideas

After MVP:

- WhatsApp Business notifications
- Email notifications
- Cloudflare R2 backup
- Desktop Sync Agent for exocad
- 3D STL viewer
- AI suggestions for delay risk
- AI missing info assistant
- advanced analytics
- Google Maps delivery routes
- payment gateway integration
- multi-lab subscription billing

