---
name: labflow-ui-ux-reviewer
description: Use when building or reviewing LabFlow UI/UX, dashboards, forms, tables, Kanban boards, doctor portal, technician workspace, RTL readiness, and SaaS polish.
---

# LabFlow UI/UX Reviewer Skill

Use this skill when improving or reviewing interface quality.

## UI Goal

LabFlow must feel like a premium modern SaaS for dental labs, not a basic CRUD demo.

## Design Principles

- Clean sidebar and topbar.
- Strong page headers.
- Clear action buttons.
- Status badges everywhere status matters.
- Tables must have search/filter/sort where useful.
- Forms must be grouped into logical sections.
- Empty states must guide the user.
- Loading states must not look broken.
- Error states must be useful.
- Mobile responsiveness is required for doctor portal.
- Arabic/RTL readiness must be considered.

## Key Screens

### Lab Owner Dashboard
Show business and production truth:

- active cases
- overdue cases
- waiting doctor info
- CAD design cases
- designs waiting approval
- ready for delivery
- revenue
- unpaid balance
- remake rate
- QC failure rate
- bottleneck stage

### Doctor Portal
Must be simple:

- my active cases
- waiting for my information
- designs waiting approval
- ready cases
- statement
- upload files
- approve/request changes

### Technician Workspace
Must be fast:

- my assigned cases
- priority order
- due today
- overdue
- upload design
- complete stage
- report problem

### Production Kanban
Must show:

- case number
- doctor
- patient
- work type
- due date
- urgent badge
- assigned technician
- missing info badge
- priority score

## UI Review Checklist

1. Does the page have a clear purpose?
2. Is the most important action obvious?
3. Is status visible?
4. Are dangerous actions protected?
5. Is the layout usable on smaller screens?
6. Is the table searchable/filterable where needed?
7. Is financial info hidden from non-finance roles?
8. Is doctor portal free from internal lab complexity?


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
