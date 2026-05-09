-- LabFlow Dental CRM production schema expansion.
-- This migration is additive over 0001 and prepares the production-grade
-- multi-lab data model, indexes, and understandable RLS policy baseline.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.case_status as enum ('open', 'on_hold', 'cancelled', 'completed', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.missing_info_status as enum ('complete', 'missing', 'requested', 'received');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.file_category as enum ('intake', 'scan', 'design', 'preview', 'approval', 'qc', 'delivery', 'invoice', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.file_visibility as enum ('internal', 'doctor_visible');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.design_status as enum ('draft', 'submitted', 'changes_requested', 'approved', 'rejected', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.qc_result as enum ('passed', 'failed', 'needs_review');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.remake_responsibility as enum ('lab', 'doctor', 'patient', 'material', 'unknown');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.delivery_status as enum ('pending', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_status as enum ('unread', 'read', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.timeline_event_type as enum (
    'created',
    'updated',
    'stage_changed',
    'comment_added',
    'file_uploaded',
    'design_submitted',
    'approval_updated',
    'qc_recorded',
    'invoice_created',
    'payment_recorded',
    'delivery_updated',
    'remake_created'
  );
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists lab_id uuid references public.labs(id) on delete set null,
  add column if not exists role public.app_role,
  add column if not exists is_active boolean not null default true;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (lab_id, user_id, role)
);

create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  phone text,
  employment_status text not null default 'active'
    check (employment_status in ('active', 'inactive', 'contractor')),
  productivity_score numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.technician_skills (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  technician_id uuid not null references public.technicians(id) on delete cascade,
  skill text not null,
  level integer not null default 1 check (level between 1 and 5),
  created_at timestamptz not null default now(),
  unique (technician_id, skill)
);

alter table public.cases
  add column if not exists patient_name text,
  add column if not exists work_type text,
  add column if not exists material text,
  add column if not exists units_count integer not null default 1 check (units_count > 0),
  add column if not exists priority_score integer not null default 0,
  add column if not exists status public.case_status not null default 'open',
  add column if not exists current_stage public.case_stage not null default 'received',
  add column if not exists is_urgent boolean not null default false,
  add column if not exists is_remake boolean not null default false,
  add column if not exists is_warranty boolean not null default false,
  add column if not exists requires_doctor_approval boolean not null default false,
  add column if not exists missing_info_status public.missing_info_status not null default 'complete',
  add column if not exists missing_info_fields jsonb not null default '[]'::jsonb,
  add column if not exists total_price numeric(12,2) not null default 0 check (total_price >= 0),
  add column if not exists notes text;

update public.cases
set
  patient_name = coalesce(patient_name, patient_display),
  work_type = coalesce(work_type, restoration_type),
  current_stage = coalesce(current_stage, stage),
  notes = coalesce(notes, clinical_notes),
  is_urgent = case when priority = 'urgent' then true else is_urgent end
where patient_name is null
   or work_type is null
   or notes is null
   or current_stage is null;

alter table public.cases
  alter column patient_name set not null,
  alter column work_type set not null;

create table if not exists public.case_items (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  tooth_numbers jsonb not null default '[]'::jsonb,
  work_type text not null,
  material text,
  shade text,
  units_count integer not null default 1 check (units_count > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  total_price numeric(12,2) generated always as (units_count * unit_price) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.case_stage_logs (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  from_stage public.case_stage,
  to_stage public.case_stage not null,
  changed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.case_timeline (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type public.timeline_event_type not null,
  title text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.case_files
  add column if not exists category public.file_category not null default 'other',
  add column if not exists file_path text,
  add column if not exists file_type public.file_kind,
  add column if not exists file_size bigint,
  add column if not exists visibility public.file_visibility not null default 'internal';

update public.case_files
set
  file_path = coalesce(file_path, storage_path),
  file_type = coalesce(file_type, file_kind),
  file_size = coalesce(file_size, size_bytes)
where file_path is null
   or file_type is null
   or file_size is null;

alter table public.case_files
  alter column file_path set not null,
  alter column file_type set not null;

create table if not exists public.case_comments (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  visibility public.comment_visibility not null default 'internal',
  file_id uuid references public.case_files(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.design_versions
  add column if not exists version_number integer,
  add column if not exists uploaded_by uuid references public.profiles(id) on delete set null,
  add column if not exists status public.design_status not null default 'draft',
  add column if not exists preview_file_id uuid references public.case_files(id) on delete set null;

update public.design_versions
set
  version_number = coalesce(version_number, version_no),
  uploaded_by = coalesce(uploaded_by, submitted_by)
where version_number is null or uploaded_by is null;

alter table public.design_versions
  alter column version_number set not null;

create unique index if not exists design_versions_case_version_number_idx
on public.design_versions (case_id, version_number);

create table if not exists public.design_approvals (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  design_version_id uuid not null references public.design_versions(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  status public.approval_status not null default 'pending',
  comment text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  technician_id uuid references public.technicians(id) on delete set null,
  stage public.case_stage not null,
  status public.task_status not null default 'queued',
  title text not null,
  instructions text,
  started_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quality_checks
  add column if not exists result public.qc_result not null default 'passed';

update public.quality_checks
set result = case when passed then 'passed'::public.qc_result else 'failed'::public.qc_result end;

create table if not exists public.quality_check_items (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  quality_check_id uuid not null references public.quality_checks(id) on delete cascade,
  label text not null,
  result public.qc_result not null default 'passed',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.remakes (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  original_case_id uuid references public.cases(id) on delete set null,
  reason text not null,
  responsibility public.remake_responsibility not null default 'unknown',
  cost_impact numeric(12,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.doctor_price_lists (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete cascade,
  work_type text not null,
  material text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  is_active boolean not null default true,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  unique (lab_id, doctor_id, clinic_id, work_type, material, effective_from)
);

alter table public.invoices
  add column if not exists statement_period daterange,
  add column if not exists paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  add column if not exists remaining_balance numeric(12,2) not null default 0 check (remaining_balance >= 0),
  add column if not exists notes text;

update public.invoices
set remaining_balance = greatest(total - paid_amount, 0)
where remaining_balance = 0 and total > 0;

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  case_item_id uuid references public.case_items(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  line_total numeric(12,2) generated always as ((quantity * unit_price) - discount) stored,
  created_at timestamptz not null default now()
);

alter table public.payments
  alter column invoice_id drop not null,
  add column if not exists doctor_id uuid references public.doctors(id) on delete set null,
  add column if not exists clinic_id uuid references public.clinics(id) on delete set null,
  add column if not exists notes text;

create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (payment_id, invoice_id)
);

alter table public.deliveries
  add column if not exists delivery_status public.delivery_status not null default 'pending',
  add column if not exists driver_id uuid references public.profiles(id) on delete set null,
  add column if not exists scheduled_at timestamptz,
  add column if not exists notes text;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  title text not null,
  body text,
  status public.notification_status not null default 'unread',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid references public.labs(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lab_id, key)
);

create or replace function public.current_lab_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select lab_id
  from public.user_roles
  where user_id = auth.uid()
    and is_active = true
  union
  select lab_id
  from public.profiles
  where id = auth.uid()
    and lab_id is not null
    and is_active = true;
$$;

create or replace function public.has_lab_role(
  p_lab_id uuid,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where lab_id = p_lab_id
      and user_id = auth.uid()
      and is_active = true
      and role = any(allowed_roles)
  )
  or exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lab_id = p_lab_id
      and is_active = true
      and role = any(allowed_roles)
  );
$$;

create or replace function public.is_case_doctor(p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cases c
    join public.doctors d on d.id = c.doctor_id
    where c.id = p_case_id
      and d.profile_id = auth.uid()
  );
$$;

create or replace function public.is_case_technician(p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cases c
    where c.id = p_case_id
      and c.assigned_technician_id = auth.uid()
  )
  or exists (
    select 1
    from public.tasks t
    join public.technicians tech on tech.id = t.technician_id
    where t.case_id = p_case_id
      and tech.profile_id = auth.uid()
  );
$$;

create or replace function public.is_delivery_assigned(p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.deliveries d
    where d.case_id = p_case_id
      and (d.assigned_to = auth.uid() or d.driver_id = auth.uid())
  );
$$;

create or replace function public.can_select_case(p_lab_id uuid, p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_lab_role(
    p_lab_id,
    array['super_admin','lab_owner','lab_manager','reception','accountant']::public.app_role[]
  )
  or public.is_case_doctor(p_case_id)
  or public.is_case_technician(p_case_id)
  or public.is_delivery_assigned(p_case_id);
$$;

create or replace function public.can_manage_case(p_lab_id uuid, p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_lab_role(
    p_lab_id,
    array['super_admin','lab_owner','lab_manager','reception']::public.app_role[]
  )
  or public.is_case_technician(p_case_id);
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'labs','profiles','user_roles','clinics','doctors','technicians','technician_skills',
    'cases','case_items','case_stage_logs','case_timeline','case_files','case_comments',
    'design_versions','design_approvals','tasks','quality_checks','quality_check_items',
    'remakes','doctor_price_lists','invoices','invoice_items','payments','payment_allocations',
    'deliveries','notifications','audit_logs','app_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Remove broad 0001 policies where those tables are being replaced by role-aware policies.
drop policy if exists cases_select_lab_members on public.cases;
drop policy if exists cases_insert_lab_members on public.cases;
drop policy if exists cases_update_lab_members on public.cases;
drop policy if exists cases_delete_managers on public.cases;
drop policy if exists case_files_select_lab_members on public.case_files;
drop policy if exists case_files_insert_lab_members on public.case_files;
drop policy if exists case_files_update_lab_members on public.case_files;
drop policy if exists case_files_delete_managers on public.case_files;
drop policy if exists design_versions_select_lab_members on public.design_versions;
drop policy if exists design_versions_insert_lab_members on public.design_versions;
drop policy if exists design_versions_update_lab_members on public.design_versions;
drop policy if exists design_versions_delete_managers on public.design_versions;
drop policy if exists invoices_select_lab_members on public.invoices;
drop policy if exists invoices_insert_lab_members on public.invoices;
drop policy if exists invoices_update_lab_members on public.invoices;
drop policy if exists invoices_delete_managers on public.invoices;
drop policy if exists payments_select_lab_members on public.payments;
drop policy if exists payments_insert_lab_members on public.payments;
drop policy if exists payments_update_lab_members on public.payments;
drop policy if exists payments_delete_managers on public.payments;
drop policy if exists deliveries_select_lab_members on public.deliveries;
drop policy if exists deliveries_insert_lab_members on public.deliveries;
drop policy if exists deliveries_update_lab_members on public.deliveries;
drop policy if exists deliveries_delete_managers on public.deliveries;
drop policy if exists clinics_select_lab_members on public.clinics;
drop policy if exists clinics_insert_lab_members on public.clinics;
drop policy if exists clinics_update_lab_members on public.clinics;
drop policy if exists clinics_delete_managers on public.clinics;
drop policy if exists doctors_select_lab_members on public.doctors;
drop policy if exists doctors_insert_lab_members on public.doctors;
drop policy if exists doctors_update_lab_members on public.doctors;
drop policy if exists doctors_delete_managers on public.doctors;
drop policy if exists quality_checks_select_lab_members on public.quality_checks;
drop policy if exists quality_checks_insert_lab_members on public.quality_checks;
drop policy if exists quality_checks_update_lab_members on public.quality_checks;
drop policy if exists quality_checks_delete_managers on public.quality_checks;
drop policy if exists user_roles_select_own_lab on public.user_roles;
drop policy if exists user_roles_manage_owners on public.user_roles;
drop policy if exists profiles_select_self_or_lab on public.profiles;
drop policy if exists profiles_update_self_or_owner on public.profiles;
drop policy if exists cases_select_role_scoped on public.cases;
drop policy if exists cases_insert_reception_or_manager on public.cases;
drop policy if exists cases_update_role_scoped on public.cases;
drop policy if exists cases_delete_owners on public.cases;

create policy user_roles_select_own_lab on public.user_roles
for select using (lab_id in (select public.current_lab_ids()));

create policy user_roles_manage_owners on public.user_roles
for all using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner']::public.app_role[])
) with check (
  public.has_lab_role(lab_id, array['super_admin','lab_owner']::public.app_role[])
);

create policy profiles_select_self_or_lab on public.profiles
for select using (id = auth.uid() or lab_id in (select public.current_lab_ids()));

create policy profiles_update_self_or_owner on public.profiles
for update using (
  id = auth.uid()
  or public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
) with check (
  id = auth.uid()
  or public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
);

create policy cases_select_role_scoped on public.cases
for select using (public.can_select_case(lab_id, id));

create policy cases_insert_reception_or_manager on public.cases
for insert with check (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','reception']::public.app_role[])
);

create policy cases_update_role_scoped on public.cases
for update using (public.can_manage_case(lab_id, id))
with check (public.can_manage_case(lab_id, id));

create policy cases_delete_owners on public.cases
for delete using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
);

do $$
declare
  t text;
begin
  foreach t in array array[
    'clinics','doctors','technicians','technician_skills','doctor_price_lists','app_settings'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_admins', t);
    execute format('create policy %I on public.%I for select using (lab_id in (select public.current_lab_ids()))', t || '_select_admins', t);
    execute format('drop policy if exists %I on public.%I', t || '_manage_admins', t);
    execute format(
      'create policy %I on public.%I for all using (public.has_lab_role(lab_id, array[''super_admin'',''lab_owner'',''lab_manager'']::public.app_role[])) with check (public.has_lab_role(lab_id, array[''super_admin'',''lab_owner'',''lab_manager'']::public.app_role[]))',
      t || '_manage_admins',
      t
    );
  end loop;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'case_items','case_stage_logs','case_timeline','case_files','case_comments',
    'design_versions','design_approvals','tasks','quality_checks','remakes'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_case_scoped', t);
    execute format(
      'create policy %I on public.%I for select using (public.can_select_case(lab_id, case_id))',
      t || '_select_case_scoped',
      t
    );
    execute format('drop policy if exists %I on public.%I', t || '_write_staff_scoped', t);
    execute format(
      'create policy %I on public.%I for all using (public.can_manage_case(lab_id, case_id)) with check (public.can_manage_case(lab_id, case_id))',
      t || '_write_staff_scoped',
      t
    );
  end loop;
end $$;

drop policy if exists quality_check_items_select_case_scoped on public.quality_check_items;
create policy quality_check_items_select_case_scoped on public.quality_check_items
for select using (
  exists (
    select 1
    from public.quality_checks qc
    where qc.id = quality_check_items.quality_check_id
      and public.can_select_case(qc.lab_id, qc.case_id)
  )
);

drop policy if exists quality_check_items_write_staff_scoped on public.quality_check_items;
create policy quality_check_items_write_staff_scoped on public.quality_check_items
for all using (
  exists (
    select 1
    from public.quality_checks qc
    where qc.id = quality_check_items.quality_check_id
      and public.can_manage_case(qc.lab_id, qc.case_id)
  )
) with check (
  exists (
    select 1
    from public.quality_checks qc
    where qc.id = quality_check_items.quality_check_id
      and public.can_manage_case(qc.lab_id, qc.case_id)
  )
);

drop policy if exists notifications_select_recipient_or_manager on public.notifications;
create policy notifications_select_recipient_or_manager on public.notifications
for select using (
  recipient_id = auth.uid()
  or public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
);

drop policy if exists notifications_manage_staff on public.notifications;
create policy notifications_manage_staff on public.notifications
for all using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','reception']::public.app_role[])
) with check (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','reception']::public.app_role[])
);

drop policy if exists audit_logs_select_managers on public.audit_logs;
create policy audit_logs_select_managers on public.audit_logs
for select using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
);

drop policy if exists audit_logs_insert_system_staff on public.audit_logs;
create policy audit_logs_insert_system_staff on public.audit_logs
for insert with check (lab_id in (select public.current_lab_ids()));

drop policy if exists invoices_select_finance_or_doctor on public.invoices;
create policy invoices_select_finance_or_doctor on public.invoices
for select using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
  or exists (
    select 1 from public.doctors d
    where d.id = invoices.doctor_id and d.profile_id = auth.uid()
  )
);

drop policy if exists invoices_manage_finance on public.invoices;
create policy invoices_manage_finance on public.invoices
for all using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
) with check (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
);

drop policy if exists invoice_items_select_finance_or_doctor on public.invoice_items;
create policy invoice_items_select_finance_or_doctor on public.invoice_items
for select using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
  or exists (
    select 1
    from public.invoices i
    join public.doctors d on d.id = i.doctor_id
    where i.id = invoice_items.invoice_id
      and d.profile_id = auth.uid()
  )
);

drop policy if exists invoice_items_manage_finance on public.invoice_items;
create policy invoice_items_manage_finance on public.invoice_items
for all using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
) with check (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
);

drop policy if exists payments_select_finance_or_doctor on public.payments;
create policy payments_select_finance_or_doctor on public.payments
for select using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
  or exists (
    select 1 from public.doctors d
    where d.id = payments.doctor_id and d.profile_id = auth.uid()
  )
);

drop policy if exists payments_manage_finance on public.payments;
create policy payments_manage_finance on public.payments
for all using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
) with check (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
);

drop policy if exists payment_allocations_select_finance_or_doctor on public.payment_allocations;
create policy payment_allocations_select_finance_or_doctor on public.payment_allocations
for select using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
  or exists (
    select 1
    from public.invoices i
    join public.doctors d on d.id = i.doctor_id
    where i.id = payment_allocations.invoice_id
      and d.profile_id = auth.uid()
  )
);

drop policy if exists payment_allocations_manage_finance on public.payment_allocations;
create policy payment_allocations_manage_finance on public.payment_allocations
for all using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
) with check (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
);

drop policy if exists deliveries_select_scoped on public.deliveries;
create policy deliveries_select_scoped on public.deliveries
for select using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','reception']::public.app_role[])
  or assigned_to = auth.uid()
  or driver_id = auth.uid()
);

drop policy if exists deliveries_manage_delivery_or_manager on public.deliveries;
create policy deliveries_manage_delivery_or_manager on public.deliveries
for all using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','delivery']::public.app_role[])
  or assigned_to = auth.uid()
  or driver_id = auth.uid()
) with check (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','delivery']::public.app_role[])
  or assigned_to = auth.uid()
  or driver_id = auth.uid()
);

create index if not exists profiles_lab_id_idx on public.profiles (lab_id);
create index if not exists user_roles_lab_user_idx on public.user_roles (lab_id, user_id);
create index if not exists clinics_lab_id_idx on public.clinics (lab_id);
create index if not exists doctors_lab_id_idx on public.doctors (lab_id);
create index if not exists technicians_lab_id_idx on public.technicians (lab_id);
create index if not exists cases_lab_id_idx on public.cases (lab_id);
create index if not exists cases_doctor_id_idx on public.cases (doctor_id);
create index if not exists cases_case_id_idx on public.cases (id);
create index if not exists cases_assigned_technician_idx on public.cases (assigned_technician_id);
create index if not exists cases_status_idx on public.cases (status);
create index if not exists cases_current_stage_idx on public.cases (current_stage);
create index if not exists cases_due_date_idx on public.cases (due_date);
create index if not exists cases_created_at_idx on public.cases (created_at);
create index if not exists case_items_case_id_idx on public.case_items (case_id);
create index if not exists case_stage_logs_case_id_idx on public.case_stage_logs (case_id);
create index if not exists case_timeline_case_id_created_idx on public.case_timeline (case_id, created_at);
create index if not exists case_files_lab_case_idx on public.case_files (lab_id, case_id);
create index if not exists case_comments_lab_case_idx on public.case_comments (lab_id, case_id);
create index if not exists design_versions_lab_case_idx on public.design_versions (lab_id, case_id);
create index if not exists design_approvals_lab_case_idx on public.design_approvals (lab_id, case_id);
create index if not exists tasks_lab_case_idx on public.tasks (lab_id, case_id);
create index if not exists tasks_technician_idx on public.tasks (technician_id);
create index if not exists quality_checks_lab_case_idx on public.quality_checks (lab_id, case_id);
create index if not exists remakes_lab_case_idx on public.remakes (lab_id, case_id);
create index if not exists invoices_lab_doctor_status_idx on public.invoices (lab_id, doctor_id, status);
create index if not exists invoice_items_invoice_idx on public.invoice_items (invoice_id);
create index if not exists payments_lab_doctor_idx on public.payments (lab_id, doctor_id);
create index if not exists payment_allocations_invoice_idx on public.payment_allocations (invoice_id);
create index if not exists deliveries_lab_case_idx on public.deliveries (lab_id, case_id);
create index if not exists notifications_lab_recipient_idx on public.notifications (lab_id, recipient_id, status);
create index if not exists audit_logs_lab_entity_idx on public.audit_logs (lab_id, entity_type, entity_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'technicians_updated_at') then
    create trigger technicians_updated_at before update on public.technicians
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'tasks_updated_at') then
    create trigger tasks_updated_at before update on public.tasks
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'app_settings_updated_at') then
    create trigger app_settings_updated_at before update on public.app_settings
    for each row execute function public.set_updated_at();
  end if;
end $$;
