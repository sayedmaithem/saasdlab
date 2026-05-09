-- LabFlow core cases and missing information engine fields.

alter type public.case_status add value if not exists 'active';
alter type public.case_status add value if not exists 'waiting_doctor_info';

alter table public.cases
  add column if not exists physical_impression_received boolean not null default false,
  add column if not exists preparation_photo_received boolean not null default false,
  add column if not exists implant_system text,
  add column if not exists scan_body_info text,
  add column if not exists bite_info text,
  add column if not exists arch text check (arch is null or arch in ('upper', 'lower', 'both')),
  add column if not exists complexity text not null default 'standard'
    check (complexity in ('simple', 'standard', 'complex'));

create index if not exists cases_lab_overdue_idx on public.cases (lab_id, due_date)
where status <> 'completed';

create index if not exists cases_lab_priority_score_idx on public.cases (lab_id, priority_score desc);
