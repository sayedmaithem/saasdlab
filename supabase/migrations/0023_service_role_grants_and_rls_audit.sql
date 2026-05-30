-- Migration 0023: service_role grants for pre-0016 tables + RLS enforcement
--
-- Problem: Migrations 0001–0015 created tables without granting privileges to
-- service_role. Migration 0016 added default privileges for service_role going
-- forward, but existing tables created before 0016 are missing these grants.
-- This prevents the admin client (service_role JWT) from reading/writing those
-- tables via PostgREST.
--
-- Fix 1: Explicit grants on all pre-0016 tables to service_role.
-- Fix 2: Ensure RLS is enabled on ALL public business tables (idempotent).
-- Fix 3: Grant service_role execute on all functions.

-- ============================================================
-- 1. service_role grants on pre-0016 tables
-- ============================================================
grant select, insert, update, delete on
  public.labs,
  public.profiles,
  public.lab_memberships,
  public.clinics,
  public.doctors,
  public.doctor_clinics,
  public.cases,
  public.case_files,
  public.design_versions,
  public.doctor_approvals,
  public.production_tasks,
  public.case_discussions,
  public.internal_comments,
  public.quality_checks,
  public.deliveries,
  public.invoices,
  public.invoice_lines,
  public.payments,
  public.audit_events
to service_role;

-- Tables added in 0002–0015 that may be missing service_role grants
grant select, insert, update, delete on
  public.user_roles,
  public.case_items,
  public.case_stage_logs,
  public.case_timeline,
  public.case_comments,
  public.design_approvals,
  public.doctor_price_lists,
  public.invoice_items,
  public.payment_allocations,
  public.remakes,
  public.quality_check_items,
  public.tasks,
  public.technicians,
  public.technician_skills,
  public.notifications,
  public.audit_logs,
  public.app_settings,
  public.portal_access_templates,
  public.portal_invitations,
  public.lab_operations,
  public.lab_materials,
  public.operation_prices,
  public.price_groups,
  public.technician_operation_rates
to service_role;

-- Sequences
grant usage, select on all sequences in schema public to service_role;

-- Functions
grant execute on all functions in schema public to service_role;

-- ============================================================
-- 2. Ensure RLS is ON for all public business tables (idempotent)
-- ============================================================
do $$
declare
  t text;
begin
  for t in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and rowsecurity = false
      and tablename not in (
        -- exclude internal/system tables if any
        'schema_migrations'
      )
  loop
    execute format('alter table public.%I enable row level security', t);
    raise notice 'Enabled RLS on: %', t;
  end loop;
end $$;

-- ============================================================
-- 3. Seed ODENT Lab row (idempotent)
-- The production lab row. Slug must be unique.
-- ============================================================
insert into public.labs (id, name, slug, timezone)
values (
  'aaaaaaaa-0000-4000-8000-000000000001',
  'ODENT Lab',
  'odent-lab',
  'Asia/Baghdad'
)
on conflict (slug) do update set
  name = excluded.name,
  updated_at = now();
