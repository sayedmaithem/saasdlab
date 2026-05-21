-- Migration 0013: Configurable Lab Catalog + Pricing Engine
--
-- Each lab starts empty and defines its own:
--   operations / work types
--   materials
--   price groups
--   operation prices (per group, per operation, per material)
--   technician operation rates (for cost tracking)
--   portal access templates (role-based portal configuration)
--
-- No mandatory seed data is inserted. Every lab configures its own catalog.
-- New tables automatically inherit grants from the ALTER DEFAULT PRIVILEGES
-- set in migration 0012. Explicit grants are also added here for safety.

-- ============================================================
-- 1. lab_operations — each lab's catalogue of restoration types
-- ============================================================
create table if not exists public.lab_operations (
  id               uuid primary key default gen_random_uuid(),
  lab_id           uuid not null references public.labs(id) on delete cascade,
  name             text not null,
  code             text,
  category         text,
  description      text,
  default_units    integer not null default 1 check (default_units > 0),
  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (lab_id, name)
);

create index if not exists lab_operations_lab_idx on public.lab_operations (lab_id);
create index if not exists lab_operations_active_idx on public.lab_operations (lab_id, is_active);

-- ============================================================
-- 2. lab_materials — each lab's materials catalogue
-- ============================================================
create table if not exists public.lab_materials (
  id               uuid primary key default gen_random_uuid(),
  lab_id           uuid not null references public.labs(id) on delete cascade,
  name             text not null,
  code             text,
  category         text,
  shade_required   boolean not null default false,
  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (lab_id, name)
);

create index if not exists lab_materials_lab_idx on public.lab_materials (lab_id);
create index if not exists lab_materials_active_idx on public.lab_materials (lab_id, is_active);

-- ============================================================
-- 3. price_groups — named pricing tiers per lab
--    e.g. Standard, VIP, Implant Specialist
-- ============================================================
create table if not exists public.price_groups (
  id               uuid primary key default gen_random_uuid(),
  lab_id           uuid not null references public.labs(id) on delete cascade,
  name             text not null,
  description      text,
  is_default       boolean not null default false,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (lab_id, name)
);

create index if not exists price_groups_lab_idx on public.price_groups (lab_id);

-- ============================================================
-- 4. operation_prices — unit prices per operation/material/group
-- ============================================================
create table if not exists public.operation_prices (
  id               uuid primary key default gen_random_uuid(),
  lab_id           uuid not null references public.labs(id) on delete cascade,
  price_group_id   uuid references public.price_groups(id) on delete cascade,
  operation_id     uuid references public.lab_operations(id) on delete cascade,
  material_id      uuid references public.lab_materials(id) on delete set null,
  unit_price       numeric(12,2) not null default 0 check (unit_price >= 0),
  currency         text not null default 'IQD',
  effective_from   date not null default current_date,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists operation_prices_lab_idx on public.operation_prices (lab_id);
create index if not exists operation_prices_group_idx on public.operation_prices (price_group_id);
create index if not exists operation_prices_op_idx on public.operation_prices (operation_id);

-- ============================================================
-- 5. technician_operation_rates — internal cost rates per technician
-- ============================================================
create table if not exists public.technician_operation_rates (
  id               uuid primary key default gen_random_uuid(),
  lab_id           uuid not null references public.labs(id) on delete cascade,
  technician_id    uuid not null references public.technicians(id) on delete cascade,
  operation_id     uuid references public.lab_operations(id) on delete cascade,
  material_id      uuid references public.lab_materials(id) on delete set null,
  rate_type        text not null default 'per_unit'
                     check (rate_type in ('per_unit', 'fixed', 'hourly')),
  rate_amount      numeric(12,2) not null default 0 check (rate_amount >= 0),
  currency         text not null default 'IQD',
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists technician_rates_lab_idx on public.technician_operation_rates (lab_id);
create index if not exists technician_rates_tech_idx on public.technician_operation_rates (technician_id);

-- ============================================================
-- 6. portal_access_templates — per-lab portal configuration
-- ============================================================
create table if not exists public.portal_access_templates (
  id               uuid primary key default gen_random_uuid(),
  lab_id           uuid not null references public.labs(id) on delete cascade,
  name             text not null,
  role             text not null,
  description      text,
  permissions      jsonb not null default '{}'::jsonb,
  is_default       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists portal_access_lab_idx on public.portal_access_templates (lab_id);

-- ============================================================
-- 7. Extend case_items to optionally reference catalog
--    (nullable FKs — existing rows unaffected)
-- ============================================================
alter table public.case_items
  add column if not exists operation_id uuid references public.lab_operations(id) on delete set null,
  add column if not exists material_id  uuid references public.lab_materials(id)  on delete set null;

-- ============================================================
-- 8. Enable RLS on all new tables
-- ============================================================
alter table public.lab_operations         enable row level security;
alter table public.lab_materials          enable row level security;
alter table public.price_groups           enable row level security;
alter table public.operation_prices       enable row level security;
alter table public.technician_operation_rates enable row level security;
alter table public.portal_access_templates enable row level security;

-- ============================================================
-- 9. RLS policies
-- ============================================================

-- ── lab_operations ──────────────────────────────────────────
drop policy if exists lab_operations_select on public.lab_operations;
create policy lab_operations_select on public.lab_operations
  for select using (lab_id in (select public.current_lab_ids()));

drop policy if exists lab_operations_manage on public.lab_operations;
create policy lab_operations_manage on public.lab_operations
  for all using (
    public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
  );

-- ── lab_materials ────────────────────────────────────────────
drop policy if exists lab_materials_select on public.lab_materials;
create policy lab_materials_select on public.lab_materials
  for select using (lab_id in (select public.current_lab_ids()));

drop policy if exists lab_materials_manage on public.lab_materials;
create policy lab_materials_manage on public.lab_materials
  for all using (
    public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
  );

-- ── price_groups ─────────────────────────────────────────────
drop policy if exists price_groups_select on public.price_groups;
create policy price_groups_select on public.price_groups
  for select using (lab_id in (select public.current_lab_ids()));

drop policy if exists price_groups_manage on public.price_groups;
create policy price_groups_manage on public.price_groups
  for all using (
    public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
  );

-- ── operation_prices ─────────────────────────────────────────
drop policy if exists operation_prices_select on public.operation_prices;
create policy operation_prices_select on public.operation_prices
  for select using (lab_id in (select public.current_lab_ids()));

drop policy if exists operation_prices_manage on public.operation_prices;
create policy operation_prices_manage on public.operation_prices
  for all using (
    public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager','accountant']::public.app_role[])
  );

-- ── technician_operation_rates ───────────────────────────────
drop policy if exists technician_rates_select on public.technician_operation_rates;
create policy technician_rates_select on public.technician_operation_rates
  for select using (lab_id in (select public.current_lab_ids()));

drop policy if exists technician_rates_manage on public.technician_operation_rates;
create policy technician_rates_manage on public.technician_operation_rates
  for all using (
    public.has_lab_role(lab_id, array['super_admin','lab_owner','lab_manager']::public.app_role[])
  );

-- ── portal_access_templates ──────────────────────────────────
drop policy if exists portal_access_select on public.portal_access_templates;
create policy portal_access_select on public.portal_access_templates
  for select using (lab_id in (select public.current_lab_ids()));

drop policy if exists portal_access_manage on public.portal_access_templates;
create policy portal_access_manage on public.portal_access_templates
  for all using (
    public.has_lab_role(lab_id, array['super_admin','lab_owner']::public.app_role[])
  );

-- ============================================================
-- 10. Explicit grants for authenticated role
--     (ALTER DEFAULT PRIVILEGES in 0012 should cover this,
--      but explicit grants are safer and idempotent.)
-- ============================================================
grant select, insert, update, delete on
  public.lab_operations,
  public.lab_materials,
  public.price_groups,
  public.operation_prices,
  public.technician_operation_rates,
  public.portal_access_templates
to authenticated;
