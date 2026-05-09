-- LabFlow exocad design version workflow.

alter type public.design_status add value if not exists 'pending_review';
alter type public.design_status add value if not exists 'needs_changes';

alter table public.design_versions
  add column if not exists doctor_response text,
  add column if not exists approval_decided_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists design_versions_lab_status_idx
on public.design_versions (lab_id, status, created_at desc);

create index if not exists design_approvals_design_version_idx
on public.design_approvals (design_version_id, created_at desc);
