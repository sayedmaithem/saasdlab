# Claude Model Usage Guide — LabFlow Dental CRM

This file defines which Claude model to use for every type of task in this project.
Read this before starting any major piece of work.

---

## The Three Models

### Claude Opus
The strongest reasoning model. Use it for thinking, designing, auditing, and deciding.
It is slower and more expensive — reserve it for tasks that genuinely need deep intelligence.

### Claude Sonnet
The primary workhorse model. Use it for most software development work.
Fast enough for day-to-day use, capable enough for real production code.

### Claude Haiku
The fastest and cheapest model. Use it only for simple, lightweight tasks.
Do not use Haiku for anything complex or security-sensitive.

---

## 1. When to Use Opus

Use Opus when the task requires:

- Deep thinking about architecture or system design
- Critiquing previous work for hidden weaknesses
- Security review of any module
- Supabase RLS policy design or audit
- Role-based access control planning
- Database schema design decisions
- Multi-phase project planning
- Prompt chain design (how to split work between models)
- Workflow correctness review (case lifecycle, doctor approval, QC gates)
- Finance isolation review (who can and cannot see money)
- Launch readiness and final QA
- Risk analysis before major changes
- Complex refactors that touch multiple modules
- exocad design workflow architecture
- Audit log and event sourcing strategy
- Deciding how to rebuild or restructure something that is messy
- Any task where a wrong decision has high cost

**Signs you need Opus:**
- The question starts with "should we", "how should", "what is the best way"
- The task involves security or permissions
- You are unsure about the architecture
- You are about to make a database schema change
- You are reviewing work before marking a phase complete

---

## 2. When to Use Sonnet

Use Sonnet for most day-to-day software development:

- Implementing Next.js pages and components
- Writing and editing TypeScript files
- Creating server actions and API routes
- Connecting Supabase (client-side and server-side)
- Building forms with React Hook Form and Zod
- Fixing bugs of moderate complexity
- Refactoring components
- Building new modules following existing patterns
- Setting up middleware and route guards
- Writing database queries
- Implementing the Kanban production board
- Building the doctor portal pages
- Implementing finance, delivery, and QC modules
- Adding missing validation logic
- Writing seed data scripts

**Signs Sonnet is right:**
- You know what to build and just need it coded
- The task is a specific file or component
- You are following a pattern that already exists in the project
- The task does not involve changing permissions or security

---

## 3. When to Use Haiku

Use Haiku only for simple, fast, low-stakes tasks:

- Summarizing a file or function
- Renaming variables or files
- Small text or copy changes
- Generating a quick example
- Formatting or reformatting text
- Writing basic checklists
- Lightweight documentation edits
- Answering quick factual questions
- Generating a git commit message
- Explaining a small piece of code

**Signs Haiku is wrong:**
- The task involves security
- The task changes database schema or RLS
- The task adds or removes permissions
- The task is more than 50 lines of new code
- The answer will be used directly in production

---

## 4. LabFlow Phase-by-Phase Model Recommendations

| Phase | Work Type | Model |
|-------|-----------|-------|
| Phase 0 | Repository audit, git setup, health check | **Opus** |
| Phase 1 | Foundation planning (stack, folder structure, architecture) | **Opus** |
| Phase 1 | Foundation implementation (Next.js setup, Supabase client, layout, sidebar) | **Sonnet** |
| Phase 2 | Database schema design and RLS strategy | **Opus** |
| Phase 2 | Migration file writing and implementation | **Sonnet** |
| Phase 2 | RLS policy review after implementation | **Opus** |
| Phase 3 | Auth and roles planning | **Opus** |
| Phase 3 | Auth implementation (login, session, guards, middleware) | **Sonnet** |
| Phase 4 | Doctors and clinics module (CRUD, forms, tables) | **Sonnet** |
| Phase 5 | Missing information engine design | **Opus** |
| Phase 5 | Cases module implementation | **Sonnet** |
| Phase 5 | Missing info engine logic review | **Opus** |
| Phase 6 | Cloud file manager implementation | **Sonnet** |
| Phase 6 | File access control and security review | **Opus** |
| Phase 7 | Production Kanban implementation | **Sonnet** |
| Phase 7 | Workflow correctness review (stage transitions, gates) | **Opus** |
| Phase 8 | exocad design workflow architecture | **Opus** |
| Phase 8 | Design version and approval implementation | **Sonnet** |
| Phase 9 | Case comments and timeline implementation | **Sonnet** |
| Phase 10 | QC and remakes planning | **Opus** |
| Phase 10 | QC and remakes implementation | **Sonnet** |
| Phase 11 | Finance module planning (invoice, payment, statement) | **Opus** |
| Phase 11 | Finance module implementation | **Sonnet** |
| Phase 12 | Delivery module implementation | **Sonnet** |
| Phase 13 | Doctor portal implementation | **Sonnet** |
| Phase 14 | Dashboard and reports implementation | **Sonnet** |
| Phase 15 | Settings, polish, RTL, notifications | **Sonnet** |
| Phase 15 | Final section review and hardening | **Opus** |
| Phase 16 | Final QA and launch readiness review | **Opus** |
| Any | Small docs edits, formatting, summaries | **Haiku** |

---

## 5. How to Combine the Models

The most effective workflow is a prompt chain:

### For a Major Phase or Feature

```
Step 1 — Opus
"Audit the current state of [module].
Identify what is missing, what is wrong, what is insecure.
Design the correct solution.
Tell me exactly what files need to be created or changed and why."

Step 2 — Sonnet
"Implement what Opus planned.
Create [file 1], [file 2], [file 3].
Follow the existing patterns in the project."

Step 3 — Opus
"Review what Sonnet implemented.
Check for security issues, logic errors, missing edge cases.
Verify all workflow gates are correct."

Step 4 — Haiku (optional)
"Summarize the changes made in this phase in one paragraph."
```

### For a Routine Feature

```
Step 1 — Sonnet
"Build [specific page or component] following the existing pattern."

Step 2 — Sonnet (if needed)
"Fix [specific issue found in step 1]."
```

### For Security-Sensitive Work

```
Step 1 — Opus
"Review the RLS policies for [table].
Check: does every role see only what it is allowed to see?
Is lab_id enforced everywhere?"

Step 2 — Sonnet (if changes needed)
"Update the RLS migration with the corrections Opus identified."

Step 3 — Opus
"Confirm the updated policies are correct."
```

---

## 6. Rules That Never Change

- Never use Haiku for anything involving security, permissions, or database schema.
- Never skip Opus review before marking a security-sensitive phase complete.
- Always start a new major phase with an Opus audit of current state.
- Always end a major phase with an Opus review before moving to the next phase.
- Use Sonnet as the default model for all implementation work.
- When in doubt about which model to use, use Sonnet for coding and Opus for decisions.

---

## 7. Quick Decision Table

| Question | Answer |
|----------|--------|
| What model do I use right now? | Sonnet unless you are planning, auditing, or reviewing security |
| Should I use Opus for this CRUD page? | No. Use Sonnet. |
| Should I use Opus to review RLS policies? | Yes. Always. |
| Should I use Haiku to implement a server action? | No. Use Sonnet. |
| Should I use Opus before starting Phase 5? | Yes. Audit first. |
| Should I use Opus for the final QA? | Yes. Always. |
| What do I use to rename a variable? | Haiku or Sonnet. Either is fine. |
| What do I use to design the finance module? | Opus for planning, Sonnet for implementation. |
