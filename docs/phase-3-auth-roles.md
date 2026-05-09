# Phase 3: Auth, Roles, And Route Protection

## Permission Matrix

| Role | Access |
| --- | --- |
| Super Admin | All modules |
| Lab Owner | All lab modules |
| Lab Manager | Dashboard, doctors read, cases, production, technicians, delivery, reports |
| Reception | Dashboard, doctors, cases, files, comments |
| Technician | Cases assigned by RLS, production, technician workspace, files, comments, QC |
| Accountant | Doctors read, invoices, payments, statements, finance reports |
| Doctor | Doctor portal, own cases, own files, own comments, own invoices |
| Delivery | Delivery module and assigned delivery cases |

## Manual Test Steps

1. Configure Supabase env vars and run migrations/seeds.
2. Sign in at `/auth` with each seeded user.
3. Confirm the sidebar only shows allowed modules for that role.
4. Open a disallowed route directly and confirm `/unauthorized`.
5. Confirm the topbar profile dropdown shows profile name, email, role, and sign out.
6. Sign out and confirm protected routes redirect to `/auth`.

## Seed Users

- `owner@labflow.local`
- `manager@labflow.local`
- `technician@labflow.local`
- `doctor@labflow.local`
- `accountant@labflow.local`

All local seed passwords are `password`.
