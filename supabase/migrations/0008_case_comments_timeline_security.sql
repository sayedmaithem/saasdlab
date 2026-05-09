-- LabFlow case discussion visibility and timeline indexes.

create index if not exists case_comments_lab_case_created_idx
on public.case_comments (lab_id, case_id, created_at);

create index if not exists case_timeline_lab_case_event_created_idx
on public.case_timeline (lab_id, case_id, event_type, created_at desc);

create or replace function public.can_select_case_comment(
  p_lab_id uuid,
  p_case_id uuid,
  p_visibility public.comment_visibility
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    public.has_lab_role(
      p_lab_id,
      array['super_admin','lab_owner','lab_manager','reception','accountant','delivery']::public.app_role[]
    )
    or public.is_case_technician(p_case_id)
  )
  or (
    p_visibility = 'doctor_visible'::public.comment_visibility
    and public.is_case_doctor(p_case_id)
  );
$$;

create or replace function public.can_insert_case_comment(
  p_lab_id uuid,
  p_case_id uuid,
  p_visibility public.comment_visibility,
  p_author_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_author_id = auth.uid()
  and (
    (
      public.has_lab_role(
        p_lab_id,
        array['super_admin','lab_owner','lab_manager','reception','accountant','delivery']::public.app_role[]
      )
      or public.is_case_technician(p_case_id)
    )
    or (
      p_visibility = 'doctor_visible'::public.comment_visibility
      and public.is_case_doctor(p_case_id)
    )
  );
$$;

drop policy if exists case_comments_select_case_scoped on public.case_comments;
drop policy if exists case_comments_write_staff_scoped on public.case_comments;
drop policy if exists case_comments_select_secure on public.case_comments;
drop policy if exists case_comments_insert_secure on public.case_comments;
drop policy if exists case_comments_update_own_or_manager on public.case_comments;
drop policy if exists case_comments_delete_manager on public.case_comments;

create policy case_comments_select_secure on public.case_comments
for select using (
  public.can_select_case_comment(lab_id, case_id, visibility)
);

create policy case_comments_insert_secure on public.case_comments
for insert with check (
  public.can_insert_case_comment(lab_id, case_id, visibility, author_id)
);

create policy case_comments_update_own_or_manager on public.case_comments
for update using (
  author_id = auth.uid()
  or public.has_lab_role(
    lab_id,
    array['super_admin','lab_owner','lab_manager']::public.app_role[]
  )
) with check (
  author_id = auth.uid()
  or public.has_lab_role(
    lab_id,
    array['super_admin','lab_owner','lab_manager']::public.app_role[]
  )
);

create policy case_comments_delete_manager on public.case_comments
for delete using (
  public.has_lab_role(
    lab_id,
    array['super_admin','lab_owner','lab_manager']::public.app_role[]
  )
);
