-- Migration 0015: Enterprise Identity & Invite System
--
-- Adds two tables that back the in-app user management console:
--
--   portal_invitations  — lifecycle record for every invite/account creation:
--                         pending → accepted | revoked | expired | failed
--                         pending_internal → immediately accepted when the admin
--                         created the auth user directly (password flow)
--
--   access_audit_logs   — immutable append-only audit trail of every IAM event
--                         (create, link, deactivate, revoke, etc.)
--
-- RLS: lab_owner and lab_manager can read/manage their own lab's records.
--      No broad anon access. No cross-lab reads.

-- ============================================================
-- 1. portal_invitations
-- ============================================================

create table if not exists public.portal_invitations (
  id                  uuid primary key default gen_random_uuid(),
  lab_id              uuid not null references public.labs(id) on delete cascade,
  email               text not null,
  full_name           text,
  role                text not null,
  -- Optional: links this invite to an existing technician or doctor record
  linked_record_type  text check (linked_record_type in ('technician', 'doctor', 'staff', null)),
  linked_record_id    uuid,
  -- Lifecycle status
  -- pending           — invite record created, no auth user yet
  -- pending_internal  — admin created auth user directly; awaiting first login
  -- accepted          — user completed sign-in and profile confirmed
  -- revoked           — manually revoked before acceptance
  -- expired           — token TTL passed without acceptance
  -- failed            — auth user creation failed partway through
  status              text not null default 'pending'
                        check (status in ('pending','pending_internal','accepted','revoked','expired','failed')),
  -- SHA-256 hex of the invite token (never store raw token)
  token_hash          text unique,
  invited_by          uuid references public.profiles(id),
  accepted_by         uuid references public.profiles(id),
  -- Token expires 7 days from creation by default; null = no expiry (internal accounts)
  expires_at          timestamptz,
  accepted_at         timestamptz,
  revoked_at          timestamptz,
  -- Freeform metadata for future extensibility (e.g. invite message, tags)
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Indexes for common query patterns
create index if not exists portal_invitations_lab_id_idx     on public.portal_invitations(lab_id);
create index if not exists portal_invitations_email_idx      on public.portal_invitations(lower(email));
create index if not exists portal_invitations_status_idx     on public.portal_invitations(lab_id, status);
create index if not exists portal_invitations_token_hash_idx on public.portal_invitations(token_hash) where token_hash is not null;
create index if not exists portal_invitations_linked_idx     on public.portal_invitations(lab_id, linked_record_type, linked_record_id)
  where linked_record_id is not null;

-- ============================================================
-- 2. access_audit_logs
-- ============================================================

create table if not exists public.access_audit_logs (
  id                  uuid primary key default gen_random_uuid(),
  lab_id              uuid not null references public.labs(id) on delete cascade,
  actor_user_id       uuid references public.profiles(id),
  -- The auth user id of the person the action was performed on (may not have a profiles row yet)
  target_user_id      uuid,
  action              text not null,
  role                text,
  linked_record_type  text,
  linked_record_id    uuid,
  -- JSON blob for flexible detail storage without schema changes
  details             jsonb not null default '{}',
  created_at          timestamptz not null default now()
);

create index if not exists access_audit_logs_lab_id_idx  on public.access_audit_logs(lab_id);
create index if not exists access_audit_logs_actor_idx   on public.access_audit_logs(lab_id, actor_user_id);
create index if not exists access_audit_logs_target_idx  on public.access_audit_logs(lab_id, target_user_id);
create index if not exists access_audit_logs_action_idx  on public.access_audit_logs(lab_id, action);
create index if not exists access_audit_logs_created_idx on public.access_audit_logs(lab_id, created_at desc);

-- ============================================================
-- 3. Enable RLS on both tables
-- ============================================================

alter table public.portal_invitations  enable row level security;
alter table public.access_audit_logs   enable row level security;

-- ============================================================
-- 4. RLS policies — portal_invitations
-- ============================================================

-- Lab owners and managers can read all invitations in their lab
create policy "lab_members_read_invitations"
  on public.portal_invitations
  for select
  to authenticated
  using (
    public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
  );

-- Lab owners and managers can insert new invitations for their lab
create policy "lab_owner_insert_invitations"
  on public.portal_invitations
  for insert
  to authenticated
  with check (
    public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
  );

-- Lab owners and managers can update invitations (revoke, mark accepted, etc.)
create policy "lab_owner_update_invitations"
  on public.portal_invitations
  for update
  to authenticated
  using (
    public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
  );

-- ============================================================
-- 5. RLS policies — access_audit_logs
-- ============================================================

-- Audit logs are READ-ONLY via RLS; inserts happen through SECURITY DEFINER
-- functions (or the service-role admin client) to prevent tampering.
create policy "lab_members_read_audit_logs"
  on public.access_audit_logs
  for select
  to authenticated
  using (
    public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
  );

-- Service-role inserts bypass RLS; for authenticated inserts we still need a policy.
-- Only lab_owner/lab_manager (and super_admin) may write audit events.
create policy "lab_owner_insert_audit_logs"
  on public.access_audit_logs
  for insert
  to authenticated
  with check (
    public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
  );

-- No DELETE or UPDATE policy — audit logs are immutable via RLS.
-- Hard deletes can only be done via service-role (migrations/admin tooling).

-- ============================================================
-- 6. updated_at trigger for portal_invitations
-- ============================================================

create or replace function public.set_portal_invitations_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portal_invitations_updated_at on public.portal_invitations;
create trigger portal_invitations_updated_at
  before update on public.portal_invitations
  for each row execute function public.set_portal_invitations_updated_at();
