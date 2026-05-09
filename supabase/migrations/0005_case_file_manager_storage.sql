-- LabFlow case cloud file manager storage and file visibility policies.

alter type public.file_visibility add value if not exists 'private_finance';

alter type public.file_kind add value if not exists 'zip';

alter type public.file_category add value if not exists 'doctor_uploads';
alter type public.file_category add value if not exists 'scan_files';
alter type public.file_category add value if not exists 'photos';
alter type public.file_category add value if not exists 'exocad_design';
alter type public.file_category add value if not exists 'design_versions';
alter type public.file_category add value if not exists 'cam_milling';
alter type public.file_category add value if not exists 'qc_photos';
alter type public.file_category add value if not exists 'invoices';

alter table public.case_files
  alter column bucket set default 'case-files';

create index if not exists case_files_lab_case_category_idx
on public.case_files (lab_id, case_id, category, created_at desc);

create index if not exists case_files_uploaded_by_idx
on public.case_files (uploaded_by);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'case-files',
  'case-files',
  false,
  2147483648,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'model/stl',
    'model/obj',
    'application/sla',
    'application/dicom',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.safe_uuid(p_value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return p_value::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.case_storage_lab_id(p_name text)
returns uuid
language sql
stable
as $$
  select public.safe_uuid((storage.foldername(p_name))[1]);
$$;

create or replace function public.case_storage_case_id(p_name text)
returns uuid
language sql
stable
as $$
  select public.safe_uuid((storage.foldername(p_name))[2]);
$$;

create or replace function public.case_storage_folder(p_name text)
returns text
language sql
stable
as $$
  select (storage.foldername(p_name))[3];
$$;

create or replace function public.is_case_accountant_file_folder(p_folder text)
returns boolean
language sql
immutable
as $$
  select p_folder = 'invoices';
$$;

create or replace function public.is_case_doctor_upload_folder(p_folder text)
returns boolean
language sql
immutable
as $$
  select p_folder in ('doctor-uploads', 'scan-files', 'photos');
$$;

create or replace function public.can_insert_case_file_path(
  p_lab_id uuid,
  p_case_id uuid,
  p_folder text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_lab_role(
    p_lab_id,
    array['super_admin','lab_owner','lab_manager']::public.app_role[]
  )
  or (
    public.has_lab_role(p_lab_id, array['reception']::public.app_role[])
    and p_folder <> 'invoices'
    and public.can_select_case(p_lab_id, p_case_id)
  )
  or (
    public.has_lab_role(p_lab_id, array['accountant']::public.app_role[])
    and public.is_case_accountant_file_folder(p_folder)
  )
  or (
    public.is_case_doctor(p_case_id)
    and public.is_case_doctor_upload_folder(p_folder)
  )
  or (
    public.is_case_technician(p_case_id)
    and p_folder <> 'invoices'
  );
$$;

create or replace function public.can_insert_case_file_row(
  p_lab_id uuid,
  p_case_id uuid,
  p_category public.file_category,
  p_visibility public.file_visibility,
  p_uploaded_by uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_uploaded_by = auth.uid()
  and (
    public.has_lab_role(
      p_lab_id,
      array['super_admin','lab_owner','lab_manager']::public.app_role[]
    )
    or (
      public.has_lab_role(p_lab_id, array['reception']::public.app_role[])
      and p_visibility::text <> 'private_finance'
      and p_category::text <> 'invoices'
      and public.can_select_case(p_lab_id, p_case_id)
    )
    or (
      public.has_lab_role(p_lab_id, array['accountant']::public.app_role[])
      and p_category::text = 'invoices'
    )
    or (
      public.is_case_doctor(p_case_id)
      and p_visibility::text = 'doctor_visible'
      and p_category::text in ('doctor_uploads', 'scan_files', 'photos')
    )
    or (
      public.is_case_technician(p_case_id)
      and p_visibility::text <> 'private_finance'
      and p_category::text <> 'invoices'
    )
  );
$$;

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
        public.has_lab_role(
          cf.lab_id,
          array['super_admin','lab_owner','lab_manager']::public.app_role[]
        )
        or (
          public.has_lab_role(cf.lab_id, array['reception']::public.app_role[])
          and cf.visibility::text <> 'private_finance'
        )
        or (
          public.has_lab_role(cf.lab_id, array['accountant']::public.app_role[])
          and cf.category::text = 'invoices'
        )
        or (
          public.is_case_doctor(cf.case_id)
          and (cf.visibility::text = 'doctor_visible' or cf.uploaded_by = auth.uid())
        )
        or (
          public.is_case_technician(cf.case_id)
          and cf.visibility::text <> 'private_finance'
        )
        or (
          public.is_delivery_assigned(cf.case_id)
          and cf.category::text = 'delivery'
        )
      )
  );
$$;

drop policy if exists case_files_select_case_scoped on public.case_files;
drop policy if exists case_files_write_staff_scoped on public.case_files;
drop policy if exists case_files_select_secure on public.case_files;
drop policy if exists case_files_insert_secure on public.case_files;
drop policy if exists case_files_update_managers on public.case_files;
drop policy if exists case_files_delete_managers on public.case_files;

create policy case_files_select_secure on public.case_files
for select using (public.can_select_case_file(id));

create policy case_files_insert_secure on public.case_files
for insert with check (
  public.can_insert_case_file_row(
    lab_id,
    case_id,
    category,
    visibility,
    uploaded_by
  )
);

create policy case_files_update_managers on public.case_files
for update using (
  public.has_lab_role(
    lab_id,
    array['super_admin','lab_owner','lab_manager']::public.app_role[]
  )
) with check (
  public.has_lab_role(
    lab_id,
    array['super_admin','lab_owner','lab_manager']::public.app_role[]
  )
);

create policy case_files_delete_managers on public.case_files
for delete using (
  public.has_lab_role(
    lab_id,
    array['super_admin','lab_owner','lab_manager']::public.app_role[]
  )
);

drop policy if exists storage_case_files_v2_select on storage.objects;
drop policy if exists storage_case_files_v2_insert on storage.objects;
drop policy if exists storage_case_files_v2_update on storage.objects;
drop policy if exists storage_case_files_v2_delete on storage.objects;

create policy storage_case_files_v2_select on storage.objects
for select using (
  bucket_id = 'case-files'
  and exists (
    select 1
    from public.case_files cf
    where cf.bucket = 'case-files'
      and cf.storage_path = storage.objects.name
      and public.can_select_case_file(cf.id)
  )
);

create policy storage_case_files_v2_insert on storage.objects
for insert with check (
  bucket_id = 'case-files'
  and public.can_insert_case_file_path(
    public.case_storage_lab_id(name),
    public.case_storage_case_id(name),
    public.case_storage_folder(name)
  )
);

create policy storage_case_files_v2_update on storage.objects
for update using (
  bucket_id = 'case-files'
  and public.has_lab_role(
    public.case_storage_lab_id(name),
    array['super_admin','lab_owner','lab_manager']::public.app_role[]
  )
) with check (
  bucket_id = 'case-files'
  and public.has_lab_role(
    public.case_storage_lab_id(name),
    array['super_admin','lab_owner','lab_manager']::public.app_role[]
  )
);

create policy storage_case_files_v2_delete on storage.objects
for delete using (
  bucket_id = 'case-files'
  and public.has_lab_role(
    public.case_storage_lab_id(name),
    array['super_admin','lab_owner','lab_manager']::public.app_role[]
  )
);
