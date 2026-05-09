-- LabFlow production workflow controls for Kanban stage movement.

alter table public.case_stage_logs
  add column if not exists moved_by uuid references public.profiles(id) on delete set null,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists delay_reason text;

update public.case_stage_logs
set moved_by = coalesce(moved_by, changed_by)
where moved_by is null;

create index if not exists case_stage_logs_lab_case_created_idx
on public.case_stage_logs (lab_id, case_id, created_at desc);

create index if not exists tasks_lab_stage_status_idx
on public.tasks (lab_id, stage, status);

create index if not exists tasks_technician_status_idx
on public.tasks (technician_id, status);
