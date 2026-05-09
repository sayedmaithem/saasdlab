# Phase 0: Repository Audit And GitHub Workflow

## Repository Status

LabFlow Dental CRM is currently a partial Next.js SaaS foundation, not an empty
project. It already contains the Phase 1 application scaffold, dashboard,
case-intake form, Supabase client setup, and an initial Supabase migration.

## Detected Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible local component primitives
- Supabase Auth/PostgreSQL/Storage architecture
- Zod validation
- React Hook Form
- Server actions
- npm with `package-lock.json`

## Existing Routes

- `/`
- `/cases/new`

## Existing Supabase Assets

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `proxy.ts` for Supabase session refresh
- `supabase/migrations/0001_initial_labflow_schema.sql`

## Git Workflow

- `main`: stable production-ready branch
- `develop`: integration branch for completed phases
- `phase-XX-*`: isolated implementation branches

Every future phase should:

1. Inspect the current repository state.
2. Create or switch to the correct phase branch.
3. Implement the scoped phase only.
4. Run `npm run lint`, `npm run typecheck`, and `npm run build`.
5. Commit a small, meaningful change.
6. Push the branch to GitHub.
7. Report branch name, commit hash, and push status.

## Safety Rules

- Never commit `.env` files or secrets.
- Never expose Supabase service role keys in frontend code.
- Never force-push without explicit approval.
- Do not rewrite existing app code unless the phase requires it.
- Keep migrations reviewable and tenant-aware with `lab_id` on business tables.
