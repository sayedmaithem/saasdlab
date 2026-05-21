-- =============================================================================
-- Migration: 0011_security_hotfixes.sql
-- Purpose:   Close critical security finding C2 — doctor uploaded_by bypass
-- =============================================================================
--
-- C2 Finding:
--   can_select_case_file() granted doctors access to any file they uploaded
--   (uploaded_by = auth.uid()) regardless of the visibility flag.
--   A doctor who uploaded a private_finance file retained permanent read access.
--
-- Fix:
--   Doctors may only see files explicitly marked doctor_visible on their cases.
--   The uploaded_by = auth.uid() branch is removed entirely for the doctor role.
--
-- Additional hardening (same function):
--   Accountants can now see files with visibility = 'private_finance' in
--   addition to category = 'invoices', since finance files may carry either
--   attribute depending on upload path.
--
-- Technicians and delivery roles are unchanged.
-- All other migrations (0001–0010) are not modified.
-- =============================================================================

create or replace function public.can_select_case_file(p_file_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.case_files cf
    where cf.id = p_file_id
      and (

        -- Lab admins see all files in their lab
        public.has_lab_role(
          cf.lab_id,
          array['super_admin','lab_owner','lab_manager']::public.app_role[]
        )

        -- Reception sees all non-finance files
        or (
          public.has_lab_role(cf.lab_id, array['reception']::public.app_role[])
          and cf.visibility::text <> 'private_finance'
        )

        -- Accountant sees invoice-category files and private_finance files
        or (
          public.has_lab_role(cf.lab_id, array['accountant']::public.app_role[])
          and (
            cf.category::text = 'invoices'
            or cf.visibility::text = 'private_finance'
          )
        )

        -- Doctor sees ONLY files explicitly marked doctor_visible for their cases.
        -- The uploaded_by = auth.uid() bypass has been removed (C2 fix):
        -- doctors cannot see private_finance or internal files they uploaded.
        or (
          public.is_case_doctor(cf.case_id)
          and cf.visibility::text = 'doctor_visible'
        )

        -- Technician sees assigned-case files, excluding private finance
        or (
          public.is_case_technician(cf.case_id)
          and cf.visibility::text <> 'private_finance'
        )

        -- Delivery sees only delivery-category files for assigned cases
        or (
          public.is_delivery_assigned(cf.case_id)
          and cf.category::text = 'delivery'
        )

      )
  );
$$;
