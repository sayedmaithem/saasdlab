-- Migration 0014: Portal Account Auth Trigger + SECURITY DEFINER Link Function
--
-- Adds two capabilities needed for the manual portal-account linking flow:
--
-- 1. on_auth_user_created trigger — auto-creates a minimal profile row
--    whenever a new auth.users entry is inserted (e.g. when an admin creates
--    a user in the Supabase dashboard). This ensures getCurrentSessionContext()
--    finds a profile row on first login rather than looping back to /auth.
--
-- 2. admin_link_portal_account() — SECURITY DEFINER helper that lets a
--    lab_owner upsert both profiles and user_roles for any auth user without
--    needing the service-role key in the application layer. The caller's
--    lab-owner privilege is validated inside the function before any writes.
--
-- 3. RLS policy additions — allow lab_owner to read profiles of users they
--    are about to link (needed for the "verify UUID before linking" step).

-- ============================================================
-- 1. Auth trigger: auto-create skeleton profile on user sign-up
-- ============================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop first in case it exists from an earlier attempt
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================
-- 2. SECURITY DEFINER function: admin_link_portal_account
--
-- Called by app server actions (authenticated lab_owner client).
-- Validates the caller has lab_owner/super_admin role for p_lab_id,
-- then upserts profiles + user_roles for the target user.
--
-- Returns: { ok: true } or { ok: false, error: "<reason>" }
-- ============================================================

create or replace function public.admin_link_portal_account(
  p_user_id  uuid,
  p_lab_id   uuid,
  p_role     public.app_role,
  p_full_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Guard: caller must be lab_owner or super_admin for this lab
  if not public.has_lab_role(
    p_lab_id,
    array['super_admin', 'lab_owner']::public.app_role[]
  ) then
    return jsonb_build_object('ok', false, 'error', 'Unauthorized: lab_owner role required');
  end if;

  -- Guard: super_admin and lab_owner cannot be granted via this UI function.
  -- These roles must be assigned directly in Supabase or via a privileged admin
  -- migration. Allowing lab_owner assignment here would let any lab_owner
  -- escalate arbitrary users to co-owner level.
  if p_role in ('super_admin'::public.app_role, 'lab_owner'::public.app_role) then
    return jsonb_build_object('ok', false, 'error', 'Cannot assign super_admin or lab_owner via this flow');
  end if;

  -- Guard: p_user_id must not be the calling user (can't link yourself)
  if p_user_id = auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'Cannot link your own account');
  end if;

  -- Upsert profile row (created by trigger on sign-up; may be missing
  -- if user was created before this migration was applied).
  -- IMPORTANT: only overwrite lab_id/role if the profile currently has
  -- no lab assignment (lab_id IS NULL). This prevents a lab_owner of Lab A
  -- from silently overwriting the primary lab of a user who already belongs
  -- to Lab B. If the profile already has a different lab_id, we only
  -- activate the user_roles entry (handled below) and update the name.
  insert into public.profiles (id, lab_id, role, is_active, full_name)
  values (p_user_id, p_lab_id, p_role, true, p_full_name)
  on conflict (id) do update set
    lab_id    = case
                  when profiles.lab_id is null then excluded.lab_id
                  else profiles.lab_id
                end,
    role      = case
                  when profiles.lab_id is null then excluded.role
                  else profiles.role
                end,
    is_active = true,
    full_name = coalesce(excluded.full_name, profiles.full_name);

  -- Upsert user_roles row
  insert into public.user_roles (lab_id, user_id, role, is_active)
  values (p_lab_id, p_user_id, p_role, true)
  on conflict (lab_id, user_id, role) do update set is_active = true;

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 3. admin_unlink_portal_account: deactivate without hard delete
-- ============================================================

create or replace function public.admin_unlink_portal_account(
  p_user_id uuid,
  p_lab_id  uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_lab_role(
    p_lab_id,
    array['super_admin', 'lab_owner']::public.app_role[]
  ) then
    return jsonb_build_object('ok', false, 'error', 'Unauthorized');
  end if;

  -- Deactivate all roles for this user in this lab
  update public.user_roles
  set is_active = false
  where user_id = p_user_id and lab_id = p_lab_id;

  -- Deactivate the profile (won't be able to log in as lab member)
  update public.profiles
  set is_active = false
  where id = p_user_id and lab_id = p_lab_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- 4. Grant execute on RPC functions to authenticated role.
-- handle_new_auth_user() is a trigger function — invoked by the DB
-- engine, not by users — so it does not need an explicit EXECUTE grant.
-- ============================================================
grant execute on function public.admin_link_portal_account(uuid, uuid, public.app_role, text) to authenticated;
grant execute on function public.admin_unlink_portal_account(uuid, uuid) to authenticated;
