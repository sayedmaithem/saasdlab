---
name: labflow-product-architect
description: Use when planning or reviewing LabFlow Dental CRM product architecture, modules, workflows, phases, SaaS structure, and dental lab business logic.
---

# LabFlow Product Architect Skill

Use this skill whenever the task involves planning, auditing, restructuring, or improving the LabFlow Dental CRM product.

## Product Mindset

LabFlow is a cloud SaaS for dental laboratories. It is not just a CRM. It is a production management system for dental cases, doctors, technicians, files, exocad design versions, QC, delivery, finance, and analytics.

## Core Product Rules

- Every case must have a full lifecycle.
- Missing information must be detected before production.
- Doctor portal must be simple and mobile-friendly.
- Technician workspace must be fast and focused.
- Lab owner dashboard must show business and production truth.
- Every important action must create timeline/audit records.
- The system must be multi-lab ready.
- Use `lab_id` for business isolation.
- Use role-based access everywhere.

## Main Modules

- Auth and roles
- Doctors and clinics
- Cases
- Missing information engine
- Cloud files
- Production Kanban
- Technician workspace
- exocad design versions
- Doctor approval
- Comments and timeline
- QC and remakes
- Finance
- Delivery
- Doctor portal
- Dashboard and reports
- Settings
- Notifications architecture

## Review Checklist

When reviewing work, check:

1. Is it useful for a real dental lab?
2. Does it reduce delay, confusion, or remake risk?
3. Is the workflow connected end-to-end?
4. Are permissions correct?
5. Is data stored in database, not fake arrays?
6. Are files stored in Supabase Storage?
7. Is UI clean enough for daily use?
8. Does the feature update timeline where relevant?
9. Does it respect lab isolation?
10. Is it ready for future scale?


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
