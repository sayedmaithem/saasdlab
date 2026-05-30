---
name: opus-orchestrator
description: Use this skill when the user asks for deep architecture, 10x critique, complex system planning, security review, final QA, prompt chaining, or deciding how to split work between Opus, Sonnet, and Haiku.
---

# Opus Orchestrator Skill

Use this skill when the task requires the strongest reasoning available.
This is not for routine coding. It is for thinking, designing, critiquing, and deciding.

---

## When to Use Opus

Use Opus for every task in this list:

- Deep architecture decisions
- Critiquing previous implementation work
- Finding hidden weaknesses in existing code
- Designing full SaaS system structure
- Database schema design and security strategy
- Supabase RLS policy design and review
- Role-based permission design (8-role RBAC model)
- Multi-phase project planning
- Prompt chain design (how to break work across models)
- Final QA before launch
- Risk analysis
- Complex refactors with cross-cutting concerns
- Product strategy and roadmap
- LabFlow workflow correctness review
- exocad design workflow architecture
- SaaS scaling decisions
- Audit log and event sourcing design
- Missing information engine logic review
- Doctor approval gate correctness
- QC gate correctness (must pass before delivery)
- Finance isolation review (technicians and delivery must never see finance)
- Security boundary review

---

## When NOT to Use Opus

Do not use Opus for:

- Simple UI edits or copy changes
- Quick file creation
- Small bug fixes
- Repetitive code generation
- Basic summaries
- Renaming files or variables
- Standard CRUD implementation
- Adding a new page that follows an existing pattern
- Formatting or linting

---

## Model Selection Rules

### Opus
Use for: thinking, planning, architecture, critique, security, complex decisions, and final review.

Trigger phrases that should route to Opus:
- "audit this"
- "review this deeply"
- "is this secure?"
- "critique the architecture"
- "is the workflow correct?"
- "what are we missing?"
- "design the full system"
- "10x this"
- "launch readiness"
- "RLS review"
- "permission design"
- "phase planning"

### Sonnet
Use for: most software creation and implementation work.

- Building features end to end
- Editing and creating files
- Implementing Next.js pages and components
- Refactoring components
- Connecting Supabase (client and server)
- Writing server actions
- Fixing moderate bugs
- Building MVP modules
- Writing Zod schemas and validation
- Setting up routes and middleware

### Haiku
Use for: fast, low-cost, lightweight tasks.

- Simple summaries
- Renaming files
- Small text changes
- Generating small examples
- Quick formatting
- Basic checklists
- Lightweight explanations
- Answering quick factual questions

---

## LabFlow Phase Model Recommendations

| Phase | Task | Recommended Model |
|-------|------|------------------|
| Phase 0 | Repository audit | Opus |
| Phase 1 | Foundation planning | Opus |
| Phase 1 | Foundation implementation | Sonnet |
| Phase 2 | Database schema design | Opus |
| Phase 2 | Migration implementation | Sonnet |
| Phase 3 | Auth and roles planning | Opus |
| Phase 3 | Auth implementation | Sonnet |
| Phase 4 | Doctors and clinics | Sonnet |
| Phase 5 | Missing info engine planning | Opus |
| Phase 5 | Cases implementation | Sonnet |
| Phase 6 | Cloud file manager | Sonnet |
| Phase 6 | File security review | Opus |
| Phase 7 | Production Kanban | Sonnet |
| Phase 7 | Workflow correctness review | Opus |
| Phase 8 | exocad design planning | Opus |
| Phase 8 | Design workflow implementation | Sonnet |
| Phase 9 | Comments and timeline | Sonnet |
| Phase 10 | QC and remakes planning | Opus |
| Phase 10 | QC and remakes implementation | Sonnet |
| Phase 11-15 | Finance, delivery, portal planning | Opus |
| Phase 11-15 | Finance, delivery, portal implementation | Sonnet |
| Phase 11-15 | Final section review | Opus |
| Phase 16 | Final QA | Opus |
| Any | Small docs or formatting | Haiku |

**Rule:** Start big phases with Opus. Implement code with Sonnet. Use Haiku only for small helper tasks. Finish important phases with Opus review.

**Always recommend the right model before a major task:**
- "Use Opus for this phase planning."
- "Use Sonnet for this implementation."
- "Use Haiku for this quick task."

---

## LabFlow Security Checklist (Run During Every Opus Review)

When reviewing LabFlow, verify all of the following:

### Role Boundaries
- [ ] Doctors cannot see other doctors cases or data
- [ ] Technicians cannot see any finance (invoices, payments, statements)
- [ ] Delivery users cannot see any finance
- [ ] Accountants cannot move production stages
- [ ] Internal comments are never visible to doctors
- [ ] Doctor portal only shows that doctors own cases, files, and invoices

### Data Isolation
- [ ] Every business query filters by lab_id
- [ ] Supabase RLS policies enforce lab_id on all business tables
- [ ] No query returns data across lab tenants
- [ ] Service role key is never referenced in client-side code or committed to git

### Workflow Gates
- [ ] Missing information blocks a case from entering production
- [ ] Doctor approval blocks manufacturing when required
- [ ] QC must pass before case moves to ready_for_delivery
- [ ] Delivery proof is uploaded before case is marked delivered
- [ ] Every major event creates a case_timeline record with actor, timestamp, and notes

### GitHub and Secrets
- [ ] .env files are in .gitignore
- [ ] No service role keys in any committed file
- [ ] No tokens or secrets in source code
- [ ] node_modules, .next, and build output are in .gitignore

### Production Readiness
- [ ] README.md exists
- [ ] .env.example exists with all required keys (no values)
- [ ] Database migrations are versioned
- [ ] No console.log with sensitive data
- [ ] Supabase RLS is enabled on all business tables
- [ ] No public Supabase table with open SELECT for all roles

---

## Prompt Chaining Guide

When a task is large, break it into a chain:

1. **Opus** - Audit the current state, identify gaps, design the solution
2. **Sonnet** - Implement the solution file by file
3. **Opus** - Review the implementation, verify security and correctness
4. **Haiku** - Generate changelogs, summaries, or documentation notes

Do not send large tasks directly to Sonnet without Opus planning if the task involves:
- Database schema changes
- RLS policy changes
- New roles or permissions
- Multi-step workflow changes
- Finance or security-sensitive modules

---

## Quick Reference

| Situation | Model |
|-----------|-------|
| "What should we build next?" | Opus |
| "Build the doctor profile page" | Sonnet |
| "Rename this variable" | Haiku |
| "Review our RLS policies" | Opus |
| "Fix this TypeScript error" | Sonnet |
| "Summarize this file" | Haiku |
| "Design the missing info engine" | Opus |
| "Implement the missing info engine" | Sonnet |
| "Is this production-ready?" | Opus |
| "Add a loading spinner" | Sonnet |
| "Format this markdown table" | Haiku |
