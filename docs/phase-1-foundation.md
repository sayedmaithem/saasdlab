# Phase 1: SaaS Foundation

## 1. What This Phase Builds

This phase establishes the production foundation for LabFlow Dental CRM:

- Next.js App Router project scaffold.
- Strict TypeScript configuration.
- Tailwind and shadcn/ui-compatible primitives.
- Supabase browser/server client architecture.
- RLS-ready multi-lab database schema.
- Lab dashboard with typed data access.
- Case intake form with Zod validation, React Hook Form, and server action.
- Supabase Storage bucket and policies for clinical/design files.

## 2. Files Created Or Modified

- `package.json`
- `.env.example`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `components.json`
- `app/layout.tsx`
- `app/page.tsx`
- `app/cases/new/page.tsx`
- `app/actions/cases.ts`
- `app/globals.css`
- `components/layout/app-shell.tsx`
- `components/dashboard/*`
- `components/cases/new-case-form.tsx`
- `components/ui/*`
- `lib/constants/workflow.ts`
- `lib/data/dashboard.ts`
- `lib/env.ts`
- `lib/supabase/*`
- `lib/types.ts`
- `lib/validations/case.ts`
- `proxy.ts`
- `supabase/migrations/0001_initial_labflow_schema.sql`
- `README.md`

## 3. Database Changes

The migration creates:

- Lab and membership tables for multi-lab SaaS isolation.
- Profiles and role enum.
- Clinics, doctors, doctor-clinic linking.
- Dental cases with `lab_id`, production stage, priority, assigned technician,
  remake linkage, clinical notes, and due dates.
- Case files with Supabase Storage metadata.
- exocad-oriented design versions.
- Doctor approvals.
- Production tasks.
- Case discussions and internal comments.
- Quality checks.
- Deliveries.
- Invoices, invoice lines, and payments.
- Audit events.
- Storage bucket `labflow-case-files`.

Every business table includes `lab_id` for tenant isolation.

## 4. Security And Permission Considerations

- Supabase service role keys are not used in frontend code.
- Server and browser clients use only public URL and anon key.
- RLS is enabled on business tables.
- Helper functions scope access to active lab memberships.
- Delete policies are limited to `super_admin`, `lab_owner`, and `lab_manager`.
- Storage policies require lab-scoped paths:
  `lab_id/case_id/file-name`.
- Case creation requires authentication and an active lab membership.

TODO for the next phase:

- Add a full invitation/onboarding flow for creating initial owner membership.
- Add granular stage transition permissions by role.
- Add audit triggers that write old/new metadata for sensitive changes.
- Add signed file upload workflow and malware/file validation hooks.

## 5. Implementation

Implemented in this phase:

- Dashboard first screen, not a marketing landing page.
- Preview mode when Supabase env vars are absent.
- Live Supabase query path when env vars are configured.
- Case intake form with client validation and server action insert.
- Migration with scalable business entities and RLS policy baseline.

## 6. Testing Instructions

Run locally:

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Manual checks:

- Visit `http://localhost:3000`.
- Confirm dashboard renders in preview mode if env vars are absent.
- Visit `http://localhost:3000/cases/new`.
- Submit incomplete form and confirm validation messages appear.
- Configure Supabase, run the migration, create a lab membership, then submit a
  real case and confirm it appears in `public.cases`.

## 7. Acceptance Checklist

- [x] Repository inspected before coding.
- [x] Empty repository scaffolded without overwriting existing code.
- [x] Next.js App Router and TypeScript configured.
- [x] Tailwind and shadcn/ui-compatible primitives added.
- [x] Supabase server/browser clients added.
- [x] Multi-lab schema uses `lab_id` on business tables.
- [x] RLS baseline prepared.
- [x] Storage bucket and policies prepared.
- [x] Dashboard uses typed data architecture.
- [x] Case creation has validation and server action.
- [x] No service keys exposed to frontend.
- [x] Clear TODOs documented for incomplete production pieces.
