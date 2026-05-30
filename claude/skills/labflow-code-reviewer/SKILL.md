---
name: labflow-code-reviewer
description: Use when reviewing, refactoring, debugging, or improving LabFlow code quality, TypeScript, Next.js structure, Supabase queries, permissions, performance, and maintainability.
---

# LabFlow Code Reviewer Skill

Use this skill for critique, code review, refactoring, debugging, and quality improvement.

## Review Standards

Check:

- TypeScript strictness
- modular architecture
- server/client component boundaries
- secure Supabase usage
- role-based access
- no secret leakage
- no fake-only implementation
- no duplicated logic
- no oversized files
- clear naming
- reusable components
- Zod validation for important forms
- useful error handling
- loading states
- tests or manual test instructions
- build/lint health

## Next.js Rules

- Use App Router patterns.
- Keep server-only code server-only.
- Do not expose service role key to browser.
- Use server actions/API routes where appropriate.
- Keep UI components reusable.
- Avoid putting all business logic in page files.

## Supabase Query Rules

- Always filter by `lab_id` where required.
- Respect role access.
- Doctors must never query all doctors or all cases.
- Technicians must not fetch finance.
- Delivery users must not fetch finance.
- Avoid N+1 queries where possible.
- Use indexes for heavy filters.

## Security Review

Before approving:

1. Can doctor access another doctor's case?
2. Can technician see invoices?
3. Can delivery see balances?
4. Can accountant move stages?
5. Can internal comments leak to doctor?
6. Are signed URLs used for private files?
7. Are `.env` files ignored?
8. Are secrets absent from commits?

## Output Format for Reviews

Return:

1. Critical issues
2. High-impact improvements
3. Medium improvements
4. Security issues
5. Data model issues
6. UX issues
7. Suggested implementation plan
8. Files to change
9. Acceptance checklist


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
