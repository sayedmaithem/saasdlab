-- ============================================================
-- Migration 0019 — Workflow Transitions + Stage Requirements
-- ============================================================
-- Additive only. Does NOT alter existing cases, stages, or
-- lab_workflow_templates/stages from migration 0017.
--
-- Tables added:
--   workflow_transitions   — allowed from→to stage pairs per workflow,
--                            with optional role-gate and note requirement
--   stage_requirements     — per-stage gating conditions (files, price,
--                            technician, QC pass, doctor approval)
--
-- These tables extend the custom workflow engine (0017) with the
-- transition and requirement rule layers needed for workflow validation
-- and the production board "readiness" display.
-- ============================================================

-- ── 1. workflow_transitions ───────────────────────────────────
-- Defines which stage-to-stage moves are permitted within a workflow.
-- from_stage_key = '*' means "from any stage" (catch-all).
-- allowed_roles = '{}' means "all authenticated lab members".
create table if not exists public.workflow_transitions (
  id              uuid        primary key default gen_random_uuid(),
  lab_id          uuid        not null references public.labs(id) on delete cascade,
  workflow_id     uuid        not null references public.lab_workflow_templates(id) on delete cascade,
  from_stage_key  text        not null,  -- stage_key from lab_workflow_stages (or '*' for any)
  to_stage_key    text        not null,  -- stage_key from lab_workflow_stages
  -- roles allowed to trigger this transition (empty = all roles)
  allowed_roles   text[]      not null default '{}',
  -- whether a note/reason must be supplied when taking this transition
  requires_note   boolean     not null default false,
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),

  -- prevent duplicate transition rules
  constraint workflow_transitions_unique unique (workflow_id, from_stage_key, to_stage_key)
);

create index if not exists workflow_transitions_workflow_idx
  on public.workflow_transitions (workflow_id, is_active);

create index if not exists workflow_transitions_lab_idx
  on public.workflow_transitions (lab_id);

-- ── 2. stage_requirements ─────────────────────────────────────
-- Per-stage gating conditions for custom workflow stages.
-- These complement the gate flags already on lab_workflow_stages
-- (requires_technician, requires_qc, requires_doctor_approval) by
-- adding file, price, and assignment checks needed before a case
-- can ENTER that stage.
create table if not exists public.stage_requirements (
  id                              uuid        primary key default gen_random_uuid(),
  lab_id                          uuid        not null references public.labs(id) on delete cascade,
  workflow_id                     uuid        not null references public.lab_workflow_templates(id) on delete cascade,
  stage_key                       text        not null,  -- stage_key from lab_workflow_stages
  -- gate flags evaluated BEFORE entering this stage
  requires_files                  boolean     not null default false,
  requires_price                  boolean     not null default false,
  requires_assigned_technician    boolean     not null default false,
  requires_qc_pass                boolean     not null default false,
  requires_doctor_approval        boolean     not null default false,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),

  -- one requirement row per (workflow, stage)
  constraint stage_requirements_unique unique (workflow_id, stage_key)
);

create index if not exists stage_requirements_workflow_idx
  on public.stage_requirements (workflow_id);

create index if not exists stage_requirements_lab_idx
  on public.stage_requirements (lab_id);

-- ── 3. RLS ───────────────────────────────────────────────────

alter table public.workflow_transitions  enable row level security;
alter table public.stage_requirements    enable row level security;

-- workflow_transitions: lab members can read; owners/managers manage
create policy "workflow_transitions_lab_read"
  on public.workflow_transitions for select
  to authenticated
  using (lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1));

create policy "workflow_transitions_lab_owner_manage"
  on public.workflow_transitions for all
  to authenticated
  using (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = workflow_transitions.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  )
  with check (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = workflow_transitions.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  );

-- stage_requirements: lab members can read; owners/managers manage
create policy "stage_requirements_lab_read"
  on public.stage_requirements for select
  to authenticated
  using (lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1));

create policy "stage_requirements_lab_owner_manage"
  on public.stage_requirements for all
  to authenticated
  using (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = stage_requirements.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  )
  with check (
    lab_id = (select lab_id from public.profiles where id = auth.uid() limit 1)
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and lab_id = stage_requirements.lab_id
        and role in ('super_admin', 'lab_owner', 'lab_manager')
        and is_active = true
    )
  );

-- ── 4. Grants ─────────────────────────────────────────────────
grant select, insert, update, delete on public.workflow_transitions  to authenticated;
grant select, insert, update, delete on public.stage_requirements    to authenticated;

grant select, insert, update, delete on public.workflow_transitions  to service_role;
grant select, insert, update, delete on public.stage_requirements    to service_role;
