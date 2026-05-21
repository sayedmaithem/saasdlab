-- Migration 0012: Table-level grants for authenticated role
--
-- Root cause: Migrations 0001–0011 created all business tables without any
-- GRANT statements. PostgreSQL evaluates table-level privileges BEFORE RLS
-- policies. When an authenticated user queries profiles, PostgreSQL returns
-- "permission denied for table profiles" before the RLS layer is reached.
--
-- Fix: Grant SELECT, INSERT, UPDATE, DELETE on all existing tables to the
-- authenticated role. This does NOT weaken RLS — RLS policies remain fully
-- active and control which rows each user can read or write. The grants
-- simply allow queries to reach the RLS layer.
--
-- Additionally, ALTER DEFAULT PRIVILEGES ensures any tables created in future
-- migrations inherit these grants automatically.

-- ============================================================
-- 1. Schema usage
-- ============================================================
grant usage on schema public to authenticated;

-- ============================================================
-- 2. Table-level privileges: existing tables
-- Grant CRUD to authenticated. RLS policies on each table restrict
-- which rows the user can actually access.
-- ============================================================
grant select, insert, update, delete on
  -- Identity / membership
  public.labs,
  public.profiles,
  public.lab_memberships,
  public.user_roles,
  -- Contacts
  public.clinics,
  public.doctors,
  public.doctor_clinics,
  public.doctor_price_lists,
  public.technicians,
  public.technician_skills,
  -- Cases
  public.cases,
  public.case_items,
  public.case_stage_logs,
  public.case_timeline,
  public.case_files,
  public.case_comments,
  public.case_discussions,
  public.internal_comments,
  -- Design
  public.design_versions,
  public.design_approvals,
  public.doctor_approvals,
  public.production_tasks,
  public.tasks,
  -- QC / Remakes
  public.quality_checks,
  public.quality_check_items,
  public.remakes,
  -- Finance
  public.invoices,
  public.invoice_lines,
  public.invoice_items,
  public.payments,
  public.payment_allocations,
  -- Delivery
  public.deliveries,
  -- Misc
  public.notifications,
  public.audit_events,
  public.audit_logs,
  public.app_settings
to authenticated;

-- ============================================================
-- 3. Sequence usage (for any tables with serial/bigserial PKs)
-- ============================================================
grant usage, select on all sequences in schema public to authenticated;

-- ============================================================
-- 4. Function execute: RLS helper functions called inside policies
-- (current_lab_ids, has_lab_role, is_case_doctor, is_case_technician, etc.)
-- are security definer, but execute permission is still required.
-- ============================================================
grant execute on all functions in schema public to authenticated;

-- ============================================================
-- 5. Default privileges: future tables automatically get the same grants
-- so migrations 0013+ do not need to include explicit GRANT statements.
-- ============================================================
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant usage, select on sequences to authenticated;

alter default privileges in schema public
  grant execute on functions to authenticated;
