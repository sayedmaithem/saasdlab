---
name: labflow-qa-launch
description: Use for final QA, acceptance testing, security review, production readiness, launch checklist, bug fixing, and MVP validation for LabFlow Dental CRM.
---

# LabFlow QA Launch Skill

Use this skill for final QA, launch readiness, and acceptance testing.

## Checks to Run

Use available scripts:

```bash
npm run lint
npm run typecheck
npm run build
```

If scripts are missing, report clearly.

## Required User Flows

### Flow 1
Lab owner creates doctor → creates case → uploads files → assigns technician → moves production stage.

### Flow 2
Technician opens assigned case → uploads design V1 → marks ready for doctor review.

### Flow 3
Doctor logs in → sees own case → approves design → comments.

### Flow 4
Case moves through production → QC completed → ready for delivery → delivered with proof.

### Flow 5
Invoice generated → payment recorded → doctor statement updated.

### Flow 6
Case marked as remake → reason/responsibility tracked → reports update.

## Security Tests

- Doctor cannot access another doctor's case.
- Doctor cannot see internal comments.
- Technician cannot see invoices/payments.
- Delivery cannot see finance.
- Accountant cannot move production stages.
- Unauthenticated users cannot access protected routes.
- Storage files respect visibility rules.

## Acceptance Criteria

The MVP is accepted only if:

1. Auth works.
2. Roles work.
3. Doctors work.
4. Cases work.
5. Missing information works.
6. Files upload.
7. Production stages work.
8. Design versions work.
9. Doctor approvals work.
10. Comments work.
11. Timeline works.
12. QC works.
13. Remakes work.
14. Delivery works.
15. Finance works.
16. Doctor statement works.
17. Dashboard uses real data.
18. Reports are meaningful.
19. UI is professional.
20. README and `.env.example` exist.
21. Code is pushed to GitHub.

## Final QA Output

Return:

1. QA summary
2. Bugs found
3. Bugs fixed
4. Remaining risks
5. Security review
6. Manual test checklist
7. Launch checklist
8. Git branch / commit / push status


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
