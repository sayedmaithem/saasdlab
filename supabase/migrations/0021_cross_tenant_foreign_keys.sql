-- =============================================================================
-- Migration: 0021_cross_tenant_foreign_keys.sql
-- Purpose:   Fix Cross-Tenant Data Injection Vulnerability by enforcing
--            lab_id matching across parent-child table relationships.
-- =============================================================================

-- 1. Add Unique Constraints to Parent Tables
-- This allows child tables to reference both the primary key AND the lab_id.
alter table public.cases add constraint cases_id_lab_id_key unique (id, lab_id);
alter table public.profiles add constraint profiles_id_lab_id_key unique (id, lab_id);
alter table public.design_versions add constraint design_versions_id_lab_id_key unique (id, lab_id);
alter table public.invoices add constraint invoices_id_lab_id_key unique (id, lab_id);
alter table public.payments add constraint payments_id_lab_id_key unique (id, lab_id);


-- 2. Drop existing single-column foreign keys from Child Tables
alter table public.case_items drop constraint if exists case_items_case_id_fkey;
alter table public.case_stage_logs drop constraint if exists case_stage_logs_case_id_fkey;
alter table public.case_timeline drop constraint if exists case_timeline_case_id_fkey;
alter table public.case_files drop constraint if exists case_files_case_id_fkey;
alter table public.case_comments drop constraint if exists case_comments_case_id_fkey;

alter table public.design_approvals drop constraint if exists design_approvals_case_id_fkey;
alter table public.design_approvals drop constraint if exists design_approvals_design_version_id_fkey;

alter table public.tasks drop constraint if exists tasks_case_id_fkey;
alter table public.quality_checks drop constraint if exists quality_checks_case_id_fkey;
alter table public.remakes drop constraint if exists remakes_case_id_fkey;

alter table public.invoice_items drop constraint if exists invoice_items_invoice_id_fkey;
alter table public.payment_allocations drop constraint if exists payment_allocations_payment_id_fkey;
alter table public.payment_allocations drop constraint if exists payment_allocations_invoice_id_fkey;
alter table public.deliveries drop constraint if exists deliveries_case_id_fkey;


-- 3. Add Composite Foreign Keys (id + lab_id)
-- This guarantees that a child record can only be inserted if its lab_id exactly matches its parent's lab_id.

-- Case related tables
alter table public.case_items 
  add constraint case_items_case_lab_fk 
  foreign key (case_id, lab_id) references public.cases(id, lab_id) on delete cascade;

alter table public.case_stage_logs 
  add constraint case_stage_logs_case_lab_fk 
  foreign key (case_id, lab_id) references public.cases(id, lab_id) on delete cascade;

alter table public.case_timeline 
  add constraint case_timeline_case_lab_fk 
  foreign key (case_id, lab_id) references public.cases(id, lab_id) on delete cascade;

alter table public.case_files 
  add constraint case_files_case_lab_fk 
  foreign key (case_id, lab_id) references public.cases(id, lab_id) on delete cascade;

alter table public.case_comments 
  add constraint case_comments_case_lab_fk 
  foreign key (case_id, lab_id) references public.cases(id, lab_id) on delete cascade;

-- Design Approvals
alter table public.design_approvals 
  add constraint design_approvals_case_lab_fk 
  foreign key (case_id, lab_id) references public.cases(id, lab_id) on delete cascade;

alter table public.design_approvals 
  add constraint design_approvals_design_version_lab_fk 
  foreign key (design_version_id, lab_id) references public.design_versions(id, lab_id) on delete cascade;

-- Tasks & QC
alter table public.tasks 
  add constraint tasks_case_lab_fk 
  foreign key (case_id, lab_id) references public.cases(id, lab_id) on delete cascade;

alter table public.quality_checks 
  add constraint quality_checks_case_lab_fk 
  foreign key (case_id, lab_id) references public.cases(id, lab_id) on delete cascade;

alter table public.remakes 
  add constraint remakes_case_lab_fk 
  foreign key (case_id, lab_id) references public.cases(id, lab_id) on delete cascade;

-- Finance
alter table public.invoice_items 
  add constraint invoice_items_invoice_lab_fk 
  foreign key (invoice_id, lab_id) references public.invoices(id, lab_id) on delete cascade;

alter table public.payment_allocations 
  add constraint payment_allocations_payment_lab_fk 
  foreign key (payment_id, lab_id) references public.payments(id, lab_id) on delete cascade;

alter table public.payment_allocations 
  add constraint payment_allocations_invoice_lab_fk 
  foreign key (invoice_id, lab_id) references public.invoices(id, lab_id) on delete cascade;

-- Delivery
alter table public.deliveries 
  add constraint deliveries_case_lab_fk 
  foreign key (case_id, lab_id) references public.cases(id, lab_id) on delete cascade;
