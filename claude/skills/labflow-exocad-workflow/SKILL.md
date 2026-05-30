---
name: labflow-exocad-workflow
description: Use when building or reviewing LabFlow exocad-related workflows, design versions, CAD/CAM files, doctor approvals, future desktop sync, and digital dental case file organization.
---

# LabFlow exocad Workflow Skill

Use this skill for exocad design workflow, CAD/CAM files, design versions, and doctor approval.

## MVP Rule

Do not require direct exocad API integration in MVP.

MVP must manage:

- doctor uploads
- scan files
- design screenshots
- exocad exported files
- design version history
- doctor approvals
- change requests
- design comments
- timeline events

## Design Version Rules

Each design version has:

- case_id
- lab_id
- version number
- uploaded by
- uploaded at
- notes
- status
- preview file
- attached files
- doctor response
- approval date

Statuses:

- draft
- pending_review
- approved
- rejected
- needs_changes

## Approval Rules

If `requires_doctor_approval = true`:

- case cannot move to manufacturing until design approved
- doctor can approve only own case
- lab manager may override with timeline/audit record
- request changes returns case to CAD/design review

## File Paths

Use:

```text
case-files/{lab_id}/{case_id}/exocad-design/
case-files/{lab_id}/{case_id}/design-versions/
case-files/{lab_id}/{case_id}/cam-milling/
```

## Future Desktop Sync Agent

Future local folder:

```text
C:\LabFlow\Cases\{case_number}\
  incoming\
  exocad\
  exports\
  screenshots\
  qc\
  delivery\
```

Agent features later:

- sync assigned cases
- download doctor uploads
- watch export folders
- auto-upload files
- create design versions
- offline sync
- conflict handling


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
