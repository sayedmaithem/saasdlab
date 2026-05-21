alter type public.qc_result add value if not exists 'needs_adjustment';

alter type public.remake_responsibility add value if not exists 'lab_error';
alter type public.remake_responsibility add value if not exists 'doctor_error';
alter type public.remake_responsibility add value if not exists 'scan_issue';
alter type public.remake_responsibility add value if not exists 'patient_request';
alter type public.remake_responsibility add value if not exists 'shade_issue';
alter type public.remake_responsibility add value if not exists 'margin_issue';
alter type public.remake_responsibility add value if not exists 'fracture';
alter type public.remake_responsibility add value if not exists 'occlusion_issue';

alter table public.quality_checks
  add column if not exists previous_stage public.case_stage,
  add column if not exists completed_at timestamptz,
  add column if not exists checklist jsonb not null default '{}'::jsonb;

alter table public.remakes
  add column if not exists photo_file_ids jsonb not null default '[]'::jsonb;

create index if not exists quality_checks_lab_result_created_idx
on public.quality_checks (lab_id, result, created_at desc);

create index if not exists remakes_lab_created_idx
on public.remakes (lab_id, created_at desc);

create index if not exists remakes_lab_responsibility_idx
on public.remakes (lab_id, responsibility);
