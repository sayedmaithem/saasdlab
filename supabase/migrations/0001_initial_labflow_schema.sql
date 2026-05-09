-- LabFlow Dental CRM initial schema.
-- Run with Supabase CLI or dashboard SQL editor after creating the project.

create extension if not exists "pgcrypto";

create type public.app_role as enum (
  'super_admin',
  'lab_owner',
  'lab_manager',
  'reception',
  'technician',
  'accountant',
  'doctor',
  'delivery'
);

create type public.case_stage as enum (
  'received',
  'information_check',
  'waiting_doctor_info',
  'cad_design',
  'design_review',
  'doctor_approval',
  'milling_printing',
  'try_in',
  'coloring',
  'furnace',
  'polishing',
  'quality_control',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'completed',
  'on_hold',
  'cancelled'
);

create type public.case_priority as enum ('low', 'normal', 'urgent');
create type public.file_kind as enum ('stl', 'obj', 'ply', 'dicom', 'pdf', 'image', 'exocad', 'other');
create type public.approval_status as enum ('pending', 'approved', 'changes_requested', 'rejected');
create type public.invoice_status as enum ('draft', 'issued', 'partially_paid', 'paid', 'void');
create type public.payment_method as enum ('cash', 'card', 'bank_transfer', 'wallet', 'adjustment');
create type public.task_status as enum ('queued', 'in_progress', 'blocked', 'done');
create type public.comment_visibility as enum ('internal', 'doctor_visible');

create table public.labs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Asia/Baghdad',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lab_memberships (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (lab_id, user_id, role)
);

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lab_id, name)
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  email text,
  phone text,
  default_clinic_id uuid references public.clinics(id) on delete set null,
  performance_score numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.doctor_clinics (
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  lab_id uuid not null references public.labs(id) on delete cascade,
  primary key (doctor_id, clinic_id)
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_number text not null,
  patient_display text not null,
  patient_reference text,
  doctor_id uuid not null references public.doctors(id),
  clinic_id uuid not null references public.clinics(id),
  stage public.case_stage not null default 'received',
  priority public.case_priority not null default 'normal',
  restoration_type text not null,
  shade text,
  tooth_numbers integer[] not null default '{}',
  due_date date,
  clinical_notes text,
  assigned_technician_id uuid references public.profiles(id) on delete set null,
  remake_of_case_id uuid references public.cases(id) on delete set null,
  doctor_score_snapshot numeric(5,2),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lab_id, case_number)
);

create table public.design_versions (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  version_no integer not null,
  exocad_project_ref text,
  notes text,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (case_id, version_no)
);

create table public.case_files (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  design_version_id uuid references public.design_versions(id) on delete set null,
  bucket text not null default 'labflow-case-files',
  storage_path text not null,
  file_kind public.file_kind not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create table public.doctor_approvals (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  design_version_id uuid not null references public.design_versions(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  status public.approval_status not null default 'pending',
  comment text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.production_tasks (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  stage public.case_stage not null,
  technician_id uuid references public.profiles(id) on delete set null,
  status public.task_status not null default 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.case_discussions (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  visibility public.comment_visibility not null default 'doctor_visible',
  body text not null,
  created_at timestamptz not null default now()
);

create table public.internal_comments (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.quality_checks (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  checked_by uuid references public.profiles(id) on delete set null,
  passed boolean not null,
  checklist jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  status public.case_stage not null default 'ready_for_delivery',
  address text,
  delivered_at timestamptz,
  proof_file_id uuid references public.case_files(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id),
  clinic_id uuid references public.clinics(id),
  invoice_number text not null,
  status public.invoice_status not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) generated always as (subtotal - discount + tax) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lab_id, invoice_number)
);

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  method public.payment_method not null,
  reference text,
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id) on delete set null
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index cases_lab_stage_idx on public.cases (lab_id, stage);
create index cases_lab_due_date_idx on public.cases (lab_id, due_date);
create index case_files_case_id_idx on public.case_files (case_id);
create index design_versions_case_id_idx on public.design_versions (case_id);
create index production_tasks_case_stage_idx on public.production_tasks (case_id, stage);
create index invoices_lab_doctor_idx on public.invoices (lab_id, doctor_id);
create index payments_lab_invoice_idx on public.payments (lab_id, invoice_id);
create index audit_events_lab_entity_idx on public.audit_events (lab_id, entity_type, entity_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger labs_updated_at before update on public.labs
for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger clinics_updated_at before update on public.clinics
for each row execute function public.set_updated_at();
create trigger doctors_updated_at before update on public.doctors
for each row execute function public.set_updated_at();
create trigger cases_updated_at before update on public.cases
for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices
for each row execute function public.set_updated_at();

create or replace function public.current_lab_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select lab_id
  from public.lab_memberships
  where user_id = auth.uid()
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
    from public.lab_memberships
    where lab_id = p_lab_id
      and user_id = auth.uid()
      and is_active = true
      and role = any(allowed_roles)
  );
$$;

alter table public.labs enable row level security;
alter table public.profiles enable row level security;
alter table public.lab_memberships enable row level security;

create policy labs_select_members on public.labs
for select using (id in (select public.current_lab_ids()));

create policy labs_insert_admins on public.labs
for insert with check (auth.uid() is not null);

create policy labs_update_owners on public.labs
for update using (
  public.has_lab_role(id, array['super_admin', 'lab_owner', 'lab_manager']::public.app_role[])
) with check (
  public.has_lab_role(id, array['super_admin', 'lab_owner', 'lab_manager']::public.app_role[])
);

create policy profiles_select_self_or_lab on public.profiles
for select using (
  id = auth.uid()
  or exists (
    select 1
    from public.lab_memberships mine
    join public.lab_memberships theirs on theirs.lab_id = mine.lab_id
    where mine.user_id = auth.uid()
      and theirs.user_id = profiles.id
      and mine.is_active = true
      and theirs.is_active = true
  )
);

create policy profiles_upsert_self on public.profiles
for insert with check (id = auth.uid());

create policy profiles_update_self on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy memberships_select_lab_members on public.lab_memberships
for select using (lab_id in (select public.current_lab_ids()));

create policy memberships_manage_owners on public.lab_memberships
for all using (
  public.has_lab_role(lab_id, array['super_admin', 'lab_owner', 'lab_manager']::public.app_role[])
) with check (
  public.has_lab_role(lab_id, array['super_admin', 'lab_owner', 'lab_manager']::public.app_role[])
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clinics',
    'doctors',
    'doctor_clinics',
    'cases',
    'design_versions',
    'case_files',
    'doctor_approvals',
    'production_tasks',
    'case_discussions',
    'internal_comments',
    'quality_checks',
    'deliveries',
    'invoices',
    'invoice_lines',
    'payments',
    'audit_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select using (lab_id in (select public.current_lab_ids()))',
      table_name || '_select_lab_members',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert with check (public.has_lab_role(lab_id, array[''super_admin'', ''lab_owner'', ''lab_manager'', ''reception'', ''technician'', ''accountant'', ''doctor'', ''delivery'']::public.app_role[]))',
      table_name || '_insert_lab_members',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update using (lab_id in (select public.current_lab_ids())) with check (lab_id in (select public.current_lab_ids()))',
      table_name || '_update_lab_members',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete using (public.has_lab_role(lab_id, array[''super_admin'', ''lab_owner'', ''lab_manager'']::public.app_role[]))',
      table_name || '_delete_managers',
      table_name
    );
  end loop;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'labflow-case-files',
  'labflow-case-files',
  false,
  2147483648,
  array[
    'model/stl',
    'model/obj',
    'application/dicom',
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/octet-stream'
  ]
)
on conflict (id) do nothing;

create policy storage_case_files_select on storage.objects
for select using (
  bucket_id = 'labflow-case-files'
  and ((storage.foldername(name))[1])::uuid in (select public.current_lab_ids())
);

create policy storage_case_files_insert on storage.objects
for insert with check (
  bucket_id = 'labflow-case-files'
  and ((storage.foldername(name))[1])::uuid in (select public.current_lab_ids())
);

create policy storage_case_files_update on storage.objects
for update using (
  bucket_id = 'labflow-case-files'
  and ((storage.foldername(name))[1])::uuid in (select public.current_lab_ids())
) with check (
  bucket_id = 'labflow-case-files'
  and ((storage.foldername(name))[1])::uuid in (select public.current_lab_ids())
);

create policy storage_case_files_delete on storage.objects
for delete using (
  bucket_id = 'labflow-case-files'
  and ((storage.foldername(name))[1])::uuid in (select public.current_lab_ids())
);
