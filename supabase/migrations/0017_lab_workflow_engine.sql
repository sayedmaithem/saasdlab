-- ============================================================
-- Migration 0017 — Custom Lab Workflow Engine
-- ============================================================
-- Additive only. Does NOT alter existing cases.current_stage
-- enum or production movement logic. This is the foundation
-- layer for per-lab workflow configuration.
--
-- Tables:
--   lab_workflow_templates   — named workflow definitions per lab
--   lab_workflow_stages      — ordered stage list per template
--   technician_stage_permissions — which technicians can work each stage
-- ============================================================

-- ── 1. lab_workflow_templates ─────────────────────────────────
create table if not exists public.lab_workflow_templates (
  id           uuid        primary key default gen_random_uuid(),
  lab_id       uuid        not null references public.labs(id) on delete cascade,
  name         text        not null,
  description  text,
  is_default   boolean     not null default false,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Only one default per lab
create unique index if not exists lab_workflow_templates_default_lab_idx
  on public.lab_workflow_templates (lab_id)
  where (is_default = true and is_active = true);

-- ── 2. lab_workflow_stages ────────────────────────────────────
create table if not exists public.lab_workflow_stages (
  id                       uuid        primary key default gen_random_uuid(),
  lab_id                   uuid        not null references public.labs(id) on delete cascade,
  workflow_id              uuid        not null references public.lab_workflow_templates(id) on delete cascade,
  -- stage_key mirrors the fixed enum keys so production board can cross-reference
  stage_key                text        not null,
  name                     text        not null,
  description              text,
  sort_order               int         not null default 0,
  color                    text,
  icon                     text,
  -- Stage-level gate flags
  requires_technician      boolean     not null default false,
  requires_qc              boolean     not null default false,
  requires_doctor_approval boolean     not null default false,
  blocks_delivery          boolean     not null default false,
  is_active                boolean     not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  -- Unique stage key per workflow
  constraint lab_workflow_stages_key_unique unique (workflow_id, stage_key)
);

create index if not exists lab_workflow_stages_workflow_idx on public.lab_workflow_stages (workflow_id, sort_order);
create index if not exists lab_workflow_stages_lab_idx     on public.lab_workflow_stages (lab_id);

-- ── 3. technician_stage_permissions ──────────────────────────
create table if not exists public.technician_stage_permissions (
  id             uuid        primary key default gen_random_uuid(),
  lab_id         uuid        not null references public.labs(id) on delete cascade,
  technician_id  uuid        not null references public.technicians(id) on delete cascade,
  stage_id       uuid        not null references public.lab_workflow_stages(id) on delete cascade,
  can_work       boolean     not null default true,
  can_move_from  boolean     not null default false,
  can_move_to    boolean     not null default false,
  created_at     timestamptz not null default now(),
  constraint technician_stage_permissions_unique unique (technician_id, stage_id)
);

create index if not exists tsp_technician_idx on public.technician_stage_permissions (technician_id);
create index if not exists tsp_stage_idx      on public.technician_stage_permissions (stage_id);

-- ── 4. RLS ───────────────────────────────────────────────────
alter table public.lab_workflow_templates     enable row level security;
alter table public.lab_workflow_stages        enable row level security;
alter table public.technician_stage_permissions enable row level security;

-- lab_workflow_templates policies
create policy "workflow_templates_lab_read"
  on public.lab_workflow_templates for select
  to authenticated
  using (lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1));

create policy "workflow_templates_lab_owner_manage"
  on public.lab_workflow_templates for all
  to authenticated
  using (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = lab_workflow_templates.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  )
  with check (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = lab_workflow_templates.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  );

-- lab_workflow_stages policies
create policy "workflow_stages_lab_read"
  on public.lab_workflow_stages for select
  to authenticated
  using (lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1));

create policy "workflow_stages_lab_owner_manage"
  on public.lab_workflow_stages for all
  to authenticated
  using (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = lab_workflow_stages.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  )
  with check (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = lab_workflow_stages.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  );

-- technician_stage_permissions policies
create policy "tsp_lab_read"
  on public.technician_stage_permissions for select
  to authenticated
  using (lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1));

create policy "tsp_lab_owner_manage"
  on public.technician_stage_permissions for all
  to authenticated
  using (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = technician_stage_permissions.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  )
  with check (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = technician_stage_permissions.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  );

-- ── 5. Grants ─────────────────────────────────────────────────
grant select, insert, update, delete on public.lab_workflow_templates     to authenticated;
grant select, insert, update, delete on public.lab_workflow_stages        to authenticated;
grant select, insert, update, delete on public.technician_stage_permissions to authenticated;

grant select, insert, update, delete on public.lab_workflow_templates     to service_role;
grant select, insert, update, delete on public.lab_workflow_stages        to service_role;
grant select, insert, update, delete on public.technician_stage_permissions to service_role;
