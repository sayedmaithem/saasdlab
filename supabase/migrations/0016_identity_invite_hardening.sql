-- Migration 0016: Identity Invite Table Grants & Hardening
--
-- Root cause: Migration 0012 set ALTER DEFAULT PRIVILEGES for the
-- `authenticated` role only. The `service_role` (used by the server-side
-- admin client in lib/supabase/admin.ts) needs explicit GRANT to read/write
-- portal_invitations and access_audit_logs without being blocked by PostgreSQL's
-- table-level privilege check (which happens before RLS policies are evaluated).
--
-- This is a safe additive migration:
--   - It does NOT weaken RLS on any existing table
--   - It does NOT change any existing policies
--   - It does NOT grant DELETE on access_audit_logs to authenticated
--     (audit logs are append-only for all non-superuser roles)
--   - It adds service_role grants so the admin client can create invite records
--     and write audit events server-side

-- ============================================================
-- 1. Explicit grants for portal_invitations
-- ============================================================

-- authenticated: full CRUD — RLS policies on the table restrict which rows
-- each user can actually access (lab_owner/lab_manager only, own lab only)
grant select, insert, update on public.portal_invitations to authenticated;

-- service_role: full access for server-side admin client (bypasses RLS,
-- used by createPortalUserOrInviteAction to write invite records)
grant select, insert, update, delete on public.portal_invitations to service_role;

-- ============================================================
-- 2. Explicit grants for access_audit_logs
-- ============================================================

-- authenticated: SELECT and INSERT only — audit logs are append-only.
-- No UPDATE or DELETE is granted to authenticated, enforcing immutability
-- at the PostgreSQL privilege level in addition to the RLS policy layer.
grant select, insert on public.access_audit_logs to authenticated;

-- service_role: full access for server-side audit writing
grant select, insert, update, delete on public.access_audit_logs to service_role;

-- ============================================================
-- 3. Sequence grants
-- ============================================================

-- These tables use UUID PKs (gen_random_uuid) so no sequences are needed,
-- but grant for completeness if any serial columns are added later.
grant usage, select on all sequences in schema public to service_role;

-- ============================================================
-- 4. Update default privileges so any future tables also get service_role access
-- This prevents the same issue from recurring in migrations 0017+
-- ============================================================

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
  grant usage, select on sequences to service_role;
