---
name: labflow-supabase-architect
description: Use when designing or editing Supabase PostgreSQL schema, RLS policies, Auth integration, Storage paths, database migrations, or data access rules for LabFlow Dental CRM.
---

# LabFlow Supabase Architect Skill

Use this skill when working on Supabase database, Auth, Storage, RLS, migrations, seed data, or database access.

## Database Principles

- Use PostgreSQL.
- Use UUID primary keys.
- Use `lab_id` in all business tables.
- Use `timestamptz`.
- Add indexes for high-use filters.
- Use JSONB for flexible fields only when appropriate.
- Prefer clear relational models over messy JSON.
- Never duplicate existing tables without checking.

## Core Tables

Recommended:

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

## RLS Principles

- Lab Owner sees all own lab data.
- Lab Manager sees production data in own lab.
- Reception manages doctors/cases/files in own lab.
- Technician sees assigned cases only.
- Accountant sees finance data in own lab.
- Doctor sees only own cases, own files, own invoices, own statement.
- Delivery sees only delivery-related cases.
- Internal comments are hidden from doctors.
- Financial data is hidden from technicians and delivery.

## Storage Rules

Use bucket:

`case-files`

Paths:

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

Visibility:

- internal
- doctor_visible
- private_finance

## Migration Checklist

Before finishing:

1. Migration applies cleanly.
2. Tables have lab isolation.
3. RLS is enabled where needed.
4. Policies are understandable.
5. Indexes exist for common queries.
6. Seed data is realistic.
7. No secrets are included.


## Always Do

- Inspect the repository before editing.
- Respect the existing architecture.
- Use TypeScript strictly.
- Prefer reusable components.
- Keep code modular and maintainable.
- Respect `lab_id` in all business queries.
- Never expose secrets.
- Never commit `.env`.
- Run available checks before final response.
- Commit and push to the correct GitHub phase branch when requested.

## Never Do

- Do not create toy demo screens.
- Do not create fake-only UI disconnected from database.
- Do not duplicate existing tables.
- Do not break previous phases.
- Do not expose doctor/private data incorrectly.
- Do not use service role key client-side.
