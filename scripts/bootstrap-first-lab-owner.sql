-- ============================================================
-- LabFlow: First Lab Owner Bootstrap
-- ============================================================
--
-- PURPOSE: Create the first lab, insert the required profile row,
-- and set role = lab_owner for a Supabase Auth user.
--
-- WHERE TO RUN: Supabase Dashboard → SQL Editor
-- (runs as postgres / service role — bypasses RLS safely)
--
-- WHEN TO RUN: Once, after applying migration 0012.
-- This script is idempotent — safe to run multiple times.
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Find your user → copy the UUID from the "UID" column
-- 3. Paste your UUID to replace PASTE_YOUR_USER_UUID_HERE below
-- 4. Optionally update lab_name and lab_slug to your lab's real name
-- 5. Run the entire script in the SQL Editor
-- 6. The SELECT at the bottom confirms success
-- ============================================================

do $$
declare
  -- ➜ REPLACE THIS with your actual Supabase Auth user UUID
  v_user_id_text text := 'PASTE_YOUR_USER_UUID_HERE';

  -- ➜ OPTIONAL: change to your lab's real name and URL-safe slug
  v_lab_name     text := 'My Dental Lab';
  v_lab_slug     text := 'my-dental-lab';

  -- internal
  v_user_id      uuid;
  v_lab_id       uuid;
  v_user_email   text;
  v_user_name    text;
begin
  -- Guard: placeholder was not replaced
  if v_user_id_text = 'PASTE_YOUR_USER_UUID_HERE' then
    raise exception
      'Bootstrap stopped: replace PASTE_YOUR_USER_UUID_HERE with your UUID. '
      'Find it in Supabase Dashboard → Authentication → Users.';
  end if;

  -- Parse UUID (fails early if malformed)
  begin
    v_user_id := v_user_id_text::uuid;
  exception when invalid_text_representation then
    raise exception 'Invalid UUID format: "%". Check for extra spaces or typos.', v_user_id_text;
  end;

  -- Validate: user must exist in auth.users
  select email, raw_user_meta_data->>'full_name'
  into v_user_email, v_user_name
  from auth.users
  where id = v_user_id;

  if v_user_email is null then
    raise exception
      'User UUID % not found in auth.users. '
      'Double-check the UUID in Supabase → Authentication → Users.', v_user_id;
  end if;

  raise notice 'Found auth user: % (%)', v_user_email, v_user_id;

  -- --------------------------------------------------------
  -- Step 1: Create lab (or use the first existing one)
  -- --------------------------------------------------------
  select id into v_lab_id from public.labs order by created_at limit 1;

  if v_lab_id is null then
    insert into public.labs (name, slug)
    values (v_lab_name, v_lab_slug)
    returning id into v_lab_id;
    raise notice '[1/3] Created lab: "%" slug="%" id=%', v_lab_name, v_lab_slug, v_lab_id;
  else
    raise notice '[1/3] Using existing lab: %', v_lab_id;
  end if;

  -- --------------------------------------------------------
  -- Step 2: Upsert profile
  -- Creates the row if missing; updates lab_id + role if it exists.
  -- --------------------------------------------------------
  insert into public.profiles (
    id,
    email,
    full_name,
    lab_id,
    role,
    is_active,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    v_user_email,
    coalesce(v_user_name, v_user_email),
    v_lab_id,
    'lab_owner'::public.app_role,
    true,
    now(),
    now()
  )
  on conflict (id) do update
    set lab_id     = excluded.lab_id,
        role       = excluded.role,
        is_active  = excluded.is_active,
        email      = excluded.email,
        updated_at = now();

  raise notice '[2/3] Profile upserted: user=% lab=% role=lab_owner', v_user_id, v_lab_id;

  -- --------------------------------------------------------
  -- Step 3: Upsert user_roles row
  -- Idempotent: re-activates if a row already exists.
  -- --------------------------------------------------------
  insert into public.user_roles (
    lab_id,
    user_id,
    role,
    is_active,
    created_at
  )
  values (
    v_lab_id,
    v_user_id,
    'lab_owner'::public.app_role,
    true,
    now()
  )
  on conflict (lab_id, user_id, role) do update
    set is_active = true;

  raise notice '[3/3] user_roles upserted: user=% lab=% role=lab_owner', v_user_id, v_lab_id;

  raise notice '=== Bootstrap complete ===';
  raise notice 'User  : % (%)', v_user_email, v_user_id;
  raise notice 'Lab   : %', v_lab_id;
  raise notice 'Role  : lab_owner';
  raise notice '';
  raise notice 'Next: sign in at /auth — the dashboard should load.';
end $$;

-- ============================================================
-- Verification: run this after the DO block to confirm success.
-- Replace PASTE_YOUR_USER_UUID_HERE with your actual UUID.
-- ============================================================
select
  p.id           as user_id,
  p.email,
  p.role         as profile_role,
  p.is_active,
  p.lab_id,
  l.name         as lab_name,
  l.slug         as lab_slug,
  ur.role        as user_roles_role,
  ur.is_active   as user_roles_active
from public.profiles p
join public.labs l
  on l.id = p.lab_id
join public.user_roles ur
  on ur.user_id = p.id
  and ur.lab_id = p.lab_id
where p.id = 'PASTE_YOUR_USER_UUID_HERE'::uuid;
