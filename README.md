# LabFlow Dental CRM

Production-grade Next.js SaaS foundation for dental laboratory CRM and
production management.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible component structure
- Supabase Auth, PostgreSQL, Storage, and RLS
- Zod and React Hook Form
- Server actions

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Without Supabase env vars, the app runs in typed preview mode. To use live data:

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Set `NEXT_PUBLIC_APP_URL` to your local or deployed app URL.
5. Run `supabase/migrations/0001_initial_labflow_schema.sql`.
6. Create a lab, profile, membership, doctors, and clinics.

Do not place Supabase service role keys in frontend or committed env files.
