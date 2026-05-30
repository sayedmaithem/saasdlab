---
name: labflow-github-devops
description: Use when connecting LabFlow to GitHub, managing branches, commits, pushes, GitHub workflow, Vercel deployment readiness, environment files, and safe DevOps practices.
---

# LabFlow GitHub DevOps Skill

Use this skill for Git, GitHub, branching, commits, pushes, deployment readiness, and safe repository operations.

## Branch Strategy

- `main`: stable production-ready branch
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

## Before Any Change

Run:

```bash
git status
git branch --show-current
git remote -v
```

## Never Commit

- `.env`
- `.env.local`
- `.env.production`
- tokens
- Supabase service role keys
- `node_modules`
- `.next`
- build output
- logs
- local temp files

## Required Files

- `.gitignore`
- `.env.example`
- `README.md`

## Phase Completion

At the end of each phase:

```bash
git status
npm run lint
npm run typecheck
npm run build
git add <safe relevant files>
git commit -m "<clear message>"
git push -u origin <branch>
```

If a script does not exist, report it and continue with available checks.

## Final Report

Always report:

- branch name
- commit message
- commit hash
- push status
- checks run
- failed checks
- changed files
- next recommended prompt

## Safety

- Do not force push unless explicitly approved.
- Do not overwrite remote history.
- Do not hardcode GitHub tokens.
- If auth fails, provide exact safe setup steps.


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
