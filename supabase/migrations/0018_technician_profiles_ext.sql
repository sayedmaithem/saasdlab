-- ============================================================
-- Migration 0018 — Technician Profiles Extension
-- ============================================================
-- Additive only. Extends the existing technicians table with
-- skills, certifications, employment details, and capacity
-- tracking without altering any existing column.
--
-- Tables:
--   technician_profiles_ext — skills / cert / capacity
-- ============================================================

create table if not exists public.technician_profiles_ext (
  -- 1:1 with technicians; technician_id is both PK and FK
  technician_id      uuid        primary key
                                 references public.technicians(id) on delete cascade,
  lab_id             uuid        not null
                                 references public.labs(id) on delete cascade,

  -- Employment
  employment_type    text        not null default 'full_time'
                                 check (employment_type in ('full_time','part_time','contractor','intern')),
  hire_date          date,
  hourly_rate        numeric(10,2),                 -- optional; finance-role-visible only

  -- Capacity
  -- Daily working capacity in minutes (default: 480 = 8 h)
  daily_capacity_minutes  int   not null default 480 check (daily_capacity_minutes > 0),

  -- Skills — freeform text array; e.g. {'CAD/CAM','Porcelain','Implant'}
  skills             text[]      not null default '{}',

  -- Certifications — stored as JSON array:
  -- [{ "name": "ISO 13485", "issued": "2024-01", "expires": "2027-01" }]
  certifications     jsonb       not null default '[]'::jsonb,

  -- Internal notes (manager-only)
  notes              text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── Index ──────────────────────────────────────────────────────────
create index if not exists tpe_lab_idx on public.technician_profiles_ext (lab_id);

-- ── RLS ────────────────────────────────────────────────────────────
alter table public.technician_profiles_ext enable row level security;

-- Read: any authenticated member of the same lab
create policy "tpe_lab_read"
  on public.technician_profiles_ext for select
  to authenticated
  using (lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1));

-- Write: only lab owner / manager / super_admin
create policy "tpe_lab_owner_manage"
  on public.technician_profiles_ext for all
  to authenticated
  using (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = technician_profiles_ext.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  )
  with check (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = technician_profiles_ext.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  );

-- ── Grants ─────────────────────────────────────────────────────────
grant select, insert, update, delete on public.technician_profiles_ext to authenticated;
grant select, insert, update, delete on public.technician_profiles_ext to service_role;
