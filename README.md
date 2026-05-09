# LabFlow Dental CRM

LabFlow Dental CRM is a production-grade SaaS foundation for dental laboratory CRM, case intake, CAD/CAM workflow, QC, delivery, finance, and doctor collaboration.

## Tech Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui-compatible local primitives
- Supabase Auth, PostgreSQL, Storage, and RLS
- Supabase Storage bucket: `case-files`
- Zod validation and server actions

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Without Supabase environment variables, the app runs in local preview mode for UI inspection. Live workflows require a Supabase project.

## Environment Variables

Copy `.env.example` to `.env.local` and fill only local/private values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=
```

`SUPABASE_SERVICE_ROLE_KEY` is intentionally not required by the app runtime. If you use it for one-off admin scripts, keep it server-only and never expose it to the browser.

## Supabase Setup

1. Create a Supabase project.
2. Apply migrations in order from `supabase/migrations`.
3. Run `supabase/seed.sql` only in development.
4. Create the private Storage bucket `case-files`.
5. Confirm RLS is enabled on business tables.
6. Configure Supabase Auth redirect URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Vercel: `https://your-domain.com/auth/callback`

## Storage Notes

Case files are stored under:

```text
case-files/{lab_id}/{case_id}/{category}/...
```

Supported categories include doctor uploads, scan files, photos, exocad design, design versions, CAM/milling, QC photos, delivery proof, and invoice files.

## RLS Notes

The schema is multi-lab. Business tables carry `lab_id`, and policies scope access by lab membership and role. Doctors are scoped to their own cases and financial statement. Technicians are scoped to assigned work and cannot access finance. Delivery users are scoped to delivery workflows.

## Vercel Deployment

1. Connect the GitHub repository to Vercel.
2. Set production environment variables.
3. Set Supabase Auth callback URL to the deployed domain.
4. Deploy from `develop` or promote a tested release branch to `main`.

## GitHub Workflow

- `main`: stable production branch.
- `develop`: integrated completed phases.
- `phase-*`: focused implementation branches.

Each phase should run typecheck, lint, and build before push.

## Current MVP Capabilities

- Auth, roles, protected routes
- Doctors and clinics
- Cases and missing information engine
- Supabase case file manager
- Production Kanban and technician workspace
- exocad design version approvals
- Comments and timeline
- QC and remakes
- Invoices, payments, partial payment allocation, statements
- Delivery queue and proof reference workflow
- Doctor portal
- Dashboard and reports
- Settings and RTL-readiness foundation

## Known Limitations

- Delivery proof upload uses the existing case file manager and links proof file IDs from delivery forms.
- Charts are represented as clean tables/cards until a chart library is chosen.
- Notification channels are placeholders for future email, WhatsApp, and in-app routing.
- Invite-user flow and advanced settings persistence are reserved for the next production hardening phase.

## Phase 2 Roadmap

- Production-ready user invitations
- Full notification center
- Print/PDF invoice and statement exports
- Chart library integration
- Advanced delivery proof upload UX
- Supabase Edge Functions for scheduled overdue invoice updates
- Arabic translations and runtime direction toggle
