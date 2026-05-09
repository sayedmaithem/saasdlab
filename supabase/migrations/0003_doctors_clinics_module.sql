-- LabFlow Doctors and Clinics module fields and role-scoped RLS refinements.

alter table public.doctors
  add column if not exists is_active boolean not null default true,
  add column if not exists is_vip boolean not null default false,
  add column if not exists address text,
  add column if not exists notes text,
  add column if not exists payment_terms text,
  add column if not exists default_price_group text;

alter table public.clinics
  add column if not exists email text,
  add column if not exists notes text,
  add column if not exists is_active boolean not null default true;

drop policy if exists doctors_select_admins on public.doctors;
drop policy if exists doctors_manage_admins on public.doctors;

create policy doctors_select_role_scoped on public.doctors
for select using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','reception','accountant']::public.app_role[])
  or profile_id = auth.uid()
);

create policy doctors_manage_staff on public.doctors
for all using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','reception']::public.app_role[])
) with check (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','reception']::public.app_role[])
);

drop policy if exists clinics_select_admins on public.clinics;
drop policy if exists clinics_manage_admins on public.clinics;

create policy clinics_select_staff on public.clinics
for select using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','reception','accountant']::public.app_role[])
);

create policy clinics_manage_staff on public.clinics
for all using (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','reception']::public.app_role[])
) with check (
  public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','reception']::public.app_role[])
);

create index if not exists doctors_lab_active_vip_idx on public.doctors (lab_id, is_active, is_vip);
create index if not exists doctors_default_clinic_idx on public.doctors (default_clinic_id);
create index if not exists clinics_lab_active_idx on public.clinics (lab_id, is_active);
